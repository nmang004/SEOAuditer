import { PrismaClient } from '@prisma/client';
import { analysisCacheService } from './AnalysisCacheService';

export interface TrendDataPoint {
  date: Date;
  overallScore: number;
  technicalScore: number;
  contentScore: number;
  onPageScore: number;
  uxScore: number;
  performanceScore?: number;
  accessibilityScore?: number;
  coreWebVitals?: {
    LCP: number;
    FID: number;
    CLS: number;
    FCP: number;
    TTFB: number;
  };
}

export interface TrendData {
  projectId: string;
  period: '7d' | '30d' | '90d' | '1y';
  dataPoints: TrendDataPoint[];
  summary: {
    totalDataPoints: number;
    averageScore: number;
    bestScore: number;
    worstScore: number;
    volatility: number;
    overallTrend: 'improving' | 'declining' | 'stable';
  };
  metrics: {
    scoreImprovement: number;
    performanceChange: number;
    consistencyScore: number;
  };
}

export interface Regression {
  id: string;
  projectId: string;
  detectedAt: Date;
  metric: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
  beforeValue: number;
  afterValue: number;
  changePercentage: number;
  possibleCauses: string[];
  recommendations: string[];
  status: 'active' | 'resolved' | 'investigating';
}

export interface TrendPrediction {
  projectId: string;
  predictedScore: number;
  confidence: number;
  timeframe: '1w' | '1m' | '3m';
  factors: {
    historical: number;
    seasonality: number;
    momentum: number;
  };
}

