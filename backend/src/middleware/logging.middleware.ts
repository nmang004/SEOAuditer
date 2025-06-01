import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Express middleware for logging HTTP requests
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, url, ip } = req;
  
  // Skip logging for health checks and static assets to reduce noise
  if (url.includes('/health') || url.includes('.js') || url.includes('.css')) {
    return next();
  }

  // Log the incoming request
  logger.info(`${method} ${url}`, {
    ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Capture response finish to log completion
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    // Log response with appropriate level based on status code
    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel](`${method} ${url} ${statusCode} - ${duration}ms`, {
      ip,
      statusCode,
      duration,
      responseSize: data ? Buffer.byteLength(data, 'utf8') : 0,
      timestamp: new Date().toISOString()
    });
    
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware for logging errors with request context
 */
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const { method, url, ip } = req;
  
  logger.error('Request error occurred', {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    },
    request: {
      method,
      url,
      ip,
      userAgent: req.get('User-Agent'),
      body: method !== 'GET' ? req.body : undefined
    },
    timestamp: new Date().toISOString()
  });

  next(err);
}; 