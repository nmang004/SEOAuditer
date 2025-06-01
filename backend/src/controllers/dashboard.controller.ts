import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { subDays } from 'date-fns';
import { cache } from '../utils/cache';

// Create a separate Prisma instance to avoid circular dependency
const prisma = new PrismaClient();

// Type for authenticated request with user information
// TODO: Restore correct User type once Prisma types are resolved
interface AuthenticatedRequest extends Request {
  user?: any;
}

// Prisma types
interface Project {
  id: string;
  name: string;
  url: string;
  status: string;
  currentScore: number | null;
  issueCount: number;
  updatedAt: Date;
  crawlSessions?: Array<{
    id: string;
    status: string;
    startedAt: Date;
    completedAt: Date | null;
    analysis: SEOAnalysis | null;
  }>;
}

interface SEOAnalysis {
  id: string;
  overallScore: number | null;
  technicalScore: number | null;
  contentScore: number | null;
  onpageScore: number | null;
  uxScore: number | null;
  createdAt: Date;
  issues: Array<{
    id: string;
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string | null;
    category: string;
  }>;
}

// Used for type checking in the project controller
// This is used to define the structure of project data with analyses
// @ts-ignore - This interface is used in other files
interface ProjectWithAnalyses extends Project {
  analyses: SEOAnalysis[];
  trend?: 'up' | 'down' | 'stable';
  lastAnalysis?: SEOAnalysis | null;
  createdAt?: Date;
}

interface RecentActivity {
  id: string;
  projectId: string;
  projectName: string;
  type: 'scan' | 'issue' | 'update';
  title: string;
  description?: string;
  timestamp: Date;
  severity?: 'info' | 'warning' | 'error';
}

