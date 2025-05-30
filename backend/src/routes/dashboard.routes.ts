import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
// import { authenticate } from '../middleware/auth.middleware';
// import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// Apply authentication middleware to all routes (temporarily disabled for testing)
// router.use(authenticate);

// Dashboard statistics
router.get(
  '/stats',
  rateLimit.api,
  dashboardController.getStats
);

// Test endpoint without any middleware
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Dashboard route test working',
    timestamp: new Date().toISOString()
  });
});

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

// Recent activity
router.get(
  '/recent-activity',
  rateLimit.api,
  dashboardController.getRecentActivity
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
