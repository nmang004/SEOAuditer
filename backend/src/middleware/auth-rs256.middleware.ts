import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { jwtService, ExtendedJWTPayload } from '../services/jwt-rs256.service';
import { 
  UnauthorizedError, 
  ForbiddenError,
  ValidationError 
} from './error.middleware';
import { logger } from '../utils/logger';
import { config } from '../config/config';
import helmet from 'helmet';
import cors from 'cors';

const prisma = new PrismaClient();

// Extend Express Request type to include user and security context
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      permissions?: string[];
      sessionId?: string;
      securityContext?: SecurityContext;
    }
  }
}

interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  role: 'user' | 'admin';
  subscriptionTier: string;
  emailVerified: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SecurityContext {
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  sessionId?: string;
  timestamp: Date;
  riskScore?: number;
}

/**
 * Security headers middleware using helmet.js
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", config.apiUrl],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

/**
 * CORS configuration for frontend integration
 */
export const authCors = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = config.cors.origin;
    
    if (allowedOrigins.includes(origin) || config.env === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Device-ID',
    'X-Client-ID',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400 // 24 hours
});

/**
 * Enhanced JWT token verification middleware
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract security context
    const securityContext: SecurityContext = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      deviceId: req.get('X-Device-ID') || req.get('X-Client-ID'),
      timestamp: new Date()
    };

    req.securityContext = securityContext;

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('Access token is required');
    }

    // Verify token using RS256 JWT service
    const decoded = await jwtService.verifyAccessToken(token);

    if (!decoded) {
      throw new UnauthorizedError('Invalid or expired access token');
    }

    // Get user from database with fresh data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionTier: true,
        emailVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        accountLocked: true,
        lockoutExpires: true
      }
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Check if account is locked
    if (user.accountLocked && user.lockoutExpires && user.lockoutExpires > new Date()) {
      const lockoutMinutes = Math.ceil((user.lockoutExpires.getTime() - Date.now()) / (1000 * 60));
      throw new UnauthorizedError(`Account is locked. Try again in ${lockoutMinutes} minutes.`);
    }

    // Check if email is verified for protected routes (bypass in development mode)
    if (!user.emailVerified && config.env !== 'development') {
      throw new UnauthorizedError('Email verification required');
    }

    // Attach user and session info to request object
    req.user = {
      ...user,
      role: decoded.role
    } as AuthenticatedUser;
    req.permissions = decoded.permissions || [];
    req.sessionId = decoded.sessionId;

    // Update security context with user info
    req.securityContext!.sessionId = decoded.sessionId;
    req.securityContext!.riskScore = calculateRiskScore(decoded, securityContext);

    // Log access for security monitoring
    logger.debug('Authenticated request', {
      userId: user.id,
      email: user.email,
      role: decoded.role,
      sessionId: decoded.sessionId,
      endpoint: req.path,
      method: req.method,
      ipAddress: securityContext.ipAddress,
      riskScore: req.securityContext!.riskScore
    });

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      // Log authentication failure
      logger.warn('Authentication failed', {
        error: error.message,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
      
      res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: error.message
      });
    } else {
      logger.error('Authentication middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Authentication service unavailable'
      });
    }
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = await jwtService.verifyAccessToken(token);
      
      if (decoded) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            name: true,
            subscriptionTier: true,
            emailVerified: true,
            lastLogin: true,
            createdAt: true,
            updatedAt: true,
            accountLocked: true,
            lockoutExpires: true
          }
        });

        if (user && !(user.accountLocked && user.lockoutExpires && user.lockoutExpires > new Date())) {
          req.user = {
            ...user,
            role: decoded.role
          } as AuthenticatedUser;
          req.permissions = decoded.permissions || [];
          req.sessionId = decoded.sessionId;
        }
      }
    }

    next();
  } catch (error) {
    // Don't fail for optional auth - just continue without user
    logger.debug('Optional auth failed:', error);
    next();
  }
};

/**
 * Require authentication middleware
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'You must be logged in to access this resource'
    });
    return;
  }
  next();
};

/**
 * Role-based access control middleware
 */
export const requireRole = (roles: string[] | string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const requiredRoles = Array.isArray(roles) ? roles : [roles];
      const userRole = req.user.role;

      if (!requiredRoles.includes(userRole)) {
        logger.warn('Role authorization failed', {
          userId: req.user.id,
          userRole,
          requiredRoles,
          endpoint: req.path,
          method: req.method,
          ipAddress: req.ip
        });
        
        throw new ForbiddenError(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
      }

      next();
    } catch (error) {
      if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
        res.status(error instanceof UnauthorizedError ? 401 : 403).json({
          success: false,
          error: error instanceof UnauthorizedError ? 'Authentication required' : 'Access forbidden',
          message: error.message
        });
      } else {
        next(error);
      }
    }
  };
};

/**
 * Admin role requirement middleware
 */
export const requireAdminAuth = requireRole(['admin']);

/**
 * Permission-based access control middleware
 */
