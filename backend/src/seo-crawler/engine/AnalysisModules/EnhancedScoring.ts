import { PageAnalysis } from '../../types/PageAnalysis';

export interface ScoreBreakdown {
  overall: number;
  technical: number;
  content: number;
  onPage: number;
  userExperience: number;
  breakdown: {
    technical: TechnicalScoreBreakdown;
    content: ContentScoreBreakdown;
    onPage: OnPageScoreBreakdown;
    userExperience: UXScoreBreakdown;
  };
  trends?: {
    change: number;
    direction: 'up' | 'down' | 'stable';
    previousScore?: number;
  };
  benchmarks?: {
    industry: number;
    competitive: number;
  };
}

export interface TechnicalScoreBreakdown {
  performance: { score: number; weight: number };
  security: { score: number; weight: number };
  crawlability: { score: number; weight: number };
  mobile: { score: number; weight: number };
  structure: { score: number; weight: number };
}

export interface ContentScoreBreakdown {
  depth: { score: number; weight: number };
  quality: { score: number; weight: number };
  readability: { score: number; weight: number };
  keywords: { score: number; weight: number };
  freshness: { score: number; weight: number };
}

export interface OnPageScoreBreakdown {
  metaTags: { score: number; weight: number };
  headings: { score: number; weight: number };
  images: { score: number; weight: number };
  links: { score: number; weight: number };
  schema: { score: number; weight: number };
}

export interface UXScoreBreakdown {
  accessibility: { score: number; weight: number };
  usability: { score: number; weight: number };
  navigation: { score: number; weight: number };
  engagement: { score: number; weight: number };
}

export interface SEOIssue {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  fixComplexity: 'easy' | 'medium' | 'hard';
  affectedElements: string[];
  recommendation: string;
  category: 'technical' | 'content' | 'onpage' | 'ux';
}

export class EnhancedScoring {
  private readonly weights = {
    technical: 0.3,      // 30% - Technical SEO foundation
    content: 0.25,       // 25% - Content quality and depth
    onPage: 0.25,        // 25% - On-page optimization
    userExperience: 0.2  // 20% - UX and accessibility
  };

  private readonly technicalWeights = {
    performance: 0.4,     // 40% of technical score
    security: 0.2,        // 20% of technical score
    crawlability: 0.2,    // 20% of technical score
    mobile: 0.15,         // 15% of technical score
    structure: 0.05       // 5% of technical score
  };

  private readonly contentWeights = {
    depth: 0.3,           // 30% of content score
    quality: 0.25,        // 25% of content score
    readability: 0.2,     // 20% of content score
    keywords: 0.15,       // 15% of content score
    freshness: 0.1        // 10% of content score
  };

  private readonly onPageWeights = {
    metaTags: 0.35,       // 35% of on-page score
    headings: 0.25,       // 25% of on-page score
    images: 0.15,         // 15% of on-page score
    links: 0.15,          // 15% of on-page score
    schema: 0.1           // 10% of on-page score
  };

  private readonly uxWeights = {
    accessibility: 0.4,   // 40% of UX score
    usability: 0.3,       // 30% of UX score
    navigation: 0.2,      // 20% of UX score
    engagement: 0.1       // 10% of UX score
  };

  async analyze(pageContext: any): Promise<Partial<PageAnalysis> & { scoreBreakdown: ScoreBreakdown }> {
    const analyses = pageContext.pageAnalysis || {};
    
    // Calculate category scores
    const technicalScore = this.calculateTechnicalScore(analyses.technical);
    const contentScore = this.calculateContentScore(analyses.content);
    const onPageScore = this.calculateOnPageScore(analyses.onPage);
    const uxScore = this.calculateUXScore(analyses.userExperience);

    // Calculate weighted overall score
    const overallScore = Math.round(
      technicalScore.score * this.weights.technical +
      contentScore.score * this.weights.content +
      onPageScore.score * this.weights.onPage +
      uxScore.score * this.weights.userExperience
    );

    // Apply risk adjustments based on critical issues
    const issues = this.detectCriticalIssues(analyses);
    const riskAdjustedScore = this.calculateRiskAdjustedScore(overallScore, issues);

    const scoreBreakdown: ScoreBreakdown = {
      overall: riskAdjustedScore,
      technical: technicalScore.score,
      content: contentScore.score,
      onPage: onPageScore.score,
      userExperience: uxScore.score,
      breakdown: {
        technical: technicalScore.breakdown,
        content: contentScore.breakdown,
        onPage: onPageScore.breakdown,
        userExperience: uxScore.breakdown
      }
    };

    return {
      score: riskAdjustedScore,
      technicalScore: technicalScore.score,
      contentScore: contentScore.score,
      onpageScore: onPageScore.score,
      uxScore: uxScore.score,
      scoreBreakdown,
      issues
    };
  }

