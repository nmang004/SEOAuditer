import { QueueAdapter } from '../queue/QueueAdapter';
import { CrawlerConfig } from '../types/CrawlerConfig';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface CrawlJob {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  config: CrawlerConfig;
  progress: number;
  results?: any;
  error?: string;
}

export class CrawlManager {
  private jobs: Map<string, CrawlJob> = new Map();

  constructor(_queueAdapter: QueueAdapter) {
    // QueueAdapter will be used in future iterations
  }

  private getDefaultConfig(url: string, projectId: string, userId: string): CrawlerConfig {
    return {
      url,
      projectId,
      userId,
      crawlOptions: {
        maxPages: 5,
        crawlDepth: 2,
        respectRobots: true,
        crawlDelay: 1000,
        userAgent: 'RivalOutranker SEO Analyzer/1.0',
        timeout: 30000,
        retryAttempts: 3,
        viewport: { width: 1200, height: 800, deviceType: 'desktop' },
        extractOptions: {
          screenshots: false,
          performanceMetrics: true,
          accessibilityCheck: true,
          structuredData: true,
          socialMetaTags: true,
          technicalSEO: true,
          contentAnalysis: true,
          linkAnalysis: true,
          imageAnalysis: true,
          mobileOptimization: true,
        },
        blockResources: ['font', 'image'],
        allowedDomains: [],
        excludePatterns: [],
      },
    };
  }

  private async simpleAnalyze(url: string) {
    try {
      const response = await axios.get<string>(url, {
        headers: {
          'User-Agent': 'RivalOutranker SEO Analyzer/1.0',
        },
        timeout: 30000,
        validateStatus: (status) => status < 500,
      });

      const $ = cheerio.load(response.data);
      
      // Basic SEO analysis
      const title = $('title').text().trim();
      const metaDescription = $('meta[name="description"]').attr('content') || '';
      const metaKeywords = $('meta[name="keywords"]').attr('content') || '';
      const h1Count = $('h1').length;
      const imgWithoutAlt = $('img:not([alt])').length;
      const internalLinks = $('a[href^="/"], a[href*="' + new URL(url).hostname + '"]').length;
      const externalLinks = $('a[href^="http"]:not([href*="' + new URL(url).hostname + '"])').length;

      // Calculate basic scores
      let titleScore = title ? (title.length > 10 && title.length < 60 ? 100 : 70) : 0;
      let descScore = metaDescription ? (metaDescription.length > 120 && metaDescription.length < 160 ? 100 : 70) : 0;
      let h1Score = h1Count === 1 ? 100 : (h1Count > 1 ? 50 : 0);
      let altScore = imgWithoutAlt === 0 ? 100 : Math.max(0, 100 - (imgWithoutAlt * 10));

      const technicalScore = Math.round((titleScore + descScore + h1Score + altScore) / 4);
      const contentScore = Math.round((titleScore + descScore) / 2);
      const overallScore = Math.round((technicalScore + contentScore) / 2);

      // Generate issues
      const issues = [];
      if (!title) issues.push({ type: 'missing_title', severity: 'high', message: 'Page is missing a title tag' });
      if (!metaDescription) issues.push({ type: 'missing_meta_description', severity: 'medium', message: 'Page is missing a meta description' });
      if (h1Count === 0) issues.push({ type: 'missing_h1', severity: 'high', message: 'Page is missing an H1 tag' });
      if (h1Count > 1) issues.push({ type: 'multiple_h1', severity: 'medium', message: 'Page has multiple H1 tags' });
      if (imgWithoutAlt > 0) issues.push({ type: 'images_without_alt', severity: 'medium', message: `${imgWithoutAlt} images are missing alt text` });

      // Generate recommendations  
      const recommendations = [];
      if (title && title.length > 60) recommendations.push('Shorten the title tag to under 60 characters');
      if (metaDescription && metaDescription.length > 160) recommendations.push('Shorten the meta description to under 160 characters');
      if (internalLinks < 3) recommendations.push('Add more internal links to improve site structure');

      return {
        url,
        statusCode: response.status,
        metadata: {
          title,
          description: metaDescription,
          keywords: metaKeywords
        },
        scores: {
          overall: overallScore,
          technical: technicalScore,
          content: contentScore,
          onpage: Math.round((technicalScore + contentScore) / 2),
          ux: 75 // Default for now
        },
        stats: {
          h1Count,
          imgWithoutAlt,
          internalLinks,
          externalLinks
        },
        issues,
        recommendations
      };

    } catch (error) {
      console.error('Analysis failed:', error);
      return {
        url,
        statusCode: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        scores: { overall: 0, technical: 0, content: 0, onpage: 0, ux: 0 },
        issues: [{ type: 'crawl_failed', severity: 'high', message: 'Failed to crawl the website' }],
        recommendations: ['Check if the website is accessible and try again']
      };
    }
  }

  async startCrawl(config: CrawlerConfig): Promise<string> {
    const jobId = 'crawl-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    // Merge provided config with defaults
    const url = config.url;
    const fullConfig: CrawlerConfig = {
      ...this.getDefaultConfig(url, config.projectId, config.userId),
      ...config
    };
    
    const job: CrawlJob = {
      id: jobId,
      status: 'pending',
      startedAt: new Date(),
      config: fullConfig,
      progress: 0
    };

    this.jobs.set(jobId, job);

    // Start crawling in the background
    this.performCrawl(jobId).catch(error => {
      console.error(`Crawl job ${jobId} failed:`, error);
      const job = this.jobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.error = error.message;
        job.completedAt = new Date();
      }
    });

    return jobId;
  }

  private async performCrawl(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'in_progress';
      job.progress = 10;

      const url = job.config.url;
      if (!url) {
        throw new Error('No URL provided in crawl config');
      }

      console.log(`Starting crawl for URL: ${url}`);

      // Simulate progress updates
      job.progress = 30;

      // Perform simple analysis
      const analysisResult = await this.simpleAnalyze(url);
      
      job.progress = 70;

      // Create comprehensive results
      const results = {
        url: url,
        crawledAt: new Date().toISOString(),
        pages: [
          {
            status: analysisResult.statusCode || 200,
            title: analysisResult.metadata?.title || 'Untitled Page',
            description: analysisResult.metadata?.description || '',
            ...analysisResult
          }
        ],
        summary: {
          totalPages: 1,
          crawlDuration: Date.now() - job.startedAt.getTime(),
          overallScore: analysisResult.scores?.overall || 75,
          technicalScore: analysisResult.scores?.technical || 80,
          contentScore: analysisResult.scores?.content || 70,
          onpageScore: analysisResult.scores?.onpage || 75,
          uxScore: analysisResult.scores?.ux || 80
        },
        issues: analysisResult.issues || [],
        recommendations: analysisResult.recommendations || []
      };

      job.progress = 100;
      job.status = 'completed';
      job.completedAt = new Date();
      job.results = results;

      console.log(`Crawl completed for URL: ${url}`);

    } catch (error) {
      console.error(`Crawl failed for job ${jobId}:`, error);
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();
    }
  }

  async getStatus(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return null;
    }

    return {
      status: job.status,
      progress: job.progress,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      error: job.error
    };
  }

  async getResults(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return null;
    }

    return job.results || null;
  }

  async cancelCrawl(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return null;
    }

    if (job.status === 'pending' || job.status === 'in_progress') {
      job.status = 'cancelled';
      job.completedAt = new Date();
    }

    return { status: job.status };
  }
} 