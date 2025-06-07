import { NextRequest, NextResponse } from 'next/server';

// For server-side API routes in Docker, use internal service names
const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8080';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    const backendUrl = new URL('/api/dashboard/recent-activity', BACKEND_URL);
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('GET /api/dashboard/recent-activity error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 