  private calculateTechnicalScore(technical: any): { score: number; breakdown: TechnicalScoreBreakdown } {
    const performance = this.calculatePerformanceScore(technical?.performance);
    const security = this.calculateSecurityScore(technical?.security);
    const crawlability = this.calculateCrawlabilityScore(technical?.crawlability);
    const mobile = this.calculateMobileScore(technical?.mobile);
    const structure = this.calculateStructureScore(technical?.structure);

    const score = Math.round(
      performance * this.technicalWeights.performance +
      security * this.technicalWeights.security +
      crawlability * this.technicalWeights.crawlability +
      mobile * this.technicalWeights.mobile +
      structure * this.technicalWeights.structure
    );

    return {
      score: Math.max(0, Math.min(100, score)),
      breakdown: {
        performance: { score: performance, weight: this.technicalWeights.performance },
        security: { score: security, weight: this.technicalWeights.security },
        crawlability: { score: crawlability, weight: this.technicalWeights.crawlability },
        mobile: { score: mobile, weight: this.technicalWeights.mobile },
        structure: { score: structure, weight: this.technicalWeights.structure }
      }
    };
  }

  private calculateContentScore(content: any): { score: number; breakdown: ContentScoreBreakdown } {
    const depth = this.calculateContentDepthScore(content?.depth);
    const quality = this.calculateContentQualityScore(content?.quality);
    const readability = this.calculateReadabilityScore(content?.readability);
    const keywords = this.calculateKeywordScore(content?.keywords);
    const freshness = this.calculateFreshnessScore(content?.freshness);

    const score = Math.round(
      depth * this.contentWeights.depth +
      quality * this.contentWeights.quality +
      readability * this.contentWeights.readability +
      keywords * this.contentWeights.keywords +
      freshness * this.contentWeights.freshness
    );

    return {
      score: Math.max(0, Math.min(100, score)),
      breakdown: {
        depth: { score: depth, weight: this.contentWeights.depth },
        quality: { score: quality, weight: this.contentWeights.quality },
        readability: { score: readability, weight: this.contentWeights.readability },
        keywords: { score: keywords, weight: this.contentWeights.keywords },
        freshness: { score: freshness, weight: this.contentWeights.freshness }
      }
    };
  }

  private calculateOnPageScore(onPage: any): { score: number; breakdown: OnPageScoreBreakdown } {
    const metaTags = this.calculateMetaTagsScore(onPage?.metaTags);
    const headings = this.calculateHeadingsScore(onPage?.headings);
    const images = this.calculateImagesScore(onPage?.images);
    const links = this.calculateLinksScore(onPage?.links);
    const schema = this.calculateSchemaScore(onPage?.schema);

    const score = Math.round(
      metaTags * this.onPageWeights.metaTags +
      headings * this.onPageWeights.headings +
      images * this.onPageWeights.images +
      links * this.onPageWeights.links +
      schema * this.onPageWeights.schema
    );

    return {
      score: Math.max(0, Math.min(100, score)),
      breakdown: {
        metaTags: { score: metaTags, weight: this.onPageWeights.metaTags },
        headings: { score: headings, weight: this.onPageWeights.headings },
        images: { score: images, weight: this.onPageWeights.images },
        links: { score: links, weight: this.onPageWeights.links },
        schema: { score: schema, weight: this.onPageWeights.schema }
      }
    };
  }

