import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
// import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Dashboard statistics
router.get(
  '/stats',
  rateLimit.api,
  dashboardController.getStats
);

// Recent projects with scores and trends
router.get(
  '/recent-projects',
  rateLimit.api,
  dashboardController.getRecentProjects
);

// Latest priority issues
router.get(
  '/latest-issues',
  rateLimit.api,
  dashboardController.getLatestIssues
);

// Performance trends over time
router.get(
  '/performance-trends',
  rateLimit.api,
  dashboardController.getPerformanceTrends
);

// Legacy endpoints (kept for backward compatibility)
// router.get('/overview', rateLimit.api, dashboardController.getOverview);
// validate('getPerformanceMetrics'),
// validate('getIssuesSummary'),
// router.get('/project-comparison', rateLimit.api, dashboardController.getProjectComparison);
// router.get('/recommendations', rateLimit.api, dashboardController.getRecommendations);

export { router as dashboardRouter };
