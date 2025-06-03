import jwt, { SignOptions, VerifyOptions, JwtPayload } from 'jsonwebtoken';
import { createPrivateKey, createPublicKey, generateKeyPairSync } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const redisClient = config.redis.url ? createClient({
  url: config.redis.url
}) : null;

interface ExtendedJWTPayload extends JwtPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  tokenId?: string;
  type: 'access' | 'refresh';
  sessionId: string;
  permissions?: string[];
  deviceId?: string;
  ipAddress?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

interface SessionInfo {
  sessionId: string;
  userId: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

class RS256JWTService {
  private privateKey!: string;
  private publicKey!: string;
  private readonly accessTokenExpiry = '15m';
  private readonly refreshTokenExpiry = '7d';
  private readonly algorithm = 'RS256';
  private readonly maxConcurrentSessions = 5;

  constructor() {
    this.initializeKeys();
    this.connectRedis();
  }

  /**
   * Initialize RSA key pair for RS256 algorithm
   */
  private initializeKeys(): void {
    try {
      const keysDir = path.join(__dirname, '../../keys');
      const privateKeyPath = path.join(keysDir, 'private.pem');
      const publicKeyPath = path.join(keysDir, 'public.pem');

      // Ensure keys directory exists
      if (!fs.existsSync(keysDir)) {
        fs.mkdirSync(keysDir, { recursive: true });
      }

      // Check if keys exist, generate if not
      if (!fs.existsSync(privateKeyPath) || !fs.existsSync(publicKeyPath)) {
        logger.info('Generating new RSA key pair for JWT signing...');
        this.generateNewKeyPair();
      } else {
        // Load existing keys
        this.privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        this.publicKey = fs.readFileSync(publicKeyPath, 'utf8');
        logger.info('Loaded existing RSA keys for JWT signing');
      }

      // Validate keys
      this.validateKeys();
    } catch (error) {
      logger.error('Failed to initialize JWT keys:', error);
      throw new Error('JWT key initialization failed');
    }
  }

  /**
   * Generate new RSA key pair
   */
  private generateNewKeyPair(): void {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
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

    // Save keys to files
    const keysDir = path.join(__dirname, '../../keys');
    fs.writeFileSync(path.join(keysDir, 'private.pem'), privateKey, { mode: 0o600 });
    fs.writeFileSync(path.join(keysDir, 'public.pem'), publicKey, { mode: 0o644 });

    logger.info('Generated and saved new RSA key pair');
  }

  /**
   * Validate RSA keys
   */
  private validateKeys(): void {
    try {
      createPrivateKey(this.privateKey);
      createPublicKey(this.publicKey);
      logger.debug('RSA keys validated successfully');
    } catch (error) {
      logger.error('Invalid RSA keys:', error);
      throw new Error('Invalid RSA keys');
    }
  }

  /**
   * Connect to Redis
   */
  private async connectRedis(): Promise<void> {
    try {
      if (!redisClient.isOpen) {
        await redisClient.connect();
        logger.info('Connected to Redis for JWT service');
      }
    } catch (error) {
      logger.warn('Redis connection failed, using fallback mode:', error);
    }
  }

  /**
   * Generate access token with RS256 algorithm
   */
  generateAccessToken(
    userId: string, 
    email: string, 
    role: 'user' | 'admin', 
    sessionId: string, 
    deviceId?: string,
    ipAddress?: string
  ): string {
    const payload: ExtendedJWTPayload = {
      userId,
      email,
      role,
      type: 'access',
      sessionId,
      deviceId,
      ipAddress,
      permissions: this.getUserPermissions(role)
    };

    const signOptions: SignOptions = {
      algorithm: this.algorithm,
      expiresIn: this.accessTokenExpiry,
      issuer: config.appName,
      audience: config.appUrl,
      subject: userId,
      jwtid: uuidv4(),
      notBefore: 0
    };

    return jwt.sign(payload, this.privateKey, signOptions);
  }

