import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authController } from '../controllers/auth-rs256.controller';
import { jwtService } from '../services/jwt-rs256.service';
import {
  authenticateToken,
  requireAuth,
  requireAdminAuth,
  optionalAuth,
  trackActivity,
  requireEmailVerified,
  detectHighRiskActivity,
  securityHeaders,
  authCors
} from '../middleware/auth-rs256.middleware';
import {
  authRateLimit,
  passwordResetRateLimit,
  registrationRateLimit,
  checkLoginAttempts,
  checkPasswordResetAttempts,
  recordLoginResult
} from '../middleware/rate-limit.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();
const prisma = new PrismaClient();

// Apply security headers and CORS to all auth routes
router.use(securityHeaders);
router.use(authCors);

/**
 * Public Authentication Routes
 */

// User Registration
router.post('/register',
  registrationRateLimit,
  validate('register'),
  trackActivity,
  authController.register
);

// User Login
router.post('/login',
  authRateLimit,
  checkLoginAttempts,
  validate('login'),
  trackActivity,
  recordLoginResult(true),
  authController.login
);

// Token Refresh
router.post('/refresh',
  authRateLimit,
  validate('refreshToken'),
  trackActivity,
  authController.refresh
);

// Password Reset Request
router.post('/password-reset',
  passwordResetRateLimit,
  checkPasswordResetAttempts,
  validate('forgotPassword'),
  trackActivity,
  authController.requestPasswordReset
);

// Password Reset Confirmation
router.post('/password-reset/confirm',
  authRateLimit,
  validate('resetPassword'),
  trackActivity,
  authController.confirmPasswordReset
);

// Email Verification
router.get('/verify-email/:token',
  authRateLimit,
  validate('verifyEmail'),
  trackActivity,
  authController.verifyEmail
);

// Resend Email Verification
router.post('/verify-email/resend',
  authRateLimit,
  authenticateToken,
  trackActivity,
  async (req, res, next) => {
    try {
      const user = req.user!;
      
      if (user.emailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified'
        });
      }

      // Trigger resend verification logic
      await authController.register(req, res, next);
      return;
    } catch (error) {
      next(error);
      return;
    }
  }
);

/**
 * Protected Authentication Routes
 */

// Logout
router.post('/logout',
  authenticateToken,
  requireAuth,
  trackActivity,
  authController.logout
);

// Logout from all sessions
router.post('/logout-all',
  authenticateToken,
  requireAuth,
  trackActivity,
  authController.logoutAll
);

// Get current user profile
router.get('/profile',
  authenticateToken,
  requireAuth,
  requireEmailVerified,
  trackActivity,
  authController.getProfile
);

// Update user profile
router.put('/profile',
  authenticateToken,
  requireAuth,
  requireEmailVerified,
  validate('updateProfile'),
  detectHighRiskActivity(50), // Lower threshold for profile updates
  trackActivity,
  authController.updateProfile
);

// Change password
router.post('/change-password',
  authenticateToken,
  requireAuth,
  requireEmailVerified,
  validate('changePassword'),
  detectHighRiskActivity(),
  trackActivity,
  authController.changePassword
);

