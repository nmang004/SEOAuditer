import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticateToken } from '../middleware/auth-rs256.middleware';
// import { validate } from '../middleware/validation.middleware';
import { generalRateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// Apply authentication middleware to all routes (SECURITY: RS256 PROTECTION)
router.use(authenticateToken);

// Get user notifications
router.get(
  '/',
  generalRateLimit,
  notificationController.getNotifications
);

// Get unread notification count
router.get(
  '/unread-count',
  generalRateLimit,
  notificationController.getUnreadCount
);

// Mark a notification as read
router.patch(
  '/:id/read',
  generalRateLimit,
  // validate('markNotificationAsRead'),
  notificationController.markAsRead
);

// Mark all notifications as read
router.patch(
  '/mark-all-read',
  generalRateLimit,
  notificationController.markAllAsRead
);

// Delete a notification
router.delete(
  '/:id',
  generalRateLimit,
  // validate('deleteNotification'),
  notificationController.deleteNotification
);

// Get notification settings
router.get(
  '/settings',
  generalRateLimit,
  notificationController.getNotificationSettings
);

// Update notification settings
router.patch(
  '/settings',
  generalRateLimit,
  // validate('updateNotificationSettings'),
  notificationController.updateNotificationSettings
);

// Test notification
router.post(
  '/test',
  generalRateLimit,
  // validate('testNotification'),
  notificationController.testNotification
);

export default router;
