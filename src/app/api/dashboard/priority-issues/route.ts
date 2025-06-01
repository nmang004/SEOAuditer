import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const severity = url.searchParams.get('severity'); // filter by severity
    const status = url.searchParams.get('status') || 'unresolved'; // default to unresolved

    // Build where clause based on filters
    const whereClause: any = {
      AND: [
        status === 'unresolved' ? { status: { not: 'fixed' } } : {},
        severity ? { severity } : { severity: { in: ['critical', 'high'] } }
      ]
    };

    // Get priority issues with project context
    const [issues, issueStats] = await Promise.all([
      prisma.sEOIssue.findMany({
        where: whereClause,
        include: {
          analysis: {
            select: {
              id: true,
              project: {
                select: {
                  id: true,
                  name: true,
                  url: true
                }
              },
              createdAt: true,
              overallScore: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        take: limit
      }),

      // Get issue statistics for dashboard
      prisma.sEOIssue.groupBy({
        by: ['severity'],
        where: { status: { not: 'fixed' } },
        _count: { id: true }
      })
    ]);

    // Define severity priority for sorting
    const severityPriority = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };

    // Transform issues data
    const priorityIssues = issues.map(issue => {
      const project = issue.analysis?.project;
      
      // Calculate severity score for prioritization
      const severityScore = severityPriority[issue.severity as keyof typeof severityPriority] || 0;

      // Calculate urgency based on age
      const issueAge = Date.now() - issue.createdAt.getTime();
      const ageDays = Math.floor(issueAge / (1000 * 60 * 60 * 24));
      const urgencyMultiplier = issue.severity === 'critical' ? 2 : 
                               issue.severity === 'high' ? 1.5 : 1;

      return {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        category: issue.category,
        status: issue.status,
        createdAt: issue.createdAt.toISOString(),
        
        // Project context
        project: project ? {
          id: project.id,
          name: project.name,
          url: project.url
        } : null,
        
        // Analysis context
        analysisId: issue.analysis?.id,
        analysisDate: issue.analysis?.createdAt?.toISOString(),
        projectScore: issue.analysis?.overallScore,
        
        // Prioritization data
        priorityScore: (severityScore * 10) + (ageDays * urgencyMultiplier * 0.1),
        ageDays,
        isUrgent: issue.severity === 'critical' && ageDays > 1,
        
        // Metadata
        type: issue.type,
        affectedPages: issue.affectedPages,
        recommendation: issue.recommendation,
        
        // Additional context for dashboard display
        ageDescription: ageDays === 0 ? 'Today' :
                       ageDays === 1 ? 'Yesterday' :
                       ageDays < 7 ? `${ageDays} days ago` :
                       ageDays < 30 ? `${Math.floor(ageDays / 7)} weeks ago` :
                       `${Math.floor(ageDays / 30)} months ago`
      };
    });

    // Calculate issue statistics
    const stats = {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    issueStats.forEach(stat => {
      const severity = stat.severity as keyof typeof stats;
      if (severity in stats) {
        stats[severity] = stat._count.id;
        stats.total += stat._count.id;
      }
    });

    // Sort by priority score for final ordering
    priorityIssues.sort((a, b) => b.priorityScore - a.priorityScore);

    return NextResponse.json({
      success: true,
      data: priorityIssues,
      stats,
      filters: {
        severity,
        status,
        limit
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Priority issues error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch priority issues',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 