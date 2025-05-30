import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface DashboardStats {
  totalProjects: number;
  activeAnalyses: number;
  completedAnalyses: number;
  averageScore: number;
  scoreImprovement: number;
  weeklyIssues: number;
  resolvedIssues: number;
  criticalIssues: number;
  lastScanDate: string;
  
  scoreDistribution: {
    excellent: number;    // 80-100
    good: number;        // 60-79
    needsWork: number;   // 40-59
    poor: number;        // 0-39
  };
  
  scoreTrends: Array<{
    date: string;
    overallScore: number;
    technicalScore: number;
    contentScore: number;
    onPageScore: number;
    uxScore: number;
  }>;
  
  topProjects: Array<{
    id: string;
    name: string;
    score: number;
    improvement: number;
  }>;
  
  concerningProjects: Array<{
    id: string;
    name: string;
    score: number;
    criticalIssues: number;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    // Get user from auth (implement your auth logic here)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract user ID from token (implement your JWT decode logic)
    const userId = 'user-id'; // Replace with actual user ID from token

    // Get user's projects
    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        crawlSessions: {
          include: {
            analysis: {
              include: {
                issues: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    const totalProjects = projects.length;

    // Get active analyses (in progress)
    const activeAnalyses = await prisma.crawlSession.count({
      where: {
        projectId: { in: projects.map(p => p.id) },
        status: { in: ['pending', 'in_progress'] }
      }
    });

    // Get completed analyses
    const completedAnalyses = await prisma.crawlSession.count({
      where: {
        projectId: { in: projects.map(p => p.id) },
        status: 'completed'
      }
    });

    // Calculate average score from latest analyses
    const latestAnalyses = await prisma.sEOAnalysis.findMany({
      where: {
        projectId: { in: projects.map(p => p.id) }
      },
      orderBy: { createdAt: 'desc' },
      take: totalProjects
    });

    const averageScore = latestAnalyses.length > 0
      ? Math.round(latestAnalyses.reduce((sum, analysis) => sum + (analysis.overallScore || 0), 0) / latestAnalyses.length)
      : 0;

    // Calculate score improvement (compare with previous analyses)
    const previousAnalyses = await prisma.sEOAnalysis.findMany({
      where: {
        projectId: { in: projects.map(p => p.id) },
        createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // 30 days ago
      },
      orderBy: { createdAt: 'desc' },
      take: totalProjects
    });

    const previousAverageScore = previousAnalyses.length > 0
      ? Math.round(previousAnalyses.reduce((sum, analysis) => sum + (analysis.overallScore || 0), 0) / previousAnalyses.length)
      : averageScore;

    const scoreImprovement = averageScore - previousAverageScore;

    // Get weekly issues (last 7 days)
    const weeklyIssues = await prisma.sEOIssue.count({
      where: {
        analysis: {
          projectId: { in: projects.map(p => p.id) }
        },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    });

    // Get resolved issues (last 7 days)
    const resolvedIssues = await prisma.sEOIssue.count({
      where: {
        analysis: {
          projectId: { in: projects.map(p => p.id) }
        },
        status: 'fixed',
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    });

    // Get critical issues
    const criticalIssues = await prisma.sEOIssue.count({
      where: {
        analysis: {
          projectId: { in: projects.map(p => p.id) }
        },
        severity: 'critical',
        status: { notIn: ['fixed', 'ignored'] }
      }
    });

    // Calculate score distribution
    const scoreDistribution = {
      excellent: latestAnalyses.filter(a => (a.overallScore || 0) >= 80).length,
      good: latestAnalyses.filter(a => (a.overallScore || 0) >= 60 && (a.overallScore || 0) < 80).length,
      needsWork: latestAnalyses.filter(a => (a.overallScore || 0) >= 40 && (a.overallScore || 0) < 60).length,
      poor: latestAnalyses.filter(a => (a.overallScore || 0) < 40).length
    };

    // Mock score trends for now (replace with real data)
    const scoreTrends = [
      { date: '2025-05-25', overallScore: 72, technicalScore: 68, contentScore: 75, onPageScore: 80, uxScore: 70 },
      { date: '2025-05-26', overallScore: 74, technicalScore: 70, contentScore: 76, onPageScore: 81, uxScore: 72 },
      { date: '2025-05-27', overallScore: 73, technicalScore: 69, contentScore: 77, onPageScore: 79, uxScore: 71 },
      { date: '2025-05-28', overallScore: 75, technicalScore: 71, contentScore: 78, onPageScore: 82, uxScore: 73 },
      { date: '2025-05-29', overallScore: 76, technicalScore: 72, contentScore: 79, onPageScore: 83, uxScore: 74 },
    ];

    // Get top performing projects
    const topProjects = projects
      .filter(p => p.crawlSessions[0]?.analysis?.overallScore)
      .sort((a, b) => (b.crawlSessions[0].analysis!.overallScore || 0) - (a.crawlSessions[0].analysis!.overallScore || 0))
      .slice(0, 5)
      .map(project => ({
        id: project.id,
        name: project.name,
        score: project.crawlSessions[0].analysis!.overallScore || 0,
        improvement: (project.crawlSessions[0].analysis!.overallScore || 0) - ((project.crawlSessions[0].analysis! as any).previousScore || 0)
      }));

    // Get concerning projects (low scores or high critical issues)
    const concerningProjects = projects
      .filter(p => {
        const analysis = p.crawlSessions[0]?.analysis;
        if (!analysis) return false;
        const criticalCount = analysis.issues.filter(issue => issue.severity === 'critical').length;
        return (analysis.overallScore || 0) < 60 || criticalCount > 3;
      })
      .slice(0, 5)
      .map(project => ({
        id: project.id,
        name: project.name,
        score: project.crawlSessions[0].analysis!.overallScore || 0,
        criticalIssues: project.crawlSessions[0].analysis!.issues.filter(issue => issue.severity === 'critical').length
      }));

    // Get last scan date
    const lastScan = await prisma.crawlSession.findFirst({
      where: {
        projectId: { in: projects.map(p => p.id) },
        completedAt: { not: null }
      },
      orderBy: { completedAt: 'desc' }
    });

    const stats: DashboardStats = {
      totalProjects,
      activeAnalyses,
      completedAnalyses,
      averageScore,
      scoreImprovement,
      weeklyIssues,
      resolvedIssues,
      criticalIssues,
      lastScanDate: lastScan?.completedAt?.toISOString() || new Date().toISOString(),
      scoreDistribution,
      scoreTrends,
      topProjects,
      concerningProjects
    };

    return NextResponse.json({
      success: true,
      data: stats,
      cached: false
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
} 