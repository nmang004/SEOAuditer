import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { jwtService } from '../services/jwt-rs256.service';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { config } from '../config/config';
import { sendEmail } from '../services/email.service';
import { 
  BadRequestError, 
  UnauthorizedError, 
  NotFoundError 
} from '../middleware/error.middleware';
import {
  RegisterData,
  LoginData,
  PasswordResetRequestData,
  PasswordResetConfirmData,
  ChangePasswordData,
  UpdateProfileData
} from '../schemas/auth.schemas';
import { logger } from '../utils/logger';

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
  permissions?: string[];
  sessionId?: string;
}

interface DeviceInfo {
  userAgent?: string;
  ipAddress?: string;
  deviceId?: string;
}

class AuthController {
  private readonly BCRYPT_ROUNDS = 12;
  private readonly PASSWORD_RESET_EXPIRY = 1000 * 60 * 60; // 1 hour
  private readonly EMAIL_VERIFICATION_EXPIRY = 1000 * 60 * 60 * 24; // 24 hours

  constructor() {
    // Bind all methods to preserve 'this' context when used in routes
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.refresh = this.refresh.bind(this);
    this.logout = this.logout.bind(this);
    this.logoutAll = this.logoutAll.bind(this);
    this.requestPasswordReset = this.requestPasswordReset.bind(this);
    this.confirmPasswordReset = this.confirmPasswordReset.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.verifyEmail = this.verifyEmail.bind(this);
    this.getProfile = this.getProfile.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
  }

