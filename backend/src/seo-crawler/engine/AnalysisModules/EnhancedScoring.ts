import { logger } from '../../../utils/logger';

export interface ScoreWeights {
  technical: number;
  content: number;
  onPage: number;
  ux: number;
  performance: number;
}

export interface CategoryScore {
  score: number;
  maxScore: number;
  weight: number;
  factors: ScoreFactor[];
  issues: string[];
  recommendations: string[];
}

export interface ScoreFactor {
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  impact: 'high' | 'medium' | 'low';
  description: string;
}

export interface EnhancedScoringResult {
  overallScore: number;
  categoryScores: {
    technical: CategoryScore;
    content: CategoryScore;
    onPage: CategoryScore;
    ux: CategoryScore;
    performance: CategoryScore;
  };
  scoreBreakdown: {
    technical: any;
    content: any;
    onPage: any;
    ux: any;
    performance: any;
    weights: ScoreWeights;
    previousScore?: number;
    scoreChange?: number;
    trend?: 'improving' | 'declining' | 'stable';
  };
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  priorityIssues: string[];
  quickWins: string[];
  benchmarks?: {
    industry: number;
    competitors: number;
    topPerformers: number;
  };
}

export class EnhancedScoring {
  private readonly defaultWeights: ScoreWeights = {
    technical: 0.30,
    content: 0.25,
    onPage: 0.25,
    ux: 0.15,
    performance: 0.05, // Performance is factored into technical and UX
  };

  constructor(private customWeights?: Partial<ScoreWeights>) {}

  async analyze(context: any): Promise<EnhancedScoringResult> {
    try {
      logger.info('Starting enhanced scoring analysis');

      const weights = this.getEffectiveWeights();
      const pageAnalysis = context.pageAnalysis;
      const previousScore = pageAnalysis.previousScore;

      // Calculate category scores
      const technicalScore = this.calculateTechnicalScore(pageAnalysis.technical, context);
      const contentScore = this.calculateContentScore(pageAnalysis.content, context);
      const onPageScore = this.calculateOnPageScore(pageAnalysis.onPage, context);
      const uxScore = this.calculateUXScore(pageAnalysis.userExperience, context);
      const performanceScore = this.calculatePerformanceScore(context);

      // Calculate overall score
      const overallScore = Math.round(
        technicalScore.score * weights.technical +
        contentScore.score * weights.content +
        onPageScore.score * weights.onPage +
        uxScore.score * weights.ux +
        performanceScore.score * weights.performance
      );

      // Calculate trends and changes
      const scoreChange = previousScore ? overallScore - previousScore : 0;
      const trend = this.calculateTrend(scoreChange);

      // Generate grade
      const grade = this.calculateGrade(overallScore);

      // Identify priority issues and quick wins
      const allIssues = [
        ...technicalScore.issues,
        ...contentScore.issues,
        ...onPageScore.issues,
        ...uxScore.issues,
        ...performanceScore.issues,
      ];

      const priorityIssues = this.identifyPriorityIssues(allIssues);
      const quickWins = this.identifyQuickWins(allIssues);

      // Generate benchmarks (would be calculated from historical data)
      const benchmarks = this.generateBenchmarks(overallScore);

      const result: EnhancedScoringResult = {
        overallScore,
        categoryScores: {
          technical: technicalScore,
          content: contentScore,
          onPage: onPageScore,
          ux: uxScore,
          performance: performanceScore,
        },
        scoreBreakdown: {
          technical: this.generateTechnicalBreakdown(pageAnalysis.technical, context),
          content: this.generateContentBreakdown(pageAnalysis.content, context),
          onPage: this.generateOnPageBreakdown(pageAnalysis.onPage, context),
          ux: this.generateUXBreakdown(pageAnalysis.userExperience, context),
          performance: this.generatePerformanceBreakdown(context),
          weights,
          previousScore,
          scoreChange,
          trend,
        },
        grade,
        priorityIssues,
        quickWins,
        benchmarks,
      };

      logger.info(`Enhanced scoring analysis complete. Overall score: ${overallScore}`);
      return result;

    } catch (error) {
      logger.error('Error in enhanced scoring analysis:', error);
      throw error;
    }
  }

