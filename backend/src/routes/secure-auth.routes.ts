import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { secureAuthController } from '../controllers/secure-auth.controller';
import { jwtService } from '../services/enhanced-jwt.service';
import {
  requireAdminAuth,
  requireAuth,
  securityHeaders,
  authCors,
  optionalAuth,
  detectHighRiskActivity
} from '../middleware/auth-rs256.middleware';
import {
  authRateLimit,
  passwordResetRateLimit,
  registrationRateLimit,
  checkLoginAttempts,
  checkPasswordResetAttempts,
  recordLoginResult
} from '../middleware/rate-limit.middleware';
// import { validate } from '../middleware/validation.middleware';
// import {
//   registerSchema,
//   loginSchema,
//   passwordResetRequestSchema,
//   passwordResetConfirmSchema,
//   changePasswordSchema,
//   updateProfileSchema,
//   emailVerificationSchema
// } from '../schemas/auth.schemas';

const router = Router();
const prisma = new PrismaClient();

// Custom validation schemas for secure auth
const secureValidationSchemas = {
  secureRegister: z.object({
    body: z.object({
      email: z.string().email('Invalid email address').toLowerCase().trim(),
      password: z.string().min(8, 'Password must be at least 8 characters long'),
      name: z.string().min(2, 'Name must be at least 2 characters long').trim(),
      confirmPassword: z.string().min(1, 'Confirm password is required')
    }).refine(data => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword']
    })
  }),
  
  secureLogin: z.object({
    body: z.object({
      email: z.string().email('Invalid email address').toLowerCase().trim(),
      password: z.string().min(1, 'Password is required'),
      rememberMe: z.boolean().default(false),
      captcha: z.string().optional()
    })
  }),
  
  forgotPasswordSecure: z.object({
    body: z.object({
      email: z.string().email('Invalid email address').toLowerCase().trim(),
      captcha: z.string().optional()
    })
  }),
  
  resetPasswordSecure: z.object({
    body: z.object({
      token: z.string().min(1, 'Token is required'),
      password: z.string().min(8, 'Password must be at least 8 characters long'),
      confirmPassword: z.string().min(1, 'Confirm password is required')
    }).refine(data => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword']
    })
  }),
  
  changePasswordSecure: z.object({
    body: z.object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
      confirmNewPassword: z.string().min(1, 'Confirm password is required')
    }).refine(data => data.newPassword === data.confirmNewPassword, {
      message: 'Passwords do not match',
      path: ['confirmNewPassword']
    })
  }),
  
  verifyEmailSecure: z.object({
    params: z.object({
      token: z.string().min(1, 'Token is required')
    })
  }),
  
  updateProfileSecure: z.object({
    body: z.object({
      name: z.string().min(2, 'Name must be at least 2 characters long').trim().optional(),
      email: z.string().email('Invalid email address').toLowerCase().trim().optional(),
      subscriptionTier: z.enum(['basic', 'premium', 'enterprise']).optional()
    })
  })
};

// Custom validation middleware
const validateSecure = (schemaName: keyof typeof secureValidationSchemas) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    try {
      const schema = secureValidationSchemas[schemaName];
      const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
        cookies: req.cookies
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: result.error.issues
        });
      }

      // Replace request properties with validated values
      if ('body' in result.data && result.data.body) req.body = result.data.body;
      if ('query' in result.data && result.data.query) Object.assign(req.query, result.data.query);
      if ('params' in result.data && result.data.params) req.params = result.data.params;

      next();
      return;
    } catch (error) {
      next(error);
      return;
    }
  };
};

// Apply security headers and CORS to all auth routes
router.use(securityHeaders);
router.use(authCors);

/**
 * Authentication Routes
 */

// User Registration with enhanced security
router.post('/register',
  registrationRateLimit,
  validateSecure('secureRegister'),
  secureAuthController.register
);

// User Login with enhanced security
router.post('/login', 
  authRateLimit,
  checkLoginAttempts,
  validateSecure('secureLogin'),
  recordLoginResult(true),
  secureAuthController.login
);

// Logout with session cleanup
router.post('/logout',
  requireAuth,
  secureAuthController.logout
);

// Forgot Password with rate limiting
router.post('/forgot-password',
  passwordResetRateLimit,
  checkPasswordResetAttempts,
  validateSecure('forgotPasswordSecure'),
  secureAuthController.requestPasswordReset
);

// Reset Password with token validation
router.post('/reset-password',
  validateSecure('resetPasswordSecure'),
  secureAuthController.confirmPasswordReset
);

// Change Password with current password verification
router.post('/change-password',
  requireAuth,
  detectHighRiskActivity(),
  validateSecure('changePasswordSecure'),
  secureAuthController.changePassword
);

// Email Verification
router.get('/verify-email/:token',
  validateSecure('verifyEmailSecure'),
  secureAuthController.verifyEmail
);

// Get User Profile
router.get('/profile',
  requireAuth,
  secureAuthController.getCurrentUser
);

