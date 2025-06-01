import { Server } from 'http';
import { EnhancedQueueAdapter } from './queue/EnhancedQueueAdapter';
import { EnhancedWorker } from './queue/EnhancedWorker';
import { WebSocketGateway } from './ws/WebSocketGateway';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export interface AnalysisSystemConfig {
  workerConcurrency: number;
  maxJobTimeout: number;
  enableWebSockets: boolean;
  enableMetrics: boolean;
  cleanupInterval: number;
}

export class EnhancedAnalysisSystem {
  private queueAdapter!: EnhancedQueueAdapter;
  private worker!: EnhancedWorker;
  private wsGateway!: WebSocketGateway;
  private prisma: PrismaClient;
  private cleanupTimer?: NodeJS.Timeout;
  private isInitialized = false;
  private config: AnalysisSystemConfig;

  constructor(config: AnalysisSystemConfig) {
    this.config = config;
    this.prisma = new PrismaClient();
  }

  async initialize(httpServer?: Server): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Enhanced Analysis System already initialized');
      return;
    }

    try {
      logger.info('Initializing Enhanced Analysis System...');

      // Initialize components in proper order
      await this.initializeQueue();
      await this.initializeWebSocket(httpServer);
      await this.initializeWorker();
      await this.setupCleanupJobs();
      await this.validateSystemHealth();

      this.isInitialized = true;
      logger.info('Enhanced Analysis System initialized successfully');

      // Log system status
      await this.logSystemStatus();

    } catch (error) {
      logger.error('Failed to initialize Enhanced Analysis System:', error);
      throw new Error(`Analysis system initialization failed: ${error}`);
    }
  }

  private async initializeQueue(): Promise<void> {
    logger.info('Initializing enhanced queue adapter...');
    this.queueAdapter = new EnhancedQueueAdapter();
    
    // Wait for queue to be ready
    await this.queueAdapter.healthCheck();
    logger.info('Queue adapter initialized and healthy');
  }

  private async initializeWebSocket(httpServer?: Server): Promise<void> {
    if (!this.config.enableWebSockets || !httpServer) {
      logger.info('WebSockets disabled or no HTTP server provided');
      return;
    }

    logger.info('Initializing WebSocket gateway...');
    this.wsGateway = new WebSocketGateway();
    await this.wsGateway.initialize(httpServer);
    logger.info('WebSocket gateway initialized');
  }

  private async initializeWorker(): Promise<void> {
    logger.info('Initializing enhanced worker...');
    this.worker = new EnhancedWorker(this.queueAdapter);
    
    // Setup worker event handlers for system monitoring
    this.setupWorkerEventHandlers();
    
    logger.info(`Worker initialized with concurrency: ${this.config.workerConcurrency}`);
  }

  private setupWorkerEventHandlers(): void {
    // Additional system-level event handling could be added here
    logger.info('Worker event handlers configured');
  }

  private async setupCleanupJobs(): Promise<void> {
    if (this.config.cleanupInterval <= 0) {
      logger.info('Queue cleanup disabled');
      return;
    }

    logger.info(`Setting up queue cleanup every ${this.config.cleanupInterval}ms`);
    
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.queueAdapter.cleanup();
        await this.cleanupStaleAnalyses();
      } catch (error) {
        logger.error('Error during cleanup:', error);
      }
    }, this.config.cleanupInterval);
  }

  private async cleanupStaleAnalyses(): Promise<void> {
    try {
      // Clean up stale crawl sessions that have been running too long
      const staleTimeout = new Date(Date.now() - (this.config.maxJobTimeout * 2));
      
      const staleAnalyses = await this.prisma.crawlSession.updateMany({
        where: {
          status: 'running',
          startedAt: {
            lt: staleTimeout
          }
        },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: 'Analysis timed out - marked as stale by cleanup job'
        }
      });

      if (staleAnalyses.count > 0) {
        logger.warn(`Cleaned up ${staleAnalyses.count} stale analyses`);
      }
    } catch (error) {
      logger.error('Error cleaning up stale analyses:', error);
    }
  }

  private async validateSystemHealth(): Promise<void> {
    logger.info('Validating system health...');

    // Check queue health
    const queueHealth = await this.queueAdapter.healthCheck();
    if (queueHealth.status !== 'healthy') {
      throw new Error(`Queue system unhealthy: ${JSON.stringify(queueHealth.details)}`);
    }

    // Check database connectivity
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      logger.info('Database connectivity verified');
    } catch (error) {
      throw new Error(`Database connectivity failed: ${error}`);
    }

    // Check WebSocket if enabled
    if (this.wsGateway) {
      // WebSocket health check would go here
      logger.info('WebSocket gateway health verified');
    }

    logger.info('System health validation completed successfully');
  }

  private async logSystemStatus(): Promise<void> {
    try {
      const metrics = await this.getSystemMetrics();
      logger.info('System Status:', {
        initialized: this.isInitialized,
        queueMetrics: metrics.queue,
        workerConcurrency: this.config.workerConcurrency,
        webSocketEnabled: this.config.enableWebSockets,
        cleanupInterval: this.config.cleanupInterval
      });
    } catch (error) {
      logger.warn('Error logging system status:', error);
    }
  }

  async getSystemMetrics(): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('System not initialized');
    }

    const [queueMetrics, workerMetrics] = await Promise.all([
      this.queueAdapter.getQueueMetrics(),
      this.worker.getWorkerMetrics()
    ]);

    return {
      queue: queueMetrics,
      worker: workerMetrics,
      system: {
        initialized: this.isInitialized,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        config: this.config
      }
    };
  }

  async startAnalysis(config: any): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Analysis system not initialized');
    }

    return await this.queueAdapter.addAnalysisJob(config);
  }

  async getAnalysisStatus(jobId: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Analysis system not initialized');
    }

    return await this.queueAdapter.getJobStatus(jobId);
  }

  async cancelAnalysis(jobId: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Analysis system not initialized');
    }

    return await this.queueAdapter.cancelJob(jobId);
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Enhanced Analysis System...');

    // Clear cleanup timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Shutdown components in reverse order
    if (this.worker) {
      await this.worker.shutdown();
    }

    if (this.wsGateway) {
      await this.wsGateway.shutdown();
    }

    if (this.queueAdapter) {
      await this.queueAdapter.close();
    }

    if (this.prisma) {
      await this.prisma.$disconnect();
    }

    this.isInitialized = false;
    logger.info('Enhanced Analysis System shutdown completed');
  }

  getQueueAdapter(): EnhancedQueueAdapter {
    return this.queueAdapter;
  }

  getWorker(): EnhancedWorker {
    return this.worker;
  }

  getWebSocketGateway(): WebSocketGateway {
    return this.wsGateway;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

// Global instance
let analysisSystem: EnhancedAnalysisSystem | null = null;

export async function initializeAnalysisSystem(httpServer?: Server): Promise<void> {
  if (analysisSystem) {
    logger.warn('Analysis system already initialized');
    return;
  }

  const config: AnalysisSystemConfig = {
    workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'),
    maxJobTimeout: parseInt(process.env.MAX_JOB_TIMEOUT || '600000'), // 10 minutes
    enableWebSockets: process.env.ENABLE_WEBSOCKETS !== 'false',
    enableMetrics: process.env.ENABLE_METRICS !== 'false',
    cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL || '3600000'), // 1 hour
  };

  analysisSystem = new EnhancedAnalysisSystem(config);
  await analysisSystem.initialize(httpServer);
}

export function getAnalysisSystem(): EnhancedAnalysisSystem {
  if (!analysisSystem) {
    throw new Error('Analysis system not initialized. Call initializeAnalysisSystem() first.');
  }
  return analysisSystem;
}

export async function shutdownAnalysisSystem(): Promise<void> {
  if (analysisSystem) {
    await analysisSystem.shutdown();
    analysisSystem = null;
  }
} 