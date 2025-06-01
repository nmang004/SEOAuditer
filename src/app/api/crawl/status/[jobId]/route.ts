import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8080';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  console.log('GET /api/crawl/status/[jobId] called');
  console.log('BACKEND_URL:', BACKEND_URL);
  
  try {
    const authHeader = request.headers.get('authorization');
    const { jobId } = await context.params;

    console.log('Attempting to fetch:', `${BACKEND_URL}/api/crawl/status/${jobId}`);
    const response = await fetch(`${BACKEND_URL}/api/crawl/status/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    console.log('Backend response status:', response.status);
    const data = await response.json();
    console.log('Backend response data:', data);
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('GET /api/crawl/status/[jobId] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 