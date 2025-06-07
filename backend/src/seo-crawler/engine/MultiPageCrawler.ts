import { EventEmitter } from 'events';
import { URL } from 'url';
import * as cheerio from 'cheerio';
import { Logger } from '../../utils/logger';
import { PageAnalyzer } from './PageAnalyzer';
import { CrawlJob } from '../types/CrawlJob';
import { CrawlResult } from '../types/CrawlResult';
import { PageAnalysis } from '../types/PageAnalysis';

export interface CrawlConfiguration {
  crawlType: 'single' | 'subfolder' | 'domain';
  startUrl: string;
  depth: number;
  maxPages: number;
  filters: {
    includePatterns: string[];
    excludePatterns: string[];
    fileTypes: string[];
    respectRobotsTxt: boolean;
    followExternal: boolean;
    analyzeSubdomains: boolean;
  };
  performance: {
    concurrent: number;
    delayBetweenRequests: number;
    timeout: number;
  };
  analysis: {
    skipDuplicateContent: boolean;
    groupSimilarPages: boolean;
    priorityPages: string[];
  };
}

export interface CrawlProgress {
  sessionId: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  crawled: number;
  total: number;
  currentUrl: string;
  errors: number;
  pagesPerMinute: number;
  estimatedTimeRemaining: number;
  recentlyDiscovered: string[];
  startTime: Date;
}

export interface PrioritizedUrl {
  url: string;
  depth: number;
  priority: number;
  source: string;
  parentUrl?: string;
}

export interface CrawlResults {
  sessionId: string;
  config: CrawlConfiguration;
  pages: Map<string, PageAnalysis>;
  insights: CrossPageInsights;
  summary: CrawlSummary;
  errors: CrawlError[];
}

export interface CrossPageInsights {
  duplicateContent: DuplicateContentGroup[];
  orphanPages: string[];
  brokenLinks: BrokenLink[];
  siteStructure: SiteStructure;
  contentGaps: ContentGap[];
}

export interface DuplicateContentGroup {
  urls: string[];
  similarity: number;
  contentHash: string;
}

export interface BrokenLink {
  url: string;
  foundOn: string[];
  statusCode: number;
  error: string;
}

export interface SiteStructure {
  depth: number;
  totalPages: number;
  pagesByDepth: Record<number, number>;
  linkDensity: Record<string, number>;
}

export interface ContentGap {
  topic: string;
  missingPages: string[];
  opportunities: string[];
}

export interface CrawlSummary {
  totalPages: number;
  successfulPages: number;
  errorPages: number;
  avgScore: number;
  totalIssues: number;
  criticalIssues: number;
  duration: number;
}

export interface CrawlError {
  url: string;
  error: string;
  statusCode?: number;
  timestamp: Date;
}

class CrawlQueue {
  private queues: Map<number, PrioritizedUrl[]> = new Map();
  private visited: Set<string> = new Set();
  private processing: Set<string> = new Set();

  add(url: string, depth: number, parentUrl?: string, source: string = 'link'): void {
    if (this.visited.has(url) || this.processing.has(url)) {
      return;
    }

    const priority = this.calculatePriority(url, depth, source);
    const prioritizedUrl: PrioritizedUrl = {
      url,
      depth,
      priority,
      source,
      parentUrl
    };

    if (!this.queues.has(priority)) {
      this.queues.set(priority, []);
    }
    this.queues.get(priority)!.push(prioritizedUrl);
  }

  getNext(): PrioritizedUrl | null {
    const priorities = Array.from(this.queues.keys()).sort((a, b) => b - a);
    
    for (const priority of priorities) {
      const urls = this.queues.get(priority);
      if (urls && urls.length > 0) {
        const url = urls.shift()!;
        this.processing.add(url.url);
        return url;
      }
    }
    
    return null;
  }

  markVisited(url: string): void {
    this.visited.add(url);
    this.processing.delete(url);
  }

  markError(url: string): void {
    this.processing.delete(url);
  }

  isEmpty(): boolean {
    return Array.from(this.queues.values()).every(queue => queue.length === 0);
  }

  size(): number {
    return Array.from(this.queues.values()).reduce((total, queue) => total + queue.length, 0);
  }

  getVisitedCount(): number {
    return this.visited.size;
  }

