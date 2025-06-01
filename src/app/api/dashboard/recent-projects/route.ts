import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '5');
    const page = parseInt(url.searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    // Get recent projects with their latest analysis data
    const [projects, totalCount] = await Promise.all([
      prisma.project.findMany({
        where: { status: 'active' },
        include: {
          analyses: {
            take: 2,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              overallScore: true,
              createdAt: true,
              issues: {
                where: { status: { not: 'resolved' } },
                select: { id: true, severity: true }
              }
            }
          },
          crawlSessions: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              status: true,
              completedAt: true
            }
          }
        },
        orderBy: [
          { lastScanDate: 'desc' },
          { updatedAt: 'desc' }
        ],
        take: limit,
        skip: offset
      }),

      prisma.project.count({
        where: { status: 'active' }
      })
    ]);

    // Transform projects data
    const recentProjects = projects.map(project => {
      const latestAnalysis = project.analyses[0];
      const previousAnalysis = project.analyses[1];
      const latestCrawl = project.crawlSessions[0];

      // Calculate trend
      let trend: 'up' | 'down' | 'neutral' = 'neutral';
      let trendPercentage = 0;
      
      if (latestAnalysis && previousAnalysis) {
        const scoreDiff = (latestAnalysis.overallScore || 0) - (previousAnalysis.overallScore || 0);
        if (scoreDiff > 2) trend = 'up';
        else if (scoreDiff < -2) trend = 'down';
        trendPercentage = Math.abs(scoreDiff);
      }

      // Count issues by severity
      const issueCount = latestAnalysis?.issues?.length || 0;
      const criticalIssues = latestAnalysis?.issues?.filter(i => i.severity === 'critical').length || 0;

      return {
        id: project.id,
        name: project.name,
        url: project.url,
        favicon: project.faviconUrl || `https://www.google.com/s2/favicons?domain=${new URL(project.url).hostname}`,
        currentScore: project.currentScore || latestAnalysis?.overallScore || 0,
        lastAnalyzed: latestAnalysis?.createdAt?.toISOString() || project.lastScanDate?.toISOString(),
        lastScanDate: project.lastScanDate || latestAnalysis?.createdAt || project.updatedAt,
        issueCount,
        criticalIssues,
        trend,
        trendPercentage,
        status: latestCrawl?.status || 'completed',
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        // Additional metadata for enhanced display
        lastCompletedScan: latestCrawl?.completedAt,
        hasRecentActivity: project.lastScanDate ? 
          (Date.now() - project.lastScanDate.getTime()) < 7 * 24 * 60 * 60 * 1000 : false,
        scoreHistory: project.analyses.map(a => ({
          score: a.overallScore,
          date: a.createdAt
        }))
      };
    });

    return NextResponse.json({
      success: true,
      data: recentProjects,
      total: totalCount,
      page,
      pageSize: limit,
      hasMore: offset + limit < totalCount,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Recent projects error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch recent projects',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 