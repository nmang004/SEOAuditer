import { CrawlerConfig } from '../types/CrawlerConfig';
import { StorageAdapter } from '../storage/StorageAdapter';
import { PageAnalyzer } from './PageAnalyzer';
import { WebSocketGateway } from '../ws/WebSocketGateway';
import { CrawlResult, PageAnalysis } from '../types/CrawlResult';
import { logger } from '../../utils/logger';

export class CrawlerEngine {
  private visited = new Set<string>();
  private queue: Array<{ url: string; depth: number }> = [];
  private results: PageAnalysis[] = [];
  private issues: any[] = [];
  private wsGateway = new WebSocketGateway();

  constructor(private config: CrawlerConfig, private storage: StorageAdapter) {}

  async crawl(): Promise<CrawlResult> {
    const { url, crawlOptions, projectId, userId } = this.config;
    const maxPages = crawlOptions.maxPages || 1;
    const maxDepth = crawlOptions.crawlDepth || 1;
    const crawlDelay = crawlOptions.crawlDelay || 500;
    const allowedDomains = crawlOptions.allowedDomains || [new URL(url).hostname];
    const excludePatterns = crawlOptions.excludePatterns || [];
    // TODO: robots.txt respect

    const jobId = (this.config as any).jobId || '';
    logger.info(`Crawl started for job ${jobId} (project: ${projectId}) at ${url}`);
    this.queue.push({ url, depth: 0 });
    let pageCount = 0;

    while (this.queue.length > 0 && pageCount < maxPages) {
      const { url: currentUrl, depth } = this.queue.shift()!;
      if (this.visited.has(currentUrl) || depth > maxDepth) continue;
      if (!this.isAllowed(currentUrl, allowedDomains, excludePatterns)) continue;
      this.visited.add(currentUrl);
      pageCount++;

      // Analyze the page
      const analyzer = new PageAnalyzer(this.config);
      try {
        logger.info(`Analyzing page: ${currentUrl}`);
        const pageResult = await analyzer.analyzePage(currentUrl);
        this.results.push(pageResult);
        // Aggregate issues if present
        if (pageResult.seoIssues) this.issues.push(...(pageResult.seoIssues as any[]));
        // Emit page complete only if analysis succeeded
        this.wsGateway.emitCompleted(jobId, pageResult);
        // Extract and enqueue internal links (BFS)
        if (pageResult.links && pageResult.links.internal) {
          for (const link of pageResult.links.internal) {
            if (!this.visited.has(link) && this.queue.length + pageCount < maxPages) {
              this.queue.push({ url: link, depth: depth + 1 });
            }
          }
        }
      } catch (err) {
        logger.error(`Error analyzing page ${currentUrl}: ${(err as Error)?.message || err}`);
        // Optionally, push error as a result
        this.issues.push({ url: currentUrl, error: (err as Error)?.message || String(err) });
      }

      // Emit progress
      this.wsGateway.emitProgress(jobId, {
        percentage: (pageCount / maxPages) * 100,
        stage: 'crawling',
        details: `Analyzing page ${pageCount}/${maxPages}: ${currentUrl}`,
      });

      // Respect crawl delay
      if (this.queue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, crawlDelay));
      }
    }

    logger.info(`Crawl complete for job ${jobId} (project: ${projectId}). Pages: ${this.results.length}, Issues: ${this.issues.length}`);
    // Emit completion
    this.wsGateway.emitCompleted(jobId, {
      pages: this.results,
      issues: this.issues,
    });

    // Save result
    const crawlResult: CrawlResult = {
      jobId,
      projectId,
      userId,
      startedAt: new Date(),
      completedAt: new Date(),
      pages: this.results,
      issues: this.issues,
      recommendations: [], // TODO: fill from modules
      score: undefined,
    };
    await this.storage.saveResult(jobId, crawlResult);
    return crawlResult;
  }

  private isAllowed(url: string, allowedDomains: string[], excludePatterns: string[]): boolean {
    try {
      const hostname = new URL(url).hostname;
      if (!allowedDomains.includes(hostname)) return false;
      for (const pattern of excludePatterns) {
        if (url.includes(pattern)) return false;
      }
      return true;
    } catch {
      return false;
    }
  }
} 