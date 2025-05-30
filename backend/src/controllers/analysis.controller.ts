import { Request, Response, NextFunction } from 'express';
import { prisma } from '..';
import { 
  NotFoundError, 
  BadRequestError
} from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import { cache } from '../utils/cache';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types/auth';
import { analysisCacheService } from '../services/AnalysisCacheService';

// Import our enhanced analysis system
import { EnhancedPageAnalyzer, EnhancedAnalysisResult } from '../seo-crawler/engine/AnalysisModules/EnhancedPageAnalyzer';
import { PageAnalyzer } from '../seo-crawler/engine/PageAnalyzer';
import { CrawlerConfig } from '../seo-crawler/types/CrawlerConfig';
import { Server } from 'socket.io';
import { createHash } from 'crypto';

// Analysis Controller
// Handles starting, retrieving, listing, and cancelling analyses, as well as issue management
// All endpoints must use correct Prisma model accessors and field names
// All select statements must only reference fields that exist in the Prisma schema
// All endpoints should be protected with JWT middleware
// TODO: Add input validation middleware (zod) for query/params
// TODO: Add more granular error handling and logging for production
// TODO: Implement actual SEO analysis logic in runAnalysisInBackground

export class AnalysisController {
  // Start a new analysis for a project
  async startAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.body;
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
  }

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
                },
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
  }

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
  }

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
  }

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
  }

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
  }

  // Helper method to run analysis in background
  async runAnalysisInBackground(
    crawlSessionId: string,
    project: any,
    io: Server,
    useEnhanced: boolean = true
  ) {
    try {
      console.log(`[Analysis Controller] Starting ${useEnhanced ? 'enhanced' : 'standard'} analysis for session: ${crawlSessionId}`);
      
      // Update session status
      await prisma.crawlSession.update({
        where: { id: crawlSessionId },
        data: {
          status: 'running',
          startedAt: new Date()
        }
      });

      // Emit progress update
      io.emit('analysis:started', { 
        sessionId: crawlSessionId, 
        projectId: project.id,
        enhanced: useEnhanced 
      });

      // Prepare page context for analysis
      const pageContext = {
        url: project.url,
        projectId: project.id,
        sessionId: crawlSessionId,
        config: {
          crawlOptions: {
            extractOptions: {
              screenshots: true,
              performanceMetrics: useEnhanced,
              extendedAnalysis: useEnhanced
            },
            userAgent: 'SEO-Analyzer/2.0',
            timeout: 30000,
            viewport: { width: 1200, height: 800 }
          }
        }
      };

      // Run analysis
      let analysisResult;
      if (useEnhanced) {
        console.log('[Analysis Controller] Running enhanced analysis...');
        analysisResult = await this.enhancedAnalyzer.analyze(pageContext);
      } else {
        console.log('[Analysis Controller] Running standard analysis...');
        analysisResult = await this.standardAnalyzer.analyzePage(project.url);
      }

      // Emit progress update
      io.emit('analysis:progress', { 
        sessionId: crawlSessionId, 
        stage: 'processing_results',
        progress: 80 
      });

      // Store results in database
      await this.storeAnalysisResults(crawlSessionId, project.id, analysisResult, useEnhanced);

      // Update session status
      await prisma.crawlSession.update({
        where: { id: crawlSessionId },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      });

      // Update project statistics
      await this.updateProjectStatistics(project.id, analysisResult);

      // Create trend record
      await this.createTrendRecord(project.id, analysisResult);

      // Emit completion
      io.emit('analysis:completed', { 
        sessionId: crawlSessionId,
        projectId: project.id,
        results: {
          overallScore: analysisResult.score,
          enhanced: useEnhanced,
          issuesFound: analysisResult.enhancedIssues?.issues?.length || analysisResult.issues?.length || 0,
          recommendations: analysisResult.enhancedRecommendations?.length || analysisResult.recommendations?.length || 0
        }
      });

      console.log(`[Analysis Controller] Analysis completed for session: ${crawlSessionId}`);

    } catch (error) {
      console.error(`[Analysis Controller] Analysis failed for session ${crawlSessionId}:`, error);
      
      // Update session with error
      await prisma.crawlSession.update({
        where: { id: crawlSessionId },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      // Emit error
      io.emit('analysis:failed', { 
        sessionId: crawlSessionId,
        error: error instanceof Error ? error.message : 'Analysis failed'
      });
    }
  }

  // Get trend data for a project (score and issue count over time)
  async getProjectTrends(req: Request, res: Response, next: NextFunction) {
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
      // Get all crawl sessions with analysis and issues
      const sessions = await prisma.crawlSession.findMany({
        where: { projectId },
        orderBy: { startedAt: 'asc' },
        include: {
          analysis: {
            select: {
              overallScore: true,
              technicalScore: true,
              contentScore: true,
              onpageScore: true,
              uxScore: true,
              issues: {
                select: { id: true, type: true, severity: true },
              },
            },
          },
        },
      });
      const trends = sessions.map((s: any) => {
        // Issue breakdowns
        const issues = s.analysis?.issues || [];
        const issueTypeCounts: Record<string, number> = {};
        const issueSeverityCounts: Record<string, number> = {};
        for (const issue of issues) {
          issueTypeCounts[issue.type] = (issueTypeCounts[issue.type] || 0) + 1;
          issueSeverityCounts[issue.severity] = (issueSeverityCounts[issue.severity] || 0) + 1;
        }
        return {
          date: s.startedAt.toISOString().slice(0, 10),
          score: s.analysis?.overallScore ?? null,
          technicalScore: s.analysis?.technicalScore ?? null,
          contentScore: s.analysis?.contentScore ?? null,
          onpageScore: s.analysis?.onpageScore ?? null,
          uxScore: s.analysis?.uxScore ?? null,
          issueCount: issues.length,
          issueTypeCounts,
          issueSeverityCounts,
        };
      });
      res.json({ trends });
    } catch (error) {
      next(error);
    }
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.round(Math.sqrt(variance));
  }
}

// Export instance of the controller
export const analysisController = new AnalysisController();
