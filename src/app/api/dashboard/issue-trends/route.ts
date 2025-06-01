import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const prisma = await getDatabase();
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const projectId = url.searchParams.get('projectId'); // optional filter

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Build where clause for issues
    const whereClause: any = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    if (projectId) {
      whereClause.analysis = {
        projectId: projectId
      };
    }

    // Get issue data for the time period
    const [newIssues, resolvedIssues] = await Promise.all([
      // New issues created in the period
      prisma.sEOIssue.findMany({
        where: whereClause,
        select: {
          id: true,
          type: true,
          severity: true,
          status: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),

      // Issues resolved in the period
      prisma.sEOIssue.findMany({
        where: {
          status: 'fixed',
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          ...(projectId ? {
            analysis: {
              projectId: projectId
            }
          } : {})
        },
        select: {
          createdAt: true,
          severity: true,
          analysis: {
            select: {
              projectId: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      })
    ]);

    // Group issues by date
    const trendsByDate = new Map();

    // Initialize all dates with zero values
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      trendsByDate.set(dateStr, {
        date: dateStr,
        newIssues: 0,
        resolvedIssues: 0,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
        netChange: 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Process new issues
    newIssues.forEach((issue: any) => {
      const date = issue.createdAt.toISOString().split('T')[0];
      const dayData = trendsByDate.get(date);
      if (dayData) {
        dayData.newIssues++;
        
        // Count by severity
        switch (issue.severity) {
          case 'critical':
            dayData.criticalIssues++;
            break;
          case 'high':
            dayData.highIssues++;
            break;
          case 'medium':
            dayData.mediumIssues++;
            break;
          case 'low':
            dayData.lowIssues++;
            break;
        }
      }
    });

    // Process resolved issues
    resolvedIssues.forEach((issue: any) => {
      const date = issue.createdAt.toISOString().split('T')[0];
      const dayData = trendsByDate.get(date);
      if (dayData) {
        dayData.resolvedIssues++;
      }
    });

    // Calculate net change and total issues for each day
    let cumulativeTotal = 0;
    const trends = Array.from(trendsByDate.values()).map(day => {
      day.netChange = day.newIssues - day.resolvedIssues;
      cumulativeTotal += day.netChange;
      
      return {
        ...day,
        totalIssues: Math.max(0, cumulativeTotal) // Ensure non-negative
      };
    });

    // Calculate summary statistics
    const totalNewIssues = newIssues.length;
    const totalResolvedIssues = resolvedIssues.length;
    const netIssueChange = totalNewIssues - totalResolvedIssues;

    // Count issues by severity
    const severityCounts = {
      critical: newIssues.filter((i: any) => i.severity === 'critical').length,
      high: newIssues.filter((i: any) => i.severity === 'high').length,
      medium: newIssues.filter((i: any) => i.severity === 'medium').length,
      low: newIssues.filter((i: any) => i.severity === 'low').length
    };

    // Get current open issues count
    const currentOpenIssues = await prisma.sEOIssue.count({
      where: {
        status: { not: 'fixed' },
        ...(projectId ? {
          analysis: {
            projectId: projectId
          }
        } : {})
      }
    });

    const summary = {
      totalNewIssues,
      totalResolvedIssues,
      netIssueChange,
      currentOpenIssues,
      severityBreakdown: severityCounts,
      resolutionRate: totalNewIssues > 0 ? 
        Math.round((totalResolvedIssues / totalNewIssues) * 100) : 0,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }
    };

    return NextResponse.json({
      success: true,
      data: trends,
      summary,
      filters: {
        days,
        projectId
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Issue trends error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch issue trends',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 