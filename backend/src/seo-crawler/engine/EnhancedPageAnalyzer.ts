import axios from 'axios';
import * as cheerio from 'cheerio';
import { CrawlerConfig } from '../types/CrawlerConfig';
import { PageAnalysis } from '../types/PageAnalysis';
import { TechnicalSEO } from './AnalysisModules/TechnicalSEO';
import { OnPageSEO } from './AnalysisModules/OnPageSEO';
import { ContentQuality } from './AnalysisModules/ContentQuality';
import { StructuredData } from './AnalysisModules/StructuredData';
import { Recommendations } from './AnalysisModules/Recommendations';
import { EnhancedScoring } from './AnalysisModules/EnhancedScoring';
import { EnhancedContentAnalyzer } from './AnalysisModules/EnhancedContentAnalyzer';
import { EnhancedIssueDetection } from './AnalysisModules/EnhancedIssueDetection';
import { StorageAdapter } from '../storage/StorageAdapter';
import { logger } from '../../utils/logger';
import { JobProgress } from '../queue/EnhancedQueueAdapter';

let puppeteer: typeof import('puppeteer') | undefined;
let lighthouse: typeof import('lighthouse') | undefined;
let stealth: any | undefined;
let puppeteerExtra: any | undefined;

try {
  puppeteer = require('puppeteer');
  lighthouse = require('lighthouse');
  puppeteerExtra = require('puppeteer-extra');
  stealth = require('puppeteer-extra-plugin-stealth');
  
  // Configure puppeteer-extra with stealth plugin
  if (puppeteerExtra && stealth) {
    puppeteerExtra.use(stealth());
  }
} catch (error) {
  logger.warn('Optional dependencies not available:', error);
}

export interface EnhancedPageAnalysis extends PageAnalysis {
  // Enhanced analysis results
  scoreBreakdown?: any;
  contentAnalysis?: any;
  categorizedIssues?: any;
  detailedRecommendations?: any;
  performanceMetrics?: any;
  technicalAnalysis?: any;
  trends?: any;
  benchmarks?: any;
}

export interface AnalysisConfig extends CrawlerConfig {
  jobId?: string;
  onProgress?: (progress: JobProgress) => void;
}

export class EnhancedPageAnalyzer {
  private enhancedScoring: EnhancedScoring;
  private contentAnalyzer: EnhancedContentAnalyzer;
  private issueDetector: EnhancedIssueDetection;
  private progressCallback?: (progress: JobProgress) => void;
  
  constructor(private config: AnalysisConfig) {
    this.enhancedScoring = new EnhancedScoring();
    this.contentAnalyzer = new EnhancedContentAnalyzer();
    this.issueDetector = new EnhancedIssueDetection();
    this.progressCallback = config.onProgress;
  }

  private async updateProgress(progress: JobProgress): Promise<void> {
    if (this.progressCallback) {
      try {
        await this.progressCallback(progress);
      } catch (error) {
        logger.debug('Progress callback error:', error);
      }
    }
  }

