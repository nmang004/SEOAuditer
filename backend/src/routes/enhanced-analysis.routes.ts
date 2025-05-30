import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { TrendAnalysisService } from '../services/TrendAnalysisService';

const router = Router();
const trendAnalysisService = new TrendAnalysisService();

/**
 * GET /api/enhanced-analysis/trends/:projectId/:period
 * Retrieve historical trend data for a project
 */
router.get('/trends/:projectId/:period', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, period } = req.params;
    
    // Validate period
    const validPeriods = ['7d', '30d', '90d', '1y'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid period. Must be one of: 7d, 30d, 90d, 1y' }
      });
    }

    const trendData = await trendAnalysisService.getTrends(projectId, period as any);
    
    res.json({
      success: true,
      data: trendData
    });
  } catch (error) {
    console.error('Trend analysis error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * GET /api/enhanced-analysis/regressions/:projectId
 * Get detected performance regressions for a project
 */
router.get('/regressions/:projectId', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    
    const regressions = await trendAnalysisService.detectRegressions(projectId);
    
    res.json({
      success: true,
      data: regressions
    });
  } catch (error) {
    console.error('Regression detection error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * GET /api/enhanced-analysis/predictions/:projectId
 * Get performance predictions for a project
 */
router.get('/predictions/:projectId', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const timeframe = req.query.timeframe as string || '1m';
    
    const predictions = await trendAnalysisService.getPredictions(projectId, timeframe as any);
    
    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * GET /api/enhanced-analysis/trend-score/:projectId
 * Get trend score for a project
 */
router.get('/trend-score/:projectId', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const period = req.query.period as string || '30d';
    
    const trendScore = await trendAnalysisService.getTrendScore(projectId, period as any);
    
    res.json({
      success: true,
      data: trendScore
    });
  } catch (error) {
    console.error('Trend score error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

export { router as enhancedAnalysisRouter }; 