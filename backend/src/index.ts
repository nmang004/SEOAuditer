import 'module-alias/register';
import 'reflect-metadata';
import http from 'http';
import express, { Express, Request, Response } from 'express';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createClient } from 'redis';
import { PrismaClient } from '@prisma/client';
import { config } from './config/config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error.middleware';
import rateLimit from './middleware/rate-limit.middleware';
import { authRouter } from './routes/auth.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { projectRouter } from './routes/project.routes';
import { analysisRouter } from './routes/analysis.routes';
import crawlRouter from './routes/crawl.routes';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

// Initialize Express app
const app: Express = express();
const server = http.createServer(app);

// Initialize Redis client
export const redisClient = createClient({
  url: config.redis.url,
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

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info('Connected to Redis');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    // In development, continue without Redis but log the error
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Running without Redis. Rate limiting and caching will be disabled.');
    } else {
      process.exit(1);
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

// Initialize Prisma client
export const prisma = new PrismaClient({
  log: ['error', 'warn'],
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
const openApiSpec = YAML.load(__dirname + '/../docs/openapi.yaml');

// Serve Swagger UI
app.use('/api/docs', swaggerUi.serve as any, swaggerUi.setup(openApiSpec) as any);

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/projects', projectRouter);
app.use('/api/analyses', analysisRouter);
app.use('/api/crawl', crawlRouter);

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
    await redisClient.quit();
    logger.info('Redis client disconnected');
    
    // Close Prisma connection
    await prisma.$disconnect();
    logger.info('Prisma client disconnected');
    
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
const startServer = async () => {
  try {
    // Connect to Redis before starting the server
    await connectRedis();
    
    server.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`API Documentation: http://localhost:${config.port}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error | any) => {
  logger.error(`Unhandled Rejection: ${reason.message || reason}`);
  throw new Error(reason.message || reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

// Start the server
startServer();

export { app };
