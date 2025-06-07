import { Request, Response } from 'express';
import { EnhancedQueueAdapter } from '../seo-crawler/queue/EnhancedQueueAdapter';
import { EnhancedWorker } from '../seo-crawler/queue/EnhancedWorker';
import { WebSocketGateway } from '../seo-crawler/ws/WebSocketGateway';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { z } from 'zod';

// Validation schemas
const StartAnalysisSchema = z.object({
  projectId: z.string().uuid(),
  priority: z.number().min(0).max(10).optional().default(5),
  timeout: z.number().min(30000).max(600000).optional().default(600000), // 30s to 10min
  extractOptions: z.object({
    screenshots: z.boolean().optional().default(true),
    performanceMetrics: z.boolean().optional().default(true),
    fullPageScreenshot: z.boolean().optional().default(false),
  }).optional().default({}),
});

const BulkAnalysisSchema = z.object({
  projectIds: z.array(z.string().uuid()).min(1).max(10),
  priority: z.number().min(0).max(10).optional().default(5),
  timeout: z.number().min(30000).max(600000).optional().default(600000),
  extractOptions: z.object({
    screenshots: z.boolean().optional().default(true),
    performanceMetrics: z.boolean().optional().default(true),
  }).optional().default({}),
});

export class EnhancedAnalysisController {
  private queueAdapter: EnhancedQueueAdapter;
  private worker: EnhancedWorker;
  private wsGateway: WebSocketGateway;
  private prisma: PrismaClient;

  constructor() {
    this.queueAdapter = new EnhancedQueueAdapter();
    this.worker = new EnhancedWorker(this.queueAdapter);
    this.wsGateway = new WebSocketGateway();
    this.prisma = new PrismaClient();
    
    // Start the worker
    this.worker.start().catch(error => {
      logger.error('Failed to start enhanced worker:', error);
    });
  }

  /**
   * Start a new SEO analysis for a project
   */
  async startAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Validate request body
      const validatedData = StartAnalysisSchema.parse(req.body);
      const { projectId, priority, timeout } = validatedData;

      // Verify project ownership
      const project = await this.prisma.project.findFirst({
        where: { id: projectId, userId },
        include: { user: true },
      });

      if (!project) {
        res.status(404).json({ error: 'Project not found or access denied' });
        return;
      }

