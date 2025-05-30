import { PageAnalysis } from '../../types/PageAnalysis';
import { EnhancedScoring } from './EnhancedScoring';
import { EnhancedContentAnalyzer } from './EnhancedContentAnalyzer';
import { EnhancedIssueDetection } from './EnhancedIssueDetection';
import { EnhancedRecommendationEngine } from './EnhancedRecommendationEngine';
import { TechnicalSEO } from './TechnicalSEO';
import { OnPageSEO } from './OnPageSEO';
import { ContentQuality } from './ContentQuality';
import { StructuredData } from './StructuredData';
import { CoreWebVitalsAnalyzer, CoreWebVitalsAnalysis } from '../../../services/CoreWebVitalsAnalyzer';

export interface EnhancedAnalysisResult extends Partial<PageAnalysis> {
  enhancedScoring?: {
    overall: number;
    breakdown: {
      technical: number;
      content: number;
      onPage: number;
      userExperience: number;
    };
    categoryScores: Record<string, number>;
    riskAdjustedScore: number;
    criticalIssuesCount: number;
    scoreMetadata: any;
  };
  enhancedContent?: {
    depth: any;
    quality: any;
    readability: any;
    keywords: any;
    freshness: any;
    recommendations: string[];
  };
  enhancedIssues?: {
    issues: any[];
    summary: any;
    categorized: Record<string, any[]>;
    prioritized: any[];
  };
  enhancedRecommendations?: any[];
  recommendationStrategy?: any;
  recommendationSummary?: any;
  coreWebVitals?: CoreWebVitalsAnalysis;
  analysisMetadata?: {
    timestamp: string;
    processingTime: number;
    analysisVersion: string;
    confidence: number;
  };
}

interface AnalysisPerformanceMetrics {
  startTime: number;
  basicAnalysisTime?: number;
  enhancedScoringTime?: number;
  contentAnalysisTime?: number;
  issueDetectionTime?: number;
  recommendationTime?: number;
  coreWebVitalsTime?: number;
  totalTime?: number;
}

export class EnhancedPageAnalyzer {
  // Enhanced analysis modules
  private enhancedScoring: EnhancedScoring;
  private enhancedContentAnalyzer: EnhancedContentAnalyzer;
  private enhancedIssueDetection: EnhancedIssueDetection;
  private enhancedRecommendationEngine: EnhancedRecommendationEngine;
  private coreWebVitalsAnalyzer: CoreWebVitalsAnalyzer;

  // Basic analysis modules
  private technicalSEO: TechnicalSEO;
  private onPageSEO: OnPageSEO;
  private contentQuality: ContentQuality;
  private structuredData: StructuredData;

  constructor() {
    // Initialize enhanced modules
    this.enhancedScoring = new EnhancedScoring();
    this.enhancedContentAnalyzer = new EnhancedContentAnalyzer();
    this.enhancedIssueDetection = new EnhancedIssueDetection();
    this.enhancedRecommendationEngine = new EnhancedRecommendationEngine();
    this.coreWebVitalsAnalyzer = new CoreWebVitalsAnalyzer();

    // Initialize basic modules
    this.technicalSEO = new TechnicalSEO();
    this.onPageSEO = new OnPageSEO();
    this.contentQuality = new ContentQuality();
    this.structuredData = new StructuredData();
  }

