import { Router, Request, Response } from 'express';
import { databaseManager } from '../config/database';
import { DatabaseService } from '../services/DatabaseService';
import { logger } from '../utils/logger';

const router = Router();
const dbService = new DatabaseService();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Basic health check
 *     description: Returns basic application health status
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Application is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Process uptime in seconds
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * @openapi
 * /health/detailed:
 *   get:
 *     summary: Detailed health check
 *     description: Returns comprehensive health status including database and system metrics
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Detailed health information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                     memory:
 *                       type: object
 *                     cpu:
 *                       type: object
 */
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Check database health
    const dbHealth = await checkDatabaseHealth();
    
    // System metrics
    const memoryUsage = process.memoryUsage();
    const systemMetrics = {
      memory: {
        used: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100, // MB
        total: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100, // MB
        external: Math.round((memoryUsage.external / 1024 / 1024) * 100) / 100, // MB
        rss: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100, // MB
      },
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
    };

    // Calculate response time
    const responseTime = Date.now() - startTime;

    const healthData = {
      status: dbHealth.isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      services: {
        database: dbHealth,
        system: systemMetrics,
      },
      environment: process.env.NODE_ENV || 'development',
    };

    const statusCode = dbHealth.isHealthy ? 200 : 503;
    res.status(statusCode).json(healthData);

  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @openapi
 * /health/database:
 *   get:
 *     summary: Database health and metrics
 *     description: Returns detailed database health status and performance metrics
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Database health information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 connection:
 *                   type: object
 *                 metrics:
 *                   type: object
 *                 performance:
 *                   type: object
 */
router.get('/database', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Database health
    const dbHealth = await checkDatabaseHealth();
    
    // Database metrics
    const dbMetrics = await dbService.getDatabaseMetrics();
    
    // Cache stats
    const cacheStats = await dbService.getCacheStats();
    
    // Performance metrics
    const queryTime = Date.now() - startTime;
    
    const healthData = {
      status: dbHealth.isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      connection: {
        isHealthy: dbHealth.isHealthy,
        responseTime: `${queryTime}ms`,
        lastChecked: new Date().toISOString(),
      },
      metrics: dbMetrics,
      cache: cacheStats,
      performance: {
        queryResponseTime: `${queryTime}ms`,
        connectionPool: {
          // These would be actual pool metrics in production
          active: 'N/A',
          idle: 'N/A',
          waiting: 'N/A',
        },
      },
    };

    const statusCode = dbHealth.isHealthy ? 200 : 503;
    res.status(statusCode).json(healthData);

  } catch (error) {
    logger.error('Database health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Database health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @openapi
 * /health/readiness:
 *   get:
 *     summary: Readiness probe
 *     description: Kubernetes-style readiness probe
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Service is ready to receive traffic
 *       503:
 *         description: Service is not ready
 */
router.get('/readiness', async (req: Request, res: Response) => {
  try {
    // Check if all critical services are ready
    const dbReady = await databaseManager.healthCheck();
    
    if (dbReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'ready',
        },
      });
    } else {
      throw new Error('Database not ready');
    }

  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Service not ready',
    });
  }
});

/**
 * @openapi
 * /health/liveness:
 *   get:
 *     summary: Liveness probe
 *     description: Kubernetes-style liveness probe
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Service is alive
 *       503:
 *         description: Service should be restarted
 */
router.get('/liveness', (req: Request, res: Response) => {
  // Simple liveness check - if we can respond, we're alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid,
  });
});

// Helper function to check database health
async function checkDatabaseHealth() {
  try {
    const startTime = Date.now();
    
    // Test basic connectivity
    const isHealthy = await databaseManager.healthCheck();
    const responseTime = Date.now() - startTime;
    
    if (!isHealthy) {
      throw new Error('Database connection failed');
    }

    // Test with a simple query
    const prisma = databaseManager.getPrisma();
    await prisma.$queryRaw`SELECT 1 as health_check`;

    return {
      isHealthy: true,
      responseTime: `${responseTime}ms`,
      status: 'connected',
      lastChecked: new Date().toISOString(),
    };

  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      isHealthy: false,
      responseTime: 'timeout',
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date().toISOString(),
    };
  }
}

export default router; 