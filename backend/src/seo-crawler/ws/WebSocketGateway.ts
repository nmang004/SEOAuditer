import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../../utils/logger';
import { JobProgress } from '../queue/EnhancedQueueAdapter';

export interface AnalysisProgress extends JobProgress {
  jobId: string;
  timestamp: Date;
}

export interface AnalysisEvent {
  type: 'progress' | 'completed' | 'failed' | 'cancelled' | 'error' | 'success' | 'status_update' | 'queue_update';
  jobId: string;
  data: any;
  timestamp: Date;
}

export class WebSocketGateway {
  private io: SocketIOServer | null = null;
  private connectedClients = new Map<string, string>(); // socketId -> userId

  constructor() {
    // Initialize will be called when HTTP server is available
  }

  /**
   * Initialize the WebSocket server (now async for proper initialization)
   */
  async initialize(httpServer: HttpServer): Promise<void> {
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
    });

    this.setupEventHandlers();
    await this.waitForInitialization();
    logger.info('WebSocket Gateway initialized');
  }

  private async waitForInitialization(): Promise<void> {
    return new Promise((resolve) => {
      if (this.io) {
        // Wait a brief moment for the server to be ready
        setTimeout(resolve, 100);
      } else {
        resolve();
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      logger.debug(`Client connected: ${socket.id}`);

      // Handle authentication
      socket.on('authenticate', (data: { userId: string; token?: string }) => {
        try {
          // In a real implementation, verify the token here
          // For now, we'll just store the userId
          this.connectedClients.set(socket.id, data.userId);
          
          // Join user-specific room
          socket.join(`user:${data.userId}`);
          
          socket.emit('authenticated', { success: true });
          logger.debug(`Client ${socket.id} authenticated as user ${data.userId}`);
        } catch (error) {
          socket.emit('authentication_error', { error: 'Invalid authentication' });
          logger.warn(`Authentication failed for client ${socket.id}`);
        }
      });

      // Handle subscription to specific analysis job
      socket.on('subscribe_analysis', (data: { jobId: string }) => {
        const userId = this.connectedClients.get(socket.id);
        if (!userId) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }

        // Join job-specific room
        socket.join(`analysis:${data.jobId}`);
        socket.emit('subscribed', { jobId: data.jobId });
        logger.debug(`Client ${socket.id} subscribed to analysis ${data.jobId}`);
      });

      // Handle unsubscription from analysis job
      socket.on('unsubscribe_analysis', (data: { jobId: string }) => {
        socket.leave(`analysis:${data.jobId}`);
        socket.emit('unsubscribed', { jobId: data.jobId });
        logger.debug(`Client ${socket.id} unsubscribed from analysis ${data.jobId}`);
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      socket.on('disconnect', (reason) => {
        const userId = this.connectedClients.get(socket.id);
        this.connectedClients.delete(socket.id);
        logger.debug(`Client ${socket.id} disconnected (user: ${userId}): ${reason}`);
      });

      socket.on('error', (error) => {
        logger.error(`Socket error for client ${socket.id}:`, error);
      });
    });

    // Global error handler
    this.io.on('error', (error) => {
      logger.error('WebSocket server error:', error);
    });
  }

  /**
   * Emit progress update for a specific analysis job
   */
  emitProgress(jobId: string, progress: JobProgress): void {
    if (!this.io) {
      logger.warn('WebSocket server not initialized');
      return;
    }

    const enhancedProgress: AnalysisProgress = {
      ...progress,
      jobId,
      timestamp: new Date(),
    };

    // Emit to job-specific room
    this.io.to(`analysis:${jobId}`).emit('analysis_progress', enhancedProgress);
    
    // Also emit to all connected clients for dashboard updates if it's a significant milestone
    if (progress.percentage % 25 === 0 || progress.stage === 'completed' || progress.stage === 'failed') {
      this.io.emit('global_analysis_progress', {
        jobId,
        stage: progress.stage,
        percentage: progress.percentage,
        timestamp: new Date(),
      });
    }
    
    logger.debug(`Emitted progress for job ${jobId}: ${progress.percentage}% - ${progress.stage}`);
  }

  /**
   * Emit completion event for an analysis job
   */
  emitCompleted(jobId: string, result: any): void {
    this.emitEvent('completed', jobId, result);
    logger.info(`Analysis ${jobId} completed successfully`);
  }

  /**
   * Emit success event for an analysis job (enhanced completion)
   */
  emitSuccess(jobId: string, data: { 
    message: string; 
    score?: number; 
    duration?: number;
    [key: string]: any;
  }): void {
    const successData = {
      ...data,
      timestamp: new Date(),
    };
    
    this.emitEvent('success', jobId, successData);
    logger.info(`Analysis ${jobId} succeeded: ${data.message}`);
  }

  /**
   * Emit analysis status update
   */
  emitStatusUpdate(jobId: string, status: string, details?: string): void {
    const statusData = {
      status,
      details,
      timestamp: new Date(),
    };
    
    this.emitEvent('status_update', jobId, statusData);
    logger.debug(`Analysis ${jobId} status update: ${status}`);
  }

  /**
   * Emit queue position update
   */
  emitQueueUpdate(jobId: string, position: number, estimatedWaitTime?: number): void {
    const queueData = {
      position,
      estimatedWaitTime,
      timestamp: new Date(),
    };
    
    this.emitEvent('queue_update', jobId, queueData);
    logger.debug(`Analysis ${jobId} queue position: ${position}`);
  }

  /**
   * Emit error event for an analysis job
   */
  emitError(jobId: string, error: string | Error): void {
    const errorData = {
      message: error instanceof Error ? error.message : error,
      timestamp: new Date(),
    };
    
    this.emitEvent('error', jobId, errorData);
    logger.error(`Analysis ${jobId} failed: ${errorData.message}`);
  }

  /**
   * Emit cancellation event for an analysis job
   */
  emitCancelled(jobId: string): void {
    this.emitEvent('cancelled', jobId, { 
      message: 'Analysis was cancelled',
      timestamp: new Date(),
    });
    logger.info(`Analysis ${jobId} was cancelled`);
  }

  /**
   * Emit failed event for an analysis job
   */
  emitFailed(jobId: string, error: string | Error): void {
    const errorData = {
      message: error instanceof Error ? error.message : error,
      timestamp: new Date(),
    };
    
    this.emitEvent('failed', jobId, errorData);
    logger.error(`Analysis ${jobId} failed: ${errorData.message}`);
  }

  /**
   * Emit a generic event to all subscribers of a job
   */
  private emitEvent(type: AnalysisEvent['type'], jobId: string, data: any): void {
    if (!this.io) {
      logger.warn('WebSocket server not initialized');
      return;
    }

    const event: AnalysisEvent = {
      type,
      jobId,
      data,
      timestamp: new Date(),
    };

    // Emit to job-specific room
    this.io.to(`analysis:${jobId}`).emit('analysis_event', event);
    
    // Also emit to specific event type
    this.io.to(`analysis:${jobId}`).emit(`analysis_${type}`, event);
  }

  /**
   * Emit system-wide notification to a specific user
   */
  emitUserNotification(userId: string, notification: {
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    data?: any;
  }): void {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date(),
    });

    logger.debug(`Sent notification to user ${userId}: ${notification.title}`);
  }

  /**
   * Broadcast system maintenance or status updates
   */
  broadcastSystemUpdate(update: {
    type: 'maintenance' | 'status' | 'announcement';
    title: string;
    message: string;
    severity?: 'low' | 'medium' | 'high';
  }): void {
    if (!this.io) return;

    this.io.emit('system_update', {
      ...update,
      timestamp: new Date(),
    });

    logger.info(`Broadcasted system update: ${update.title}`);
  }

  /**
   * Get current connection statistics
   */
  getConnectionStats(): {
    totalConnections: number;
    authenticatedConnections: number;
    rooms: string[];
  } {
    if (!this.io) {
      return { totalConnections: 0, authenticatedConnections: 0, rooms: [] };
    }

    const rooms = Array.from(this.io.sockets.adapter.rooms.keys())
      .filter(room => room.startsWith('user:') || room.startsWith('analysis:'));

    return {
      totalConnections: this.io.sockets.sockets.size,
      authenticatedConnections: this.connectedClients.size,
      rooms,
    };
  }

  /**
   * Force disconnect a specific user
   */
  disconnectUser(userId: string, reason: string = 'Forced disconnect'): void {
    if (!this.io) return;

    const socketsInRoom = this.io.sockets.adapter.rooms.get(`user:${userId}`);
    if (socketsInRoom) {
      socketsInRoom.forEach(socketId => {
        const socket = this.io!.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('force_disconnect', { reason });
          socket.disconnect(true);
        }
      });
    }

    logger.info(`Disconnected user ${userId}: ${reason}`);
  }

  /**
   * Send a direct message to a specific socket
   */
  sendToSocket(socketId: string, event: string, data: any): void {
    if (!this.io) return;

    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  /**
   * Graceful shutdown of WebSocket server
   */
  async shutdown(): Promise<void> {
    if (!this.io) {
      logger.info('WebSocket server not initialized, skipping shutdown');
      return;
    }

    logger.info('Shutting down WebSocket Gateway...');

    // Notify all connected clients
    this.broadcastSystemUpdate({
      type: 'maintenance',
      title: 'System Maintenance',
      message: 'The system is shutting down for maintenance',
      severity: 'high',
    });

    // Wait briefly for messages to be sent
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Disconnect all clients gracefully
    this.io.sockets.sockets.forEach((socket) => {
      socket.disconnect(true);
    });

    // Close the server
    this.io.close();
    this.io = null;
    this.connectedClients.clear();

    logger.info('WebSocket Gateway shutdown completed');
  }

  /**
   * Enhanced close method for backward compatibility
   */
  async close(): Promise<void> {
    await this.shutdown();
  }

  /**
   * Check if the WebSocket server is initialized and healthy
   */
  isHealthy(): boolean {
    return this.io !== null && this.io.sockets !== undefined;
  }

  /**
   * Emit real-time system metrics
   */
  emitSystemMetrics(metrics: {
    queueLength: number;
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    averageProcessingTime: number;
  }): void {
    if (!this.io) return;

    this.io.emit('system_metrics', {
      ...metrics,
      timestamp: new Date(),
    });
  }

  /**
   * Emit performance monitoring data
   */
  emitPerformanceData(data: {
    cpuUsage: number;
    memoryUsage: number;
    activeConnections: number;
    responseTime: number;
  }): void {
    if (!this.io) return;

    this.io.emit('performance_data', {
      ...data,
      timestamp: new Date(),
    });
  }

  /**
   * Send analysis result summary to user
   */
  emitAnalysisComplete(userId: string, jobId: string, summary: {
    overallScore: number;
    issueCount: number;
    improvementSuggestions: number;
    processingTime: number;
  }): void {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('analysis_complete', {
      jobId,
      ...summary,
      timestamp: new Date(),
    });

    logger.info(`Sent analysis completion summary to user ${userId} for job ${jobId}`);
  }
} 