import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analysisCacheService } from '../../../../../backend/src/services/AnalysisCacheService';

export async function GET(request: NextRequest) {
  try {
    // Get user from auth (implement your auth logic here)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract user ID from token (implement your JWT decode logic)
    const userId = 'user-id'; // Replace with actual user ID from token

    // Check cache first
    const cacheKey = `recent-projects:${userId}`;
    const cached = await analysisCacheService.get<any[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached, cached: true });
    }

    // Get user's recent projects with latest analysis data
    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        crawlSessions: {
          include: {
            analysis: {
              include: {
                issues: {
                  where: {
                    severity: 'critical'
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { lastScanDate: 'desc' },
      take: 10
    });

    const recentProjects = projects.map(project => {
      const latestSession = project.crawlSessions[0];
      const analysis = latestSession?.analysis;
      
      return {
        id: project.id,
        name: project.name,
        url: project.url,
        favicon: `https://www.google.com/s2/favicons?domain=${new URL(project.url).hostname}`,
        currentScore: analysis?.overallScore || 0,
        previousScore: (analysis as any)?.previousScore || 0, // Type assertion for now
        lastScanDate: project.lastScanDate || new Date(),
        status: latestSession?.status === 'completed' ? 'completed' as const :
                latestSession?.status === 'in_progress' ? 'analyzing' as const :
                latestSession?.status === 'pending' ? 'queued' as const : 'error' as const,
        criticalIssues: analysis?.issues?.length || 0,
        progress: latestSession?.status === 'in_progress' ? Math.floor(Math.random() * 80) + 10 : undefined
      };
    });

    // Cache for 2 minutes
    await analysisCacheService.set(cacheKey, recentProjects, { ttl: 120 });

    return NextResponse.json({
      success: true,
      data: recentProjects
    });

  } catch (error) {
    console.error('Recent projects error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recent projects' },
      { status: 500 }
    );
  }
} 