import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  NotFoundError, 
  BadRequestError
} from '../middleware/error.middleware';
import { cache } from '../utils/cache';
import { Server } from 'socket.io';

// Create a separate Prisma instance to avoid circular dependency
const prisma = new PrismaClient();

// Import our enhanced analysis system
import { PageAnalyzer } from '../seo-crawler/engine/PageAnalyzer';
import { EnhancedPageAnalyzer } from '../seo-crawler/engine/AnalysisModules/EnhancedPageAnalyzer';
import { EnhancedContentAnalyzer } from '../seo-crawler/engine/AnalysisModules/EnhancedContentAnalyzer';
import { EnhancedIssueDetection } from '../seo-crawler/engine/AnalysisModules/EnhancedIssueDetection';
import { EnhancedRecommendationEngine } from '../seo-crawler/engine/AnalysisModules/EnhancedRecommendationEngine';
import { CrawlerConfig } from '../seo-crawler/types/CrawlerConfig';

// Analysis Controller
// Handles starting, retrieving, listing, and cancelling analyses, as well as issue management
// All endpoints must use correct Prisma model accessors and field names
// All select statements must only reference fields that exist in the Prisma schema
// All endpoints should be protected with JWT middleware
// TODO: Add input validation middleware (zod) for query/params
// TODO: Add more granular error handling and logging for production
// TODO: Implement actual SEO analysis logic in runAnalysisInBackground

export class AnalysisController {
  private enhancedAnalyzer: PageAnalyzer;
  private standardAnalyzer: PageAnalyzer;
  private pageAnalyzer: EnhancedPageAnalyzer;
  private contentAnalyzer: EnhancedContentAnalyzer;
  private issueDetection: EnhancedIssueDetection;
  private recommendationEngine: EnhancedRecommendationEngine;

