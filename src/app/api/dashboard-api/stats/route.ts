import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Create a simple Prisma client without complex configuration to avoid enableTracing issues
const prisma = new PrismaClient({
  log: ['error'],
  errorFormat: 'minimal'
});

export async function GET(request: NextRequest) {
  try {
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