  private calculateTechnicalScore(technical: any, context: any): CategoryScore {
    const factors: ScoreFactor[] = [
      {
        name: 'HTTPS/SSL',
        score: technical.security?.hasSSL ? 100 : 0,
        maxScore: 100,
        weight: 0.15,
        impact: 'high',
        description: 'SSL certificate and HTTPS implementation',
      },
      {
        name: 'Security Headers',
        score: this.calculateSecurityHeadersScore(technical.security),
        maxScore: 100,
        weight: 0.10,
        impact: 'medium',
        description: 'Security headers implementation',
      },
      {
        name: 'Crawlability',
        score: this.calculateCrawlabilityScore(technical.crawlability),
        maxScore: 100,
        weight: 0.20,
        impact: 'high',
        description: 'Search engine crawlability',
      },
      {
        name: 'Mobile Optimization',
        score: this.calculateMobileScore(technical.mobile),
        maxScore: 100,
        weight: 0.20,
        impact: 'high',
        description: 'Mobile responsiveness and optimization',
      },
      {
        name: 'Site Structure',
        score: this.calculateStructureScore(technical.structure),
        maxScore: 100,
        weight: 0.15,
        impact: 'medium',
        description: 'HTML structure and semantics',
      },
      {
        name: 'Core Performance',
        score: technical.performance?.score || 60,
        maxScore: 100,
        weight: 0.20,
        impact: 'high',
        description: 'Core technical performance metrics',
      },
    ];

    const weightedScore = factors.reduce((sum, factor) => 
      sum + (factor.score * factor.weight), 0
    );

    const issues = this.generateTechnicalIssues(factors);
    const recommendations = this.generateTechnicalRecommendations(factors);

    return {
      score: Math.round(weightedScore),
      maxScore: 100,
      weight: this.getEffectiveWeights().technical,
      factors,
      issues,
      recommendations,
    };
  }

  private calculateContentScore(content: any, context: any): CategoryScore {
    const factors: ScoreFactor[] = [
      {
        name: 'Content Depth',
        score: this.calculateContentDepthScore(content.depth),
        maxScore: 100,
        weight: 0.25,
        impact: 'high',
        description: 'Content comprehensiveness and depth',
      },
      {
        name: 'Content Quality',
        score: this.calculateContentQualityScore(content.quality),
        maxScore: 100,
        weight: 0.30,
        impact: 'high',
        description: 'Content quality and uniqueness',
      },
      {
        name: 'Readability',
        score: this.calculateReadabilityScore(content.readability),
        maxScore: 100,
        weight: 0.15,
        impact: 'medium',
        description: 'Content readability and accessibility',
      },
      {
        name: 'Keyword Optimization',
        score: this.calculateKeywordScore(content.keywords),
        maxScore: 100,
        weight: 0.20,
        impact: 'high',
        description: 'Keyword usage and optimization',
      },
      {
        name: 'Content Freshness',
        score: this.calculateFreshnessScore(content.freshness),
        maxScore: 100,
        weight: 0.10,
        impact: 'low',
        description: 'Content recency and updates',
      },
    ];

    const weightedScore = factors.reduce((sum, factor) => 
      sum + (factor.score * factor.weight), 0
    );

    const issues = this.generateContentIssues(factors);
    const recommendations = this.generateContentRecommendations(factors);

    return {
      score: Math.round(weightedScore),
      maxScore: 100,
      weight: this.getEffectiveWeights().content,
      factors,
      issues,
      recommendations,
    };
  }

  private calculateOnPageScore(onPage: any, context: any): CategoryScore {
    const factors: ScoreFactor[] = [
      {
        name: 'Title Tags',
        score: this.calculateTitleScore(onPage.metaTags),
        maxScore: 100,
        weight: 0.25,
        impact: 'high',
        description: 'Title tag optimization',
      },
      {
        name: 'Meta Descriptions',
        score: this.calculateMetaDescriptionScore(onPage.metaTags),
        maxScore: 100,
        weight: 0.20,
        impact: 'high',
        description: 'Meta description optimization',
      },
      {
        name: 'Heading Structure',
        score: this.calculateHeadingScore(onPage.headings),
        maxScore: 100,
        weight: 0.20,
        impact: 'medium',
        description: 'Heading hierarchy and optimization',
      },
      {
        name: 'Image Optimization',
        score: this.calculateImageScore(onPage.images),
        maxScore: 100,
        weight: 0.15,
        impact: 'medium',
        description: 'Image optimization and alt text',
      },
      {
        name: 'Internal Linking',
        score: this.calculateLinkScore(onPage.links),
        maxScore: 100,
        weight: 0.10,
        impact: 'medium',
        description: 'Internal linking structure',
      },
      {
        name: 'Schema Markup',
        score: this.calculateSchemaScore(onPage.schema),
        maxScore: 100,
        weight: 0.10,
        impact: 'low',
        description: 'Structured data implementation',
      },
    ];

    const weightedScore = factors.reduce((sum, factor) => 
      sum + (factor.score * factor.weight), 0
    );

    const issues = this.generateOnPageIssues(factors);
    const recommendations = this.generateOnPageRecommendations(factors);

    return {
      score: Math.round(weightedScore),
      maxScore: 100,
      weight: this.getEffectiveWeights().onPage,
      factors,
      issues,
      recommendations,
    };
  }