  private calculatePriority(url: string, depth: number, source: string): number {
    let priority = 100 - (depth * 10);
    
    // Boost priority based on source
    switch (source) {
      case 'sitemap':
        priority += 30;
        break;
      case 'navigation':
        priority += 20;
        break;
      case 'content':
        priority += 10;
        break;
      case 'footer':
        priority -= 10;
        break;
    }
    
    // Boost priority for important pages
    if (url.includes('index') || url.endsWith('/')) priority += 20;
    if (url.includes('product') || url.includes('service')) priority += 10;
    if (url.includes('blog') || url.includes('article')) priority += 5;
    
    // Reduce priority for certain page types
    if (url.includes('tag') || url.includes('category')) priority -= 15;
    if (url.includes('search') || url.includes('filter')) priority -= 20;
    
    return Math.max(0, Math.min(100, priority));
  }
}

export class MultiPageCrawler extends EventEmitter {
  private queue: CrawlQueue;
  private results: Map<string, PageAnalysis> = new Map();
  private errors: CrawlError[] = [];
  private progress: CrawlProgress;
  private isRunning = false;
  private isPaused = false;
  private pageAnalyzer: PageAnalyzer;
  private logger = Logger.getInstance();
  private startTime: Date;
  private activeWorkers = 0;

  constructor(
    private config: CrawlConfiguration,
    private sessionId: string
  ) {
    super();
    this.queue = new CrawlQueue();
    this.pageAnalyzer = new PageAnalyzer();
    this.startTime = new Date();
    
    this.progress = {
      sessionId,
      status: 'running',
      crawled: 0,
      total: 0,
      currentUrl: '',
      errors: 0,
      pagesPerMinute: 0,
      estimatedTimeRemaining: 0,
      recentlyDiscovered: [],
      startTime: this.startTime
    };
  }

