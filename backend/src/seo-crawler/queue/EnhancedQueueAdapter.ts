import { Queue, QueueOptions } from 'bullmq';
import { CrawlerConfig } from '../types/CrawlerConfig';
import { logger } from '../../utils/logger';
import IORedis from 'ioredis';
import { enhancedWebSocketGateway } from '../ws/EnhancedWebSocketGateway';

export interface JobProgress {
  percentage: number;
  stage: string;
  details: string;
  startTime?: Date;
  currentStep?: string;
  totalSteps?: number;
  stepProgress?: number;
}

export interface JobStatus {
  id: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';
  progress?: JobProgress;
  result?: any;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  failedReason?: string;
  attemptsMade: number;
  data: any;
}

export interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
}

export interface JobStatusResponse {
  id: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';
  progress?: JobProgress;
  result?: any;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  attemptsMade: number;
  queuePosition?: number;
  estimatedWaitTime?: number;
  data?: any;
}

export class EnhancedQueueAdapter {
  private queue: Queue;
  private connection: IORedis;
  private queueMetricsInterval: NodeJS.Timeout | null = null;
  private lastMetricsUpdate: QueueMetrics | null = null;

  constructor() {
    // Enhanced Redis connection with proper error handling
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl && process.env.NODE_ENV === 'production') {
      logger.warn('Redis URL not provided in production - queue functionality will be limited');
    }
    
