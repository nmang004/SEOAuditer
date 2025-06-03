// Stubbed notification service for build without Prisma Notification model
interface NotificationOptions {
  page?: number;
  limit?: number;
  type?: string;
  unreadOnly?: boolean;
}

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  metadata?: Record<string, any>;
  readAt?: Date | null;
  createdAt: Date;
}

export const notificationService = {
  async getUserNotifications(_userId: string, _options: NotificationOptions) {
    return { notifications: [] as Notification[], total: 0 };
  },
  async markAsRead(_notificationId: string, _userId: string) {
    return { id: _notificationId, userId: _userId, readAt: new Date() as Date };
  },
  async markAllAsRead(_userId: string) {
    return { count: 0 };
  },
  async deleteNotification(_notificationId: string, _userId: string) {
    return;
  },
  async getUnreadCount(_userId: string) {
    return 0;
  },
  async createNotification(_data: Partial<Notification> & { userId: string }) {
    return {
      id: 'mock-id',
      userId: _data.userId || 'mock-user',
      title: _data.title || 'Test Notification',
      message: _data.message || '',
      type: _data.type || 'INFO',
      relatedEntityType: _data.relatedEntityType || null,
      relatedEntityId: _data.relatedEntityId || null,
      metadata: _data.metadata || {},
      readAt: null as Date | null,
      createdAt: new Date(),
    };
  },
};
