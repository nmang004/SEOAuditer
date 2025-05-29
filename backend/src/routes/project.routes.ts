import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a new project
router.post(
  '/',
  rateLimit.api,
  validate('createProject'),
  projectController.createProject
);

// Get all projects for the current user
router.get(
  '/',
  rateLimit.api,
  validate('pagination'),
  projectController.getProjects
);

// Get project stats
router.get(
  '/stats',
  rateLimit.api,
  projectController.getProjectStats
);

// Get recent projects
router.get(
  '/recent',
  rateLimit.api,
  projectController.getRecentProjects
);

// Get a single project by ID
router.get(
  '/:id',
  rateLimit.api,
  // validate('getProject'),
  projectController.getProjectById
);

// Update a project
router.patch(
  '/:id',
  rateLimit.api,
  validate('updateProject'),
  projectController.updateProject
);

// Delete a project
router.delete(
  '/:id',
  rateLimit.api,
  // validate('deleteProject'),
  projectController.deleteProject
);

// Project analysis routes
router.use(
  '/:projectId/analyses',
  // validate('projectId'),
  // Analysis routes will be mounted here
);

export { router as projectRouter };
