import { QueueAdapter } from '../queue/QueueAdapter';
import { CrawlerConfig } from '../types/CrawlerConfig';

export class CrawlManager {
  constructor(_queueAdapter: QueueAdapter) {}

  async startCrawl(_config: CrawlerConfig) {
    // TODO: Implement real logic
    return 'mock-job-id-' + Date.now();
  }

  async getStatus(_jobId: string) {
    // Return job status/progress
    return null;
  }

  async getResults(_jobId: string) {
    // Return crawl results from storage
    return null;
  }

  async cancelCrawl(_jobId: string) {
    // Cancel job in queue
    return null;
  }
} 