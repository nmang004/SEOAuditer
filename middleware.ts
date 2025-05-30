import { NextRequest, NextResponse } from 'next/server';

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;
  
  // Check if it's a public route
  if (publicRoutes.some(route => pathname === route || pathname.startsWith('/api/health'))) {
    return NextResponse.next();
  }
  
  // Handle auth routes
  if (authRoutes.some(route => pathname.startsWith(route))) {
    // If user is already authenticated, redirect to dashboard
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
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
  
  return NextResponse.next();
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