  /**
   * Generate refresh token with RS256 algorithm and rotation support
   */
  generateRefreshToken(
    userId: string, 
    email: string, 
    role: 'user' | 'admin', 
    sessionId: string, 
    deviceId?: string,
    ipAddress?: string
  ): string {
    const tokenId = uuidv4();
    const payload: ExtendedJWTPayload = {
      userId,
      email,
      role,
      type: 'refresh',
      sessionId,
      tokenId,
      deviceId,
      ipAddress
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
   * Generate token pair for user
   */
  async generateTokenPair(
    userId: string, 
    email: string, 
    role: 'user' | 'admin', 
    deviceId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<TokenPair> {
    // Create new session
    const sessionId = await this.createSession(userId, deviceId, ipAddress, userAgent);

    const accessToken = this.generateAccessToken(userId, email, role, sessionId, deviceId, ipAddress);
    const refreshToken = this.generateRefreshToken(userId, email, role, sessionId, deviceId, ipAddress);

    // Store refresh token in database
    await this.storeRefreshToken(refreshToken, userId, sessionId);

    return {
      accessToken,
      refreshToken,
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
        clockTolerance: 30
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
        logger.debug('Access token expired');
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
        clockTolerance: 60
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
   * Refresh tokens with rotation
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair | null> {
    const decoded = await this.verifyRefreshToken(refreshToken);
    if (!decoded) return null;

    try {
      // Invalidate old refresh token
      await this.invalidateRefreshToken(refreshToken);

      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true }
      });

      if (!user) {
        logger.warn('User not found during token refresh');
        return null;
      }

      // Generate new token pair
      const newTokens = await this.generateTokenPair(
        decoded.userId,
        decoded.email,
        decoded.role,
        decoded.deviceId,
        decoded.ipAddress
      );

      logger.info('Tokens refreshed successfully', { 
        userId: decoded.userId, 
        sessionId: decoded.sessionId 
      });

      return newTokens;
    } catch (error) {
      logger.error('Token refresh failed:', error);
      return null;
    }
  }

  /**
   * Create user session
   */
  private async createSession(
    userId: string, 
    deviceId?: string, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<string> {
    const sessionId = uuidv4();

    try {
      // Check concurrent session limit
      await this.enforceConcurrentSessionLimit(userId);

      // Store session in Redis
      if (redisClient.isOpen) {
        const sessionData = {
          userId,
          deviceId,
          ipAddress,
          userAgent,
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          isActive: true
        };

        await redisClient.setEx(
          `session:${sessionId}`,
          7 * 24 * 60 * 60, // 7 days
          JSON.stringify(sessionData)
        );

        // Add to user's session list
        await redisClient.sAdd(`user_sessions:${userId}`, sessionId);
      }

      logger.debug('Created new session', { userId, sessionId, deviceId, ipAddress });
      return sessionId;
    } catch (error) {
      logger.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Check if session is valid
   */
  private async isSessionValid(sessionId: string): Promise<boolean> {
    try {
      if (!redisClient.isOpen) return true; // Fallback mode

      const sessionData = await redisClient.get(`session:${sessionId}`);
      if (!sessionData) return false;

      const session = JSON.parse(sessionData);
      return session.isActive === true;
    } catch (error) {
      logger.error('Session validation error:', error);
      return false;
    }
  }

  /**
   * Update session activity
   */
  private async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      if (!redisClient.isOpen) return;

      const sessionData = await redisClient.get(`session:${sessionId}`);
      if (!sessionData) return;

      const session = JSON.parse(sessionData);
      session.lastActivity = new Date().toISOString();

      await redisClient.setEx(
        `session:${sessionId}`,
        7 * 24 * 60 * 60,
        JSON.stringify(session)
      );
    } catch (error) {
      logger.error('Failed to update session activity:', error);
    }
  }

  /**
   * Enforce concurrent session limit
   */
  private async enforceConcurrentSessionLimit(userId: string): Promise<void> {
    try {
      if (!redisClient.isOpen) return;

      const userSessions = await redisClient.sMembers(`user_sessions:${userId}`);
      
      if (userSessions.length >= this.maxConcurrentSessions) {
        // Remove oldest sessions
        const sessionsToRemove = userSessions.slice(0, userSessions.length - this.maxConcurrentSessions + 1);
        
        for (const sessionId of sessionsToRemove) {
          await this.invalidateSession(sessionId);
          await redisClient.sRem(`user_sessions:${userId}`, sessionId);
        }
        
        logger.info('Enforced concurrent session limit', { 
          userId, 
          removedSessions: sessionsToRemove.length 
        });
      }
    } catch (error) {
      logger.error('Failed to enforce session limit:', error);
    }
  }

  /**
   * Store refresh token in database
   */
  private async storeRefreshToken(token: string, userId: string, sessionId: string): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      await prisma.refreshToken.create({
        data: {
          token,
          userId,
          expiresAt
        }
      });

      logger.debug('Stored refresh token', { userId, sessionId });
    } catch (error) {
      logger.error('Failed to store refresh token:', error);
      throw error;
    }
  }

  /**
   * Invalidate refresh token
   */
  private async invalidateRefreshToken(token: string): Promise<void> {
    try {
      await prisma.refreshToken.delete({
        where: { token }
      });
      
      // Add to blacklist in Redis
      if (redisClient.isOpen) {
        await redisClient.setEx(`blacklisted_token:${token}`, 7 * 24 * 60 * 60, 'true');
      }
    } catch (error) {
      logger.error('Failed to invalidate refresh token:', error);
    }
  }

  /**
   * Check if token is blacklisted
   */
  private async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      if (!redisClient.isOpen) return false;

      const blacklisted = await redisClient.get(`blacklisted_token:${token}`);
      return blacklisted === 'true';
    } catch (error) {
      logger.error('Blacklist check failed:', error);
      return false;
    }
  }