export class TrendAnalysisService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Generate comprehensive trend data for a project
   */
  async generateTrendData(projectId: string, period: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<TrendData> {
    try {
      console.log(`[Trend Analysis] Generating trend data for project ${projectId}, period: ${period}`);

      // Check cache first
      const cacheKey = `trend-data:${projectId}:${period}`;
      const cached = await analysisCacheService.get<TrendData>(cacheKey);
      if (cached) {
        return cached;
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (period) {
        case '7d': startDate.setDate(endDate.getDate() - 7); break;
        case '30d': startDate.setDate(endDate.getDate() - 30); break;
        case '90d': startDate.setDate(endDate.getDate() - 90); break;
        case '1y': startDate.setFullYear(endDate.getFullYear() - 1); break;
      }

      // Get historical analysis data
      const analyses = await this.prisma.sEOAnalysis.findMany({
        where: {
          projectId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          performanceMetrics: true,
          crawlSession: true
        },
        orderBy: { createdAt: 'asc' }
      });

      // Also get trend snapshots if available
      const trendSnapshots = await this.prisma.projectTrends.findMany({
        where: {
          projectId,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { date: 'asc' }
      });

      // Convert to trend data points
      const dataPoints: TrendDataPoint[] = [];

      // Add analysis data
      for (const analysis of analyses) {
        const coreWebVitals = analysis.performanceMetrics?.coreWebVitals as any;
        
        dataPoints.push({
          date: analysis.createdAt,
          overallScore: analysis.overallScore || 0,
          technicalScore: analysis.technicalScore || 0,
          contentScore: analysis.contentScore || 0,
          onPageScore: analysis.onpageScore || 0,
          uxScore: analysis.uxScore || 0,
          performanceScore: analysis.performanceMetrics?.performanceScore,
          coreWebVitals: coreWebVitals ? {
            LCP: coreWebVitals.LCP || 0,
            FID: coreWebVitals.FID || 0,
            CLS: coreWebVitals.CLS || 0,
            FCP: coreWebVitals.FCP || 0,
            TTFB: coreWebVitals.TTFB || 0
          } : undefined
        });
      }

      // Add trend snapshot data
      for (const snapshot of trendSnapshots) {
        dataPoints.push({
          date: snapshot.date,
          overallScore: snapshot.overallScore,
          technicalScore: snapshot.technicalScore,
          contentScore: snapshot.contentScore,
          onPageScore: snapshot.onPageScore,
          uxScore: snapshot.uxScore,
          accessibilityScore: snapshot.accessibilityScore || undefined,
          coreWebVitals: undefined
        });
      }

      // Sort by date and remove duplicates
      dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());
      const uniqueDataPoints = this.removeDuplicateDataPoints(dataPoints);

      // Calculate summary statistics
      const summary = this.calculateTrendSummary(uniqueDataPoints);
      const metrics = this.calculateTrendMetrics(uniqueDataPoints);

      const trendData: TrendData = {
        projectId,
        period,
        dataPoints: uniqueDataPoints,
        summary,
        metrics
      };

      // Cache the result
      const ttl = period === '7d' ? 3600 : period === '30d' ? 7200 : 14400; // 1h, 2h, 4h
      await analysisCacheService.set(cacheKey, trendData, { ttl });

      console.log(`[Trend Analysis] Generated trend data with ${uniqueDataPoints.length} data points`);
      return trendData;

    } catch (error) {
      console.error('[Trend Analysis] Error generating trend data:', error);
      throw new Error(`Failed to generate trend data: ${error}`);
    }
  }

  /**
   * Detect performance regressions in the data
   */
  async detectRegressions(projectId: string): Promise<Regression[]> {
    try {
      console.log(`[Trend Analysis] Detecting regressions for project ${projectId}`);

      // Get recent trend data (last 30 days)
      const trendData = await this.generateTrendData(projectId, '30d');
      
      if (trendData.dataPoints.length < 3) {
        return []; // Need at least 3 data points to detect regressions
      }

      const regressions: Regression[] = [];
      const dataPoints = trendData.dataPoints;

      // Analyze overall score regressions
      const overallRegressions = this.detectMetricRegressions(
        dataPoints.map(dp => ({ date: dp.date, value: dp.overallScore })),
        'Overall Score',
        projectId
      );
      regressions.push(...overallRegressions);

      // Analyze performance regressions
      const performanceData = dataPoints
        .filter(dp => dp.performanceScore !== undefined)
        .map(dp => ({ date: dp.date, value: dp.performanceScore! }));
      
      if (performanceData.length >= 3) {
        const performanceRegressions = this.detectMetricRegressions(
          performanceData,
          'Performance Score',
          projectId
        );
        regressions.push(...performanceRegressions);
      }

      // Analyze Core Web Vitals regressions
      if (dataPoints.some(dp => dp.coreWebVitals)) {
        const lcpRegressions = this.detectCoreWebVitalRegressions(dataPoints, 'LCP', projectId);
        const clsRegressions = this.detectCoreWebVitalRegressions(dataPoints, 'CLS', projectId);
        regressions.push(...lcpRegressions, ...clsRegressions);
      }

      console.log(`[Trend Analysis] Detected ${regressions.length} regressions`);
      return regressions;

    } catch (error) {
      console.error('[Trend Analysis] Error detecting regressions:', error);
      throw new Error(`Failed to detect regressions: ${error}`);
    }
  }

  /**
   * Calculate a trend score based on recent performance
   */
  async calculateTrendScore(trends: TrendData): Promise<number> {
    try {
      const { dataPoints } = trends;
      
      if (dataPoints.length < 2) {
        return 50; // Neutral score if insufficient data
      }

      let score = 50; // Start with neutral

      // Factor 1: Overall trend direction (40% weight)
      const trendDirection = this.calculateTrendDirection(
        dataPoints.map(dp => dp.overallScore)
      );
      score += trendDirection * 0.4;

      // Factor 2: Consistency/volatility (30% weight)
      const volatility = trends.summary.volatility;
      const consistencyBonus = Math.max(0, (100 - volatility)) * 0.3;
      score += consistencyBonus;

      // Factor 3: Recent performance vs historical (30% weight)
      const recentPerformance = this.calculateRecentPerformance(dataPoints);
      score += recentPerformance * 0.3;

      return Math.max(0, Math.min(100, Math.round(score)));

    } catch (error) {
      console.error('[Trend Analysis] Error calculating trend score:', error);
      return 50;
    }
  }

  /**
   * Generate trend predictions
   */
  async predictTrends(projectId: string, timeframe: '1w' | '1m' | '3m' = '1m'): Promise<TrendPrediction> {
    try {
      const trendData = await this.generateTrendData(projectId, '90d');
      
      if (trendData.dataPoints.length < 5) {
        throw new Error('Insufficient data for trend prediction');
      }

      // Simple linear regression for prediction
      const scores = trendData.dataPoints.map(dp => dp.overallScore);
      const trend = this.calculateLinearTrend(scores);
      
      // Project future score
      const timeMultiplier = timeframe === '1w' ? 1 : timeframe === '1m' ? 4 : 12;
      const predictedScore = Math.max(0, Math.min(100, 
        scores[scores.length - 1] + (trend * timeMultiplier)
      ));

      // Calculate confidence based on data consistency
      const confidence = Math.max(20, Math.min(95, 
        100 - trendData.summary.volatility
      ));

      return {
        projectId,
        predictedScore: Math.round(predictedScore),
        confidence: Math.round(confidence),
        timeframe,
        factors: {
          historical: Math.round(trend * 40),
          seasonality: 0, // Placeholder for seasonal analysis
          momentum: Math.round(this.calculateMomentum(scores) * 30)
        }
      };

    } catch (error) {
      console.error('[Trend Analysis] Error predicting trends:', error);
      throw new Error(`Failed to predict trends: ${error}`);
    }
  }

  // Private helper methods

  private removeDuplicateDataPoints(dataPoints: TrendDataPoint[]): TrendDataPoint[] {
    const seen = new Set<string>();
    return dataPoints.filter(dp => {
      const key = dp.date.toISOString().split('T')[0]; // Group by date
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private calculateTrendSummary(dataPoints: TrendDataPoint[]) {
    if (dataPoints.length === 0) {
      return {
        totalDataPoints: 0,
        averageScore: 0,
        bestScore: 0,
        worstScore: 0,
        volatility: 0,
        overallTrend: 'stable' as const
      };
    }

    const scores = dataPoints.map(dp => dp.overallScore);
    const totalDataPoints = dataPoints.length;
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const bestScore = Math.max(...scores);
    const worstScore = Math.min(...scores);
    
    // Calculate volatility (standard deviation)
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - averageScore, 2), 0) / scores.length;
    const volatility = Math.round(Math.sqrt(variance));

    // Determine overall trend
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    let overallTrend: 'improving' | 'declining' | 'stable';
    const trendThreshold = 3; // Minimum change to consider a trend
    
    if (secondAvg - firstAvg > trendThreshold) {
      overallTrend = 'improving';
    } else if (firstAvg - secondAvg > trendThreshold) {
      overallTrend = 'declining';
    } else {
      overallTrend = 'stable';
    }

    return {
      totalDataPoints,
      averageScore,
      bestScore,
      worstScore,
      volatility,
      overallTrend
    };
  }

  private calculateTrendMetrics(dataPoints: TrendDataPoint[]) {
    if (dataPoints.length < 2) {
      return {
        scoreImprovement: 0,
        performanceChange: 0,
        consistencyScore: 50
      };
    }

    const scores = dataPoints.map(dp => dp.overallScore);
    const firstScore = scores[0];
    const lastScore = scores[scores.length - 1];
    
    const scoreImprovement = lastScore - firstScore;
    
    // Calculate performance change for Core Web Vitals if available
    const performanceScores = dataPoints
      .filter(dp => dp.performanceScore !== undefined)
      .map(dp => dp.performanceScore!);
    
    let performanceChange = 0;
    if (performanceScores.length >= 2) {
      performanceChange = performanceScores[performanceScores.length - 1] - performanceScores[0];
    }

    // Calculate consistency score (inverse of volatility)
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - average, 2), 0) / scores.length;
    const volatility = Math.sqrt(variance);
    const consistencyScore = Math.max(0, Math.min(100, 100 - (volatility * 2)));

    return {
      scoreImprovement: Math.round(scoreImprovement),
      performanceChange: Math.round(performanceChange),
      consistencyScore: Math.round(consistencyScore)
    };
  }

  private detectMetricRegressions(
    data: Array<{ date: Date; value: number }>,
    metricName: string,
    projectId: string
  ): Regression[] {
    const regressions: Regression[] = [];
    
    if (data.length < 3) return regressions;

    // Simple regression detection: look for significant drops
    for (let i = 2; i < data.length; i++) {
      const current = data[i].value;
      const previous = data[i - 1].value;
      const beforePrevious = data[i - 2].value;
      
      // Calculate average of previous two points
      const recentAverage = (previous + beforePrevious) / 2;
      
      // Check for significant drop
      const dropPercentage = ((recentAverage - current) / recentAverage) * 100;
      
      if (dropPercentage > 10) { // More than 10% drop
        const severity: 'critical' | 'major' | 'minor' = 
          dropPercentage > 25 ? 'critical' : 
          dropPercentage > 15 ? 'major' : 'minor';

        regressions.push({
          id: `${projectId}-${metricName}-${data[i].date.getTime()}`,
          projectId,
          detectedAt: data[i].date,
          metric: metricName,
          severity,
          description: `${metricName} dropped by ${dropPercentage.toFixed(1)}%`,
          beforeValue: Math.round(recentAverage),
          afterValue: Math.round(current),
          changePercentage: Math.round(dropPercentage),
          possibleCauses: this.getPossibleCauses(metricName, severity),
          recommendations: this.getRecommendations(metricName, severity),
          status: 'active'
        });
      }
    }

    return regressions;
  }

  private detectCoreWebVitalRegressions(
    dataPoints: TrendDataPoint[],
    vital: 'LCP' | 'CLS',
    projectId: string
  ): Regression[] {
    const vitalData = dataPoints
      .filter(dp => dp.coreWebVitals && dp.coreWebVitals[vital] !== undefined)
      .map(dp => ({ date: dp.date, value: dp.coreWebVitals![vital] }));

    if (vitalData.length < 3) return [];

    // For LCP, higher is worse; for CLS, higher is also worse
    return this.detectMetricRegressions(vitalData, `Core Web Vitals ${vital}`, projectId);
  }

  private calculateTrendDirection(scores: number[]): number {
    if (scores.length < 2) return 0;
    
    const trend = this.calculateLinearTrend(scores);
    return Math.max(-50, Math.min(50, trend * 10)); // Scale to -50 to +50
  }

  private calculateLinearTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  private calculateRecentPerformance(dataPoints: TrendDataPoint[]): number {
    if (dataPoints.length < 4) return 0;
    
    const recent = dataPoints.slice(-2);
    const historical = dataPoints.slice(0, -2);
    
    const recentAvg = recent.reduce((acc, dp) => acc + dp.overallScore, 0) / recent.length;
    const historicalAvg = historical.reduce((acc, dp) => acc + dp.overallScore, 0) / historical.length;
    
    return Math.max(-50, Math.min(50, recentAvg - historicalAvg));
  }

  private calculateMomentum(scores: number[]): number {
    if (scores.length < 3) return 0;
    
    const recentTrend = this.calculateLinearTrend(scores.slice(-5));
    const overallTrend = this.calculateLinearTrend(scores);
    
    return recentTrend - overallTrend;
  }

  private getPossibleCauses(metricName: string, severity: 'critical' | 'major' | 'minor'): string[] {
    const causes: { [key: string]: string[] } = {
      'Overall Score': [
        'Recent website changes or updates',
        'Server performance issues',
        'New content or functionality added',
        'Third-party script changes'
      ],
      'Performance Score': [
        'Large images or unoptimized assets',
        'Increased JavaScript bundle size',
        'Server response time degradation',
        'CDN or hosting issues'
      ],
      'Core Web Vitals LCP': [
        'Largest content element not optimized',
        'Server response time too slow',
        'Render-blocking resources',
        'Client-side rendering delays'
      ],
      'Core Web Vitals CLS': [
        'Images without dimensions',
        'Ads or embeds causing layout shifts',
        'Web fonts causing FOIT/FOUT',
        'Dynamic content insertion'
      ]
    };

    return causes[metricName] || ['Unknown cause'];
  }

  private getRecommendations(metricName: string, severity: 'critical' | 'major' | 'minor'): string[] {
    const recommendations: { [key: string]: string[] } = {
      'Overall Score': [
        'Review recent changes and their SEO impact',
        'Run a comprehensive SEO audit',
        'Check for technical issues',
        'Monitor Core Web Vitals'
      ],
      'Performance Score': [
        'Optimize images and use modern formats',
        'Implement code splitting and lazy loading',
        'Minimize and compress JavaScript/CSS',
        'Use a Content Delivery Network (CDN)'
      ],
      'Core Web Vitals LCP': [
        'Optimize the largest contentful element',
        'Preload critical resources',
        'Improve server response time',
        'Remove render-blocking resources'
      ],
      'Core Web Vitals CLS': [
        'Add size attributes to images and videos',
        'Reserve space for ads and embeds',
        'Use font-display: swap for web fonts',
        'Avoid inserting content above existing content'
      ]
    };

    return recommendations[metricName] || ['Contact support for assistance'];
  }
} 