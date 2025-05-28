import { Router } from 'express';
import { analysisController } from '../controllers/analysis.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Start a new analysis for a project
router.post(
  '/',
  rateLimit.api,
  validate('startAnalysis'),
  analysisController.startAnalysis
);

// Get all analyses for a project
router.get(
  '/',
  rateLimit.api,
  validate('getProjectAnalyses'),
  analysisController.getProjectAnalyses
);

// Get a specific analysis by ID
router.get(
  '/:analysisId',
  rateLimit.api,
  validate('getAnalysis'),
  analysisController.getAnalysis
);

// Cancel an in-progress analysis
router.post(
  '/:analysisId/cancel',
  rateLimit.api,
  validate('cancelAnalysis'),
  analysisController.cancelAnalysis
);

// Get issues for a specific analysis
router.get(
  '/:analysisId/issues',
  rateLimit.api,
  validate('getAnalysisIssues'),
  analysisController.getAnalysisIssues
);

// Update issue status
router.patch(
  '/issues/:issueId',
  rateLimit.api,
  validate('updateIssueStatus'),
  analysisController.updateIssueStatus
);

// WebSocket endpoint for real-time updates
router.ws('/updates', (ws, req) => {
  const { projectId, analysisId } = req.query;
  
  if (!projectId || !analysisId) {
    ws.close(1008, 'Missing projectId or analysisId');
    return;
  }

  // Handle WebSocket connection
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Handle different message types if needed
      switch (data.type) {
        case 'subscribe':
          // Subscribe to analysis updates
          ws.subscribe(`analysis:${analysisId}`);
          break;
        case 'unsubscribe':
          // Unsubscribe from updates
          ws.unsubscribe(`analysis:${analysisId}`);
          break;
        default:
          // Handle other message types
          break;
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
      }));
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    // Clean up resources if needed
  });
});

export { router as analysisRouter };