  private calculateUXScore(ux: any, context: any): CategoryScore {
    const factors: ScoreFactor[] = [
      {
        name: 'Page Load Speed',
        score: this.calculateLoadSpeedScore(ux?.loadTime || 5000),
        maxScore: 100,
        weight: 0.30,
        impact: 'high',
        description: 'Page loading performance',
      },
      {
        name: 'Mobile Experience',
        score: this.calculateMobileUXScore(ux?.mobile),
        maxScore: 100,
        weight: 0.25,
        impact: 'high',
        description: 'Mobile user experience',
      },
      {
        name: 'Navigation',
        score: this.calculateNavigationScore(ux?.navigation),
        maxScore: 100,
        weight: 0.20,
        impact: 'medium',
        description: 'Site navigation and usability',
      },
      {
        name: 'Accessibility',
        score: this.calculateAccessibilityScore(ux?.accessibility),
        maxScore: 100,
        weight: 0.15,
        impact: 'medium',
        description: 'Web accessibility compliance',
      },
      {
        name: 'Visual Design',
        score: this.calculateDesignScore(ux?.design),
        maxScore: 100,
        weight: 0.10,
        impact: 'low',
        description: 'Visual design and layout',
      },
    ];

    const weightedScore = factors.reduce((sum, factor) => 
      sum + (factor.score * factor.weight), 0
    );

    const issues = this.generateUXIssues(factors);
    const recommendations = this.generateUXRecommendations(factors);

    return {
      score: Math.round(weightedScore),
      maxScore: 100,
      weight: this.getEffectiveWeights().ux,
      factors,
      issues,
      recommendations,
    };
  }

  private calculatePerformanceScore(context: any): CategoryScore {
    const coreWebVitals = context.coreWebVitals || {};
    const lighthouseMetrics = context.lighthouseMetrics || {};

    const factors: ScoreFactor[] = [
      {
        name: 'Largest Contentful Paint',
        score: this.calculateLCPScore(coreWebVitals.lcp || lighthouseMetrics.largestContentfulPaint),
        maxScore: 100,
        weight: 0.30,
        impact: 'high',
        description: 'Largest Contentful Paint performance',
      },
      {
        name: 'First Input Delay',
        score: this.calculateFIDScore(coreWebVitals.fid || lighthouseMetrics.firstInputDelay),
        maxScore: 100,
        weight: 0.25,
        impact: 'high',
        description: 'First Input Delay responsiveness',
      },
      {
        name: 'Cumulative Layout Shift',
        score: this.calculateCLSScore(coreWebVitals.cls || lighthouseMetrics.cumulativeLayoutShift),
        maxScore: 100,
        weight: 0.25,
        impact: 'high',
        description: 'Visual stability measurement',
      },
      {
        name: 'Time to First Byte',
        score: this.calculateTTFBScore(coreWebVitals.ttfb || lighthouseMetrics.timeToFirstByte),
        maxScore: 100,
        weight: 0.20,
        impact: 'medium',
        description: 'Server response time',
      },
    ];

    const weightedScore = factors.reduce((sum, factor) => 
      sum + (factor.score * factor.weight), 0
    );

    const issues = this.generatePerformanceIssues(factors);
    const recommendations = this.generatePerformanceRecommendations(factors);

    return {
      score: Math.round(weightedScore),
      maxScore: 100,
      weight: this.getEffectiveWeights().performance,
      factors,
      issues,
      recommendations,
    };
  }

  // Helper methods for specific score calculations
  private calculateSecurityHeadersScore(security: any): number {
    if (!security) return 50;
    
    const headers = [
      security.hasHSTS,
      security.hasCSP,
      security.hasXFrameOptions,
      security.hasXContentTypeOptions,
    ];
    
    const score = (headers.filter(Boolean).length / headers.length) * 100;
    return Math.round(score);
  }

