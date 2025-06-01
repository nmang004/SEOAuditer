import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { logger } from '../utils/logger';
import { config } from '../config/config';
import { createHash, randomBytes } from 'crypto';
import ExpressBrute from 'express-brute';
import ExpressBruteRedis from 'express-brute-redis';
import { createClient } from 'redis';
import slowDown from 'express-slow-down';

const prisma = new PrismaClient();
const redisClient = createClient({ url: config.redis.url });
redisClient.connect().catch(console.error);

// ============ TWO-FACTOR AUTHENTICATION ============

export class TwoFactorAuth {
  static generateSecret(userEmail: string): { secret: string; qrCodeUrl: string; backupCodes: string[] } {
    const secret = speakeasy.generateSecret({
      name: `${config.appName} (${userEmail})`,
      issuer: config.appName,
      length: 32
    });

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      randomBytes(4).toString('hex').toUpperCase()
    );

    return {
      secret: secret.base32!,
      qrCodeUrl: secret.otpauth_url!,
      backupCodes
    };
  }

  static async generateQRCode(otpAuthUrl: string): Promise<string> {
    try {
      return await QRCode.toDataURL(otpAuthUrl);
    } catch (error) {
      logger.error('QR code generation failed:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  static verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps (60 seconds) variance
    });
  }

  static verifyBackupCode(userBackupCodes: string[], providedCode: string): boolean {
    const upperCode = providedCode.toUpperCase();
    const index = userBackupCodes.indexOf(upperCode);
    
    if (index !== -1) {
      // Remove used backup code
      userBackupCodes.splice(index, 1);
      return true;
    }
    
    return false;
  }
}

// ============ ACCOUNT LOCKOUT AND BRUTE FORCE PROTECTION ============

const bruteStore = new ExpressBruteRedis({
  client: redisClient as any, // Type assertion to handle compatibility
  prefix: 'bruteforce:'
});

const bruteForce = new ExpressBrute(bruteStore, {
  freeRetries: 5,
  minWait: 5 * 60 * 1000, // 5 minutes
  maxWait: 60 * 60 * 1000, // 1 hour
  lifetime: 24 * 60 * 60, // 24 hours
  failCallback: (req: Request, res: Response, next: NextFunction) => {
    logger.warn('Brute force attack detected', {
      ip: req.ip,
      email: req.body?.email,
      userAgent: req.get('User-Agent'),
      timestamp: new Date()
    });

    res.status(429).json({
      success: false,
      error: 'Account temporarily locked',
      message: 'Too many failed attempts. Please try again later.',
      retryAfter: 300 // 5 minutes
    });
  }
});

export const bruteForceProtection = bruteForce.prevent;

// ============ ENHANCED SESSION MANAGEMENT ============

export class EnhancedSessionManager {
  private static readonly MAX_CONCURRENT_SESSIONS = 5;
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  static async createSession(userId: string, req: Request): Promise<string> {
    const sessionId = randomBytes(32).toString('hex');
    const deviceFingerprint = this.generateDeviceFingerprint(req);
    
    // Clean up old sessions
    await this.cleanupExpiredSessions(userId);
    
    // Check concurrent session limit
    const activeSessions = await this.getActiveSessions(userId);
    if (activeSessions.length >= this.MAX_CONCURRENT_SESSIONS) {
      // Remove oldest session
      await this.removeOldestSession(userId);
    }

    // Create new session
    const sessionData = {
      sessionId,
      userId,
      deviceFingerprint,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      isActive: 'true'
    };

    await redisClient.hSet(`session:${sessionId}`, sessionData);
    await redisClient.expire(`session:${sessionId}`, this.SESSION_TIMEOUT / 1000);
    
    // Track user sessions
    await redisClient.sAdd(`user_sessions:${userId}`, sessionId);

    logger.info('Session created', {
      userId,
      sessionId,
      deviceFingerprint,
      ip: req.ip
    });

    return sessionId;
  }

