import { LighthouseService, PerformanceMetrics, CoreWebVitals } from './LighthouseService';
import { PrismaClient } from '@prisma/client';

export interface CoreWebVitalsAnalysis {
  url: string;
  timestamp: Date;
  deviceType: 'mobile' | 'desktop';
  coreWebVitals: CoreWebVitals;
  performanceScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  insights: {
    lcpAnalysis: LCPAnalysis;
    fidAnalysis: FIDAnalysis;
    clsAnalysis: CLSAnalysis;
    fcpAnalysis: FCPAnalysis;
    ttfbAnalysis: TTFBAnalysis;
  };
  recommendations: CoreWebVitalsRecommendation[];
  historicalComparison?: HistoricalComparison;
}

export interface LCPAnalysis {
  value: number;
  status: 'good' | 'needs-improvement' | 'poor';
  target: number;
  percentile: string;
  issues: string[];
  opportunities: string[];
}

export interface FIDAnalysis {
  value: number;
  status: 'good' | 'needs-improvement' | 'poor';
  target: number;
  percentile: string;
  issues: string[];
  opportunities: string[];
}

export interface CLSAnalysis {
  value: number;
  status: 'good' | 'needs-improvement' | 'poor';
  target: number;
  percentile: string;
  issues: string[];
  opportunities: string[];
}

export interface FCPAnalysis {
  value: number;
  status: 'good' | 'needs-improvement' | 'poor';
  target: number;
  percentile: string;
  issues: string[];
  opportunities: string[];
}

export interface TTFBAnalysis {
  value: number;
  status: 'good' | 'needs-improvement' | 'poor';
  target: number;
  percentile: string;
  issues: string[];
  opportunities: string[];
}

export interface CoreWebVitalsRecommendation {
  metric: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  implementation: {
    steps: string[];
    codeExamples?: { [key: string]: string };
    tools?: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedTime: string;
  };
  expectedImprovement: {
    metricImprovement: string;
    scoreImprovement: number;
  };
}

export interface HistoricalComparison {
  previousAnalysis?: CoreWebVitalsAnalysis;
  trends: {
    lcp: { change: number; direction: 'improved' | 'declined' | 'stable' };
    fid: { change: number; direction: 'improved' | 'declined' | 'stable' };
    cls: { change: number; direction: 'improved' | 'declined' | 'stable' };
    overall: { change: number; direction: 'improved' | 'declined' | 'stable' };
  };
}

export class CoreWebVitalsAnalyzer {
  private lighthouseService: LighthouseService;
  private prisma: PrismaClient;

  // Core Web Vitals thresholds (Google standards)
  private readonly thresholds = {
    LCP: { good: 1200, poor: 2500 },      // ms - Largest Contentful Paint
    FID: { good: 100, poor: 300 },        // ms - First Input Delay
    CLS: { good: 0.1, poor: 0.25 },       // score - Cumulative Layout Shift
    FCP: { good: 1000, poor: 2000 },      // ms - First Contentful Paint
    TTFB: { good: 200, poor: 500 }        // ms - Time to First Byte
  };

  constructor() {
    this.lighthouseService = LighthouseService.getInstance();
    this.prisma = new PrismaClient();
  }

