import { Request, Response, NextFunction } from 'express';
import { prisma } from '..';
import { NotFoundError } from '../middleware/error.middleware';

// Project Controller
// Handles project CRUD, stats, and recent projects
// All endpoints must use correct Prisma model accessors and field names
// All select statements must only reference fields that exist in the Prisma schema
// All endpoints should be protected with JWT middleware
// TODO: Add input validation middleware (zod) for query/params
// TODO: Add more granular error handling and logging for production

export const projectController = {
  // Create a new project
  async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, url, scanFrequency = 'manual' } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      // Create project
      const project = await prisma.project.create({
        data: {
          userId,
          name,
          url,
          scanFrequency,
        },
        select: {
          id: true,
          name: true,
          url: true,
          status: true,
          scanFrequency: true,
          currentScore: true,
          issueCount: true,
          lastScanDate: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Emit project created event
      req.io.emit('project:created', { project });

      res.status(201).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all projects for the current user
  async getProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { search, status, sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;

      // Build where clause
      const where: any = { userId };

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { url: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      if (status) {
        where.status = status;
      }

      // Get projects with pagination
      const projects = await prisma.project.findMany({
        where,
        select: {
          id: true,
          name: true,
          url: true,
          status: true,
          scanFrequency: true,
          currentScore: true,
          issueCount: true,
          lastScanDate: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          [sortBy as string]: sortOrder,
        },
      });

      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get project by ID
  async getProjectById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const project = await prisma.project.findFirst({
        where: {
          id,
          userId,
        },
        select: {
          id: true,
          name: true,
          url: true,
          status: true,
          scanFrequency: true,
          currentScore: true,
          issueCount: true,
          lastScanDate: true,
          faviconUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!project) {
        throw new NotFoundError('Project not found');
      }

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  },

  // Update project
  async updateProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { name, url, scanFrequency, status } = req.body;

      // Check if project exists and belongs to user
      const existingProject = await prisma.project.findFirst({
        where: { id, userId },
      });

      if (!existingProject) {
        throw new NotFoundError('Project not found');
      }

      // Update project
      const updatedProject = await prisma.project.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(url && { url }),
          ...(scanFrequency && { scanFrequency }),
          ...(status && { status }),
        },
        select: {
          id: true,
          name: true,
          url: true,
          status: true,
          scanFrequency: true,
          currentScore: true,
          issueCount: true,
          lastScanDate: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Emit project updated event
      req.io.emit('project:updated', { project: updatedProject });

      res.json({
        success: true,
        data: updatedProject,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete project
  async deleteProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Check if project exists and belongs to user
      const project = await prisma.project.findFirst({
        where: { id, userId },
      });

      if (!project) {
        throw new NotFoundError('Project not found');
      }

      // Delete project (cascading deletes will handle related records)
      await prisma.project.delete({
        where: { id },
      });

      // Emit project deleted event
      req.io.emit('project:deleted', { projectId: id });

      res.json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Get project statistics
  async getProjectStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      const [
        totalProjects,
        activeProjects,
        completedScans,
        criticalIssues,
      ] = await Promise.all([
        prisma.project.count({ where: { userId } }),
        prisma.project.count({ where: { userId, status: 'active' } }),
        prisma.crawlSession.count({
          where: {
            project: { userId },
            status: 'completed',
          },
        }),
        prisma.sEOIssue.count({
          where: {
            analysis: {
              crawlSession: {
                project: { userId },
              },
            },
            severity: 'critical',
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          totalProjects,
          activeProjects,
          completedScans,
          criticalIssues,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Get recent projects
  async getRecentProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const limit = parseInt(req.query.limit as string) || 5;

      const projects = await prisma.project.findMany({
        where: { userId },
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          url: true,
          status: true,
          currentScore: true,
          issueCount: true,
          lastScanDate: true,
          updatedAt: true,
        },
      });

      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  },
};
