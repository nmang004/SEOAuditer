import type { Request, Response, NextFunction } from 'express';
import { prisma } from '..';
import { subDays } from 'date-fns';
import { cache } from '../utils/cache';

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

interface DashboardStats {
  totalProjects: number;
  activeAnalyses: number;
  averageScore: number;
  weeklyIssues: number;
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
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const cacheKey = `dashboard:stats:${userId}`;
      const cached = await cache.get<DashboardStats>(cacheKey);
      if (cached) {
        res.json({ success: true, data: cached, cached: true });
        return;
      }

      // Get total projects
      const totalProjects = await prisma.project.count({
        where: { userId }
      });

      // Get active analyses (last 7 days)
      const activeAnalyses = await prisma.crawlSession.count({
        where: {
          project: { userId },
          startedAt: { gte: subDays(new Date(), 7) }
        }
      });

      // Get average score
      const avgScore = await prisma.sEOAnalysis.aggregate({
        where: {
          crawlSession: {
            project: { userId }
          }
        },
        _avg: { overallScore: true }
      });

      // Get weekly issues
      const weeklyIssues = await prisma.sEOIssue.count({
        where: {
          analysis: {
            crawlSession: {
              project: { userId },
              startedAt: { gte: subDays(new Date(), 7) }
            }
          }
        }
      });

      const stats: DashboardStats = {
        totalProjects,
        activeAnalyses,
        averageScore: avgScore._avg.overallScore || 0,
        weeklyIssues
      };

      await cache.set(cacheKey, stats, 300);

      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
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
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
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
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
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
