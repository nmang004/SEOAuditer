import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { logger } from '../../utils/logger';
import { jwtService } from '../../services/jwt-rs256.service';
import { PrismaClient } from '@prisma/client';
import { JobProgress } from '../queue/EnhancedQueueAdapter';
import { redisConfig } from '../../config/config';

const prisma = new PrismaClient();

export interface EnhancedAnalysisProgress extends JobProgress {
  jobId: string;
  userId: string;
  timestamp: Date;
  estimatedTimeRemaining?: number;
  queuePosition?: number;
  currentStep?: string;
  totalSteps?: number;
  stepProgress?: number;
  processingTime?: number;
}

export interface AnalysisEvent {
  type: 'progress' | 'completed' | 'failed' | 'cancelled' | 'error' | 'success' | 'status_update' | 'queue_update' | 'step_change';
  jobId: string;
  userId: string;
  data: any;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SocketSession {
  socketId: string;
  userId: string;
  sessionId: string;
  connectedAt: Date;
  lastActivity: Date;
  subscriptions: Set<string>;
  deviceInfo?: {
    userAgent: string;
    ip: string;
    deviceId?: string;
  };
}

export interface ConnectionStats {
  totalConnections: number;
  authenticatedConnections: number;
  activeSubscriptions: number;
  rooms: Record<string, number>;
  serverLoad: {
    cpuUsage: number;
    memoryUsage: number;
    activeJobs: number;
  };
}

export class EnhancedWebSocketGateway {
  private io: SocketIOServer | null = null;
  private redisClient: any;
  private pubClient: any;
  private subClient: any;
  private sessions = new Map<string, SocketSession>();
  private userSockets = new Map<string, Set<string>>();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private connectionThrottle = new Map<string, number>();
  private rateLimiters = new Map<string, { count: number; lastReset: number }>();
  private progressThrottle = new Map<string, number>();

  constructor() {
    // Delay Redis initialization to avoid early connection attempts
  }

