import { Queue } from 'bullmq';
import { CrawlerConfig } from '../types/CrawlerConfig';
import { redisConfig } from '../../config/config';
import { logger } from '../../utils/logger';

export class QueueAdapter {
  private queue: Queue | null = null;

  constructor() {
    // Skip queue initialization if Redis not available
    if (!redisConfig.url) {
      logger.warn('Redis not configured - QueueAdapter disabled');
      return;
    }

    try {
      this.queue = new Queue('seo-crawl', { 
        connection: {
          url: redisConfig.url
        }
      });
    } catch (error) {
      logger.error('Failed to initialize QueueAdapter:', error);
      this.queue = null;
    }
  }

  async addJob(config: CrawlerConfig): Promise<string> {
    if (!this.queue) {
      logger.warn('Queue not available - returning synthetic job ID');
      return 'sync-' + Date.now();
    }
    
    const job = await this.queue.add('crawl', config, {
      removeOnComplete: true,
      removeOnFail: false,
    });
    return job.id?.toString() || '';
  }

  async getJobStatus(jobId: string): Promise<string> {
    if (!this.queue) {
      return 'not_available';
    }
    
    const job = await this.queue.getJob(jobId);
    if (!job) return 'not_found';
    return job.getState();
  }

  async getJobResult(jobId: string): Promise<any> {
    const job = await this.queue.getJob(jobId);
    if (!job) return null;
    return job.returnvalue;
  }

  async cancelJob(jobId: string): Promise<void> {
    const job = await this.queue.getJob(jobId);
    if (job) await job.remove();
  }
} 