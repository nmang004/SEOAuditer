import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'API routing is working!',
    timestamp: new Date().toISOString(),
    route: '/api/test-working'
  });
} 