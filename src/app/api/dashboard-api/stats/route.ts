import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseAvailable } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const prisma = await getDatabase();
    
    // Check if database is available
    if (!isDatabaseAvailable()) {
      return NextResponse.json({
        success: true,
        data: {
          totalProjects: 0,
          totalAnalyses: 0,
          criticalIssues: 0,
          averageScore: 85
        }
      });
    }
    console.log('Dashboard stats API called');

    // Simple test - just return mock data initially to test API routing
    const basicStats = {
      success: true,
      data: {
        totalProjects: 0,
        activeAnalyses: 0,
        completedAnalyses: 0,
        averageScore: 75,
        weeklyIssues: 0,
        resolvedIssues: 0,
        criticalIssues: 0,
        scoreImprovement: 0,
        summary: {
          message: 'Dashboard API is working successfully',
          timestamp: new Date().toISOString(),
          endpoint: '/api/dashboard-api/stats',
          version: '1.0.0'
        }
      }
    };

    console.log('Returning dashboard stats:', basicStats);
    return NextResponse.json(basicStats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: null
      },
      { status: 500 }
    );
  }
} 