import { Router } from 'express';
import { validate } from '../middleware/validation.middleware';
import { authController } from '../controllers/auth.controller';
import { rateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// Public routes
router.post(
  '/register',
  rateLimit.auth,
  validate('register'),
  authController.register
);

router.post(
  '/login',
  rateLimit.auth,
  validate('login'),
  authController.login
);

router.post(
  '/refresh-token',
  validate('refreshToken'),
  authController.refreshToken
);

router.post(
  '/forgot-password',
  rateLimit.auth,
  validate('forgotPassword'),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  rateLimit.auth,
  validate('resetPassword'),
  authController.resetPassword
);

router.get(
  '/verify-email/:token',
  validate('verifyEmail'),
  authController.verifyEmail
);

// Protected routes
router.use(authController.authenticate);

router.post(
  '/logout',
  authController.logout
);

router.get(
  '/me',
  authController.getCurrentUser
);

router.patch(
  '/me',
  validate('updateProfile'),
  authController.updateProfile
);

router.patch(
  '/change-password',
  validate('changePassword'),
  authController.changePassword
);

export { router as authRouter };