  private calculateCrawlabilityScore(crawlability: any): number {
    if (!crawlability) return 70;
    
    let score = 0;
    if (crawlability.robotsTxtValid) score += 25;
    if (crawlability.sitemapExists) score += 25;
    if (crawlability.canonicalValid) score += 25;
    if (crawlability.redirectChainLength <= 3) score += 25;
    
    return score;
  }

  private calculateMobileScore(mobile: any): number {
    if (!mobile) return 60;
    
    let score = 0;
    if (mobile.hasViewport) score += 30;
    if (mobile.responsiveDesign) score += 30;
    if (mobile.touchFriendly) score += 20;
    if (!mobile.textTooSmall) score += 10;
    if (!mobile.contentWiderThanScreen) score += 10;
    
    return score;
  }

  private calculateStructureScore(structure: any): number {
    if (!structure) return 70;
    
    let score = 0;
    if (structure.semanticHtml) score += 25;
    if (structure.properHeadingStructure) score += 25;
    if (structure.validHtml) score += 25;
    if (structure.schemaMarkup) score += 15;
    if (structure.breadcrumbs) score += 10;
    
    return score;
  }

  private calculateContentDepthScore(depth: any): number {
    if (!depth) return 50;
    
    const wordCount = depth.wordCount || 0;
    const topicCoverage = depth.topicCoverage || 0.5;
    
    let wordScore = 0;
    if (wordCount >= 1500) wordScore = 100;
    else if (wordCount >= 1000) wordScore = 80;
    else if (wordCount >= 500) wordScore = 60;
    else if (wordCount >= 300) wordScore = 40;
    else wordScore = 20;
    
    const coverageScore = topicCoverage * 100;
    
    return Math.round((wordScore * 0.6) + (coverageScore * 0.4));
  }

  private calculateContentQualityScore(quality: any): number {
    if (!quality) return 60;
    
    let score = 100;
    if (quality.duplicateContent) score -= 30;
    score *= quality.uniqueness || 0.8;
    
    // Factor in E-A-T scores
    const eatScore = (
      (quality.expertise || 0.7) +
      (quality.authority || 0.7) +
      (quality.trustworthiness || 0.7)
    ) / 3;
    
    return Math.round(score * eatScore);
  }

  private calculateReadabilityScore(readability: any): number {
    if (!readability) return 60;
    
    const fleschScore = readability.fleschReadingEase || 60;
    
    // Convert Flesch score to 0-100 scale
    if (fleschScore >= 90) return 100;
    if (fleschScore >= 80) return 90;
    if (fleschScore >= 70) return 80;
    if (fleschScore >= 60) return 70;
    if (fleschScore >= 50) return 60;
    if (fleschScore >= 30) return 50;
    return 30;
  }

  private calculateKeywordScore(keywords: any): number {
    if (!keywords) return 50;
    
    let score = 0;
    if (keywords.inTitle) score += 30;
    if (keywords.inH1) score += 25;
    if (keywords.inMeta) score += 20;
    
    const density = keywords.density || 0;
    if (density >= 0.01 && density <= 0.03) score += 15; // Optimal density
    else if (density > 0 && density <= 0.05) score += 10;
    else if (density > 0) score += 5;
    
    score += Math.min(keywords.lsiKeywords || 0, 10); // Bonus for LSI keywords
    
    return Math.min(score, 100);
  }

  private calculateFreshnessScore(freshness: any): number {
    if (!freshness) return 70;
    
    const daysSinceUpdate = freshness.daysSinceLastUpdate || 365;
    
    if (daysSinceUpdate <= 7) return 100;
    if (daysSinceUpdate <= 30) return 90;
    if (daysSinceUpdate <= 90) return 80;
    if (daysSinceUpdate <= 180) return 70;
    if (daysSinceUpdate <= 365) return 60;
    return 40;
  }

  // Additional scoring methods for other factors...
  private calculateTitleScore(metaTags: any): number {
    if (!metaTags?.title) return 0;
    
    const title = metaTags.title;
    let score = 60; // Base score for having a title
    
    if (title.length >= 30 && title.length <= 60) score += 20;
    else if (title.length >= 20 && title.length <= 70) score += 10;
    
    // Check if title is unique and descriptive
    if (title.toLowerCase().includes('home') || title.toLowerCase().includes('untitled')) {
      score -= 20;
    }
    
    return Math.min(score, 100);
  }

