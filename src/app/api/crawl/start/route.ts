import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8080';

export async function POST(request: NextRequest) {
  console.log('POST /api/crawl/start called');
  console.log('BACKEND_URL:', BACKEND_URL);
  
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();
    console.log('Request body:', body);

    console.log('Attempting to fetch:', `${BACKEND_URL}/api/crawl/start`);
    const response = await fetch(`${BACKEND_URL}/api/crawl/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(body),
    });

    console.log('Backend response status:', response.status);
    const data = await response.json();
    console.log('Backend response data:', data);
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('POST /api/crawl/start error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 