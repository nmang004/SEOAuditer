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

    // Verify user access to this session
    const userId = await verifyTokenAndGetUserId(token);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get session status from backend
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/crawl/sessions/${sessionId}/status`,
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

    const sessionData = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        sessionId: sessionData.sessionId,
        status: sessionData.status,
        crawlType: sessionData.crawlType,
        startUrl: sessionData.startUrl,
        progress: {
          crawled: sessionData.pagesCrawled || 0,
          total: sessionData.totalPages || 0,
          successful: sessionData.successfulPages || 0,
          errors: sessionData.errorPages || 0,
          currentUrl: sessionData.currentUrl || '',
          pagesPerMinute: sessionData.pagesPerMinute || 0,
          estimatedTimeRemaining: sessionData.estimatedTimeRemaining || 0
        },
        summary: {
          avgScore: sessionData.avgScore || 0,
          totalIssues: sessionData.totalIssues || 0,
          criticalIssues: sessionData.criticalIssues || 0,
          duration: sessionData.duration || 0
        },
        timestamps: {
          startedAt: sessionData.startedAt,
          completedAt: sessionData.completedAt,
          createdAt: sessionData.createdAt
        },
        config: sessionData.config,
        results: sessionData.status === 'completed' ? sessionData.results : null
      }
    });

  } catch (error) {
    console.error('Error getting crawl status:', error);
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