  private async initializeRedisClients(): Promise<void> {
    try {
      // Check if Redis URL is available and valid
      const redisUrl = redisConfig.url;
      
      if (!redisUrl || redisConfig.isOptional) {
        logger.warn('Redis URL not configured or Redis is optional - skipping Redis adapter');
        return;
      }
      
      logger.info(`Attempting to connect to Redis: ${redisUrl.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@')}`);
      
      this.redisClient = createClient({ 
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              logger.warn('Redis connection failed after 3 retries, giving up');
              return false; // Stop retrying
            }
            return Math.min(retries * 100, 1000);
          }
        }
      });
      this.pubClient = createClient({ 
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              return false;
            }
            return Math.min(retries * 100, 1000);
          }
        }
      });
      this.subClient = this.pubClient.duplicate();

      // Add error handlers
      this.redisClient.on('error', (err: Error) => {
        logger.warn('Redis client error (WebSocket):', err.message);
      });

      this.pubClient.on('error', (err: Error) => {
        logger.warn('Redis pub client error (WebSocket):', err.message);
      });

      this.subClient.on('error', (err: Error) => {
        logger.warn('Redis sub client error (WebSocket):', err.message);
      });

      await Promise.all([
        this.redisClient.connect(),
        this.pubClient.connect(),
        this.subClient.connect()
      ]);

      logger.info('Redis clients initialized for WebSocket gateway');
    } catch (error) {
      logger.warn('Failed to initialize Redis clients for WebSocket:', error);
      // Clear any partial connections
      this.redisClient = null;
      this.pubClient = null;
      this.subClient = null;
      logger.info('WebSocket gateway will run without Redis adapter (no horizontal scaling)');
    }
  }

  async initialize(httpServer: HttpServer): Promise<void> {
    try {
      // Initialize Redis clients if not already done
      if (!this.redisClient && !this.pubClient && !this.subClient) {
        await this.initializeRedisClients();
      }
      
      this.io = new SocketIOServer(httpServer, {
        cors: {
          origin: process.env.FRONTEND_URL || "http://localhost:3000",
          methods: ["GET", "POST"],
          credentials: true,
        },
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000,
        upgradeTimeout: 10000,
        allowUpgrades: true,
        maxHttpBufferSize: 1e6, // 1MB
        connectionStateRecovery: {
          maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
          skipMiddlewares: true,
        },
        connectTimeout: 45000,
        serveClient: false,
      });

      // Use Redis adapter for scaling if available
      if (this.pubClient && this.subClient) {
        this.io.adapter(createAdapter(this.pubClient, this.subClient));
        logger.info('Redis adapter configured for Socket.IO');
      } else {
        logger.info('Socket.IO running without Redis adapter (single instance mode)');
      }

      this.setupEventHandlers();
      this.startHeartbeat();
      this.startMetricsCollection();

      logger.info('Enhanced WebSocket Gateway initialized');
    } catch (error) {
      logger.error('Failed to initialize WebSocket gateway:', error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    // Connection middleware for authentication and rate limiting
    this.io.use(async (socket, next) => {
      try {
        const ip = socket.handshake.address;
        
        // Rate limiting by IP (max 10 connections per minute)
        if (this.isRateLimited(ip)) {
          logger.warn(`Connection rate limited from IP: ${ip}`);
          return next(new Error('Rate limit exceeded'));
        }

        // Connection throttling (max 5 concurrent connections per IP)
        if (this.isConnectionThrottled(ip)) {
          logger.warn(`Connection throttled from IP: ${ip}`);
          return next(new Error('Too many connections from this IP'));
        }

        next();
      } catch (error) {
        logger.error('Connection middleware error:', error);
        next(new Error('Connection rejected'));
      }
    });

    this.io.on('connection', (socket) => {
      const ip = socket.handshake.address;
      logger.debug(`Client connected: ${socket.id} from ${ip}`);
      this.handleConnection(socket);
    });

    // Global error handler
    this.io.on('error', (error) => {
      logger.error('WebSocket server error:', error);
    });
  }

  private async handleConnection(socket: Socket): Promise<void> {
    const ip = socket.handshake.address;
    
    // Connection timeout (30 seconds to authenticate)
    const connectionTimeout = setTimeout(() => {
      if (!this.sessions.has(socket.id)) {
        logger.warn(`Connection timeout for socket ${socket.id}`);
        socket.emit('connection_timeout', { message: 'Authentication timeout' });
        socket.disconnect(true);
      }
    }, 30000);

    // Authentication handler
    socket.on('authenticate', async (data: { token: string; deviceId?: string }) => {
      try {
        clearTimeout(connectionTimeout);
        
        if (!data.token) {
          socket.emit('authentication_error', { error: 'Token is required' });
          return;
        }

        // Verify JWT token
        const decoded = await jwtService.verifyAccessToken(data.token);
        if (!decoded) {
          socket.emit('authentication_error', { error: 'Invalid token' });
          return;
        }

        // Get user from database
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, name: true, emailVerified: true }
        });

        if (!user || !user.emailVerified) {
          socket.emit('authentication_error', { error: 'User not found or not verified' });
          return;
        }

        // Create session
        const session: SocketSession = {
          socketId: socket.id,
          userId: user.id,
          sessionId: decoded.sessionId,
          connectedAt: new Date(),
          lastActivity: new Date(),
          subscriptions: new Set(),
          deviceInfo: {
            userAgent: socket.handshake.headers['user-agent'] || '',
            ip,
            deviceId: data.deviceId
          }
        };

        this.sessions.set(socket.id, session);
        
        // Track user sockets
        if (!this.userSockets.has(user.id)) {
          this.userSockets.set(user.id, new Set());
        }
        this.userSockets.get(user.id)!.add(socket.id);

        // Join user-specific room
        await socket.join(`user:${user.id}`);
        
        socket.emit('authenticated', { 
          success: true, 
          userId: user.id,
          serverTime: new Date().toISOString(),
          connectionId: socket.id
        });
        
        logger.info(`Socket ${socket.id} authenticated as user ${user.id}`);

        // Setup authenticated event handlers
        this.setupAuthenticatedHandlers(socket, session);

      } catch (error) {
        logger.error('Authentication error:', error);
        socket.emit('authentication_error', { error: 'Authentication failed' });
      }
    });

    // Handle immediate disconnect
    socket.on('disconnect', (reason) => {
      clearTimeout(connectionTimeout);
      this.handleDisconnect(socket, reason);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });

    // Send welcome message
    socket.emit('welcome', { 
      message: 'Connected to SEO Analysis Server',
      serverTime: new Date().toISOString(),
      connectionId: socket.id
    });
  }

  private setupAuthenticatedHandlers(socket: Socket, session: SocketSession): void {
    // Subscribe to analysis job
    socket.on('subscribe_analysis', async (data: { jobId: string }) => {
      try {
        if (!data.jobId) {
          socket.emit('error', { message: 'Job ID is required' });
          return;
        }

        // Verify user owns this analysis
        const crawlSession = await prisma.crawlSession.findFirst({
          where: { id: data.jobId },
          include: { project: true }
        });

        if (!crawlSession || crawlSession.project.userId !== session.userId) {
          socket.emit('error', { message: 'Analysis not found or unauthorized' });
          return;
        }

        // Join job-specific room
        await socket.join(`analysis:${data.jobId}`);
        session.subscriptions.add(data.jobId);
        
        socket.emit('subscribed', { jobId: data.jobId });
        logger.debug(`Socket ${socket.id} subscribed to analysis ${data.jobId}`);

        // Send current status if available
        await this.sendCurrentAnalysisStatus(socket, data.jobId);

      } catch (error) {
        logger.error('Subscription error:', error);
        socket.emit('error', { message: 'Subscription failed' });
      }
    });

    // Unsubscribe from analysis job
    socket.on('unsubscribe_analysis', (data: { jobId: string }) => {
      if (session.subscriptions.has(data.jobId)) {
        socket.leave(`analysis:${data.jobId}`);
        session.subscriptions.delete(data.jobId);
        socket.emit('unsubscribed', { jobId: data.jobId });
        logger.debug(`Socket ${socket.id} unsubscribed from analysis ${data.jobId}`);
      }
    });

    // Heartbeat/ping handling
    socket.on('ping', () => {
      session.lastActivity = new Date();
      socket.emit('pong', { 
        timestamp: Date.now(),
        serverTime: new Date().toISOString(),
        connectionId: socket.id
      });
    });

    // Get analysis status on demand
    socket.on('get_analysis_status', async (data: { jobId: string }) => {
      try {
        await this.sendCurrentAnalysisStatus(socket, data.jobId);
      } catch (error) {
        socket.emit('error', { message: 'Failed to get analysis status' });
      }
    });

    // Update last activity on any message
    socket.onAny(() => {
      session.lastActivity = new Date();
    });
  }

  private async sendCurrentAnalysisStatus(socket: Socket, jobId: string): Promise<void> {
    try {
      // Get cached progress from Redis
      if (this.redisClient) {
        const cached = await this.redisClient.get(`analysis:progress:${jobId}`);
        if (cached) {
          const progress = JSON.parse(cached);
          socket.emit('analysis_status', progress);
          return;
        }
      }

      // Fallback to database
      const crawlSession = await prisma.crawlSession.findUnique({
        where: { id: jobId },
        select: {
          status: true,
          startedAt: true,
          completedAt: true,
          errorMessage: true
        }
      });

      if (crawlSession) {
        socket.emit('analysis_status', {
          jobId,
          stage: crawlSession.status,
          timestamp: new Date(),
          startedAt: crawlSession.startedAt,
          completedAt: crawlSession.completedAt,
          error: crawlSession.errorMessage
        });
      }
    } catch (error) {
      logger.error('Error sending analysis status:', error);
    }
  }

  private handleDisconnect(socket: Socket, reason: string): void {
    const session = this.sessions.get(socket.id);
    if (session) {
      // Remove from user sockets
      const userSocketSet = this.userSockets.get(session.userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(session.userId);
        }
      }

      this.sessions.delete(socket.id);
      logger.debug(`Socket ${socket.id} disconnected (user: ${session.userId}): ${reason}`);
    }
  }

  // Enhanced progress emission with throttling
  emitProgress(jobId: string, progress: EnhancedAnalysisProgress): void {
    if (!this.io) {
      logger.warn('WebSocket server not initialized');
      return;
    }

    // Throttle progress updates (max 1 per second per job)
    const now = Date.now();
    const lastUpdate = this.progressThrottle.get(jobId);
    if (lastUpdate && now - lastUpdate < 1000) {
      return; // Skip this update
    }
    this.progressThrottle.set(jobId, now);

    const enhancedProgress: EnhancedAnalysisProgress = {
      ...progress,
      timestamp: new Date(),
    };

    // Emit to job-specific room
    this.io.to(`analysis:${jobId}`).emit('analysis_progress', enhancedProgress);
    
    // Emit to user-specific room
    if (progress.userId) {
      this.io.to(`user:${progress.userId}`).emit('analysis_progress', enhancedProgress);
    }

    // Cache progress in Redis
    this.cacheProgressUpdate(jobId, enhancedProgress);
    
    logger.debug(`Emitted progress for job ${jobId}: ${progress.percentage}% - ${progress.stage}`);
  }

  emitStepChange(jobId: string, stepData: {
    currentStep: string;
    totalSteps: number;
    stepNumber: number;
    stepProgress: number;
    details: string;
  }): void {
    if (!this.io) return;

    const event: AnalysisEvent = {
      type: 'step_change',
      jobId,
      userId: '', // Will be filled by the caller
      data: stepData,
      timestamp: new Date()
    };

    this.io.to(`analysis:${jobId}`).emit('analysis_step_change', event);
  }

  emitQueueUpdate(jobId: string, position: number, estimatedWaitTime?: number): void {
    if (!this.io) return;

    const update = {
      jobId,
      position,
      estimatedWaitTime,
      timestamp: new Date()
    };

    this.io.to(`analysis:${jobId}`).emit('queue_update', update);
  }

  emitCompleted(jobId: string, result: any): void {
    if (!this.io) return;

    const event: AnalysisEvent = {
      type: 'completed',
      jobId,
      userId: result.userId || '',
      data: result,
      timestamp: new Date()
    };

    this.io.to(`analysis:${jobId}`).emit('analysis_completed', event);
    
    if (result.userId) {
      this.io.to(`user:${result.userId}`).emit('analysis_completed', event);
    }

    logger.info(`Analysis ${jobId} completed and broadcasted`);
  }

  emitError(jobId: string, error: string | Error): void {
    if (!this.io) return;

    const errorMessage = error instanceof Error ? error.message : error;
    const event: AnalysisEvent = {
      type: 'error',
      jobId,
      userId: '', // Will be filled by context
      data: { message: errorMessage, error: errorMessage },
      timestamp: new Date()
    };

    this.io.to(`analysis:${jobId}`).emit('analysis_error', event);
    logger.error(`Emitted error for job ${jobId}: ${errorMessage}`);
  }

  emitSystemNotification(userId: string, notification: {
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    data?: any;
  }): void {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('system_notification', {
      ...notification,
      timestamp: new Date(),
      id: Math.random().toString(36).substr(2, 9)
    });
  }

  private async cacheProgressUpdate(jobId: string, progress: EnhancedAnalysisProgress): Promise<void> {
    if (!this.redisClient) return;

    try {
      await this.redisClient.setex(
        `analysis:progress:${jobId}`,
        3600, // 1 hour TTL
        JSON.stringify(progress)
      );
    } catch (error) {
      logger.warn('Failed to cache progress update:', error);
    }
  }

  private isRateLimited(ip: string): boolean {
    const now = Date.now();
    const limiter = this.rateLimiters.get(ip);
    
    if (!limiter || now - limiter.lastReset > 60000) {
      // Reset counter every minute
      this.rateLimiters.set(ip, { count: 1, lastReset: now });
      return false;
    }
    
    limiter.count++;
    return limiter.count > 10; // Max 10 connections per minute
  }

  private isConnectionThrottled(ip: string): boolean {
    const now = Date.now();
    const count = this.connectionThrottle.get(ip) || 0;
    
    // Clean up old entries
    if (now % 10000 === 0) { // Every 10 seconds
      this.cleanupThrottleMaps();
    }
    
    this.connectionThrottle.set(ip, count + 1);
    return count >= 5; // Max 5 concurrent connections per IP
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const staleThreshold = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes

      // Clean up stale sessions
      this.sessions.forEach((session, socketId) => {
        if (session.lastActivity < staleThreshold) {
          const socket = this.io?.sockets.sockets.get(socketId);
          if (socket) {
            socket.disconnect(true);
          }
          this.sessions.delete(socketId);
        }
      });
    }, 30000); // Every 30 seconds
  }

  private startMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.metricsInterval = setInterval(() => {
      const stats = this.getConnectionStats();
      this.emitSystemMetrics(stats);
    }, 60000); // Every minute
  }

  private cleanupThrottleMaps(): void {
    const now = Date.now();
    const threshold = now - 300000; // 5 minutes

    // Clean up connection throttle
    this.connectionThrottle.forEach((timestamp, ip) => {
      if (timestamp < threshold) {
        this.connectionThrottle.delete(ip);
      }
    });

    // Clean up rate limiters
    this.rateLimiters.forEach((limiter, ip) => {
      if (limiter.lastReset < threshold) {
        this.rateLimiters.delete(ip);
      }
    });

    // Clean up progress throttle
    this.progressThrottle.forEach((timestamp, jobId) => {
      if (timestamp < threshold) {
        this.progressThrottle.delete(jobId);
      }
    });
  }

  getConnectionStats(): ConnectionStats {
    if (!this.io) {
      return {
        totalConnections: 0,
        authenticatedConnections: 0,
        activeSubscriptions: 0,
        rooms: {},
        serverLoad: { cpuUsage: 0, memoryUsage: 0, activeJobs: 0 }
      };
    }

    const rooms: Record<string, number> = {};
    this.io.sockets.adapter.rooms.forEach((room, roomName) => {
      if (roomName.startsWith('user:') || roomName.startsWith('analysis:')) {
        rooms[roomName] = room.size;
      }
    });

    const memUsage = process.memoryUsage();
    
    return {
      totalConnections: this.io.sockets.sockets.size,
      authenticatedConnections: this.sessions.size,
      activeSubscriptions: Array.from(this.sessions.values())
        .reduce((acc, session) => acc + session.subscriptions.size, 0),
      rooms,
      serverLoad: {
        cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
        memoryUsage: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        activeJobs: Object.keys(rooms).filter(r => r.startsWith('analysis:')).length
      }
    };
  }

  private emitSystemMetrics(stats: ConnectionStats): void {
    if (!this.io) return;

    // Emit to all authenticated users (admins only in real implementation)
    this.io.emit('system_metrics', {
      timestamp: new Date(),
      ...stats
    });
  }

  isHealthy(): boolean {
    return this.io !== null && this.io.sockets !== undefined;
  }

  async shutdown(): Promise<void> {
    if (!this.io) {
      logger.info('WebSocket server not initialized, skipping shutdown');
      return;
    }

    logger.info('Shutting down Enhanced WebSocket Gateway...');

    // Clear intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    // Notify all connected clients
    this.io.emit('server_shutdown', {
      message: 'Server is shutting down',
      timestamp: new Date()
    });

    // Wait briefly for messages to be sent
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Disconnect all clients
    this.io.sockets.sockets.forEach((socket) => {
      socket.disconnect(true);
    });

    // Close Redis connections
    try {
      if (this.redisClient) await this.redisClient.disconnect();
      if (this.pubClient) await this.pubClient.disconnect();
      if (this.subClient) await this.subClient.disconnect();
    } catch (error) {
      logger.warn('Error closing Redis connections:', error);
    }

    // Close Socket.IO server
    this.io.close();
    this.io = null;

    // Clear maps
    this.sessions.clear();
    this.userSockets.clear();
    this.connectionThrottle.clear();
    this.rateLimiters.clear();
    this.progressThrottle.clear();

    logger.info('Enhanced WebSocket Gateway shutdown completed');
  }
}

// Export singleton instance
export const enhancedWebSocketGateway = new EnhancedWebSocketGateway(); 