import { performance } from 'perf_hooks';

export interface CoreWebVitals {
  LCP: number;  // Largest Contentful Paint (ms)
  FID: number;  // First Input Delay (ms) 
  CLS: number;  // Cumulative Layout Shift (score)
  FCP: number;  // First Contentful Paint (ms)
  TTFB: number; // Time to First Byte (ms)
  SI: number;   // Speed Index
  TTI: number;  // Time to Interactive (ms)
}

export interface PerformanceMetrics {
  performanceScore: number;      // 0-100 Lighthouse score
  accessibilityScore: number;    // 0-100 Accessibility score
  bestPracticesScore: number;    // 0-100 Best Practices score
  seoScore: number;             // 0-100 SEO score
  pwaScore: number;             // 0-100 PWA score
  coreWebVitals: CoreWebVitals;
  loadTime: number;             // Total load time (ms)
  pageSize: number;             // Total page size (bytes)
  requestCount: number;         // Number of network requests
  optimizationOpportunities: OptimizationOpportunity[];
  diagnostics: PerformanceDiagnostic[];
}

export interface OptimizationOpportunity {
  id: string;
  title: string;
  description: string;
  score: number;
  scoreDisplayMode: string;
  details: any;
  potential: {
    fcp: number;
    lcp: number;
  };
}

export interface PerformanceDiagnostic {
  id: string;
  title: string;
  description: string;
  score: number;
  scoreDisplayMode: string;
  details: any;
}

export class LighthouseService {
  private static instance: LighthouseService;
  private chromeFlags = [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',
    '--no-first-run',
    '--disable-default-apps',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows'
  ];

  public static getInstance(): LighthouseService {
    if (!LighthouseService.instance) {
      LighthouseService.instance = new LighthouseService();
    }
    return LighthouseService.instance;
  }

  async analyzePerformance(url: string, options?: {
    mobile?: boolean;
    timeout?: number;
    throttling?: string;
  }): Promise<PerformanceMetrics> {
    const startTime = performance.now();
    let chrome;

    try {
      console.log(`[Lighthouse] Starting performance analysis for: ${url}`);

      // Dynamic import for chrome-launcher (ES module)
      const chromeLauncher = await import('chrome-launcher');
      
      // Launch Chrome
      chrome = await chromeLauncher.launch({
        chromeFlags: this.chromeFlags,
        logLevel: 'info'
      });

      // Configure Lighthouse options
      const lighthouseOptions = {
        logLevel: 'info' as const,
        output: 'json' as const,
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
        port: chrome.port,
        preset: options?.mobile !== false ? 'perf' : 'desktop',
        formFactor: options?.mobile !== false ? 'mobile' as const : 'desktop' as const,
        screenEmulation: options?.mobile !== false ? {
          mobile: true,
          width: 375,
          height: 812,
          deviceScaleFactor: 3,
          disabled: false,
        } : {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        }
      };

      // Run Lighthouse audit
      console.log(`[Lighthouse] Running audit with ${lighthouseOptions.formFactor} settings...`);
      
      // Dynamic import for ES module compatibility
      const { default: lighthouse } = await import('lighthouse');
      const runnerResult = await lighthouse(url, lighthouseOptions);

      if (!runnerResult?.lhr) {
        throw new Error('Lighthouse analysis failed - no report generated');
      }

      const lhr = runnerResult.lhr;
      const analysisTime = performance.now() - startTime;

      console.log(`[Lighthouse] Analysis completed in ${Math.round(analysisTime)}ms`);
      console.log(`[Lighthouse] Performance score: ${(lhr.categories.performance?.score || 0) * 100}`);

      // Extract performance metrics
      const performanceMetrics = this.extractPerformanceMetrics(lhr);

      return performanceMetrics;

    } catch (error: any) {
      console.error('[Lighthouse] Analysis failed:', error);
      throw new Error(`Lighthouse analysis failed: ${error?.message || 'Unknown error'}`);
    } finally {
      if (chrome) {
        await chrome.kill();
      }
    }
  }

  private extractPerformanceMetrics(lhr: any): PerformanceMetrics {
    // Extract Core Web Vitals
    const coreWebVitals = this.extractCoreWebVitals(lhr);

    // Extract category scores
    const performanceScore = Math.round((lhr.categories.performance?.score || 0) * 100);
    const accessibilityScore = Math.round((lhr.categories.accessibility?.score || 0) * 100);
    const bestPracticesScore = Math.round((lhr.categories['best-practices']?.score || 0) * 100);
    const seoScore = Math.round((lhr.categories.seo?.score || 0) * 100);
    const pwaScore = Math.round((lhr.categories.pwa?.score || 0) * 100);

    // Extract resource metrics
    const loadTime = lhr.audits['speed-index']?.numericValue || 0;
    const pageSize = this.calculatePageSize(lhr);
    const requestCount = lhr.audits['network-requests']?.details?.items?.length || 0;

    // Extract optimization opportunities
    const optimizationOpportunities = this.extractOptimizationOpportunities(lhr);

    // Extract diagnostics
    const diagnostics = this.extractDiagnostics(lhr);

    return {
      performanceScore,
      accessibilityScore,
      bestPracticesScore,
      seoScore,
      pwaScore,
      coreWebVitals,
      loadTime: Math.round(loadTime),
      pageSize: Math.round(pageSize),
      requestCount,
      optimizationOpportunities,
      diagnostics
    };
  }

