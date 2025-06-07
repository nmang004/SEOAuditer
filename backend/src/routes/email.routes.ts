import { Router } from 'express';
import { emailService } from '../services/email/EmailService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Email service health check
 */
router.get('/health', async (req, res) => {
  try {
    const health = await emailService.healthCheck();
    const stats = emailService.getStats();
    const providerInfo = emailService.getProviderInfo();

    // Add environment variable check (without exposing secrets)
    const envCheck = {
      EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || 'not_set',
      SENDGRID_API_KEY_SET: !!process.env.SENDGRID_API_KEY,
      SENDGRID_API_KEY_STARTS_WITH_SG: process.env.SENDGRID_API_KEY?.startsWith('SG.') || false,
      EMAIL_FROM_ADDRESS_SET: !!process.env.EMAIL_FROM_ADDRESS,
      EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS || 'not_set',
      EMAIL_FROM_NAME_SET: !!process.env.EMAIL_FROM_NAME,
      APP_NAME_SET: !!process.env.APP_NAME,
      APP_URL_SET: !!process.env.APP_URL,
      NODE_ENV: process.env.NODE_ENV
    };

    res.status(health.status === 'healthy' ? 200 : 503).json({
      success: health.status === 'healthy',
      timestamp: new Date().toISOString(),
      email: {
        status: health.status,
        provider: providerInfo,
        stats,
        details: health.details,
        environment: envCheck
      }
    });
  } catch (error) {
    logger.error('Email health check failed:', error);
    res.status(503).json({
      success: false,
      timestamp: new Date().toISOString(),
      email: {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * Send test email (available in production for debugging)
 */
router.post('/test', async (req, res) => {

  try {
    const { to, type = 'welcome' } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required'
      });
    }

    let result = false;
    const testName = 'Test User';
    const testToken = 'test-token-' + Date.now();

    switch (type) {
      case 'welcome':
        result = await emailService.sendWelcomeEmail(to, testName, testToken);
        break;
      case 'password-reset':
        result = await emailService.sendPasswordResetEmail(to, testName, testToken);
        break;
      case 'password-changed':
        result = await emailService.sendPasswordChangedEmail(to, testName);
        break;
      case 'email-change':
        result = await emailService.sendEmailChangeVerification(to, testName, testToken);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid email type. Use: welcome, password-reset, password-changed, email-change'
        });
    }

    res.json({
      success: result,
      message: result ? `Test ${type} email sent successfully` : `Failed to send test ${type} email`,
      type,
      to,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Test email failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get email service statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = emailService.getStats();
    const providerInfo = emailService.getProviderInfo();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
      provider: providerInfo
    });
  } catch (error) {
    logger.error('Email stats failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;