      // Check for existing active analysis
      const existingAnalysis = await this.prisma.crawlSession.findFirst({
        where: {
          projectId,
          status: { in: ['queued', 'running'] },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingAnalysis) {
        res.status(409).json({
          error: 'Analysis already in progress',
          existingJobId: existingAnalysis.id,
        });
        return;
      }

      // Check user's subscription limits
      const analysisCount = await this.getAnalysisCountForUser(userId);
      const userLimits = this.getUserLimits(project.user.subscriptionTier);
      
      if (analysisCount >= userLimits.monthlyAnalyses) {
        res.status(429).json({
          error: 'Monthly analysis limit exceeded',
          limit: userLimits.monthlyAnalyses,
          used: analysisCount,
        });
        return;
      }

      // Quick analysis configuration
      const analysisData = {
        projectId,
        userId: req.user!.id,
        url: project.url,
        crawlOptions: {
          maxPages: 1,
          crawlDepth: 1,
          respectRobots: true,
          crawlDelay: 1000,
          userAgent: 'SEO-Analyzer-Quick/2.0 (+https://rival-outranker.com/bot)',
          timeout: timeout || 180000,
          retryAttempts: 2,
          viewport: {
            width: 1200,
            height: 800,
            deviceType: 'desktop' as const,
          },
          extractOptions: {
            screenshots: false, // Disabled for quick analysis
            performanceMetrics: true,
            accessibilityCheck: false,
            structuredData: true,
            socialMetaTags: true,
            technicalSEO: true,
            contentAnalysis: true,
            linkAnalysis: false,
            imageAnalysis: false,
            mobileOptimization: false,
          },
          blockResources: ['font', 'media', 'other'],
          allowedDomains: [new URL(project.url).hostname],
          excludePatterns: [] as string[],
        },
        queueConfig: {
          concurrency: 1,
          priority: priority === 1 ? 'high' as const : 'normal' as const,
        },
      };

      // Add job to queue
      const jobId = await this.queueAdapter.addAnalysisJob(analysisData);

      // Create initial crawl session record
      await this.prisma.crawlSession.create({
        data: {
          id: jobId,
          sessionId: `crawl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          projectId,
          userId: req.user.id,
          startUrl: project.url,
          crawlType: 'single',
          config: {},
          status: 'queued',
        },
      });

      // Emit initial progress event
      this.wsGateway.emitProgress(jobId, {
        percentage: 0,
        stage: 'queued',
        details: 'Analysis queued for processing',
      });

      logger.info(`Started analysis job ${jobId} for project ${projectId}`);

      res.status(202).json({
        jobId,
        status: 'queued',
        projectId,
        estimatedDuration: Math.round(timeout / 1000), // seconds
        position: await this.getQueuePosition(jobId),
      });

    } catch (error) {
      logger.error('Error starting analysis:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Invalid request data',
          details: error.errors,
        });
        return;
      }

      res.status(500).json({
        error: 'Failed to start analysis',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Start bulk analysis for multiple projects
   */
  async startBulkAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const validatedData = BulkAnalysisSchema.parse(req.body);
      const { projectIds, priority, timeout, extractOptions } = validatedData;

      // Verify all projects belong to user
      const projects = await this.prisma.project.findMany({
        where: { id: { in: projectIds }, userId },
        include: { user: true },
      });

      if (projects.length !== projectIds.length) {
        res.status(404).json({ error: 'One or more projects not found' });
        return;
      }

      // Check subscription limits
      const analysisCount = await this.getAnalysisCountForUser(userId);
      const userLimits = this.getUserLimits(projects[0].user.subscriptionTier);
      
      if (analysisCount + projectIds.length > userLimits.monthlyAnalyses) {
        res.status(429).json({
          error: 'Bulk analysis would exceed monthly limit',
          limit: userLimits.monthlyAnalyses,
          used: analysisCount,
          requested: projectIds.length,
        });
        return;
      }

      const results = [];

      for (const project of projects) {
        try {
          const analysisConfig = {
            projectId: project.id,
            userId,
            url: project.url,
            crawlOptions: {
              maxPages: 1,
              crawlDepth: 1,
              respectRobots: true,
              crawlDelay: 1000,
              userAgent: 'SEO-Analyzer-Enhanced/2.0 (+https://rival-outranker.com/bot)',
              timeout: timeout || 300000,
              retryAttempts: 2,
              viewport: {
                width: 1200,
                height: 800,
                deviceType: 'desktop' as const,
              },
              extractOptions: {
                screenshots: extractOptions?.screenshots ?? true,
                performanceMetrics: extractOptions?.performanceMetrics ?? true,
                accessibilityCheck: true,
                structuredData: true,
                socialMetaTags: true,
                technicalSEO: true,
                contentAnalysis: true,
                linkAnalysis: true,
                imageAnalysis: true,
                mobileOptimization: true,
              },
              blockResources: ['font', 'media', 'other'],
              allowedDomains: [new URL(project.url).hostname],
              excludePatterns: [] as string[],
            },
            queueConfig: {
              concurrency: 1,
              priority: priority === 1 ? 'high' as const : 'normal' as const,
            },
          };

          const jobId = await this.queueAdapter.addAnalysisJob(analysisConfig);

          await this.prisma.crawlSession.create({
            data: {
              id: jobId,
              sessionId: `crawl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              projectId: project.id,
              userId: req.user.id,
              startUrl: project.url,
              crawlType: 'single',
              config: {},
              status: 'queued',
            },
          });

          results.push({
            projectId: project.id,
            jobId,
            status: 'queued',
          });

        } catch (error) {
          logger.error(`Error queuing analysis for project ${project.id}:`, error);
          results.push({
            projectId: project.id,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      res.status(202).json({
        bulkJobId: `bulk-${Date.now()}`,
        results,
        queued: results.filter(r => r.status === 'queued').length,
        failed: results.filter(r => r.status === 'failed').length,
      });

    } catch (error) {
      logger.error('Error starting bulk analysis:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Invalid request data',
          details: error.errors,
        });
        return;
      }

      res.status(500).json({
        error: 'Failed to start bulk analysis',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get analysis job status and progress
   */
  async getAnalysisStatus(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Verify job belongs to user
      const crawlSession = await this.prisma.crawlSession.findFirst({
        where: { id: jobId },
        include: { project: true },
      });

      if (!crawlSession || crawlSession.project.userId !== userId) {
        res.status(404).json({ error: 'Analysis not found' });
        return;
      }

      // Get job status from queue
      const jobStatus = await this.queueAdapter.getJobStatus(jobId);

      if (!jobStatus) {
        res.status(404).json({ error: 'Job not found in queue' });
        return;
      }

      // Calculate estimated time remaining
      let estimatedTimeRemaining;
      if (jobStatus.status === 'active' && jobStatus.progress) {
        const elapsed = Date.now() - (jobStatus.startedAt?.getTime() || Date.now());
        const progressPercent = jobStatus.progress.percentage || 1;
        const totalEstimated = (elapsed / progressPercent) * 100;
        estimatedTimeRemaining = Math.max(0, totalEstimated - elapsed);
      }

      res.json({
        jobId,
        status: jobStatus.status,
        progress: jobStatus.progress,
        result: jobStatus.result,
        error: jobStatus.error,
        createdAt: jobStatus.createdAt,
        startedAt: jobStatus.startedAt,
        completedAt: jobStatus.completedAt,
        attemptsMade: jobStatus.attemptsMade,
        estimatedTimeRemaining: estimatedTimeRemaining ? Math.round(estimatedTimeRemaining / 1000) : null,
        projectId: crawlSession.projectId,
        url: crawlSession.startUrl,
      });

    } catch (error) {
      logger.error('Error getting analysis status:', error);
      res.status(500).json({
        error: 'Failed to get analysis status',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Cancel an analysis job
   */
  async cancelAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Verify job belongs to user
      const crawlSession = await this.prisma.crawlSession.findFirst({
        where: { id: jobId },
        include: { project: true },
      });

      if (!crawlSession || crawlSession.project.userId !== userId) {
        res.status(404).json({ error: 'Analysis not found' });
        return;
      }

      // Cancel job in queue
      const cancelled = await this.queueAdapter.cancelJob(jobId);

      if (cancelled) {
        // Update crawl session status
        await this.prisma.crawlSession.update({
          where: { id: jobId },
          data: {
            status: 'cancelled',
            completedAt: new Date(),
            errorMessage: 'Cancelled by user',
          },
        });

        res.json({ success: true, message: 'Analysis cancelled successfully' });
      } else {
        res.status(400).json({ error: 'Unable to cancel analysis' });
      }

    } catch (error) {
      logger.error('Error cancelling analysis:', error);
      res.status(500).json({
        error: 'Failed to cancel analysis',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Retry a failed analysis
   */
  async retryAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Verify job belongs to user and is failed
      const crawlSession = await this.prisma.crawlSession.findFirst({
        where: { id: jobId, status: 'failed' },
        include: { project: true },
      });

      if (!crawlSession || crawlSession.project.userId !== userId) {
        res.status(404).json({ error: 'Failed analysis not found' });
        return;
      }

      // Retry job in queue
      const retried = await this.queueAdapter.retryJob(jobId);

      if (retried) {
        // Update crawl session status
        await this.prisma.crawlSession.update({
          where: { id: jobId },
          data: {
            status: 'queued',
            errorMessage: null,
            completedAt: null,
          },
        });

        res.json({ success: true, message: 'Analysis retry queued successfully' });
      } else {
        res.status(400).json({ error: 'Unable to retry analysis' });
      }

    } catch (error) {
      logger.error('Error retrying analysis:', error);
      res.status(500).json({
        error: 'Failed to retry analysis',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get queue metrics and system health
   */
  async getQueueMetrics(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const [queueMetrics, workerMetrics, healthCheck] = await Promise.all([
        this.queueAdapter.getQueueMetrics(),
        this.worker.getWorkerMetrics(),
        this.queueAdapter.healthCheck(),
      ]);

      res.json({
        queue: queueMetrics,
        worker: workerMetrics,
        health: healthCheck,
        timestamp: new Date(),
      });

    } catch (error) {
      logger.error('Error getting queue metrics:', error);
      res.status(500).json({
        error: 'Failed to get queue metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get user's recent analyses
   */
  async getUserAnalyses(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { limit = 20, offset = 0, status } = req.query;

      const where: any = {
        project: { userId },
      };

      if (status && typeof status === 'string') {
        where.status = status;
      }

      const analyses = await this.prisma.crawlSession.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true, url: true },
          },
          analysis: {
            select: { overallScore: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
      });

      const total = await this.prisma.crawlSession.count({ where });

      res.json({
        analyses: analyses.map(analysis => ({
          id: analysis.id,
          projectId: analysis.projectId,
          projectName: analysis.project.name,
          url: analysis.startUrl,
          status: analysis.status,
          overallScore: analysis.analysis?.overallScore,
          createdAt: analysis.createdAt,
          startedAt: analysis.startedAt,
          completedAt: analysis.completedAt,
          errorMessage: analysis.errorMessage,
        })),
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasNext: Number(offset) + Number(limit) < total,
        },
      });

    } catch (error) {
      logger.error('Error getting user analyses:', error);
      res.status(500).json({
        error: 'Failed to get analyses',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Helper methods

  private async getAnalysisCountForUser(userId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return this.prisma.crawlSession.count({
      where: {
        project: { userId },
        createdAt: { gte: startOfMonth },
        status: { in: ['completed', 'running', 'queued'] },
      },
    });
  }

  private getUserLimits(subscriptionTier: string) {
    const limits = {
      free: { monthlyAnalyses: 10, concurrentAnalyses: 1 },
      basic: { monthlyAnalyses: 100, concurrentAnalyses: 3 },
      pro: { monthlyAnalyses: 500, concurrentAnalyses: 5 },
      enterprise: { monthlyAnalyses: 2000, concurrentAnalyses: 10 },
    };

    return limits[subscriptionTier as keyof typeof limits] || limits.free;
  }

  private async getQueuePosition(jobId: string): Promise<number> {
    try {
      const metrics = await this.queueAdapter.getQueueMetrics();
      return metrics.waiting + metrics.active;
    } catch {
      return 0;
    }
  }

  async shutdown(): Promise<void> {
    try {
      await this.worker.stop();
      await this.queueAdapter.close();
      await this.prisma.$disconnect();
      logger.info('Enhanced analysis controller shutdown complete');
    } catch (error) {
      logger.error('Error during shutdown:', error);
    }
  }
} 