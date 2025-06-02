import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api';

export async function GET(_request: NextRequest) {
  console.log('[Health Check] Checking backend connectivity');
  console.log('[Health Check] Backend URL:', BACKEND_URL);
  
  try {
    const healthUrl = `${BACKEND_URL.replace('/api', '')}/health`;
    console.log('[Health Check] Checking:', healthUrl);
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        backend: {
          status: 'connected',
          url: BACKEND_URL,
          health: data
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        backend: {
          status: 'error',
          url: BACKEND_URL,
          error: `Backend returned status ${response.status}`
        }
      }, { status: 503 });
    }
  } catch (error: any) {
    console.error('[Health Check] Backend check failed:', error);
    
    let errorMessage = 'Unknown error';
    if (error.cause?.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      errorMessage = 'Backend server is not running';
    } else if (error.name === 'AbortError') {
      errorMessage = 'Backend server timeout';
    } else {
      errorMessage = error.message;
    }
    
    return NextResponse.json({
      success: false,
      backend: {
        status: 'offline',
        url: BACKEND_URL,
        error: errorMessage,
        hint: 'Please ensure the backend server is running with "cd backend && npm run dev"'
      }
    }, { status: 503 });
  }
}