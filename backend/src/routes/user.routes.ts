import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth-rs256.middleware';
// import { validate } from '../middleware/validation.middleware';
import { generalRateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// Apply authentication middleware to all routes (SECURITY: RS256 PROTECTION)
router.use(authenticateToken);

// Get user profile
router.get(
  '/profile',
  generalRateLimit,
  userController.getProfile
);

// Update user profile
router.patch(
  '/profile',
  generalRateLimit,
  // validate('updateProfile'),
  userController.updateProfile
);

// Change password
router.patch(
  '/change-password',
  generalRateLimit,
  // validate('changePassword'),
  userController.changePassword
);

// Upload avatar
router.post(
  '/avatar',
  generalRateLimit,
  // TODO: Implement uploadAvatar method in userController
  (req, res) => res.json({ message: 'Upload avatar endpoint - not implemented yet' })
);

// Delete user account
router.delete(
  '/account',
  generalRateLimit,
  userController.deleteAccount
);

// Get user's activity log
router.get(
  '/activity',
  generalRateLimit,
  userController.getActivityLog
);

// Get user preferences (placeholder for now)
router.get(
  '/preferences',
  generalRateLimit,
  // TODO: Implement getPreferences method in userController
  (req, res) => res.json({ message: 'Preferences endpoint - not implemented yet' })
);

// Update user preferences (placeholder for now)
router.patch(
  '/preferences',
  generalRateLimit,
  // TODO: Implement updatePreferences method in userController
  (req, res) => res.json({ message: 'Update preferences endpoint - not implemented yet' })
);

// Get user notifications (placeholder for now)
router.get(
  '/notifications',
  generalRateLimit,
  // TODO: Implement getNotifications method in userController
  (req, res) => res.json({ message: 'Notifications endpoint - not implemented yet' })
);

// Test endpoint without any middleware
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'User route test working',
    timestamp: new Date().toISOString()
  });
});

export default router;
