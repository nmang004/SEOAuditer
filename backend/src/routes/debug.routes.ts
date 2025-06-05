import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * Debug endpoint to check user status in production database
 */
router.get('/user-status/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    logger.info('Checking user status for email:', email);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        verificationToken: true,
        verificationExpires: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        email,
        timestamp: new Date().toISOString()
      });
    }

    const isTokenExpired = user.verificationExpires ? new Date() > new Date(user.verificationExpires) : null;

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        hasVerificationToken: !!user.verificationToken,
        verificationToken: user.verificationToken ? 
          user.verificationToken.substring(0, 8) + '...' + user.verificationToken.slice(-8) : null,
        tokenExpired: isTokenExpired,
        verificationExpires: user.verificationExpires,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    logger.error('Error checking user status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Debug endpoint to get database stats
 */
router.get('/database-stats', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    const verifiedUsers = await prisma.user.count({
      where: { emailVerified: true }
    });
    const unverifiedUsers = await prisma.user.count({
      where: { emailVerified: false }
    });

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        totalUsers: userCount,
        verifiedUsers,
        unverifiedUsers,
        recentUsers
      }
    });

  } catch (error) {
    logger.error('Error getting database stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Debug endpoint to test token generation and email construction
 */
router.post('/test-verification-flow', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    logger.info('Testing verification flow for email:', email);

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        verificationToken: true,
        verificationExpires: true
      }
    });

    let isNewUser = false;
    let tokenGenerated = '';

    if (!user) {
      // Create a test user
      const { v4: uuidv4 } = require('uuid');
      const bcrypt = require('bcrypt');
      
      const verificationToken = uuidv4();
      const verificationExpires = new Date();
      verificationExpires.setHours(verificationExpires.getHours() + 24);
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('TestPassword123!', salt);

      user = await prisma.user.create({
        data: {
          email,
          name: 'Debug Test User',
          passwordHash: hashedPassword,
          verificationToken,
          verificationExpires,
        },
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
          verificationToken: true,
          verificationExpires: true
        }
      });
      
      isNewUser = true;
      tokenGenerated = verificationToken;
    } else if (!user.emailVerified) {
      // Generate new token for existing unverified user
      const { v4: uuidv4 } = require('uuid');
      const verificationToken = uuidv4();
      const verificationExpires = new Date();
      verificationExpires.setHours(verificationExpires.getHours() + 24);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken,
          verificationExpires,
        },
      });

      user.verificationToken = verificationToken;
      user.verificationExpires = verificationExpires;
      tokenGenerated = verificationToken;
    }

    // Construct the verification URL like the email service does
    const config = require('../../config/config').config;
    const verificationUrl = `${config.appUrl}/verify-email/${user.verificationToken}`;
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      debug: {
        isNewUser,
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
          hasToken: !!user.verificationToken,
          tokenStart: user.verificationToken ? user.verificationToken.substring(0, 8) + '...' : null,
          tokenFull: user.verificationToken, // Show full token for debugging
          tokenExpires: user.verificationExpires
        },
        tokenGenerated,
        verificationUrl,
        configuredAppUrl: config.appUrl,
        constructedUrl: `${config.appUrl}/verify-email/${user.verificationToken}`
      }
    });

  } catch (error) {
    logger.error('Error in test verification flow:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;