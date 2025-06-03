import { NextRequest, NextResponse } from 'next/server';
import { getServerBackendUrl } from '@/lib/backend-url';

const BACKEND_URL = getServerBackendUrl();

export async function GET(_request: NextRequest) {
  console.log('[Auth Test] Testing backend connectivity');
  console.log('[Auth Test] Backend URL:', BACKEND_URL);
  
  try {
    // Test backend health endpoint
    const healthUrl = `${BACKEND_URL.replace('/api', '')}/health`;
    console.log('[Auth Test] Testing health endpoint:', healthUrl);
    
    const healthResponse = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    const healthData = healthResponse.ok ? await healthResponse.json() : null;

    // Test auth endpoints
    const authTestUrl = `${BACKEND_URL}/auth/test`;
    console.log('[Auth Test] Testing auth endpoint:', authTestUrl);
    
    let authTestData = null;
    try {
      const authResponse = await fetch(authTestUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });
      
      if (authResponse.ok) {
        authTestData = await authResponse.json();
      }
    } catch (authError: any) {
      console.log('[Auth Test] Auth test endpoint not available:', authError.message);
    }

    return NextResponse.json({
      success: true,
      backend: {
        url: BACKEND_URL,
        health: {
          status: healthResponse.ok ? 'connected' : 'error',
          data: healthData,
          statusCode: healthResponse.status
        },
        auth: {
          tested: authTestUrl,
          available: authTestData !== null,
          data: authTestData
        }
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        BACKEND_URL: process.env.BACKEND_URL,
        NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL
      }
    });
  } catch (error: any) {
    console.error('[Auth Test] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      backend: {
        url: BACKEND_URL,
        status: 'error'
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        BACKEND_URL: process.env.BACKEND_URL,
        NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL
      }
    }, { status: 500 });
  }
}