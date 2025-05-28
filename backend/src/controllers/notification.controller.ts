import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { logger } from '../utils/logger';
import { BadRequestError, NotFoundError } from '../middleware/error.middleware';

export const notificationController = {
  /**
   * Get user notifications
   */
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
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

      res.json({
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
      next(error);
    }
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const count = await notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      next(error);
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

      const notification = await notificationService.markAsRead(id, userId);

      res.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { count } = await notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        data: { count },
        message: `Marked ${count} notifications as read`,
      });
    } catch (error) {
      next(error);
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

      await notificationService.deleteNotification(id, userId);

      res.json({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get notification settings
   */
  async getNotificationSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { settings: true },
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

      const settings = user?.settings?.notifications || defaultSettings;

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update notification settings
   */
  async updateNotificationSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const updates = req.body;

      // Get current settings
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { settings: true },
      });

      const currentSettings = user?.settings || {};

      // Merge updates with current settings
      const updatedSettings = {
        ...currentSettings,
        notifications: {
          ...(currentSettings.notifications || {}),
          ...updates,
        },
      };

      // Update user settings
      await prisma.user.update({
        where: { id: userId },
        data: { settings: updatedSettings },
      });

      res.json({
        success: true,
        data: updatedSettings.notifications,
        message: 'Notification settings updated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Test notification
   */
  async testNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
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

      res.json({
        success: true,
        data: notification,
        message: 'Test notification sent successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};

// Add missing import
import { prisma } from '..';