  static async validateSession(sessionId: string, req: Request): Promise<{ valid: boolean; userId?: string; reason?: string }> {
    try {
      const sessionData = await redisClient.hGetAll(`session:${sessionId}`);
      
      if (!sessionData || !sessionData.userId) {
        return { valid: false, reason: 'Session not found' };
      }

      if (sessionData.isActive !== 'true') {
        return { valid: false, reason: 'Session inactive' };
      }

      // Check device fingerprint for session hijacking detection
      const currentFingerprint = this.generateDeviceFingerprint(req);
      if (sessionData.deviceFingerprint !== currentFingerprint) {
        logger.warn('Session hijacking attempt detected', {
          sessionId,
          userId: sessionData.userId,
          originalFingerprint: sessionData.deviceFingerprint,
          currentFingerprint,
          ip: req.ip
        });
        
        await this.invalidateSession(sessionId);
        return { valid: false, reason: 'Device fingerprint mismatch' };
      }

      // Update last activity
      await redisClient.hSet(`session:${sessionId}`, 'lastActivity', new Date().toISOString());
      await redisClient.expire(`session:${sessionId}`, this.SESSION_TIMEOUT / 1000);

      return { valid: true, userId: sessionData.userId };
    } catch (error) {
      logger.error('Session validation error:', error);
      return { valid: false, reason: 'Session validation failed' };
    }
  }

  static async invalidateSession(sessionId: string): Promise<void> {
    try {
      const sessionData = await redisClient.hGetAll(`session:${sessionId}`);
      if (sessionData.userId) {
        await redisClient.sRem(`user_sessions:${sessionData.userId}`, sessionId);
      }
      await redisClient.del(`session:${sessionId}`);
    } catch (error) {
      logger.error('Session invalidation error:', error);
    }
  }

  static async invalidateAllUserSessions(userId: string): Promise<void> {
    try {
      const sessionIds = await redisClient.sMembers(`user_sessions:${userId}`);
      for (const sessionId of sessionIds) {
        await redisClient.del(`session:${sessionId}`);
      }
      await redisClient.del(`user_sessions:${userId}`);
    } catch (error) {
      logger.error('User session cleanup error:', error);
    }
  }

  private static generateDeviceFingerprint(req: Request): string {
    const components = [
      req.get('User-Agent') || '',
      req.get('Accept-Language') || '',
      req.get('Accept-Encoding') || '',
      req.ip || ''
    ];
    
    return createHash('sha256').update(components.join('|')).digest('hex');
  }

  private static async getActiveSessions(userId: string): Promise<string[]> {
    try {
      return await redisClient.sMembers(`user_sessions:${userId}`);
    } catch (error) {
      logger.error('Failed to get active sessions:', error);
      return [];
    }
  }

  private static async removeOldestSession(userId: string): Promise<void> {
    try {
      const sessionIds = await this.getActiveSessions(userId);
      let oldestSession = null;
      let oldestTime = Date.now();

      for (const sessionId of sessionIds) {
        const sessionData = await redisClient.hGetAll(`session:${sessionId}`);
        const createdAt = new Date(sessionData.createdAt).getTime();
        
        if (createdAt < oldestTime) {
          oldestTime = createdAt;
          oldestSession = sessionId;
        }
      }

      if (oldestSession) {
        await this.invalidateSession(oldestSession);
      }
    } catch (error) {
      logger.error('Failed to remove oldest session:', error);
    }
  }

  private static async cleanupExpiredSessions(userId: string): Promise<void> {
    try {
      const sessionIds = await this.getActiveSessions(userId);
      const expiredSessions: string[] = [];

      for (const sessionId of sessionIds) {
        const exists = await redisClient.exists(`session:${sessionId}`);
        if (!exists) {
          expiredSessions.push(sessionId);
        }
      }

      for (const sessionId of expiredSessions) {
        await redisClient.sRem(`user_sessions:${userId}`, sessionId);
      }
    } catch (error) {
      logger.error('Session cleanup error:', error);
    }
  }
}

// ============ PASSWORD SECURITY ENHANCEMENTS ============

export class PasswordSecurity {
  private static readonly COMMON_PASSWORDS = new Set([
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890'
  ]);

  private static readonly PASSWORD_HISTORY_LIMIT = 12;

