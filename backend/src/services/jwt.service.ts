import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { generateKeyPairSync } from 'crypto';
import { config } from '../config/config';

const prisma = new PrismaClient();
const redisClient = config.redis.url ? createClient({
  url: config.redis.url
}) : null;

// Helper function to safely call Redis operations
const safeRedisCall = async <T>(operation: () => Promise<T>, fallback?: T): Promise<T | undefined> => {
  if (!redisClient) return fallback;
  try {
    return await operation();
  } catch (error) {
    console.warn('Redis operation failed:', error);
    return fallback;
  }
};

interface JWTPayload {
  userId: string;
  email: string;
  tokenId?: string;
  type: 'access' | 'refresh';
  sessionId?: string;
  iat?: number;
  exp?: number;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

class JWTService {
  private privateKey!: string;
  private publicKey!: string;
  private readonly accessTokenExpiry = '15m';
  private readonly refreshTokenExpiry = '7d';
  private readonly algorithm = 'RS256';

  constructor() {
    this.initializeKeys();
    this.connectRedis();
  }

  /**
   * Initialize RS256 key pair for JWT signing/verification
   */
  private initializeKeys(): void {
    // Check if keys exist in environment variables
    if (process.env.JWT_PRIVATE_KEY && process.env.JWT_PUBLIC_KEY) {
      this.privateKey = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
      this.publicKey = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n');
    } else {
      // Generate new key pair for development
      console.warn('JWT keys not found in environment, generating new ones for development');
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
      
      console.log('Generated JWT Keys (save these to environment variables):');
      console.log('JWT_PRIVATE_KEY=', JSON.stringify(privateKey));
      console.log('JWT_PUBLIC_KEY=', JSON.stringify(publicKey));
    }
  }

  /**
   * Connect to Redis for token blacklisting and session management
   */
  private async connectRedis(): Promise<void> {
    try {
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
    } catch (error) {
      console.error('Redis connection failed:', error);
    }
  }

  /**
   * Generate access token with RS256 algorithm
   */
  generateAccessToken(userId: string, email: string, sessionId: string): string {
    const payload: JWTPayload = {
      userId,
      email,
      type: 'access',
      sessionId
    };

    const signOptions: SignOptions = {
      algorithm: this.algorithm,
      expiresIn: this.accessTokenExpiry,
      issuer: config.appName,
      audience: config.appUrl,
      subject: userId,
      jwtid: uuidv4()
    };

    return jwt.sign(payload, this.privateKey, signOptions);
  }

  /**
   * Generate refresh token with RS256 algorithm
   */
  generateRefreshToken(userId: string, email: string, sessionId: string): string {
    const tokenId = uuidv4();
    const payload: JWTPayload = {
      userId,
      email,
      type: 'refresh',
      sessionId,
      tokenId
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
   * Generate token pair with session management
   */
  async generateTokenPair(userId: string, email: string): Promise<TokenPair> {
    const sessionId = uuidv4();
    const accessToken = this.generateAccessToken(userId, email, sessionId);
    const refreshToken = this.generateRefreshToken(userId, email, sessionId);

    // Store refresh token in database with rotation
    await this.storeRefreshToken(userId, refreshToken, sessionId);

    // Store session in Redis for quick access
    await this.storeSession(sessionId, userId, email);

    return {
      accessToken,
      refreshToken,
      sessionId
    };
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<JWTPayload | null> {
    try {
      // Check if token is blacklisted
      if (await this.isTokenBlacklisted(token)) {
        return null;
      }

      const verifyOptions: VerifyOptions = {
        algorithms: [this.algorithm],
        issuer: config.appName,
        audience: config.appUrl
      };

      const decoded = jwt.verify(token, this.publicKey, verifyOptions) as JWTPayload;
      
      if (decoded.type !== 'access') {
        return null;
      }

      // Verify session still exists
      if (decoded.sessionId && !(await this.isSessionValid(decoded.sessionId))) {
        return null;
      }

      return decoded;
    } catch (error) {
      console.error('Access token verification failed:', error);
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<JWTPayload | null> {
    try {
      // Check if token is blacklisted
      if (await this.isTokenBlacklisted(token)) {
        return null;
      }

      const verifyOptions: VerifyOptions = {
        algorithms: [this.algorithm],
        issuer: config.appName,
        audience: config.appUrl
      };

      const decoded = jwt.verify(token, this.publicKey, verifyOptions) as JWTPayload;
      
      if (decoded.type !== 'refresh') {
        return null;
      }

      // Verify token exists in database and is not expired
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        return null;
      }

      return decoded;
    } catch (error) {
      console.error('Refresh token verification failed:', error);
      return null;
    }
  }

  /**
   * Refresh access token with token rotation
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair | null> {
    const decoded = await this.verifyRefreshToken(refreshToken);
    if (!decoded) {
      return null;
    }

    // Invalidate old refresh token (rotation)
    await this.invalidateRefreshToken(refreshToken);

    // Generate new token pair
    return this.generateTokenPair(decoded.userId, decoded.email);
  }

  /**
   * Store refresh token in database
   */
  private async storeRefreshToken(userId: string, token: string, sessionId: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt
      }
    });
  }

  /**
   * Store session in Redis
   */
  private async storeSession(sessionId: string, userId: string, email: string): Promise<void> {
    try {
      const sessionData = {
        userId,
        email,
        createdAt: new Date().toISOString()
      };

      await redisClient.setEx(
        `session:${sessionId}`,
        7 * 24 * 60 * 60, // 7 days in seconds
        JSON.stringify(sessionData)
      );
    } catch (error) {
      console.error('Failed to store session:', error);
    }
  }

  /**
   * Check if session is valid
   */
  private async isSessionValid(sessionId: string): Promise<boolean> {
    try {
      const session = await redisClient.get(`session:${sessionId}`);
      return session !== null;
    } catch (error) {
      console.error('Failed to check session validity:', error);
      return false;
    }
  }

  /**
   * Blacklist token
   */
  async blacklistToken(token: string): Promise<void> {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await redisClient.setEx(`blacklist:${token}`, ttl, 'true');
        }
      }
    } catch (error) {
      console.error('Failed to blacklist token:', error);
    }
  }

  /**
   * Check if token is blacklisted
   */
  private async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const blacklisted = await redisClient.get(`blacklist:${token}`);
      return blacklisted === 'true';
    } catch (error) {
      console.error('Failed to check token blacklist:', error);
      return false;
    }
  }

  /**
   * Invalidate refresh token
   */
  async invalidateRefreshToken(token: string): Promise<void> {
    try {
      await prisma.refreshToken.delete({
        where: { token }
      });
      await this.blacklistToken(token);
    } catch (error) {
      console.error('Failed to invalidate refresh token:', error);
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
      const sessions = await redisClient.keys(`session:*`);
      for (const sessionKey of sessions) {
        const sessionData = await redisClient.get(sessionKey);
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          if (parsed.userId === userId) {
            await redisClient.del(sessionKey);
          }
        }
      }
    } catch (error) {
      console.error('Failed to invalidate all user sessions:', error);
    }
  }

  /**
   * Cleanup expired tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
    } catch (error) {
      console.error('Failed to cleanup expired tokens:', error);
    }
  }

  /**
   * Get user session count (for concurrent session limiting)
   */
  async getUserSessionCount(userId: string): Promise<number> {
    try {
      const count = await prisma.refreshToken.count({
        where: { userId }
      });
      return count;
    } catch (error) {
      console.error('Failed to get user session count:', error);
      return 0;
    }
  }
}

export const jwtService = new JWTService();
export { JWTService };
export type { JWTPayload, TokenPair }; 