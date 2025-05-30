import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();

    // Get user from auth (implement your auth logic here)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract user ID from token (implement your JWT decode logic)
    const userId = 'user-id'; // Replace with actual user ID from token

    // Get critical and high severity issues from recent analyses
    const issues = await db.sEOIssue.findMany({
      where: {
        severity: {
          in: ['critical', 'high']
        }
      },
      include: {
        analysis: {
          include: {
            project: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    const priorityIssues = issues.map((issue: any) => ({
      id: issue.id,
      title: issue.title,
      severity: issue.severity,
      category: issue.category,
      projectName: issue.analysis?.project?.name || 'Unknown Project',
      projectUrl: issue.analysis?.project?.url || '',
      affectedPages: issue.affectedPages || 1,
      createdAt: issue.createdAt,
      status: issue.status
    }));

    return NextResponse.json({
      success: true,
      data: priorityIssues
    });
  } catch (error) {
    console.error('Priority issues error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch priority issues' },
      { status: 500 }
    );
  }
} 