import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/config';
import { jwtService } from '../services/enhanced-jwt.service';
import { 
  BadRequestError, 
  UnauthorizedError, 
  NotFoundError,
  ValidationError
} from '../middleware/error.middleware';
import { sendEmail } from '../services/email.service';
import { logger } from '../utils/logger';
import {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  changePasswordSchema,
  updateProfileSchema,
  RegisterData,
  LoginData,
  PasswordResetRequestData,
  PasswordResetConfirmData,
  ChangePasswordData,
  UpdateProfileData,
  SecurityEventData
} from '../schemas/auth.schemas';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string | null;
    role: 'user' | 'admin';
    subscriptionTier: string;
    emailVerified: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

interface LoginAttempt {
  email: string;
  ip: string;
  userAgent: string;
  success: boolean;
  timestamp: Date;
  failureReason?: string;
}

export class SecureAuthController {
  /**
   * User registration with comprehensive security validation
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate input data
      const validation = registerSchema.safeParse(req);
      if (!validation.success) {
        throw new ValidationError('Invalid registration data', validation.error.errors);
      }

      const { email, password, name }: RegisterData = validation.data.body;
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        await this.logSecurityEvent({
          email,
          event: 'suspicious_activity',
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent'),
          timestamp: new Date(),
          metadata: { reason: 'registration_attempt_duplicate' }
        });
        throw new BadRequestError('An account with this email already exists');
      }

      // Hash password with bcrypt (12 rounds as required)
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Determine user role (default to 'user', admin can be set manually)
      const userRole: 'user' | 'admin' = 'user';

      // Create user account
      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          verificationToken,
          verificationExpires,
          subscriptionTier: 'free',
          emailVerified: false
        },
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
          subscriptionTier: true,
          createdAt: true
        }
      });

      // Generate JWT tokens with enhanced security
      const deviceId = req.get('X-Device-ID') || uuidv4();
      const tokenPair = await jwtService.generateTokenPair(
        user.id, 
        user.email, 
        userRole,
        deviceId
      );

      // Set secure refresh token cookie
      res.cookie('refreshToken', tokenPair.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/auth'
      });

      // Send email verification (don't wait for it to complete)
      this.sendVerificationEmail(user.email, user.name || 'User', verificationToken)
        .catch(error => {
          logger.error('Failed to send verification email:', error);
        });

      // Log successful registration
      await this.logSecurityEvent({
        userId: user.id,
        email: user.email,
        event: 'session_created',
        ip: clientIp,
        userAgent,
        timestamp: new Date(),
        metadata: { reason: 'registration_success' }
      });

      // Return user data without sensitive information
      res.status(201).json({
        success: true,
        data: {
          user: {
            ...user,
            role: userRole
          },
          accessToken: tokenPair.accessToken,
          sessionId: tokenPair.sessionId,
          expiresIn: tokenPair.expiresIn
        },
        message: 'Registration successful. Please check your email to verify your account.'
      });
    } catch (error) {
      // Log failed registration attempt
      await this.logSecurityEvent({
        email: req.body.email,
        event: 'suspicious_activity',
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        metadata: { 
          reason: 'registration_failure',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      next(error);
    }
  }

  /**
   * User login with enhanced security and rate limiting
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Validate input data
      const validation = loginSchema.safeParse(req);
      if (!validation.success) {
        throw new ValidationError('Invalid login data', validation.error.errors);
      }

      const { email, password, rememberMe }: LoginData = validation.data.body;
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true,
          emailVerified: true,
          subscriptionTier: true,
          lastLogin: true,
          accountLocked: true,
          lockoutExpires: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        await this.recordLoginAttempt({
          email,
          ip: clientIp,
          userAgent,
          success: false,
          timestamp: new Date(),
          failureReason: 'user_not_found'
        });
        
        // Use same error message to prevent user enumeration
        throw new UnauthorizedError('Invalid email or password');
      }

      // Check if account is locked
      if (user.accountLocked && user.lockoutExpires && user.lockoutExpires > new Date()) {
        await this.logSecurityEvent({
          userId: user.id,
          email: user.email,
          event: 'account_locked',
          ip: clientIp,
          userAgent,
          timestamp: new Date(),
          metadata: {
            lockoutExpires: user.lockoutExpires,
            responseTime: Date.now() - startTime
          }
        });
        
        const lockoutMinutes = Math.ceil((user.lockoutExpires.getTime() - Date.now()) / (1000 * 60));
        throw new UnauthorizedError(`Account is locked. Try again in ${lockoutMinutes} minutes.`);
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        await this.recordLoginAttempt({
          email,
          ip: clientIp,
          userAgent,
          success: false,
          timestamp: new Date(),
          failureReason: 'invalid_password'
        });

        // Check if we should lock the account after failed attempts
        await this.handleFailedLoginAttempt(user.id, email, clientIp);
        
        throw new UnauthorizedError('Invalid email or password');
      }

      // Check if email is verified (optional based on requirements)
      if (!user.emailVerified) {
        logger.warn('Login attempt with unverified email', { userId: user.id, email });
        // You can choose to block unverified users or just warn
        // throw new UnauthorizedError('Please verify your email before logging in');
      }

      // Determine user role
      const userRole: 'user' | 'admin' = email.includes('admin') ? 'admin' : 'user'; // Simple role detection
      
      // Generate JWT tokens
      const deviceId = req.get('X-Device-ID') || uuidv4();
      const tokenPair = await jwtService.generateTokenPair(
        user.id,
        user.email,
        userRole,
        deviceId
      );

      // Set refresh token cookie (longer expiry if "remember me" is checked)
      const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 30 days vs 7 days
      
      res.cookie('refreshToken', tokenPair.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: cookieMaxAge,
        path: '/api/auth'
      });

      // Update last login timestamp and clear any account locks
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          lastLogin: new Date(),
          accountLocked: false,
          lockoutExpires: null
        }
      });

      // Record successful login
      await this.recordLoginAttempt({
        email,
        ip: clientIp,
        userAgent,
        success: true,
        timestamp: new Date()
      });

      // Log successful login
      await this.logSecurityEvent({
        userId: user.id,
        email: user.email,
        event: 'login_success',
        ip: clientIp,
        userAgent,
        timestamp: new Date(),
        metadata: {
          sessionId: tokenPair.sessionId,
          rememberMe: rememberMe || false,
          deviceId,
          responseTime: Date.now() - startTime
        }
      });

      // Return user data without sensitive information
      const { passwordHash, accountLocked, lockoutExpires, ...userData } = user;

      res.json({
        success: true,
        data: {
          user: {
            ...userData,
            role: userRole
          },
          accessToken: tokenPair.accessToken,
          sessionId: tokenPair.sessionId,
          expiresIn: tokenPair.expiresIn
        },
        message: 'Login successful'
      });
    } catch (error) {
      // Log failed login attempt
      await this.logSecurityEvent({
        userId: undefined,
        email: req.body.email,
        event: 'login_failure',
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        metadata: {
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : String(error)
        }
      });
      next(error);
    }
  }

  /**
   * Refresh access token with rotation
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        throw new UnauthorizedError('No refresh token provided');
      }

      // Use enhanced JWT service for token refresh
      const newTokenPair = await jwtService.refreshTokens(refreshToken);
      
      if (!newTokenPair) {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }

      // Set new refresh token cookie
      res.cookie('refreshToken', newTokenPair.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/auth'
      });

      res.json({
        success: true,
        data: {
          accessToken: newTokenPair.accessToken,
          sessionId: newTokenPair.sessionId,
          expiresIn: newTokenPair.expiresIn
        },
        message: 'Token refreshed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Secure logout with token invalidation
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.cookies;
      const authHeader = req.headers.authorization;
      const accessToken = authHeader && authHeader.split(' ')[1];
      
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = authenticatedReq.user?.id;

      // Blacklist access token if provided
      if (accessToken) {
        await jwtService.blacklistToken(accessToken);
      }

      // Invalidate refresh token if provided
      if (refreshToken) {
        await jwtService.invalidateRefreshToken(refreshToken);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth'
      });

      // Log logout event
      if (userId) {
        await this.logSecurityEvent({
          userId,
          email: authenticatedReq.user?.email,
          event: 'session_destroyed',
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent'),
          timestamp: new Date(),
          metadata: {
            sessionDestroyed: true
          }
        });
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate input data
      const validation = passwordResetRequestSchema.safeParse(req);
      if (!validation.success) {
        throw new ValidationError('Invalid password reset request', validation.error.errors);
      }

      const { email }: PasswordResetRequestData = validation.data.body;
      const clientIp = req.ip || 'unknown';

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email }
      });

      // Always return success to prevent user enumeration
      const responseMessage = 'If an account with that email exists, a password reset link has been sent.';

      if (user) {
        // Generate secure reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Update user with reset token
        await prisma.user.update({
          where: { id: user.id },
          data: {
            resetToken,
            resetTokenExpiry: resetExpires
          }
        });

        // Send password reset email
        await this.sendPasswordResetEmail(user.email, user.name || 'User', resetToken);

        // Log password reset request
        await this.logSecurityEvent({
          userId: user.id,
          email: user.email,
          event: 'password_reset_request',
          ip: clientIp,
          userAgent: req.get('User-Agent'),
          timestamp: new Date(),
          metadata: {
            resetTokenGenerated: true
          }
        });
      } else {
        // Log attempted reset for non-existent email
        await this.logSecurityEvent({
          userId: undefined,
          email,
          event: 'suspicious_activity',
          ip: clientIp,
          userAgent: req.get('User-Agent'),
          timestamp: new Date(),
          metadata: {
            reason: 'password_reset_request_invalid_email'
          }
        });
      }

      res.json({
        success: true,
        message: responseMessage
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirm password reset with new password
   */
  async confirmPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate input data
      const validation = passwordResetConfirmSchema.safeParse(req);
      if (!validation.success) {
        throw new ValidationError('Invalid password reset confirmation', validation.error.errors);
      }

