import { PrismaClient, NotificationType, User, Notification } from '@prisma/client';
import { emailService } from './email.service';
import { webSocketService } from './websocket.service';
import { logger } from '../utils/logger';
import { config } from '../config/config';

const prisma = new PrismaClient();

type NotificationData = {
  title: string;
  message: string;
  type: NotificationType;
  userId: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, any>;
  readAt?: Date | null;
};

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Create a new notification
   */
  public async createNotification(data: NotificationData): Promise<Notification> {
    const { userId, title, message, type, relatedEntityType, relatedEntityId, metadata } = data;

    try {
      // Create the notification in the database
      const notification = await prisma.notification.create({
        data: {
          title,
          message,
          type,
          userId,
          relatedEntityType,
          relatedEntityId,
          metadata,
        },
      });

      // Send real-time notification via WebSocket
      this.sendRealTimeNotification(notification);

      // Send email notification if enabled
      this.sendEmailNotification(notification);

      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  /**
   * Get notifications for a user
   */
  public async getUserNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      types?: NotificationType[];
    } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    const { page = 1, limit = 20, unreadOnly = false, types } = options;
    const skip = (page - 1) * limit;

    try {
      const where = {
        userId,
        ...(unreadOnly && { readAt: null }),
        ...(types && types.length > 0 && { type: { in: types } }),
      };

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notification.count({ where }),
      ]);

      return { notifications, total };
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  /**
   * Mark a notification as read
   */
  public async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      if (notification.userId !== userId) {
        throw new Error('Unauthorized to update this notification');
      }

      if (notification.readAt) {
        return notification; // Already read
      }

      const updatedNotification = await prisma.notification.update({
        where: { id: notificationId },
        data: { readAt: new Date() },
      });

      // Notify the client that the notification was read
      webSocketService.publish(`user:${userId}:notifications`, {
        type: 'notification_read',
        notificationId: updatedNotification.id,
      });

      return updatedNotification;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  public async markAllAsRead(userId: string): Promise<{ count: number }> {
    try {
      const result = await prisma.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
      });

      // Notify the client that all notifications were marked as read
      webSocketService.publish(`user:${userId}:notifications`, {
        type: 'all_notifications_read',
        count: result.count,
      });

      return { count: result.count };
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  /**
   * Delete a notification
   */
  public async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      if (notification.userId !== userId) {
        throw new Error('Unauthorized to delete this notification');
      }

      await prisma.notification.delete({
        where: { id: notificationId },
      });

      // Notify the client that the notification was deleted
      webSocketService.publish(`user:${userId}:notifications`, {
        type: 'notification_deleted',
        notificationId,
      });
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  }

  /**
   * Get unread notification count for a user
   */
  public async getUnreadCount(userId: string): Promise<number> {
    try {
      return await prisma.notification.count({
        where: { userId, readAt: null },
      });
    } catch (error) {
      logger.error('Error getting unread notification count:', error);
      throw new Error('Failed to get unread notification count');
    }
  }

  /**
   * Send a real-time notification via WebSocket
   */
  private sendRealTimeNotification(notification: Notification): void {
    try {
      webSocketService.publish(`user:${notification.userId}:notifications`, {
        type: 'new_notification',
        notification,
      });
    } catch (error) {
      logger.error('Error sending real-time notification:', error);
    }
  }

  /**
   * Send an email notification if enabled
   */
  private async sendEmailNotification(notification: Notification): Promise<void> {
    try {
      // Get user preferences
      const user = await prisma.user.findUnique({
        where: { id: notification.userId },
        select: { email: true, name: true, settings: true },
      });

      if (!user) return;

      // Check if email notifications are enabled
      const emailNotificationsEnabled = user.settings?.notifications?.email ?? true;
      if (!emailNotificationsEnabled) return;

      // Check if this notification type should trigger an email
      const notificationTypeEnabled = user.settings?.notifications?.[notification.type] ?? true;
      if (!notificationTypeEnabled) return;

      // Send email
      await emailService.sendEmail({
        to: user.email,
        subject: notification.title,
        template: 'notification',
        context: {
          name: user.name,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          metadata: notification.metadata,
          appName: config.appName,
          appUrl: config.appUrl,
          notificationSettingsUrl: `${config.appUrl}/settings/notifications`,
        },
      });
    } catch (error) {
      logger.error('Error sending email notification:', error);
    }
  }

  /**
   * Create a system notification for all users
   */
  public async createSystemNotification(
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<{ count: number }> {
    try {
      // Get all active users
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      // Create notifications in batch
      const batchSize = 100;
      let createdCount = 0;

      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        
        const notifications = batch.map(user => ({
          title,
          message,
          type: 'SYSTEM' as NotificationType,
          userId: user.id,
          metadata,
        }));

        const result = await prisma.notification.createMany({
          data: notifications,
        });

        createdCount += result.count;

        // Send real-time notifications
        batch.forEach(user => {
          webSocketService.publish(`user:${user.id}:notifications`, {
            type: 'new_notification',
            notification: {
              title,
              message,
              type: 'SYSTEM',
              metadata,
              createdAt: new Date(),
            },
          });
        });
      }

      return { count: createdCount };
    } catch (error) {
      logger.error('Error creating system notification:', error);
      throw new Error('Failed to create system notification');
    }
  }
}

// Export a singleton instance
export const notificationService = NotificationService.getInstance();
