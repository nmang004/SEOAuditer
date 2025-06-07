import { Router } from 'express';
import { validate } from '../middleware/validation.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';
import * as authController from '../controllers/secure-token-auth.controller';

const router = Router();

/**
 * Secure Token Authentication Routes
 * 
 * Features:
 * - Bulletproof token generation and validation
 * - Comprehensive rate limiting
 * - Input validation and sanitization
 * - Audit logging for all operations
 */

// Use existing validation schemas from middleware

/**
 * POST /api/secure-auth/register
 * Register new user with secure token generation
 */
router.post('/register', 
  rateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // 5 registration attempts per 15 minutes
  }),
  validate('register'),
  authController.register
);

/**
 * POST /api/secure-auth/login
 * Login with verified email requirement
 */
router.post('/login',
  rateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10 // 10 login attempts per 15 minutes
  }),
  validate('login'),
  authController.login
);

/**
 * GET /api/secure-auth/verify-email/:token
 * Verify email with secure token validation
 */
router.get('/verify-email/:token',
  rateLimitMiddleware({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20 // 20 verification attempts per 5 minutes
  }),
  validate('verifyEmail'),
  authController.verifyEmail
);

/**
 * POST /api/secure-auth/resend-verification
 * Resend verification email with fresh token
 */
router.post('/resend-verification',
  rateLimitMiddleware({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 3 // 3 resend attempts per 10 minutes
  }),
  validate('forgotPassword'), // Reuse schema since it just validates email
  authController.resendVerification
);

/**
 * GET /api/secure-auth/token-health
 * Get token system health and statistics
 */
router.get('/token-health',
  rateLimitMiddleware({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30 // 30 health checks per minute
  }),
  authController.getTokenHealth
);

export default router;