import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api';

export async function POST(request: NextRequest) {
  console.log('[Auth API] Register request received');
  console.log('[Auth API] Backend URL:', BACKEND_URL);
  
  try {
    const body = await request.json();
    console.log('[Auth API] Request body received:', { 
      email: body.email,
      name: body.name 
    });

    const backendUrl = `${BACKEND_URL}/auth/register`;
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
      if (response.status === 400) {
        return NextResponse.json(
          { 
            success: false, 
            error: data.error || 'Bad request',
            details: data.details
          },
          { status: 400 }
        );
      }
      if (response.status === 409) {
        return NextResponse.json(
          { 
            success: false, 
            error: data.error || 'Email already exists' 
          },
          { status: 409 }
        );
      }
    }
    
    // Pass through the backend response
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[Auth API] Register error:', error);
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
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
} 