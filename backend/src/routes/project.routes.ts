import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { analysisController } from '../controllers/analysis.controller';
import { generalRateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// All project routes require authentication
// router.use(authenticate);

// Create a new project
router.post(
  '/',
  // validate('createProject'),
  generalRateLimit,
  projectController.createProject
);

// List all projects for the authenticated user
router.get(
  '/',
  generalRateLimit,
  // validate('getProjects'),
  projectController.getProjects
);

// Get a single project by ID
router.get(
  '/:id',
  generalRateLimit,
  // validate('getProject'),
  projectController.getProjectById
);

// Update a project
router.put(
  '/:id',
  generalRateLimit,
  // validate('updateProject'),
  projectController.updateProject
);

// Delete a project
router.delete(
  '/:id',
  generalRateLimit,
  // validate('deleteProject'),
  projectController.deleteProject
);

// Get analyses for a project
router.get(
  '/:projectId/analyses',
  generalRateLimit,
  // validate('getProjectAnalyses'),
  analysisController.getProjectAnalyses
);

// Test endpoint without any middleware
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Project route test working',
    timestamp: new Date().toISOString()
  });
});

export default router;