  private calculateUXScore(ux: any): { score: number; breakdown: UXScoreBreakdown } {
    const accessibility = this.calculateAccessibilityScore(ux?.accessibility);
    const usability = this.calculateUsabilityScore(ux?.usability);
    const navigation = this.calculateNavigationScore(ux?.navigation);
    const engagement = this.calculateEngagementScore(ux?.engagement);

    const score = Math.round(
      accessibility * this.uxWeights.accessibility +
      usability * this.uxWeights.usability +
      navigation * this.uxWeights.navigation +
      engagement * this.uxWeights.engagement
    );

    return {
      score: Math.max(0, Math.min(100, score)),
      breakdown: {
        accessibility: { score: accessibility, weight: this.uxWeights.accessibility },
        usability: { score: usability, weight: this.uxWeights.usability },
        navigation: { score: navigation, weight: this.uxWeights.navigation },
        engagement: { score: engagement, weight: this.uxWeights.engagement }
      }
    };
  }

  private calculatePerformanceScore(performance: any): number {
    if (!performance) return 60; // Default score if no performance data

    const metrics = {
      lcp: performance.largestContentfulPaint || 3000,
      fid: performance.firstInputDelay || 100,
      cls: performance.cumulativeLayoutShift || 0.1,
      fcp: performance.firstContentfulPaint || 2000,
      ttfb: performance.timeToFirstByte || 800
    };

    // Score each metric (Google's thresholds)
    const lcpScore = metrics.lcp <= 2500 ? 100 : metrics.lcp <= 4000 ? 75 : 25;
    const fidScore = metrics.fid <= 100 ? 100 : metrics.fid <= 300 ? 75 : 25;
    const clsScore = metrics.cls <= 0.1 ? 100 : metrics.cls <= 0.25 ? 75 : 25;
    const fcpScore = metrics.fcp <= 1800 ? 100 : metrics.fcp <= 3000 ? 75 : 25;
    const ttfbScore = metrics.ttfb <= 600 ? 100 : metrics.ttfb <= 1200 ? 75 : 25;

    // Weighted average (Core Web Vitals are more important)
    return Math.round(
      lcpScore * 0.3 +
      fidScore * 0.3 +
      clsScore * 0.3 +
      fcpScore * 0.05 +
      ttfbScore * 0.05
    );
  }

  private calculateSecurityScore(security: any): number {
    let score = 100;
    
    if (!security?.hasSSL) score -= 40;
    if (!security?.hasHSTS) score -= 15;
    if (!security?.hasCSP) score -= 15;
    if (!security?.hasXFrameOptions) score -= 10;
    if (!security?.hasXContentTypeOptions) score -= 10;
    if (security?.mixedContent) score -= 20;
    
    return Math.max(0, score);
  }

  private calculateCrawlabilityScore(crawlability: any): number {
    let score = 100;
    
    if (!crawlability?.robotsTxtValid) score -= 20;
    if (!crawlability?.sitemapExists) score -= 15;
    if (!crawlability?.canonicalValid) score -= 15;
    if (crawlability?.redirectChainLength > 3) score -= 10;
    if (crawlability?.orphanPages > 0) score -= 10;
    
    return Math.max(0, score);
  }

  private calculateMobileScore(mobile: any): number {
    let score = 100;
    
    if (!mobile?.hasViewport) score -= 30;
    if (!mobile?.responsiveDesign) score -= 25;
    if (!mobile?.touchFriendly) score -= 20;
    if (mobile?.textTooSmall) score -= 15;
    if (mobile?.contentWiderThanScreen) score -= 10;
    
    return Math.max(0, score);
  }

  private calculateStructureScore(structure: any): number {
    let score = 100;
    
    if (!structure?.semanticHtml) score -= 20;
    if (!structure?.properHeadingStructure) score -= 15;
    if (!structure?.validHtml) score -= 15;
    if (!structure?.schemaMarkup) score -= 25;
    if (!structure?.breadcrumbs) score -= 10;
    
    return Math.max(0, score);
  }

