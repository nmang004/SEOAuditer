import { io, Socket } from 'socket.io-client';
import { logger } from './logger';

export interface AnalysisProgress {
  jobId: string;
  userId: string;
  percentage: number;
  stage: string;
  details: string;
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

export interface QueueUpdate {
  jobId: string;
  position: number;
  estimatedWaitTime?: number;
  timestamp: Date;
}

export interface SystemNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  data?: any;
}

export interface ConnectionOptions {
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  fallbackPolling?: boolean;
  pollingInterval?: number;
  heartbeatInterval?: number;
  connectionTimeout?: number;
}

export interface SubscriptionCallback {
  onProgress?: (progress: AnalysisProgress) => void;
  onCompleted?: (event: AnalysisEvent) => void;
  onError?: (event: AnalysisEvent) => void;
  onStepChange?: (event: AnalysisEvent) => void;
  onQueueUpdate?: (update: QueueUpdate) => void;
  onStatusChange?: (status: any) => void;
}

export interface ConnectionStatus {
  connected: boolean;
  authenticated: boolean;
  reconnectAttempts: number;
  lastError?: string;
  serverTime?: string;
  connectionId?: string;
}

export class WebSocketClient {
  private socket: Socket | null = null;
  private isConnected = false;
  private isAuthenticated = false;
  private reconnectAttempts = 0;
  private subscriptions = new Map<string, SubscriptionCallback>();
  private fallbackTimers = new Map<string, NodeJS.Timeout>();
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionListeners: Array<(connected: boolean) => void> = [];
  private authListeners: Array<(authenticated: boolean) => void> = [];
  private lastToken: string | null = null;
  private lastDeviceId: string | null = null;

  private options: Required<ConnectionOptions> = {
    autoReconnect: true,
    maxReconnectAttempts: 10,
    reconnectDelay: 2000,
    fallbackPolling: true,
    pollingInterval: 5000,
    heartbeatInterval: 30000,
    connectionTimeout: 10000,
  };

  constructor(options?: ConnectionOptions) {
    this.options = { ...this.options, ...options };
  }