  private calculateMetaDescriptionScore(metaTags: any): number {
    if (!metaTags?.description) return 0;
    
    const description = metaTags.description;
    let score = 60; // Base score for having a description
    
    if (description.length >= 120 && description.length <= 160) score += 30;
    else if (description.length >= 100 && description.length <= 180) score += 20;
    else if (description.length >= 50) score += 10;
    
    return Math.min(score, 100);
  }

  private calculateHeadingScore(headings: any): number {
    if (!headings) return 50;
    
    let score = 0;
    
    // Check for H1
    if (headings.h1 && headings.h1.length === 1) score += 40;
    else if (headings.h1 && headings.h1.length > 1) score += 20; // Multiple H1s penalized
    
    // Check hierarchy
    if (headings.hierarchyValid) score += 30;
    
    // Check keyword optimization
    if (headings.keywordOptimized) score += 20;
    
    // Check for skipped levels
    if (!headings.skippedLevels) score += 10;
    
    return score;
  }

  private calculateImageScore(images: any): number {
    if (!images) return 70;
    
    const total = images.total || 1;
    const missingAlt = images.missingAlt || 0;
    const altScore = ((total - missingAlt) / total) * 70;
    
    let optimizationScore = 30;
    if (images.modernFormats > 0.7) optimizationScore += 20;
    if (images.lazyLoading) optimizationScore += 10;
    
    return Math.round(altScore + optimizationScore);
  }

  private calculateLinkScore(links: any): number {
    if (!links) return 70;
    
    const internal = links.internal || 0;
    const external = links.external || 0;
    const broken = links.broken || 0;
    
    let score = 50; // Base score
    
    // Internal linking
    if (internal >= 3) score += 20;
    else if (internal >= 1) score += 10;
    
    // External links
    if (external >= 1 && external <= 5) score += 15;
    else if (external > 0) score += 10;
    
    // Penalty for broken links
    score -= broken * 5;
    
    // Anchor text optimization
    if (links.anchorTextOptimized) score += 15;
    
    return Math.max(0, Math.min(score, 100));
  }

  private calculateSchemaScore(schema: any): number {
    if (!schema) return 30;
    
    let score = 0;
    
    if (schema.exists) score += 50;
    if (schema.errors === 0) score += 20;
    if (schema.richResultsEligible) score += 20;
    if (schema.types > 1) score += 10;
    
    return score;
  }

  // Performance scoring methods
  private calculateLCPScore(lcp: number): number {
    if (!lcp) return 50;
    
    if (lcp <= 2500) return 100;
    if (lcp <= 4000) return 75;
    if (lcp <= 6000) return 50;
    return 25;
  }

  private calculateFIDScore(fid: number): number {
    if (!fid) return 50;
    
    if (fid <= 100) return 100;
    if (fid <= 300) return 75;
    if (fid <= 500) return 50;
    return 25;
  }

  private calculateCLSScore(cls: number): number {
    if (cls === undefined) return 50;
    
    if (cls <= 0.1) return 100;
    if (cls <= 0.25) return 75;
    if (cls <= 0.5) return 50;
    return 25;
  }

  private calculateTTFBScore(ttfb: number): number {
    if (!ttfb) return 50;
    
    if (ttfb <= 200) return 100;
    if (ttfb <= 500) return 85;
    if (ttfb <= 800) return 70;
    if (ttfb <= 1200) return 50;
    return 25;
  }

  // UX scoring methods
  private calculateLoadSpeedScore(loadTime: number): number {
    if (loadTime <= 1000) return 100;
    if (loadTime <= 2000) return 90;
    if (loadTime <= 3000) return 80;
    if (loadTime <= 4000) return 70;
    if (loadTime <= 5000) return 60;
    return 40;
  }

  private calculateMobileUXScore(mobile: any): number {
    // This would integrate with mobile-specific metrics
    return 75; // Default score
  }

  private calculateNavigationScore(navigation: any): number {
    return 80; // Default score - would analyze navigation structure
  }

  private calculateAccessibilityScore(accessibility: any): number {
    return 70; // Default score - would analyze accessibility features
  }

  private calculateDesignScore(design: any): number {
    return 75; // Default score - would analyze visual design elements
  }

  // Helper methods
  private getEffectiveWeights(): ScoreWeights {
    return {
      ...this.defaultWeights,
      ...this.customWeights,
    };
  }

  private calculateTrend(scoreChange: number): 'improving' | 'declining' | 'stable' {
    if (scoreChange > 5) return 'improving';
    if (scoreChange < -5) return 'declining';
    return 'stable';
  }