  async analyze(pageContext: any): Promise<EnhancedAnalysisResult> {
    const metrics: AnalysisPerformanceMetrics = {
      startTime: Date.now()
    };

    try {
      console.log(`[Enhanced Page Analyzer] Starting comprehensive analysis for: ${pageContext.url}`);

      // Phase 1: Basic Analysis
      console.log('[Enhanced Page Analyzer] Phase 1: Basic Analysis');
      const basicAnalysisStart = Date.now();
      const basicAnalysis = await this.runBasicAnalysis(pageContext);
      metrics.basicAnalysisTime = Date.now() - basicAnalysisStart;

      // Phase 2: Enhanced Scoring
      console.log('[Enhanced Page Analyzer] Phase 2: Enhanced Scoring');
      const scoringStart = Date.now();
      const enhancedContext = this.enrichContext(pageContext, basicAnalysis);
      const scoringResults = await this.enhancedScoring.analyze(enhancedContext);
      metrics.enhancedScoringTime = Date.now() - scoringStart;

      // Phase 3: Enhanced Content Analysis
      console.log('[Enhanced Page Analyzer] Phase 3: Enhanced Content Analysis');
      const contentStart = Date.now();
      const contentResults = await this.enhancedContentAnalyzer.analyze(enhancedContext);
      metrics.contentAnalysisTime = Date.now() - contentStart;

      // Phase 4: Enhanced Issue Detection
      console.log('[Enhanced Page Analyzer] Phase 4: Enhanced Issue Detection');
      const issueStart = Date.now();
      const issueResults = await this.enhancedIssueDetection.analyze(enhancedContext);
      metrics.issueDetectionTime = Date.now() - issueStart;

      // Phase 5: Enhanced Recommendations
      console.log('[Enhanced Page Analyzer] Phase 5: Enhanced Recommendations');
      const recommendationStart = Date.now();
      const recommendationResults = await this.enhancedRecommendationEngine.generateRecommendations(enhancedContext);
      metrics.recommendationTime = Date.now() - recommendationStart;

      // Phase 6: Core Web Vitals Analysis
      console.log('[Enhanced Page Analyzer] Phase 6: Core Web Vitals Analysis');
      const coreWebVitalsStart = Date.now();
      let coreWebVitalsResults;
      try {
        coreWebVitalsResults = await this.coreWebVitalsAnalyzer.analyzeWebVitals(pageContext.url, {
          deviceType: 'mobile',
          includeHistorical: false,
          projectId: pageContext.projectId
        });
      } catch (error) {
        console.error('[Enhanced Page Analyzer] Core Web Vitals analysis failed:', error);
        coreWebVitalsResults = null;
      }
      metrics.coreWebVitalsTime = Date.now() - coreWebVitalsStart;

      // Phase 7: Aggregate Results
      console.log('[Enhanced Page Analyzer] Phase 7: Aggregating Results');
      metrics.totalTime = Date.now() - metrics.startTime;

      const result = this.aggregateResults(
        basicAnalysis,
        scoringResults,
        contentResults,
        issueResults,
        recommendationResults,
        coreWebVitalsResults,
        metrics
      );

      console.log(`[Enhanced Page Analyzer] Analysis completed in ${metrics.totalTime}ms`);
      return result;

    } catch (error) {
      console.error('[Enhanced Page Analyzer] Error during analysis:', error);
      metrics.totalTime = Date.now() - metrics.startTime;
      
      // Return fallback analysis
      return this.createFallbackResult(pageContext, error, metrics);
    }
  }

  private async runBasicAnalysis(pageContext: any): Promise<Partial<PageAnalysis>> {
    try {
      const [technical, onPage, content, schema] = await Promise.all([
        this.technicalSEO.analyze(pageContext),
        this.onPageSEO.analyze(pageContext),
        this.contentQuality.analyze(pageContext),
        this.structuredData.analyze(pageContext)
      ]);

      return {
        url: pageContext.url,
        statusCode: pageContext.response?.status || 200,
        ...technical,
        ...onPage,
        ...content,
        ...schema,
        score: this.calculateBasicScore({ technical, onPage, content, schema })
      };
    } catch (error) {
      console.error('[Enhanced Page Analyzer] Basic analysis error:', error);
      return {
        url: pageContext.url,
        statusCode: pageContext.response?.status || 0,
        score: 0,
        error: 'Basic analysis failed'
      };
    }
  }

  private enrichContext(pageContext: any, basicAnalysis: any) {
    return {
      ...pageContext,
      pageAnalysis: {
        technical: this.enrichTechnicalData(basicAnalysis, pageContext),
        onPage: this.enrichOnPageData(basicAnalysis, pageContext),
        content: this.enrichContentData(basicAnalysis, pageContext),
        userExperience: this.enrichUXData(basicAnalysis, pageContext)
      },
      basicAnalysis
    };
  }

  private enrichTechnicalData(analysis: any, context: any) {
    return {
      security: {
        hasSSL: analysis.hasHttps || false,
        hasHSTS: analysis.securityHeaders?.includes('Strict-Transport-Security') || false,
        hasCSP: analysis.securityHeaders?.includes('Content-Security-Policy') || false,
        mixedContent: analysis.mixedContent || false
      },
      performance: {
        score: context.lighthouseMetrics?.performanceScore || 60,
        loadTime: context.lighthouseMetrics?.loadTime || 3000,
        coreWebVitals: context.lighthouseMetrics?.coreWebVitals || {}
      },
      crawlability: {
        robotsTxtValid: analysis.robotsTxtStatus === 'found',
        sitemapExists: !!analysis.sitemapUrl,
        canonicalValid: !!analysis.canonical
      },
      mobile: {
        responsive: analysis.responsive || true,
        mobileOptimized: analysis.mobileOptimized || false
      }
    };
  }

