import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
// import { authenticate } from '../middleware/auth.middleware';
// import { validate } from '../middleware/validation.middleware';
import { generalRateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// Apply authentication middleware to all routes (temporarily disabled for testing)
// router.use(authenticate);

// Dashboard statistics
router.get(
  '/stats',
  generalRateLimit,
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
  generalRateLimit,
  dashboardController.getRecentProjects
);

// Latest priority issues
router.get(
  '/latest-issues',
  generalRateLimit,
  dashboardController.getLatestIssues
);

// Recent activity
router.get(
  '/recent-activity',
  generalRateLimit,
  dashboardController.getRecentActivity
);

// Performance trends over time
router.get(
  '/performance-trends',
  generalRateLimit,
  dashboardController.getPerformanceTrends
);

// Legacy endpoints (kept for backward compatibility)
// router.get('/overview', generalRateLimit, dashboardController.getOverview);
// validate('getPerformanceMetrics'),
// validate('getIssuesSummary'),
// router.get('/project-comparison', generalRateLimit, dashboardController.getProjectComparison);
// router.get('/recommendations', generalRateLimit, dashboardController.getRecommendations);

export default router;