      const { token, password }: PasswordResetConfirmData = validation.data.body;
      const clientIp = req.ip || 'unknown';

      // Find user by reset token
      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        throw new BadRequestError('Invalid or expired reset token');
      }

      // Hash new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Update user password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetToken: null,
          resetTokenExpiry: null,
          // Clear account lock if it was locked
          accountLocked: false,
          lockoutExpires: null
        }
      });

      // Invalidate all user sessions for security
      await jwtService.invalidateAllUserSessions(user.id);

      // Log successful password reset
      await this.logSecurityEvent({
        userId: user.id,
        email: user.email,
        event: 'password_reset_success',
        ip: clientIp,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        metadata: {
          allSessionsInvalidated: true
        }
      });

      res.json({
        success: true,
        message: 'Password reset successfully. Please log in with your new password.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate input data
      const validation = changePasswordSchema.safeParse(req);
      if (!validation.success) {
        throw new ValidationError('Invalid password change request', validation.error.errors);
      }

      const { currentPassword, newPassword }: ChangePasswordData = validation.data.body;
      const userId = req.user!.id;
      const email = req.user!.email;

      // Get user with current password hash
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true }
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!validPassword) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash }
      });

      // Log password change
      await this.logSecurityEvent({
        userId,
        email,
        event: 'password_change',
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
          subscriptionTier: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      res.json({
        success: true,
        data: {
          user: {
            ...user,
            role: req.user!.role || 'user'
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate input data
      const validation = updateProfileSchema.safeParse(req);
      if (!validation.success) {
        throw new ValidationError('Invalid profile update data', validation.error.errors);
      }

      const updateData: UpdateProfileData = validation.data.body;
      const userId = req.user!.id;

      // If email is being changed, check if it's already in use
      if (updateData.email && updateData.email !== req.user!.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: updateData.email }
        });

        if (existingUser) {
          throw new BadRequestError('Email address is already in use');
        }

        // Note: Email verification would need to be handled separately
        // updateData.emailVerified = false; // This field doesn't exist in the update schema
      }

      // Update user profile
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
          subscriptionTier: true,
          updatedAt: true
        }
      });

      // Log profile update
      await this.logSecurityEvent({
        userId,
        email: req.user!.email,
        event: 'session_created',
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        metadata: { 
          reason: 'profile_updated',
          updatedFields: Object.keys(updateData) 
        }
      });

      res.json({
        success: true,
        data: { user: updatedUser },
        message: 'Profile updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;

      if (!token) {
        throw new BadRequestError('Verification token is required');
      }

      // Find user by verification token
      const user = await prisma.user.findFirst({
        where: {
          verificationToken: token,
          verificationExpires: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        throw new BadRequestError('Invalid or expired verification token');
      }

      // Update user as verified
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationToken: null,
          verificationExpires: null
        }
      });

      // Log email verification
      await this.logSecurityEvent({
        userId: user.id,
        email: user.email,
        event: 'email_verification',
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      });

      res.json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user sessions
   */
  async getUserSessions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const sessions = await jwtService.getUserSessions(userId);

      res.json({
        success: true,
        data: { sessions }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Invalidate all sessions
   */
  async invalidateAllSessions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      await jwtService.invalidateAllUserSessions(userId);

      // Clear current refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth'
      });

      res.json({
        success: true,
        message: 'All sessions invalidated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle failed login attempts and account locking
   */
  private async handleFailedLoginAttempt(userId: string, email: string, ip: string): Promise<void> {
    try {
      // Get recent failed attempts (last 15 minutes)
      const recentFailures = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM activity_logs 
        WHERE user_id = ${userId} 
        AND event = 'login_failure'
        AND created_at > NOW() - INTERVAL 15 MINUTE
      `;

      const failureCount = Number(recentFailures[0]?.count || 0);

      // Lock account after 5 failed attempts
      if (failureCount >= 4) { // 4 previous + 1 current = 5 total
        const lockoutExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await prisma.user.update({
          where: { id: userId },
          data: {
            accountLocked: true,
            lockoutExpires
          }
        });

        await this.logSecurityEvent({
          userId,
          email,
          event: 'account_locked',
          ip,
          timestamp: new Date(),
          metadata: {
            failureCount: failureCount + 1,
            lockoutExpires
          }
        });
      }
    } catch (error) {
      logger.error('Failed to handle failed login attempt:', error);
    }
  }

  /**
   * Record login attempt for security monitoring
   */
  private async recordLoginAttempt(attempt: LoginAttempt): Promise<void> {
    try {
      // Only log if we have a valid userId since the schema requires a user relationship
      if (attempt.success) {
        // For successful attempts, we should have a userId
        // This would need to be passed from the login method
        // For now, we'll skip logging failed attempts without userId
        return;
      }
      
      // Store in database for audit purposes - only for successful attempts with userId
      // await prisma.activityLog.create({
      //   data: {
      //     userId: userId, // Would need userId from successful login
      //     action: 'login_success',
      //     ipAddress: attempt.ip,
      //     userAgent: attempt.userAgent,
      //     details: {
      //       email: attempt.email,
      //       success: attempt.success,
      //       failureReason: attempt.failureReason
      //     }
      //   }
      // });
    } catch (error) {
      logger.error('Failed to record login attempt:', error);
    }
  }

  /**
   * Log security events for audit trail
   */
  private async logSecurityEvent(eventData: SecurityEventData): Promise<void> {
    try {
      // Only create activity log if we have a valid userId since it's required by the schema
      if (eventData.userId) {
        await prisma.activityLog.create({
          data: {
            userId: eventData.userId,
            action: eventData.event,
            ipAddress: eventData.ip || 'unknown',
            userAgent: eventData.userAgent || 'unknown',
            details: {
              email: eventData.email,
              timestamp: eventData.timestamp || new Date(),
              ...eventData.metadata
            }
          }
        });
      }

      // Also log to application logger
      logger.info('Security event', eventData);
    } catch (error) {
      logger.error('Failed to log security event:', error);
    }
  }

  /**
   * Send email verification email
   */
  private async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    try {
      const verificationUrl = `${config.clientUrl}/verify-email/${token}`;
      
      await sendEmail({
        to: email,
        subject: 'Verify Your Email Address',
        template: 'verify-email',
        context: {
          name,
          verificationUrl,
          appName: config.appName
        }
      });
    } catch (error) {
      logger.error('Failed to send verification email:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  private async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    try {
      const resetUrl = `${config.clientUrl}/reset-password/${token}`;
      
      await sendEmail({
        to: email,
        subject: 'Reset Your Password',
        template: 'password-reset',
        context: {
          name,
          resetUrl,
          appName: config.appName,
          expiresIn: '1 hour'
        }
      });
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      throw error;
    }
  }
}

export const secureAuthController = new SecureAuthController(); 