import { NextRequest, NextResponse } from 'next/server';
import { getServerBackendUrl } from '@/lib/backend-url';

const BACKEND_URL = getServerBackendUrl();

// Add runtime config for Netlify
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Add GET method for route discovery
export async function GET() {
  return NextResponse.json({ 
    message: 'Secure Auth Login API - POST method required',
    methods: ['POST']
  }, { status: 405 });
}

export async function POST(request: NextRequest) {
  console.log('[Secure Auth API] Login request received');
  console.log('[Secure Auth API] Backend URL:', BACKEND_URL);
  
  try {
    const body = await request.json();
    console.log('[Secure Auth API] Request body received:', { 
      email: body.email,
      hasPassword: !!body.password,
      passwordLength: body.password?.length
    });

    const backendUrl = `${BACKEND_URL}/secure-auth/login`;
    console.log('[Secure Auth API] Attempting to connect to:', backendUrl);
    
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
      console.error('[Secure Auth API] Backend connection failed:', fetchError);
      
      if (fetchError.cause?.code === 'ECONNREFUSED' || fetchError.message?.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Authentication service is temporarily unavailable',
            details: 'Please try again in a few minutes.'
          },
          { status: 503 }
        );
      }
      
      throw fetchError;
    }

    console.log('[Secure Auth API] Backend response status:', response.status);
    
    // Try to parse response as JSON
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('[Secure Auth API] Non-JSON response from backend:', text);
      data = { 
        success: false, 
        error: 'Invalid response from authentication service',
        details: text.substring(0, 200)
      };
    }
    
    console.log('[Secure Auth API] Backend response data:', JSON.stringify(data, null, 2));
    
    // Handle specific error cases
    if (!response.ok) {
      console.log('[Secure Auth API] Error response from backend:', {
        status: response.status,
        data: data,
        email: body.email
      });
      
      if (response.status === 401) {
        return NextResponse.json(
          { 
            success: false, 
            error: data.error || 'Invalid email or password'
          },
          { status: 401 }
        );
      }
      if (response.status === 403) {
        return NextResponse.json(
          { 
            success: false, 
            error: data.error || 'Please verify your email before logging in',
            requiresVerification: data.requiresVerification || true
          },
          { status: 403 }
        );
      }
      if (response.status === 423) {
        return NextResponse.json(
          { 
            success: false, 
            error: data.error || 'Account is temporarily locked'
          },
          { status: 423 }
        );
      }
      if (response.status === 429) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Too many login attempts. Please wait before trying again.' 
          },
          { status: 429 }
        );
      }
      if (response.status === 500) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Login service error. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? data.details : undefined
          },
          { status: 500 }
        );
      }
    }
    
    // Pass through successful response
    if (response.ok && data.success) {
      console.log('[Secure Auth API] Login successful:', {
        userId: data.data?.user?.id,
        email: data.data?.user?.email,
        hasTokens: !!(data.data?.accessToken && data.data?.refreshToken),
        correlationId: data.metadata?.correlationId
      });
    }
    
    return NextResponse.json(data, { status: response.status });
    
  } catch (error: any) {
    console.error('[Secure Auth API] Login error:', error);
    console.error('[Secure Auth API] Error stack:', error.stack);
    
    if (error.cause?.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot connect to authentication service',
          details: 'The authentication service appears to be offline. Please try again later.'
        },
        { status: 503 }
      );
    }
    
    const errorMessage = error.message || 'An unexpected error occurred during login';
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