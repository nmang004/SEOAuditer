import { Queue, Job, QueueEvents, Worker as BullWorker } from 'bullmq';
import { CrawlerConfig } from '../types/CrawlerConfig';
import { CrawlJob } from '../types/CrawlJob';

const connection = { host: 'localhost', port: 6379 }; // TODO: Use config/env

export class QueueAdapter {
  private queue: Queue;
  private queueEvents: QueueEvents;

  constructor() {
    this.queue = new Queue('seo-crawl', { connection });
    this.queueEvents = new QueueEvents('seo-crawl', { connection });
  }

  async addJob(config: CrawlerConfig): Promise<string> {
    const job = await this.queue.add('crawl', config, {
      removeOnComplete: true,
      removeOnFail: false,
    });
    return job.id;
  }

  async getJobStatus(jobId: string): Promise<string> {
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