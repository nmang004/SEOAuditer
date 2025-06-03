import { NextRequest, NextResponse } from 'next/server';
import { getServerBackendUrl } from '@/lib/backend-url';

const BACKEND_URL = getServerBackendUrl();

export async function POST(request: NextRequest) {
  console.log('[Auth API] Login request received');
  console.log('[Auth API] Backend URL:', BACKEND_URL);
  
  try {
    const body = await request.json();
    console.log('[Auth API] Request body received:', { email: body.email });

    const backendUrl = `${BACKEND_URL}/auth/login`;
    console.log('[Auth API] Attempting to connect to:', backendUrl);
    
    let response: Response;
    try {
      response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (fetchError: any) {
      console.error('[Auth API] Backend connection failed:', fetchError);
      
      // Check if it's a connection error
      if (fetchError.cause?.code === 'ECONNREFUSED' || fetchError.message?.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Backend server is not running. Please ensure the backend server is started on port 4000.',
            details: 'Run "cd backend && npm run dev" to start the backend server.'
          },
          { status: 503 }
        );
      }
      
      throw fetchError;
    }

    console.log('[Auth API] Backend response status:', response.status);
    
    // Try to parse response as JSON
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // If not JSON, try to get text
      const text = await response.text();
      console.error('[Auth API] Non-JSON response from backend:', text);
      data = { 
        success: false, 
        error: 'Invalid response from backend server',
        details: text
      };
    }
    
    console.log('[Auth API] Backend response data:', data);
    
    // Handle specific error cases
    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { success: false, error: data.error || 'Invalid credentials' },
          { status: 401 }
        );
      }
      if (response.status === 400) {
        return NextResponse.json(
          { success: false, error: data.error || 'Bad request', details: data.details },
          { status: 400 }
        );
      }
    }
    
    // Pass through the backend response, normalizing error format
    if (!response.ok && data.error && typeof data.error === 'object') {
      // Backend returns error as object, normalize to string
      return NextResponse.json({
        ...data,
        error: data.error.message || 'An error occurred'
      }, { status: response.status });
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[Auth API] Login error:', error);
    console.error('[Auth API] Error stack:', error.stack);
    
    // Check for specific error types
    if (error.cause?.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot connect to backend server',
          details: 'The backend server appears to be offline. Please start it with "cd backend && npm run dev"'
        },
        { status: 503 }
      );
    }
    
    // Pass through more helpful error information
    const errorMessage = error.message || 'An unexpected error occurred';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 