  private enrichOnPageData(analysis: any, context: any) {
    return {
      metaTags: {
        title: analysis.title,
        description: analysis.meta?.description,
        robots: analysis.robotsMeta
      },
      headings: {
        h1: analysis.headings?.h1 || [],
        structure: analysis.headings || {}
      },
      images: {
        total: analysis.images?.length || 0,
        missingAlt: analysis.imagesMissingAlt || 0
      },
      links: {
        internal: analysis.links?.internal?.length || 0,
        external: analysis.links?.external?.length || 0
      }
    };
  }

  private enrichContentData(analysis: any, context: any) {
    return {
      wordCount: analysis.wordCount || 0,
      readability: analysis.readability || 60,
      duplicateContent: analysis.duplicateTitle || analysis.duplicateDescription || false
    };
  }

  private enrichUXData(analysis: any, context: any) {
    return {
      accessibility: {
        score: context.lighthouseMetrics?.accessibilityScore || 70
      },
      usability: {
        mobileOptimized: analysis.mobileOptimized || false,
        responsive: analysis.responsive || true
      }
    };
  }

  private calculateBasicScore(analysis: any): number {
    const weights = {
      technical: 0.3,
      onPage: 0.3,
      content: 0.25,
      schema: 0.15
    };

    // Calculate individual scores (simplified)
    const technicalScore = analysis.technical?.hasHttps ? 80 : 50;
    const onPageScore = analysis.onPage?.title ? 80 : 40;
    const contentScore = analysis.content?.wordCount > 300 ? 75 : 50;
    const schemaScore = analysis.schema?.length > 0 ? 90 : 60;

    return Math.round(
      technicalScore * weights.technical +
      onPageScore * weights.onPage +
      contentScore * weights.content +
      schemaScore * weights.schema
    );
  }

  private calculateConfidenceScore(
    analysis: any, 
    issueResults: any, 
    scoringResults: any
  ): number {
    let confidence = 100;

    // Reduce confidence based on analysis limitations
    if (!analysis.lighthouseMetrics) confidence -= 15;
    if (!analysis.pageContext?.page) confidence -= 10; // No Puppeteer
    if (analysis.error) confidence -= 25;

    // Adjust based on issue detection coverage
    const issueCount = issueResults.categorizedIssues?.summary?.totalIssues || 0;
    if (issueCount < 5) confidence -= 10; // Might have missed issues

    return Math.max(50, Math.min(100, confidence));
  }

  private aggregateResults(
    basicAnalysis: any,
    scoringResults: any,
    contentResults: any,
    issueResults: any,
    recommendationResults: any,
    coreWebVitalsResults: any,
    metrics: AnalysisPerformanceMetrics
  ): EnhancedAnalysisResult {
    const confidence = this.calculateConfidenceScore(basicAnalysis, issueResults, scoringResults);

    return {
      // Basic analysis data
      ...basicAnalysis,
      
      // Enhanced scoring
      score: scoringResults.score || basicAnalysis.score,
      technicalScore: scoringResults.technicalScore,
      contentScore: scoringResults.contentScore,
      onpageScore: scoringResults.onpageScore,
      uxScore: scoringResults.uxScore,
      
      enhancedScoring: {
        overall: scoringResults.score || basicAnalysis.score,
        breakdown: {
          technical: scoringResults.technicalScore || 60,
          content: scoringResults.contentScore || 60,
          onPage: scoringResults.onpageScore || 60,
          userExperience: scoringResults.uxScore || 60
        },
        categoryScores: {
          technical: scoringResults.technicalScore || 60,
          content: scoringResults.contentScore || 60,
          onPage: scoringResults.onpageScore || 60,
          ux: scoringResults.uxScore || 60
        },
        riskAdjustedScore: scoringResults.score || basicAnalysis.score,
        criticalIssuesCount: issueResults.categorizedIssues?.criticalCount || 0,
        scoreMetadata: scoringResults.scoreBreakdown || {}
      },

      // Enhanced content analysis
      enhancedContent: {
        depth: contentResults.contentAnalysis?.depth || {},
        quality: contentResults.contentAnalysis?.quality || {},
        readability: contentResults.contentAnalysis?.readability || {},
        keywords: contentResults.contentAnalysis?.keywords || {},
        freshness: contentResults.contentAnalysis?.freshness || {},
        recommendations: contentResults.content?.recommendations || []
      },

      // Enhanced issue detection
      enhancedIssues: {
        issues: issueResults.categorizedIssues?.critical?.concat(
          issueResults.categorizedIssues?.high || [],
          issueResults.categorizedIssues?.medium || [],
          issueResults.categorizedIssues?.low || []
        ) || [],
        summary: issueResults.categorizedIssues?.summary || {},
        categorized: {
          critical: issueResults.categorizedIssues?.critical || [],
          high: issueResults.categorizedIssues?.high || [],
          medium: issueResults.categorizedIssues?.medium || [],
          low: issueResults.categorizedIssues?.low || []
        },
        prioritized: issueResults.categorizedIssues?.prioritization?.immediate || []
      },

      // Enhanced recommendations
      enhancedRecommendations: recommendationResults.enhancedRecommendations || [],
      recommendationStrategy: recommendationResults.recommendationStrategy,
      recommendationSummary: recommendationResults.recommendationSummary,

      // Legacy compatibility
      issues: issueResults.issues || [],
      recommendations: recommendationResults.recommendations || [],

      // Core Web Vitals
      coreWebVitals: coreWebVitalsResults?.coreWebVitals || {},

      // Analysis metadata
      analysisMetadata: {
        timestamp: new Date().toISOString(),
        processingTime: metrics.totalTime || 0,
        analysisVersion: '2.0-enhanced',
        confidence
      }
    };
  }