  private calculateGrade(score: number): EnhancedScoringResult['grade'] {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private identifyPriorityIssues(issues: string[]): string[] {
    // Filter and prioritize the most critical issues
    return issues.filter(issue => 
      issue.includes('SSL') || 
      issue.includes('mobile') || 
      issue.includes('crawl') ||
      issue.includes('title') ||
      issue.includes('speed')
    ).slice(0, 5);
  }

  private identifyQuickWins(issues: string[]): string[] {
    // Identify issues that can be fixed quickly
    return issues.filter(issue =>
      issue.includes('alt text') ||
      issue.includes('meta description') ||
      issue.includes('heading') ||
      issue.includes('schema')
    ).slice(0, 3);
  }

  private generateBenchmarks(score: number): EnhancedScoringResult['benchmarks'] {
    // In a real implementation, this would fetch actual industry benchmarks
    return {
      industry: 72,
      competitors: 68,
      topPerformers: 88,
    };
  }

  // Issue and recommendation generation methods
  private generateTechnicalIssues(factors: ScoreFactor[]): string[] {
    const issues: string[] = [];
    
    factors.forEach(factor => {
      if (factor.score < 70) {
        issues.push(`${factor.name}: ${factor.description} needs improvement`);
      }
    });
    
    return issues;
  }

  private generateTechnicalRecommendations(factors: ScoreFactor[]): string[] {
    // Generate specific recommendations based on technical factors
    return factors
      .filter(f => f.score < 80)
      .map(f => `Improve ${f.name.toLowerCase()} implementation`)
      .slice(0, 3);
  }

  private generateContentIssues(factors: ScoreFactor[]): string[] {
    return factors
      .filter(f => f.score < 70)
      .map(f => `Content issue: ${f.description}`);
  }

  private generateContentRecommendations(factors: ScoreFactor[]): string[] {
    return factors
      .filter(f => f.score < 80)
      .map(f => `Enhance ${f.name.toLowerCase()}`)
      .slice(0, 3);
  }

  private generateOnPageIssues(factors: ScoreFactor[]): string[] {
    return factors
      .filter(f => f.score < 70)
      .map(f => `On-page issue: ${f.description}`);
  }

  private generateOnPageRecommendations(factors: ScoreFactor[]): string[] {
    return factors
      .filter(f => f.score < 80)
      .map(f => `Optimize ${f.name.toLowerCase()}`)
      .slice(0, 3);
  }

  private generateUXIssues(factors: ScoreFactor[]): string[] {
    return factors
      .filter(f => f.score < 70)
      .map(f => `UX issue: ${f.description}`);
  }

  private generateUXRecommendations(factors: ScoreFactor[]): string[] {
    return factors
      .filter(f => f.score < 80)
      .map(f => `Improve ${f.name.toLowerCase()}`)
      .slice(0, 3);
  }

  private generatePerformanceIssues(factors: ScoreFactor[]): string[] {
    return factors
      .filter(f => f.score < 70)
      .map(f => `Performance issue: ${f.description}`);
  }

  private generatePerformanceRecommendations(factors: ScoreFactor[]): string[] {
    return factors
      .filter(f => f.score < 80)
      .map(f => `Optimize ${f.name.toLowerCase()}`)
      .slice(0, 3);
  }

  // Detailed breakdown generation methods
  private generateTechnicalBreakdown(technical: any, context: any): any {
    return {
      security: technical.security,
      crawlability: technical.crawlability,
      mobile: technical.mobile,
      structure: technical.structure,
      performance: technical.performance,
    };
  }

  private generateContentBreakdown(content: any, context: any): any {
    return {
      depth: content.depth,
      quality: content.quality,
      readability: content.readability,
      keywords: content.keywords,
      freshness: content.freshness,
    };
  }

  private generateOnPageBreakdown(onPage: any, context: any): any {
    return {
      metaTags: onPage.metaTags,
      headings: onPage.headings,
      images: onPage.images,
      links: onPage.links,
      schema: onPage.schema,
    };
  }

  private generateUXBreakdown(ux: any, context: any): any {
    return {
      loadSpeed: ux?.loadTime,
      mobile: ux?.mobile,
      navigation: ux?.navigation,
      accessibility: ux?.accessibility,
      design: ux?.design,
    };
  }

  private generatePerformanceBreakdown(context: any): any {
    return {
      coreWebVitals: context.coreWebVitals,
      lighthouse: context.lighthouseMetrics,
    };
  }
} 