  private calculateContentDepthScore(depth: any): number {
    if (!depth) return 50;
    
    const wordCount = depth.wordCount || 0;
    let score = 0;
    
    if (wordCount >= 2000) score = 100;
    else if (wordCount >= 1500) score = 90;
    else if (wordCount >= 1000) score = 80;
    else if (wordCount >= 500) score = 60;
    else if (wordCount >= 300) score = 40;
    else score = 20;
    
    // Adjust for topic coverage and structure
    if (depth.topicCoverage > 0.8) score += 10;
    if (depth.contentStructure?.wellOrganized) score += 5;
    
    return Math.min(100, score);
  }

  private calculateContentQualityScore(quality: any): number {
    if (!quality) return 60;
    
    let score = 80; // Base score
    
    if (quality.duplicateContent) score -= 30;
    if (quality.grammarErrors > 5) score -= 10;
    if (quality.spellingErrors > 3) score -= 10;
    if (quality.uniqueness < 0.8) score -= 15;
    if (quality.expertise < 0.7) score -= 10;
    
    return Math.max(0, score);
  }

  private calculateReadabilityScore(readability: any): number {
    if (!readability) return 70;
    
    const flesch = readability.fleschReadingEase || 50;
    
    if (flesch >= 90) return 100;
    if (flesch >= 80) return 90;
    if (flesch >= 70) return 80;
    if (flesch >= 60) return 70;
    if (flesch >= 50) return 60;
    if (flesch >= 30) return 40;
    return 20;
  }

  private calculateKeywordScore(keywords: any): number {
    if (!keywords) return 50;
    
    let score = 70; // Base score
    
    if (keywords.density > 0.03) score -= 20; // Keyword stuffing
    if (keywords.density < 0.005) score -= 15; // Under-optimized
    if (!keywords.inTitle) score -= 15;
    if (!keywords.inH1) score -= 10;
    if (!keywords.inMeta) score -= 10;
    if (keywords.lsiKeywords < 3) score -= 10;
    
    return Math.max(0, score);
  }

  private calculateFreshnessScore(freshness: any): number {
    if (!freshness) return 70;
    
    const daysSinceUpdate = freshness.daysSinceLastUpdate || 0;
    
    if (daysSinceUpdate <= 30) return 100;
    if (daysSinceUpdate <= 90) return 80;
    if (daysSinceUpdate <= 180) return 60;
    if (daysSinceUpdate <= 365) return 40;
    return 20;
  }

  private calculateMetaTagsScore(metaTags: any): number {
    let score = 100;
    
    if (!metaTags?.title) score -= 30;
    else if (metaTags.title.length > 60 || metaTags.title.length < 30) score -= 10;
    
    if (!metaTags?.description) score -= 25;
    else if (metaTags.description.length > 160 || metaTags.description.length < 120) score -= 10;
    
    if (!metaTags?.canonical) score -= 15;
    if (!metaTags?.openGraph) score -= 10;
    if (!metaTags?.twitterCard) score -= 10;
    
    return Math.max(0, score);
  }

  private calculateHeadingsScore(headings: any): number {
    let score = 100;
    
    if (!headings?.h1 || headings.h1.length === 0) score -= 40;
    else if (headings.h1.length > 1) score -= 20;
    
    if (!headings?.hierarchyValid) score -= 20;
    if (!headings?.keywordOptimized) score -= 15;
    if (headings?.skippedLevels) score -= 15;
    
    return Math.max(0, score);
  }

  private calculateImagesScore(images: any): number {
    if (!images) return 80;
    
    let score = 100;
    const missingAltRatio = images.missingAlt / (images.total || 1);
    
    score -= missingAltRatio * 40;
    if (images.oversized > 0) score -= 15;
    if (images.modernFormats < 0.5) score -= 10;
    if (!images.lazyLoading) score -= 10;
    
    return Math.max(0, score);
  }

