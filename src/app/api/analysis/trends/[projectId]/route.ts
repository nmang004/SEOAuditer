import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  console.log('[Trends API] GET /api/analysis/trends/[projectId] called');
  
  try {
    const authHeader = request.headers.get('authorization');
    const { projectId } = await context.params;
    console.log('[Trends API] Project ID:', projectId);

    // Check if this is an admin bypass token
    const isAdminBypass = authHeader?.includes('admin-access-token');
    console.log('[Trends API] Is admin bypass:', isAdminBypass);
    
    if (isAdminBypass) {
      // For admin bypass, generate trend data from localStorage analyses
      console.log('[Trends API] Generating trends for admin user');
      
      // This would typically read from localStorage on the client side,
      // but since this is server-side, we'll generate mock trend data
      // In a real implementation, you'd fetch this from your database
      
      const mockTrends = [
        {
          date: '2025-06-01',
          score: 72,
          technicalScore: 78,
          contentScore: 68,
          onpageScore: 75,
          uxScore: 70,
          issueCount: 12,
          issueSeverityCounts: {
            high: 2,
            medium: 5,
            low: 5
          },
          issueTypeCounts: {
            'Technical SEO': 4,
            'Content Quality': 3,
            'On-Page SEO': 3,
            'User Experience': 2
          }
        },
        {
          date: '2025-06-02',
          score: 75,
          technicalScore: 80,
          contentScore: 72,
          onpageScore: 76,
          uxScore: 72,
          issueCount: 10,
          issueSeverityCounts: {
            high: 1,
            medium: 4,
            low: 5
          },
          issueTypeCounts: {
            'Technical SEO': 3,
            'Content Quality': 3,
            'On-Page SEO': 2,
            'User Experience': 2
          }
        },
        {
          date: '2025-06-05',
          score: 78,
          technicalScore: 82,
          contentScore: 76,
          onpageScore: 78,
          uxScore: 76,
          issueCount: 8,
          issueSeverityCounts: {
            high: 1,
            medium: 3,
            low: 4
          },
          issueTypeCounts: {
            'Technical SEO': 2,
            'Content Quality': 2,
            'On-Page SEO': 2,
            'User Experience': 2
          }
        }
      ];
      
      console.log('[Trends API] Generated mock trends data with', mockTrends.length, 'data points');
      
      return NextResponse.json({
        success: true,
        trends: mockTrends,
        projectId: projectId
      });
    }

    // For regular users, you would fetch from your backend
    // For now, return empty trends data
    console.log('[Trends API] No trends data available for regular users');
    return NextResponse.json({
      success: true,
      trends: [],
      message: 'No trend data available',
      projectId: projectId
    });
    
  } catch (error) {
    console.error('[Trends API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch trend data',
      trends: []
    }, { status: 500 });
  }
}