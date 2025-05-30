import { Request, Response, NextFunction, RequestHandler } from 'express';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { RateLimitError } from './error.middleware';
import { config } from '../config/config';

const isTest = process.env.NODE_ENV === 'test';

type RateLimiter = RateLimiterMemory | RateLimiterRedis;

// Memory-based rate limiter for when Redis is not available
const createMemoryRateLimiter = (points: number, duration: number) => {
  return new RateLimiterMemory({
    points,
    duration: duration >= 1 ? duration : 1, // Ensure duration is at least 1 second
    // blockDuration is not a valid property in the current version
  });
};

// Create rate limiter for general API endpoints
let apiRateLimiter: RateLimiter = createMemoryRateLimiter(100, 60); // Default: 100 requests per minute
let authRateLimiter: RateLimiter = createMemoryRateLimiter(5, 60 * 60); // Default: 5 requests per hour

// Rate limiter response type
type RateLimiterResponse = {
  remainingPoints: number;
  msBeforeNext: number;
  consumedPoints: number;
  isFirstInDuration: boolean;
};

// Create rate limiter middleware
const createRateLimiter = (limiter: RateLimiter): RequestHandler => {
  if (isTest || !limiter) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Use IP address as the identifier
      const ip = req.ip || 'unknown';
      const identifier = `${ip}:${req.path}`;
      
      // Consume 1 point per request
      const rateLimiterRes = await (limiter.consume(identifier) as unknown as Promise<RateLimiterResponse>);
      
      // Set rate limit headers for successful requests
      const headers = {
        'X-RateLimit-Limit': config.rateLimit.max.toString(),
        'X-RateLimit-Remaining': rateLimiterRes.remainingPoints.toString(),
        'X-RateLimit-Reset': new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString(),
      };
      
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      next();
    } catch (error: any) {
      // Default values if error doesn't contain rate limit info
      const msBeforeNext = error.msBeforeNext || 60000;
      const retryAfter = Math.ceil(msBeforeNext / 1000).toString();
      
      // Set rate limit headers for rate-limited requests
      const headers = {
        'Retry-After': retryAfter,
        'X-RateLimit-Limit': config.rateLimit.max.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + msBeforeNext).toISOString(),
      };
      
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      const err = new RateLimitError('Too many requests, please try again later');
      next(err);
    }
  };
};

// Create rate limiters
const apiLimiter = createRateLimiter(apiRateLimiter);
const authLimiter = createRateLimiter(authRateLimiter);

// Export rate limiters
export const rateLimit = {
  api: apiLimiter,
  auth: authLimiter,
};

export default rateLimit;