  constructor() {
    const config: CrawlerConfig = {
      url: '',
      projectId: '',
      userId: '',
      crawlOptions: {
        maxPages: 1,
        crawlDepth: 1,
        respectRobots: true,
        crawlDelay: 0,
        userAgent: 'SEO-Analyzer/2.0',
        timeout: 30000,
        retryAttempts: 3,
        viewport: { width: 1200, height: 800, deviceType: 'desktop' as const },
        extractOptions: {
          screenshots: false,
          performanceMetrics: false,
          accessibilityCheck: false,
          structuredData: true,
          socialMetaTags: true,
          technicalSEO: true,
          contentAnalysis: true,
          linkAnalysis: false,
          imageAnalysis: false,
          mobileOptimization: false
        },
        blockResources: [],
        allowedDomains: [],
        excludePatterns: []
      }
    };

    this.enhancedAnalyzer = new PageAnalyzer(config);
    this.standardAnalyzer = new PageAnalyzer(config);
    this.pageAnalyzer = new EnhancedPageAnalyzer();
    this.contentAnalyzer = new EnhancedContentAnalyzer();
    this.issueDetection = new EnhancedIssueDetection();
    this.recommendationEngine = new EnhancedRecommendationEngine();
  }

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
          userId: req.user.id,
          startUrl: project.url,
          sessionId: `crawl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          crawlType: 'single',
          config: {},
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
        // Use enhanced analyzer with the configured pageContext
        analysisResult = await this.enhancedAnalyzer.analyzePage(project.url);
        
        // Then enhance with pageAnalyzer
        const enhancedResults = await this.pageAnalyzer.analyze(pageContext);
        analysisResult = { ...analysisResult, ...enhancedResults };
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

  // Add missing private methods
  private async storeAnalysisResults(
    crawlSessionId: string, 
    projectId: string, 
    analysisResult: any, 
    useEnhanced: boolean
  ): Promise<void> {
    try {
      // Enhanced analysis using content analyzer and recommendation engine
      let enrichedAnalysis = analysisResult;
      
      if (useEnhanced) {
        // Use the content analyzer for additional insights
        const contentAnalysis = await this.contentAnalyzer.analyze({ pageAnalysis: analysisResult });
        
        // Use the recommendation engine for enhanced recommendations
        const recommendationResults = await this.recommendationEngine.generateRecommendations({
          pageAnalysis: analysisResult,
          issues: analysisResult.enhancedIssues?.issues || analysisResult.issues || []
        });
        
        // Use issue detection for categorized issues
        const issueResults = await this.issueDetection.analyze({ pageAnalysis: analysisResult });
        
        enrichedAnalysis = {
          ...analysisResult,
          enhancedContent: contentAnalysis.enhancedContent,
          enhancedRecommendations: recommendationResults.enhancedRecommendations,
          categorizedIssues: issueResults.categorizedIssues
        };
      }

      // Create analysis record
      const analysis = await prisma.sEOAnalysis.create({
        data: {
          crawlSessionId,
          projectId,
          overallScore: enrichedAnalysis.score || 0,
          technicalScore: enrichedAnalysis.enhancedScoring?.breakdown?.technical || enrichedAnalysis.technicalScore || 0,
          contentScore: enrichedAnalysis.enhancedScoring?.breakdown?.content || enrichedAnalysis.contentScore || 0,
          onpageScore: enrichedAnalysis.enhancedScoring?.breakdown?.onPage || enrichedAnalysis.onpageScore || 0,
          uxScore: enrichedAnalysis.enhancedScoring?.breakdown?.userExperience || enrichedAnalysis.uxScore || 0,
        }
      });

      // Store issues if any
      if (enrichedAnalysis.enhancedIssues?.issues || enrichedAnalysis.issues) {
        const issues = enrichedAnalysis.enhancedIssues?.issues || enrichedAnalysis.issues || [];
        if (issues.length > 0) {
          await prisma.sEOIssue.createMany({
            data: issues.map((issue: any) => ({
              analysisId: analysis.id,
              type: issue.type || 'general',
              severity: issue.severity || 'medium',
              title: issue.title || 'Untitled Issue',
              description: issue.description || '',
              recommendation: issue.recommendation || '',
              affectedElements: JSON.stringify(issue.affectedElements || []),
              status: 'open'
            }))
          });
        }
      }

      console.log(`[Analysis Controller] Stored analysis results for session ${crawlSessionId}`);
    } catch (error) {
      console.error(`[Analysis Controller] Failed to store analysis results:`, error);
      throw error;
    }
  }

  private async updateProjectStatistics(projectId: string, analysisResult: any): Promise<void> {
    try {
      // Get current project data
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          crawlSessions: {
            include: { analysis: true },
            orderBy: { startedAt: 'desc' },
            take: 10 // Last 10 analyses for trend calculation
          }
        }
      });

      if (!project) return;

      // Calculate statistics
      const recentAnalyses = project.crawlSessions.filter(s => s.analysis);
      const currentScore = analysisResult.score || 0;
      const previousScore = recentAnalyses.length > 1 ? recentAnalyses[1].analysis?.overallScore || 0 : 0;
      const scoreChange = currentScore - previousScore;

      // Update project with latest statistics
      await prisma.project.update({
        where: { id: projectId },
        data: {
          lastScanDate: new Date(),
          // Add other project statistics if needed
        }
      });

      console.log(`[Analysis Controller] Updated project statistics for ${projectId}, score change: ${scoreChange}`);
    } catch (error) {
      console.error(`[Analysis Controller] Failed to update project statistics:`, error);
      // Don't throw error, this is not critical
    }
  }

  private async createTrendRecord(projectId: string, analysisResult: any): Promise<void> {
    try {
      // Create a trend snapshot record
      await prisma.projectTrends.create({
        data: {
          projectId,
          date: new Date(),
          overallScore: analysisResult.score || 0,
          technicalScore: analysisResult.enhancedScoring?.breakdown?.technical || analysisResult.technicalScore || 0,
          contentScore: analysisResult.enhancedScoring?.breakdown?.content || analysisResult.contentScore || 0,
          onPageScore: analysisResult.enhancedScoring?.breakdown?.onPage || analysisResult.onpageScore || 0,
          uxScore: analysisResult.enhancedScoring?.breakdown?.userExperience || analysisResult.uxScore || 0,
          totalIssues: analysisResult.enhancedIssues?.issues?.length || analysisResult.issues?.length || 0,
          criticalIssues: analysisResult.enhancedIssues?.summary?.criticalCount || 0,
          highIssues: analysisResult.enhancedIssues?.summary?.highCount || 0,
          mediumIssues: analysisResult.enhancedIssues?.summary?.mediumCount || 0,
          lowIssues: analysisResult.enhancedIssues?.summary?.lowCount || 0,
          performanceScore: analysisResult.coreWebVitals?.performanceScore || null,
          accessibilityScore: null,
          crawlabilityScore: null,
        }
      });

      console.log(`[Analysis Controller] Created trend record for project ${projectId}`);
    } catch (error) {
      console.error(`[Analysis Controller] Failed to create trend record:`, error);
      // Don't throw error, this is not critical
    }
  }
}

// Export instance of the controller
export const analysisController = new AnalysisController();
