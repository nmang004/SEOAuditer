import jwt, { SignOptions, VerifyOptions, JwtPayload } from 'jsonwebtoken';
import { createPrivateKey, createPublicKey, generateKeyPairSync } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/config';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const redisClient = createClient({
  url: config.redis.url
});

interface ExtendedJWTPayload extends JwtPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  tokenId?: string;
  type: 'access' | 'refresh';
  sessionId: string;
  permissions?: string[];
  deviceId?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

interface SessionInfo {
  sessionId: string;
  userId: string;
  email: string;
  role: string;
  deviceId?: string;
  lastActivity: Date;
  createdAt: Date;
}

class EnhancedJWTService {
  private privateKey!: string;
  private publicKey!: string;
  private readonly accessTokenExpiry = '15m'; // 15 minutes as required
  private readonly refreshTokenExpiry = '7d'; // 7 days as required
  private readonly algorithm = 'RS256' as const;
  private readonly maxSessionsPerUser = 5;

  constructor() {
    this.initializeKeys();
    this.connectRedis();
    this.startCleanupProcess();
  }

  /**
   * Initialize RS256 key pair for JWT signing/verification
   * Uses environment variables or generates new keys for development
   */
  private initializeKeys(): void {
    try {
      if (process.env.JWT_PRIVATE_KEY && process.env.JWT_PUBLIC_KEY) {
        // Use keys from environment (production)
        this.privateKey = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
        this.publicKey = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n');
        
        // Validate keys
        createPrivateKey(this.privateKey);
        createPublicKey(this.publicKey);
        
        logger.info('JWT keys loaded from environment variables');
      } else {
        // Generate new key pair for development
        logger.warn('JWT keys not found in environment, generating new RS256 key pair');
        const { privateKey, publicKey } = generateKeyPairSync('rsa', {
          modulusLength: 2048,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
          }
        });
        
        this.privateKey = privateKey;
        this.publicKey = publicKey;
        
        // Log keys for development setup
        console.log('\n🔑 Generated JWT Keys (save these to environment variables):');
        console.log('JWT_PRIVATE_KEY=', JSON.stringify(privateKey));
        console.log('JWT_PUBLIC_KEY=', JSON.stringify(publicKey));
        console.log('');
      }
    } catch (error) {
      logger.error('Failed to initialize JWT keys:', error);
      throw new Error('JWT key initialization failed');
    }
  }

  /**
   * Connect to Redis for token blacklisting and session management
   */
  private async connectRedis(): Promise<void> {
    try {
      if (!redisClient.isOpen) {
        await redisClient.connect();
        logger.info('Redis connected for JWT service');
      }
    } catch (error) {
      logger.error('Redis connection failed:', error);
      // Continue without Redis for development
    }
  }

  /**
   * Generate access token with RS256 algorithm
   */
  generateAccessToken(userId: string, email: string, role: 'user' | 'admin', sessionId: string, deviceId?: string): string {
    const payload: ExtendedJWTPayload = {
      userId,
      email,
      role,
      type: 'access',
      sessionId,
      deviceId,
      permissions: this.getUserPermissions(role)
    };

    const signOptions: SignOptions = {
      algorithm: this.algorithm,
      expiresIn: this.accessTokenExpiry,
      issuer: config.appName,
      audience: config.appUrl,
      subject: userId,
      jwtid: uuidv4(),
      notBefore: 0 // Token valid immediately
    };

    return jwt.sign(payload, this.privateKey, signOptions);
  }

  /**
   * Generate refresh token with RS256 algorithm and rotation support
   */
  generateRefreshToken(userId: string, email: string, role: 'user' | 'admin', sessionId: string, deviceId?: string): string {
    const tokenId = uuidv4();
    const payload: ExtendedJWTPayload = {
      userId,
      email,
      role,
      type: 'refresh',
      sessionId,
      tokenId,
      deviceId
    };

    const signOptions: SignOptions = {
      algorithm: this.algorithm,
      expiresIn: this.refreshTokenExpiry,
      issuer: config.appName,
      audience: config.appUrl,
      subject: userId,
      jwtid: tokenId
    };

    return jwt.sign(payload, this.privateKey, signOptions);
  }

  /**
   * Generate complete token pair with session management
   */
  async generateTokenPair(
    userId: string, 
    email: string, 
    role: 'user' | 'admin' = 'user',
    deviceId?: string
  ): Promise<TokenPair> {
    const sessionId = uuidv4();
    
    // Enforce session limits per user
    await this.enforceConcurrentSessionLimits(userId);
    
    const accessToken = this.generateAccessToken(userId, email, role, sessionId, deviceId);
    const refreshToken = this.generateRefreshToken(userId, email, role, sessionId, deviceId);

    // Store refresh token in database with rotation tracking
    await this.storeRefreshToken(userId, refreshToken, sessionId, deviceId);

    // Store session information in Redis
    await this.storeSession(sessionId, userId, email, role, deviceId);

    // Log token generation for security audit
    await this.logSecurityEvent('token_generated', userId, { sessionId, deviceId });

    return {
      accessToken,
      refreshToken,
      sessionId,
      expiresIn: 15 * 60, // 15 minutes in seconds
      refreshExpiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
    };
  }

  /**
   * Verify access token with comprehensive security checks
   */
  async verifyAccessToken(token: string): Promise<ExtendedJWTPayload | null> {
    try {
      // Check if token is blacklisted
      if (await this.isTokenBlacklisted(token)) {
        logger.warn('Attempted use of blacklisted access token');
        return null;
      }

      const verifyOptions: VerifyOptions = {
        algorithms: [this.algorithm],
        issuer: config.appName,
        audience: config.appUrl,
        clockTolerance: 30 // 30 seconds clock tolerance
      };

      const decoded = jwt.verify(token, this.publicKey, verifyOptions) as ExtendedJWTPayload;
      
      if (decoded.type !== 'access') {
        logger.warn('Invalid token type for access token verification');
        return null;
      }

      // Verify session still exists and is valid
      if (!(await this.isSessionValid(decoded.sessionId))) {
        logger.warn('Session no longer valid for access token');
        return null;
      }

      // Update session activity
      await this.updateSessionActivity(decoded.sessionId);

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.info('Access token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid access token format');
      } else {
        logger.error('Access token verification failed:', error);
      }
      return null;
    }
  }

  /**
   * Verify refresh token with rotation support
   */
  async verifyRefreshToken(token: string): Promise<ExtendedJWTPayload | null> {
    try {
      // Check if token is blacklisted
      if (await this.isTokenBlacklisted(token)) {
        logger.warn('Attempted use of blacklisted refresh token');
        return null;
      }

      const verifyOptions: VerifyOptions = {
        algorithms: [this.algorithm],
        issuer: config.appName,
        audience: config.appUrl,
        clockTolerance: 60 // 1 minute clock tolerance for refresh tokens
      };

      const decoded = jwt.verify(token, this.publicKey, verifyOptions) as ExtendedJWTPayload;
      
      if (decoded.type !== 'refresh') {
        logger.warn('Invalid token type for refresh token verification');
        return null;
      }

      // Verify token exists in database and is not expired
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        logger.warn('Refresh token not found or expired in database');
        return null;
      }

      // Verify session still exists
      if (!(await this.isSessionValid(decoded.sessionId))) {
        logger.warn('Session no longer valid for refresh token');
        return null;
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.info('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid refresh token format');
      } else {
        logger.error('Refresh token verification failed:', error);
      }
      return null;
    }
  }

  /**
   * Refresh tokens with automatic rotation
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair | null> {
    const decoded = await this.verifyRefreshToken(refreshToken);
    if (!decoded) {
      return null;
    }

    // Blacklist the old refresh token to prevent reuse
    await this.blacklistToken(refreshToken);
    await this.invalidateRefreshToken(refreshToken);

    // Generate new token pair
    const newTokenPair = await this.generateTokenPair(
      decoded.userId,
      decoded.email,
      decoded.role,
      decoded.deviceId
    );

    // Log token rotation for security audit
    await this.logSecurityEvent('token_refreshed', decoded.userId, {
      oldSessionId: decoded.sessionId,
      newSessionId: newTokenPair.sessionId,
      deviceId: decoded.deviceId
    });

    return newTokenPair;
  }

  /**
   * Store refresh token in database with expiration
   */
  private async storeRefreshToken(userId: string, token: string, sessionId: string, deviceId?: string): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setTime(expiresAt.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days

      await prisma.refreshToken.create({
        data: {
          userId,
          token,
          expiresAt
        }
      });

      logger.debug('Refresh token stored in database', { userId, sessionId });
    } catch (error) {
      logger.error('Failed to store refresh token:', error);
      throw error;
    }
  }

  /**
   * Store session information in Redis
   */
  private async storeSession(sessionId: string, userId: string, email: string, role: string, deviceId?: string): Promise<void> {
    try {
      const sessionInfo: SessionInfo = {
        sessionId,
        userId,
        email,
        role,
        deviceId,
        lastActivity: new Date(),
        createdAt: new Date()
      };

      if (redisClient.isOpen) {
        await redisClient.setEx(
          `session:${sessionId}`,
          7 * 24 * 60 * 60, // 7 days
          JSON.stringify(sessionInfo)
        );
      }

      logger.debug('Session stored in Redis', { sessionId, userId });
    } catch (error) {
      logger.error('Failed to store session in Redis:', error);
      // Continue without Redis session storage
    }
  }

  /**
   * Check if session is valid
   */
  private async isSessionValid(sessionId: string): Promise<boolean> {
    try {
      if (!redisClient.isOpen) {
        return true; // Assume valid if Redis is not available
      }

      const sessionData = await redisClient.get(`session:${sessionId}`);
      return sessionData !== null;
    } catch (error) {
      logger.error('Failed to check session validity:', error);
      return true; // Assume valid on error
    }
  }

  /**
   * Update session activity timestamp
   */
  private async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      if (!redisClient.isOpen) {
        return;
      }

      const sessionData = await redisClient.get(`session:${sessionId}`);
      if (sessionData) {
        const session: SessionInfo = JSON.parse(sessionData);
        session.lastActivity = new Date();
        
        await redisClient.setEx(
          `session:${sessionId}`,
          7 * 24 * 60 * 60,
          JSON.stringify(session)
        );
      }
    } catch (error) {
      logger.error('Failed to update session activity:', error);
    }
  }

  /**
   * Blacklist a token
   */
  async blacklistToken(token: string): Promise<void> {
    try {
      if (!redisClient.isOpen) {
        return;
      }

      // Get token expiration time
      const decoded = jwt.decode(token) as JwtPayload;
      if (!decoded?.exp) {
        return;
      }

      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await redisClient.setEx(`blacklist:${token}`, ttl, 'true');
      }

      logger.debug('Token blacklisted', { tokenId: decoded.jti });
    } catch (error) {
      logger.error('Failed to blacklist token:', error);
    }
  }

  /**
   * Check if token is blacklisted
   */
  private async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      if (!redisClient.isOpen) {
        return false;
      }

      const blacklisted = await redisClient.exists(`blacklist:${token}`);
      return blacklisted === 1;
    } catch (error) {
      logger.error('Failed to check token blacklist:', error);
      return false;
    }
  }

  /**
   * Invalidate refresh token in database
   */
  async invalidateRefreshToken(token: string): Promise<void> {
    try {
      await prisma.refreshToken.deleteMany({
        where: { token }
      });
      logger.debug('Refresh token invalidated in database');
    } catch (error) {
      logger.error('Failed to invalidate refresh token:', error);
    }
  }

  /**
   * Invalidate all user sessions
   */
  async invalidateAllUserSessions(userId: string): Promise<void> {
    try {
      // Delete all refresh tokens for user
      await prisma.refreshToken.deleteMany({
        where: { userId }
      });

      // Remove all user sessions from Redis
      if (redisClient.isOpen) {
        const sessions = await this.getUserSessions(userId);
        for (const session of sessions) {
          await redisClient.del(`session:${session.sessionId}`);
        }
      }

      await this.logSecurityEvent('all_sessions_invalidated', userId);
      logger.info('All user sessions invalidated', { userId });
    } catch (error) {
      logger.error('Failed to invalidate all user sessions:', error);
      throw error;
    }
  }

  /**
   * Get user sessions
   */
  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    try {
      if (!redisClient.isOpen) {
        return [];
      }

      const keys = await redisClient.keys('session:*');
      const sessions: SessionInfo[] = [];

      for (const key of keys) {
        const sessionData = await redisClient.get(key);
        if (sessionData) {
          const session: SessionInfo = JSON.parse(sessionData);
          if (session.userId === userId) {
            sessions.push(session);
          }
        }
      }

      return sessions;
    } catch (error) {
      logger.error('Failed to get user sessions:', error);
      return [];
    }
  }

  /**
   * Enforce concurrent session limits
   */
  private async enforceConcurrentSessionLimits(userId: string): Promise<void> {
    try {
      const sessions = await this.getUserSessions(userId);
      
      if (sessions.length >= this.maxSessionsPerUser) {
        // Remove oldest sessions
        sessions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const sessionsToRemove = sessions.slice(0, sessions.length - this.maxSessionsPerUser + 1);
        
        for (const session of sessionsToRemove) {
          await redisClient.del(`session:${session.sessionId}`);
          // Also blacklist tokens from these sessions
          await this.logSecurityEvent('session_limit_exceeded', userId, {
            removedSessionId: session.sessionId
          });
        }
      }
    } catch (error) {
      logger.error('Failed to enforce session limits:', error);
    }
  }

  /**
   * Get user permissions based on role
   */
  private getUserPermissions(role: 'user' | 'admin'): string[] {
    const permissions = {
      user: [
        'read:own_profile',
        'update:own_profile',
        'create:projects',
        'read:own_projects',
        'update:own_projects',
        'delete:own_projects',
        'create:analyses',
        'read:own_analyses'
      ],
      admin: [
        'read:all_users',
        'update:all_users',
        'delete:users',
        'read:all_projects',
        'update:all_projects',
        'delete:all_projects',
        'read:all_analyses',
        'system:manage',
        'reports:all'
      ]
    };

    return permissions[role] || permissions.user;
  }

  /**
   * Log security events for audit
   */
  private async logSecurityEvent(event: string, userId: string, metadata?: any): Promise<void> {
    try {
      logger.info('Security event', {
        event,
        userId,
        timestamp: new Date().toISOString(),
        ...metadata
      });
    } catch (error) {
      logger.error('Failed to log security event:', error);
    }
  }

  /**
   * Start cleanup process for expired tokens and sessions
   */
  private startCleanupProcess(): void {
    // Clean up expired tokens every hour
    setInterval(async () => {
      try {
        await this.cleanupExpiredTokens();
      } catch (error) {
        logger.error('Token cleanup failed:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Clean up expired refresh tokens and sessions
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      // Remove expired refresh tokens from database
      const deletedTokens = await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      logger.info(`Cleaned up ${deletedTokens.count} expired refresh tokens`);
    } catch (error) {
      logger.error('Failed to cleanup expired tokens:', error);
    }
  }

  /**
   * Get service status and metrics
   */
  async getServiceStatus(): Promise<any> {
    try {
      const totalSessions = redisClient.isOpen ? (await redisClient.keys('session:*')).length : 0;
      const totalRefreshTokens = await prisma.refreshToken.count();
      
      return {
        status: 'healthy',
        algorithm: this.algorithm,
        accessTokenExpiry: this.accessTokenExpiry,
        refreshTokenExpiry: this.refreshTokenExpiry,
        redisConnected: redisClient.isOpen,
        activeSessions: totalSessions,
        activeRefreshTokens: totalRefreshTokens,
        maxSessionsPerUser: this.maxSessionsPerUser
      };
    } catch (error) {
      logger.error('Failed to get service status:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

// Export singleton instance
export const jwtService = new EnhancedJWTService();
export type { ExtendedJWTPayload, TokenPair, SessionInfo }; 