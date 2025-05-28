import { Server as WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { logger } from '../utils/logger';
import { config } from '../config/config';
import { verifyJwt } from '../utils/auth';

interface Client extends WebSocket {
  id: string;
  userId?: string;
  subscriptions: Set<string>;
  isAlive: boolean;
}

export class WebSocketService {
  private static instance: WebSocketService;
  private wss: WebSocketServer | null = null;
  private clients: Set<Client> = new Set();
  private pingInterval: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, (client: Client, data: any) => void> = new Map();

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Initialize WebSocket server
   */
  public initialize(server: HttpServer): void {
    if (this.wss) {
      logger.warn('WebSocket server already initialized');
      return;
    }

    this.wss = new WebSocketServer({
      server,
      path: '/ws',
      clientTracking: true,
    });

    // Set up ping/pong for connection health
    this.setupPingPong();

    // Handle new connections
    this.wss.on('connection', this.handleConnection.bind(this));

    logger.info('WebSocket server initialized');
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, req: any): void {
    const client = ws as Client;
    client.id = Math.random().toString(36).substring(2, 15);
    client.subscriptions = new Set();
    client.isAlive = true;
    this.clients.add(client);

    logger.debug(`Client connected: ${client.id}`);

    // Handle authentication
    this.handleAuthentication(client, req);

    // Handle messages
    client.on('message', (data: string) => {
      try {
        const message = JSON.parse(data);
        this.handleMessage(client, message);
      } catch (error) {
        logger.error('Error processing WebSocket message:', error);
        this.sendError(client, 'Invalid message format');
      }
    });

    // Handle close
    client.on('close', () => {
      logger.debug(`Client disconnected: ${client.id}`);
      this.clients.delete(client);
    });

    // Handle errors
    client.on('error', (error) => {
      logger.error(`WebSocket error: ${error.message}`);
      client.close();
    });
  }

  /**
   * Handle client authentication
   */
  private handleAuthentication(client: Client, req: any): void {
    try {
      // Get token from query params or headers
      const token = 
        req.url?.split('token=')[1]?.split('&')[0] ||
        req.headers['sec-websocket-protocol']?.split(', ')[1];

      if (!token) {
        logger.warn('No authentication token provided');
        this.sendError(client, 'Authentication required', 4401);
        client.close(1008, 'Authentication required');
        return;
      }

      // Verify JWT token
      const decoded = verifyJwt(token);
      if (!decoded) {
        this.sendError(client, 'Invalid or expired token', 4403);
        client.close(1008, 'Invalid or expired token');
        return;
      }

      // Authentication successful
      client.userId = decoded.userId;
      logger.debug(`Client authenticated: ${client.id} (User: ${client.userId})`);
      
      // Send welcome message
      this.send(client, {
        type: 'welcome',
        data: { userId: client.userId },
      });
    } catch (error) {
      logger.error('Authentication error:', error);
      this.sendError(client, 'Authentication failed', 4403);
      client.close(1008, 'Authentication failed');
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(client: Client, message: any): void {
    if (!message.type) {
      this.sendError(client, 'Message type is required');
      return;
    }

    // Handle built-in message types
    switch (message.type) {
      case 'ping':
        this.send(client, { type: 'pong' });
        break;
      case 'subscribe':
        this.handleSubscribe(client, message.channel);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(client, message.channel);
        break;
      default:
        // Check for custom message handlers
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
          try {
            handler(client, message.data);
          } catch (error) {
            logger.error(`Error in message handler for ${message.type}:`, error);
            this.sendError(client, 'Error processing message');
          }
        } else {
          this.sendError(client, `Unknown message type: ${message.type}`);
        }
    }
  }

  /**
   * Handle channel subscription
   */
  private handleSubscribe(client: Client, channel: string): void {
    if (!channel) {
      this.sendError(client, 'Channel is required for subscription');
      return;
    }

    // Validate channel format
    if (!/^[a-z0-9-_:.]+$/i.test(channel)) {
      this.sendError(client, 'Invalid channel name');
      return;
    }

    // Check if user has permission to subscribe to this channel
    if (channel.startsWith('user:') && !channel.startsWith(`user:${client.userId}`)) {
      this.sendError(client, 'Unauthorized to subscribe to this channel', 4403);
      return;
    }

    client.subscriptions.add(channel);
    logger.debug(`Client ${client.id} subscribed to ${channel}`);
    
    this.send(client, {
      type: 'subscription_confirmed',
      channel,
    });
  }

  /**
   * Handle channel unsubscription
   */
  private handleUnsubscribe(client: Client, channel: string): void {
    if (!channel) {
      client.subscriptions.clear();
      logger.debug(`Client ${client.id} unsubscribed from all channels`);
    } else {
      client.subscriptions.delete(channel);
      logger.debug(`Client ${client.id} unsubscribed from ${channel}`);
    }
    
    this.send(client, {
      type: 'unsubscription_confirmed',
      channel: channel || 'all',
    });
  }

  /**
   * Set up ping/pong for connection health
   */
  private setupPingPong(): void {
    // Clear existing interval if any
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    // Send ping every 25 seconds (client has 30s to respond)
    this.pingInterval = setInterval(() => {
      this.clients.forEach((client) => {
        if (client.isAlive === false) {
          logger.debug(`Terminating inactive connection: ${client.id}`);
          return client.terminate();
        }

        client.isAlive = false;
        client.ping(() => {});
      });
    }, 25000);
  }

  /**
   * Send a message to a specific client
   */
  public send(client: Client, message: any): void {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  /**
   * Send an error message to a client
   */
  public sendError(client: Client, message: string, code = 4400): void {
    this.send(client, {
      type: 'error',
      code,
      message,
    });
  }

  /**
   * Broadcast a message to all connected clients
   */
  public broadcast(message: any, filter?: (client: Client) => boolean): void {
    const clients = filter ? Array.from(this.clients).filter(filter) : this.clients;
    
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  /**
   * Publish a message to a specific channel
   */
  public publish(channel: string, message: any): void {
    if (!channel) return;

    const data = {
      type: 'message',
      channel,
      data: message,
      timestamp: new Date().toISOString(),
    };

    // Find all clients subscribed to this channel
    this.clients.forEach((client) => {
      if (client.subscriptions.has(channel) && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  /**
   * Register a custom message handler
   */
  public onMessage(type: string, handler: (client: Client, data: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Get all connected clients
   */
  public getConnectedClients(): { id: string; userId?: string; subscriptions: string[] }[] {
    return Array.from(this.clients).map((client) => ({
      id: client.id,
      userId: client.userId,
      subscriptions: Array.from(client.subscriptions),
    }));
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.wss) {
      this.wss.close(() => {
        logger.info('WebSocket server closed');
      });
      this.wss = null;
    }

    this.clients.clear();
    this.messageHandlers.clear();
  }
}

// Export a singleton instance
export const webSocketService = WebSocketService.getInstance();
