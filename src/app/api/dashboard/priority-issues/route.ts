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
    const cacheKey = `priority-issues:${userId}`;
    const cached = await analysisCacheService.get<any[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached, cached: true });
    }

    // Get user's projects
    const projects = await prisma.project.findMany({
      where: { userId },
      select: { id: true, name: true }
    });

    // Get priority issues (critical and high severity, not fixed)
    const issues = await prisma.sEOIssue.findMany({
      where: {
        analysis: {
          projectId: { in: projects.map(p => p.id) }
        },
        severity: { in: ['critical', 'high'] },
        status: { notIn: ['fixed', 'ignored'] }
      },
      include: {
        analysis: {
          include: {
            project: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 20
    });

    const priorityIssues = issues.map(issue => ({
      id: issue.id,
      projectId: issue.analysis.project.id,
      projectName: issue.analysis.project.name,
      type: issue.type,
      severity: issue.severity as 'critical' | 'high' | 'medium' | 'low',
      title: issue.title,
      affectedPages: issue.affectedPages,
      estimatedImpact: issue.businessImpact || 'Medium',
      quickFix: issue.fixComplexity === 'easy'
    }));

    // Cache for 3 minutes
    await analysisCacheService.set(cacheKey, priorityIssues, { ttl: 180 });

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