  private calculateLinksScore(links: any): number {
    if (!links) return 80;
    
    let score = 100;
    
    if (links.broken > 0) score -= 30;
    if (links.nofollow > links.external * 0.8) score -= 15;
    if (links.internal < 3) score -= 10;
    if (!links.anchorTextOptimized) score -= 15;
    
    return Math.max(0, score);
  }

  private calculateSchemaScore(schema: any): number {
    if (!schema) return 60;
    
    let score = 80; // Base score for having schema
    
    if (schema.errors > 0) score -= 20;
    if (!schema.richResultsEligible) score -= 15;
    if (schema.types < 2) score -= 10;
    if (!schema.structured) score -= 10;
    
    return Math.max(0, score);
  }

  private calculateAccessibilityScore(accessibility: any): number {
    if (!accessibility) return 70;
    
    let score = 100;
    
    if (accessibility.missingAlt > 0) score -= 20;
    if (!accessibility.properHeadings) score -= 15;
    if (!accessibility.colorContrast) score -= 15;
    if (!accessibility.keyboardNavigation) score -= 15;
    if (!accessibility.focusIndicators) score -= 10;
    if (!accessibility.altText) score -= 10;
    
    return Math.max(0, score);
  }

  private calculateUsabilityScore(usability: any): number {
    if (!usability) return 75;
    
    let score = 100;
    
    if (!usability.mobileOptimized) score -= 25;
    if (!usability.fastLoading) score -= 20;
    if (!usability.easyNavigation) score -= 15;
    if (!usability.clearCTA) score -= 15;
    if (!usability.searchFunctionality) score -= 10;
    
    return Math.max(0, score);
  }

  private calculateNavigationScore(navigation: any): number {
    if (!navigation) return 75;
    
    let score = 100;
    
    if (!navigation.breadcrumbs) score -= 20;
    if (!navigation.mainMenu) score -= 15;
    if (!navigation.footer) score -= 10;
    if (!navigation.searchable) score -= 15;
    if (navigation.depth > 4) score -= 15;
    
    return Math.max(0, score);
  }

  private calculateEngagementScore(engagement: any): number {
    if (!engagement) return 70;
    
    let score = 80;
    
    if (engagement.bounceRate > 0.7) score -= 20;
    if (engagement.timeOnPage < 60) score -= 15;
    if (!engagement.socialSharing) score -= 10;
    if (!engagement.interactiveElements) score -= 10;
    
    return Math.max(0, score);
  }

  private calculateRiskAdjustedScore(baseScore: number, issues: SEOIssue[]): number {
    const criticalIssues = issues.filter(issue => issue.severity === 'critical');
    const highIssues = issues.filter(issue => issue.severity === 'high');
    
    let adjustment = 0;
    adjustment += criticalIssues.length * 10;  // -10 points per critical issue
    adjustment += highIssues.length * 5;       // -5 points per high issue
    
    return Math.max(0, baseScore - adjustment);
  }

  private detectCriticalIssues(analyses: any): SEOIssue[] {
    const issues: SEOIssue[] = [];
    
    // Critical technical issues
    if (!analyses.technical?.security?.hasSSL) {
      issues.push({
        id: 'no-ssl',
        type: 'security',
        severity: 'critical',
        title: 'No SSL Certificate',
        description: 'This page is not served over HTTPS.',
        impact: 'Search engines prefer HTTPS sites, and users see security warnings',
        fixComplexity: 'medium',
        affectedElements: ['entire site'],
        recommendation: 'Install an SSL certificate and redirect all HTTP traffic to HTTPS.',
        category: 'technical'
      });
    }
    
    // Critical on-page issues
    if (!analyses.onPage?.metaTags?.title) {
      issues.push({
        id: 'missing-title',
        type: 'meta-tags',
        severity: 'critical',
        title: 'Missing Title Tag',
        description: 'This page is missing a title tag.',
        impact: 'Severely impacts search rankings and click-through rates',
        fixComplexity: 'easy',
        affectedElements: ['title tag'],
        recommendation: 'Add a descriptive, keyword-rich title tag (30-60 characters).',
        category: 'onpage'
      });
    }
    
    return issues;
  }
} 