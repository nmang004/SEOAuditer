import { NextRequest, NextResponse } from 'next/server';
import { getServerBackendUrl } from '@/lib/backend-url';

const BACKEND_URL = getServerBackendUrl();

export async function POST(request: NextRequest) {
  console.log('[Auth Debug] Testing registration flow');
  
  try {
    const body = await request.json();
    console.log('[Auth Debug] Request body:', {
      email: body.email,
      name: body.name,
      passwordLength: body.password?.length,
      hasPassword: !!body.password
    });
    console.log('[Auth Debug] Backend URL:', BACKEND_URL);
    
    // Try both the regular register endpoint and debug-register endpoint
    const registerUrl = `${BACKEND_URL}/auth/register`;
    const debugRegisterUrl = `${BACKEND_URL}/auth/debug-register`;
    console.log('[Auth Debug] Register URL:', registerUrl);
    console.log('[Auth Debug] Debug Register URL:', debugRegisterUrl);
    
    // Test both endpoints to compare
    const results = [];
    
    // First try the regular register endpoint
    try {
      const backendResponse = await fetch(registerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const responseText = await backendResponse.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { error: 'Invalid response format', raw: responseText };
      }
      
      results.push({
        endpoint: 'regular',
        url: registerUrl,
        status: backendResponse.status,
        responseData,
        headers: Object.fromEntries(backendResponse.headers)
      });
    } catch (error: any) {
      results.push({
        endpoint: 'regular',
        url: registerUrl,
        error: error.message,
        stack: error.stack
      });
    }
    
    // Then try the debug register endpoint (if in development)
    if (process.env.NODE_ENV === 'development') {
      try {
        const debugResponse = await fetch(debugRegisterUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(body),
        });
        
        const responseText = await debugResponse.text();
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          responseData = { error: 'Invalid response format', raw: responseText };
        }
        
        results.push({
          endpoint: 'debug',
          url: debugRegisterUrl,
          status: debugResponse.status,
          responseData,
          headers: Object.fromEntries(debugResponse.headers)
        });
      } catch (error: any) {
        results.push({
          endpoint: 'debug',
          url: debugRegisterUrl,
          error: error.message,
          stack: error.stack
        });
      }
    }
    
    console.log('[Auth Debug] All results:', results);
    
    // Return debug information
    return NextResponse.json({
      debug: {
        requestBody: {
          email: body.email,
          name: body.name,
          passwordLength: body.password?.length
        },
        backendUrl: BACKEND_URL,
        results
      }
    });
    
  } catch (error: any) {
    console.error('[Auth Debug] Error:', error);
    return NextResponse.json({
      debug: {
        error: error.message,
        stack: error.stack,
        backendUrl: BACKEND_URL,
      }
    }, { status: 500 });
  }
}