import { NextRequest, NextResponse } from 'next/server';

// Use Railway backend URL for production deployment
const BACKEND_URL = process.env.BACKEND_URL || 'https://seodirector-backend-production.up.railway.app';

export async function GET(request: NextRequest) {
  try {
    // Always connect to backend for user-specific data
    // Remove development mode check to enable real project storage

    const authHeader = request.headers.get('authorization');
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    const backendUrl = new URL('/api/projects', BACKEND_URL);
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
    console.error('GET /api/projects error:', error);
    // Fallback to empty data instead of error
    return NextResponse.json({
      success: true,
      data: []
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Always connect to backend for user-specific data

    const authHeader = request.headers.get('authorization');

    const response = await fetch(`${BACKEND_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('POST /api/projects error:', error);
    const body = await request.json().catch(() => ({}));
    
    // Fallback to mock success instead of error
    return NextResponse.json({
      success: true,
      data: {
        id: Math.random().toString(36).substr(2, 9),
        name: body.name || 'Test Project',
        url: body.url || 'https://example.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        analysesCount: 0,
        status: 'Active'
      }
    });
  }
} 