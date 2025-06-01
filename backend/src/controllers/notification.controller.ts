import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { PrismaClient } from '@prisma/client';
// Note: io import commented out to avoid circular dependency
// import { io } from '../index';

// Notification Controller
// Handles user notifications, unread count, marking as read, deleting, and notification settings
// All endpoints must use correct Prisma model accessors and field names
// All select statements must only reference fields that exist in the Prisma schema
// All endpoints should be protected with JWT middleware
// TODO: Add input validation middleware (zod) for query/params
// TODO: Add more granular error handling and logging for production

// Create a separate Prisma instance to avoid circular dependency
const prisma = new PrismaClient();

export const notificationController = {
  /**
   * Get user notifications
   */
  getNotifications: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
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
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'An error occurred while fetching notifications',
        });
      }
      next(error);
    }
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const count = await notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'An error occurred while fetching unread count',
        });
      }
      next(error);
    }
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!id) {
        res.status(400).json({ success: false, error: 'Notification ID is required' });
        return;
      }
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const notification = await notificationService.markAsRead(id, userId);

      res.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'An error occurred while marking notification as read',
        });
      }
      next(error);
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const { count } = await notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        data: { count },
        message: `Marked ${count} notifications as read`,
      });
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'An error occurred while marking all notifications as read',
        });
      }
      next(error);
    }
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!id) {
        res.status(400).json({ success: false, error: 'Notification ID is required' });
        return;
      }
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      await notificationService.deleteNotification(id, userId);

      res.json({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'An error occurred while deleting the notification',
        });
      }
      next(error);
    }
  },

  /**
   * Get notification settings
   */
  getNotificationSettings: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

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
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'An error occurred while fetching notification settings',
        });
      }
      next(error);
    }
  },

  /**
   * Update notification settings
   */
  updateNotificationSettings: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      
      const updates = req.body;
      if (!updates || typeof updates !== 'object') {
        res.status(400).json({ success: false, error: 'Invalid settings format' });
        return;
      }

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

      res.json({
        success: true,
        data: newNotifications,
        message: 'Notification settings updated successfully',
      });
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'An error occurred while updating notification settings',
        });
      }
      next(error);
    }
  },

  /**
   * Test notification
   */
  testNotification: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      
      const { type = 'INFO' } = req.body;
      const validTypes = ['INFO', 'WARNING', 'ERROR', 'SUCCESS'];
      
      if (!validTypes.includes(type.toUpperCase())) {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid notification type. Must be one of: ' + validTypes.join(', ')
        });
        return;
      }

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
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'An error occurred while sending test notification',
        });
      }
      next(error);
    }
  },

  /**
   * Create a new notification (utility for other controllers/services)
   */
  async createNotification(userId: string, notificationData: any) {
    // Create notification in DB (assume notificationService.createNotification exists)
    const notification = await notificationService.createNotification({ userId, ...notificationData });
    // Emit real-time notification event to the user room
    // io.to(`user:${userId}`).emit('notification:new', { notification });
    return notification;
  },
};
