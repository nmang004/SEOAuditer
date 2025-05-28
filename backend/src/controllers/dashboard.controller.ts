import type { Request, Response, NextFunction } from 'express';
import { prisma } from '..';
import { subDays } from 'date-fns';

// Type for authenticated request with user information
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
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

interface ProjectWithAnalyses extends Project {
  analyses: SEOAnalysis[];
  trend?: 'up' | 'down' | 'stable';
  lastAnalysis?: SEOAnalysis | null;
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

      // Define the IssueWithAnalysis type for better type safety
      type IssueWithAnalysis = {
        id: string;
        title: string;
        description: string | null;
        type: string;
        severity: 'critical' | 'high' | 'medium' | 'low';
        category: string;
        analysis: {
          id: string;
          crawlSession: {
            id: string;
            project: {
              id: string;
              name: string;
              url: string;
            };
          };
          createdAt: Date;
          updatedAt: Date;
        };
        createdAt: Date;
        updatedAt: Date;
      };

      // Transform the data for the response
      const formattedIssues = issues.map((issue: IssueWithAnalysis) => {
        const project = issue.analysis.crawlSession.project;
        return {
          id: issue.id,
          title: issue.title,
          description: issue.description,
          type: issue.type,
          category: issue.category,
          severity: issue.severity,
          project: {
            id: project.id,
            name: project.name,
            url: project.url
          },
          analysisId: issue.analysis.id,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt
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
      const projects = await prisma.project.findMany({
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

      // Define the ProjectWithAnalyses type for better type safety
      type ProjectWithAnalyses = Project & {
        id: string;
        name: string;
        url: string;
        status: string;
        currentScore: number | null;
        issueCount: number;
        updatedAt: Date;
        crawlSessions: Array<{
          id: string;
          status: string;
          startedAt: Date;
          completedAt: Date | null;
          createdAt: Date;
          updatedAt: Date;
          analysis: (SEOAnalysis & {
            issues: Array<{
              id: string;
              type: string;
              severity: 'critical' | 'high' | 'medium' | 'low';
              title: string;
              description: string | null;
              category: string;
              createdAt: Date;
              updatedAt: Date;
            }>;
          }) | null;
        }>;
      };

      // Calculate trend for each project
      const projectsWithTrends: ProjectWithTrend[] = await Promise.all(
        projects.map(async (project: ProjectWithAnalyses) => {
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
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const limit = parseInt((req.query.limit as string) || '5', 10);
      
      // Get projects with their latest crawl session and analysis
      const projects = await prisma.project.findMany({
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
      const projectsWithTrends = await Promise.all(
        projects.map(async (project) => {
          // Get previous analysis for trend calculation
          const previousAnalysis = await prisma.crawlSession.findFirst({
            where: {
              projectId: project.id,
              analysis: { isNot: null }
            },
            include: { analysis: true },
            orderBy: { createdAt: 'desc' },
            skip: 1,
            take: 1
          });

          const currentScore = project.crawlSessions[0]?.analysis?.overallScore || 0;
          const previousScore = previousAnalysis?.analysis?.overallScore || 0;
          
          let trend: 'up' | 'down' | 'stable' = 'stable';
          if (currentScore > previousScore) trend = 'up';
          else if (currentScore < previousScore) trend = 'down';

          return {
            ...project,
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
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const limit = parseInt((req.query.limit as string) || '5');
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
            take: 2 // Get last 2 analyses for trend calculation
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: limit
      });

      const projectsWithTrends = projects.map(project => {
        const scores = project.crawlSessions
          .filter(session => session.analysis?.overallScore !== null)
          .map(session => session.analysis?.overallScore || 0);

        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (scores.length >= 2) {
          const [current, previous] = scores.slice(0, 2);
          if (current > previous) trend = 'up';
          else if (current < previous) trend = 'down';
        }

        const lastAnalysis = project.crawlSessions[0]?.analysis;
        
        return {
          ...project,
          trend,
          lastAnalysis,
          analyses: project.crawlSessions.map(s => s.analysis).filter(Boolean) as SEOAnalysis[]
        };
      });

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
            select: { 
              id: true,
              severity: true,
              type: true,
              title: true,
              description: true,
              category: true
            }
          }
        },
        orderBy: { crawlSession: { startedAt: 'asc' } }
      });

      // Define the Issue type for better type safety
      type Issue = {
        id: string;
        type: string;
        severity: 'critical' | 'high' | 'medium' | 'low';
        title: string;
        description: string | null;
        category: string;
      };

      // Format data for chart with proper typing
      const chartData = analyses.map((analysis: {
        crawlSession: { startedAt: Date };
        issues: Issue[];
        overallScore: number | null;
        technicalScore: number | null;
        contentScore: number | null;
        onpageScore: number | null;
        uxScore: number | null;
      }) => {
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
          criticalIssues: issues.filter((issue: Issue) => issue.severity === 'critical').length,
          issues: issues.map((issue: Issue) => ({
            id: issue.id,
            type: issue.type,
            severity: issue.severity,
            title: issue.title,
            description: issue.description,
            category: issue.category
          }))
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

      const { projectId } = req.params;
      
      // Get all issues for the project, grouped by category
      const issuesByCategory = await prisma.sEOIssue.groupBy({
        by: ['category'],
        where: {
          analysis: {
            crawlSession: {
              projectId,
              project: { userId }
            }
          }
        },
        _count: {
          _all: true
        },
        orderBy: {
          _count: {
            _all: 'desc'
          }
        }
      });

      res.json({ success: true, data: issuesByCategory });
    } catch (error) {
      next(error);
    }
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { projectId } = req.params;
      const period = (req.query.period as string) || '30d';
      
      // Validate project ownership
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
        select: { id: true }
      });

      if (!project) {
        throw new Error('Project not found or access denied');
      }

      // Calculate date range based on period
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

      // Get all analyses for the project within the date range
      const analyses = await prisma.sEOAnalysis.findMany({
        where: {
          crawlSession: {
            projectId,
            startedAt: { gte: startDate }
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
      const data = analyses.map(analysis => ({
        date: analysis.crawlSession.startedAt,
        scores: {
          overall: analysis.overallScore,
          technical: analysis.technicalScore,
          content: analysis.contentScore,
          onpage: analysis.onpageScore,
          ux: analysis.uxScore
        },
        issueCount: analysis.issues.length,
        criticalIssues: analysis.issues.filter(i => i.severity === 'critical').length
      }));

      res.json({ 
        success: true, 
        data: {
          projectId,
          period,
          startDate,
          endDate,
    } catch (error) {
      next(error);
    }
  },

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

      projects.forEach(project => {
        project.crawlSessions.forEach(session => {
          if (!session.analysis) return;
          
          session.analysis.issues.forEach(issue => {
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
      
      sessions.forEach(session => {
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
            issue => issue.severity === 'critical'
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
      const chartData = analyses.map((analysis) => {
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
          criticalIssues: issues.filter(issue => issue.severity === 'critical').length
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
      next(error);
    }
  }
};