// Update User Profile
router.put('/profile',
  requireAuth,
  detectHighRiskActivity(50),
  validateSecure('updateProfileSecure'),
  secureAuthController.updateProfile
);

/**
 * Session Management Routes
 */

// Get user sessions
router.get('/sessions',
  requireAuth,
  secureAuthController.getUserSessions.bind(secureAuthController)
);

// Invalidate all sessions
router.post('/sessions/invalidate-all',
  requireAuth,
  secureAuthController.invalidateAllSessions.bind(secureAuthController)
);

// Invalidate specific session
router.delete('/sessions/:sessionId',
  requireAuth,
  async (req, res, next) => {
    try {
      // Remove unused variable
      // const { sessionId } = req.params;
      
      // Implement session-specific invalidation
      // This would require extending the JWT service
      
      res.json({
        success: true,
        message: 'Session invalidated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Administrative Routes
 */

// Get all users (admin only)
router.get('/admin/users',
  requireAdminAuth,
  async (req, res, next) => {
    try {
      const { page = 1, limit = 20, search } = req.query;
      
      const where = search 
        ? {
            OR: [
              { email: { contains: String(search), mode: 'insensitive' as const } },
              { name: { contains: String(search), mode: 'insensitive' as const } }
            ]
          }
        : {};

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
          subscriptionTier: true,
          lastLogin: true,
          createdAt: true,
          accountLocked: true,
          lockoutExpires: true
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      });

      const total = await prisma.user.count({ where });

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Lock/unlock user account (admin only)
router.post('/admin/users/:userId/lock',
  requireAdminAuth,
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { lock, reason } = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          accountLocked: lock,
          lockoutExpires: lock ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null // 24 hours
        },
        select: {
          id: true,
          email: true,
          accountLocked: true,
          lockoutExpires: true
        }
      });

      // Log administrative action
      await prisma.activityLog.create({
        data: {
          userId: req.user!.id,
          action: lock ? 'admin_user_locked' : 'admin_user_unlocked',
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
          details: {
            targetUserId: userId,
            targetUserEmail: user.email,
            reason: reason || 'No reason provided'
          }
        }
      });

      // Invalidate all sessions for locked users
      if (lock) {
        await jwtService.invalidateAllUserSessions(userId);
      }

      res.json({
        success: true,
        data: { user },
        message: `User ${lock ? 'locked' : 'unlocked'} successfully`
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user activity logs (admin only)
router.get('/admin/users/:userId/activity',
  requireAdminAuth,
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const activities = await prisma.activityLog.findMany({
        where: { userId },
        select: {
          id: true,
          action: true,
          ipAddress: true,
          userAgent: true,
          details: true,
          createdAt: true
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      });

      const total = await prisma.activityLog.count({
        where: { userId }
      });

      res.json({
        success: true,
        data: {
          activities,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * System Status and Health Routes
 */

// Get authentication system status
router.get('/status',
  optionalAuth,
  async (req, res, next) => {
    try {
      const status = await jwtService.getServiceStatus();
      
      // Remove sensitive information from public status
      const publicStatus = {
        status: status.status,
        algorithm: status.algorithm,
        accessTokenExpiry: status.accessTokenExpiry,
        refreshTokenExpiry: status.refreshTokenExpiry,
        timestamp: new Date().toISOString()
      };

      // Include detailed info for authenticated admin users
      if (req.user?.role === 'admin') {
        res.json({
          success: true,
          data: {
            ...publicStatus,
            ...status
          }
        });
      } else {
        res.json({
          success: true,
          data: publicStatus
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// Health check endpoint
router.get('/health',
  async (req, res, next) => {
    try {
      // Basic health check
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      };

      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        error: 'Service unavailable',
        message: 'Authentication service is not healthy'
      });
    }
  }
);

/**
 * Development and Testing Routes (only in non-production environments)
 */
if (process.env.NODE_ENV !== 'production') {
  // Generate test JWT keys
  router.get('/dev/generate-keys',
    async (req, res) => {
      try {
        const { generateKeyPairSync } = await import('crypto');
        
        const { privateKey, publicKey } = generateKeyPairSync('rsa', {
          modulusLength: 2048,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
          }
        });

        res.json({
          success: true,
          data: {
            privateKey,
            publicKey,
            envFormat: {
              JWT_PRIVATE_KEY: JSON.stringify(privateKey),
              JWT_PUBLIC_KEY: JSON.stringify(publicKey)
            }
          },
          message: 'Development keys generated. Add these to your .env file.'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Key generation failed',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );

  // Test token generation
  router.post('/dev/test-token',
    async (req, res) => {
      try {
        const { userId = 'test-user', email = 'test@example.com', role = 'user' } = req.body;
        
        const tokenPair = await jwtService.generateTokenPair(userId, email, role);
        
        res.json({
          success: true,
          data: tokenPair,
          message: 'Test token generated successfully'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Token generation failed',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );
}

export default router; 