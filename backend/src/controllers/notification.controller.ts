import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { BadRequestError } from '../middleware/error.middleware';

// Notification Controller
// Handles user notifications, unread count, marking as read, deleting, and notification settings
// All endpoints must use correct Prisma model accessors and field names
// All select statements must only reference fields that exist in the Prisma schema
// All endpoints should be protected with JWT middleware
// TODO: Add input validation middleware (zod) for query/params
// TODO: Add more granular error handling and logging for production

export const notificationController = {
  /**
   * Get user notifications
   */
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      const { 
        page = '1', 
        limit = '20', 
        unread, 
        type 
      } = req.query;

      const { notifications, total } = await notificationService.getUserNotifications(
        userId,
        {
          page: parseInt(page as string, 10) || 1,
          limit: parseInt(limit as string, 10) || 20,
          unreadOnly: unread === 'true',
          types: type ? [(type as string).toUpperCase()] : undefined,
        }
      );

      return res.json({
        success: true,
        data: notifications,
        meta: {
          total,
          page: parseInt(page as string, 10) || 1,
          limit: parseInt(limit as string, 10) || 20,
          totalPages: Math.ceil(total / (parseInt(limit as string, 10) || 20)),
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      const count = await notificationService.getUnreadCount(userId);

      return res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!id) {
        throw new BadRequestError('Notification ID is required');
      }
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const notification = await notificationService.markAsRead(id, userId);

      return res.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      const { count } = await notificationService.markAllAsRead(userId);

      return res.json({
        success: true,
        data: { count },
        message: `Marked ${count} notifications as read`,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!id) {
        throw new BadRequestError('Notification ID is required');
      }
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      await notificationService.deleteNotification(id, userId);

      return res.json({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Get notification settings
   */
  async getNotificationSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      const settings = await prisma.userSettings.findUnique({
        where: { userId },
        select: { notifications: true },
      });

      // Return default settings if not set
      const defaultSettings = {
        email: true,
        push: true,
        inApp: true,
        analysisComplete: true,
        criticalIssues: true,
        weeklyReports: true,
        marketing: false,
      };

      res.json({
        success: true,
        data: settings?.notifications || defaultSettings,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Update notification settings
   */
  async updateNotificationSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      const updates = req.body;

      // Get current settings
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId },
        select: { notifications: true },
      });

      const currentNotifications = (userSettings?.notifications && typeof userSettings.notifications === 'object')
        ? userSettings.notifications
        : {};

      // Merge updates with current settings
      const newNotifications = {
        ...currentNotifications,
        ...updates,
      };

      // Update user settings
      await prisma.userSettings.upsert({
        where: { userId },
        update: { notifications: newNotifications },
        create: {
          userId,
          notifications: newNotifications,
          theme: 'system',
          language: 'en',
          timezone: 'UTC',
        },
      });

      return res.json({
        success: true,
        data: newNotifications,
        message: 'Notification settings updated successfully',
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Test notification
   */
  async testNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      const { type = 'INFO' } = req.body;

      const notification = await notificationService.createNotification({
        title: 'Test Notification',
        message: 'This is a test notification to verify your notification settings.',
        type: type.toUpperCase(),
        userId,
        metadata: {
          test: true,
          timestamp: new Date().toISOString(),
        },
      });

      return res.json({
        success: true,
        data: notification,
        message: 'Test notification sent successfully',
      });
    } catch (error) {
      return next(error);
    }
  },
};

// Add missing import
import { prisma } from '..';
