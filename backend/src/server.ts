import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { config } from './config/config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logging.middleware';
import { enhancedWebSocketGateway } from './seo-crawler/ws/EnhancedWebSocketGateway';
import { EnhancedQueueAdapter } from './seo-crawler/queue/EnhancedQueueAdapter';
import { EnhancedWorker } from './seo-crawler/queue/EnhancedWorker';

// Import routes
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import analysisRoutes from './routes/analysis.routes';
import enhancedAnalysisRoutes from './routes/enhanced-analysis.routes';
import healthRoutes from './routes/health.routes';

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression and parsing
app.use(compression() as any);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check endpoint (before other routes)
app.use('/api/health', healthRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/enhanced-analysis', enhancedAnalysisRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'SEO Analysis API',
    version: '2.0.0',
    status: 'healthy',
    features: ['real-time-analysis', 'websocket-updates', 'queue-management'],
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      projects: '/api/projects',
      analysis: '/api/analysis',
      enhancedAnalysis: '/api/enhanced-analysis',
      websocket: '/socket.io'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

async function startServer() {
  try {
    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize enhanced queue system
    logger.info('🔄 Initializing enhanced queue system...');
    const queueAdapter = new EnhancedQueueAdapter();
    const worker = new EnhancedWorker(queueAdapter);

    // Initialize enhanced WebSocket gateway
    logger.info('🔌 Initializing enhanced WebSocket gateway...');
    await enhancedWebSocketGateway.initialize(httpServer);

    // Store instances for graceful shutdown
    app.locals.queueAdapter = queueAdapter;
    app.locals.worker = worker;
    app.locals.webSocketGateway = enhancedWebSocketGateway;

    // Enhanced health check endpoint with WebSocket and queue status
    app.get('/api/health/detailed', (req, res) => {
      const isHealthy = queueAdapter.isHealthy() && enhancedWebSocketGateway.isHealthy();
      const connectionStats = enhancedWebSocketGateway.getConnectionStats();
      
      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        services: {
          queue: {
            healthy: queueAdapter.isHealthy(),
            metrics: queueAdapter.getMetrics ? queueAdapter.getMetrics() : null
          },
          websocket: {
            healthy: enhancedWebSocketGateway.isHealthy(),
            connections: connectionStats
          },
          database: true, // Add proper database health check if needed
        },
        realTimeFeatures: {
          progressTracking: true,
          connectionRecovery: true,
          fallbackPolling: true,
          maxConcurrentConnections: 50
        },
        performance: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage()
        }
      });
    });

    // WebSocket connection metrics endpoint
    app.get('/api/websocket/stats', (req, res) => {
      const stats = enhancedWebSocketGateway.getConnectionStats();
      res.json({
        timestamp: new Date().toISOString(),
        ...stats
      });
    });

    const PORT = config.server.port;
    
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Enhanced server running on port ${PORT}`);
      logger.info(`📊 Real-time analysis tracking enabled`);
      logger.info(`🔗 WebSocket endpoint: ws://localhost:${PORT}/socket.io`);
      logger.info(`📈 Health check: http://localhost:${PORT}/api/health`);
      logger.info(`📋 Detailed health: http://localhost:${PORT}/api/health/detailed`);
      logger.info(`🌐 API Documentation: http://localhost:${PORT}/api`);
      logger.info(`⚡ Features: Real-time updates, Queue management, Fallback polling`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      logger.info(`${signal} signal received. Starting graceful shutdown...`);

      // Close HTTP server first
      httpServer.close(() => {
        logger.info('HTTP server closed');
      });

      try {
        // Shutdown WebSocket gateway
        if (enhancedWebSocketGateway) {
          logger.info('Shutting down WebSocket gateway...');
          await enhancedWebSocketGateway.shutdown();
        }

        // Shutdown queue and worker
        if (worker) {
          logger.info('Shutting down worker...');
          await worker.shutdown();
        }

        if (queueAdapter) {
          logger.info('Shutting down queue adapter...');
          await queueAdapter.shutdown();
        }

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app; 