import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { config } from '../config/config';

const router = Router();
const prisma = new PrismaClient();

/**
 * TEMPORARY BYPASS: Get current verification token for testing
 * This bypasses SendGrid email delivery issues
 */
router.post('/get-verification-link', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    logger.info('Getting verification link for email:', email);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        verificationToken: true,
        verificationExpires: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email already verified'
      });
    }

    if (!user.verificationToken) {
      return res.status(400).json({
        success: false,
        error: 'No verification token found'
      });
    }

    // Check if token is expired
    const isExpired = user.verificationExpires && new Date() > new Date(user.verificationExpires);
    
    if (isExpired) {
      return res.status(400).json({
        success: false,
        error: 'Verification token has expired'
      });
    }

    // Generate the verification URL
    const verificationUrl = `${config.appUrl}/verify-email/${user.verificationToken}`;

    res.json({
      success: true,
      message: 'Current verification link retrieved',
      data: {
        email: user.email,
        verificationUrl,
        token: user.verificationToken,
        expires: user.verificationExpires,
        instructions: [
          '1. Copy the verificationUrl above',
          '2. Paste it into your browser',
          '3. This bypasses the SendGrid email issue'
        ]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting verification link:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;