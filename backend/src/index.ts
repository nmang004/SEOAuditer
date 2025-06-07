import 'module-alias/register';
import 'reflect-metadata';
console.log('--- Backend process starting ---');

import http from 'http';
console.log('--- http imported ---');
import express, { Express, Request, Response } from 'express';
console.log('--- express imported ---');
import { Server } from 'socket.io';
console.log('--- socket.io imported ---');
import cors from 'cors';
console.log('--- cors imported ---');
import helmet from 'helmet';
console.log('--- helmet imported ---');
import morgan from 'morgan';
console.log('--- morgan imported ---');
import { createClient } from 'redis';
console.log('--- redis imported ---');
import { databaseManager } from './config/database';
import { logger } from './utils/logger';
console.log('--- logger imported ---');
import { errorHandler } from './middleware/error.middleware';
console.log('--- errorHandler imported ---');
// import authRouter from './routes/auth.routes'; // DEPRECATED: Removed basic auth
import dashboardRouter from './routes/dashboard.routes';
import projectRouter from './routes/project.routes';
import analysisRouter from './routes/analysis.routes';
import crawlRouter from './routes/crawl.routes';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import enhancedAnalysisRoutes from './routes/enhanced-analysis.routes';
import healthRouter from './routes/health.router';
import authRS256Router from './routes/auth-rs256.routes';
import emailRouter from './routes/email.routes';
import secureTokenAuthRoutes from './routes/secure-token-auth.routes';
import bypassEmailRoutes from './routes/bypass-email.routes';
import adminRouter from './routes/admin.routes';

let config, redisConfig;
try {
  const configModule = require('./config/config');
  config = configModule.config;
  redisConfig = configModule.redisConfig;
  console.log('--- Config loaded successfully ---');
} catch (err) {
  console.error('FATAL ERROR loading config:', err);
  process.exit(1);
}

// Initialize Express app
const app: Express = express();

// Trust proxy for Railway deployment (enables proper IP detection behind proxies)
if (config.env === 'production') {
  // Trust proxy only for Railway's specific proxy setup
  app.set('trust proxy', 1); // Trust first proxy only (Railway's proxy)
  console.log('--- Trust proxy enabled for Railway deployment ---');
}

const server = http.createServer(app);
console.log('--- Express app and server initialized ---');

// Initialize Redis client - completely optional
console.log('--- Initializing Redis client ---');
export let redisClient: any = null;

if (redisConfig.url && !redisConfig.isOptional) {
  try {
    redisClient = createClient({
      url: redisConfig.url,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.log('Too many retries on Redis. Disabling Redis support.');
            return false; // Stop retrying
          }
          return Math.min(retries * 100, 2000);
        },
        connectTimeout: 5000, // 5 second timeout
      },
    });
    
    redisClient.on('error', (err: Error) => {
      console.warn('Redis Client Error (Redis disabled):', err.message);
      redisClient = null; // Disable Redis on error
    });
    
    console.log('--- Redis client initialized ---');
  } catch (error) {
    console.warn('Failed to initialize Redis client:', error);
    redisClient = null;
  }
} else {
  console.log('--- Redis disabled or not configured ---');
  if (redisConfig.isOptional) {
    logger.info('Redis is optional in production and not configured - running without Redis support');
  } else {
    logger.warn('Redis URL not provided, running without Redis support');
  }
}

// Remove the old prisma client initialization and replace with database manager
console.log('--- Initializing Database Manager ---');

const connectRedis = async (): Promise<void> => {
  if (!redisClient) {
    console.log('--- Redis client not configured, skipping connection ---');
    logger.info('Redis not configured - rate limiting and caching will use memory fallback');
    return;
  }

  const REDIS_TIMEOUT = 5000; // 5 seconds - shorter timeout
  try {
    console.log('--- Attempting Redis connection ---');
    
    // Add timeout wrapper for Redis connection
    const connectPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Redis connection timeout')), REDIS_TIMEOUT);
    });
    
    await Promise.race([connectPromise, timeoutPromise]);
    console.log('--- Redis connected successfully ---');
    logger.info('Connected to Redis');
  } catch (error) {
    console.warn('Failed to connect to Redis (will use memory fallback):', error);
    logger.warn('Failed to connect to Redis - using memory fallback for rate limiting and caching');
    
    // Disable Redis client on connection failure
    redisClient = null;
    
    // Don't throw error - just continue without Redis
    return;
  }
};

// Database initialization function with proper timeout and error handling
const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('--- Attempting database connection via Database Manager ---');
    await databaseManager.connect();
    console.log('--- Database Manager connected successfully ---');
  } catch (error) {
    console.error('Database initialization failed:', error);
    logger.error('Database initialization failed:', error);
    
    // Don't exit in development, but do in production
    if (config.env === 'production') {
      console.error('Exiting due to database connection failure in production');
      process.exit(1);
    } else {
      console.warn('Continuing without database in development mode');
    }
  }
};

// Initialize Socket.IO
export const io = new Server(server, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Apply middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: config.cors.origin,
  credentials: true,
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: config.env,
  });
});