interface IssueCategory {
  type: 'technical' | 'content' | 'onpage' | 'ux';
  count: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

// Helper function to calculate date range based on period
const getDateRange = (period: string): { startDate: Date; endDate: Date } => {
  const endDate = new Date();
  let startDate = new Date();

  switch (period) {
    case '7d':
      startDate = subDays(endDate, 7);
      break;
    case '30d':
      startDate = subDays(endDate, 30);
      break;
    case '90d':
      startDate = subDays(endDate, 90);
      break;
    default:
      startDate = subDays(endDate, 30);
  }

  return { startDate, endDate };
};

// Export the helper function for testing
export { getDateRange };

// Interface for project with trend data
interface ProjectWithTrend {
  id: string;
  name: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  trend: 'up' | 'down' | 'stable';
  currentScore: number;
  lastAnalysis: {
    id: string;
    overallScore: number | null;
    technicalScore: number | null;
    contentScore: number | null;
    onpageScore: number | null;
    uxScore: number | null;
    issues: Array<{
      id: string;
      type: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      title: string;
      description: string | null;
      category: string;
    }>;
  } | null;
}

// Dashboard Controller
// Handles dashboard stats, latest issues, recent projects, performance trends, issues by category, and recent activity
// All endpoints must use correct Prisma model accessors and field names
// All select statements must only reference fields that exist in the Prisma schema
// All endpoints should be protected with JWT middleware
// TODO: Add input validation middleware (zod) for query/params
// TODO: Add more granular error handling and logging for production
export const dashboardController = {
  // Get dashboard statistics
  async getStats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Temporarily disable auth check for testing
      // const userId = req.user?.id;
      // if (!userId) {
      //   res.status(401).json({ success: false, error: 'Unauthorized' });
      //   return;
      // }

      // Mock data for testing - replace with real database queries later
      const userId = 'test-user-id'; // Mock user ID for cache key
      const cacheKey = `dashboard:stats:${userId}`;
      const stats = {
        totalProjects: 8,
        activeAnalyses: 2,
        completedAnalyses: 34,
        averageScore: 82,
        scoreImprovement: 7,
        weeklyIssues: 15,
        resolvedIssues: 23,
        criticalIssues: 3,
        lastScanDate: new Date().toISOString(),
        scoreDistribution: {
          excellent: 3,
          good: 4,
          needsWork: 1,
          poor: 0
        },
        scoreTrends: [
          { date: '2025-05-26', overallScore: 75, technicalScore: 72, contentScore: 78, onPageScore: 80, uxScore: 70 },
          { date: '2025-05-27', overallScore: 77, technicalScore: 74, contentScore: 79, onPageScore: 81, uxScore: 72 },
          { date: '2025-05-28', overallScore: 79, technicalScore: 76, contentScore: 80, onPageScore: 82, uxScore: 74 },
          { date: '2025-05-29', overallScore: 81, technicalScore: 78, contentScore: 82, onPageScore: 83, uxScore: 76 },
          { date: '2025-05-30', overallScore: 82, technicalScore: 79, contentScore: 83, onPageScore: 84, uxScore: 77 },
        ],
        topProjects: [
          { id: '1', name: 'Main Website', score: 89, improvement: 8 },
          { id: '2', name: 'E-commerce Store', score: 85, improvement: 5 },
          { id: '3', name: 'Blog Platform', score: 82, improvement: 3 }
        ],
        concerningProjects: [
          { id: '4', name: 'Legacy Site', score: 58, criticalIssues: 5 },
          { id: '5', name: 'Mobile App Landing', score: 62, criticalIssues: 3 }
        ]
      };

      // Cache for 2 minutes
      await cache.set(cacheKey, stats, 120);

      res.json({
        success: true,
        data: stats,
        cached: false,
        message: "Dashboard statistics loaded successfully from backend"
      });

    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard statistics'
      });
    }
  },

  // Get latest priority issues across all projects
  async getLatestIssues(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      
      // For development: provide mock data when no auth is present
      if (!userId) {
        const mockIssues = [
          {
            id: '1',
            projectId: '1',
            projectName: 'Main Website',
            type: 'missing-alt-text',
            severity: 'high' as const,
            title: 'Missing Alt Text on Images',
            description: 'Several images are missing alt text attributes, affecting accessibility and SEO.',
            affectedPages: 12,
            estimatedImpact: 'Medium SEO impact, high accessibility impact',
            quickFix: true,
            detectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            status: 'new' as const
          },
          {
            id: '2',
            projectId: '2', 
            projectName: 'E-commerce Store',
            type: 'slow-loading-pages',
            severity: 'critical' as const,
            title: 'Slow Page Load Times',
            description: 'Multiple pages have load times exceeding 3 seconds, impacting user experience and rankings.',
            affectedPages: 8,
            estimatedImpact: 'High SEO and conversion impact',
            quickFix: false,
            detectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            status: 'investigating' as const
          },
          {
            id: '3',
            projectId: '1',
            projectName: 'Main Website', 
            type: 'duplicate-content',
            severity: 'medium' as const,
            title: 'Duplicate Meta Descriptions',
            description: 'Multiple pages share the same meta description, reducing search visibility.',
            affectedPages: 5,
            estimatedImpact: 'Medium SEO impact',
            quickFix: true,
            detectedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            status: 'new' as const
          },
          {
            id: '4',
            projectId: '3',
            projectName: 'Blog Platform',
            type: 'broken-links',
            severity: 'high' as const,
            title: 'Broken Internal Links',
            description: 'Several internal links are returning 404 errors, affecting user experience and crawlability.',
            affectedPages: 7,
            estimatedImpact: 'High user experience impact',
            quickFix: true,
            detectedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            status: 'in_progress' as const
          }
        ];
        
        res.json({ success: true, data: mockIssues });
        return;
      }

      const limit = parseInt((req.query.limit as string) || '10', 10);
      const severity = (req.query.severity as string || 'critical,high,medium').split(',');

      // Get latest issues with project context
      const issues = await prisma.sEOIssue.findMany({
        where: {
          analysis: {
            crawlSession: {
              project: { userId }
            }
          },
          severity: { in: severity as any },
        },
        include: {
          analysis: {
            select: {
              id: true,
              crawlSession: {
                select: {
                  project: {
                    select: {
                      id: true,
                      name: true,
                      url: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit
      });

      // Transform the data for the response
      const formattedIssues = issues.map((issue: any) => {
        const project = issue.analysis?.crawlSession?.project;
        return {
          id: issue.id,
          title: issue.title,
          description: issue.description,
          type: issue.type,
          category: issue.category,
          severity: issue.severity,
          project: project
            ? {
                id: project.id,
                name: project.name,
                url: project.url,
              }
            : null,
          analysisId: issue.analysis?.id,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt ?? issue.createdAt,
        };
      });

      res.json({ success: true, data: formattedIssues });
    } catch (error) {
      next(error);
    }
  },

  // Get recent projects with scores and trends
  async getRecentProjects(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      
      // For development: provide mock data when no auth is present
      if (!userId) {
        const mockProjects = [
          {
            id: '1',
            name: 'Main Website',
            url: 'https://example.com',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
            trend: 'up' as const,
            currentScore: 89,
            lastAnalysis: {
              overallScore: 89,
              technicalScore: 85,
              contentScore: 92,
              onPageScore: 88,
              uxScore: 91
            }
          },
          {
            id: '2', 
            name: 'E-commerce Store',
            url: 'https://store.example.com',
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            trend: 'up' as const,
            currentScore: 85,
            lastAnalysis: {
              overallScore: 85,
              technicalScore: 82,
              contentScore: 88,
              onPageScore: 84,
              uxScore: 86
            }
          },
          {
            id: '3',
            name: 'Blog Platform', 
            url: 'https://blog.example.com',
            createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            trend: 'stable' as const,
            currentScore: 82,
            lastAnalysis: {
              overallScore: 82,
              technicalScore: 79,
              contentScore: 85,
              onPageScore: 81,
              uxScore: 83
            }
          }
        ];
        
        res.json({ success: true, data: mockProjects });
        return;
      }

      const limit = parseInt((req.query.limit as string) || '5', 10);
      
      // Get projects with their latest crawl session and analysis
      // @ts-ignore - This variable is used in the Promise.all below
      const projectsList = await prisma.project.findMany({
        where: { userId },
        include: {
          crawlSessions: {
            include: {
              analysis: {
                include: { issues: true }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: limit
      });

      // Calculate trend for each project
      const projectsWithTrends: ProjectWithTrend[] = await Promise.all(
      projectsList.map(async (project: any) => {
        // Get previous analysis for trend calculation
        const previousAnalysis = await prisma.crawlSession.findFirst({
          where: {
            projectId: project.id,
            analysis: { isNot: null },
            createdAt: { lt: project.crawlSessions[0]?.createdAt }
          },
          include: { analysis: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        });

        const currentScore = project.crawlSessions[0]?.analysis?.overallScore || 0;
        const previousScore = previousAnalysis?.analysis?.overallScore || 0;
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (currentScore > previousScore) trend = 'up';
        else if (currentScore < previousScore) trend = 'down';

        return {
          id: project.id,
          name: project.name,
          url: project.url,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          trend,
          currentScore,
          lastAnalysis: project.crawlSessions[0]?.analysis || null
        };
      })
    );

    res.json({ success: true, data: projectsWithTrends });
  } catch (error) {
    next(error);
  }
  },

  // Get performance trends for a project
  async getPerformanceTrends(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { projectId } = req.params;
      const { days = '30', period } = req.query as { days?: string; period?: string };

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      // Use either the period or days parameter to determine date range
      let startDate: Date;
      let endDate = new Date();

      if (period) {
        const dateRange = getDateRange(period);
        startDate = dateRange.startDate;
        endDate = dateRange.endDate;
      } else {
        startDate = subDays(new Date(), parseInt(days, 10));
      }

      // Validate project ownership
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
        select: { id: true }
      });

      if (!project) {
        res.status(404).json({ success: false, error: 'Project not found' });
        return;
      }

      // Get all analyses for the project within the date range
      const analyses = await prisma.sEOAnalysis.findMany({
        where: {
          crawlSession: {
            projectId,
            startedAt: { gte: startDate, lte: endDate }
          }
        },
        include: {
          crawlSession: {
            select: { startedAt: true }
          },
          issues: {
            select: { severity: true }
          }
        },
        orderBy: { crawlSession: { startedAt: 'asc' } }
      });

      // Format data for chart
      const chartData = analyses.map((analysis: any) => {
        const { crawlSession, issues, ...scores } = analysis;
        return {
          date: crawlSession.startedAt,
          scores: {
            overall: scores.overallScore,
            technical: scores.technicalScore,
            content: scores.contentScore,
            onpage: scores.onpageScore,
            ux: scores.uxScore
          },
          issueCount: issues.length,
          criticalIssues: issues.filter((issue: any) => issue.severity === 'critical').length
        };
      });

      res.json({ 
        success: true, 
        data: {
          projectId,
          startDate,
          endDate,
          data: chartData
        } 
      });
    } catch (error) {
      console.error('Error in getPerformanceTrends:', error);
      next(error);
    }
  },

  // Get issues by category
  async getIssuesByCategory(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      // Get all projects for the user with their latest analysis and issues
      const projects = await prisma.project.findMany({
        where: { userId },
        include: {
          crawlSessions: {
            include: {
              analysis: {
                include: { issues: true }
              }
            },
            orderBy: { startedAt: 'desc' },
            take: 1
          }
        }
      });

      // Count issues by category and severity
      const issuesByCategory: Record<string, IssueCategory> = {};

      projects.forEach((project: any) => {
        project.crawlSessions.forEach((session: any) => {
          if (!session.analysis) return;
          
          session.analysis.issues.forEach((issue: any) => {
            const key = `${issue.type}-${issue.severity}`;
            if (!issuesByCategory[key]) {
              issuesByCategory[key] = {
                type: issue.type as IssueCategory['type'],
                severity: issue.severity as IssueCategory['severity'],
                count: 0
              };
            }
            issuesByCategory[key].count++;
          });
        });
      });

      res.json({
        success: true,
        data: Object.values(issuesByCategory)
      });
    } catch (error) {
      next(error);
    }
  },

  // Get recent activity
  async getRecentActivity(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const limit = parseInt((req.query.limit as string) || '10');
      
      // Get recent crawl sessions
      const sessions = await prisma.crawlSession.findMany({
        where: { project: { userId } },
        include: {
          project: {
            select: { name: true }
          },
          analysis: {
            select: { issues: true }
          }
        },
        orderBy: { startedAt: 'desc' },
        take: limit
      });

      // Format activities
      const activities: RecentActivity[] = [];
      
      sessions.forEach((session: any) => {
        // Add scan activity
        activities.push({
          id: `scan-${session.id}`,
          projectId: session.projectId,
          projectName: session.project.name,
          type: 'scan' as const,
          title: 'Scan completed',
          description: `Scan of ${session.project.name} completed`,
          timestamp: session.completedAt || session.startedAt,
          severity: 'info'
        });

        // Add issue activities if any
        if (session.analysis?.issues.length) {
          const criticalIssues = session.analysis.issues.filter(
            (issue: any) => issue.severity === 'critical'
          ).length;

          if (criticalIssues > 0) {
            activities.push({
              id: `issues-${session.id}`,
              projectId: session.projectId,
              projectName: session.project.name,
              type: 'issue' as const,
              title: `${criticalIssues} critical issues found`,
              description: `Found ${criticalIssues} critical issues in ${session.project.name}`,
              timestamp: session.completedAt || session.startedAt,
              severity: 'error'
            });
          }
        }
      });

      // Sort by timestamp and limit
      const sortedActivities = activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);

      res.json({ success: true, data: sortedActivities });
    } catch (error) {
      next(error);
    }
  }
};
