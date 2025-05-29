import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '..';
import { 
  NotFoundError, 
  BadRequestError
} from '../middleware/error.middleware';
import { logger } from '../utils/logger';

// User Controller
// Handles user profile, settings, password, and account management
// All endpoints must use correct Prisma model accessors and field names
// All select statements must only reference fields that exist in the Prisma schema
// All endpoints should be protected with JWT middleware
// TODO: Add input validation middleware (zod) for query/params
// TODO: Add more granular error handling and logging for production

export const userController = {
  // Get current user profile
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          subscriptionTier: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  // Update user profile
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { name, email } = req.body;

      // Check if email is already taken by another user
      if (email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email,
            id: { not: userId },
          },
        });

        if (existingUser) {
          throw new BadRequestError('Email is already in use');
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name }),
          ...(email && { email, emailVerified: false }), // Require email verification if email is changed
        },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          subscriptionTier: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // If email was updated, send verification email
      if (email) {
        // TODO: Send verification email
        logger.info(`Email verification required for user ${userId}`);
      }

      res.json({
        success: true,
        data: updatedUser,
        message: email ? 'Profile updated. Please verify your new email address.' : 'Profile updated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Change password
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { currentPassword, newPassword } = req.body;

      // Get user with password hash
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        throw new BadRequestError('Current password is incorrect');
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hashedPassword },
      });

      // TODO: Send password change notification email

      res.json({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete user account
  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { password } = req.body;

      // Verify password
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new BadRequestError('Incorrect password');
      }

      // Start a transaction to delete all user data
      await prisma.$transaction([
        // Delete all user's projects and related data
        prisma.sEOIssue.deleteMany({
          where: {
            analysis: {
              crawlSession: {
                project: { userId },
              },
            },
          },
        }),
        prisma.metaTags.deleteMany({
          where: {
            analysis: {
              crawlSession: {
                project: { userId },
              },
            },
          },
        }),
        prisma.sEOAnalysis.deleteMany({
          where: {
            crawlSession: {
              project: { userId },
            },
          },
        }),
        prisma.crawlSession.deleteMany({
          where: {
            project: { userId },
          },
        }),
        prisma.project.deleteMany({
          where: { userId },
        }),
        // Delete user
        prisma.user.delete({
          where: { id: userId },
        }),
      ]);

      // TODO: Send account deletion confirmation email

      // Clear session
      if (req.logout) {
        req.logout(() => {
          res.clearCookie('connect.sid');
          res.json({
            success: true,
            message: 'Account deleted successfully',
          });
        });
      } else {
        res.clearCookie('connect.sid');
        res.json({
          success: true,
          message: 'Account deleted successfully',
        });
      }
    } catch (error) {
      next(error);
    }
  },

  // Get user settings
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      const settings = await prisma.userSettings.findUnique({
        where: { userId },
        select: {
          id: true,
          notifications: true,
          theme: true,
          language: true,
          timezone: true,
          updatedAt: true,
        },
      });

      // Return default settings if not set
      if (!settings) {
        if (!userId) {
          res.status(401).json({ success: false, error: 'Unauthorized' });
          return;
        }
        const defaultSettings = {
          notifications: {
            email: true,
            push: true,
            analysisComplete: true,
            criticalIssues: true,
            weeklyReports: true,
          },
          theme: 'system',
          language: 'en',
          timezone: 'UTC',
        };

        // Create default settings
        const createdSettings = await prisma.userSettings.create({
          data: {
            userId,
            notifications: defaultSettings.notifications,
            theme: defaultSettings.theme,
            language: defaultSettings.language,
            timezone: defaultSettings.timezone,
          },
        });

        res.json({
          success: true,
          data: {
            ...defaultSettings,
            id: createdSettings.id,
            updatedAt: createdSettings.updatedAt,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  },

  // Update user settings
  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { notifications, theme, language, timezone } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const updatedSettings = await prisma.userSettings.upsert({
        where: { userId },
        update: {
          ...(notifications && { notifications }),
          ...(theme && { theme }),
          ...(language && { language }),
          ...(timezone && { timezone }),
        },
        create: {
          userId,
          notifications: notifications || {
            email: true,
            push: true,
            analysisComplete: true,
            criticalIssues: true,
            weeklyReports: true,
          },
          theme: theme || 'system',
          language: language || 'en',
          timezone: timezone || 'UTC',
        },
        select: {
          id: true,
          notifications: true,
          theme: true,
          language: true,
          timezone: true,
          updatedAt: true,
        },
      });

      res.json({
        success: true,
        data: updatedSettings,
        message: 'Settings updated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Get user activity log
  async getActivityLog(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { limit = '50', offset = '0' } = req.query;

      const activities = await prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string, 10) || 50,
        skip: parseInt(offset as string, 10) || 0,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          details: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
        },
      });

      const total = await prisma.activityLog.count({ where: { userId } });

      res.json({
        success: true,
        data: activities,
        meta: {
          total,
          limit: parseInt(limit as string, 10) || 50,
          offset: parseInt(offset as string, 10) || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
