import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { analysisController } from '../controllers/analysis.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// All project routes require authentication
router.use(authenticate);

// Create a new project
router.post(
  '/',
  validate('createProject'),
  projectController.createProject
);

// List all projects for the authenticated user
router.get(
  '/',
  projectController.getProjects
);

// Get a single project by ID
router.get(
  '/:id',
  projectController.getProjectById
);

// Update a project
router.put(
  '/:id',
  validate('updateProject'),
  projectController.updateProject
);

// Delete a project
router.delete(
  '/:id',
  projectController.deleteProject
);

// Get analyses for a project
router.get(
  '/:projectId/analyses',
  rateLimit.api,
  validate('getProjectAnalyses'),
  analysisController.getProjectAnalyses
);

export { router as projectRouter };
