import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logging.middleware';

// Import only essential routes
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Health check endpoint (before other routes)
app.use('/api/health', healthRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'SEO Analysis API (Minimal Mode)',
    version: '2.0.0',
    status: 'healthy',
    features: ['authentication', 'basic-auth'],
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      projects: '/api/projects'
    }
  });
});

// Health check without dependencies
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: config.env,
    mode: 'minimal'
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

const PORT = config.server.port;

app.listen(PORT, () => {
  logger.info(`🚀 Minimal server running on port ${PORT}`);
  logger.info(`📈 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔑 Auth endpoints: http://localhost:${PORT}/api/auth`);
  logger.info(`⚡ Mode: Minimal (Redis-free)`);
  console.log(`✅ Server started successfully on port ${PORT}`);
});

export default app;