  async analyzePage(url: string, previousScore?: number): Promise<EnhancedPageAnalysis> {
    const usePuppeteer =
      (this.config.crawlOptions.extractOptions.screenshots ||
        this.config.crawlOptions.extractOptions.performanceMetrics) &&
      puppeteer;
    
    let html = '';
    let response: any = undefined;
    let screenshot: Buffer | undefined = undefined;
    let screenshotPath: string | undefined = undefined;
    let browser: any = undefined;
    let page: any = undefined;
    let lighthouseMetrics: any = undefined;
    let coreWebVitals: any = undefined;
    const storage = new StorageAdapter();
    
    try {
      // Phase 1: Page Loading and Data Extraction
      logger.info(`[Enhanced Analyzer] Starting comprehensive analysis for: ${url}`);
      await this.updateProgress({
        percentage: 15,
        stage: 'loading_page',
        details: 'Loading page and extracting data',
      });
      
      if (usePuppeteer) {
        const pageData = await this.loadPageWithEnhancedPuppeteer(url, storage);
        html = pageData.html;
        response = pageData.response;
        screenshot = pageData.screenshot;
        screenshotPath = pageData.screenshotPath;
        browser = pageData.browser;
        page = pageData.page;
        lighthouseMetrics = pageData.lighthouseMetrics;
        coreWebVitals = pageData.coreWebVitals;
      } else {
        const pageData = await this.loadPageWithAxios(url);
        html = pageData.html;
        response = pageData.response;
      }

      const $ = cheerio.load(html);
      
      // Phase 2: Basic Analysis (using existing modules)
      logger.info('[Enhanced Analyzer] Running basic analysis modules...');
      await this.updateProgress({
        percentage: 35,
        stage: 'basic_analysis',
        details: 'Running technical and on-page analysis',
      });
      
      const pageContext = { 
        url, 
        html, 
        $, 
        response, 
        config: this.config, 
        browser, 
        page, 
        screenshot, 
        lighthouseMetrics,
        coreWebVitals
      };

      const basicAnalyses = await this.runBasicAnalysis(pageContext);
      
      // Phase 3: Enhanced Analysis
      logger.info('[Enhanced Analyzer] Running enhanced analysis modules...');
      await this.updateProgress({
        percentage: 65,
        stage: 'enhanced_analysis',
        details: 'Running advanced content and scoring analysis',
      });
      
      const enhancedResults = await this.runEnhancedAnalysis(pageContext, basicAnalyses, previousScore);

      // Phase 4: Aggregate and Structure Results
      logger.info('[Enhanced Analyzer] Aggregating results...');
      await this.updateProgress({
        percentage: 85,
        stage: 'aggregating_results',
        details: 'Finalizing analysis results',
      });
      
      const finalResults = this.aggregateResults(
        url,
        response,
        basicAnalyses,
        enhancedResults,
        { screenshotPath, lighthouseMetrics, coreWebVitals }
      );

      if (browser) await browser.close();
      
      logger.info(`[Enhanced Analyzer] Analysis complete for: ${url}`);
      return finalResults;

    } catch (error: any) {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          logger.error('Error closing browser:', closeError);
        }
      }
      logger.error(`[Enhanced Analyzer] Error analyzing ${url}:`, error);
      
