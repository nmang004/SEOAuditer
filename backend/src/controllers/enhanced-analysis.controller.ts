import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types/auth';
import { CoreWebVitalsAnalyzer } from '../services/CoreWebVitalsAnalyzer';
import { analysisCacheService } from '../services/AnalysisCacheService';

const prisma = new PrismaClient();

export class EnhancedAnalysisController {
  private coreWebVitalsAnalyzer: CoreWebVitalsAnalyzer;

  constructor() {
    this.coreWebVitalsAnalyzer = new CoreWebVitalsAnalyzer();
  }

  // GET /api/enhanced-analysis/:id/detailed - Complete analysis results
  async getDetailedAnalysis(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id: analysisId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Check cache first
      const cacheKey = `detailed-analysis:${analysisId}`;
      const cached = await analysisCacheService.get(cacheKey);
      if (cached) {
        return res.json({ success: true, data: cached, cached: true });
      }

      // Get analysis with all related data
      const analysis = await prisma.sEOAnalysis.findFirst({
        where: {
          id: analysisId,
          crawlSession: {
            project: { userId }
          }
        },
        include: {
          crawlSession: {
            include: {
              project: {
                select: { id: true, name: true, url: true }
              }
            }
          },
          issues: {
            orderBy: [
              { severity: 'desc' },
              { createdAt: 'desc' }
            ]
          },
          recommendations: {
            orderBy: [
              { priority: 'desc' },
              { quickWin: 'desc' },
              { createdAt: 'desc' }
            ]
          },
          metaTags: true,
          scoreBreakdown: true,
          contentAnalysis: true,
          performanceMetrics: true
        }
      });

      if (!analysis) {
        return res.status(404).json({ success: false, error: 'Analysis not found' });
      }

      // Transform the data for the frontend
      const detailedAnalysis = {
        id: analysis.id,
        url: analysis.crawlSession.url,
        project: analysis.crawlSession.project,
        overallScore: analysis.overallScore,
        categoryScores: {
          technical: analysis.technicalScore,
          content: analysis.contentScore,
          onPage: analysis.onpageScore,
          ux: analysis.uxScore
        },
        scoreBreakdown: analysis.scoreBreakdown?.technicalBreakdown ? {
          technical: analysis.scoreBreakdown.technicalBreakdown,
          content: analysis.scoreBreakdown.contentBreakdown,
          onPage: analysis.scoreBreakdown.onPageBreakdown,
          ux: analysis.scoreBreakdown.uxBreakdown,
          weights: analysis.scoreBreakdown.weights
        } : null,
        issues: {
          critical: analysis.issues.filter(issue => issue.severity === 'critical'),
          high: analysis.issues.filter(issue => issue.severity === 'high'),
          medium: analysis.issues.filter(issue => issue.severity === 'medium'),
          low: analysis.issues.filter(issue => issue.severity === 'low'),
          total: analysis.issues.length
        },
        recommendations: analysis.recommendations.map(rec => ({
          id: rec.id,
          title: rec.title,
          description: rec.description,
          priority: rec.priority,
          category: rec.category,
          quickWin: rec.quickWin,
          effortLevel: rec.effortLevel,
          timeEstimate: rec.timeEstimate,
          businessValue: rec.businessValue,
          implementationSteps: rec.implementationSteps,
          codeExamples: rec.codeExamples,
          expectedResults: rec.expectedResults
        })),
        content: analysis.contentAnalysis ? {
          wordCount: analysis.contentAnalysis.wordCount,
          readingTime: analysis.contentAnalysis.readingTime,
          readabilityMetrics: analysis.contentAnalysis.readabilityMetrics,
          keywordAnalysis: analysis.contentAnalysis.keywordAnalysis,
          overallScore: analysis.contentAnalysis.overallScore
        } : null,
        performance: analysis.performanceMetrics ? {
          coreWebVitals: analysis.performanceMetrics.coreWebVitals,
          performanceScore: analysis.performanceMetrics.performanceScore,
          loadTime: analysis.performanceMetrics.loadTime,
          pageSize: analysis.performanceMetrics.pageSize,
          optimizationOpportunities: analysis.performanceMetrics.optimizationOpportunities
        } : null,
        metaTags: analysis.metaTags,
        lastAnalyzed: analysis.createdAt,
        confidence: 85 // You can calculate this based on data completeness
      };

      // Cache the result for 1 hour
      await analysisCacheService.set(cacheKey, detailedAnalysis, { ttl: 3600 });

      return res.json({ success: true, data: detailedAnalysis });

    } catch (error) {
      console.error('Error in getDetailedAnalysis:', error);
      return next(error);
    }
  }

  // GET /api/enhanced-analysis/:id/score-breakdown - Detailed scoring breakdown
  async getScoreBreakdown(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id: analysisId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const analysis = await prisma.sEOAnalysis.findFirst({
        where: {
          id: analysisId,
          crawlSession: {
            project: { userId }
          }
        },
        include: {
          scoreBreakdown: true,
          performanceMetrics: true
        }
      });

      if (!analysis) {
        return res.status(404).json({ success: false, error: 'Analysis not found' });
      }

      const breakdown = {
        overall: analysis.overallScore,
        categories: {
          technical: {
            score: analysis.technicalScore,
            weight: 0.3,
            breakdown: analysis.scoreBreakdown?.technicalBreakdown || {}
          },
          content: {
            score: analysis.contentScore,
            weight: 0.25,
            breakdown: analysis.scoreBreakdown?.contentBreakdown || {}
          },
          onPage: {
            score: analysis.onpageScore,
            weight: 0.25,
            breakdown: analysis.scoreBreakdown?.onPageBreakdown || {}
          },
          ux: {
            score: analysis.uxScore,
            weight: 0.2,
            breakdown: analysis.scoreBreakdown?.uxBreakdown || {}
          }
        },
        coreWebVitals: analysis.performanceMetrics?.coreWebVitals || null,
        trends: analysis.scoreBreakdown?.trends || null,
        benchmarks: analysis.scoreBreakdown?.benchmarks || null
      };

      return res.json({ success: true, data: breakdown });

    } catch (error) {
      console.error('Error in getScoreBreakdown:', error);
      return next(error);
    }
  }

  // GET /api/enhanced-analysis/:id/recommendations - Prioritized recommendations
  async getRecommendations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id: analysisId } = req.params;
      const userId = req.user?.id;
      const { priority, category, quickWins } = req.query;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Build where clause for filtering
      const where: any = {
        analysisId,
        analysis: {
          crawlSession: {
            project: { userId }
          }
        }
      };

      if (priority) where.priority = priority;
      if (category) where.category = category;
      if (quickWins === 'true') where.quickWin = true;

      const recommendations = await prisma.sEORecommendation.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { quickWin: 'desc' },
          { businessValue: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          issue: {
            select: {
              id: true,
              title: true,
              severity: true,
              category: true
            }
          }
        }
      });

      // Group recommendations by priority
      const grouped = {
        immediate: recommendations.filter(r => r.priority === 'immediate'),
        high: recommendations.filter(r => r.priority === 'high'),
        medium: recommendations.filter(r => r.priority === 'medium'),
        low: recommendations.filter(r => r.priority === 'low'),
        quickWins: recommendations.filter(r => r.quickWin),
        byCategory: {
          technical: recommendations.filter(r => r.category === 'technical'),
          content: recommendations.filter(r => r.category === 'content'),
          onpage: recommendations.filter(r => r.category === 'onpage'),
          ux: recommendations.filter(r => r.category === 'ux')
        }
      };

      return res.json({ 
        success: true, 
        data: {
          recommendations,
          grouped,
          summary: {
            total: recommendations.length,
            immediate: grouped.immediate.length,
            high: grouped.high.length,
            medium: grouped.medium.length,
            low: grouped.low.length,
            quickWins: grouped.quickWins.length
          }
        }
      });

    } catch (error) {
      console.error('Error in getRecommendations:', error);
      return next(error);
    }
  }

  // GET /api/enhanced-analysis/:id/performance - Performance metrics and Core Web Vitals
  async getPerformanceMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id: analysisId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const analysis = await prisma.sEOAnalysis.findFirst({
        where: {
          id: analysisId,
          crawlSession: {
            project: { userId }
          }
        },
        include: {
          performanceMetrics: true,
          crawlSession: {
            select: { url: true }
          }
        }
      });

      if (!analysis) {
        return res.status(404).json({ success: false, error: 'Analysis not found' });
      }

      let detailedMetrics = null;
      
      // If we have performance metrics, enhance them with fresh Core Web Vitals analysis
      if (analysis.performanceMetrics) {
        try {
          // Get fresh Core Web Vitals analysis
          const coreWebVitalsAnalysis = await this.coreWebVitalsAnalyzer.analyzeWebVitals(
            analysis.crawlSession.url,
            {
              deviceType: 'mobile',
              includeHistorical: true,
              projectId: analysis.projectId
            }
          );

          detailedMetrics = {
            stored: {
              coreWebVitals: analysis.performanceMetrics.coreWebVitals,
              performanceScore: analysis.performanceMetrics.performanceScore,
              loadTime: analysis.performanceMetrics.loadTime,
              pageSize: analysis.performanceMetrics.pageSize,
              requestCount: analysis.performanceMetrics.requestCount,
              optimizationOpportunities: analysis.performanceMetrics.optimizationOpportunities
            },
            fresh: coreWebVitalsAnalysis,
            comparison: {
              hasImproved: false, // You can implement comparison logic here
              changes: {}
            }
          };
        } catch (error) {
          console.error('Failed to get fresh Core Web Vitals:', error);
          detailedMetrics = {
            stored: {
              coreWebVitals: analysis.performanceMetrics.coreWebVitals,
              performanceScore: analysis.performanceMetrics.performanceScore,
              loadTime: analysis.performanceMetrics.loadTime,
              pageSize: analysis.performanceMetrics.pageSize,
              requestCount: analysis.performanceMetrics.requestCount,
              optimizationOpportunities: analysis.performanceMetrics.optimizationOpportunities
            },
            fresh: null,
            comparison: null
          };
        }
      }

      return res.json({ 
        success: true, 
        data: detailedMetrics
      });

    } catch (error) {
      console.error('Error in getPerformanceMetrics:', error);
      return next(error);
    }
  }

  // GET /api/enhanced-analysis/:id/summary - Analysis summary for dashboard
  async getAnalysisSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id: analysisId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const analysis = await prisma.sEOAnalysis.findFirst({
        where: {
          id: analysisId,
          crawlSession: {
            project: { userId }
          }
        },
        include: {
          crawlSession: {
            include: {
              project: {
                select: { id: true, name: true, url: true }
              }
            }
          },
          issues: {
            select: {
              id: true,
              severity: true,
              category: true
            }
          },
          recommendations: {
            select: {
              id: true,
              priority: true,
              quickWin: true
            }
          },
          performanceMetrics: {
            select: {
              performanceScore: true,
              coreWebVitals: true
            }
          }
        }
      });

      if (!analysis) {
        return res.status(404).json({ success: false, error: 'Analysis not found' });
      }

      // Calculate issue breakdown
      const issueBreakdown = analysis.issues.reduce((acc, issue) => {
        acc[issue.severity] = (acc[issue.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const summary = {
        id: analysis.id,
        url: analysis.crawlSession.url,
        project: analysis.crawlSession.project,
        overallScore: analysis.overallScore,
        grade: this.calculateGrade(analysis.overallScore),
        categoryScores: {
          technical: analysis.technicalScore,
          content: analysis.contentScore,
          onPage: analysis.onpageScore,
          ux: analysis.uxScore
        },
        issues: {
          total: analysis.issues.length,
          critical: issueBreakdown.critical || 0,
          high: issueBreakdown.high || 0,
          medium: issueBreakdown.medium || 0,
          low: issueBreakdown.low || 0
        },
        recommendations: {
          total: analysis.recommendations.length,
          quickWins: analysis.recommendations.filter(r => r.quickWin).length,
          immediate: analysis.recommendations.filter(r => r.priority === 'immediate').length
        },
        coreWebVitals: analysis.performanceMetrics?.coreWebVitals || null,
        performanceScore: analysis.performanceMetrics?.performanceScore || null,
        lastAnalyzed: analysis.createdAt,
        status: 'completed'
      };

      return res.json({ success: true, data: summary });

    } catch (error) {
      console.error('Error in getAnalysisSummary:', error);
      return next(error);
    }
  }

  private calculateGrade(score: number | null): string {
    if (!score) return 'F';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}

export const enhancedAnalysisController = new EnhancedAnalysisController(); 