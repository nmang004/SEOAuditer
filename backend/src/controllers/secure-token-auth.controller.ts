import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';
import { SecureTokenService } from '../services/SecureTokenService';
import { EnhancedEmailService } from '../services/EnhancedEmailService';
import { jwtService } from '../services/jwt.service';
import { databaseManager } from '../config/database';

const prisma = databaseManager.getPrisma();
const tokenService = new SecureTokenService(prisma);
const emailService = new EnhancedEmailService(prisma);

/**
 * Secure Token Authentication Controller
 * 
 * Features:
 * 1. Bulletproof token generation for email verification
 * 2. Race condition prevention with atomic operations
 * 3. Comprehensive audit logging
 * 4. Duplicate email handling with fresh token generation
 * 5. Token invalidation after successful verification
 */

/**
 * Register user with secure token generation
 */
export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  const correlationId = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logger.info('Registration attempt started', {
      correlationId,
      email,
      name,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Validation
    if (!email || !password || !name) {
      logger.warn('Registration failed - missing required fields', {
        correlationId,
        email,
        missingFields: {
          email: !email,
          password: !password,
          name: !name
        }
      });
      
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        createdAt: true
      }
    });

    if (existingUser?.emailVerified) {
      logger.warn('Registration failed - email already verified', {
        correlationId,
        email,
        existingUserId: existingUser.id,
        verifiedAt: existingUser.createdAt
      });
      
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    let user;
    let isNewUser = false;

    if (existingUser && !existingUser.emailVerified) {
      // Update existing unverified user with new password and name
      logger.info('Updating existing unverified user', {
        correlationId,
        email,
        existingUserId: existingUser.id
      });

      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name,
          passwordHash,
          updatedAt: new Date()
        },
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
          createdAt: true
        }
      });
    } else {
      // Create new user
      logger.info('Creating new user', {
        correlationId,
        email
      });

      user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          emailVerified: false
        },
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
          createdAt: true
        }
      });
      
      isNewUser = true;
    }

    // Send verification email with fresh token
    logger.info('Sending verification email', {
      correlationId,
      userId: user.id,
      email: user.email,
      isNewUser
    });

    const emailResult = await emailService.sendVerificationEmail(
      user.id,
      user.email,
      user.name || 'User'
    );

    if (!emailResult.success) {
      logger.error('Failed to send verification email', {
        correlationId,
        userId: user.id,
        email: user.email,
        error: emailResult.error
      });
      
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification email'
      });
    }

    logger.info('Registration completed successfully', {
      correlationId,
      userId: user.id,
      email: user.email,
      isNewUser,
      emailMessageId: emailResult.messageId,
      tokenSequence: emailResult.metadata?.tokenSequence
    });

    res.status(isNewUser ? 201 : 200).json({
      success: true,
      message: isNewUser 
        ? 'Account created successfully. Please check your email to verify your account.'
        : 'Verification email sent. Please check your email to verify your account.',
      data: {
        requiresVerification: true,
        email: user.email,
        tokenSent: true,
        emailMessageId: emailResult.messageId
      },
      metadata: {
        correlationId,
        isNewUser,
        tokenSequence: emailResult.metadata?.tokenSequence
      }
    });

  } catch (error) {
    logger.error('Registration failed with error', {
      correlationId,
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    res.status(500).json({
      success: false,
      error: 'Registration failed',
      correlationId
    });
  }
};

/**
 * Verify email with secure token validation
 */
export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.params;
  const correlationId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logger.info('Email verification attempt', {
      correlationId,
      tokenPrefix: token?.substring(0, 8) + '...',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    if (!token) {
      logger.warn('Email verification failed - no token provided', {
        correlationId
      });
      
      return res.status(400).json({
        success: false,
        error: 'Verification token is required'
      });
    }

    // Validate token
    const validation = await tokenService.validateToken(token, 'email_verification');
    
    if (!validation.isValid) {
      logger.warn('Email verification failed - invalid token', {
        correlationId,
        tokenPrefix: token.substring(0, 8) + '...',
        error: validation.error
      });
      
      return res.status(400).json({
        success: false,
        error: validation.error || 'Invalid or expired verification token',
        errorCode: 'INVALID_TOKEN',
        metadata: {
          correlationId
        }
      });
    }

    // Check if user is already verified
    const existingUser = await prisma.user.findUnique({
      where: { id: validation.userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        updatedAt: true
      }
    });

    if (!existingUser) {
      logger.warn('Email verification failed - user not found', {
        correlationId,
        userId: validation.userId,
        tokenPrefix: token.substring(0, 8) + '...'
      });
      
      return res.status(404).json({
        success: false,
        error: 'User not found',
        errorCode: 'USER_NOT_FOUND',
        metadata: {
          correlationId
        }
      });
    }

    // If user is already verified, return appropriate response
    if (existingUser.emailVerified) {
      logger.info('Email verification attempted for already verified user', {
        correlationId,
        userId: existingUser.id,
        email: existingUser.email,
        tokenPrefix: token.substring(0, 8) + '...',
        verifiedSince: existingUser.updatedAt
      });

      // Still invalidate the token to prevent reuse
      await tokenService.invalidateToken(token);

      return res.json({
        success: true,
        message: 'Email already verified',
        alreadyVerified: true,
        data: {
          email: existingUser.email,
          verified: true,
          verifiedAt: existingUser.updatedAt.toISOString()
        },
        metadata: {
          correlationId
        }
      });
    }

    // Update user as verified and invalidate token (atomic transaction)
    const result = await prisma.$transaction(async (tx) => {
      // Mark user as verified
      const user = await tx.user.update({
        where: { id: validation.userId },
        data: {
          emailVerified: true,
          updatedAt: new Date()
        },
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
          updatedAt: true
        }
      });

      // Invalidate the token
      await tokenService.invalidateToken(token);

      return user;
    });

    logger.info('Email verification successful', {
      correlationId,
      userId: result.id,
      email: result.email,
      tokenPrefix: token.substring(0, 8) + '...'
    });

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        email: result.email,
        verified: true,
        verifiedAt: result.updatedAt.toISOString()
      },
      metadata: {
        correlationId
      }
    });

  } catch (error) {
    logger.error('Email verification failed with error', {
      correlationId,
      tokenPrefix: token?.substring(0, 8) + '...',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    res.status(500).json({
      success: false,
      error: 'Email verification failed',
      correlationId
    });
  }
};

/**
 * Login with verified email requirement
 */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const correlationId = `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logger.info('Login attempt', {
      correlationId,
      email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        emailVerified: true,
        accountLocked: true,
        lockoutExpires: true,
        failedLoginAttempts: true,
        lastLogin: true
      }
    });

    if (!user) {
      logger.warn('Login failed - user not found', {
        correlationId,
        email
      });
      
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.accountLocked && user.lockoutExpires && new Date() < user.lockoutExpires) {
      logger.warn('Login failed - account locked', {
        correlationId,
        userId: user.id,
        email,
        lockoutExpires: user.lockoutExpires
      });
      
      return res.status(423).json({
        success: false,
        error: 'Account is temporarily locked. Please try again later.'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      logger.warn('Login failed - invalid password', {
        correlationId,
        userId: user.id,
        email
      });
      
      // Update failed login attempts (implement lockout logic if needed)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: { increment: 1 },
          lastFailedAttempt: new Date()
        }
      });
      
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check email verification
    if (!user.emailVerified) {
      logger.warn('Login failed - email not verified', {
        correlationId,
        userId: user.id,
        email
      });
      
      return res.status(403).json({
        success: false,
        error: 'Please verify your email before logging in',
        requiresVerification: true
      });
    }

    // Generate JWT token pair
    const tokenPair = await jwtService.generateTokenPair(user.id, user.email);

    // Update last login and reset failed attempts
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        failedLoginAttempts: 0,
        accountLocked: false,
        lockoutExpires: null
      }
    });

    logger.info('Login successful', {
      correlationId,
      userId: user.id,
      email,
      lastLogin: user.lastLogin
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token: tokenPair.accessToken,
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified
        }
      },
      metadata: {
        correlationId,
        sessionId: tokenPair.sessionId
      }
    });

  } catch (error) {
    logger.error('Login failed with error', {
      correlationId,
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    res.status(500).json({
      success: false,
      error: 'Login failed',
      correlationId
    });
  }
};

/**
 * Resend verification email
 */
export const resendVerification = async (req: Request, res: Response) => {
  const { email } = req.body;
  const correlationId = `resend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logger.info('Resend verification attempt', {
      correlationId,
      email,
      ip: req.ip
    });

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true
      }
    });

    if (!user) {
      logger.warn('Resend verification failed - user not found', {
        correlationId,
        email
      });
      
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.emailVerified) {
      logger.warn('Resend verification failed - already verified', {
        correlationId,
        userId: user.id,
        email
      });
      
      return res.status(400).json({
        success: false,
        error: 'Email is already verified'
      });
    }

    // Check rate limiting for resend attempts
    const recentTokens = await prisma.verificationToken.findMany({
      where: {
        userId: user.id,
        purpose: 'email_verification',
        createdAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (recentTokens.length >= 3) {
      logger.warn('Resend verification rate limited', {
        correlationId,
        userId: user.id,
        email,
        recentAttempts: recentTokens.length
      });
      
      return res.status(429).json({
        success: false,
        error: 'Too many verification email requests. Please wait 10 minutes before requesting another.',
        retryAfter: 600 // 10 minutes
      });
    }

    // Send fresh verification email
    const emailResult = await emailService.sendVerificationEmail(
      user.id,
      user.email,
      user.name || 'User'
    );

    if (!emailResult.success) {
      logger.error('Failed to resend verification email', {
        correlationId,
        userId: user.id,
        email,
        error: emailResult.error
      });
      
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification email'
      });
    }

    logger.info('Verification email resent successfully', {
      correlationId,
      userId: user.id,
      email,
      emailMessageId: emailResult.messageId
    });

    res.json({
      success: true,
      message: 'Verification email sent successfully',
      data: {
        emailSent: true,
        messageId: emailResult.messageId
      },
      metadata: {
        correlationId
      }
    });

  } catch (error) {
    logger.error('Resend verification failed with error', {
      correlationId,
      email,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to resend verification email',
      correlationId
    });
  }
};

/**
 * Get token system health and statistics
 */
export const getTokenHealth = async (req: Request, res: Response) => {
  try {
    const [tokenStats, emailHealth] = await Promise.all([
      tokenService.getTokenStats(),
      emailService.healthCheck()
    ]);

    res.json({
      success: true,
      data: {
        tokenSystem: tokenStats,
        emailService: emailHealth,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Token health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
};