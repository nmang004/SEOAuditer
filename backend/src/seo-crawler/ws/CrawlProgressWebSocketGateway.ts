import { Server, Socket } from 'socket.io';
import { Logger } from '../../utils/logger';
import { MultiPageCrawler, CrawlProgress } from '../engine/MultiPageCrawler';
import { DatabaseService } from '../../services/DatabaseService';

interface CrawlProgressSubscription {
  socket: Socket;
  sessionId: string;
  userId: string;
}

export class CrawlProgressWebSocketGateway {
  private subscriptions: Map<string, CrawlProgressSubscription[]> = new Map();
  private activeCrawlers: Map<string, MultiPageCrawler> = new Map();
  private logger = Logger.getInstance();
  private db = DatabaseService.getInstance();

  constructor(private io: Server) {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.logger.debug(`Client connected: ${socket.id}`);

      // Subscribe to crawl progress
      socket.on('subscribe-crawl', async (data: { sessionId: string; userId: string }) => {
        try {
          await this.handleSubscribeCrawl(socket, data);
        } catch (error) {
          this.logger.error('Error subscribing to crawl progress:', error);
          socket.emit('error', { message: 'Failed to subscribe to crawl progress' });
        }
      });

      // Unsubscribe from crawl progress
      socket.on('unsubscribe-crawl', (data: { sessionId: string }) => {
        this.handleUnsubscribeCrawl(socket, data.sessionId);
      });

      // Pause crawl
      socket.on('pause-crawl', async (data: { sessionId: string; userId: string }) => {
        try {
          await this.handlePauseCrawl(data.sessionId, data.userId);
        } catch (error) {
          this.logger.error('Error pausing crawl:', error);
          socket.emit('error', { message: 'Failed to pause crawl' });
        }
      });

      // Resume crawl
      socket.on('resume-crawl', async (data: { sessionId: string; userId: string }) => {
        try {
          await this.handleResumeCrawl(data.sessionId, data.userId);
        } catch (error) {
          this.logger.error('Error resuming crawl:', error);
          socket.emit('error', { message: 'Failed to resume crawl' });
        }
      });

      // Stop crawl
      socket.on('stop-crawl', async (data: { sessionId: string; userId: string }) => {
        try {
          await this.handleStopCrawl(data.sessionId, data.userId);
        } catch (error) {
          this.logger.error('Error stopping crawl:', error);
          socket.emit('error', { message: 'Failed to stop crawl' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.logger.debug(`Client disconnected: ${socket.id}`);
        this.handleClientDisconnect(socket);
      });
    });
  }

  private async handleSubscribeCrawl(
    socket: Socket, 
    data: { sessionId: string; userId: string }
  ): Promise<void> {
    const { sessionId, userId } = data;

    // Verify user has access to this crawl session
    const session = await this.db.crawlSession.findFirst({
      where: {
        sessionId,
        userId
      }
    });

    if (!session) {
      socket.emit('error', { message: 'Crawl session not found or access denied' });
      return;
    }

    // Add subscription
    if (!this.subscriptions.has(sessionId)) {
      this.subscriptions.set(sessionId, []);
    }
    
    this.subscriptions.get(sessionId)!.push({
      socket,
      sessionId,
      userId
    });

    // Join socket room
    socket.join(`crawl-${sessionId}`);

    // Send initial status
    const status = await this.getCrawlStatus(sessionId);
    socket.emit('crawl-status', status);

    this.logger.debug(`Client ${socket.id} subscribed to crawl ${sessionId}`);
  }

  private handleUnsubscribeCrawl(socket: Socket, sessionId: string): void {
    const subscriptions = this.subscriptions.get(sessionId);
    if (subscriptions) {
      const index = subscriptions.findIndex(sub => sub.socket.id === socket.id);
      if (index !== -1) {
        subscriptions.splice(index, 1);
        socket.leave(`crawl-${sessionId}`);
        
        if (subscriptions.length === 0) {
          this.subscriptions.delete(sessionId);
        }
      }
    }
  }

  private handleClientDisconnect(socket: Socket): void {
    // Remove from all subscriptions
    for (const [sessionId, subscriptions] of this.subscriptions.entries()) {
      const index = subscriptions.findIndex(sub => sub.socket.id === socket.id);
      if (index !== -1) {
        subscriptions.splice(index, 1);
        if (subscriptions.length === 0) {
          this.subscriptions.delete(sessionId);
        }
      }
    }
  }

  private async handlePauseCrawl(sessionId: string, userId: string): Promise<void> {
    // Verify ownership
    const session = await this.db.crawlSession.findFirst({
      where: { sessionId, userId }
    });

    if (!session) {
      throw new Error('Crawl session not found or access denied');
    }

    const crawler = this.activeCrawlers.get(sessionId);
    if (crawler) {
      crawler.pause();
      
      // Update database
      await this.db.crawlSession.update({
        where: { sessionId },
        data: { status: 'paused' }
      });
    }
  }

  private async handleResumeCrawl(sessionId: string, userId: string): Promise<void> {
    // Verify ownership
    const session = await this.db.crawlSession.findFirst({
      where: { sessionId, userId }
    });

    if (!session) {
      throw new Error('Crawl session not found or access denied');
    }

    const crawler = this.activeCrawlers.get(sessionId);
    if (crawler) {
      crawler.resume();
      
      // Update database
      await this.db.crawlSession.update({
        where: { sessionId },
        data: { status: 'running' }
      });
    }
  }

  private async handleStopCrawl(sessionId: string, userId: string): Promise<void> {
    // Verify ownership
    const session = await this.db.crawlSession.findFirst({
      where: { sessionId, userId }
    });

    if (!session) {
      throw new Error('Crawl session not found or access denied');
    }

    const crawler = this.activeCrawlers.get(sessionId);
    if (crawler) {
      crawler.stop();
      this.activeCrawlers.delete(sessionId);
      
      // Update database
      await this.db.crawlSession.update({
        where: { sessionId },
        data: { 
          status: 'completed',
          completedAt: new Date()
        }
      });
    }
  }

  private async getCrawlStatus(sessionId: string): Promise<any> {
    const session = await this.db.crawlSession.findUnique({
      where: { sessionId },
      include: {
        crawlPages: {
          select: {
            id: true,
            url: true,
            status: true,
            depth: true
          }
        },
        crossPageInsights: {
          select: {
            id: true,
            insightType: true,
            severity: true,
            title: true
          }
        }
      }
    });

    if (!session) {
      return null;
    }

    return {
      sessionId: session.sessionId,
      status: session.status,
      crawlType: session.crawlType,
      pagesCrawled: session.pagesCrawled,
      totalPages: session.totalPages,
      successfulPages: session.successfulPages,
      errorPages: session.errorPages,
      avgScore: session.avgScore,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      pages: session.crawlPages,
      insights: session.crossPageInsights
    };
  }

  // Called by crawler to emit progress updates
  public async emitCrawlProgress(
    sessionId: string,
    progress: CrawlProgress
  ): Promise<void> {
    try {
      // Save progress to database
      await this.saveCrawlProgress(sessionId, progress);
      
      // Emit to subscribed clients
      this.io.to(`crawl-${sessionId}`).emit('crawl-progress', {
        sessionId,
        progress,
        timestamp: new Date()
      });
      
      this.logger.debug(`Emitted progress for crawl ${sessionId}: ${progress.crawled}/${progress.total} pages`);
    } catch (error) {
      this.logger.error(`Error emitting crawl progress for ${sessionId}:`, error);
    }
  }

  // Called by crawler to emit error
  public async emitCrawlError(
    sessionId: string,
    error: any
  ): Promise<void> {
    try {
      this.io.to(`crawl-${sessionId}`).emit('crawl-error', {
        sessionId,
        error,
        timestamp: new Date()
      });
      
      this.logger.error(`Emitted error for crawl ${sessionId}:`, error);
    } catch (err) {
      this.logger.error(`Error emitting crawl error for ${sessionId}:`, err);
    }
  }

  // Called by crawler to emit completion
  public async emitCrawlCompletion(
    sessionId: string,
    results: any
  ): Promise<void> {
    try {
      this.io.to(`crawl-${sessionId}`).emit('crawl-completed', {
        sessionId,
        results,
        timestamp: new Date()
      });
      
      // Clean up
      this.activeCrawlers.delete(sessionId);
      
      this.logger.info(`Emitted completion for crawl ${sessionId}`);
    } catch (error) {
      this.logger.error(`Error emitting crawl completion for ${sessionId}:`, error);
    }
  }

  // Register an active crawler
  public registerCrawler(sessionId: string, crawler: MultiPageCrawler): void {
    this.activeCrawlers.set(sessionId, crawler);
    
    // Listen for crawler events
    crawler.on('progress', (progress: CrawlProgress) => {
      this.emitCrawlProgress(sessionId, progress);
    });
    
    crawler.on('error', (error: any) => {
      this.emitCrawlError(sessionId, error);
    });
    
    crawler.on('completed', (results: any) => {
      this.emitCrawlCompletion(sessionId, results);
    });
  }

  // Unregister a crawler
  public unregisterCrawler(sessionId: string): void {
    this.activeCrawlers.delete(sessionId);
  }

  private async saveCrawlProgress(
    sessionId: string,
    progress: CrawlProgress
  ): Promise<void> {
    await this.db.crawlSession.update({
      where: { sessionId },
      data: {
        pagesCrawled: progress.crawled,
        totalPages: progress.total,
        status: progress.status,
        updatedAt: new Date()
      }
    });
  }

  // Get all active crawl sessions
  public getActiveCrawlers(): string[] {
    return Array.from(this.activeCrawlers.keys());
  }

  // Get subscription count for a session
  public getSubscriptionCount(sessionId: string): number {
    return this.subscriptions.get(sessionId)?.length || 0;
  }
}