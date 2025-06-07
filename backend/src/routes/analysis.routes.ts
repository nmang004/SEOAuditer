import express from 'express';
import { analysisController } from '../controllers/analysis.controller';
import { authenticateToken } from '../middleware/auth-rs256.middleware';
import { validate } from '../middleware/validation.middleware';
// import rateLimiters, { generalRateLimit } from '../middleware/rate-limit.middleware';

const router = express.Router();

// Apply authentication middleware to all routes (SECURITY: RS256 PROTECTION)
router.use(authenticateToken);

// Start a new analysis for a project
router.post(
  '/',
  // generalRateLimit,
  validate('createAnalysis'),
  analysisController.startAnalysis
);

// Get all analyses for a project
router.get(
  '/',
  // generalRateLimit,
  validate('getProjectAnalyses'),
  analysisController.getProjectAnalyses
);

// Get a specific analysis by ID
router.get(
  '/:analysisId',
  // generalRateLimit,
  validate('getAnalysis'),
  analysisController.getAnalysis
);

// Cancel an in-progress analysis
router.post(
  '/:analysisId/cancel',
  // generalRateLimit,
  validate('cancelAnalysis'),
  analysisController.cancelAnalysis
);

// Get issues for a specific analysis
router.get(
  '/:analysisId/issues',
  // generalRateLimit,
  validate('getAnalysisIssues'),
  analysisController.getAnalysisIssues
);

// Update issue status
router.patch(
  '/issues/:issueId',
  // generalRateLimit,
  validate('updateIssueStatus'),
  analysisController.updateIssueStatus
);

// Get trend data for a project
router.get(
  '/trends/:projectId',
  // generalRateLimit,
  analysisController.getProjectTrends
);

// Comment out the WebSocket endpoint for now to resolve type errors
// router.ws('/updates', (ws, req) => {
//   const { projectId, analysisId } = req.query;
//   
//   if (!projectId || !analysisId) {
//     ws.close(1008, 'Missing projectId or analysisId');
//     return;
//   }
//
//   // Handle WebSocket connection
//   ws.on('message', (message) => {
//     try {
//       const data = JSON.parse(message.toString());
//       // Handle different message types if needed
//       switch (data.type) {
//         case 'subscribe':
//           // Subscribe to analysis updates
//           ws.subscribe(`analysis:${analysisId}`);
//           break;
//         case 'unsubscribe':
//           // Unsubscribe from updates
//           ws.unsubscribe(`analysis:${analysisId}`);
//           break;
//         default:
//           // Handle other message types
//           break;
//       }
//     } catch (error) {
//       ws.send(JSON.stringify({
//         type: 'error',
//         message: 'Invalid message format',
//       }));
//     }
//   });
//
//   // Handle client disconnection
//   ws.on('close', () => {
//     // Clean up resources if needed
//   });
// });

export default router;