  async connect(token: string, deviceId?: string): Promise<boolean> {
    try {
      // Store credentials for reconnection
      this.lastToken = token;
      this.lastDeviceId = deviceId || null;

      if (this.socket?.connected) {
        logger.debug('WebSocket already connected');
        return true;
      }

      // Clean up existing connection
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }

      const serverUrl = process.env.NEXT_PUBLIC_WS_URL || 
                       (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000');

      logger.info(`Connecting to WebSocket server: ${serverUrl}`);

      this.socket = io(serverUrl, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: this.options.connectionTimeout,
        forceNew: true,
        autoConnect: false,
        retries: 3,
        ackTimeout: 10000,
        auth: {
          token: token,
          deviceId: deviceId
        }
      });

      this.setupEventHandlers();

      // Connect to server
      this.socket.connect();

      // Wait for connection with timeout
      const connected = await this.waitForConnection();
      if (!connected) {
        throw new Error('Failed to establish WebSocket connection');
      }

      // Authenticate
      const authenticated = await this.authenticate(token, deviceId);
      if (!authenticated) {
        throw new Error('Failed to authenticate WebSocket connection');
      }

      this.startHeartbeat();
      this.reconnectAttempts = 0;

      logger.info('WebSocket connected and authenticated successfully');
      return true;

    } catch (error) {
      logger.error('Failed to connect WebSocket:', error);
      
      if (this.options.autoReconnect && this.reconnectAttempts < this.options.maxReconnectAttempts) {
        this.scheduleReconnect(token, deviceId);
      }

      return false;
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      logger.debug('WebSocket connected');
      this.isConnected = true;
      this.notifyConnectionListeners(true);
    });

    this.socket.on('disconnect', (reason) => {
      logger.warn('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.isAuthenticated = false;
      this.notifyConnectionListeners(false);
      this.notifyAuthListeners(false);
      this.stopHeartbeat();

      if (this.options.autoReconnect && reason !== 'io client disconnect') {
        // Server disconnected us, try to reconnect
        this.handleReconnection();
      }
    });

    this.socket.on('welcome', (data) => {
      logger.debug('Welcome message received:', data);
    });

    this.socket.on('authenticated', (data) => {
      logger.debug('WebSocket authenticated:', data);
      this.isAuthenticated = true;
      this.notifyAuthListeners(true);
      
      // Re-subscribe to all active subscriptions
      this.resubscribeAll();
    });

    this.socket.on('authentication_error', (error) => {
      logger.error('WebSocket authentication failed:', error);
      this.isAuthenticated = false;
      this.notifyAuthListeners(false);
    });

    this.socket.on('connection_timeout', (data) => {
      logger.warn('WebSocket connection timeout:', data);
      this.handleReconnection();
    });

    this.socket.on('analysis_progress', (progress: AnalysisProgress) => {
      const subscription = this.subscriptions.get(progress.jobId);
      if (subscription?.onProgress) {
        subscription.onProgress(progress);
      }
      
      // Clear fallback polling for this job since we got real-time update
      this.clearFallbackPolling(progress.jobId);
    });

    this.socket.on('analysis_completed', (event: AnalysisEvent) => {
      const subscription = this.subscriptions.get(event.jobId);
      if (subscription?.onCompleted) {
        subscription.onCompleted(event);
      }
      
      // Clear fallback polling
      this.clearFallbackPolling(event.jobId);
    });

    this.socket.on('analysis_error', (event: AnalysisEvent) => {
      const subscription = this.subscriptions.get(event.jobId);
      if (subscription?.onError) {
        subscription.onError(event);
      }
      
      // Clear fallback polling
      this.clearFallbackPolling(event.jobId);
    });

    this.socket.on('analysis_step_change', (event: AnalysisEvent) => {
      const subscription = this.subscriptions.get(event.jobId);
      if (subscription?.onStepChange) {
        subscription.onStepChange(event);
      }
    });

    this.socket.on('analysis_status', (status: any) => {
      const subscription = this.subscriptions.get(status.jobId);
      if (subscription?.onStatusChange) {
        subscription.onStatusChange(status);
      }
    });

    this.socket.on('queue_update', (update: QueueUpdate) => {
      const subscription = this.subscriptions.get(update.jobId);
      if (subscription?.onQueueUpdate) {
        subscription.onQueueUpdate(update);
      }
    });

    this.socket.on('system_notification', (notification: SystemNotification) => {
      logger.info('System notification:', notification);
      // Could emit to a global notification system
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('system_notification', { detail: notification }));
      }
    });

    this.socket.on('server_shutdown', (data) => {
      logger.warn('Server shutdown notice:', data);
      // Don't auto-reconnect on server shutdown
      this.options.autoReconnect = false;
    });

    this.socket.on('pong', (data) => {
      // Heartbeat response received
      logger.debug('Heartbeat pong received:', data);
    });

    this.socket.on('error', (error) => {
      logger.error('WebSocket error:', error);
    });

    this.socket.on('connect_error', (error) => {
      logger.error('WebSocket connection error:', error);
      this.handleReconnection();
    });
  }

  private async waitForConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve(false);
        return;
      }

      const timeout = setTimeout(() => {
        resolve(false);
      }, this.options.connectionTimeout);

      this.socket.once('connect', () => {
        clearTimeout(timeout);
        resolve(true);
      });

      this.socket.once('connect_error', () => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
  }

  private async authenticate(token: string, deviceId?: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve(false);
        return;
      }

      const timeout = setTimeout(() => {
        resolve(false);
      }, 10000); // 10 second timeout for auth

      this.socket.once('authenticated', () => {
        clearTimeout(timeout);
        resolve(true);
      });

      this.socket.once('authentication_error', () => {
        clearTimeout(timeout);
        resolve(false);
      });

      // Send authentication
      this.socket.emit('authenticate', { token, deviceId });
    });
  }

  private handleReconnection(): void {
    if (!this.options.autoReconnect || this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      logger.warn('Max reconnection attempts reached or auto-reconnect disabled');
      return;
    }

    if (this.lastToken) {
      this.scheduleReconnect(this.lastToken, this.lastDeviceId || undefined);
    }
  }

  private scheduleReconnect(token: string, deviceId?: string): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = Math.min(
      this.options.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000 // Max 30 seconds
    );

    logger.info(`Scheduling reconnection attempt ${this.reconnectAttempts + 1} in ${delay}ms`);

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectAttempts++;
      logger.info(`Reconnection attempt ${this.reconnectAttempts}/${this.options.maxReconnectAttempts}`);
      
      const success = await this.connect(token, deviceId);
      if (!success && this.reconnectAttempts < this.options.maxReconnectAttempts) {
        this.scheduleReconnect(token, deviceId);
      }
    }, delay);
  }

  private resubscribeAll(): void {
    if (!this.socket || !this.isAuthenticated) return;

    logger.info(`Re-subscribing to ${this.subscriptions.size} analysis jobs`);
    
    Array.from(this.subscriptions.keys()).forEach(jobId => {
      this.socket?.emit('subscribe_analysis', { jobId });
    });
  }

  subscribeToAnalysis(jobId: string, callbacks: SubscriptionCallback): void {
    this.subscriptions.set(jobId, callbacks);

    if (this.socket?.connected && this.isAuthenticated) {
      this.socket.emit('subscribe_analysis', { jobId });
      logger.debug(`Subscribed to analysis ${jobId}`);
    } else {
      logger.warn(`Cannot subscribe to analysis ${jobId}: not connected or authenticated`);
    }

    // Start fallback polling if enabled
    if (this.options.fallbackPolling) {
      this.startFallbackPolling(jobId, callbacks);
    }
  }

  unsubscribeFromAnalysis(jobId: string): void {
    if (this.socket?.connected && this.isAuthenticated) {
      this.socket.emit('unsubscribe_analysis', { jobId });
    }

    this.subscriptions.delete(jobId);
    this.clearFallbackPolling(jobId);
    logger.debug(`Unsubscribed from analysis ${jobId}`);
  }

  requestAnalysisStatus(jobId: string): void {
    if (this.socket?.connected && this.isAuthenticated) {
      this.socket.emit('get_analysis_status', { jobId });
    }
  }

  private startFallbackPolling(jobId: string, callbacks: SubscriptionCallback): void {
    if (this.fallbackTimers.has(jobId)) return;

    const timer = setInterval(async () => {
      // Only poll if WebSocket is not connected
      if (this.isConnected && this.isAuthenticated) return;

      try {
        const response = await fetch(`/api/analysis/status/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${this.lastToken}`,
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        
        if (data.progress && callbacks.onProgress) {
          callbacks.onProgress({
            ...data.progress,
            timestamp: new Date(),
          });
        }

        if (data.status === 'completed' && callbacks.onCompleted) {
          callbacks.onCompleted({
            type: 'completed',
            jobId,
            userId: data.userId || '',
            data: data.result,
            timestamp: new Date(),
          });
          this.clearFallbackPolling(jobId);
        }

        if (data.status === 'failed' && callbacks.onError) {
          callbacks.onError({
            type: 'error',
            jobId,
            userId: data.userId || '',
            data: { message: data.error || 'Analysis failed' },
            timestamp: new Date(),
          });
          this.clearFallbackPolling(jobId);
        }
      } catch (error) {
        logger.debug(`Fallback polling error for ${jobId}:`, error);
      }
    }, this.options.pollingInterval);

    this.fallbackTimers.set(jobId, timer);
  }

  private clearFallbackPolling(jobId: string): void {
    const timer = this.fallbackTimers.get(jobId);
    if (timer) {
      clearInterval(timer);
      this.fallbackTimers.delete(jobId);
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, this.options.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.connectionListeners.indexOf(callback);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  onAuthChange(callback: (authenticated: boolean) => void): () => void {
    this.authListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.authListeners.indexOf(callback);
      if (index > -1) {
        this.authListeners.splice(index, 1);
      }
    };
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        logger.error('Error in connection listener:', error);
      }
    });
  }

  private notifyAuthListeners(authenticated: boolean): void {
    this.authListeners.forEach(callback => {
      try {
        callback(authenticated);
      } catch (error) {
        logger.error('Error in auth listener:', error);
      }
    });
  }

  getConnectionStatus(): ConnectionStatus {
    return {
      connected: this.isConnected,
      authenticated: this.isAuthenticated,
      reconnectAttempts: this.reconnectAttempts,
      lastError: undefined, // Could track last error
      serverTime: undefined, // Could track server time from last auth
      connectionId: this.socket?.id,
    };
  }

  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  disconnect(): void {
    logger.info('Disconnecting WebSocket client');
    
    // Stop auto-reconnect
    this.options.autoReconnect = false;
    
    // Clear all timers
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Clear fallback polling
    this.fallbackTimers.forEach(timer => clearInterval(timer));
    this.fallbackTimers.clear();
    
    // Clear subscriptions
    this.subscriptions.clear();
    
    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.isAuthenticated = false;
    this.reconnectAttempts = 0;
    
    // Clear listeners
    this.connectionListeners = [];
    this.authListeners = [];
  }

  // Singleton pattern for global WebSocket client
  private static instance: WebSocketClient | null = null;

  static getInstance(options?: ConnectionOptions): WebSocketClient {
    if (!WebSocketClient.instance) {
      WebSocketClient.instance = new WebSocketClient(options);
    }
    return WebSocketClient.instance;
  }
}

// Helper function to get the global WebSocket client
export function getWebSocketClient(options?: ConnectionOptions): WebSocketClient {
  return WebSocketClient.getInstance(options);
}

// Export default instance
export const webSocketClient = getWebSocketClient(); 