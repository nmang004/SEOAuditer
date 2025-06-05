import { NextRequest, NextResponse } from 'next/server';
import { getServerBackendUrl } from '@/lib/backend-url';

const BACKEND_URL = getServerBackendUrl();

export async function POST(request: NextRequest) {
  console.log('[Secure Auth API] Resend verification request received');
  console.log('[Secure Auth API] Backend URL:', BACKEND_URL);
  
  try {
    const body = await request.json();
    console.log('[Secure Auth API] Request body received:', { 
      email: body.email
    });

    if (!body.email) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email address is required' 
        },
        { status: 400 }
      );
    }

    const backendUrl = `${BACKEND_URL}/secure-auth/resend-verification`;
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
            error: 'Email service is temporarily unavailable',
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
        error: 'Invalid response from email service',
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
      
      if (response.status === 400) {
        return NextResponse.json(
          { 
            success: false, 
            error: data.error || 'Email is already verified or invalid request'
          },
          { status: 400 }
        );
      }
      if (response.status === 404) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'User account not found' 
          },
          { status: 404 }
        );
      }
      if (response.status === 429) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Too many requests. Please wait before requesting another verification email.' 
          },
          { status: 429 }
        );
      }
      if (response.status === 500) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to send verification email. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? data.details : undefined
          },
          { status: 500 }
        );
      }
    }
    
    // Pass through successful response
    if (response.ok && data.success) {
      console.log('[Secure Auth API] Verification email resent successfully:', {
        email: body.email,
        messageId: data.data?.messageId,
        correlationId: data.metadata?.correlationId
      });
    }
    
    return NextResponse.json(data, { status: response.status });
    
  } catch (error: any) {
    console.error('[Secure Auth API] Resend verification error:', error);
    console.error('[Secure Auth API] Error stack:', error.stack);
    
    if (error.cause?.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot connect to email service',
          details: 'The email service appears to be offline. Please try again later.'
        },
        { status: 503 }
      );
    }
    
    const errorMessage = error.message || 'An unexpected error occurred while sending verification email';
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