      // Fallback analysis
      return await this.fallbackAnalysis(url, error);
    }
  }

  private async loadPageWithEnhancedPuppeteer(url: string, storage: StorageAdapter) {
    logger.info('[Enhanced Analyzer] Loading page with Enhanced Puppeteer...');
    
    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=site-per-process',
        '--window-size=1200,800',
        '--remote-debugging-port=9222',
        // Performance optimizations
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-client-side-phishing-detection',
        '--disable-ipc-flooding-protection',
        '--disable-sync',
        '--disable-translate',
        '--disable-extensions',
        '--disable-default-apps',
        '--disable-component-extensions-with-background-pages',
        '--disable-background-mode',
        '--disable-plugins',
        '--disable-plugins-discovery',
        '--disable-preconnect',
        '--disable-hang-monitor',
        '--disable-prompt-on-repost',
        '--disable-domain-reliability',
        '--disable-component-update',
        '--disable-background-downloads',
        '--disable-add-to-shelf',
        '--disable-client-side-phishing-detection',
        '--disable-datasaver-prompt',
        '--disable-desktop-notifications',
        '--disable-device-discovery-notifications',
        '--disable-dinosaur-easter-egg',
        '--disable-domain-reliability',
        '--disable-features=TranslateUI',
        '--disable-file-system',
        '--disable-notifications',
        '--disable-offer-store-unmasked-wallet-cards',
        '--disable-offer-upload-credit-cards',
        '--disable-password-generation',
        '--disable-permissions-api',
        '--disable-plugins',
        '--disable-print-preview',
        '--disable-speech-api',
        '--disable-tab-for-desktop-share',
        '--disable-voice-input',
        '--disable-wake-on-wifi',
        '--enable-async-dns',
        '--enable-simple-cache-backend',
        '--enable-tcp-fast-open',
        '--enable-experimental-canvas-features',
        '--enable-experimental-web-platform-features',
        '--max_old_space_size=4096',
        '--aggressive-cache-discard',
        '--memory-pressure-off',
        '--max_semi_space_size=1',
        '--initial_old_space_size=1',
        '--max_executable_size=1',
        '--optimize-for-size',
        // Enhanced stealth and security
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        // Memory and performance improvements
        '--memory-pressure-off',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--no-zygote',
        '--single-process', // Use with caution - can help with memory but may cause issues
      ],
      ignoreDefaultArgs: ['--enable-automation'],
      ignoreHTTPSErrors: true,
      defaultViewport: {
        width: 1200,
        height: 800,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        isLandscape: true,
      },
      // Enhanced timeout settings
      timeout: 30000,
    };

    let browser;
    let page;
    let html = '';
    let response;
    let screenshot;
    let screenshotPath;
    let lighthouseMetrics;
    let coreWebVitals;

    try {
      // Use puppeteer-extra with stealth if available, otherwise fallback to regular puppeteer
      const puppeteerToUse = (puppeteerExtra && stealth) ? puppeteerExtra : puppeteer;
      
      if (!puppeteerToUse) {
        throw new Error('Puppeteer not available');
      }
      
      logger.info(`Using ${puppeteerExtra && stealth ? 'stealth-enhanced' : 'standard'} Puppeteer`);
      browser = await puppeteerToUse.launch(launchOptions);
      
      page = await browser.newPage();

      // Enhanced stealth measures
      await page.evaluateOnNewDocument(() => {
        // Remove webdriver property
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });

        // Mock chrome runtime with proper typing
        (window as any).chrome = {
          runtime: {},
        };

        // Mock notification permissions
        Object.defineProperty(navigator, 'permissions', {
          get: () => ({
            query: () => Promise.resolve({ state: 'granted' }),
          }),
        });

        // Mock plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });

        // Mock languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
      });

      // Enhanced headers and viewport
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-User': '?1',
        'Sec-Fetch-Dest': 'document',
      });

      // Configure viewport and device metrics
      await page.setViewport({
        width: 1200,
        height: 800,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        isLandscape: true,
      });

      // Enhanced resource blocking for performance and stealth
      const blockedResourceTypes = this.config.crawlOptions?.blockResources || ['font', 'media', 'other'];
      const blockedUrls = [
        'googlesyndication.com',
        'googletagmanager.com',
        'google-analytics.com',
        'googleadservices.com',
        'googletag',
        'facebook.com/tr',
        'connect.facebook.net',
        'hotjar.com',
        'mouseflow.com',
        'crazyegg.com',
        'clarity.ms',
        'fullstory.com',
        'logrocket.com',
        'segment.com',
        'mixpanel.com',
        'amplitude.com',
        'intercom.io',
        'zendesk.com',
        'tawk.to',
        'livechatinc.com',
        'drift.com',
        'olark.com',
        'zopim.com',
        // Additional analytics and tracking services
        'doubleclick.net',
        'adsystem.com',
        'quantserve.com',
        'scorecardresearch.com',
        'outbrain.com',
        'taboola.com',
        'addthis.com',
        'sharethis.com',
      ];

      await page.setRequestInterception(true);
      page.on('request', (request: any) => {
        const resourceType = request.resourceType();
        const url = request.url();
        
        // Block unwanted resource types
        if (blockedResourceTypes.includes(resourceType)) {
          request.abort();
          return;
        }
        
        // Block tracking and analytics scripts
        if (blockedUrls.some(blockedUrl => url.includes(blockedUrl))) {
          request.abort();
          return;
        }
        
        // Block large images and videos for performance
        if (resourceType === 'image' && request.url().match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
          const headers = request.headers();
          if (headers['content-length'] && parseInt(headers['content-length']) > 500000) { // 500KB
            request.abort();
            return;
          }
        }
        
        request.continue();
      });

      // Enhanced error handling
      page.on('error', (error: Error) => {
        logger.warn(`Page error: ${error.message}`);
      });

      page.on('pageerror', (error: Error) => {
        logger.warn(`Page script error: ${error.message}`);
      });

      page.on('requestfailed', (request: any) => {
        logger.debug(`Request failed: ${request.url()} - ${request.failure()?.errorText}`);
      });

      // Progress update
      await this.updateProgress({
        percentage: 20,
        stage: 'loading_page',
        details: 'Navigating to target URL',
      });

      // Navigate with enhanced options and timeout
      const navigationTimeout = Math.min(this.config.crawlOptions?.timeout || 30000, 60000);
      response = await page.goto(url, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: navigationTimeout,
      });

      if (!response || !response.ok()) {
        throw new Error(`Failed to load page: ${response?.status()} ${response?.statusText()}`);
      }

      // Wait for page to be fully loaded
      await page.waitForTimeout(2000);

      // Progress update
      await this.updateProgress({
        percentage: 35,
        stage: 'measuring_performance',
        details: 'Measuring Core Web Vitals and performance metrics',
      });

      // Measure Core Web Vitals with enhanced accuracy
      coreWebVitals = await this.measureCoreWebVitals(page);

      // Progress update
      await this.updateProgress({
        percentage: 45,
        stage: 'running_lighthouse',
        details: 'Running Lighthouse performance analysis',
      });

      // Run Lighthouse analysis if available
      if (lighthouse && this.config.crawlOptions?.extractOptions?.performanceMetrics) {
        try {
          lighthouseMetrics = await this.runEnhancedLighthouseAnalysis(url);
        } catch (lighthouseError) {
          logger.warn('Lighthouse analysis failed:', lighthouseError);
          lighthouseMetrics = null;
        }
      }

      // Progress update
      await this.updateProgress({
        percentage: 55,
        stage: 'capturing_screenshot',
        details: 'Capturing page screenshot',
      });

      // Enhanced screenshot capture with quality optimization
      if (this.config.crawlOptions?.extractOptions?.screenshots) {
        try {
          const screenshotOptions = {
            type: 'png' as const,
            quality: 85,
            fullPage: false,
            clip: {
              x: 0,
              y: 0,
              width: 1200,
              height: 800,
            },
          };

          const screenshotBuffer = await page.screenshot(screenshotOptions);
          screenshot = Buffer.from(screenshotBuffer);
          
          // Store screenshot with enhanced metadata
          if (screenshot && storage) {
            screenshotPath = await storage.saveScreenshot(
              this.config.projectId || 'unknown',
              url,
              screenshot
            );
          }
        } catch (screenshotError) {
          logger.warn('Screenshot capture failed:', screenshotError);
          screenshot = undefined;
          screenshotPath = undefined;
        }
      }

      // Progress update
      await this.updateProgress({
        percentage: 65,
        stage: 'extracting_content',
        details: 'Extracting page content and HTML',
      });

      // Get enhanced HTML content with cleaned up scripts
      html = await page.evaluate(() => {
        // Remove script tags and other noise for cleaner analysis
        const scripts = document.querySelectorAll('script, noscript, style');
        scripts.forEach(script => script.parentNode?.removeChild(script));
        
        // Clean up comments
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_COMMENT,
          null
        );
        
        const comments = [];
        let node;
        while (node = walker.nextNode()) {
          comments.push(node);
        }
        comments.forEach(comment => comment.parentNode?.removeChild(comment));
        
        return document.documentElement.outerHTML;
      });

      logger.info(`[Enhanced Analyzer] Successfully loaded page: ${url}`);
      
      return {
        html,
        response,
        screenshot,
        screenshotPath,
        browser,
        page,
        lighthouseMetrics,
        coreWebVitals,
      };

    } catch (error) {
      logger.error(`[Enhanced Analyzer] Error loading page with Puppeteer: ${error}`);
      
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          logger.error('Error closing browser after failure:', closeError);
        }
      }
      
      throw error;
    }
  }

  private async measureCoreWebVitals(page: any): Promise<any> {
    try {
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const vitals: any = {};
            
            for (const entry of entries) {
              if (entry.entryType === 'largest-contentful-paint') {
                vitals.lcp = entry.startTime;
              }
              if (entry.entryType === 'first-input') {
                vitals.fid = (entry as any).processingStart - entry.startTime;
              }
              if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
                vitals.cls = (vitals.cls || 0) + (entry as any).value;
              }
            }
            
            // Also capture navigation timing
            const navigation = performance.getEntriesByType('navigation')[0] as any;
            if (navigation) {
              vitals.fcp = navigation.responseStart - navigation.fetchStart;
              vitals.ttfb = navigation.responseStart - navigation.requestStart;
            }
            
            setTimeout(() => resolve(vitals), 3000);
          });
          
          observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift', 'navigation'] });
        });
      });
      
      return metrics;
    } catch (error) {
      logger.error('Error measuring Core Web Vitals:', error);
      return {};
    }
  }

  private async runEnhancedLighthouseAnalysis(url: string, retries: number = 2): Promise<any> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const lighthouseFn = (lighthouse as any).default || lighthouse;
        const { lhr } = await lighthouseFn(url, {
          port: 9222,
          output: 'json',
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
          disableStorageReset: true,
          logLevel: 'error',
          throttlingMethod: 'simulate',
          throttling: {
            rttMs: 40,
            throughputKbps: 10240,
            cpuSlowdownMultiplier: 1,
            requestLatencyMs: 0,
            downloadThroughputKbps: 0,
            uploadThroughputKbps: 0
          },
          settings: {
            maxWaitForFcp: 15 * 1000,
            maxWaitForLoad: 35 * 1000,
            pauseAfterFcpMs: 1000,
            pauseAfterLoadMs: 1000,
            networkQuietThresholdMs: 1000,
            cpuQuietThresholdMs: 1000
          }
        });

        return {
          performanceScore: lhr.categories.performance?.score ? Math.round(lhr.categories.performance.score * 100) : 0,
          accessibilityScore: lhr.categories.accessibility?.score ? Math.round(lhr.categories.accessibility.score * 100) : 0,
          bestPracticesScore: lhr.categories['best-practices']?.score ? Math.round(lhr.categories['best-practices'].score * 100) : 0,
          seoScore: lhr.categories.seo?.score ? Math.round(lhr.categories.seo.score * 100) : 0,
          firstContentfulPaint: lhr.audits['first-contentful-paint']?.numericValue,
          largestContentfulPaint: lhr.audits['largest-contentful-paint']?.numericValue,
          cumulativeLayoutShift: lhr.audits['cumulative-layout-shift']?.numericValue,
          speedIndex: lhr.audits['speed-index']?.numericValue,
          totalBlockingTime: lhr.audits['total-blocking-time']?.numericValue,
          timeToInteractive: lhr.audits['interactive']?.numericValue,
          firstInputDelay: lhr.audits['max-potential-fid']?.numericValue,
          timeToFirstByte: lhr.audits['server-response-time']?.numericValue,
          coreWebVitalsGrade: this.calculateCoreWebVitalsGrade(lhr),
          recommendations: this.extractLighthouseRecommendations(lhr),
          fullReport: lhr
        };
      } catch (error) {
        logger.warn(`Lighthouse analysis attempt ${attempt + 1} failed:`, error);
        if (attempt === retries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  private calculateCoreWebVitalsGrade(lhr: any): string {
    const lcp = lhr.audits['largest-contentful-paint']?.numericValue || 0;
    const fid = lhr.audits['max-potential-fid']?.numericValue || 0;
    const cls = lhr.audits['cumulative-layout-shift']?.numericValue || 0;

    const lcpGood = lcp <= 2500;
    const fidGood = fid <= 100;
    const clsGood = cls <= 0.1;

    const goodCount = [lcpGood, fidGood, clsGood].filter(Boolean).length;
    
    if (goodCount === 3) return 'A';
    if (goodCount === 2) return 'B';
    if (goodCount === 1) return 'C';
    return 'F';
  }

  private extractLighthouseRecommendations(lhr: any): string[] {
    const recommendations: string[] = [];
    
    Object.values(lhr.audits).forEach((audit: any) => {
      if (audit.score !== null && audit.score < 1 && audit.description) {
        recommendations.push(audit.description);
      }
    });
    
    return recommendations.slice(0, 10); // Limit to top 10 recommendations
  }

  private async loadPageWithAxios(url: string) {
    console.log('[Enhanced Analyzer] Loading page with Axios (fallback)...');
    
    const resp = await axios.get(url, {
      headers: {
        'User-Agent': this.config.crawlOptions.userAgent || 'SEO-Analyzer/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml',
      },
      timeout: this.config.crawlOptions.timeout || 30000,
      validateStatus: (status) => status < 500,
    });
    
    return {
      html: resp.data as string,
      response: resp
    };
  }

  private async runBasicAnalysis(pageContext: any) {
    console.log('[Enhanced Analyzer] Running basic analysis modules...');
    
    const technicalSEO = await new TechnicalSEO().analyze(pageContext);
    const onPageSEO = await new OnPageSEO().analyze(pageContext);
    const contentQuality = await new ContentQuality().analyze(pageContext);
    const structuredData = await new StructuredData().analyze(pageContext);
    const basicRecommendations = await new Recommendations().analyze(pageContext);

    return {
      technical: technicalSEO,
      onPage: onPageSEO,
      content: contentQuality,
      structuredData,
      basicRecommendations: basicRecommendations.recommendations || []
    };
  }

  private async runEnhancedAnalysis(pageContext: any, basicAnalyses: any, previousScore?: number) {
    console.log('[Enhanced Analyzer] Running enhanced analysis modules...');
    
    // Prepare enhanced context with basic analysis results
    const enhancedContext = {
      ...pageContext,
      pageAnalysis: {
        technical: this.enhanceTechnicalData(basicAnalyses.technical, pageContext),
        onPage: this.enhanceOnPageData(basicAnalyses.onPage, pageContext),
        content: this.enhanceContentData(basicAnalyses.content, pageContext),
        userExperience: this.enhanceUXData(pageContext),
        previousScore
      }
    };

    // Run enhanced analyzers
    const [scoringResult, contentResult, issueResult] = await Promise.all([
      this.enhancedScoring.analyze(enhancedContext),
      this.contentAnalyzer.analyze(enhancedContext),
      this.issueDetector.analyze(enhancedContext)
    ]);

    return {
      scoring: scoringResult,
      content: contentResult,
      issues: issueResult
    };
  }

  private enhanceTechnicalData(technical: any, context: any) {
    const lighthouseMetrics = context.lighthouseMetrics;
    
    return {
      security: {
        hasSSL: technical.hasHttps || false,
        hasHSTS: technical.securityHeaders?.includes('Strict-Transport-Security') || false,
        hasCSP: technical.securityHeaders?.includes('Content-Security-Policy') || false,
        hasXFrameOptions: technical.securityHeaders?.includes('X-Frame-Options') || false,
        hasXContentTypeOptions: technical.securityHeaders?.includes('X-Content-Type-Options') || false,
        mixedContent: technical.mixedContent || false
      },
      performance: {
        score: lighthouseMetrics?.performanceScore ? Math.round(lighthouseMetrics.performanceScore * 100) : 60,
        largestContentfulPaint: lighthouseMetrics?.largestContentfulPaint || 3000,
        firstInputDelay: lighthouseMetrics?.firstInputDelay || 100,
        cumulativeLayoutShift: lighthouseMetrics?.cumulativeLayoutShift || 0.1,
        firstContentfulPaint: lighthouseMetrics?.firstContentfulPaint || 2000,
        timeToFirstByte: lighthouseMetrics?.timeToFirstByte || 800
      },
      crawlability: {
        robotsTxtValid: technical.robotsTxtStatus === 'found',
        sitemapExists: !!technical.sitemapUrl,
        canonicalValid: !!technical.canonical,
        redirectChainLength: technical.redirectChain?.length || 0,
        orphanPages: 0 // Would need additional analysis
      },
      mobile: {
        hasViewport: technical.hasViewport || false,
        responsiveDesign: true, // Would need additional analysis
        touchFriendly: true, // Would need additional analysis
        textTooSmall: false, // Would need additional analysis
        contentWiderThanScreen: false // Would need additional analysis
      },
      structure: {
        semanticHtml: true, // Would need additional analysis
        properHeadingStructure: true, // Would be analyzed in OnPage
        validHtml: true, // Would need HTML validation
        schemaMarkup: !!technical.schema,
        breadcrumbs: false // Would need additional analysis
      }
    };
  }

  private enhanceOnPageData(onPage: any, context: any) {
    const $ = context.$;
    
    return {
      metaTags: {
        title: onPage.title,
        description: onPage.meta?.description,
        canonical: onPage.canonical,
        robots: onPage.robotsMeta,
        openGraph: onPage.openGraph,
        twitterCard: onPage.twitterCard
      },
      headings: {
        h1: onPage.headings?.h1 || [],
        hierarchyValid: this.validateHeadingHierarchy($),
        keywordOptimized: this.checkHeadingKeywords($, onPage.title),
        skippedLevels: false
      },
      images: {
        total: onPage.images?.length || 0,
        missingAlt: onPage.imagesMissingAlt || 0,
        oversized: 0, // Would need size analysis
        modernFormats: 0.5, // Would need format analysis
        lazyLoading: false // Would need analysis
      },
      links: {
        internal: onPage.links?.internal?.length || 0,
        external: onPage.links?.external?.length || 0,
        broken: 0, // Would need link checking
        nofollow: 0, // Would need analysis
        anchorTextOptimized: false // Would need analysis
      },
      schema: {
        exists: !!onPage.schema,
        errors: 0,
        richResultsEligible: false,
        types: onPage.schema?.length || 0,
        structured: true
      }
    };
  }

  private enhanceContentData(content: any, context: any) {
    return {
      depth: {
        wordCount: content.wordCount || 0,
        topicCoverage: 0.7, // Would be calculated by content analyzer
        contentStructure: {
          wellOrganized: true,
          logicalFlow: true
        }
      },
      quality: {
        duplicateContent: content.duplicateTitle || content.duplicateDescription || false,
        uniqueness: 0.8,
        grammarErrors: 0,
        spellingErrors: 0,
        expertise: 0.7,
        authority: 0.7,
        trustworthiness: 0.7
      },
      readability: {
        fleschReadingEase: content.readability || 60
      },
      keywords: {
        density: 0.02,
        inTitle: true,
        inH1: true,
        inMeta: true,
        lsiKeywords: 3
      },
      freshness: {
        daysSinceLastUpdate: 30
      }
    };
  }

  private enhanceUXData(context: any) {
    const lighthouseMetrics = context.lighthouseMetrics;
    
    return {
      accessibility: {
        score: lighthouseMetrics?.accessibilityScore ? Math.round(lighthouseMetrics.accessibilityScore * 100) : 70,
        missingAlt: 0,
        properHeadings: true,
        colorContrast: true,
        keyboardNavigation: true,
        focusIndicators: true,
        altText: true
      },
      usability: {
        mobileOptimized: true,
        fastLoading: lighthouseMetrics?.performanceScore > 0.7,
        easyNavigation: true,
        clearCTA: true,
        searchFunctionality: false
      },
      navigation: {
        breadcrumbs: false,
        mainMenu: true,
        footer: true,
        searchable: false,
        depth: 3
      },
      engagement: {
        bounceRate: 0.5,
        timeOnPage: 120,
        socialSharing: false,
        interactiveElements: true
      }
    };
  }

  private validateHeadingHierarchy($: any): boolean {
    const headings = $('h1, h2, h3, h4, h5, h6').map((_: number, el: any) => parseInt(el.tagName.substr(1))).get();
    
    for (let i = 1; i < headings.length; i++) {
      if (headings[i] - headings[i-1] > 1) {
        return false;
      }
    }
    return true;
  }

  private checkHeadingKeywords($: any, title?: string): boolean {
    if (!title) return false;
    
    const h1Text = $('h1').first().text().toLowerCase();
    const titleWords = title.toLowerCase().split(' ');
    
    return titleWords.some(word => word.length > 3 && h1Text.includes(word));
  }

  private aggregateResults(
    url: string,
    response: any,
    basicAnalyses: any,
    enhancedResults: any,
    additionalData: any
  ): EnhancedPageAnalysis {
    console.log('[Enhanced Analyzer] Aggregating final results...');
    
    const result: EnhancedPageAnalysis = {
      url,
      statusCode: response.status,
      
      // Basic analysis results
      ...basicAnalyses.technical,
      ...basicAnalyses.onPage,
      ...basicAnalyses.content,
      ...basicAnalyses.structuredData,
      
      // Enhanced scoring
      score: enhancedResults.scoring.score,
      technicalScore: enhancedResults.scoring.technicalScore,
      contentScore: enhancedResults.scoring.contentScore,
      onpageScore: enhancedResults.scoring.onpageScore,
      uxScore: enhancedResults.scoring.uxScore,
      scoreBreakdown: enhancedResults.scoring.scoreBreakdown,
      
      // Enhanced content analysis
      contentAnalysis: enhancedResults.content.contentAnalysis,
      
      // Enhanced issue detection and recommendations
      categorizedIssues: enhancedResults.issues.categorizedIssues,
      detailedRecommendations: enhancedResults.issues.detailedRecommendations,
      recommendations: [
        ...basicAnalyses.basicRecommendations,
        ...enhancedResults.issues.detailedRecommendations.slice(0, 10) // Top 10 detailed recommendations
      ],
      
      // Performance metrics
      performanceMetrics: {
        coreWebVitals: {
          url: url,
          timestamp: new Date(),
          deviceType: 'desktop',
          coreWebVitals: {
            LCP: 0,
            FID: 0,
            CLS: 0,
            FCP: 0,
            TTFB: 0,
            SI: 0,
            TTI: 0
          },
          performanceScore: 0,
          grade: 'C' as const,
          insights: {
            lcpAnalysis: {
              value: 0,
              status: 'poor' as const,
              target: 1200,
              percentile: '50th',
              issues: [],
              opportunities: []
            },
            fidAnalysis: {
              value: 0,
              status: 'poor' as const,
              target: 100,
              percentile: '50th',
              issues: [],
              opportunities: []
            },
            clsAnalysis: {
              value: 0,
              status: 'poor' as const,
              target: 0.1,
              percentile: '50th',
              issues: [],
              opportunities: []
            },
            fcpAnalysis: {
              value: 0,
              status: 'poor' as const,
              target: 1000,
              percentile: '50th',
              issues: [],
              opportunities: []
            },
            ttfbAnalysis: {
              value: 0,
              status: 'poor' as const,
              target: 200,
              percentile: '50th',
              issues: [],
              opportunities: []
            }
          },
          recommendations: []
        },
        lighthouseData: additionalData.lighthouseMetrics?.fullReport
      },
      
      // Additional data
      rawHtml: '', // Don't store full HTML to save space
      screenshotPath: additionalData.screenshotPath,
      lighthouseMetrics: additionalData.lighthouseMetrics,
      
      // Analysis metadata
      analysisVersion: '2.0',
      analysisTimestamp: new Date().toISOString(),
      analysisModules: [
        'TechnicalSEO',
        'OnPageSEO', 
        'ContentQuality',
        'StructuredData',
        'EnhancedScoring',
        'EnhancedContentAnalyzer',
        'EnhancedIssueDetection'
      ]
    };

    return result;
  }

  private async fallbackAnalysis(url: string, error: any): Promise<EnhancedPageAnalysis> {
    console.log('[Enhanced Analyzer] Running fallback analysis...');
    
    try {
      // Try basic axios analysis
      const pageData = await this.loadPageWithAxios(url);
      const $ = cheerio.load(pageData.html);
      
      const pageContext = { 
        url, 
        html: pageData.html, 
        $, 
        response: pageData.response, 
        config: this.config 
      };

      const basicAnalyses = await this.runBasicAnalysis(pageContext);
      
      return {
        url,
        statusCode: pageData.response.status,
        ...basicAnalyses.technical,
        ...basicAnalyses.onPage,
        ...basicAnalyses.content,
        score: 50, // Default fallback score
        technicalScore: 50,
        contentScore: 50,
        onpageScore: 50,
        uxScore: 50,
        recommendations: basicAnalyses.basicRecommendations,
        error: error?.message || 'Analysis failed, showing basic results',
        analysisVersion: '2.0-fallback'
      };
    } catch (fallbackError: any) {
      return {
        url,
        statusCode: error?.response?.status || 0,
        error: fallbackError?.message || 'Complete analysis failure',
        score: 0,
        analysisVersion: '2.0-error'
      } as EnhancedPageAnalysis;
    }
  }

  // Utility method for caching
  async analyzePageWithCache(url: string, previousScore?: number, useCache: boolean = true): Promise<EnhancedPageAnalysis> {
    if (useCache) {
      // TODO: Implement cache checking logic
      // const cachedResult = await this.checkCache(url);
      // if (cachedResult && !this.isCacheExpired(cachedResult)) {
      //   return cachedResult;
      // }
    }

    const result = await this.analyzePage(url, previousScore);
    
    if (useCache) {
      // TODO: Implement cache storage logic
      // await this.storeInCache(url, result);
    }

    return result;
  }
} 