// Get user sessions
router.get('/sessions',
  authenticateToken,
  requireAuth,
  requireEmailVerified,
  trackActivity,
  async (req, res, next) => {
    try {
      const user = req.user!;
      const sessions = await jwtService.getUserSessions(user.id);
      
      res.json({
        success: true,
        data: {
          sessions: sessions.map(session => ({
            sessionId: session.sessionId,
            deviceId: session.deviceId,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
            isActive: session.isActive,
            isCurrent: session.sessionId === req.sessionId
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Terminate specific session
router.delete('/sessions/:sessionId',
  authenticateToken,
  requireAuth,
  requireEmailVerified,
  detectHighRiskActivity(),
  trackActivity,
  async (req, res, next) => {
    try {
      const user = req.user!;
      const { sessionId } = req.params;
      
      if (sessionId === req.sessionId) {
        // Terminating current session - same as logout
        await authController.logout(req, res, next);
        return;
      }

      // Terminate specific session
      await jwtService.logout(user.id, sessionId);
      
      res.json({
        success: true,
        message: 'Session terminated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Admin-only Routes
 */

// Get all users (Admin only)
router.get('/admin/users',
  authenticateToken,
  requireAuth,
  requireEmailVerified,
  requireAdminAuth,
  trackActivity,
  async (req, res, next) => {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      const where = search 
        ? {
            OR: [
              { 
                email: { 
                  contains: String(search), 
                  mode: 'insensitive' as const
                } 
              },
              { 
                name: { 
                  contains: String(search), 
                  mode: 'insensitive' as const
                } 
              }
            ]
          }
        : {};

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            subscriptionTier: true,
            emailVerified: true,
            lastLogin: true,
            createdAt: true,
            accountLocked: true,
            lockoutExpires: true
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: Number(limit)
        }),
        prisma.user.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Lock/unlock user account (Admin only)
router.patch('/admin/users/:userId/lock',
  authenticateToken,
  requireAuth,
  requireEmailVerified,
  requireAdminAuth,
  detectHighRiskActivity(),
  trackActivity,
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { locked, reason } = req.body;
      
      const lockoutExpires = locked ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null; // 24 hours
      
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          accountLocked: locked,
          lockoutExpires
        },
        select: {
          id: true,
          email: true,
          name: true,
          accountLocked: true,
          lockoutExpires: true
        }
      });

      // Logout user from all sessions if locking account
      if (locked) {
        await jwtService.logoutAllSessions(userId);
      }

      // Log admin action
      await prisma.activityLog.create({
        data: {
          userId: req.user!.id,
          action: `admin_${locked ? 'lock' : 'unlock'}_user`,
          details: {
            targetUserId: userId,
            targetUserEmail: user.email,
            reason,
            lockoutExpires
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      res.json({
        success: true,
        message: `User account ${locked ? 'locked' : 'unlocked'} successfully`,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user activity logs (Admin only)
router.get('/admin/users/:userId/activity',
  authenticateToken,
  requireAuth,
  requireEmailVerified,
  requireAdminAuth,
  trackActivity,
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const [activities, total] = await Promise.all([
        prisma.activityLog.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: Number(limit)
        }),
        prisma.activityLog.count({ where: { userId } })
      ]);

      res.json({
        success: true,
        data: {
          activities,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get security events (Admin only)
router.get('/admin/security-events',
  authenticateToken,
  requireAuth,
  requireEmailVerified,
  requireAdminAuth,
  trackActivity,
  async (req, res, next) => {
    try {
      const { page = 1, limit = 50, eventType = '' } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      const where = eventType ? {
        action: { contains: String(eventType) }
      } : {};

      const [events, total] = await Promise.all([
        prisma.activityLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: Number(limit)
        }),
        prisma.activityLog.count({ where })
      ]);

      return res.json({
        success: true,
        data: {
          events,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      next(error);
      return;
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
        return res.json({
          success: true,
          data: {
            ...publicStatus,
            ...status
          }
        });
      } else {
        return res.json({
          success: true,
          data: publicStatus
        });
      }
    } catch (error) {
      next(error);
      return;
    }
  }
);

// Health check endpoint
router.get('/health',
  async (req, res) => {
    return res.status(200).json({
      success: true,
      message: 'Authentication service is healthy',
      timestamp: new Date().toISOString()
    });
  }
);

// Cleanup expired tokens (Admin only - can be called manually or via cron)
router.post('/admin/cleanup',
  authenticateToken,
  requireAuth,
  requireEmailVerified,
  requireAdminAuth,
  trackActivity,
  async (req, res, next) => {
    try {
      await jwtService.cleanup();
      
      return res.json({
        success: true,
        message: 'Token cleanup completed successfully'
      });
    } catch (error) {
      next(error);
      return;
    }
  }
);

/**
 * Development/Testing Routes (only available in development)
 */
if (process.env.NODE_ENV === 'development') {
  // Generate test tokens for development
  router.post('/dev/generate-tokens',
    async (req, res, next) => {
      try {
        const { userId, email, role = 'user' } = req.body;
        
        if (!userId || !email) {
          return res.status(400).json({
            success: false,
            message: 'userId and email are required'
          });
        }

        const tokens = await jwtService.generateTokenPair(
          userId,
          email,
          role,
          'dev-device',
          req.ip,
          'Development/Testing'
        );

        return res.json({
          success: true,
          message: 'Development tokens generated',
          data: tokens
        });
      } catch (error) {
        next(error);
        return;
      }
    }
  );

  // Verify token (development only)
  router.post('/dev/verify-token',
    async (req, res, next) => {
      try {
        const { token, type = 'access' } = req.body;
        
        if (!token) {
          return res.status(400).json({
            success: false,
            message: 'Token is required'
          });
        }

        const result = type === 'access' 
          ? await jwtService.verifyAccessToken(token)
          : await jwtService.verifyRefreshToken(token);

        return res.json({
          success: true,
          message: 'Token verification result',
          data: {
            valid: !!result,
            payload: result
          }
        });
      } catch (error) {
        next(error);
        return;
      }
    }
  );
}

export default router; 