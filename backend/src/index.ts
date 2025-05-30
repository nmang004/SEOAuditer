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
import { PrismaClient } from '@prisma/client';
console.log('--- PrismaClient imported ---');
import { logger } from './utils/logger';
console.log('--- logger imported ---');
import { errorHandler } from './middleware/error.middleware';
console.log('--- errorHandler imported ---');
import rateLimit from './middleware/rate-limit.middleware';
console.log('--- rateLimit imported ---');
import { authRouter } from './routes/auth.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { projectRouter } from './routes/project.routes';
import { analysisRouter } from './routes/analysis.routes';
import crawlRouter from './routes/crawl.routes';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { enhancedAnalysisRouter } from './routes/enhanced-analysis.routes';

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
const server = http.createServer(app);
console.log('--- Express app and server initialized ---');

// Initialize Redis client
console.log('--- Initializing Redis client ---');
export const redisClient = createClient({
  url: redisConfig.url,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        console.log('Too many retries on Redis. Connection Terminated');
        return new Error('Could not connect to Redis after 5 retries');
      }
      return Math.min(retries * 100, 5000);
    },
  },
});
redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});
console.log('--- Redis client initialized ---');

const connectRedis = async (): Promise<void> => {
  const REDIS_TIMEOUT = 10000; // 10 seconds
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
    console.error('Failed to connect to Redis:', error);
    logger.error('Failed to connect to Redis:', error);
    
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Running without Redis. Rate limiting and caching will be disabled.');
    } else {
      logger.error('Failed to connect to Redis in production. Continuing anyway...');
    }
    
    // Re-throw error so it can be caught in startServer
    throw error;
  }
};

console.log('--- Initializing Prisma client ---');
export const prisma = new PrismaClient({ 
  log: ['error', 'warn']
});
console.log('--- Prisma client initialized ---');

// Database initialization function with proper timeout and error handling
const initializeDatabase = async (): Promise<void> => {
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 5000; // 5 seconds
  const CONNECTION_TIMEOUT = 30000; // 30 seconds
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`--- Attempting database connection (attempt ${attempt}/${MAX_RETRIES}) ---`);
      
      // Add connection timeout wrapper
      const connectionPromise = prisma.$connect();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database connection timeout')), CONNECTION_TIMEOUT);
      });
      
      await Promise.race([connectionPromise, timeoutPromise]);
      console.log('--- Database connected successfully ---');
      
      // Test database with a simple query with timeout
      console.log('--- Testing database with query ---');
      const testQueryPromise = prisma.$queryRaw`SELECT 1 as test`;
      const testTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database test query timeout')), 10000);
      });
      
      await Promise.race([testQueryPromise, testTimeoutPromise]);
      console.log('--- Database test query successful ---');
      
      // Run migrations if in production
      if (config.env === 'production') {
        console.log('--- Running Prisma migrations ---');
        try {
          const { execSync } = await import('child_process');
          execSync('npx prisma migrate deploy', { 
            stdio: 'inherit',
            timeout: 60000, // 60 seconds timeout
            env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
          });
          console.log('--- Prisma migrations completed ---');
        } catch (migrationError) {
          console.error('Migration failed:', migrationError);
          logger.error('Migration failed:', migrationError);
          
          // Check if it's just because migrations are already applied
          try {
            await prisma.$queryRaw`SELECT 1`;
            console.log('--- Database is accessible, continuing without migrations ---');
          } catch (dbError) {
            throw new Error(`Database migration and connection both failed: ${migrationError}`);
          }
        }
      }
      
      // If we get here, connection is successful
      return;
      
    } catch (error) {
      console.error(`Database connection attempt ${attempt} failed:`, error);
      logger.error(`Database connection attempt ${attempt} failed:`, error);
      
      if (attempt === MAX_RETRIES) {
        // Last attempt failed
        console.error('All database connection attempts failed');
        
        // Try to disconnect cleanly
        try {
          await prisma.$disconnect();
        } catch (disconnectError) {
          console.error('Failed to disconnect from database:', disconnectError);
        }
        
        // Don't exit in development, but do in production
        if (config.env === 'production') {
          console.error('Exiting due to database connection failure in production');
          process.exit(1);
        } else {
          console.warn('Continuing without database in development mode');
          return;
        }
      } else {
        // Wait before retrying
        console.log(`--- Waiting ${RETRY_DELAY}ms before retry ---`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
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

// Apply rate limiting
app.use(rateLimit.api);

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

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/projects', projectRouter);
app.use('/api/analyses', analysisRouter);
app.use('/api/crawl', crawlRouter);
app.use('/api/enhanced-analysis', enhancedAnalysisRouter);

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

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  /**
   * Event: join:project
   * Payload: projectId (string)
   * Joins the client to a project-specific room for real-time updates.
   */
  socket.on('join:project', (projectId: string) => {
    socket.join(`project:${projectId}`);
    logger.info(`Socket ${socket.id} joined project:${projectId}`);
  });

  /**
   * Event: join:user
   * Payload: userId (string)
   * Joins the client to a user-specific room for notifications.
   */
  socket.on('join:user', (userId: string) => {
    socket.join(`user:${userId}`);
    logger.info(`Socket ${socket.id} joined user:${userId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down server...');
  
  // Close HTTP server
  server.close(async () => {
    logger.info('HTTP server closed');
    
    // Close Redis connection
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis client disconnected');
    }
    
    // Close Prisma connection
    await prisma.$disconnect();
    logger.info('Prisma client disconnected');
    
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server with proper error handling
const startServer = async () => {
  console.log('--- startServer: BEGIN ---');
  try {
    // Connect to Redis before starting the server (with error handling)
    try {
      await connectRedis();
    } catch (redisError) {
      console.warn('Redis connection failed, continuing without Redis:', redisError);
      logger.warn('Redis connection failed, continuing without Redis:', redisError);
    }
    
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
    
    server.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`API Documentation: http://localhost:${config.port}/api-docs`);
      console.log(`✅ Server started successfully on port ${config.port}`);
    });
    
    server.on('error', (error: any) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof config.port === 'string'
        ? 'Pipe ' + config.port
        : 'Port ' + config.port;

      // Handle specific listen errors with friendly messages
      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          console.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          console.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          logger.error('Server error:', error);
          console.error('Server error:', error);
          throw error;
      }
    });
    
    console.log('--- startServer: END (server.listen called) ---');
  } catch (error) {
    console.error('FATAL ERROR in startServer:', error);
    logger.error('FATAL ERROR in startServer:', error);
    process.exit(1);
  }
};

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
