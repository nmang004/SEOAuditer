import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { config } from '../config/config';
import { jwtService, TokenPair } from '../services/jwt.service';
import { 
  BadRequestError, 
  UnauthorizedError, 
  NotFoundError,
  ValidationError 
} from '../middleware/error.middleware';
import { sendEmail } from '../services/email.service';
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
  UpdateProfileData
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
  permissions?: string[];
  sessionId?: string;
}

export class EnhancedAuthController {
  /**
   * User registration with comprehensive validation and security
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate input data
      const validation = registerSchema.safeParse(req);
      if (!validation.success) {
        throw new ValidationError('Invalid registration data', validation.error.errors);
      }

      const { email, password, name }: RegisterData = validation.data.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new BadRequestError('An account with this email already exists');
      }

      // Hash password with bcrypt (12 rounds as required)
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user account
      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          verificationToken,
          verificationExpires,
          subscriptionTier: 'free'
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

      // Generate JWT tokens
      const tokenPair: TokenPair = await jwtService.generateTokenPair(user.id, user.email);

      // Set secure refresh token cookie
      res.cookie('refreshToken', tokenPair.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/auth'
      });

      // Send verification email
      try {
        const verificationUrl = `${config.clientUrl}/verify-email/${verificationToken}`;
        await sendEmail({
          to: user.email,
          subject: 'Verify Your Email Address',
          template: 'verify-email',
          context: {
            name: user.name || 'there',
            verificationUrl,
            appName: config.appName
          }
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email sending fails
      }

      // Log security event
      await this.logSecurityEvent({
        userId: user.id,
        email: user.email,
        event: 'registration_success',
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        metadata: {
          emailVerificationSent: true
        }
      });

      res.status(201).json({
        success: true,
        data: {
          user,
          accessToken: tokenPair.accessToken,
          sessionId: tokenPair.sessionId
        },
        message: 'Registration successful. Please check your email to verify your account.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * User login with comprehensive security checks
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate input data
      const validation = loginSchema.safeParse(req);
      if (!validation.success) {
        throw new ValidationError('Invalid login data', validation.error.errors);
      }

      const { email, password, rememberMe }: LoginData = validation.data.body;

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
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        await this.logSecurityEvent({
          email,
          event: 'login_failure',
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent'),
          metadata: { reason: 'user_not_found' }
        });
        throw new UnauthorizedError('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        await this.logSecurityEvent({
          userId: user.id,
          email: user.email,
          event: 'login_failure',
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent'),
          metadata: { reason: 'invalid_password' }
        });
        throw new UnauthorizedError('Invalid email or password');
      }

      // Check concurrent session limit
      const sessionCount = await jwtService.getUserSessionCount(user.id);
      const maxSessions = 5; // Allow up to 5 concurrent sessions
      
      if (sessionCount >= maxSessions) {
        // Optionally invalidate oldest session here
        console.warn(`User ${user.id} has reached session limit (${sessionCount}/${maxSessions})`);
      }

      // Generate JWT tokens
      const tokenPair: TokenPair = await jwtService.generateTokenPair(user.id, user.email);

      // Set refresh token cookie (longer expiry if "remember me" is checked)
      const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 30 days vs 7 days
      
      res.cookie('refreshToken', tokenPair.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: cookieMaxAge,
        path: '/api/auth'
      });

      // Update last login timestamp
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // Log successful login
      await this.logSecurityEvent({
        userId: user.id,
        email: user.email,
        event: 'login_success',
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        metadata: {
          sessionId: tokenPair.sessionId,
          rememberMe: rememberMe || false
        }
      });

      // Return user data without sensitive information
      const { passwordHash, ...userData } = user;

      res.json({
        success: true,
        data: {
          user: userData,
          accessToken: tokenPair.accessToken,
          sessionId: tokenPair.sessionId
        },
        message: 'Login successful'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        throw new UnauthorizedError('No refresh token provided');
      }

      // Refresh tokens with rotation
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

      // Get user data for logging
      const decoded = await jwtService.verifyAccessToken(newTokenPair.accessToken);
      if (decoded) {
        await this.logSecurityEvent({
          userId: decoded.userId,
          email: decoded.email,
          event: 'token_refresh',
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent'),
          metadata: {
            newSessionId: newTokenPair.sessionId
          }
        });
      }

      res.json({
        success: true,
        data: {
          accessToken: newTokenPair.accessToken,
          sessionId: newTokenPair.sessionId
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * User logout with token invalidation
   */
  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

      // Invalidate refresh token if present
      if (refreshToken) {
        await jwtService.invalidateRefreshToken(refreshToken);
      }

