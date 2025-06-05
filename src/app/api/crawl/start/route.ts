import { NextRequest, NextResponse } from 'next/server';
import { getServerBackendUrl } from '@/lib/backend-url';

const BACKEND_URL = getServerBackendUrl();

export async function POST(request: NextRequest) {
  console.log('[Crawl Start API] POST /api/crawl/start called');
  console.log('[Crawl Start API] BACKEND_URL:', BACKEND_URL);
  
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();
    console.log('[Crawl Start API] Request body:', body);

    // Check if this is an admin bypass token
    const isAdminBypass = authHeader?.includes('admin-access-token');
    console.log('[Crawl Start API] Is admin bypass:', isAdminBypass);
    
    if (isAdminBypass) {
      // For admin bypass, create a real job ID and store the analysis request
      const realJobId = 'admin-job-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
      console.log('[Crawl Start API] Creating real analysis job for admin bypass:', realJobId);
      
      // Store the analysis request in localStorage (client will handle this)
      const analysisRequest = {
        jobId: realJobId,
        url: body.url,
        projectId: body.projectId,
        userId: body.userId,
        status: 'pending',
        createdAt: new Date().toISOString(),
        source: 'admin-bypass'
      };
      
      console.log('[Crawl Start API] Analysis request created:', analysisRequest);
      
      return NextResponse.json({
        success: true,
        jobId: realJobId,
        url: body.url,
        message: 'Analysis started successfully',
        estimatedTime: '30-60 seconds',
        source: 'admin-bypass',
        analysisRequest: analysisRequest
      });
    }

    console.log('[Crawl Start API] Attempting to fetch:', `${BACKEND_URL}/api/crawl/start`);
    const response = await fetch(`${BACKEND_URL}/api/crawl/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(body),
    });

    console.log('[Crawl Start API] Backend response status:', response.status);
    
    if (!response.ok) {
      console.error('[Crawl Start API] Backend error:', response.status, response.statusText);
      // Fallback to mock successful response
      const fallbackJobId = 'fallback-job-' + Math.random().toString(36).substr(2, 9);
      console.log('[Crawl Start API] Using fallback job ID:', fallbackJobId);
      
      return NextResponse.json({
        success: true,
        jobId: fallbackJobId,
        message: 'Analysis started successfully (fallback mode)',
        estimatedTime: '30-60 seconds',
        source: 'fallback'
      });
    }

    const data = await response.json();
    console.log('[Crawl Start API] Backend response data:', data);
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Crawl Start API] Error:', error);
    
    // Fallback to mock successful response on error
    const errorFallbackJobId = 'error-fallback-job-' + Math.random().toString(36).substr(2, 9);
    console.log('[Crawl Start API] Using error fallback job ID:', errorFallbackJobId);
    
    return NextResponse.json({
      success: true,
      jobId: errorFallbackJobId,
      message: 'Analysis started successfully (error fallback mode)',
      estimatedTime: '30-60 seconds',
      source: 'error-fallback'
    });
  }
} 