  /**
   * Register new user with email validation and password hashing
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, name }: RegisterData = req.body;
      const deviceInfo = this.extractDeviceInfo(req);

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        if (!existingUser.emailVerified) {
          // User exists but email not verified, resend verification
          await this.sendEmailVerification(existingUser.id, email, name || 'User');
          res.status(200).json({
            success: true,
            message: 'Email verification sent. Please check your email to complete registration.',
            requiresVerification: true
          });
          return;
        }
        
        throw new BadRequestError('An account with this email already exists');
      }

      // Hash password with bcrypt (12 rounds)
      const passwordHash = await bcrypt.hash(password, this.BCRYPT_ROUNDS);

      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + this.EMAIL_VERIFICATION_EXPIRY);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          verificationToken,
          verificationExpires,
          subscriptionTier: 'free'
        },
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionTier: true,
          emailVerified: true,
          createdAt: true
        }
      });

      // Send verification email
      await this.sendEmailVerification(user.id, email, name || 'User');

      // Log security event
      await this.logSecurityEvent(user.id, email, 'user_registered', deviceInfo);

      logger.info('User registered successfully', { 
        userId: user.id, 
        email, 
        ipAddress: deviceInfo.ipAddress 
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            subscriptionTier: user.subscriptionTier,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt
          },
          requiresVerification: true
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login with rate limiting and proper password verification
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, rememberMe = false }: LoginData = req.body;
      const deviceInfo = this.extractDeviceInfo(req);

      // Get user with password hash
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          name: true,
          subscriptionTier: true,
          emailVerified: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          accountLocked: true,
          lockoutExpires: true
        }
      });

      if (!user) {
        // Log failed login attempt
        await this.logSecurityEvent(null, email, 'login_failed', {
          ...deviceInfo,
          reason: 'user_not_found'
        });
        
        throw new UnauthorizedError('Invalid email or password');
      }

      // Check if account is locked
      if (user.accountLocked && user.lockoutExpires && user.lockoutExpires > new Date()) {
        const lockoutMinutes = Math.ceil((user.lockoutExpires.getTime() - Date.now()) / (1000 * 60));
        
        await this.logSecurityEvent(user.id, email, 'login_attempt_locked', deviceInfo);
        
        throw new UnauthorizedError(`Account is locked. Try again in ${lockoutMinutes} minutes.`);
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      
      if (!isValidPassword) {
        // Log failed login attempt
        await this.logSecurityEvent(user.id, email, 'login_failed', {
          ...deviceInfo,
          reason: 'invalid_password'
        });
        
        throw new UnauthorizedError('Invalid email or password');
      }

      // Check if email is verified (bypass in development mode)
      if (!user.emailVerified && config.env !== 'development') {
        await this.logSecurityEvent(user.id, email, 'login_attempt_unverified', deviceInfo);
        
        throw new UnauthorizedError('Please verify your email address before logging in.');
      }

      // Generate JWT tokens with user role
      const userRole: 'user' | 'admin' = user.email.includes('@admin.') ? 'admin' : 'user';
      
      const tokens = await jwtService.generateTokenPair(
        user.id,
        user.email,
        userRole,
        deviceInfo.deviceId,
        deviceInfo.ipAddress,
        deviceInfo.userAgent
      );

      // Update last login and clear any account locks
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
          accountLocked: false,
          lockoutExpires: null
        }
      });

      // Set refresh token in httpOnly cookie
      const cookieOptions = {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'strict' as const,
        maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 7 days or 1 day
        path: '/api/auth'
      };

      res.cookie('refreshToken', tokens.refreshToken, cookieOptions);

      // Log successful login
      await this.logSecurityEvent(user.id, email, 'login_success', deviceInfo);

      logger.info('User logged in successfully', { 
        userId: user.id, 
        email,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: userRole,
            subscriptionTier: user.subscriptionTier,
            emailVerified: user.emailVerified,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt
          },
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh tokens with rotation
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        throw new UnauthorizedError('Refresh token not provided');
      }

      const newTokens = await jwtService.refreshTokens(refreshToken);

      if (!newTokens) {
        // Clear invalid refresh token cookie
        res.clearCookie('refreshToken', { path: '/api/auth' });
        throw new UnauthorizedError('Invalid or expired refresh token');
      }

      // Get user info for response
      const decoded = await jwtService.verifyAccessToken(newTokens.accessToken);
      if (!decoded) {
        throw new UnauthorizedError('Token generation failed');
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionTier: true,
          emailVerified: true,
          lastLogin: true,
          createdAt: true
        }
      });

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      // Set new refresh token in cookie
      const cookieOptions = {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'strict' as const,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/auth'
      };

      res.cookie('refreshToken', newTokens.refreshToken, cookieOptions);

      // Log token refresh
      await this.logSecurityEvent(decoded.userId, decoded.email, 'token_refresh', 
        this.extractDeviceInfo(req));

      res.status(200).json({
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: decoded.role,
            subscriptionTier: user.subscriptionTier,
            emailVerified: user.emailVerified,
            lastLogin: user.lastLogin
          },
          accessToken: newTokens.accessToken,
          expiresIn: newTokens.expiresIn
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout with token blacklisting
   */
  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const sessionId = req.sessionId!;
      const accessToken = req.headers.authorization?.split(' ')[1];

      // Logout from current session
      await jwtService.logout(user.id, sessionId, accessToken);

      // Clear refresh token cookie
      res.clearCookie('refreshToken', { 
        path: '/api/auth',
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'strict'
      });

      // Log logout
      await this.logSecurityEvent(user.id, user.email, 'logout', this.extractDeviceInfo(req));

      logger.info('User logged out successfully', { 
        userId: user.id, 
        sessionId,
        ipAddress: req.ip 
      });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout from all sessions
   */
  async logoutAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;

      // Logout from all sessions
      await jwtService.logoutAllSessions(user.id);

      // Clear refresh token cookie
      res.clearCookie('refreshToken', { 
        path: '/api/auth',
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'strict'
      });

      // Log logout all
      await this.logSecurityEvent(user.id, user.email, 'logout_all_sessions', 
        this.extractDeviceInfo(req));

      logger.info('User logged out from all sessions', { userId: user.id });

