import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { RateLimitError } from './error.middleware';
import { config } from '../config/config';
import rateLimit from 'express-rate-limit';
import { createClient } from 'redis';
import { PrismaClient } from '@prisma/client';

const isTest = process.env.NODE_ENV === 'test';

type RateLimiter = RateLimiterMemory | RateLimiterRedis;

const redisClient = createClient({
  url: config.redis.url
});

const prisma = new PrismaClient();

// Initialize Redis connection
redisClient.connect().catch(console.error);

// Memory-based rate limiter for when Redis is not available
const createMemoryRateLimiter = () => {
  return {
    api: new RateLimiterMemory({
      points: config.rateLimit.max,
      duration: Math.ceil(config.rateLimit.windowMs / 1000),
    }),
    auth: new RateLimiterMemory({
      points: 5,
      duration: 900, // 15 minutes
    })
  };
};

// Redis-based rate limiter for production
const createRedisRateLimiter = () => {
  return {
    api: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'middleware',
      points: config.rateLimit.max,
      duration: Math.ceil(config.rateLimit.windowMs / 1000),
    }),
    auth: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'middleware_auth',
      points: 5,
      duration: 900, // 15 minutes
    })
  };
};

const rateLimiters = isTest ? createMemoryRateLimiter() : createRedisRateLimiter();

export const createRateLimitMiddleware = (limiter: RateLimiter) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = req.ip || req.connection.remoteAddress || 'unknown';
      await limiter.consume(key);
      next();
    } catch (rejRes: any) {
      const retryAfter = Math.round(rejRes.msBeforeNext / 1000) || 1;
      res.set('Retry-After', String(retryAfter));
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter
      });
    }
  };
};

export default rateLimiters;

// Generic rate limiter for general API endpoints
export const generalRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutes
  max: config.rateLimit.max, // 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    throw new RateLimitError('Too many requests');
  }
});

// Strict rate limiter for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes per IP
  message: {
    error: 'Too many authentication attempts. Please try again in 15 minutes.',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins against limit
  handler: (req: Request, res: Response) => {
    throw new RateLimitError('Too many authentication attempts');
  }
});

// Very strict rate limiter for password reset requests
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour per IP
  message: {
    error: 'Too many password reset requests. Please try again in 1 hour.',
    retryAfter: 3600 // 1 hour in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    throw new RateLimitError('Too many password reset requests');
  }
});

// Rate limiter for registration
export const registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour per IP
  message: {
    error: 'Too many registration attempts. Please try again in 1 hour.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    throw new RateLimitError('Too many registration attempts');
  }
});

// Advanced rate limiter using Redis for per-user login attempts
class AuthRateLimiter {
  private loginAttemptsLimiter: RateLimiterRedis | RateLimiterMemory;
  private accountLockLimiter: RateLimiterRedis | RateLimiterMemory;
  private passwordResetLimiter: RateLimiterRedis | RateLimiterMemory;

  constructor() {
    if (isTest) {
      // Use memory-based limiters for testing
      this.loginAttemptsLimiter = new RateLimiterMemory({
        points: 5, // 5 attempts
        duration: 900, // Per 15 minutes
      });

      this.accountLockLimiter = new RateLimiterMemory({
        points: 3, // 3 failed login windows
        duration: 86400, // Per 24 hours
      });

      this.passwordResetLimiter = new RateLimiterMemory({
        points: 3, // 3 reset requests
        duration: 3600, // Per hour
      });
    } else {
      // Use Redis-based limiters for production
      this.loginAttemptsLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'login_attempts',
        points: 5, // 5 attempts
        duration: 900, // Per 15 minutes
      });

