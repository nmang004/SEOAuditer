import { QueueAdapter } from '../queue/QueueAdapter';
import { CrawlerConfig } from '../types/CrawlerConfig';

export class CrawlManager {
  constructor(private queueAdapter: QueueAdapter) {}

  async startCrawl(config: CrawlerConfig) {
    // Add job to queue, return job ID
  }

  async getStatus(jobId: string) {
    // Return job status/progress
  }

  async getResults(jobId: string) {
    // Return crawl results from storage
  }

  async cancelCrawl(jobId: string) {
    // Cancel job in queue
  }
} 