import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Get user from token
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user access
    const userId = await verifyTokenAndGetUserId(token);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get insights from backend
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/crawl/sessions/${sessionId}/insights`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Crawl session not found' },
          { status: 404 }
        );
      }
      throw new Error(`Backend responded with status ${response.status}`);
    }

    const insights = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        insights: {
          duplicateContent: insights.duplicateContent || [],
          orphanPages: insights.orphanPages || [],
          brokenLinks: insights.brokenLinks || [],
          siteStructure: insights.siteStructure || {
            depth: 0,
            totalPages: 0,
            pagesByDepth: {},
            linkDensity: {}
          },
          contentGaps: insights.contentGaps || [],
          crossPageInsights: insights.crossPageInsights || [],
          technicalIssues: insights.technicalIssues || [],
          performanceInsights: insights.performanceInsights || []
        },
        summary: {
          totalInsights: insights.totalInsights || 0,
          criticalInsights: insights.criticalInsights || 0,
          duplicateContentGroups: insights.duplicateContent?.length || 0,
          orphanPagesCount: insights.orphanPages?.length || 0,
          brokenLinksCount: insights.brokenLinks?.length || 0,
          avgPageScore: insights.avgPageScore || 0,
          scoreTrend: insights.scoreTrend || 0
        },
        recommendations: {
          quickWins: insights.quickWins || [],
          technicalFixes: insights.technicalFixes || [],
          contentImprovements: insights.contentImprovements || [],
          structureOptimizations: insights.structureOptimizations || []
        }
      }
    });

  } catch (error) {
    console.error('Error getting crawl insights:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function verifyTokenAndGetUserId(token: string): Promise<string | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.userId;
    }
    
    return null;
  } catch {
    return null;
  }
}