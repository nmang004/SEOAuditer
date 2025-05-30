import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Get database instance (will be mock during build time)
    const db = await getDatabase();

    // Get user from auth (implement your auth logic here)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract user ID from token (implement your JWT decode logic)
    const userId = 'user-id'; // Replace with actual user ID from token

    // Get user's recent projects with latest analysis data
    const projects = await db.project.findMany({
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

    const recentProjects = projects.map((project: any) => {
      const latestSession = project.crawlSessions[0];
      const analysis = latestSession?.analysis;
      
      return {
        id: project.id,
        name: project.name,
        url: project.url,
        favicon: `https://www.google.com/s2/favicons?domain=${new URL(project.url).hostname}`,
        currentScore: analysis?.overallScore || 0,
        previousScore: (analysis as any)?.previousScore || 0,
        lastScanDate: project.lastScanDate || new Date(),
        status: latestSession?.status === 'completed' ? 'completed' as const :
                latestSession?.status === 'in_progress' ? 'analyzing' as const :
                latestSession?.status === 'pending' ? 'queued' as const : 'error' as const,
        criticalIssues: analysis?.issues?.length || 0,
        progress: latestSession?.status === 'in_progress' ? Math.floor(Math.random() * 80) + 10 : undefined
      };
    });

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