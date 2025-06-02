import type { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/config';
import { 
  BadRequestError, 
  UnauthorizedError, 
  NotFoundError
} from '../middleware/error.middleware';
import { sendEmail } from '../services/email.service';
import { logger } from '../utils/logger';

// Create separate instances to avoid circular dependency
const prisma = new PrismaClient();
let redisClient: ReturnType<typeof createClient> | null = null;

// Initialize Redis client with error handling
const initRedisClient = async () => {
  if (redisClient) return redisClient;
  
  try {
    const client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
    
    await client.connect();
    redisClient = client;
    console.log('Redis client connected successfully');
    return client;
  } catch (error) {
    console.warn('Failed to connect to Redis, using fallback mode:', error);
    return null;
  }
};

// Initialize Redis on startup
initRedisClient();

// Token generation helper
const generateTokens = (userId: string) => {
  const secret: Secret = config.jwt.secret as string;
  const accessOptions: SignOptions = { expiresIn: config.jwt.accessExpiration as any };
  const refreshOptions: SignOptions = { expiresIn: config.jwt.refreshExpiration as any };

  const accessToken = jwt.sign(
    { userId },
    secret,
    accessOptions
  );

  const refreshToken = jwt.sign(
    { userId, tokenId: uuidv4() },
    secret,
    refreshOptions
  );

  return { accessToken, refreshToken };
};

// Auth Controller
// Handles registration, login, token refresh, logout, profile, password, and email verification
// All endpoints must use correct Prisma model accessors and field names
// All select statements must only reference fields that exist in the Prisma schema
// All protected endpoints should use JWT middleware
// TODO: Add input validation middleware (zod) and rate limiting where appropriate
// TODO: Add more granular error handling and logging for production

export const authController = {
  // Register a new user
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new BadRequestError('Email already in use');
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Generate verification token
      const verificationToken = uuidv4();
      const verificationExpires = new Date();
      verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hours

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: hashedPassword,
          verificationToken,
          verificationExpires,
        },
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
          createdAt: true,
        },
      });

      // Send verification email (but don't fail if email service is down)
      const verificationUrl = `${config.clientUrl}/verify-email/${verificationToken}`;
      try {
        await sendEmail({
          to: user.email,
          subject: 'Verify Your Email',
          template: 'verify-email',
          context: {
            name: user.name || 'there',
            verificationUrl,
          },
        });
      } catch (emailError) {
        logger.warn('Failed to send verification email:', emailError);
        // Continue without failing the registration
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id);

      // Store refresh token in Redis if available
      const redis = await initRedisClient();
      if (redis) {
        try {
          await redis.setEx(
            `refresh_token:${user.id}`,
            parseInt(config.jwt.refreshExpiration, 10),
            refreshToken
          );
        } catch (error) {
          console.warn('Failed to store refresh token in Redis:', error);
          // Continue without Redis - cookies will still work
        }
      }

      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        success: true,
        data: {
          user,
          token: accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // User login
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id);

      // Store refresh token in Redis if available
      const redis = await initRedisClient();
      if (redis) {
        try {
          await redis.setEx(
            `refresh_token:${user.id}`,
            parseInt(config.jwt.refreshExpiration, 10),
            refreshToken
          );
        } catch (error) {
          console.warn('Failed to store refresh token in Redis:', error);
          // Continue without Redis - cookies will still work
        }
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Return user data (excluding sensitive fields)
      const { passwordHash, ...userData } = user;

      res.json({
        success: true,
        data: {
          user: userData,
          token: accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Refresh access token
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        throw new UnauthorizedError('No refresh token provided');
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as {
        userId: string;
        tokenId: string;
      };

      // Get stored refresh token from Redis if available
      const redis = await initRedisClient();
      let storedToken = null;
      if (redis) {
        try {
          storedToken = await redis.get(`refresh_token:${decoded.userId}`);
        } catch (error) {
          console.warn('Failed to get refresh token from Redis:', error);
        }
      }

      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Generate new tokens
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = 
        generateTokens(decoded.userId);

      // Update refresh token in Redis if available
      const updateRedis = await initRedisClient();
      if (updateRedis) {
        try {
          await updateRedis.setEx(
            `refresh_token:${decoded.userId}`,
            parseInt(config.jwt.refreshExpiration, 10),
            newRefreshToken
          );
        } catch (error) {
          console.warn('Failed to update refresh token in Redis:', error);
          // Continue without Redis - cookies will still work
        }
      }

      // Set new refresh token as HTTP-only cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        data: {
          token: newAccessToken,
        },
      });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        next(new UnauthorizedError('Refresh token expired'));
      } else if (error instanceof jwt.JsonWebTokenError) {
        next(new UnauthorizedError('Invalid refresh token'));
      } else {
        next(error);
      }
    }
  },

  // Logout user
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.cookies;

      if (refreshToken) {
        try {
          const decoded = jwt.verify(refreshToken, config.jwt.secret) as {
            userId: string;
          };
          // Delete refresh token from Redis if available
          const redis = await initRedisClient();
          if (redis) {
            try {
              await redis.del(`refresh_token:${decoded.userId}`);
            } catch (error) {
              console.warn('Failed to delete refresh token from Redis:', error);
            }
          }
        } catch (error) {
          // Token is invalid or expired, nothing to do
        }
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      res.json({
        success: true,
        message: 'Successfully logged out',
      });
    } catch (error) {
      next(error);
    }
  },

  // Get current user
  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user?.id },
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionTier: true,
          emailVerified: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  // Update user profile
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;
      const userId = req.user?.id;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { name },
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionTier: true,
          emailVerified: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  },

  // Change password
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.id;

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        throw new BadRequestError('Current password is incorrect');
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hashedPassword },
      });

      res.json({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Forgot password
  forgotPassword: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;

      // Find user by email
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        // Don't reveal that the email doesn't exist
        res.status(200).json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent',
        });
        return;
      }

      // Generate reset token
      const resetToken = uuidv4();
      const resetExpires = new Date();
      resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour

      // Save reset token to user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry: resetExpires,
        },
      });

      // Send password reset email (but don't fail if email service is down)
      const resetUrl = `${config.clientUrl}/reset-password/${resetToken}`;
      try {
        await sendEmail({
          to: user.email,
          subject: 'Reset Your Password',
          template: 'reset-password',
          context: {
            name: user.name || 'there',
            resetUrl,
          },
        });
      } catch (emailError) {
        logger.warn('Failed to send password reset email:', emailError);
        // Continue without failing - user can still request another reset
      }

      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent',
      });
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'An error occurred while processing your request',
        });
      }
      next(error);
    }
  },

  // Reset password
  resetPassword: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, password } = req.body;

      // Find user by reset token
      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gt: new Date(),
          },
        },
      });

      if (!user) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token',
        });
        return;
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Update password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      // Send password changed confirmation email (but don't fail if email service is down)
      try {
        await sendEmail({
          to: user.email,
          subject: 'Password Changed',
          template: 'password-changed',
          context: {
            name: user.name || 'there',
          },
        });
      } catch (emailError) {
        logger.warn('Failed to send password changed email:', emailError);
        // Continue without failing
      }

      res.status(200).json({
        success: true,
        message: 'Password has been reset successfully',
      });
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'An error occurred while resetting your password',
        });
      }
      next(error);
    }
  },

  // Verify email
  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;

      // Find user by verification token
      const user = await prisma.user.findFirst({
        where: {
          verificationToken: token,
          verificationExpires: {
            gt: new Date(),
          },
        },
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
          verificationExpires: null,
        },
      });

      // Redirect to success page or return success response
      res.redirect(`${config.clientUrl}/email-verified`);
    } catch (error) {
      next(error);
    }
  },

  // Middleware to authenticate requests
  async authenticate(req: Request, _res: Response, next: NextFunction) {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        throw new UnauthorizedError('No token provided');
      }

      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionTier: true,
          emailVerified: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      // Attach user to request object
      req.user = user as any;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        next(new UnauthorizedError('Token expired'));
      } else if (error instanceof jwt.JsonWebTokenError) {
        next(new UnauthorizedError('Invalid token'));
      } else {
        next(error);
      }
    }
  },
};