  private createFallbackResult(
    pageContext: any, 
    error: any, 
    metrics: AnalysisPerformanceMetrics
  ): EnhancedAnalysisResult {
    return {
      url: pageContext.url,
      statusCode: pageContext.response?.status || 0,
      score: 0,
      error: error?.message || 'Analysis failed',
      
      enhancedScoring: {
        overall: 0,
        breakdown: { technical: 0, content: 0, onPage: 0, userExperience: 0 },
        categoryScores: {},
        riskAdjustedScore: 0,
        criticalIssuesCount: 0,
        scoreMetadata: {}
      },

      enhancedContent: {
        depth: {},
        quality: {},
        readability: {},
        keywords: {},
        freshness: {},
        recommendations: []
      },

      enhancedIssues: {
        issues: [],
        summary: {},
        categorized: {},
        prioritized: []
      },

      coreWebVitals: {},

      analysisMetadata: {
        timestamp: new Date().toISOString(),
        processingTime: metrics.totalTime || 0,
        analysisVersion: '2.0-enhanced-fallback',
        confidence: 0
      }
    };
  }

  // Utility methods for external use
  getAnalysisSummary(results: EnhancedAnalysisResult): any {
    return {
      overallScore: results.enhancedScoring?.overall || 0,
      categoryScores: results.enhancedScoring?.breakdown || {},
      issuesSummary: results.enhancedIssues?.summary || {},
      quickWins: results.recommendationStrategy?.quickWins?.length || 0,
      confidence: results.analysisMetadata?.confidence || 0,
      processingTime: results.analysisMetadata?.processingTime || 0
    };
  }

  validateResults(results: EnhancedAnalysisResult): boolean {
    if (!results.url) return false;
    if (!results.enhancedScoring?.overall && results.enhancedScoring?.overall !== 0) return false;
    if (!results.analysisMetadata?.timestamp) return false;
    
    // Check if essential data is present
    const hasEssentialData = 
      results.enhancedScoring &&
      results.enhancedContent &&
      results.enhancedIssues;

    return hasEssentialData;
  }

  getPerformanceMetrics(results: EnhancedAnalysisResult): any {
    return {
      analysisTime: results.analysisMetadata?.processingTime || 0,
      confidence: results.analysisMetadata?.confidence || 0,
      version: results.analysisMetadata?.analysisVersion || 'unknown',
      dataCompleteness: this.calculateDataCompleteness(results)
    };
  }

  private calculateDataCompleteness(results: EnhancedAnalysisResult): number {
    let completeness = 0;
    let maxPoints = 0;

    // Check scoring completeness
    maxPoints += 25;
    if (results.enhancedScoring?.overall !== undefined) completeness += 25;

    // Check content analysis completeness
    maxPoints += 25;
    if (results.enhancedContent?.depth && Object.keys(results.enhancedContent.depth).length > 0) {
      completeness += 25;
    }

    // Check issue detection completeness
    maxPoints += 25;
    if (results.enhancedIssues?.issues && results.enhancedIssues.issues.length >= 0) {
      completeness += 25;
    }

    // Check recommendations completeness
    maxPoints += 25;
    if (results.enhancedRecommendations && results.enhancedRecommendations.length >= 0) {
      completeness += 25;
    }

    return Math.round((completeness / maxPoints) * 100);
  }
} 