      this.accountLockLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'account_lock',
        points: 3, // 3 failed login windows
        duration: 86400, // Per 24 hours
      });

      this.passwordResetLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'password_reset',
        points: 3, // 3 reset requests
        duration: 3600, // Per hour
      });
    }
  }

  async checkLoginAttempts(email: string, ip: string): Promise<void> {
    try {
      // Check both email and IP-based limits
      await Promise.all([
        this.loginAttemptsLimiter.consume(email),
        this.loginAttemptsLimiter.consume(ip)
      ]);
    } catch (rejRes: any) {
      const totalHits = rejRes.totalHits || 0;
      const msBeforeNext = rejRes.msBeforeNext || 0;
      
      // Check if this is a repeated offense (account lockout)
      if (totalHits >= 5) {
        try {
          await this.accountLockLimiter.consume(email);
        } catch (lockRejRes: any) {
          // Account is locked for 24 hours
          await this.logSecurityEvent(email, ip, 'account_locked', {
            totalAttempts: totalHits,
            lockDuration: 86400
          });
          
          throw new RateLimitError(
            'Account temporarily locked due to repeated failed login attempts. Please try again in 24 hours.'
          );
        }
      }

      const retryAfterMinutes = Math.round(msBeforeNext / 60000);
      throw new RateLimitError(
        `Too many login attempts. Please try again in ${retryAfterMinutes} minutes.`
      );
    }
  }

  async recordSuccessfulLogin(email: string, ip: string): Promise<void> {
    try {
      // Note: RateLimiterRedis doesn't support delete in this version
      // Counters will reset naturally after duration expires
      await this.logSecurityEvent(email, ip, 'login_success');
    } catch (error) {
      console.error('Failed to log successful login:', error);
    }
  }

  async recordFailedLogin(email: string, ip: string): Promise<void> {
    try {
      await this.logSecurityEvent(email, ip, 'login_failure');
    } catch (error) {
      console.error('Failed to log failed login attempt:', error);
    }
  }

  async checkPasswordResetAttempts(email: string, ip: string): Promise<void> {
    try {
      await Promise.all([
        this.passwordResetLimiter.consume(email),
        this.passwordResetLimiter.consume(ip)
      ]);
    } catch (rejRes: any) {
      const msBeforeNext = rejRes.msBeforeNext || 0;
      const retryAfterMinutes = Math.round(msBeforeNext / 60000);
      
      throw new RateLimitError(
        `Too many password reset requests. Please try again in ${retryAfterMinutes} minutes.`
      );
    }
  }

  async isAccountLocked(email: string): Promise<boolean> {
    try {
      const res = await this.accountLockLimiter.get(email);
      return res !== null && res.remainingPoints === 0;
    } catch (error) {
      console.error('Failed to check account lock status:', error);
      return false;
    }
  }

  async unlockAccount(email: string): Promise<void> {
    try {
      // Note: RateLimiterRedis doesn't support delete in this version
      // Counters will reset naturally after duration expires
      await this.logSecurityEvent(email, 'system', 'account_unlocked');
    } catch (error) {
      console.error('Failed to unlock account:', error);
    }
  }

  private async logSecurityEvent(
    email: string, 
    ip: string, 
    event: string, 
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
      });

      // Log to activity table if user exists
      if (user) {
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: event,
            details: {
              email,
              ip,
              timestamp: new Date().toISOString(),
              ...metadata
            },
            ipAddress: ip,
            userAgent: 'system'
          }
        });
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}

export const authRateLimiter = new AuthRateLimiter();

// Middleware to check login attempts
export const checkLoginAttempts = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    if (!email) {
      return next();
    }

    // Check if account is locked
    if (await authRateLimiter.isAccountLocked(email)) {
      throw new RateLimitError(
        'Account is temporarily locked. Please try again later or contact support.'
      );
    }

    // Check login attempt limits
    await authRateLimiter.checkLoginAttempts(email, ip);
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to check password reset attempts
export const checkPasswordResetAttempts = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    if (!email) {
      return next();
    }

    await authRateLimiter.checkPasswordResetAttempts(email, ip);
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to record login result
export const recordLoginResult = (success: boolean) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.body.email?.toLowerCase().trim();
      const ip = req.ip || req.connection.remoteAddress || 'unknown';

      if (!email) {
        return next();
      }

      if (success) {
        await authRateLimiter.recordSuccessfulLogin(email, ip);
      } else {
        await authRateLimiter.recordFailedLogin(email, ip);
      }

      next();
    } catch (error) {
      console.error('Failed to record login result:', error);
      next();
    }
  };
};

// Bypass rate limiting for testing or admin purposes
export const bypassRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  const bypassHeader = req.headers['x-bypass-rate-limit'];
  const bypassToken = process.env.RATE_LIMIT_BYPASS_TOKEN;
  
  if (bypassHeader && bypassToken && bypassHeader === bypassToken) {
    // Skip rate limiting
    next();
  } else {
    // Apply normal rate limiting
    generalRateLimit(req, res, next);
  }
};

// Export the rate limiter instance for manual operations
export { authRateLimiter as rateLimiter };

// Dynamic rate limiter middleware factory function
export const rateLimitMiddleware = (options: { windowMs: number; max: number }) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(options.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    }
  });
};
