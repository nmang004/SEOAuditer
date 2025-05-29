import { Request, Response, NextFunction, RequestHandler } from 'express';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { redisClient } from '../index';
import { RateLimitError } from './error.middleware';
import { config } from '../config/config';

const isTest = process.env.NODE_ENV === 'test';
const isDevelopment = process.env.NODE_ENV === 'development';

type RateLimiter = RateLimiterMemory | RateLimiterRedis;

// Memory-based rate limiter for when Redis is not available
const createMemoryRateLimiter = (points: number, duration: number, blockDuration: number) => {
  return new RateLimiterMemory({
    points,
    duration,
    blockDuration,
  });
};

// Create rate limiter for general API endpoints
let apiRateLimiter: RateLimiter;
let authRateLimiter: RateLimiter;

// Initialize rate limiters
if (isTest) {
  // For tests, use memory limiters with high limits
  apiRateLimiter = createMemoryRateLimiter(1000, 1, 0);
  authRateLimiter = createMemoryRateLimiter(1000, 1, 0);
} else if (redisClient.isReady) {
  // Use Redis-based rate limiting if available
  apiRateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rate_limit:api',
    points: config.rateLimit.max,
    duration: Math.floor(config.rateLimit.windowMs / 1000),
    blockDuration: 60 * 15,
  });

  authRateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rate_limit:auth',
    points: 5,
    duration: 60 * 60,
    blockDuration: 60 * 60,
  });
  
  console.log('Using Redis-based rate limiting');
} else {
  // Fall back to memory-based rate limiting
  if (isDevelopment) {
    console.warn('Using in-memory rate limiting. For production, use Redis.');
  }
  
  apiRateLimiter = createMemoryRateLimiter(
    config.rateLimit.max,
    Math.floor(config.rateLimit.windowMs / 1000),
    60 * 15
  );

  authRateLimiter = createMemoryRateLimiter(
    5,           // 5 login attempts
    60 * 60,     // 1 hour
    60 * 60      // Block for 1 hour
  );
}

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
      await limiter.consume(identifier);
      next();
    } catch (rateLimiterRes: any) {
      // Set rate limit headers
      const headers = {
        'Retry-After': Math.ceil(rateLimiterRes.msBeforeNext / 1000).toString(),
        'X-RateLimit-Limit': config.rateLimit.max.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString(),
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