  private extractCoreWebVitals(lhr: any): CoreWebVitals {
    const audits = lhr.audits;

    return {
      LCP: Math.round(audits['largest-contentful-paint']?.numericValue || 0),
      FID: Math.round(audits['max-potential-fid']?.numericValue || 0), // Use max-potential-fid as proxy
      CLS: parseFloat((audits['cumulative-layout-shift']?.numericValue || 0).toFixed(3)),
      FCP: Math.round(audits['first-contentful-paint']?.numericValue || 0),
      TTFB: Math.round(audits['server-response-time']?.numericValue || 0),
      SI: Math.round(audits['speed-index']?.numericValue || 0),
      TTI: Math.round(audits['interactive']?.numericValue || 0)
    };
  }

  private calculatePageSize(lhr: any): number {
    const resourceSummary = lhr.audits['resource-summary'];
    if (resourceSummary?.details?.items) {
      return resourceSummary.details.items.reduce((total: number, item: any) => {
        return total + (item.transferSize || 0);
      }, 0);
    }
    return 0;
  }

  private extractOptimizationOpportunities(lhr: any): OptimizationOpportunity[] {
    const opportunities = [];
    const audits = lhr.audits;

    // Key opportunity audits to extract
    const opportunityAudits = [
      'unused-css-rules',
      'unused-javascript',
      'modern-image-formats',
      'offscreen-images',
      'render-blocking-resources',
      'unminified-css',
      'unminified-javascript',
      'efficient-animated-content',
      'uses-text-compression',
      'uses-responsive-images',
      'uses-optimized-images',
      'uses-webp-images',
      'uses-rel-preconnect',
      'uses-rel-preload',
      'font-display',
      'critical-request-chains'
    ];

    for (const auditId of opportunityAudits) {
      const audit = audits[auditId];
      if (audit && audit.score !== null && audit.score < 1) {
        opportunities.push({
          id: auditId,
          title: audit.title,
          description: audit.description,
          score: audit.score,
          scoreDisplayMode: audit.scoreDisplayMode,
          details: audit.details,
          potential: {
            fcp: audit.metricSavings?.FCP || 0,
            lcp: audit.metricSavings?.LCP || 0
          }
        });
      }
    }

    return opportunities.sort((a, b) => a.score - b.score); // Sort by impact (lower score = higher impact)
  }

  private extractDiagnostics(lhr: any): PerformanceDiagnostic[] {
    const diagnostics = [];
    const audits = lhr.audits;

    // Key diagnostic audits to extract
    const diagnosticAudits = [
      'mainthread-work-breakdown',
      'bootup-time',
      'uses-long-cache-ttl',
      'total-byte-weight',
      'dom-size',
      'critical-request-chains',
      'user-timings',
      'screenshot-thumbnails',
      'final-screenshot',
      'largest-contentful-paint-element',
      'layout-shift-elements',
      'long-tasks',
      'no-unload-listeners',
      'third-party-summary',
      'third-party-facades',
      'lcp-lazy-loaded',
      'layout-shift-elements'
    ];

    for (const auditId of diagnosticAudits) {
      const audit = audits[auditId];
      if (audit && audit.score !== null) {
        diagnostics.push({
          id: auditId,
          title: audit.title,
          description: audit.description,
          score: audit.score,
          scoreDisplayMode: audit.scoreDisplayMode,
          details: audit.details
        });
      }
    }

    return diagnostics;
  }

  // Method to get performance insights and recommendations
  getPerformanceInsights(metrics: PerformanceMetrics): {
    insights: string[];
    recommendations: string[];
    criticalIssues: string[];
  } {
    const insights = [];
    const recommendations = [];
    const criticalIssues = [];

    // Analyze Core Web Vitals
    if (metrics.coreWebVitals.LCP > 2500) {
      criticalIssues.push('Largest Contentful Paint is too slow (>2.5s)');
      recommendations.push('Optimize server response times and reduce render-blocking resources');
    } else if (metrics.coreWebVitals.LCP > 1200) {
      insights.push('Largest Contentful Paint needs improvement (>1.2s)');
    }

    if (metrics.coreWebVitals.FID > 100) {
      criticalIssues.push('First Input Delay is too high (>100ms)');
      recommendations.push('Reduce JavaScript execution time and remove unused code');
    }

    if (metrics.coreWebVitals.CLS > 0.25) {
      criticalIssues.push('Cumulative Layout Shift score is poor (>0.25)');
      recommendations.push('Ensure images and ads have defined dimensions');
    } else if (metrics.coreWebVitals.CLS > 0.1) {
      insights.push('Cumulative Layout Shift could be improved (>0.1)');
    }

    // Analyze overall performance
    if (metrics.performanceScore < 50) {
      criticalIssues.push(`Performance score is very low (${metrics.performanceScore}/100)`);
    } else if (metrics.performanceScore < 75) {
      insights.push(`Performance score needs improvement (${metrics.performanceScore}/100)`);
    }

    // Analyze page size
    if (metrics.pageSize > 3000000) { // 3MB
      recommendations.push('Page size is large - consider image optimization and code splitting');
    }

    return { insights, recommendations, criticalIssues };
  }
} 