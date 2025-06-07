import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../services/enhanced-jwt.service';
import { PrismaClient } from '@prisma/client';
import { UnauthorizedError, ForbiddenError, ValidationError } from './error.middleware';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Extend Express Request type to include user and permissions
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      permissions?: string[];
      sessionId?: string;
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

/**
 * Enhanced JWT token verification middleware
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('Access token is required');
    }

    // Verify token using enhanced JWT service
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

    // Attach user and session info to request object
    req.user = {
      ...user,
      role: decoded.role
    } as AuthenticatedUser;
    req.permissions = decoded.permissions || [];
    req.sessionId = decoded.sessionId;

    // Log access for security monitoring
    logger.debug('Authenticated request', {
      userId: user.id,
      email: user.email,
      role: decoded.role,
      sessionId: decoded.sessionId,
      endpoint: req.path,
      method: req.method,
      ip: req.ip
    });

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      // Log authentication failure
      logger.warn('Authentication failed', {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method
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
 * Role-based access control middleware
 */
export const requireRole = (requiredRoles: ('user' | 'admin')[] | 'user' | 'admin') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      if (!roles.includes(req.user.role)) {
        logger.warn('Role authorization failed', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: roles,
          endpoint: req.path,
          method: req.method,
          ip: req.ip
        });
        
        throw new ForbiddenError(`Access denied. Required roles: ${roles.join(', ')}`);
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
          ip: req.ip
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
 * Subscription tier validation middleware
 */
export const requireSubscription = (requiredTiers: string[] | string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const tiers = Array.isArray(requiredTiers) ? requiredTiers : [requiredTiers];
      
      if (!tiers.includes(req.user.subscriptionTier)) {
        logger.warn('Subscription tier authorization failed', {
          userId: req.user.id,
          userTier: req.user.subscriptionTier,
          requiredTiers: tiers,
          endpoint: req.path,
          method: req.method,
          ip: req.ip
        });
        
        throw new ForbiddenError(`Access denied. Required subscription tiers: ${tiers.join(', ')}`);
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
        ip: req.ip
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
 * Resource ownership validation middleware
 * Checks if user owns the requested resource
 */
export const requireOwnership = (resourceParam: string = 'id', resourceType: 'project' | 'analysis' = 'project') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const resourceId = req.params[resourceParam];
      
      if (!resourceId) {
        throw new ValidationError(`Resource ${resourceParam} is required`);
      }

      // Admin users can access any resource
      if (req.user.role === 'admin') {
        return next();
      }

      let resource;
      
      if (resourceType === 'project') {
        resource = await prisma.project.findUnique({
          where: { id: resourceId },
          select: { userId: true }
        });
      } else if (resourceType === 'analysis') {
        resource = await prisma.sEOAnalysis.findUnique({
          where: { id: resourceId },
          include: { project: { select: { userId: true } } }
        });
      }

      if (!resource) {
        throw new ForbiddenError('Resource not found or access denied');
      }

      const ownerId = resourceType === 'project' 
        ? (resource as any).userId 
        : (resource as any).project.userId;

      if (ownerId !== req.user.id) {
        logger.warn('Resource ownership authorization failed', {
          userId: req.user.id,
          resourceId,
          resourceType,
          ownerId,
          endpoint: req.path,
          method: req.method,
          ip: req.ip
        });
        
        throw new ForbiddenError('Access denied. You do not own this resource.');
      }

      next();
    } catch (error) {
      if (error instanceof ForbiddenError || error instanceof UnauthorizedError || error instanceof ValidationError) {
        const statusCode = error instanceof UnauthorizedError ? 401 : 
                          error instanceof ValidationError ? 400 : 403;
        
        res.status(statusCode).json({
          success: false,
          error: error.constructor.name,
          message: error.message
        });
      } else {
        next(error);
      }
    }
  };
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Remove server signature
  res.removeHeader('X-Powered-By');
  
  // Strict-Transport-Security for HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
};

/**
 * CORS configuration for authentication endpoints
 */
export const authCors = (req: Request, res: Response, next: NextFunction): void => {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
  const origin = req.get('Origin');

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Device-ID, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
};

/**
 * Rate limiting bypass for authenticated users (higher limits)
 */
export const authenticatedRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  // Set a custom header that rate limiting middleware can check
  if (req.user) {
    req.headers['x-authenticated-user'] = 'true';
    req.headers['x-user-role'] = req.user.role;
    req.headers['x-subscription-tier'] = req.user.subscriptionTier;
  }
  
  next();
};

/**
 * Session activity tracking middleware
 */
export const trackActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user && req.sessionId) {
      // Update session activity timestamp (handled by JWT service)
      logger.debug('User activity tracked', {
        userId: req.user.id,
        sessionId: req.sessionId,
        endpoint: req.path,
        method: req.method,
        ip: req.ip
      });
    }
    next();
  } catch (error) {
    logger.error('Activity tracking failed:', error);
    next(); // Don't fail the request if activity tracking fails
  }
};

// Export commonly used middleware combinations
export const requireAuth = [authenticateToken, trackActivity];
export const requireAdminAuth = [authenticateToken, requireRole('admin'), trackActivity];
export const requireUserAuth = [authenticateToken, requireRole(['user', 'admin']), trackActivity];
export const requireVerifiedUser = [authenticateToken, requireEmailVerified, trackActivity];

// Export individual middlewares
export {
  authenticateToken as authenticate
};

export type {
  AuthenticatedUser
}; 