// Load OpenAPI spec
let openApiSpec;
try {
  openApiSpec = YAML.load(__dirname + '/../docs/openapi.yaml');
  console.log('--- OpenAPI spec loaded successfully ---');
} catch (error) {
  console.error('Failed to load OpenAPI spec:', error);
  openApiSpec = { openapi: '3.0.3', info: { title: 'API', version: '1.0.0' }, paths: {} };
}

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve as any, swaggerUi.setup(openApiSpec) as any);

// API Routes - Using RS256 authentication system only
// app.use('/api/auth', authRouter); // DEPRECATED: Basic auth system disabled
app.use('/api/auth', authRS256Router); // Main authentication endpoint
app.use('/api/auth-rs256', authRS256Router); // Legacy endpoint support
app.use('/api/secure-auth', secureTokenAuthRoutes); // Secure token authentication system
app.use('/api/bypass', bypassEmailRoutes); // Bypass routes for testing
app.use('/api/dashboard', dashboardRouter);
app.use('/api/projects', projectRouter);
app.use('/api/analyses', analysisRouter);
app.use('/api/crawl', crawlRouter);
app.use('/api/enhanced-analysis', enhancedAnalysisRoutes);
app.use('/api/health', healthRouter);
app.use('/api/email', emailRouter);
app.use('/api/admin', adminRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 404,
      message: 'Not Found',
    },
  });
});

// Error handling middleware
app.use(errorHandler);

// Enhanced startServer with analysis system initialization
const startServer = async () => {
  console.log('--- startServer: BEGIN ---');
  try {
    // Connect to Redis before starting the server (with error handling)
    await connectRedis(); // This will handle errors internally and continue without Redis
    
    // Initialize database (with error handling)
    try {
      await initializeDatabase();
    } catch (dbError) {
      console.error('Database initialization failed:', dbError);
      logger.error('Database initialization failed:', dbError);
      
      if (config.env === 'production') {
        console.error('Exiting due to database failure in production');
        process.exit(1);
      } else {
        console.warn('Continuing without database in development mode');
      }
    }
    
    // Initialize Analysis System (skip if Redis/DB not available)
    try {
      const analysisSystemPath = './seo-crawler/enhanced-analysis-system';
      const analysisSystemModule = require(analysisSystemPath);
      if (analysisSystemModule.initializeAnalysisSystem) {
        await analysisSystemModule.initializeAnalysisSystem(server);
        logger.info('Analysis system initialized successfully');
      }
    } catch (error) {
      logger.warn('Analysis system initialization failed, continuing without it:', error);
      console.log('⚠️  Analysis system unavailable - SEO crawling features will be disabled');
    }
    
    server.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`API Documentation: http://localhost:${config.port}/api-docs`);
      
      
      console.log(`✅ Server started successfully on port ${config.port}`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n--- Received ${signal}, starting graceful shutdown ---`);
      logger.info(`Received ${signal}, starting graceful shutdown`);
      
      try {
        // Shutdown enhanced analysis system first
        const analysisSystemModule = require('./seo-crawler/enhanced-analysis-system');
        let analysisSystem = null;
        if (analysisSystemModule.getAnalysisSystem) {
          analysisSystem = analysisSystemModule.getAnalysisSystem();
        }
        if (analysisSystem && analysisSystem.isReady && analysisSystem.isReady()) {
          logger.info('Shutting down Enhanced Analysis System...');
          await analysisSystem.shutdown();
          logger.info('Enhanced Analysis System shutdown completed');
        }
      } catch (error) {
        logger.error('Error shutting down Enhanced Analysis System:', error);
      }

      // Close HTTP server
      server.close((err) => {
        if (err) {
          logger.error('Error closing HTTP server:', err);
          process.exit(1);
        }
        
        logger.info('HTTP server closed');
        console.log('✅ Server shutdown completed');
        process.exit(0);
      });

      // Force shutdown after timeout
      setTimeout(() => {
        logger.error('Forceful shutdown due to timeout');
        console.error('❌ Forceful shutdown due to timeout');
        process.exit(1);
      }, 10000); // 10 second timeout
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      logger.error('Uncaught exception:', error);
      console.error('❌ Uncaught exception:', error);
      await gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      console.error('❌ Unhandled rejection:', reason);
      await gracefulShutdown('UNHANDLED_REJECTION');
    });
    
  } catch (error) {
    console.error('--- startServer: FATAL ERROR ---', error);
    logger.error('Fatal error during server startup:', error);
    process.exit(1);
  }
};

// Call the enhanced analysis system initialization (using the function)
// initializeEnhancedAnalysisSystem().catch(console.error);

// Wrap startServer call in try-catch
(async () => {
  try {
    await startServer();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

console.log('--- After startServer() call ---');

// Handle unhandled promise rejections more gracefully
process.on('unhandledRejection', (reason: Error | any, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  logger.error(`Unhandled Rejection: ${reason.message || reason}`);
  
  // In production, exit gracefully
  if (config.env === 'production') {
    console.error('Unhandled rejection in production, exiting...');
    process.exit(1);
  } else {
    console.warn('Unhandled rejection in development, continuing...');
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error(`Uncaught Exception: ${error.message}`);
  logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on('exit', (code) => {
  console.error(`Process exiting with code: ${code}`);
  logger.error(`Process exiting with code: ${code}`);
});

export { app };