export const requirePermission = (requiredPermissions: string[] | string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      if (!req.permissions) {
        throw new ForbiddenError('User permissions not available');
      }

      const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
      const hasPermission = permissions.some(permission => req.permissions!.includes(permission));

      if (!hasPermission) {
        logger.warn('Permission authorization failed', {
          userId: req.user.id,
          userPermissions: req.permissions,
          requiredPermissions: permissions,
          endpoint: req.path,
          method: req.method,
          ipAddress: req.ip
        });
        
        throw new ForbiddenError(`Access denied. Required permissions: ${permissions.join(', ')}`);
      }

      next();
    } catch (error) {
      if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
        res.status(error instanceof UnauthorizedError ? 401 : 403).json({
          success: false,
          error: error instanceof UnauthorizedError ? 'Authentication required' : 'Access forbidden',
          message: error.message
        });
      } else {
        next(error);
      }
    }
  };
};

/**
 * Resource ownership validation middleware
 */
export const requireOwnership = (resourceIdParam: string = 'id', userIdField: string = 'userId') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      // Admin users bypass ownership checks
      if (req.user.role === 'admin') {
        next();
        return;
      }

      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        throw new ValidationError(`Resource ID parameter '${resourceIdParam}' is required`);
      }

      // This is a generic check - specific resource validation should be done in route handlers
      // For now, we'll log the ownership check and continue
      logger.debug('Ownership check', {
        userId: req.user.id,
        resourceId,
        resourceIdParam,
        userIdField
      });

      next();
    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ValidationError) {
        res.status(error instanceof UnauthorizedError ? 401 : 400).json({
          success: false,
          error: error instanceof UnauthorizedError ? 'Authentication required' : 'Validation error',
          message: error.message
        });
      } else {
        next(error);
      }
    }
  };
};

/**
 * Email verification requirement middleware
 */
export const requireEmailVerified = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!req.user.emailVerified) {
      logger.warn('Email verification required', {
        userId: req.user.id,
        email: req.user.email,
        endpoint: req.path,
        method: req.method,
        ipAddress: req.ip
      });
      
      throw new ForbiddenError('Email verification required. Please verify your email address.');
    }

    next();
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
      res.status(error instanceof UnauthorizedError ? 401 : 403).json({
        success: false,
        error: error instanceof UnauthorizedError ? 'Authentication required' : 'Email verification required',
        message: error.message
      });
    } else {
      next(error);
    }
  }
};

/**
 * Activity tracking middleware
 */
export const trackActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user) {
      // Track user activity for analytics and security monitoring
      const activityData = {
        userId: req.user.id,
        action: `${req.method} ${req.path}`,
        details: {
          endpoint: req.path,
          method: req.method,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          timestamp: new Date().toISOString()
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };

      // Log activity asynchronously to avoid blocking the request
      setImmediate(async () => {
        try {
          await prisma.activityLog.create({
            data: activityData
          });
        } catch (error) {
          logger.error('Failed to log activity:', error);
        }
      });
    }

    next();
  } catch (error) {
    // Don't fail the request if activity tracking fails
    logger.error('Activity tracking middleware error:', error);
    next();
  }
};

/**
 * Calculate risk score based on request context
 */
function calculateRiskScore(decoded: ExtendedJWTPayload, securityContext: SecurityContext): number {
  let riskScore = 0;

  // IP address change
  if (decoded.ipAddress && decoded.ipAddress !== securityContext.ipAddress) {
    riskScore += 30;
  }

  // New device
  if (!decoded.deviceId && securityContext.deviceId) {
    riskScore += 20;
  }

  // Different device
  if (decoded.deviceId && decoded.deviceId !== securityContext.deviceId) {
    riskScore += 40;
  }

  // User agent change (simplified check)
  if (decoded.ipAddress === securityContext.ipAddress && 
      securityContext.userAgent && 
      !securityContext.userAgent.includes('Chrome')) {
    riskScore += 10;
  }

  return Math.min(riskScore, 100); // Cap at 100
}

/**
 * High-risk activity detection middleware
 */
export const detectHighRiskActivity = (threshold: number = 70) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (req.securityContext && req.securityContext.riskScore! >= threshold) {
        logger.warn('High-risk activity detected', {
          userId: req.user?.id,
          riskScore: req.securityContext.riskScore,
          threshold,
          ipAddress: req.securityContext.ipAddress,
          userAgent: req.securityContext.userAgent,
          endpoint: req.path
        });

        // For high-risk activities, we might want to:
        // 1. Require additional authentication
        // 2. Send security alerts
        // 3. Temporarily restrict access
        // For now, we'll just log and continue
      }

      next();
    } catch (error) {
      logger.error('Risk detection middleware error:', error);
      next();
    }
  };
};

/**
 * CSRF protection middleware
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Skip CSRF protection for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  // Skip CSRF protection for API requests with valid JWT tokens
  if (req.headers.authorization && req.user) {
    next();
    return;
  }

  // For form-based requests, check CSRF token
  const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionCsrfToken = req.session?.csrfToken;

  if (!csrfToken || csrfToken !== sessionCsrfToken) {
    logger.warn('CSRF protection triggered', {
      userId: req.user?.id,
      ipAddress: req.ip,
      endpoint: req.path,
      method: req.method
    });

    res.status(403).json({
      success: false,
      error: 'CSRF token validation failed',
      message: 'Invalid or missing CSRF token'
    });
    return;
  }

  next();
};

export type {
  AuthenticatedUser,
  SecurityContext
}; 