import { Router } from 'express';
import { EnhancedAnalysisController } from '../controllers/enhanced-analysis.controller';
import { authenticate as authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';
import { z } from 'zod';

const router = Router();
const controller = new EnhancedAnalysisController();

// Validation schemas
const startAnalysisSchema = z.object({
  body: z.object({
    projectId: z.string().uuid('Invalid project ID format'),
    priority: z.number().min(0).max(10).optional(),
    timeout: z.number().min(30000).max(600000).optional(),
    extractOptions: z.object({
      screenshots: z.boolean().optional(),
      performanceMetrics: z.boolean().optional(),
      fullPageScreenshot: z.boolean().optional(),
    }).optional(),
  }),
});

const bulkAnalysisSchema = z.object({
  body: z.object({
    projectIds: z.array(z.string().uuid()).min(1).max(10),
    priority: z.number().min(0).max(10).optional(),
    timeout: z.number().min(30000).max(600000).optional(),
    extractOptions: z.object({
      screenshots: z.boolean().optional(),
      performanceMetrics: z.boolean().optional(),
    }).optional(),
  }),
});

const paginationSchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    offset: z.string().regex(/^\d+$/).transform(Number).optional(),
    status: z.enum(['queued', 'running', 'completed', 'failed', 'cancelled']).optional(),
  }),
});

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route POST /api/enhanced-analysis/start
 * @desc Start a new SEO analysis
 * @access Private
 */
router.post(
  '/start',
  rateLimitMiddleware({ windowMs: 60000, max: 10 }), // 10 requests per minute
  validateRequest(startAnalysisSchema),
  async (req, res) => {
    await controller.startAnalysis(req, res);
  }
);

/**
 * @route POST /api/enhanced-analysis/bulk
 * @desc Start bulk SEO analysis for multiple projects
 * @access Private
 */
router.post(
  '/bulk',
  rateLimitMiddleware({ windowMs: 300000, max: 3 }), // 3 requests per 5 minutes
  validateRequest(bulkAnalysisSchema),
  async (req, res) => {
    await controller.startBulkAnalysis(req, res);
  }
);

/**
 * @route GET /api/enhanced-analysis/:jobId/status
 * @desc Get analysis job status and progress
 * @access Private
 */
router.get(
  '/:jobId/status',
  rateLimitMiddleware({ windowMs: 60000, max: 60 }), // 60 requests per minute
  async (req, res) => {
    await controller.getAnalysisStatus(req, res);
  }
);

/**
 * @route DELETE /api/enhanced-analysis/:jobId/cancel
 * @desc Cancel an active analysis job
 * @access Private
 */
router.delete(
  '/:jobId/cancel',
  rateLimitMiddleware({ windowMs: 60000, max: 10 }), // 10 requests per minute
  async (req, res) => {
    await controller.cancelAnalysis(req, res);
  }
);

/**
 * @route POST /api/enhanced-analysis/:jobId/retry
 * @desc Retry a failed analysis job
 * @access Private
 */
router.post(
  '/:jobId/retry',
  rateLimitMiddleware({ windowMs: 60000, max: 5 }), // 5 requests per minute
  async (req, res) => {
    await controller.retryAnalysis(req, res);
  }
);

/**
 * @route GET /api/enhanced-analysis/queue/metrics
 * @desc Get queue metrics and system health
 * @access Private
 */
router.get(
  '/queue/metrics',
  rateLimitMiddleware({ windowMs: 60000, max: 30 }), // 30 requests per minute
  async (req, res) => {
    await controller.getQueueMetrics(req, res);
  }
);

/**
 * @route GET /api/enhanced-analysis/user/analyses
 * @desc Get user's recent analyses with pagination
 * @access Private
 */
router.get(
  '/user/analyses',
  rateLimitMiddleware({ windowMs: 60000, max: 30 }), // 30 requests per minute
  validateRequest(paginationSchema),
  async (req, res) => {
    await controller.getUserAnalyses(req, res);
  }
);

/**
 * @route GET /api/enhanced-analysis/health
 * @desc Get system health status
 * @access Private
 */
router.get(
  '/health',
  async (req, res) => {
    try {
      const healthCheck = await controller['queueAdapter'].healthCheck();
      res.json({
        status: healthCheck.status === 'healthy' ? 'healthy' : 'unhealthy',
        timestamp: new Date(),
        details: healthCheck.details,
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export default router; 