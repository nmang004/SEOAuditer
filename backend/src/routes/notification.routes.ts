import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
// import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get user notifications
router.get(
  '/',
  rateLimit.api,
  notificationController.getNotifications
);

// Get unread notification count
router.get(
  '/unread-count',
  rateLimit.api,
  notificationController.getUnreadCount
);

// Mark a notification as read
router.patch(
  '/:id/read',
  rateLimit.api,
  // validate('markNotificationAsRead'),
  notificationController.markAsRead
);

// Mark all notifications as read
router.patch(
  '/mark-all-read',
  rateLimit.api,
  notificationController.markAllAsRead
);

// Delete a notification
router.delete(
  '/:id',
  rateLimit.api,
  // validate('deleteNotification'),
  notificationController.deleteNotification
);

// Get notification settings
router.get(
  '/settings',
  rateLimit.api,
  notificationController.getNotificationSettings
);

// Update notification settings
router.patch(
  '/settings',
  rateLimit.api,
  // validate('updateNotificationSettings'),
  notificationController.updateNotificationSettings
);

// Test notification
router.post(
  '/test',
  rateLimit.api,
  // validate('testNotification'),
  notificationController.testNotification
);

export { router as notificationRouter };
