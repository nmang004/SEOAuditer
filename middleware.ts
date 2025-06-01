import { NextRequest, NextResponse } from 'next/server';

// Performance monitoring
interface PerformanceMetrics {
  responseTime: number;
  cacheHit: boolean;
  slowRequest: boolean;
}

// Rate limiting configuration
const rateLimitConfig = {
  '/api/crawl': { requests: 10, window: 60000 }, // 10 req/min
  '/api/analysis': { requests: 20, window: 60000 }, // 20 req/min
  '/api/dashboard': { requests: 100, window: 60000 }, // 100 req/min
  default: { requests: 60, window: 60000 } // 60 req/min
};

// Cache configuration
const cacheConfig = {
  '/api/dashboard': { ttl: 300 }, // 5 minutes
  '/api/projects': { ttl: 600 }, // 10 minutes
  '/api/analyses': { ttl: 1800 }, // 30 minutes
  '/api/reports': { ttl: 3600 }, // 1 hour
  default: { ttl: 300 } // 5 minutes
};

// Define route patterns
const publicRoutes = [
  '/',
  '/pricing',
  '/about', 
  '/help',
  '/privacy',
  '/terms',
  '/api/health'
];

const authRoutes = [
  '/login',
  '/register', 
  '/forgot-password'
];

const protectedRoutes = [
  '/dashboard',
  '/projects',
  '/analyses',
  '/issues',
  '/search'
];

// In-memory cache for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const responseCache = new Map<string, { data: any; expires: number }>();

function getRateLimitKey(ip: string, pathname: string): string {
  return `${ip}:${pathname}`;
}

function getCacheKey(request: NextRequest): string {
  const url = new URL(request.url);
  return `${request.method}:${url.pathname}${url.search}`;
}

function isRateLimited(request: NextRequest): boolean {
  const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for') || 'unknown';
  const pathname = request.nextUrl.pathname;
  
  // Find matching rate limit config
  const config = Object.entries(rateLimitConfig).find(([path]) => 
    pathname.startsWith(path)
  )?.[1] || rateLimitConfig.default;
  
  const key = getRateLimitKey(ip, pathname);
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.window });
    return false;
  }
  
  if (entry.count >= config.requests) {
    return true;
  }
  
  entry.count++;
  return false;
}

function getCachedResponse(request: NextRequest): Response | null {
  if (request.method !== 'GET') return null;
  
  const key = getCacheKey(request);
  const cached = responseCache.get(key);
  
  if (cached && Date.now() < cached.expires) {
    const response = new Response(JSON.stringify(cached.data), {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'HIT',
        'Cache-Control': 'public, max-age=300'
      }
    });
    return response;
  }
  
  return null;
}

function setCachedResponse(request: NextRequest, data: any): void {
  if (request.method !== 'GET') return;
  
  const pathname = request.nextUrl.pathname;
  const config = Object.entries(cacheConfig).find(([path]) => 
    pathname.startsWith(path)
  )?.[1] || cacheConfig.default;
  
  const key = getCacheKey(request);
  responseCache.set(key, {
    data,
    expires: Date.now() + (config.ttl * 1000)
  });
}

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;
  
  // Performance monitoring
  const metrics: PerformanceMetrics = {
    responseTime: 0,
    cacheHit: false,
    slowRequest: false
  };
  
  // Rate limiting check
  if (isRateLimited(request)) {
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': '60',
        'X-RateLimit-Limit': '60',
        'X-RateLimit-Remaining': '0'
      }
    });
  }
  
  // Check cache for API routes
  if (pathname.startsWith('/api/')) {
    const cachedResponse = getCachedResponse(request);
    if (cachedResponse) {
      metrics.cacheHit = true;
      metrics.responseTime = Date.now() - startTime;
      
      // Add performance headers
      cachedResponse.headers.set('X-Response-Time', `${metrics.responseTime}ms`);
      cachedResponse.headers.set('X-Cache-Hit', 'true');
      
      return cachedResponse;
    }
  }
  
  // Check if it's a public route
  if (publicRoutes.some(route => pathname === route || pathname.startsWith('/api/health'))) {
    const response = NextResponse.next();
    addPerformanceHeaders(response, metrics, startTime);
    return response;
  }
  
  // Handle auth routes
  if (authRoutes.some(route => pathname.startsWith(route))) {
    // If user is already authenticated, redirect to dashboard
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    const response = NextResponse.next();
    addPerformanceHeaders(response, metrics, startTime);
    return response;
  }
  
  // Handle protected routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // If user is not authenticated, redirect to login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // Handle legacy redirects
  if (pathname.startsWith('/dashboard/analysis')) {
    const newPath = pathname.replace('/dashboard/analysis', '/analyses');
    return NextResponse.redirect(new URL(newPath, request.url));
  }
  
  if (pathname === '/analysis') {
    return NextResponse.redirect(new URL('/analyses', request.url));
  }
  
  if (pathname.startsWith('/analysis/results/')) {
    const jobId = pathname.split('/')[3];
    return NextResponse.redirect(new URL(`/analyses/${jobId}`, request.url));
  }
  
  // Redirect bare analysis and project routes to dashboard context
  if (pathname === '/projects') {
    return NextResponse.redirect(new URL('/dashboard/projects', request.url));
  }
  
  // Auto-redirect analysis pages to overview tab
  const analysisMatch = pathname.match(/^\/analyses\/([^\/]+)$/);
  if (analysisMatch) {
    return NextResponse.redirect(new URL(`${pathname}/overview`, request.url));
  }
  
  const projectAnalysisMatch = pathname.match(/^\/projects\/([^\/]+)\/analyses\/([^\/]+)$/);
  if (projectAnalysisMatch) {
    return NextResponse.redirect(new URL(`${pathname}/overview`, request.url));
  }
  
  const response = NextResponse.next();
  addPerformanceHeaders(response, metrics, startTime);
  return response;
}

function addPerformanceHeaders(response: NextResponse, metrics: PerformanceMetrics, startTime: number): void {
  metrics.responseTime = Date.now() - startTime;
  metrics.slowRequest = metrics.responseTime > 1000;
  
  // Add performance headers
  response.headers.set('X-Response-Time', `${metrics.responseTime}ms`);
  response.headers.set('X-Cache-Hit', metrics.cacheHit.toString());
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Add cache control headers for static assets
  if (response.url && (
    response.url.includes('/_next/static/') ||
    response.url.includes('/images/') ||
    response.url.includes('/icons/')
  )) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // Add compression hint
  response.headers.set('Vary', 'Accept-Encoding');
  
  // Log slow requests
  if (metrics.slowRequest) {
    console.warn(`Slow request detected: ${response.url} took ${metrics.responseTime}ms`);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 