      res.status(200).json({
        success: true,
        message: 'Logged out from all sessions successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset with time-limited token
   */
  async requestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email }: PasswordResetRequestData = req.body;
      const deviceInfo = this.extractDeviceInfo(req);

      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true, emailVerified: true }
      });

      // Always return success to prevent email enumeration
      const successResponse = {
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      };

      if (!user || !user.emailVerified) {
        // Log security event for non-existent or unverified user
        await this.logSecurityEvent(user?.id || null, email, 'password_reset_attempt_invalid', {
          ...deviceInfo,
          reason: user ? 'unverified_email' : 'user_not_found'
        });
        
        res.status(200).json(successResponse);
        return;
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + this.PASSWORD_RESET_EXPIRY);

      // Store reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry
        }
      });

      // Send password reset email
      await this.sendPasswordResetEmail(user.email, user.name || 'User', resetToken);

      // Log security event
      await this.logSecurityEvent(user.id, email, 'password_reset_requested', deviceInfo);

      logger.info('Password reset requested', { 
        userId: user.id, 
        email,
        ipAddress: deviceInfo.ipAddress 
      });

      res.status(200).json(successResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirm password reset with new password
   */
  async confirmPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password }: PasswordResetConfirmData = req.body;
      const deviceInfo = this.extractDeviceInfo(req);

      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gt: new Date()
          }
        },
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true
        }
      });

      if (!user) {
        await this.logSecurityEvent(null, '', 'password_reset_invalid_token', {
          ...deviceInfo,
          token: token.substring(0, 8) + '...'
        });
        
        throw new BadRequestError('Invalid or expired password reset token');
      }

      // Check if new password is different from current
      const isSamePassword = await bcrypt.compare(password, user.passwordHash);
      if (isSamePassword) {
        throw new BadRequestError('New password must be different from current password');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(password, this.BCRYPT_ROUNDS);

      // Update password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetToken: null,
          resetTokenExpiry: null,
          accountLocked: false,
          lockoutExpires: null
        }
      });

      // Logout from all sessions (security measure)
      await jwtService.logoutAllSessions(user.id);

      // Log security event
      await this.logSecurityEvent(user.id, user.email, 'password_reset_success', deviceInfo);

      logger.info('Password reset completed', { 
        userId: user.id, 
        email: user.email,
        ipAddress: deviceInfo.ipAddress 
      });

      res.status(200).json({
        success: true,
        message: 'Password reset successful. Please log in with your new password.'
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
      const user = req.user!;
      const { currentPassword, newPassword }: ChangePasswordData = req.body;
      const deviceInfo = this.extractDeviceInfo(req);

      // Get current password hash
      const userWithPassword = await prisma.user.findUnique({
        where: { id: user.id },
        select: { passwordHash: true }
      });

      if (!userWithPassword) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, userWithPassword.passwordHash);
      if (!isValidPassword) {
        await this.logSecurityEvent(user.id, user.email, 'password_change_failed', {
          ...deviceInfo,
          reason: 'invalid_current_password'
        });
        
        throw new UnauthorizedError('Current password is incorrect');
      }

      // Check if new password is different
      const isSamePassword = await bcrypt.compare(newPassword, userWithPassword.passwordHash);
      if (isSamePassword) {
        throw new BadRequestError('New password must be different from current password');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
      });

      // Log security event
      await this.logSecurityEvent(user.id, user.email, 'password_change_success', deviceInfo);

      logger.info('Password changed successfully', { 
        userId: user.id, 
        email: user.email,
        ipAddress: deviceInfo.ipAddress 
      });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
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
      const deviceInfo = this.extractDeviceInfo(req);

      const user = await prisma.user.findFirst({
        where: {
          verificationToken: token,
          verificationExpires: {
            gt: new Date()
          }
        },
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true
        }
      });

      if (!user) {
        throw new BadRequestError('Invalid or expired verification token');
      }

      if (user.emailVerified) {
        res.status(200).json({
          success: true,
          message: 'Email is already verified'
        });
        return;
      }

      // Verify email
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationToken: null,
          verificationExpires: null
        }
      });

      // Log security event
      await this.logSecurityEvent(user.id, user.email, 'email_verified', deviceInfo);

      logger.info('Email verified successfully', { 
        userId: user.id, 
        email: user.email 
      });

      res.status(200).json({
        success: true,
        message: 'Email verified successfully. You can now log in.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;

      const profile = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionTier: true,
          emailVerified: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!profile) {
        throw new NotFoundError('User profile not found');
      }

      // Get user sessions
      const sessions = await jwtService.getUserSessions(user.id);

      res.status(200).json({
        success: true,
        data: {
          profile,
          sessions: sessions.map(session => ({
            sessionId: session.sessionId,
            deviceId: session.deviceId,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
            isActive: session.isActive
          }))
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
      const user = req.user!;
      const updates: UpdateProfileData = req.body;
      const deviceInfo = this.extractDeviceInfo(req);

      // If email is being updated, require verification
      let emailVerificationRequired = false;
      let verificationToken: string | undefined;
      
      if (updates.email && updates.email !== user.email) {
        emailVerificationRequired = true;
        
        // Check if new email already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: updates.email }
        });

        if (existingUser) {
          throw new BadRequestError('An account with this email already exists');
        }

        // Generate new verification token
        verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + this.EMAIL_VERIFICATION_EXPIRY);

        // Update profile with verification fields separately
        await prisma.user.update({
          where: { id: user.id },
          data: {
            ...updates,
            verificationToken,
            verificationExpires,
            emailVerified: false,
          }
        });
      } else {
        // Update profile without verification fields
        await prisma.user.update({
          where: { id: user.id },
          data: updates
        });
      }

      // Get updated user data
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionTier: true,
          emailVerified: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // Send email verification if email was changed
      if (emailVerificationRequired && updates.email && verificationToken) {
        await this.sendEmailVerification(user.id, updates.email, updates.name || user.name || 'User');
      }

      // Log security event
      await this.logSecurityEvent(user.id, user.email, 'profile_updated', {
        ...deviceInfo,
        changes: Object.keys(updates)
      });

      logger.info('User profile updated', { 
        userId: user.id, 
        changes: Object.keys(updates)
      });

      res.status(200).json({
        success: true,
        message: emailVerificationRequired 
          ? 'Profile updated. Please verify your new email address.'
          : 'Profile updated successfully',
        data: {
          user: updatedUser,
          emailVerificationRequired
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Extract device information from request
   */
  private extractDeviceInfo(req: Request): DeviceInfo {
    return {
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
      deviceId: req.get('X-Device-ID') || req.get('X-Client-ID')
    };
  }

  /**
   * Send email verification
   */
  private async sendEmailVerification(userId: string, email: string, name: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { verificationToken: true }
      });

      if (!user?.verificationToken) {
        throw new Error('Verification token not found');
      }

      const verificationUrl = `${config.appUrl}/verify-email/${user.verificationToken}`;

      await sendEmail({
        to: email,
        subject: 'Verify your email address',
        html: `
          <h1>Welcome to ${config.appName}!</h1>
          <p>Hi ${name},</p>
          <p>Thank you for registering. Please click the link below to verify your email address:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
            Verify Email Address
          </a>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create this account, please ignore this email.</p>
        `
      });

      logger.debug('Email verification sent', { userId, email });
    } catch (error) {
      logger.error('Failed to send email verification:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  private async sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<void> {
    try {
      const resetUrl = `${config.appUrl}/reset-password/${resetToken}`;

      await sendEmail({
        to: email,
        subject: 'Password Reset Request',
        html: `
          <h1>Password Reset Request</h1>
          <p>Hi ${name},</p>
          <p>You requested to reset your password. Click the link below to set a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
        `
      });

      logger.debug('Password reset email sent', { email });
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      throw error;
    }
  }

  /**
   * Log security events for audit trail
   */
  private async logSecurityEvent(
    userId: string | null,
    email: string,
    event: string,
    metadata: any
  ): Promise<void> {
    try {
      // Log to database (activity_logs table)
      if (userId) {
        await prisma.activityLog.create({
          data: {
            userId,
            action: event,
            details: metadata,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent
          }
        });
      }

      // Log to application logger
      logger.info('Security event', {
        userId,
        email,
        event,
        ...metadata,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to log security event:', error);
    }
  }
}

export const authController = new AuthController();
export { AuthController }; 