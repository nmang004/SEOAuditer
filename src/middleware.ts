import { NextRequest, NextResponse } from 'next/server';

// Performance monitoring
interface PerformanceMetrics {
  requestStart: number;
  route: string;
  method: string;
  userAgent?: string;
  cached: boolean;
  responseTime: number;
}

const performanceMetrics: PerformanceMetrics[] = [];

// Simplified middleware without Redis for Edge Runtime compatibility
export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname, search } = request.nextUrl;

  // Skip middleware for static files and internal Next.js routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  try {
    // Handle API routes
    if (pathname.startsWith('/api/')) {
      return handleApiRoute(request, pathname, search, startTime);
    }

    // Handle page routes
    return handlePageRoute(request, pathname, startTime);
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

async function handleApiRoute(
  request: NextRequest, 
  pathname: string, 
  search: string,
  startTime: number
): Promise<NextResponse> {
  // Continue to API handler - simplified without cache
  const response = NextResponse.next();
  
  // Add performance headers
  response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
  response.headers.set('X-Cache', 'DISABLED'); // Cache disabled for Edge Runtime compatibility
  
  // Add CORS headers for API routes
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}

async function handlePageRoute(
  request: NextRequest,
  pathname: string,
  startTime: number
): Promise<NextResponse> {
  const response = NextResponse.next();

  // Add performance monitoring
  response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}; 