import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get current user profile
router.get(
  '/profile',
  rateLimit.api,
  userController.getProfile
);

// Update user profile
router.patch(
  '/profile',
  rateLimit.api,
  validate('updateProfile'),
  userController.updateProfile
);

// Change password
router.post(
  '/change-password',
  rateLimit.api,
  validate('changePassword'),
  userController.changePassword
);

// Delete user account
// router.delete(
//   '/account',
//   rateLimit.api,
//   validate('deleteAccount'),
//   userController.deleteAccount
// );

// Get user settings
router.get(
  '/settings',
  rateLimit.api,
  userController.getSettings
);

// Update user settings
// router.patch(
//   '/settings',
//   rateLimit.api,
//   validate('updateSettings'),
//   userController.updateSettings
// );

// Get user activity log
// router.get(
//   '/activity',
//   rateLimit.api,
//   validate('getActivityLog'),
//   userController.getActivityLog
// );

export { router as userRouter };