  static validatePasswordStrength(password: string): { valid: boolean; score: number; feedback: string[] } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 12) {
      score += 2;
    } else if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password must be at least 8 characters long');
    }

    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    // Check for common passwords
    if (this.COMMON_PASSWORDS.has(password.toLowerCase())) {
      score = 0;
      feedback.push('Password is too common');
    }

    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) {
      score -= 1;
      feedback.push('Avoid repeated characters');
    }

    // Check for sequential patterns
    if (this.hasSequentialPattern(password)) {
      score -= 1;
      feedback.push('Avoid sequential patterns');
    }

    const valid = score >= 4;
    
    if (!valid && feedback.length === 0) {
      feedback.push('Password must contain uppercase, lowercase, numbers, and special characters');
    }

    return { valid, score, feedback };
  }

  static async checkPasswordHistory(userId: string, newPasswordHash: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { passwordHistory: { orderBy: { createdAt: 'desc' }, take: this.PASSWORD_HISTORY_LIMIT } }
      });

      if (!user?.passwordHistory) {
        return true; // No history, password is allowed
      }

      // Check if new password matches any in history
      for (const entry of user.passwordHistory) {
        if (entry.passwordHash === newPasswordHash) {
          return false; // Password was used before
        }
      }

      return true;
    } catch (error) {
      logger.error('Password history check failed:', error);
      return true; // Allow on error to avoid blocking legitimate users
    }
  }

  static async addToPasswordHistory(userId: string, passwordHash: string): Promise<void> {
    try {
      // Add new password to history
      await prisma.passwordHistory.create({
        data: {
          userId,
          passwordHash,
          createdAt: new Date()
        }
      });

      // Clean up old entries
      const historyEntries = await prisma.passwordHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: this.PASSWORD_HISTORY_LIMIT
      });

      if (historyEntries.length > 0) {
        await prisma.passwordHistory.deleteMany({
          where: {
            id: { in: historyEntries.map(entry => entry.id) }
          }
        });
      }
    } catch (error) {
      logger.error('Failed to update password history:', error);
    }
  }

  private static hasSequentialPattern(password: string): boolean {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      '0123456789',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm'
    ];

    for (const sequence of sequences) {
      for (let i = 0; i <= sequence.length - 3; i++) {
        if (password.toLowerCase().includes(sequence.substring(i, i + 3))) {
          return true;
        }
      }
    }

    return false;
  }
}

// ============ SLOW DOWN MIDDLEWARE ============

export const slowDownAttacks = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 5, // Allow 5 requests per windowMs without delay
  delayMs: 500, // Add 500ms delay after 5 requests
  maxDelayMs: 20000, // Maximum delay of 20 seconds
});

// ============ ACCOUNT LOCKOUT MIDDLEWARE ============

export class AccountLockout {
  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
  private static readonly ESCALATION_ATTEMPTS = 10;
  private static readonly EXTENDED_LOCKOUT_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  static async recordFailedAttempt(email: string, ip: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return;

      const now = new Date();
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      
      let lockoutExpires = null;
      let accountLocked = false;

      if (failedAttempts >= this.ESCALATION_ATTEMPTS) {
        // Extended lockout for persistent attacks
        lockoutExpires = new Date(now.getTime() + this.EXTENDED_LOCKOUT_DURATION);
        accountLocked = true;
        
        logger.error('Account locked - extended lockout', {
          userId: user.id,
          email,
          failedAttempts,
          ip,
          lockoutExpires
        });
      } else if (failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
        // Standard lockout
        lockoutExpires = new Date(now.getTime() + this.LOCKOUT_DURATION);
        accountLocked = true;
        
        logger.warn('Account locked - standard lockout', {
          userId: user.id,
          email,
          failedAttempts,
          ip,
          lockoutExpires
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          accountLocked,
          lockoutExpires,
          lastFailedAttempt: now
        }
      });

      // Log security event
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'failed_login_attempt',
          details: { failedAttempts, ip, lockoutExpires },
          ipAddress: ip
        }
      });
    } catch (error) {
      logger.error('Failed to record failed attempt:', error);
    }
  }

  static async recordSuccessfulLogin(email: string, ip: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          accountLocked: false,
          lockoutExpires: null,
          lastLogin: new Date()
        }
      });

      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'successful_login',
          details: { ip },
          ipAddress: ip
        }
      });
    } catch (error) {
      logger.error('Failed to record successful login:', error);
    }
  }

  static async isAccountLocked(email: string): Promise<{ locked: boolean; reason?: string; retryAfter?: Date }> {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return { locked: false };

      if (user.accountLocked && user.lockoutExpires) {
        if (user.lockoutExpires > new Date()) {
          return {
            locked: true,
            reason: 'Account temporarily locked due to failed login attempts',
            retryAfter: user.lockoutExpires
          };
        } else {
          // Lockout expired, unlock account
          await prisma.user.update({
            where: { id: user.id },
            data: {
              accountLocked: false,
              lockoutExpires: null,
              failedLoginAttempts: 0
            }
          });
        }
      }

      return { locked: false };
    } catch (error) {
      logger.error('Account lockout check failed:', error);
      return { locked: false };
    }
  }
}

// ============ MIDDLEWARE EXPORTS ============

export const enhancedSecurityMiddleware = {
  twoFactorAuth: TwoFactorAuth,
  sessionManager: EnhancedSessionManager,
  passwordSecurity: PasswordSecurity,
  accountLockout: AccountLockout,
  bruteForceProtection,
  slowDownAttacks
};

export default enhancedSecurityMiddleware; 