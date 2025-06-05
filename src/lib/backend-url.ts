/**
 * Utility for consistent backend URL handling across the application
 */

/**
 * Ensures a URL has the proper protocol (http:// or https://) and /api path
 */
export function ensureProtocol(url: string): string {
  if (!url) return 'http://localhost:4000/api';
  
  let processedUrl = url;
  
  // If URL already has protocol, extract it
  if (url.startsWith('http://') || url.startsWith('https://')) {
    processedUrl = url;
  } else {
    // Add https:// for production domains, http:// for localhost
    if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('backend:')) {
      processedUrl = `http://${url}`;
    } else {
      // For production domains, always use https
      processedUrl = `https://${url}`;
    }
  }
  
  // Ensure /api path is included if not present, unless it's a Railway URL
  if (!processedUrl.includes('railway.app') && !processedUrl.endsWith('/api') && !processedUrl.includes('/api/')) {
    processedUrl = processedUrl.endsWith('/') ? `${processedUrl}api` : `${processedUrl}/api`;
  }
  
  return processedUrl;
}

/**
 * Gets the backend URL with proper protocol
 */
export function getBackendUrl(): string {
  const url = process.env.BACKEND_URL || 
              process.env.NEXT_PUBLIC_BACKEND_URL || 
              'http://localhost:4000/api';
  
  return ensureProtocol(url);
}

/**
 * Gets the backend URL for server-side API routes
 * Prefers BACKEND_URL over NEXT_PUBLIC_BACKEND_URL
 */
export function getServerBackendUrl(): string {
  // For server-side, prefer non-public env var
  const url = process.env.BACKEND_URL || 
              process.env.NEXT_PUBLIC_BACKEND_URL || 
              'http://localhost:4000/api';
  
  return ensureProtocol(url);
}

/**
 * Gets the backend URL for client-side usage
 * Only uses NEXT_PUBLIC_BACKEND_URL
 */
export function getClientBackendUrl(): string {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api';
  return ensureProtocol(url);
}