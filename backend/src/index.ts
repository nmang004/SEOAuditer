import 'module-alias/register';
import 'reflect-metadata';
import http from 'http';
import express, { Express, Request, Response, NextFunction } from 'express';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createClient } from 'redis';
import { PrismaClient } from '@prisma/client';
import { config } from './config/config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error.middleware';
import { rateLimiter } from './middleware/rate-limit.middleware';
import { authRouter } from './routes/auth.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { projectRouter } from './routes/project.routes';
import { analysisRouter } from './routes/analysis.routes';

// Initialize Express app
const app: Express = express();
const server = http.createServer(app);

// Initialize Redis client
export const redisClient = createClient({
  url: config.redis.url,
});

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

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: config.env,
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/projects', projectRouter);
app.use('/api/analyses', analysisRouter);

// 404 handler
app.use((req: Request, res: Response) => {
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

  // Join room for specific project updates
  socket.on('join:project', (projectId: string) => {
    socket.join(`project:${projectId}`);
    logger.info(`Socket ${socket.id} joined project:${projectId}`);
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
    // Connect to Redis
    await redisClient.connect();
    logger.info('Redis client connected');
    
    // Start listening
    server.listen(config.port, () => {
      logger.info(`Server running in ${config.env} mode on port ${config.port}`);
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
