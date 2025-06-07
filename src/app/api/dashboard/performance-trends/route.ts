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

    // Build where clause
    const whereClause: any = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    if (projectId) {
      whereClause.projectId = projectId;
    }

    // Get analysis data for the time period
    const analyses = await prisma.sEOAnalysis.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        overallScore: true,
        technicalScore: true,
        contentScore: true,
        onpageScore: true,
        uxScore: true,
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by date and calculate daily averages
    const trendsByDate = new Map();
    
    analyses.forEach((analysis: any) => {
      const date = analysis.createdAt.toISOString().split('T')[0];
      
      if (!trendsByDate.has(date)) {
        trendsByDate.set(date, {
          date,
          overallScores: [],
          technicalScores: [],
          contentScores: [],
          onPageScores: [],
          uxScores: [],
          projectCount: new Set(),
          analyses: []
        });
      }
      
      const dayData = trendsByDate.get(date);
      
      if (analysis.overallScore !== null) dayData.overallScores.push(analysis.overallScore);
      if (analysis.technicalScore !== null) dayData.technicalScores.push(analysis.technicalScore);
      if (analysis.contentScore !== null) dayData.contentScores.push(analysis.contentScore);
      if (analysis.onpageScore !== null) dayData.onPageScores.push(analysis.onpageScore);
      if (analysis.uxScore !== null) dayData.uxScores.push(analysis.uxScore);
      
      dayData.projectCount.add(analysis.project.id);
      dayData.analyses.push(analysis);
    });

    // Calculate averages and generate trend data
    const trends = Array.from(trendsByDate.values()).map(day => {
      const avgScore = (scores: number[]) => 
        scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      return {
        date: day.date,
        overallScore: avgScore(day.overallScores),
        technicalScore: avgScore(day.technicalScores),
        contentScore: avgScore(day.contentScores),
        onPageScore: avgScore(day.onPageScores),
        uxScore: avgScore(day.uxScores),
        projectCount: day.projectCount.size,
        analysisCount: day.analyses.length
      };
    });

    // Fill in missing dates with null values for consistent charting
    const filledTrends = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingTrend = trends.find((t: any) => t.date === dateStr);
      
      if (existingTrend) {
        filledTrends.push(existingTrend);
      } else {
        filledTrends.push({
          date: dateStr,
          overallScore: null,
          technicalScore: null,
          contentScore: null,
          onPageScore: null,
          uxScore: null,
          projectCount: 0,
          analysisCount: 0
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate summary statistics
    const allScores = analyses.map((a: any) => a.overallScore).filter((s: any) => s !== null) as number[];
    const summary = {
      totalAnalyses: analyses.length,
      averageScore: allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0,
      highestScore: allScores.length > 0 ? Math.max(...allScores) : 0,
      lowestScore: allScores.length > 0 ? Math.min(...allScores) : 0,
      uniqueProjects: new Set(analyses.map((a: any) => a.project.id)).size,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }
    };

    return NextResponse.json({
      success: true,
      data: filledTrends,
      summary,
      filters: {
        days,
        projectId
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Performance trends error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch performance trends',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 