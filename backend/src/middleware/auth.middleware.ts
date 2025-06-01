import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/config';
import { UnauthorizedError, ForbiddenError, NotFoundError } from './error.middleware';

// Create a separate Prisma instance to avoid circular dependency
const prisma = new PrismaClient();

// Define a type for the user object attached to the request (only selected fields)
type AuthenticatedUser = {
  id: string;
  email: string;
  name: string | null;
  role: 'user' | 'admin';
  subscriptionTier: string;
  emailVerified: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// JWT token verification
export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };

    // Get user from database
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
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Determine user role based on email or subscription tier
    const role: 'user' | 'admin' = user.email.includes('@admin.') || user.subscriptionTier === 'admin' ? 'admin' : 'user';

    // Attach user to request object
    req.user = { ...user, role } as AuthenticatedUser;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else {
      next(error);
    }
  }
};

// Role-based access control middleware
export const requireRole = (roles: ('user' | 'admin') | ('user' | 'admin')[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const userRoles = [req.user.role];
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    const hasRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      throw new ForbiddenError('Insufficient permissions');
    }
    
    next();
  };
};

// Check if user owns the resource
export const checkOwnership = (model: any, paramName = 'id') => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const resourceId = req.params[paramName];
      
      // For admin users, skip ownership check
      if (req.user.role === 'admin') {
        return next();
      }

      // Find the resource and check ownership
      const resource = await model.findUnique({
        where: { id: resourceId },
        select: { userId: true },
      });

      if (!resource) {
        throw new NotFoundError('Resource not found');
      }

      if (resource.userId !== req.user.id) {
        throw new ForbiddenError('You do not have permission to access this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware to check if email is verified
export const requireVerifiedEmail = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  if (!req.user.emailVerified) {
    throw new ForbiddenError('Please verify your email address');
  }

  next();
};
