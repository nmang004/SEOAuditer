import { PrismaClient } from '@prisma/client';
import { EnhancedPageAnalysis } from '../seo-crawler/engine/EnhancedPageAnalyzer';
import { logger } from '../utils/logger';
import { cache } from '../utils/cache';

export interface AnalysisResult {
  id: string;
  projectId: string;
  overallScore: number;
  technicalScore: number;
  contentScore: number;
  onpageScore: number;
  uxScore: number;
  previousScore?: number;
  scoreChange?: number;
  issues: AnalysisIssue[];
  recommendations: AnalysisRecommendation[];
  metaTags: any;
  scoreBreakdown: any;
  contentAnalysis: any;
  performanceMetrics: any;
  trends?: any;
  benchmarks?: any;
}

export interface AnalysisIssue {
  type: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  element?: string;
  recommendation: string;
  effort: 'low' | 'medium' | 'high';
  priority: number;
}

export interface AnalysisRecommendation {
  category: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  estimatedImpact: number;
  implementation: string;
  resources?: string[];
}

export class AnalysisIntegrationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Normalize and store analysis results in the database
   */
  async storeAnalysisResults(
    crawlSessionId: string,
    projectId: string,
    analysisResult: EnhancedPageAnalysis
  ): Promise<AnalysisResult> {
    try {
      logger.info(`Storing analysis results for session ${crawlSessionId}`);

      // Normalize the analysis result
      const normalizedResult = this.normalizeAnalysisResult(analysisResult);
      
      // Get previous analysis for comparison
      const previousAnalysis = await this.getPreviousAnalysis(projectId);
      const scoreChange = previousAnalysis 
        ? normalizedResult.overallScore - previousAnalysis.overallScore 
        : 0;

      // Create main analysis record
      const seoAnalysis = await this.prisma.sEOAnalysis.create({
        data: {
          crawlSessionId,
          projectId,
          overallScore: normalizedResult.overallScore,
          technicalScore: normalizedResult.technicalScore,
          contentScore: normalizedResult.contentScore,
          onpageScore: normalizedResult.onpageScore,
          uxScore: normalizedResult.uxScore,
          previousScore: previousAnalysis?.overallScore,
          scoreChange,
        },
      });

      // Store score breakdown
      if (analysisResult.scoreBreakdown) {
        await this.prisma.sEOScoreBreakdown.create({
          data: {
            analysisId: seoAnalysis.id,
            technicalBreakdown: normalizedResult.scoreBreakdown.technical || {},
            contentBreakdown: normalizedResult.scoreBreakdown.content || {},
            onPageBreakdown: normalizedResult.scoreBreakdown.onPage || {},
            uxBreakdown: normalizedResult.scoreBreakdown.ux || {},
            weights: normalizedResult.scoreBreakdown.weights || {},
            trends: normalizedResult.trends || {},
            benchmarks: normalizedResult.benchmarks || {},
          },
        });
      }

      // Store content analysis
      if (analysisResult.contentAnalysis) {
        await this.prisma.contentAnalysis.create({
          data: {
            analysisId: seoAnalysis.id,
            wordCount: analysisResult.contentAnalysis.wordCount || 0,
            readingTime: analysisResult.contentAnalysis.readingTime || 0,
            paragraphCount: analysisResult.contentAnalysis.paragraphCount || 0,
            sentenceCount: analysisResult.contentAnalysis.sentenceCount || 0,
            averageSentenceLength: analysisResult.contentAnalysis.averageSentenceLength || 0,
            topicCoverage: analysisResult.contentAnalysis.topicCoverage || 0,
            contentStructure: analysisResult.contentAnalysis.structure || {},
            readabilityMetrics: analysisResult.contentAnalysis.readability || {},
            keywordAnalysis: analysisResult.contentAnalysis.keywords || {},
            freshnessData: analysisResult.contentAnalysis.freshness || {},
            qualityMetrics: analysisResult.contentAnalysis.quality || {},
            overallScore: normalizedResult.contentScore,
            recommendations: analysisResult.contentAnalysis.recommendations || [],
          },
        });
      }

      // Store performance metrics
      if (analysisResult.performanceMetrics) {
        await this.prisma.performanceMetrics.create({
          data: {
            analysisId: seoAnalysis.id,
            coreWebVitals: {
              fcp: analysisResult.performanceMetrics.fcp || 0,
              lcp: analysisResult.performanceMetrics.lcp || 0,
              fid: analysisResult.performanceMetrics.fid || 0,
              cls: analysisResult.performanceMetrics.cls || 0,
              tbt: analysisResult.performanceMetrics.tbt || 0,
              ttfb: analysisResult.performanceMetrics.ttfb || 0,
            },
            loadTime: analysisResult.performanceMetrics.loadTime || 0,
            pageSize: analysisResult.performanceMetrics.pageSize || 0,
            requestCount: analysisResult.performanceMetrics.requestCount || 0,
            performanceScore: analysisResult.performanceMetrics.performanceScore || 0,
            mobilePerfScore: analysisResult.performanceMetrics.mobilePerfScore || 0,
            optimizationOpportunities: analysisResult.performanceMetrics.optimizationOpportunities || {},
            lighthouseData: analysisResult.performanceMetrics.lighthouseData || null,
          },
        });
      }

      // Store meta tags
      if (analysisResult.metaTags) {
        await this.prisma.metaTags.create({
          data: {
            analysisId: seoAnalysis.id,
            title: analysisResult.metaTags.title || '',
            description: analysisResult.metaTags.description || '',
            keywords: analysisResult.metaTags.keywords || '',
            canonicalUrl: analysisResult.metaTags.canonical || '',
            robots: analysisResult.metaTags.robots || '',
            openGraph: {
              title: analysisResult.metaTags.ogTitle || '',
              description: analysisResult.metaTags.ogDescription || '',
              image: analysisResult.metaTags.ogImage || '',
            },
            twitterCard: {
              card: analysisResult.metaTags.twitterCard || '',
            },
            structuredData: analysisResult.metaTags.structuredData || null,
          },
        });
      }

      // Store issues
      const storedIssues = await this.storeAnalysisIssues(
        seoAnalysis.id, 
        normalizedResult.issues
      );

      // Store recommendations
      const storedRecommendations = await this.storeAnalysisRecommendations(
        seoAnalysis.id,
        normalizedResult.recommendations
      );

      // Update project statistics
      await this.updateProjectStatistics(projectId, normalizedResult);

      // Create trend record
      await this.createTrendRecord(projectId, normalizedResult);

      // Clear relevant caches
      await this.clearAnalysisCache(projectId);

      const result: AnalysisResult = {
        id: seoAnalysis.id,
        projectId,
        overallScore: normalizedResult.overallScore,
        technicalScore: normalizedResult.technicalScore,
        contentScore: normalizedResult.contentScore,
        onpageScore: normalizedResult.onpageScore,
        uxScore: normalizedResult.uxScore,
        previousScore: previousAnalysis?.overallScore,
        scoreChange,
        issues: storedIssues,
        recommendations: storedRecommendations,
        metaTags: analysisResult.metaTags,
        scoreBreakdown: normalizedResult.scoreBreakdown,
        contentAnalysis: analysisResult.contentAnalysis,
        performanceMetrics: analysisResult.performanceMetrics,
        trends: normalizedResult.trends,
        benchmarks: normalizedResult.benchmarks,
      };

      logger.info(`Successfully stored analysis results for session ${crawlSessionId}`);
      return result;

    } catch (error) {
      logger.error(`Error storing analysis results for session ${crawlSessionId}:`, error);
      throw new Error(`Failed to store analysis results: ${error}`);
    }
  }

  /**
   * Normalize raw analysis results into consistent format
   */
  private normalizeAnalysisResult(analysisResult: EnhancedPageAnalysis): any {
    // Implement comprehensive SEO scoring algorithm (0-100 scale)
    const scores = this.calculateNormalizedScores(analysisResult);
    
    // Categorize issues by severity and type
    const categorizedIssues = this.categorizeIssues(analysisResult.issues || []);
    
    // Generate detailed recommendations
    const detailedRecommendations = this.generateDetailedRecommendations(
      analysisResult.recommendations || [],
      categorizedIssues
    );

    return {
      overallScore: scores.overall,
      technicalScore: scores.technical,
      contentScore: scores.content,
      onpageScore: scores.onpage,
      uxScore: scores.ux,
      issues: categorizedIssues,
      recommendations: detailedRecommendations,
      scoreBreakdown: this.createScoreBreakdown(scores, analysisResult),
      trends: this.calculateTrends(analysisResult),
      benchmarks: this.calculateBenchmarks(analysisResult),
    };
  }

  /**
   * Calculate normalized scores using comprehensive SEO scoring algorithm
   */
  private calculateNormalizedScores(analysisResult: EnhancedPageAnalysis): any {
    const weights = {
      technical: 0.3,
      content: 0.3,
      onpage: 0.25,
      ux: 0.15,
    };

    // Technical score calculation
    const technicalFactors = {
      performance: (analysisResult.performanceMetrics?.score || 0) / 100,
      security: analysisResult.technical?.https ? 1 : 0.5,
      mobile: analysisResult.technical?.mobile?.responsive ? 1 : 0.3,
      crawlability: analysisResult.technical?.crawlable ? 1 : 0,
      indexability: analysisResult.technical?.indexable ? 1 : 0,
      structuredData: analysisResult.technical?.structuredData ? 0.8 : 0.2,
    };
    
    const technicalScore = Math.round(
      Object.values(technicalFactors).reduce((sum, score) => sum + score, 0) / 
      Object.keys(technicalFactors).length * 100
    );

    // Content score calculation
    const contentFactors = {
      quality: (analysisResult.contentAnalysis?.quality?.score || 0) / 100,
      readability: (analysisResult.contentAnalysis?.readability?.score || 0) / 100,
      uniqueness: analysisResult.content?.unique ? 1 : 0.3,
      depth: Math.min((analysisResult.contentAnalysis?.wordCount || 0) / 1000, 1),
      structure: analysisResult.content?.structure?.headings ? 0.8 : 0.2,
      keywords: (analysisResult.contentAnalysis?.keywords?.density || 0) > 0 ? 0.8 : 0.2,
    };

    const contentScore = Math.round(
      Object.values(contentFactors).reduce((sum, score) => sum + score, 0) / 
      Object.keys(contentFactors).length * 100
    );

    // On-page score calculation
    const onpageFactors = {
      title: analysisResult.metaTags?.title ? 1 : 0,
      description: analysisResult.metaTags?.description ? 1 : 0,
      headings: analysisResult.onPage?.headings?.h1 ? 1 : 0,
      images: analysisResult.onPage?.images?.optimized ? 0.8 : 0.2,
      links: analysisResult.onPage?.links?.internal > 0 ? 0.8 : 0.2,
      schema: analysisResult.onPage?.schema ? 0.8 : 0.2,
    };

    const onpageScore = Math.round(
      Object.values(onpageFactors).reduce((sum, score) => sum + score, 0) / 
      Object.keys(onpageFactors).length * 100
    );

    // UX score calculation
    const uxFactors = {
      mobile: analysisResult.ux?.mobile?.friendly ? 1 : 0.3,
      speed: (analysisResult.performanceMetrics?.score || 0) / 100,
      accessibility: (analysisResult.ux?.accessibility?.score || 0) / 100,
      navigation: analysisResult.ux?.navigation?.clear ? 0.8 : 0.2,
      design: analysisResult.ux?.design?.responsive ? 0.8 : 0.2,
    };

    const uxScore = Math.round(
      Object.values(uxFactors).reduce((sum, score) => sum + score, 0) / 
      Object.keys(uxFactors).length * 100
    );

    // Overall score calculation
    const overallScore = Math.round(
      technicalScore * weights.technical +
      contentScore * weights.content +
      onpageScore * weights.onpage +
      uxScore * weights.ux
    );

    return {
      overall: Math.max(0, Math.min(100, overallScore)),
      technical: Math.max(0, Math.min(100, technicalScore)),
      content: Math.max(0, Math.min(100, contentScore)),
      onpage: Math.max(0, Math.min(100, onpageScore)),
      ux: Math.max(0, Math.min(100, uxScore)),
      weights,
    };
  }

  /**
   * Categorize issues by severity and assign priority
   */
  private categorizeIssues(issues: any[]): AnalysisIssue[] {
    return issues.map(issue => {
      const severity = this.determineSeverity(issue);
      const priority = this.calculatePriority(issue, severity);
      
      return {
        type: issue.type || 'general',
        category: this.categorizeIssue(issue),
        severity,
        title: issue.title || issue.message || 'Unknown Issue',
        description: issue.description || issue.message || '',
        impact: this.calculateImpact(issue, severity),
        element: issue.element || issue.selector,
        recommendation: issue.recommendation || this.generateRecommendation(issue),
        effort: this.estimateEffort(issue),
        priority,
      };
    }).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate detailed recommendations based on analysis results
   */
  private generateDetailedRecommendations(
    recommendations: any[],
    issues: AnalysisIssue[]
  ): AnalysisRecommendation[] {
    const detailedRecommendations: AnalysisRecommendation[] = [];

    // Process existing recommendations
    recommendations.forEach(rec => {
      detailedRecommendations.push({
        category: rec.category || 'general',
        type: rec.type || 'improvement',
        priority: this.mapPriority(rec.priority),
        title: rec.title || rec.message,
        description: rec.description || rec.details || '',
        impact: rec.impact || 'Medium impact on SEO performance',
        effort: this.estimateEffort(rec),
        estimatedImpact: this.estimateImpactScore(rec),
        implementation: rec.implementation || 'Follow SEO best practices',
        resources: rec.resources || [],
      });
    });

    // Generate recommendations from high-priority issues
    const criticalIssues = issues.filter(issue => 
      issue.severity === 'critical' || issue.severity === 'high'
    );

    criticalIssues.forEach(issue => {
      detailedRecommendations.push({
        category: issue.category,
        type: 'fix',
        priority: issue.severity === 'critical' ? 'critical' : 'high',
        title: `Fix ${issue.title}`,
        description: `Address the following issue: ${issue.description}`,
        impact: issue.impact,
        effort: issue.effort,
        estimatedImpact: this.severityToImpactScore(issue.severity),
        implementation: issue.recommendation,
        resources: [],
      });
    });

    return detailedRecommendations
      .sort((a, b) => this.priorityToNumber(b.priority) - this.priorityToNumber(a.priority))
      .slice(0, 20); // Limit to top 20 recommendations
  }

  // Helper methods for issue categorization and scoring
  private determineSeverity(issue: any): 'low' | 'medium' | 'high' | 'critical' {
    if (issue.critical || issue.severity === 'critical') return 'critical';
    if (issue.high || issue.severity === 'high') return 'high';
    if (issue.medium || issue.severity === 'medium') return 'medium';
    return 'low';
  }

  private calculatePriority(issue: any, severity: string): number {
    const severityMap: Record<string, number> = { critical: 100, high: 80, medium: 60, low: 40 };
    const impactMap: Record<string, number> = { high: 20, medium: 10, low: 5 };
    
    return (severityMap[severity] || 50) + (impactMap[issue.impact as string] || 0);
  }

  private categorizeIssue(issue: any): string {
    if (issue.type) return issue.type;
    if (issue.category) return issue.category;
    
    // Auto-categorize based on content
    const content = (issue.title || issue.message || '').toLowerCase();
    if (content.includes('meta') || content.includes('title')) return 'on-page';
    if (content.includes('speed') || content.includes('performance')) return 'technical';
    if (content.includes('content') || content.includes('text')) return 'content';
    if (content.includes('mobile') || content.includes('responsive')) return 'ux';
    
    return 'general';
  }

  private calculateImpact(issue: any, severity: string): string {
    const impacts: Record<string, string> = {
      critical: 'Critical impact on search rankings and user experience',
      high: 'High impact on SEO performance and user satisfaction',
      medium: 'Moderate impact on search engine optimization',
      low: 'Minor impact on overall SEO score'
    };
    
    return impacts[severity] || 'Unknown impact';
  }

  private estimateEffort(item: any): 'low' | 'medium' | 'high' {
    if (item.effort) return item.effort;
    
    // Auto-estimate based on type and complexity
    const content = (item.title || item.message || item.type || '').toLowerCase();
    if (content.includes('meta') || content.includes('title') || content.includes('alt')) return 'low';
    if (content.includes('structure') || content.includes('schema') || content.includes('redirect')) return 'medium';
    if (content.includes('performance') || content.includes('server') || content.includes('architecture')) return 'high';
    
    return 'medium';
  }

  private generateRecommendation(issue: any): string {
    const type = (issue.type || issue.title || '').toLowerCase();
    
    if (type.includes('meta title')) return 'Add or optimize the meta title tag';
    if (type.includes('meta description')) return 'Add or improve the meta description';
    if (type.includes('h1')) return 'Add a proper H1 heading tag';
    if (type.includes('alt')) return 'Add alt text to images';
    if (type.includes('speed')) return 'Optimize page loading speed';
    
    return 'Follow SEO best practices to resolve this issue';
  }

  // Additional helper methods
  private mapPriority(priority: any): 'low' | 'medium' | 'high' | 'critical' {
    if (typeof priority === 'string') return priority as any;
    if (typeof priority === 'number') {
      if (priority >= 90) return 'critical';
      if (priority >= 70) return 'high';
      if (priority >= 40) return 'medium';
      return 'low';
    }
    return 'medium';
  }

  private estimateImpactScore(item: any): number {
    const priority = this.mapPriority(item.priority);
    const scores = { critical: 90, high: 70, medium: 50, low: 30 };
    return scores[priority] || 50;
  }

  private severityToImpactScore(severity: string): number {
    const scores: Record<string, number> = { critical: 95, high: 75, medium: 55, low: 35 };
    return scores[severity] || 50;
  }

  private priorityToNumber(priority: string): number {
    const numbers: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    return numbers[priority] || 2;
  }

  private createScoreBreakdown(scores: any, analysisResult: any): any {
    return {
      technical: {
        score: scores.technical,
        factors: {
          performance: analysisResult.performanceMetrics?.score || 0,
          security: analysisResult.technical?.https ? 100 : 50,
          mobile: analysisResult.technical?.mobile?.responsive ? 100 : 30,
          crawlability: analysisResult.technical?.crawlable ? 100 : 0,
        }
      },
      content: {
        score: scores.content,
        factors: {
          quality: analysisResult.contentAnalysis?.quality?.score || 0,
          readability: analysisResult.contentAnalysis?.readability?.score || 0,
          uniqueness: analysisResult.content?.unique ? 100 : 30,
          structure: analysisResult.content?.structure?.headings ? 80 : 20,
        }
      },
      onPage: {
        score: scores.onpage,
        factors: {
          title: analysisResult.metaTags?.title ? 100 : 0,
          description: analysisResult.metaTags?.description ? 100 : 0,
          headings: analysisResult.onPage?.headings?.h1 ? 100 : 0,
          images: analysisResult.onPage?.images?.optimized ? 80 : 20,
        }
      },
      ux: {
        score: scores.ux,
        factors: {
          mobile: analysisResult.ux?.mobile?.friendly ? 100 : 30,
          speed: analysisResult.performanceMetrics?.score || 0,
          accessibility: analysisResult.ux?.accessibility?.score || 0,
          navigation: analysisResult.ux?.navigation?.clear ? 80 : 20,
        }
      },
      weights: scores.weights,
    };
  }

  private calculateTrends(analysisResult: any): any {
    // This would typically compare with historical data
    return {
      scoreDirection: 'stable',
      improvementAreas: ['content', 'technical'],
      strengths: ['on-page', 'ux'],
      timeframe: '30d',
    };
  }

  private calculateBenchmarks(analysisResult: any): any {
    // Industry benchmarks - this would typically come from a benchmarking service
    return {
      industry: 'general',
      averageScore: 65,
      topPercentile: 85,
      position: 'above_average',
    };
  }

  /**
   * Store analysis issues in database
   */
  private async storeAnalysisIssues(
    analysisId: string,
    issues: AnalysisIssue[]
  ): Promise<AnalysisIssue[]> {
    const storedIssues = await Promise.all(
      issues.map(async (issue) => {
        const seoIssue = await this.prisma.sEOIssue.create({
          data: {
            analysisId,
            type: issue.type,
            category: issue.category,
            severity: issue.severity,
            title: issue.title,
            description: issue.description,
            recommendation: issue.recommendation,
            status: 'new',
          },
        });
        
        return {
          ...issue,
          id: seoIssue.id,
        } as any;
      })
    );

    return storedIssues;
  }

  /**
   * Store analysis recommendations in database
   */
  private async storeAnalysisRecommendations(
    analysisId: string,
    recommendations: AnalysisRecommendation[]
  ): Promise<AnalysisRecommendation[]> {
    const storedRecommendations = await Promise.all(
      recommendations.map(async (rec) => {
        const seoRec = await this.prisma.sEORecommendation.create({
          data: {
            analysisId,
            category: rec.category,
            priority: rec.priority,
            title: rec.title,
            description: rec.description,
            effortLevel: rec.effort,
            resources: rec.resources || [],
            status: 'pending',
            implementationSteps: rec.implementation || 'Follow SEO best practices',
            expectedResults: rec.estimatedImpact || 'Improved SEO performance',
            validation: 'Manual review required',
            timeEstimate: 'Medium',
            businessValue: 'High'
          },
        });
        
        return {
          ...rec,
          id: seoRec.id,
        } as any;
      })
    );

    return storedRecommendations;
  }

  /**
   * Get previous analysis for comparison
   */
  private async getPreviousAnalysis(projectId: string): Promise<any> {
    return await this.prisma.sEOAnalysis.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: { overallScore: true, createdAt: true },
    });
  }

  /**
   * Update project statistics
   */
  private async updateProjectStatistics(
    projectId: string,
    analysisResult: any
  ): Promise<void> {
    const issueCount = analysisResult.issues?.length || 0;
    
    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        currentScore: analysisResult.overallScore,
        issueCount,
        lastScanDate: new Date(),
      },
    });
  }

  /**
   * Create trend record for historical tracking
   */
  private async createTrendRecord(
    projectId: string,
    analysisResult: any
  ): Promise<void> {
    await this.prisma.projectTrends.create({
      data: {
        projectId,
        date: new Date(),
        overallScore: analysisResult.overallScore,
        technicalScore: analysisResult.technicalScore,
        contentScore: analysisResult.contentScore,
        onPageScore: analysisResult.onpageScore,
        uxScore: analysisResult.uxScore,
        totalIssues: analysisResult.issues?.length || 0,
        criticalIssues: analysisResult.issues?.filter((i: any) => i.severity === 'critical').length || 0,
        highIssues: analysisResult.issues?.filter((i: any) => i.severity === 'high').length || 0,
        mediumIssues: analysisResult.issues?.filter((i: any) => i.severity === 'medium').length || 0,
        lowIssues: analysisResult.issues?.filter((i: any) => i.severity === 'low').length || 0,
      },
    });
  }

  /**
   * Clear analysis-related caches
   */
  private async clearAnalysisCache(projectId: string): Promise<void> {
    try {
      const cacheKeys = [
        `project:${projectId}:analyses`,
        `project:${projectId}:trends`,
        `project:${projectId}:stats`,
        `dashboard:recent-projects`,
        `dashboard:priority-issues`,
      ];
      
      await Promise.all(cacheKeys.map(key => cache.del(key)));
    } catch (error) {
      logger.warn('Error clearing analysis cache:', error);
    }
  }

  /**
   * Cleanup service resources
   */
  async cleanup(): Promise<void> {
    try {
      logger.info('Cleaning up Analysis Integration Service...');
      
      // Disconnect Prisma client
      await this.prisma.$disconnect();
      
      logger.info('Analysis Integration Service cleanup completed');
    } catch (error) {
      logger.error('Error during Analysis Integration Service cleanup:', error);
      throw error;
    }
  }
} 