  /**
   * Invalidate session
   */
  private async invalidateSession(sessionId: string): Promise<void> {
    try {
      if (redisClient.isOpen) {
        await redisClient.del(`session:${sessionId}`);
      }
      
      logger.debug('Invalidated session', { sessionId });
    } catch (error) {
      logger.error('Failed to invalidate session:', error);
    }
  }

  /**
   * Blacklist access token
   */
  async blacklistToken(token: string): Promise<void> {
    try {
      if (redisClient.isOpen) {
        await redisClient.setEx(`blacklisted_token:${token}`, 15 * 60, 'true'); // 15 minutes
      }
      
      logger.debug('Blacklisted access token');
    } catch (error) {
      logger.error('Failed to blacklist token:', error);
    }
  }

  /**
   * Logout user from specific session
   */
  async logout(userId: string, sessionId: string, accessToken?: string): Promise<void> {
    try {
      // Invalidate session
      await this.invalidateSession(sessionId);

      // Remove from user's session list
      if (redisClient.isOpen) {
        await redisClient.sRem(`user_sessions:${userId}`, sessionId);
      }

      // Invalidate all refresh tokens for this session
      await prisma.refreshToken.deleteMany({
        where: { userId }
      });

      // Blacklist current access token if provided
      if (accessToken) {
        await this.blacklistToken(accessToken);
      }

      logger.info('User logged out successfully', { userId, sessionId });
    } catch (error) {
      logger.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Logout user from all sessions
   */
  async logoutAllSessions(userId: string): Promise<void> {
    try {
      // Get all user sessions
      if (redisClient.isOpen) {
        const userSessions = await redisClient.sMembers(`user_sessions:${userId}`);
        
        // Invalidate all sessions
        for (const sessionId of userSessions) {
          await this.invalidateSession(sessionId);
        }

        // Clear user's session list
        await redisClient.del(`user_sessions:${userId}`);
      }

      // Delete all refresh tokens
      await prisma.refreshToken.deleteMany({
        where: { userId }
      });

      logger.info('User logged out from all sessions', { userId });
    } catch (error) {
      logger.error('Failed to logout all sessions:', error);
      throw error;
    }
  }

  /**
   * Get user permissions based on role
   */
  private getUserPermissions(role: 'user' | 'admin'): string[] {
    const basePermissions = [
      'read:profile',
      'update:profile',
      'create:project',
      'read:project',
      'update:project',
      'delete:project',
      'create:analysis',
      'read:analysis'
    ];

    const adminPermissions = [
      ...basePermissions,
      'read:users',
      'update:users',
      'delete:users',
      'read:system',
      'update:system',
      'read:analytics',
      'manage:billing'
    ];

    return role === 'admin' ? adminPermissions : basePermissions;
  }

  /**
   * Get user sessions
   */
  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    try {
      if (!redisClient.isOpen) return [];

      const sessionIds = await redisClient.sMembers(`user_sessions:${userId}`);
      const sessions: SessionInfo[] = [];

      for (const sessionId of sessionIds) {
        const sessionData = await redisClient.get(`session:${sessionId}`);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          sessions.push({
            sessionId,
            userId: session.userId,
            deviceId: session.deviceId,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            createdAt: new Date(session.createdAt),
            lastActivity: new Date(session.lastActivity),
            isActive: session.isActive
          });
        }
      }

      return sessions.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
    } catch (error) {
      logger.error('Failed to get user sessions:', error);
      return [];
    }
  }

  /**
   * Get service status
   */
  async getServiceStatus(): Promise<any> {
    try {
      const redisConnected = redisClient.isOpen;
      const dbConnected = await prisma.$queryRaw`SELECT 1`;

      return {
        status: 'operational',
        algorithm: this.algorithm,
        accessTokenExpiry: this.accessTokenExpiry,
        refreshTokenExpiry: this.refreshTokenExpiry,
        redisConnected,
        dbConnected: !!dbConnected,
        maxConcurrentSessions: this.maxConcurrentSessions,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Service status check failed:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Cleanup expired tokens and sessions
   */
  async cleanup(): Promise<void> {
    try {
      // Remove expired refresh tokens from database
      await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      logger.info('Token cleanup completed');
    } catch (error) {
      logger.error('Token cleanup failed:', error);
    }
  }
}

export const jwtService = new RS256JWTService();
export { RS256JWTService };
export type { ExtendedJWTPayload, TokenPair, SessionInfo }; 