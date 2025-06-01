import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConnected } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check if database is available
    if (!isDatabaseConnected()) {
      return NextResponse.json({
        success: true,
        data: {
          totalProjects: 0,
          totalAnalyses: 0,
          averageScore: 0,
          trendsData: [],
          recentActivity: []
        }
      });
    }
    // Calculate real-time statistics from database
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Parallel queries for better performance
    const [
      totalProjects,
      activeAnalyses,
      completedAnalyses,
      avgScoreData,
      weeklyIssuesCount,
      resolvedIssuesCount,
      criticalIssuesCount,
      scoreTrendsData,
      topProjectsData,
      concerningProjectsData,
      scoreDistribution
    ] = await Promise.all([
      // Total projects count
      prisma.project.count({
        where: { status: 'active' }
      }),

      // Active analyses (in progress)
      prisma.crawlSession.count({
        where: { 
          status: { in: ['queued', 'running'] },
          createdAt: { gte: weekAgo }
        }
      }),

      // Completed analyses
      prisma.sEOAnalysis.count({
        where: { createdAt: { gte: monthAgo } }
      }),

      // Average score across all projects
      prisma.sEOAnalysis.aggregate({
        _avg: { overallScore: true },
        where: { 
          createdAt: { gte: monthAgo },
          overallScore: { not: null }
        }
      }),

      // Weekly issues count
      prisma.sEOIssue.count({
        where: { 
          createdAt: { gte: weekAgo },
          severity: { in: ['high', 'critical'] }
        }
      }),

      // Resolved issues this week
      prisma.sEOIssue.count({
        where: {
          status: 'resolved',
          createdAt: { gte: weekAgo }
        }
      }),

      // Critical issues count
      prisma.sEOIssue.count({
        where: {
          severity: 'critical',
          status: { not: 'resolved' }
        }
      }),

      // Score trends for the last 7 days
      prisma.sEOAnalysis.findMany({
        where: {
          createdAt: { gte: weekAgo },
          overallScore: { not: null }
        },
        select: {
          createdAt: true,
          overallScore: true,
          technicalScore: true,
          contentScore: true,
          onpageScore: true,
          uxScore: true
        },
        orderBy: { createdAt: 'asc' }
      }),

      // Top performing projects
      prisma.project.findMany({
        where: {
          currentScore: { not: null, gte: 80 },
          status: 'active'
        },
        select: {
          id: true,
          name: true,
          currentScore: true,
          analyses: {
            take: 2,
            orderBy: { createdAt: 'desc' },
            select: { overallScore: true }
          }
        },
        orderBy: { currentScore: 'desc' },
        take: 3
      }),

      // Concerning projects (low scores or high critical issues)
      prisma.project.findMany({
        where: {
          OR: [
            { currentScore: { lt: 70 } },
            { 
              analyses: {
                some: {
                  issues: {
                    some: {
                      severity: 'critical',
                      status: { not: 'resolved' }
                    }
                  }
                }
              }
            }
          ],
          status: 'active'
        },
        select: {
          id: true,
          name: true,
          currentScore: true,
          analyses: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              issues: {
                where: {
                  severity: 'critical',
                  status: { not: 'resolved' }
                },
                select: { id: true }
              }
            }
          }
        },
        take: 5
      }),

      // Score distribution
      prisma.project.groupBy({
        by: ['currentScore'],
        where: {
          currentScore: { not: null },
          status: 'active'
        },
        _count: { id: true }
      })
    ]);

    // Process score trends into daily aggregates
    const scoreTrendsByDay = new Map();
    scoreTrendsData.forEach((analysis: any) => {
      const day = analysis.createdAt.toISOString().split('T')[0];
      if (!scoreTrendsByDay.has(day)) {
        scoreTrendsByDay.set(day, {
          date: day,
          overallScores: [],
          technicalScores: [],
          contentScores: [],
          onPageScores: [],
          uxScores: []
        });
      }
      const dayData = scoreTrendsByDay.get(day);
      if (analysis.overallScore) dayData.overallScores.push(analysis.overallScore);
      if (analysis.technicalScore) dayData.technicalScores.push(analysis.technicalScore);
      if (analysis.contentScore) dayData.contentScores.push(analysis.contentScore);
      if (analysis.onpageScore) dayData.onPageScores.push(analysis.onpageScore);
      if (analysis.uxScore) dayData.uxScores.push(analysis.uxScore);
    });

    // Calculate daily averages
    const scoreTrends = Array.from(scoreTrendsByDay.values()).map(day => ({
      date: day.date,
      overallScore: Math.round(day.overallScores.reduce((a: number, b: number) => a + b, 0) / (day.overallScores.length || 1)),
      technicalScore: Math.round(day.technicalScores.reduce((a: number, b: number) => a + b, 0) / (day.technicalScores.length || 1)),
      contentScore: Math.round(day.contentScores.reduce((a: number, b: number) => a + b, 0) / (day.contentScores.length || 1)),
      onPageScore: Math.round(day.onPageScores.reduce((a: number, b: number) => a + b, 0) / (day.onPageScores.length || 1)),
      uxScore: Math.round(day.uxScores.reduce((a: number, b: number) => a + b, 0) / (day.uxScores.length || 1)),
    }));

    // Calculate score improvement (comparing last two analyses across all projects)
    const recentAnalyses = await prisma.sEOAnalysis.findMany({
      where: { 
        createdAt: { gte: monthAgo },
        overallScore: { not: null }
      },
      select: { 
        overallScore: true, 
        projectId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Calculate score improvement by comparing recent vs older analyses
    const scoreImprovement = 0; // Simplified for now

    // Process score distribution
    const distribution = { excellent: 0, good: 0, needsWork: 0, poor: 0 };
    scoreDistribution.forEach((group: any) => {
      const score = group.currentScore || 0;
      const count = group._count.id;
      if (score >= 80) distribution.excellent += count;
      else if (score >= 60) distribution.good += count;
      else if (score >= 40) distribution.needsWork += count;
      else distribution.poor += count;
    });

    // Transform top projects data
    const topProjects = topProjectsData.map((project: any) => ({
      id: project.id,
      name: project.name,
      score: project.currentScore || 0,
      improvement: project.analyses.length >= 2 
        ? (project.analyses[0]?.overallScore || 0) - (project.analyses[1]?.overallScore || 0)
        : 0
    }));

    // Transform concerning projects data
    const concerningProjects = concerningProjectsData.map((project: any) => ({
      id: project.id,
      name: project.name,
      score: project.currentScore || 0,
      criticalIssues: project.analyses[0]?.issues?.length || 0
    }));

    const dashboardStats = {
      totalProjects,
      activeAnalyses,
      completedAnalyses,
      averageScore: Math.round(avgScoreData._avg.overallScore || 0),
      scoreImprovement: Math.round(scoreImprovement),
      weeklyIssues: weeklyIssuesCount,
      resolvedIssues: resolvedIssuesCount,
      criticalIssues: criticalIssuesCount,
      lastScanDate: now.toISOString(),
      scoreDistribution: distribution,
      scoreTrends,
      topProjects,
      concerningProjects
    };

    return NextResponse.json({
      success: true,
      data: dashboardStats,
      cached: false,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 