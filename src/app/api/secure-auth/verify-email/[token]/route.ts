import { NextRequest, NextResponse } from 'next/server';
import { getServerBackendUrl } from '@/lib/backend-url';

const BACKEND_URL = getServerBackendUrl();

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  console.log('[Secure Auth API] Email verification request received');
  console.log('[Secure Auth API] Backend URL:', BACKEND_URL);
  console.log('[Secure Auth API] Token:', params.token?.substring(0, 8) + '...');
  
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Verification token is required' 
        },
        { status: 400 }
      );
    }

    const backendUrl = `${BACKEND_URL}/secure-auth/verify-email/${encodeURIComponent(token)}`;
    console.log('[Secure Auth API] Attempting to connect to:', backendUrl);
    
    let response: Response;
    try {
      response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
      });
    } catch (fetchError: any) {
      console.error('[Secure Auth API] Backend connection failed:', fetchError);
      
      // Check if it's a connection error
      if (fetchError.cause?.code === 'ECONNREFUSED' || fetchError.message?.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Backend server is not running. Please ensure the backend server is started.',
            details: 'The verification service is temporarily unavailable.'
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
      // If not JSON, try to get text
      const text = await response.text();
      console.error('[Secure Auth API] Non-JSON response from backend:', text);
      data = { 
        success: false, 
        error: 'Invalid response from verification service',
        details: text.substring(0, 200)
      };
    }
    
    console.log('[Secure Auth API] Backend response data:', JSON.stringify(data, null, 2));
    
    // Handle specific error cases
    if (!response.ok) {
      console.log('[Secure Auth API] Error response from backend:', {
        status: response.status,
        data: data,
        token: token.substring(0, 8) + '...'
      });
      
      if (response.status === 400) {
        return NextResponse.json(
          { 
            success: false, 
            error: data.error || 'Invalid verification token',
            details: data.details
          },
          { status: 400 }
        );
      }
      if (response.status === 404) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Verification token not found or expired' 
          },
          { status: 404 }
        );
      }
      if (response.status === 500) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Verification service error. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? data.details : undefined
          },
          { status: 500 }
        );
      }
    }
    
    // Pass through the backend response for successful verification
    if (response.ok && data.success) {
      console.log('[Secure Auth API] Email verification successful:', {
        email: data.data?.email,
        correlationId: data.metadata?.correlationId
      });
    }
    
    return NextResponse.json(data, { status: response.status });
    
  } catch (error: any) {
    console.error('[Secure Auth API] Email verification error:', error);
    console.error('[Secure Auth API] Error stack:', error.stack);
    
    // Check for specific error types
    if (error.cause?.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot connect to verification service',
          details: 'The verification service appears to be offline. Please try again later.'
        },
        { status: 503 }
      );
    }
    
    const errorMessage = error.message || 'An unexpected error occurred during verification';
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