  async crawl(): Promise<CrawlResults> {
    this.logger.info(`Starting multi-page crawl for session ${this.sessionId}`);
    this.isRunning = true;
    
    try {
      // Add start URL to queue
      this.queue.add(this.config.startUrl, 0, undefined, 'start');
      
      // Start progress tracking
      this.startProgressTracking();
      
      // Process queue with concurrent workers
      const workers: Promise<void>[] = [];
      for (let i = 0; i < this.config.performance.concurrent; i++) {
        workers.push(this.worker(i));
      }
      
      await Promise.all(workers);
      
      // Generate cross-page insights
      const insights = await this.generateCrossPageInsights();
      
      // Create summary
      const summary = this.createSummary();
      
      this.progress.status = 'completed';
      this.emit('progress', this.progress);
      
      const results: CrawlResults = {
        sessionId: this.sessionId,
        config: this.config,
        pages: this.results,
        insights,
        summary,
        errors: this.errors
      };
      
      this.logger.info(`Crawl completed for session ${this.sessionId}. Analyzed ${this.results.size} pages.`);
      return results;
      
    } catch (error) {
      this.progress.status = 'failed';
      this.emit('progress', this.progress);
      this.emit('error', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  private async worker(workerId: number): Promise<void> {
    while (this.isRunning && !this.isPaused) {
      const urlItem = this.queue.getNext();
      if (!urlItem) {
        if (this.queue.isEmpty() && this.activeWorkers === 0) {
          break;
        }
        await this.wait(100);
        continue;
      }

      if (this.shouldSkipUrl(urlItem.url) || this.results.size >= this.config.maxPages) {
        this.queue.markVisited(urlItem.url);
        continue;
      }

      this.activeWorkers++;
      
      try {
        await this.processPage(urlItem);
      } catch (error) {
        this.handleCrawlError(urlItem.url, error as Error);
      } finally {
        this.activeWorkers--;
      }
    }
  }

  private async processPage(urlItem: PrioritizedUrl): Promise<void> {
    const { url, depth } = urlItem;
    
    this.logger.debug(`Processing page: ${url} (depth: ${depth})`);
    this.progress.currentUrl = url;
    this.updateProgress();
    
    try {
      // Analyze page
      const analysis = await this.pageAnalyzer.analyzePage(url);
      
      // Store results
      this.results.set(url, analysis);
      this.queue.markVisited(url);
      
      // Extract and queue new URLs if within depth
      if (depth < this.config.depth) {
        const newUrls = await this.extractUrls(analysis.html, url);
        const filtered = this.filterUrls(newUrls, url);
        
        for (const newUrl of filtered) {
          this.queue.add(newUrl.url, depth + 1, url, newUrl.source);
          this.progress.recentlyDiscovered.unshift(newUrl.url);
          if (this.progress.recentlyDiscovered.length > 10) {
            this.progress.recentlyDiscovered.pop();
          }
        }
      }
      
      // Update progress
      this.progress.crawled = this.queue.getVisitedCount();
      this.progress.total = this.queue.getVisitedCount() + this.queue.size();
      this.updateProgress();
      
      // Respect rate limiting
      await this.wait(this.config.performance.delayBetweenRequests);
      
    } catch (error) {
      this.handleCrawlError(url, error as Error);
    }
  }

  private async extractUrls(html: string, baseUrl: string): Promise<PrioritizedUrl[]> {
    const $ = cheerio.load(html);
    const urls: PrioritizedUrl[] = [];
    const baseUrlObj = new URL(baseUrl);
    
    // Extract from navigation
    $('nav a, header a, .navigation a').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const fullUrl = this.normalizeUrl(href, baseUrl);
        if (fullUrl) {
          urls.push({
            url: fullUrl,
            depth: 0, // Will be set by caller
            priority: 90,
            source: 'navigation'
          });
        }
      }
    });
    
    // Extract from main content
    $('main a, article a, .content a, .post a').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const fullUrl = this.normalizeUrl(href, baseUrl);
        if (fullUrl) {
          urls.push({
            url: fullUrl,
            depth: 0,
            priority: 70,
            source: 'content'
          });
        }
      }
    });
    
    // Extract from sitemap if available
    const sitemapLink = $('link[rel="sitemap"]').attr('href');
    if (sitemapLink) {
      try {
        const sitemapUrls = await this.fetchSitemap(this.normalizeUrl(sitemapLink, baseUrl)!);
        urls.push(...sitemapUrls.map(url => ({
          url,
          depth: 0,
          priority: 100,
          source: 'sitemap'
        })));
      } catch (error) {
        this.logger.warn(`Failed to fetch sitemap: ${sitemapLink}`);
      }
    }
    
    // Extract from footer (lower priority)
    $('footer a').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const fullUrl = this.normalizeUrl(href, baseUrl);
        if (fullUrl) {
          urls.push({
            url: fullUrl,
            depth: 0,
            priority: 50,
            source: 'footer'
          });
        }
      }
    });
    
    return this.deduplicateUrls(urls);
  }

  private normalizeUrl(href: string, baseUrl: string): string | null {
    try {
      const url = new URL(href, baseUrl);
      
      // Remove fragments
      url.hash = '';
      
      // Remove common query parameters
      const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'];
      paramsToRemove.forEach(param => url.searchParams.delete(param));
      
      return url.href;
    } catch {
      return null;
    }
  }

  private filterUrls(urls: PrioritizedUrl[], parentUrl: string): PrioritizedUrl[] {
    return urls.filter(urlItem => {
      const url = urlItem.url;
      
      try {
        const urlObj = new URL(url);
        const parentUrlObj = new URL(parentUrl);
        
        // Skip non-HTTP(S) URLs
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          return false;
        }
        
        // Apply domain restrictions
        if (!this.config.filters.followExternal) {
          if (urlObj.hostname !== parentUrlObj.hostname) {
            return false;
          }
        }
        
        // Apply subdomain restrictions
        if (!this.config.filters.analyzeSubdomains) {
          const parentDomain = parentUrlObj.hostname.split('.').slice(-2).join('.');
          const urlDomain = urlObj.hostname.split('.').slice(-2).join('.');
          if (urlDomain !== parentDomain) {
            return false;
          }
        }
        
        // Apply crawl type restrictions
        if (this.config.crawlType === 'subfolder') {
          const startUrlObj = new URL(this.config.startUrl);
          if (!urlObj.pathname.startsWith(startUrlObj.pathname)) {
            return false;
          }
        }
        
        // Apply include patterns
        if (this.config.filters.includePatterns.length > 0) {
          const included = this.config.filters.includePatterns.some(
            pattern => this.matchesPattern(url, pattern)
          );
          if (!included) return false;
        }
        
        // Apply exclude patterns
        if (this.config.filters.excludePatterns.length > 0) {
          const excluded = this.config.filters.excludePatterns.some(
            pattern => this.matchesPattern(url, pattern)
          );
          if (excluded) return false;
        }
        
        // Check file types
        const extension = urlObj.pathname.split('.').pop()?.toLowerCase();
        if (extension && this.config.filters.fileTypes.length > 0) {
          if (!this.config.filters.fileTypes.includes(extension)) {
            return false;
          }
        }
        
        return true;
      } catch {
        return false;
      }
    });
  }

  private matchesPattern(url: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(regexPattern);
    return regex.test(url);
  }

  private shouldSkipUrl(url: string): boolean {
    // Skip if already processed
    if (this.results.has(url)) {
      return true;
    }
    
    // Skip if matches exclude patterns
    if (this.config.filters.excludePatterns.some(pattern => this.matchesPattern(url, pattern))) {
      return true;
    }
    
    return false;
  }

  private async fetchSitemap(sitemapUrl: string): Promise<string[]> {
    // Implementation would fetch and parse XML sitemap
    // This is a simplified version
    try {
      const response = await fetch(sitemapUrl);
      const xml = await response.text();
      
      // Parse XML and extract URLs
      const urlRegex = /<loc>(.*?)<\/loc>/g;
      const urls: string[] = [];
      let match;
      
      while ((match = urlRegex.exec(xml)) !== null) {
        urls.push(match[1]);
      }
      
      return urls;
    } catch {
      return [];
    }
  }

  private deduplicateUrls(urls: PrioritizedUrl[]): PrioritizedUrl[] {
    const seen = new Set<string>();
    return urls.filter(urlItem => {
      if (seen.has(urlItem.url)) {
        return false;
      }
      seen.add(urlItem.url);
      return true;
    });
  }

  private handleCrawlError(url: string, error: Error): void {
    this.logger.error(`Error crawling ${url}: ${error.message}`);
    
    const crawlError: CrawlError = {
      url,
      error: error.message,
      timestamp: new Date()
    };
    
    this.errors.push(crawlError);
    this.progress.errors++;
    this.queue.markError(url);
    
    this.emit('error', crawlError);
  }

  private async generateCrossPageInsights(): Promise<CrossPageInsights> {
    // Analyze results for cross-page insights
    const duplicateContent = this.findDuplicateContent();
    const orphanPages = this.findOrphanPages();
    const brokenLinks = this.findBrokenLinks();
    const siteStructure = this.analyzeSiteStructure();
    const contentGaps = this.findContentGaps();
    
    return {
      duplicateContent,
      orphanPages,
      brokenLinks,
      siteStructure,
      contentGaps
    };
  }

  private findDuplicateContent(): DuplicateContentGroup[] {
    // Implementation would analyze content similarity
    // This is a simplified placeholder
    return [];
  }

  private findOrphanPages(): string[] {
    // Implementation would find pages with no internal links
    return [];
  }

  private findBrokenLinks(): BrokenLink[] {
    // Implementation would check for 404s and other errors
    return [];
  }

  private analyzeSiteStructure(): SiteStructure {
    const pagesByDepth: Record<number, number> = {};
    let maxDepth = 0;
    
    for (const [url, analysis] of this.results) {
      // This would need to track depth during crawling
      const depth = 0; // Placeholder
      pagesByDepth[depth] = (pagesByDepth[depth] || 0) + 1;
      maxDepth = Math.max(maxDepth, depth);
    }
    
    return {
      depth: maxDepth,
      totalPages: this.results.size,
      pagesByDepth,
      linkDensity: {}
    };
  }

  private findContentGaps(): ContentGap[] {
    // Implementation would analyze content topics and find gaps
    return [];
  }

  private createSummary(): CrawlSummary {
    const totalPages = this.results.size;
    const successfulPages = totalPages;
    const errorPages = this.errors.length;
    
    let totalIssues = 0;
    let criticalIssues = 0;
    let totalScore = 0;
    
    for (const [url, analysis] of this.results) {
      totalScore += analysis.seoScore;
      if (analysis.issues) {
        totalIssues += analysis.issues.length;
        criticalIssues += analysis.issues.filter(issue => issue.severity === 'high').length;
      }
    }
    
    const avgScore = totalPages > 0 ? Math.round(totalScore / totalPages) : 0;
    const duration = Date.now() - this.startTime.getTime();
    
    return {
      totalPages,
      successfulPages,
      errorPages,
      avgScore,
      totalIssues,
      criticalIssues,
      duration
    };
  }

  private startProgressTracking(): void {
    const interval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(interval);
        return;
      }
      
      this.updateProgress();
      this.emit('progress', this.progress);
    }, 1000);
  }

  private updateProgress(): void {
    const elapsed = Date.now() - this.startTime.getTime();
    const minutes = elapsed / (1000 * 60);
    
    this.progress.pagesPerMinute = minutes > 0 ? Math.round(this.progress.crawled / minutes) : 0;
    
    if (this.progress.pagesPerMinute > 0) {
      const remaining = this.progress.total - this.progress.crawled;
      this.progress.estimatedTimeRemaining = Math.round(remaining / this.progress.pagesPerMinute);
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  pause(): void {
    this.isPaused = true;
    this.progress.status = 'paused';
    this.emit('progress', this.progress);
  }

  resume(): void {
    this.isPaused = false;
    this.progress.status = 'running';
    this.emit('progress', this.progress);
  }

  stop(): void {
    this.isRunning = false;
    this.progress.status = 'completed';
    this.emit('progress', this.progress);
  }
}