    this.connection = redisUrl 
      ? new IORedis(redisUrl)
      : new IORedis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          maxRetriesPerRequest: 3,
          enableReadyCheck: false,
          lazyConnect: true,
          retryStrategy: (times: number) => {
            if (times > 3) {
              logger.error('Redis connection failed after 3 retries');
              return null; // Stop retrying
            }
            return Math.min(times * 100, 3000);
          }
        });

    // Handle connection errors
    this.connection.on('error', (error) => {
      logger.error('IORedis connection error:', error);
    });

    const queueOptions: QueueOptions = {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 10, // Keep last 10 completed jobs
        removeOnFail: 50,     // Keep last 50 failed jobs for debugging
        attempts: 3,          // Retry failed jobs up to 3 times
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        delay: 0,
      },
    };

    this.queue = new Queue('seo-analysis', queueOptions);

    // Queue event listeners for monitoring
    this.setupQueueEventListeners();
    this.startMetricsCollection();
  }

  private setupQueueEventListeners(): void {
    this.queue.on('error', (error) => {
      logger.error('Queue error:', error);
    });

    this.queue.on('waiting', async (job: any) => {
      logger.info(`Job ${job.id} is waiting`);
      
      // Get queue position and estimated wait time
      const position = await this.getJobQueuePosition(job.id!.toString());
      const estimatedWaitTime = await this.calculateEstimatedWaitTime(position);
      
      // Emit queue update
      enhancedWebSocketGateway.emitQueueUpdate(
        job.id!.toString(), 
        position, 
        estimatedWaitTime
      );
    });

    this.queue.on('progress', async (job: any, progress: any) => {
      logger.info(`Job ${job.id} started processing`);
      
      // Emit status update
      enhancedWebSocketGateway.emitProgress(job.id!.toString(), {
        jobId: job.id!.toString(),
        userId: job.data.userId,
        percentage: 0,
        stage: 'active',
        details: 'Analysis started',
        timestamp: new Date(),
        queuePosition: 0
      });
    });

    // Using worker events instead of queue global events for better compatibility
    this.queue.on('removed', (job: any) => {
      logger.info(`Job ${job.id} was removed`);
    });

    this.queue.on('cleaned', (jobs: any[], type: string) => {
      logger.info(`Cleaned ${jobs.length} ${type} jobs`);
    });
  }

  private startMetricsCollection(): void {
    this.queueMetricsInterval = setInterval(async () => {
      try {
        const metrics = await this.getQueueMetrics();
        this.lastMetricsUpdate = metrics;
        
        // Update waiting jobs with new queue positions
        await this.updateWaitingJobPositions();
      } catch (error) {
        logger.error('Error collecting queue metrics:', error);
      }
    }, 10000); // Every 10 seconds
  }

  private async updateWaitingJobPositions(): Promise<void> {
    try {
      const waitingJobs = await this.queue.getWaiting(0, -1);
      
      for (let i = 0; i < waitingJobs.length; i++) {
        const job = waitingJobs[i];
        const position = i + 1;
        const estimatedWaitTime = await this.calculateEstimatedWaitTime(position);
        
        // Emit queue update for each waiting job
        enhancedWebSocketGateway.emitQueueUpdate(
          job.id!.toString(),
          position,
          estimatedWaitTime
        );
      }
    } catch (error) {
      logger.warn('Error updating waiting job positions:', error);
    }
  }

  async addAnalysisJob(
    config: CrawlerConfig & { 
      projectId: string; 
      userId: string; 
      priority?: number;
      timeout?: number;
    }
  ): Promise<string> {
    try {
      const jobData = {
        ...config,
        addedAt: new Date(),
        timeout: config.timeout || 600000, // 10 minutes default
      };

      const job = await this.queue.add('seo-analysis', jobData, {
        priority: config.priority || 0,
        delay: 0,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        // Job-specific timeout
        jobId: config.projectId + '-' + Date.now(),
      });

      const jobId = job.id!.toString();
      
      // Get initial queue position
      const position = await this.getJobQueuePosition(jobId);
      const estimatedWaitTime = await this.calculateEstimatedWaitTime(position);
      
      // Emit initial queue update
      enhancedWebSocketGateway.emitQueueUpdate(jobId, position, estimatedWaitTime);

      logger.info(`Added analysis job ${jobId} for project ${config.projectId} at position ${position}`);
      return jobId;
    } catch (error) {
      logger.error('Error adding analysis job:', error);
      throw new Error(`Failed to add analysis job: ${error}`);
    }
  }

  async getJobStatus(jobId: string): Promise<JobStatusResponse | null> {
    try {
      const job = await this.queue.getJob(jobId);
      if (!job) {
        return null;
      }

      const state = await job.getState();
      let queuePosition: number | undefined;
      let estimatedWaitTime: number | undefined;

      // Calculate queue position for waiting jobs
      if (state === 'waiting') {
        queuePosition = await this.getJobQueuePosition(jobId);
        estimatedWaitTime = await this.calculateEstimatedWaitTime(queuePosition);
      }

      return {
        id: jobId,
        status: state as any,
        progress: job.progress as JobProgress,
        result: job.returnvalue,
        error: job.failedReason,
        createdAt: new Date(job.timestamp),
        startedAt: job.processedOn ? new Date(job.processedOn) : undefined,
        completedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
        attemptsMade: job.attemptsMade,
        queuePosition,
        estimatedWaitTime,
        data: job.data
      };
    } catch (error) {
      logger.error(`Error getting job status for ${jobId}:`, error);
      return null;
    }
  }

  async getJobQueuePosition(jobId: string): Promise<number> {
    try {
      const waitingJobs = await this.queue.getWaiting(0, -1);
      const position = waitingJobs.findIndex(job => job.id === jobId);
      return position >= 0 ? position + 1 : 0;
    } catch (error) {
      logger.warn(`Error getting queue position for job ${jobId}:`, error);
      return 0;
    }
  }

  async calculateEstimatedWaitTime(queuePosition: number): Promise<number> {
    try {
      if (queuePosition <= 0) return 0;

      const metrics = this.lastMetricsUpdate || await this.getQueueMetrics();
      const averageProcessingTime = metrics.averageProcessingTime || 300000; // 5 minutes default
      const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '2');
      
      // Estimate based on position in queue and average processing time
      const estimatedSeconds = Math.ceil((queuePosition / concurrency) * (averageProcessingTime / 1000));
      
      return estimatedSeconds * 1000; // Return in milliseconds
    } catch (error) {
      logger.warn('Error calculating estimated wait time:', error);
      return 300000; // 5 minutes default
    }
  }

  async getQueueMetrics(): Promise<QueueMetrics> {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.queue.getWaiting(),
        this.queue.getActive(),
        this.queue.getCompleted(0, 99),
        this.queue.getFailed(0, 99),
        this.queue.getDelayed()
      ]);

      // Calculate processing times from recent completed jobs
      let totalProcessingTime = 0;
      let jobCount = 0;

      for (const job of completed) {
        if (job.processedOn && job.finishedOn) {
          totalProcessingTime += job.finishedOn - job.processedOn;
          jobCount++;
        }
      }

      const averageProcessingTime = jobCount > 0 ? totalProcessingTime / jobCount : 300000;

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        paused: 0, // BullMQ doesn't have a direct getPaused method
        totalProcessingTime,
        averageProcessingTime
      };
    } catch (error) {
      logger.error('Error getting queue metrics:', error);
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        paused: 0,
        totalProcessingTime: 0,
        averageProcessingTime: 300000
      };
    }
  }

  async updateJobProgress(jobId: string, progress: JobProgress): Promise<void> {
    try {
      const job = await this.queue.getJob(jobId);
      if (job) {
        await job.updateProgress(progress);
        
        // Cache progress in Redis for quick retrieval
        await this.connection.setex(
          `job:progress:${jobId}`,
          3600, // 1 hour TTL
          JSON.stringify(progress)
        );
      }
    } catch (error) {
      logger.warn(`Failed to update progress for job ${jobId}:`, error);
    }
  }

  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const job = await this.queue.getJob(jobId);
      if (!job) {
        return false;
      }

      const state = await job.getState();
      
      if (state === 'waiting' || state === 'delayed') {
        // Remove from queue
        await job.remove();
        enhancedWebSocketGateway.emitError(jobId, 'Job cancelled by user');
        return true;
      } else if (state === 'active') {
        // Mark as cancelled (worker should check this)
        await job.updateData({ ...job.data, cancelled: true });
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Error cancelling job ${jobId}:`, error);
      return false;
    }
  }

  async retryJob(jobId: string): Promise<boolean> {
    try {
      const job = await this.queue.getJob(jobId);
      if (!job) {
        return false;
      }

      await job.retry();
      logger.info(`Retrying job ${jobId}`);
      return true;
    } catch (error) {
      logger.error(`Error retrying job ${jobId}:`, error);
      return false;
    }
  }

  async getJobsByUser(userId: string, limit: number = 50): Promise<JobStatusResponse[]> {
    try {
      const [waiting, active, completed, failed] = await Promise.all([
        this.queue.getWaiting(0, limit),
        this.queue.getActive(0, limit),
        this.queue.getCompleted(0, limit),
        this.queue.getFailed(0, limit)
      ]);

      const allJobs = [...waiting, ...active, ...completed, ...failed];
      const userJobs = allJobs.filter(job => job.data.userId === userId);

      const jobStatuses = await Promise.all(
        userJobs.map(async (job) => {
          const status = await this.getJobStatus(job.id!.toString());
          return status;
        })
      );

      return jobStatuses.filter(status => status !== null) as JobStatusResponse[];
    } catch (error) {
      logger.error(`Error getting jobs for user ${userId}:`, error);
      return [];
    }
  }

  async pauseQueue(): Promise<void> {
    await this.queue.pause();
    logger.info('Queue paused');
  }

  async resumeQueue(): Promise<void> {
    await this.queue.resume();
    logger.info('Queue resumed');
  }

  async cleanQueue(age: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      // Clean completed jobs older than age
      await this.queue.clean(age, 100, 'completed');
      await this.queue.clean(age, 100, 'failed');
      
      logger.info(`Cleaned queue of jobs older than ${age}ms`);
    } catch (error) {
      logger.error('Error cleaning queue:', error);
    }
  }

  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const isQueueReady = this.queue !== null;
      const isRedisReady = this.connection.status === 'ready';
      const metrics = await this.getQueueMetrics();
      
      const status = isQueueReady && isRedisReady ? 'healthy' : 'unhealthy';
      
      return {
        status,
        details: {
          queue: isQueueReady ? 'ready' : 'not ready',
          redis: this.connection.status,
          metrics,
          lastUpdate: this.lastMetricsUpdate ? new Date() : null
        }
      };
    } catch (error) {
      logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          queue: 'error',
          redis: this.connection.status
        }
      };
    }
  }

  async close(): Promise<void> {
    logger.info('Closing Enhanced Queue Adapter...');
    
    if (this.queueMetricsInterval) {
      clearInterval(this.queueMetricsInterval);
    }
    
    try {
      await this.queue.close();
      await this.connection.quit();
    } catch (error) {
      logger.warn('Error during queue adapter close:', error);
    }
    
    logger.info('Enhanced Queue Adapter closed');
  }

  async cleanup(): Promise<void> {
    try {
      // Clean old completed and failed jobs
      await this.cleanQueue();
      
      // Clear any stalled jobs
      const activeJobs = await this.queue.getActive();
      for (const job of activeJobs) {
        const state = await job.getState();
        if (state === 'stalled') {
          await job.moveToFailed(new Error('Job cleanup: moved stalled job to failed'), '0');
        }
      }
      
      logger.info('Queue cleanup completed');
    } catch (error) {
      logger.error('Error during queue cleanup:', error);
    }
  }

  getMetrics(): QueueMetrics | null {
    return this.lastMetricsUpdate;
  }

  isHealthy(): boolean {
    return this.queue !== null && this.connection.status === 'ready';
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Enhanced Queue Adapter...');
    
    if (this.queueMetricsInterval) {
      clearInterval(this.queueMetricsInterval);
    }
    
    try {
      await this.queue.close();
      await this.connection.quit();
    } catch (error) {
      logger.warn('Error during queue adapter shutdown:', error);
    }
    
    logger.info('Enhanced Queue Adapter shutdown complete');
  }
} 