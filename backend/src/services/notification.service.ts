// Stubbed notification service for build without Prisma Notification model
export const notificationService = {
  async getUserNotifications(_userId: string, _options: any) {
    return { notifications: [], total: 0 };
  },
  async markAsRead(_notificationId: string, _userId: string) {
    return { id: _notificationId, userId: _userId, readAt: new Date() };
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
  async createNotification(_data: any) {
    return {
      id: 'mock-id',
      userId: _data.userId || 'mock-user',
      title: _data.title || 'Test Notification',
      message: _data.message || '',
      type: _data.type || 'INFO',
      relatedEntityType: _data.relatedEntityType || null,
      relatedEntityId: _data.relatedEntityId || null,
      metadata: _data.metadata || {},
      readAt: null,
      createdAt: new Date(),
    };
  },
};
