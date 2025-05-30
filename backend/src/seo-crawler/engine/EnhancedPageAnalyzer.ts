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

let puppeteer: typeof import('puppeteer') | undefined;
let lighthouse: typeof import('lighthouse') | undefined;
try {
  puppeteer = require('puppeteer');
  lighthouse = require('lighthouse');
} catch {}

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

export class EnhancedPageAnalyzer {
  private enhancedScoring: EnhancedScoring;
  private contentAnalyzer: EnhancedContentAnalyzer;
  private issueDetector: EnhancedIssueDetection;
  
  constructor(private config: CrawlerConfig) {
    this.enhancedScoring = new EnhancedScoring();
    this.contentAnalyzer = new EnhancedContentAnalyzer();
    this.issueDetector = new EnhancedIssueDetection();
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
    const storage = new StorageAdapter();
    
    try {
      // Phase 1: Page Loading and Data Extraction
      console.log(`[Enhanced Analyzer] Starting comprehensive analysis for: ${url}`);
      
      if (usePuppeteer) {
        const pageData = await this.loadPageWithPuppeteer(url, storage);
        html = pageData.html;
        response = pageData.response;
        screenshot = pageData.screenshot;
        screenshotPath = pageData.screenshotPath;
        browser = pageData.browser;
        page = pageData.page;
        lighthouseMetrics = pageData.lighthouseMetrics;
      } else {
        const pageData = await this.loadPageWithAxios(url);
        html = pageData.html;
        response = pageData.response;
      }

      const $ = cheerio.load(html);
      
      // Phase 2: Basic Analysis (using existing modules)
      console.log('[Enhanced Analyzer] Running basic analysis modules...');
      const pageContext = { 
        url, 
        html, 
        $, 
        response, 
        config: this.config, 
        browser, 
        page, 
        screenshot, 
        lighthouseMetrics 
      };

      const basicAnalyses = await this.runBasicAnalysis(pageContext);
      
      // Phase 3: Enhanced Analysis
      console.log('[Enhanced Analyzer] Running enhanced analysis modules...');
      const enhancedResults = await this.runEnhancedAnalysis(pageContext, basicAnalyses, previousScore);

      // Phase 4: Aggregate and Structure Results
      console.log('[Enhanced Analyzer] Aggregating results...');
      const finalResults = this.aggregateResults(
        url,
        response,
        basicAnalyses,
        enhancedResults,
        { screenshotPath, lighthouseMetrics }
      );

      if (browser) await browser.close();
      
      console.log(`[Enhanced Analyzer] Analysis complete for: ${url}`);
      return finalResults;

    } catch (error: any) {
      if (browser) await browser.close();
      console.error(`[Enhanced Analyzer] Error analyzing ${url}:`, error);
      
      // Fallback analysis
      return await this.fallbackAnalysis(url, error);
    }
  }

  private async loadPageWithPuppeteer(url: string, storage: StorageAdapter) {
    console.log('[Enhanced Analyzer] Loading page with Puppeteer...');
    
    const browser = await puppeteer!.launch({ 
      headless: true, 
      args: ['--remote-debugging-port=9222', '--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    await page.setUserAgent(this.config.crawlOptions.userAgent || 'SEO-Analyzer/1.0');
    await page.setViewport(this.config.crawlOptions.viewport || { width: 1200, height: 800 });
    
    // Enable performance monitoring
    await page.tracing.start({ path: 'trace.json', screenshots: true });
    
    const resp = await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: this.config.crawlOptions.timeout || 30000 
    });
    
    const html = await page.content();
    const response = { status: resp?.status(), headers: resp?.headers() };
    
    let screenshot: Buffer | undefined = undefined;
    let screenshotPath: string | undefined = undefined;
    
    if (this.config.crawlOptions.extractOptions.screenshots) {
      screenshot = await page.screenshot({ fullPage: true });
      screenshotPath = await storage.saveScreenshot(
        (this.config as any).jobId || 'default', 
        url, 
        screenshot as Buffer
      );
    }

    // Enhanced Lighthouse analysis
    let lighthouseMetrics: any = undefined;
    if (this.config.crawlOptions.extractOptions.performanceMetrics && lighthouse) {
      console.log('[Enhanced Analyzer] Running Lighthouse analysis...');
      lighthouseMetrics = await this.runLighthouseAnalysis(url);
    }

    await page.tracing.stop();

    return {
      html,
      response,
      screenshot,
      screenshotPath,
      browser,
      page,
      lighthouseMetrics
    };
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

  private async runLighthouseAnalysis(url: string) {
    try {
      const lighthouseFn = (lighthouse as any).default || lighthouse;
      const { lhr } = await lighthouseFn(url, {
        port: 9222,
        output: 'json',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        disableStorageReset: true,
        logLevel: 'error',
      });

      return {
        performanceScore: lhr.categories.performance?.score,
        accessibilityScore: lhr.categories.accessibility?.score,
        bestPracticesScore: lhr.categories['best-practices']?.score,
        seoScore: lhr.categories.seo?.score,
        firstContentfulPaint: lhr.audits['first-contentful-paint']?.numericValue,
        largestContentfulPaint: lhr.audits['largest-contentful-paint']?.numericValue,
        cumulativeLayoutShift: lhr.audits['cumulative-layout-shift']?.numericValue,
        speedIndex: lhr.audits['speed-index']?.numericValue,
        totalBlockingTime: lhr.audits['total-blocking-time']?.numericValue,
        timeToInteractive: lhr.audits['interactive']?.numericValue,
        firstInputDelay: lhr.audits['max-potential-fid']?.numericValue,
        timeToFirstByte: lhr.audits['server-response-time']?.numericValue,
        fullReport: lhr
      };
    } catch (error) {
      console.error('[Enhanced Analyzer] Lighthouse analysis failed:', error);
      return null;
    }
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
    const headings = $('h1, h2, h3, h4, h5, h6').map((_, el) => parseInt(el.tagName.substr(1))).get();
    
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
        coreWebVitals: enhancedResults.scoring.scoreBreakdown?.breakdown?.technical?.performance || {},
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