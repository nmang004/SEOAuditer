import { QueueAdapter } from './QueueAdapter';
import { Worker as BullWorker, Job } from 'bullmq';
import { CrawlerEngine } from '../engine/CrawlerEngine';
import { StorageAdapter } from '../storage/StorageAdapter';
import { WebSocketGateway } from '../ws/WebSocketGateway';
import { logger } from '../../utils/logger';

const connection = { host: 'localhost', port: 6379 }; // TODO: Use config/env

// In-memory metrics
const metrics = {
  jobsStarted: 0,
  jobsCompleted: 0,
  jobsFailed: 0,
  jobsCancelled: 0,
  lastError: null as null | string,
};

export function getWorkerMetrics() {
  return { ...metrics };
}

export class Worker {
  private bullWorker: BullWorker;
  private wsGateway = new WebSocketGateway();

  constructor(_queueAdapter: QueueAdapter) {
    this.bullWorker = new BullWorker('seo-crawl', async (job: Job) => {
      logger.info(`Starting crawl job ${job.id}`);
      metrics.jobsStarted++;
      // Instantiate storage and engine
      const storage = new StorageAdapter();
      const engine = new CrawlerEngine(job.data, storage);
      // Run crawl
      const result = await engine.crawl();
      // Save result (optional, could be handled by engine)
      await storage.saveResult(job.id ?? '', result);
      return result;
    }, { connection });
  }

  async start() {
    // Worker starts automatically on instantiation
    // Optionally, add event listeners for logging, errors, etc.
    this.bullWorker.on('completed', (job: Job) => {
      logger.info(`Job ${job.id} completed.`);
      metrics.jobsCompleted++;
    });
    this.bullWorker.on('failed', (job: Job | undefined, err: any) => {
      logger.error(`Job ${job?.id} failed: ${err?.message || err}`);
      metrics.jobsFailed++;
      metrics.lastError = err?.message || String(err);
      if (job?.id) {
        this.wsGateway.emitError(job.id.toString(), err?.message || err);
      }
    });
    this.bullWorker.on('removed' as any, (job: Job) => {
      logger.warn(`Job ${job?.id} was cancelled/removed.`);
      metrics.jobsCancelled++;
      if (job?.id) {
        this.wsGateway.emitCancelled(job.id.toString());
      }
    });
  }
} 