  async analyzeWebVitals(
    url: string, 
    options?: {
      deviceType?: 'mobile' | 'desktop';
      includeHistorical?: boolean;
      projectId?: string;
    }
  ): Promise<CoreWebVitalsAnalysis> {
    try {
      console.log(`[Core Web Vitals] Starting analysis for: ${url}`);

      const deviceType = options?.deviceType || 'mobile';
      
      // Run Lighthouse analysis
      const performanceMetrics = await this.lighthouseService.analyzePerformance(url, {
        mobile: deviceType === 'mobile'
      });

      // Analyze each Core Web Vital
      const insights = {
        lcpAnalysis: this.analyzeLCP(performanceMetrics.coreWebVitals.LCP),
        fidAnalysis: this.analyzeFID(performanceMetrics.coreWebVitals.FID),
        clsAnalysis: this.analyzeCLS(performanceMetrics.coreWebVitals.CLS),
        fcpAnalysis: this.analyzeFCP(performanceMetrics.coreWebVitals.FCP),
        ttfbAnalysis: this.analyzeTTFB(performanceMetrics.coreWebVitals.TTFB)
      };

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        performanceMetrics.coreWebVitals,
        insights,
        performanceMetrics.optimizationOpportunities
      );

      // Calculate overall grade
      const grade = this.calculateGrade(performanceMetrics.coreWebVitals);

      // Get historical comparison if requested
      let historicalComparison: HistoricalComparison | undefined;
      if (options?.includeHistorical && options?.projectId) {
        historicalComparison = await this.getHistoricalComparison(url, options.projectId);
      }

      const analysis: CoreWebVitalsAnalysis = {
        url,
        timestamp: new Date(),
        deviceType,
        coreWebVitals: performanceMetrics.coreWebVitals,
        performanceScore: performanceMetrics.performanceScore,
        grade,
        insights,
        recommendations,
        historicalComparison
      };

      console.log(`[Core Web Vitals] Analysis completed. Grade: ${grade}, Score: ${performanceMetrics.performanceScore}`);

      return analysis;

    } catch (error: any) {
      console.error('[Core Web Vitals] Analysis failed:', error);
      throw new Error(`Core Web Vitals analysis failed: ${error?.message || 'Unknown error'}`);
    }
  }

  private analyzeLCP(value: number): LCPAnalysis {
    const status = value <= this.thresholds.LCP.good ? 'good' : 
                   value <= this.thresholds.LCP.poor ? 'needs-improvement' : 'poor';
    
    const issues = [];
    const opportunities = [];

    if (status === 'poor') {
      issues.push('LCP is significantly above the recommended 2.5 second threshold');
      opportunities.push('Optimize server response times');
      opportunities.push('Remove render-blocking resources');
      opportunities.push('Optimize and compress images');
    } else if (status === 'needs-improvement') {
      opportunities.push('Preload key resources');
      opportunities.push('Optimize images and use modern formats');
    }

    return {
      value,
      status,
      target: this.thresholds.LCP.good,
      percentile: this.getPercentile('LCP', value),
      issues,
      opportunities
    };
  }

  private analyzeFID(value: number): FIDAnalysis {
    const status = value <= this.thresholds.FID.good ? 'good' : 
                   value <= this.thresholds.FID.poor ? 'needs-improvement' : 'poor';
    
    const issues = [];
    const opportunities = [];

    if (status === 'poor') {
      issues.push('FID is above the recommended 100ms threshold');
      opportunities.push('Reduce JavaScript execution time');
      opportunities.push('Remove unused JavaScript');
      opportunities.push('Use code splitting and lazy loading');
    } else if (status === 'needs-improvement') {
      opportunities.push('Minimize main thread work');
      opportunities.push('Optimize third-party scripts');
    }

    return {
      value,
      status,
      target: this.thresholds.FID.good,
      percentile: this.getPercentile('FID', value),
      issues,
      opportunities
    };
  }

  private analyzeCLS(value: number): CLSAnalysis {
    const status = value <= this.thresholds.CLS.good ? 'good' : 
                   value <= this.thresholds.CLS.poor ? 'needs-improvement' : 'poor';
    
    const issues = [];
    const opportunities = [];

    if (status === 'poor') {
      issues.push('CLS is above the recommended 0.25 threshold');
      opportunities.push('Ensure images and embeds have defined dimensions');
      opportunities.push('Reserve space for ad slots');
      opportunities.push('Avoid inserting content above existing content');
    } else if (status === 'needs-improvement') {
      opportunities.push('Optimize font loading');
      opportunities.push('Preload key fonts');
    }

    return {
      value,
      status,
      target: this.thresholds.CLS.good,
      percentile: this.getPercentile('CLS', value),
      issues,
      opportunities
    };
  }

  private analyzeFCP(value: number): FCPAnalysis {
    const status = value <= this.thresholds.FCP.good ? 'good' : 
                   value <= this.thresholds.FCP.poor ? 'needs-improvement' : 'poor';
    
    const issues = [];
    const opportunities = [];

    if (status === 'poor') {
      issues.push('FCP is above the recommended 2.0 second threshold');
      opportunities.push('Eliminate render-blocking resources');
      opportunities.push('Minify CSS and JavaScript');
    } else if (status === 'needs-improvement') {
      opportunities.push('Optimize font loading');
      opportunities.push('Reduce server response time');
    }

    return {
      value,
      status,
      target: this.thresholds.FCP.good,
      percentile: this.getPercentile('FCP', value),
      issues,
      opportunities
    };
  }

  private analyzeTTFB(value: number): TTFBAnalysis {
    const status = value <= this.thresholds.TTFB.good ? 'good' : 
                   value <= this.thresholds.TTFB.poor ? 'needs-improvement' : 'poor';
    
    const issues = [];
    const opportunities = [];

    if (status === 'poor') {
      issues.push('TTFB is above the recommended 500ms threshold');
      opportunities.push('Optimize server response time');
      opportunities.push('Use a Content Delivery Network (CDN)');
      opportunities.push('Enable compression');
    } else if (status === 'needs-improvement') {
      opportunities.push('Enable caching');
      opportunities.push('Optimize database queries');
    }

    return {
      value,
      status,
      target: this.thresholds.TTFB.good,
      percentile: this.getPercentile('TTFB', value),
      issues,
      opportunities
    };
  }

  private generateRecommendations(
    vitals: CoreWebVitals,
    insights: any,
    opportunities: any[]
  ): CoreWebVitalsRecommendation[] {
    const recommendations: CoreWebVitalsRecommendation[] = [];

    // LCP Recommendations
    if (insights.lcpAnalysis.status !== 'good') {
      recommendations.push({
        metric: 'LCP',
        priority: insights.lcpAnalysis.status === 'poor' ? 'critical' : 'high',
        title: 'Optimize Largest Contentful Paint',
        description: 'Improve the loading performance of your largest content element',
        impact: `Reduce LCP by ${Math.round((vitals.LCP - this.thresholds.LCP.good) / 1000 * 100) / 100}s`,
        implementation: {
          steps: [
            'Identify the LCP element using browser dev tools',
            'Optimize images and use modern formats (WebP, AVIF)',
            'Preload critical resources',
            'Remove render-blocking CSS and JavaScript',
            'Optimize server response times'
          ],
          codeExamples: {
            preload: '<link rel="preload" href="hero-image.jpg" as="image">',
            webp: '<picture><source srcset="image.webp" type="image/webp"><img src="image.jpg" alt="Description"></picture>'
          },
          tools: ['Lighthouse', 'Chrome DevTools', 'WebPageTest'],
          difficulty: insights.lcpAnalysis.status === 'poor' ? 'medium' : 'easy',
          estimatedTime: insights.lcpAnalysis.status === 'poor' ? '2-4 hours' : '1-2 hours'
        },
        expectedImprovement: {
          metricImprovement: '30-50% reduction in LCP time',
          scoreImprovement: 15
        }
      });
    }

    // FID Recommendations
    if (insights.fidAnalysis.status !== 'good') {
      recommendations.push({
        metric: 'FID',
        priority: insights.fidAnalysis.status === 'poor' ? 'critical' : 'high',
        title: 'Reduce First Input Delay',
        description: 'Optimize JavaScript execution to improve interactivity',
        impact: `Reduce FID by ${vitals.FID - this.thresholds.FID.good}ms`,
        implementation: {
          steps: [
            'Identify long-running JavaScript tasks',
            'Remove unused JavaScript code',
            'Implement code splitting',
            'Use web workers for heavy computations',
            'Defer non-critical JavaScript'
          ],
          codeExamples: {
            defer: '<script src="script.js" defer></script>',
            dynamic: 'const module = await import("./heavy-module.js");'
          },
          tools: ['Chrome DevTools Performance tab', 'Lighthouse', 'Bundle analyzers'],
          difficulty: 'medium',
          estimatedTime: '3-6 hours'
        },
        expectedImprovement: {
          metricImprovement: '50-70% reduction in FID',
          scoreImprovement: 10
        }
      });
    }

    // CLS Recommendations
    if (insights.clsAnalysis.status !== 'good') {
      recommendations.push({
        metric: 'CLS',
        priority: insights.clsAnalysis.status === 'poor' ? 'critical' : 'high',
        title: 'Improve Cumulative Layout Shift',
        description: 'Reduce unexpected layout shifts during page load',
        impact: `Reduce CLS by ${(vitals.CLS - this.thresholds.CLS.good).toFixed(3)} points`,
        implementation: {
          steps: [
            'Add explicit dimensions to images and videos',
            'Reserve space for ad slots and embeds',
            'Preload fonts to avoid FOIT/FOUT',
            'Avoid inserting content above existing content',
            'Use CSS aspect-ratio for responsive elements'
          ],
          codeExamples: {
            dimensions: '<img src="image.jpg" width="800" height="600" alt="Description">',
            aspectRatio: '.container { aspect-ratio: 16 / 9; }'
          },
          tools: ['Chrome DevTools Layout Shift regions', 'Web Vitals extension'],
          difficulty: 'easy',
          estimatedTime: '1-3 hours'
        },
        expectedImprovement: {
          metricImprovement: '60-80% reduction in layout shifts',
          scoreImprovement: 12
        }
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private calculateGrade(vitals: CoreWebVitals): 'A' | 'B' | 'C' | 'D' | 'F' {
    let score = 0;
    
    // LCP scoring (25%)
    if (vitals.LCP <= this.thresholds.LCP.good) score += 25;
    else if (vitals.LCP <= this.thresholds.LCP.poor) score += 15;
    
    // FID scoring (25%)
    if (vitals.FID <= this.thresholds.FID.good) score += 25;
    else if (vitals.FID <= this.thresholds.FID.poor) score += 15;
    
    // CLS scoring (25%)
    if (vitals.CLS <= this.thresholds.CLS.good) score += 25;
    else if (vitals.CLS <= this.thresholds.CLS.poor) score += 15;
    
    // FCP scoring (25%)
    if (vitals.FCP <= this.thresholds.FCP.good) score += 25;
    else if (vitals.FCP <= this.thresholds.FCP.poor) score += 15;

    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private getPercentile(metric: string, value: number): string {
    // Simplified percentile calculation based on typical web performance data
    const percentiles = {
      LCP: { 25: 1200, 50: 2000, 75: 3500, 90: 5000 },
      FID: { 25: 50, 50: 100, 75: 200, 90: 400 },
      CLS: { 25: 0.05, 50: 0.1, 75: 0.2, 90: 0.35 },
      FCP: { 25: 1000, 50: 1600, 75: 2500, 90: 4000 },
      TTFB: { 25: 200, 50: 400, 75: 800, 90: 1200 }
    };

    const metricPercentiles = percentiles[metric as keyof typeof percentiles];
    if (!metricPercentiles) return 'Unknown';

    if (value <= metricPercentiles[25]) return 'Top 25%';
    if (value <= metricPercentiles[50]) return 'Top 50%';
    if (value <= metricPercentiles[75]) return 'Top 75%';
    if (value <= metricPercentiles[90]) return 'Top 90%';
    return 'Bottom 10%';
  }

  private async getHistoricalComparison(url: string, projectId: string): Promise<HistoricalComparison | undefined> {
    try {
      // Get the previous analysis from the database - fix the query to use proper joins
      const previousAnalysis = await this.prisma.performanceMetrics.findFirst({
        where: {
          analysis: {
            crawlSession: {
              url,
              projectId
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: 1, // Skip the current analysis
        include: {
          analysis: {
            include: {
              crawlSession: true
            }
          }
        }
      });

      if (!previousAnalysis) return undefined;

      // Note: You'd need to implement actual trend calculation here
      // This is a placeholder implementation
      return {
        trends: {
          lcp: { change: 0, direction: 'stable' },
          fid: { change: 0, direction: 'stable' },
          cls: { change: 0, direction: 'stable' },
          overall: { change: 0, direction: 'stable' }
        }
      };

    } catch (error) {
      console.error('Failed to get historical comparison:', error);
      return undefined;
    }
  }
} 