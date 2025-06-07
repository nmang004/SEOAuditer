import { NextRequest, NextResponse } from 'next/server';

// For server-side API routes in Docker, use internal service names
const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8080';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    const authHeader = request.headers.get('authorization');
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Check for admin bypass
    const isAdminBypass = authHeader?.includes('admin-access-token');
    
    if (isAdminBypass) {
      console.log('[Analyses API] Admin bypass - returning empty analyses list');
      return NextResponse.json({
        success: true,
        data: []
      });
    }
    
    const backendUrl = new URL(`/api/projects/${projectId}/analyses`, BACKEND_URL);
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    if (!response.ok) {
      console.log('[Analyses API] Backend failed, returning empty list');
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`GET /api/projects/[projectId]/analyses error:`, error);
    // Return empty list instead of error
    return NextResponse.json({
      success: true,
      data: []
    });
  }
} 