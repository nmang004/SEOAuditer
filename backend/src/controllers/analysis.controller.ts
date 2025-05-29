import { Request, Response, NextFunction } from 'express';
import { prisma } from '..';
import { 
  NotFoundError, 
  BadRequestError
} from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import { cache } from '../utils/cache';

// Analysis Controller
// Handles starting, retrieving, listing, and cancelling analyses, as well as issue management
// All endpoints must use correct Prisma model accessors and field names
// All select statements must only reference fields that exist in the Prisma schema
// All endpoints should be protected with JWT middleware
// TODO: Add input validation middleware (zod) for query/params
// TODO: Add more granular error handling and logging for production
// TODO: Implement actual SEO analysis logic in runAnalysisInBackground

export const analysisController = {
  // Start a new analysis for a project
  async startAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;

      // Check if project exists and belongs to user
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
      });

      if (!project) {
        throw new NotFoundError('Project not found');
      }

      // Check if there's already an active analysis
      const activeAnalysis = await prisma.crawlSession.findFirst({
        where: {
          projectId,
          status: { in: ['pending', 'in_progress'] },
        },
      });

      if (activeAnalysis) {
        throw new BadRequestError('An analysis is already in progress for this project');
      }

      // Create a new crawl session
      const crawlSession = await prisma.crawlSession.create({
        data: {
          projectId,
          url: project.url,
          status: 'pending',
          startedAt: new Date(),
        },
        select: {
          id: true,
          status: true,
          startedAt: true,
        },
      });

      // Update project's last scan date
      await prisma.project.update({
        where: { id: projectId },
        data: { lastScanDate: new Date() },
      });

      // Emit analysis started event
      req.io.to(`project:${projectId}`).emit('analysis:started', { 
        projectId,
        analysis: crawlSession 
      });

      // Start analysis in background
      this.runAnalysisInBackground(crawlSession.id, project, req.io);

      res.status(202).json({
        success: true,
        data: {
          analysisId: crawlSession.id,
          status: crawlSession.status,
          startedAt: crawlSession.startedAt,
        },
        message: 'Analysis started',
      });
    } catch (error) {
      next(error);
    }
  },

  // Get analysis by ID
  async getAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { analysisId } = req.params;
      const userId = req.user?.id;

      const cacheKey = `analysis:${analysisId}`;
      const cached = await cache.get<any>(cacheKey);
      if (cached) {
        res.json({ success: true, data: cached, cached: true });
        return;
      }

      const analysis = await prisma.crawlSession.findFirst({
        where: {
          id: analysisId,
          project: { userId },
        },
        include: {
          analysis: {
            select: {
              id: true,
              overallScore: true,
              technicalScore: true,
              contentScore: true,
              onpageScore: true,
              uxScore: true,
              issues: {
                select: {
                  id: true,
                  type: true,
                  severity: true,
                  status: true,
                  createdAt: true,
                },
                orderBy: { severity: 'desc' },
                take: 50,
              },
              metaTags: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      if (!analysis) {
        throw new NotFoundError('Analysis not found');
      }

      await cache.set(cacheKey, analysis, 3600);

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all analyses for a project
  async getProjectAnalyses(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;
      const { 
        status, 
        limit = '10', 
        offset = '0' 
      } = req.query;

      // Check if project exists and belongs to user
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
      });

      if (!project) {
        throw new NotFoundError('Project not found');
      }

      // Build where clause
      const where: any = { projectId };
      if (status) where.status = status;

      // Get paginated analyses
      const [analyses, total] = await Promise.all([
        prisma.crawlSession.findMany({
          where,
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            analysis: {
              select: {
                overallScore: true,
              },
            },
          },
          orderBy: { startedAt: 'desc' },
          take: parseInt(limit as string, 10),
          skip: parseInt(offset as string, 10),
        }),
        prisma.crawlSession.count({ where }),
      ]);

      res.json({
        success: true,
        data: analyses,
        meta: {
          total,
          limit: parseInt(limit as string, 10),
          offset: parseInt(offset as string, 10),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Cancel an in-progress analysis
  async cancelAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { analysisId } = req.params;
      const userId = req.user?.id;

      // Find analysis and check permissions
      const analysis = await prisma.crawlSession.findFirst({
        where: {
          id: analysisId,
          project: { userId },
          status: { in: ['pending', 'in_progress'] },
        },
      });

      if (!analysis) {
        throw new NotFoundError('Analysis not found or cannot be cancelled');
      }

      // Update analysis status
      const updatedAnalysis = await prisma.crawlSession.update({
        where: { id: analysisId },
        data: { 
          status: 'cancelled',
          completedAt: new Date(),
        },
        select: {
          id: true,
          status: true,
          startedAt: true,
          completedAt: true,
        },
      });

      // Emit analysis cancelled event
      req.io.to(`project:${analysis.projectId}`).emit('analysis:cancelled', { 
        projectId: analysis.projectId,
        analysis: updatedAnalysis 
      });

      res.json({
        success: true,
        data: updatedAnalysis,
        message: 'Analysis cancelled successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Get analysis issues
  async getAnalysisIssues(req: Request, res: Response, next: NextFunction) {
    try {
      const { analysisId } = req.params;
      const userId = req.user?.id;
      const { 
        severity, 
        status, 
        limit = '50', 
        offset = '0' 
      } = req.query;

      // Check if analysis exists and belongs to user
      const analysis = await prisma.crawlSession.findFirst({
        where: {
          id: analysisId,
          project: { userId },
        },
      });

      if (!analysis) {
        throw new NotFoundError('Analysis not found');
      }

      // Build where clause
      const where: any = { analysisId };
      if (severity) where.severity = severity;
      if (status) where.status = status;

      // Get paginated issues
      const [issues, total] = await Promise.all([
        prisma.sEOIssue.findMany({
          where,
          select: {
            id: true,
            type: true,
            severity: true,
            status: true,
            createdAt: true,
          },
          orderBy: [
            { severity: 'desc' },
            { createdAt: 'desc' },
          ],
          take: parseInt(limit as string, 10),
          skip: parseInt(offset as string, 10),
        }),
        prisma.sEOIssue.count({ where }),
      ]);

      res.json({
        success: true,
        data: issues,
        meta: {
          total,
          limit: parseInt(limit as string, 10),
          offset: parseInt(offset as string, 10),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Update issue status
  async updateIssueStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { issueId } = req.params;
      const { status } = req.body;
      const userId = req.user?.id;

      // Check if issue exists and belongs to user
      const issue = await prisma.sEOIssue.findFirst({
        where: {
          id: issueId,
          analysis: {
            crawlSession: {
              project: { userId },
            },
          },
        },
        include: {
          analysis: {
            select: {
              crawlSession: {
                select: {
                  projectId: true,
                },
              },
            },
          },
        },
      });

      if (!issue) {
        throw new NotFoundError('Issue not found');
      }

      // Update issue status
      const updatedIssue = await prisma.sEOIssue.update({
        where: { id: issueId },
        data: { status },
        select: {
          id: true,
          status: true,
          severity: true,
        },
      });

      // Emit issue updated event
      req.io.to(`project:${issue.analysis.crawlSession.projectId}`).emit('issue:updated', { 
        projectId: issue.analysis.crawlSession.projectId,
        analysisId: issue.analysisId,
        issue: updatedIssue,
      });

      // Invalidate analysis cache
      await cache.del(`analysis:${issue.analysisId}`);

      res.json({
        success: true,
        data: updatedIssue,
        message: 'Issue status updated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Helper method to run analysis in background
  async runAnalysisInBackground(
    crawlSessionId: string,
    project: any,
    io: any
  ) {
    try {
      // Update status to in_progress
      await prisma.crawlSession.update({
        where: { id: crawlSessionId },
        data: { status: 'in_progress' },
      });

      // Emit analysis progress update
      io.to(`project:${project.id}`).emit('analysis:progress', {
        projectId: project.id,
        analysisId: crawlSessionId,
        status: 'in_progress',
        progress: 0,
        message: 'Starting analysis...',
      });

      // TODO: Implement actual SEO analysis logic here
      // This is a placeholder for the analysis process

      // Simulate analysis progress
      const steps = [
        { progress: 10, message: 'Crawling website...' },
        { progress: 30, message: 'Analyzing technical SEO...' },
        { progress: 50, message: 'Checking content quality...' },
        { progress: 70, message: 'Analyzing on-page elements...' },
        { progress: 90, message: 'Generating report...' },
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate work
        
        io.to(`project:${project.id}`).emit('analysis:progress', {
          projectId: project.id,
          analysisId: crawlSessionId,
          status: 'in_progress',
          progress: step.progress,
          message: step.message,
        });
        io.to(`project:${project.id}`).emit('analysis:progress', {
          projectId: project.id,
          analysisId: crawlSessionId,
          status: 'in_progress',
          progress: step.progress,
          message: step.message,
        });
      }

      // Create analysis results (example data)
      const analysis = await prisma.sEOAnalysis.create({
        data: {
          crawlSessionId,
          projectId: project.id,
          overallScore: 85,
          technicalScore: 90,
          contentScore: 80,
          onpageScore: 85,
          uxScore: 88,
        },
      });

      // Create example issues
      const exampleIssues = [
        {
          analysisId: analysis.id,
          type: 'missing_meta_description',
          severity: 'medium',
          message: 'Missing meta description',
          title: 'Missing Meta Description',
          category: 'technical',
          url: project.url,
          status: 'open',
        },
        {
          analysisId: analysis.id,
          type: 'slow_page_load',
          severity: 'high',
          message: 'Page load time is slow',
          title: 'Slow Page Load',
          category: 'technical',
          url: project.url,
          status: 'open',
        },
      ];

      await prisma.sEOIssue.createMany({
        data: exampleIssues,
      });

      // Update crawl session as completed
      await prisma.crawlSession.update({
        where: { id: crawlSessionId },
        data: { 
          status: 'completed',
          completedAt: new Date(),
        },
      });

      // Update project stats
      await prisma.project.update({
        where: { id: project.id },
        data: { 
          currentScore: analysis.overallScore,
        },
      });

      // Emit analysis completed event
      io.to(`project:${project.id}`).emit('analysis:completed', {
        projectId: project.id,
        analysis: {
          id: crawlSessionId,
          status: 'completed',
          startedAt: new Date(),
          completedAt: new Date(),
          analysis: {
            ...analysis,
            issues: exampleIssues,
          },
        },
      });

    } catch (error: any) {
      logger.error('Error in analysis background job:', error);
      
      // Update crawl session as failed
      await prisma.crawlSession.update({
        where: { id: crawlSessionId },
        data: { 
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date(),
        },
      });

      // Emit analysis failed event
      io.to(`project:${project.id}`).emit('analysis:failed', {
        projectId: project.id,
        analysisId: crawlSessionId,
        error: 'Analysis failed to complete',
      });
    }
  },
};
