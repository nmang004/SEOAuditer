import { NextRequest, NextResponse } from 'next/server';
import { getServerBackendUrl } from '@/lib/backend-url';

const BACKEND_URL = getServerBackendUrl();

export async function POST(request: NextRequest) {
  console.log('[Auth Debug] Testing registration flow');
  
  try {
    const body = await request.json();
    console.log('[Auth Debug] Request body:', body);
    console.log('[Auth Debug] Backend URL:', BACKEND_URL);
    
    const registerUrl = `${BACKEND_URL}/auth/register`;
    console.log('[Auth Debug] Register URL:', registerUrl);
    
    // Make the request to backend
    const backendResponse = await fetch(registerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    console.log('[Auth Debug] Backend response status:', backendResponse.status);
    console.log('[Auth Debug] Backend response headers:', Object.fromEntries(backendResponse.headers));
    
    const responseText = await backendResponse.text();
    console.log('[Auth Debug] Backend response text:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('[Auth Debug] Parsed response data:', responseData);
    } catch (e) {
      console.log('[Auth Debug] Failed to parse response as JSON');
      responseData = { error: 'Invalid response format', raw: responseText };
    }
    
    // Return debug information
    return NextResponse.json({
      debug: {
        requestUrl: registerUrl,
        requestBody: body,
        responseStatus: backendResponse.status,
        responseData,
        backendUrl: BACKEND_URL,
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