import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Dashboard API routing is working',
      timestamp: new Date().toISOString(),
      path: '/api/dashboard/test'
    });
  } catch (error) {
    console.error('Dashboard test endpoint error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 