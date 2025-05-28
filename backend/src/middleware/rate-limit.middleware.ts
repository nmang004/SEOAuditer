import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redisClient } from '../index';
import { RateLimitError } from './error.middleware';
import { config } from '../config/config';

// Create rate limiter for general API endpoints
export const apiRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rate_limit:api',
  points: config.rateLimit.max, // Number of points
  duration: config.rateLimit.windowMs / 1000, // Per second
  blockDuration: 60 * 15, // Block for 15 minutes if rate limit is exceeded
});

// Create rate limiter for authentication endpoints
export const authRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rate_limit:auth',
  points: 5, // 5 login attempts
  duration: 60 * 60, // Per hour
  blockDuration: 60 * 60, // Block for 1 hour if rate limit is exceeded
});

// Middleware to handle rate limiting
export const rateLimiter = (limiter: RateLimiterRedis) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Use IP address as the identifier
      const ip = req.ip || 'unknown';
      const identifier = `${ip}:${req.path}`;
      
      // Consume 1 point per request
      await limiter.consume(identifier);
      next();
    } catch (rateLimiterRes) {
      // Set rate limit headers
      res.set({
        'Retry-After': Math.ceil(rateLimiterRes.msBeforeNext / 1000).toString(),
        'X-RateLimit-Limit': config.rateLimit.max.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString(),
      });

      throw new RateLimitError('Too many requests, please try again later');
    }
  };

// Apply rate limiting to different routes
export const rateLimit = {
  // For general API endpoints
  api: rateLimiter(apiRateLimiter),
  // For authentication endpoints
  auth: rateLimiter(authRateLimiter),
};

export default rateLimit;