      // Blacklist access token if present
      if (accessToken) {
        await jwtService.blacklistToken(accessToken);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        path: '/api/auth'
      });

      // Log logout event
      if (req.user) {
        await this.logSecurityEvent({
          userId: req.user.id,
          email: req.user.email,
          event: 'logout_success',
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent')
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
   * Password reset request
   */
  async requestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = passwordResetRequestSchema.safeParse(req);
      if (!validation.success) {
        throw new ValidationError('Invalid request data', validation.error.errors);
      }

      const { email }: PasswordResetRequestData = validation.data.body;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true }
      });

      // Always return success to prevent email enumeration
      const successMessage = 'If an account with that email exists, we have sent a password reset link.';

      if (!user) {
        // Log the attempt but don't reveal user doesn't exist
        await this.logSecurityEvent({
          email,
          event: 'password_reset_request',
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent'),
          metadata: { reason: 'user_not_found' }
        });

        res.json({
          success: true,
          message: successMessage
        });
        return;
      }

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry
        }
      });

      // Send password reset email
      try {
        const resetUrl = `${config.clientUrl}/reset-password/${resetToken}`;
        await sendEmail({
          to: user.email,
          subject: 'Password Reset Request',
          template: 'password-reset',
          context: {
            name: user.name || 'there',
            resetUrl,
            appName: config.appName,
            expiryTime: '1 hour'
          }
        });

        await this.logSecurityEvent({
          userId: user.id,
          email: user.email,
          event: 'password_reset_request',
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent'),
          metadata: { emailSent: true }
        });
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        throw new BadRequestError('Failed to send password reset email. Please try again later.');
      }

      res.json({
        success: true,
        message: successMessage
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Password reset confirmation
   */
  async confirmPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = passwordResetConfirmSchema.safeParse(req);
      if (!validation.success) {
        throw new ValidationError('Invalid reset data', validation.error.errors);
      }

      const { token, password }: PasswordResetConfirmData = validation.data.body;

      // Find user by reset token
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
        await this.logSecurityEvent({
          event: 'password_reset_failure',
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent'),
          metadata: { reason: 'invalid_or_expired_token' }
        });
        throw new BadRequestError('Invalid or expired reset token');
      }

      // Check if new password is different from current
      const isSamePassword = await bcrypt.compare(password, user.passwordHash);
      if (isSamePassword) {
        throw new BadRequestError('New password must be different from your current password');
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(password, saltRounds);

      // Update password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          resetToken: null,
          resetTokenExpiry: null
        }
      });

      // Invalidate all existing sessions for security
      await jwtService.invalidateAllUserSessions(user.id);

      // Log successful password reset
      await this.logSecurityEvent({
        userId: user.id,
        email: user.email,
        event: 'password_reset_success',
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Password reset successful. Please log in with your new password.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password for authenticated users
   */
  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const validation = changePasswordSchema.safeParse(req);
      if (!validation.success) {
        throw new ValidationError('Invalid password change data', validation.error.errors);
      }

      const { currentPassword, newPassword }: ChangePasswordData = validation.data.body;

      // Get user with password hash
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, email: true, passwordHash: true }
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        await this.logSecurityEvent({
          userId: user.id,
          email: user.email,
          event: 'password_change_failure',
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent'),
          metadata: { reason: 'invalid_current_password' }
        });
        throw new BadRequestError('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash }
      });

      // Log successful password change
      await this.logSecurityEvent({
        userId: user.id,
        email: user.email,
        event: 'password_change_success',
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent')
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
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
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

      if (!user) {
        throw new NotFoundError('User not found');
      }

      res.json({
        success: true,
        data: { user }
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
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const validation = updateProfileSchema.safeParse(req);
      if (!validation.success) {
        throw new ValidationError('Invalid profile data', validation.error.errors);
      }

      const updateData: UpdateProfileData = validation.data.body;

      // Check if email is being changed and if it's already taken
      if (updateData.email && updateData.email !== req.user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: updateData.email }
        });

        if (existingUser) {
          throw new BadRequestError('Email address is already in use');
        }
      }

      // Update user profile
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
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

      // Log profile update
      await this.logSecurityEvent({
        userId: req.user.id,
        email: req.user.email,
        event: 'profile_update',
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        metadata: { fieldsUpdated: Object.keys(updateData) }
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
   * Email verification
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

      // Mark email as verified and clear verification token
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
        userAgent: req.get('User-Agent')
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
   * Invalidate all user sessions (logout from all devices)
   */
  async logoutAllDevices(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      // Invalidate all user sessions
      await jwtService.invalidateAllUserSessions(req.user.id);

      // Log security event
      await this.logSecurityEvent({
        userId: req.user.id,
        email: req.user.email,
        event: 'logout_all_devices',
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Logged out from all devices successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Log security events for audit purposes
   */
  private async logSecurityEvent(eventData: {
    userId?: string;
    email?: string;
    event: string;
    ip: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      // Only log if we have a valid userId since it's required by the schema
      if (eventData.userId) {
        await prisma.activityLog.create({
          data: {
            userId: eventData.userId,
            action: eventData.event,
            details: {
              email: eventData.email,
              ip: eventData.ip,
              userAgent: eventData.userAgent,
              timestamp: new Date().toISOString(),
              ...eventData.metadata
            },
            ipAddress: eventData.ip,
            userAgent: eventData.userAgent
          }
        });
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
      // Don't throw error as logging failures shouldn't break the main flow
    }
  }
}

// Create and export controller instance
export const enhancedAuthController = new EnhancedAuthController(); 