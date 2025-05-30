'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import TrendChart from '@/components/analysis/TrendChart';
import { useTrendAnalysis } from '@/hooks/useTrendAnalysis';
import { 
  TrendingUp, 
  BarChart3, 
  AlertTriangle, 
  Target,
  Brain,
  Activity
} from 'lucide-react';

const TestTrendAnalysisPage = () => {
  const [selectedProjectId, setSelectedProjectId] = useState('demo-project-123');
  
  // Use the trend analysis hook
  const {
    trendData,
    regressions,
    predictions,
    trendScore,
    loading,
    regressionsLoading,
    predictionsLoading,
    trendScoreLoading,
    error,
    fetchTrends,
    fetchPredictions,
    refetch
  } = useTrendAnalysis(selectedProjectId);

  // Mock data for demonstration
  const mockTrendData = {
    projectId: 'demo-project-123',
    period: '30d' as const,
    dataPoints: [
      {
        date: new Date('2024-01-01'),
        overallScore: 72,
        technicalScore: 85,
        contentScore: 68,
        onpageScore: 75,
        uxScore: 70,
        performanceScore: 78,
        coreWebVitals: { LCP: 1200, FID: 85, CLS: 0.08, FCP: 900, TTFB: 180 }
      },
      {
        date: new Date('2024-01-08'),
        overallScore: 75,
        technicalScore: 87,
        contentScore: 70,
        onpageScore: 78,
        uxScore: 72,
        performanceScore: 80,
        coreWebVitals: { LCP: 1150, FID: 80, CLS: 0.07, FCP: 850, TTFB: 170 }
      },
      {
        date: new Date('2024-01-15'),
        overallScore: 78,
        technicalScore: 89,
        contentScore: 73,
        onpageScore: 80,
        uxScore: 75,
        performanceScore: 82,
        coreWebVitals: { LCP: 1100, FID: 75, CLS: 0.06, FCP: 800, TTFB: 160 }
      },
      {
        date: new Date('2024-01-22'),
        overallScore: 81,
        technicalScore: 90,
        contentScore: 76,
        onpageScore: 83,
        uxScore: 78,
        performanceScore: 85,
        coreWebVitals: { LCP: 1050, FID: 70, CLS: 0.05, FCP: 750, TTFB: 150 }
      },
      {
        date: new Date('2024-01-29'),
        overallScore: 83,
        technicalScore: 92,
        contentScore: 78,
        onpageScore: 85,
        uxScore: 80,
        performanceScore: 87,
        coreWebVitals: { LCP: 1000, FID: 65, CLS: 0.04, FCP: 700, TTFB: 140 }
      }
    ],
    summary: {
      totalDataPoints: 5,
      averageScore: 78,
      bestScore: 83,
      worstScore: 72,
      volatility: 4.2,
      overallTrend: 'improving' as const
    },
    metrics: {
      scoreImprovement: 11,
      performanceChange: 9,
      consistencyScore: 85
    }
  };

  const mockRegressions = [
    {
      id: 'reg-1',
      projectId: 'demo-project-123',
      detectedAt: new Date('2024-01-20'),
      metric: 'Core Web Vitals LCP',
      severity: 'minor' as const,
      description: 'LCP increased by 8.2%',
      beforeValue: 1050,
      afterValue: 1137,
      changePercentage: 8.2,
      possibleCauses: ['Large image loading', 'Server response delay'],
      recommendations: ['Optimize images', 'Enable compression'],
      status: 'active' as const
    }
  ];

  const mockPredictions = {
    projectId: 'demo-project-123',
    predictedScore: 87,
    confidence: 78,
    timeframe: '1m' as const,
    factors: {
      historical: 15,
      seasonality: 0,
      momentum: 12
    }
  };

  const mockTrendScore = {
    trendScore: 82,
    period: '30d',
    summary: mockTrendData.summary,
    metrics: mockTrendData.metrics
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Phase 2: Trend Analysis Demo</h1>
        <p className="text-muted-foreground">
          Testing historical trend analysis, regression detection, and performance predictions
        </p>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Phase 2 Implementation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-green-600 mb-3">✅ Completed Features</h4>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                  TrendAnalysisService with comprehensive trend tracking
                </li>
                <li className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-green-600" />
                  Regression detection with severity levels
                </li>
                <li className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-green-600" />
                  Trend predictions using linear regression
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  TrendChart React component
                </li>
                <li className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-600" />
                  useTrendAnalysis React hook
                </li>
                <li className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  Enhanced API routes for trend analysis
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-600 mb-3">🚧 In Progress</h4>
              <ul className="text-sm space-y-2">
                <li>• Database integration and testing</li>
                <li>• Advanced accessibility analysis</li>
                <li>• Competitor benchmarking</li>
                <li>• Automated report generation</li>
                <li>• Real-time monitoring alerts</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Trend Analysis Functions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => fetchTrends('7d')} disabled={loading}>
              Fetch 7-day Trends
            </Button>
            <Button onClick={() => fetchTrends('30d')} disabled={loading}>
              Fetch 30-day Trends
            </Button>
            <Button onClick={() => fetchTrends('90d')} disabled={loading}>
              Fetch 90-day Trends
            </Button>
            <Button onClick={() => fetchPredictions('1m')} disabled={predictionsLoading}>
              Get Predictions
            </Button>
            <Button onClick={refetch} disabled={loading}>
              Refresh All Data
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <strong>API Error:</strong> {error}
              <br />
              <small>This is expected if the backend is not running or routes are not properly configured.</small>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
            <strong>Note:</strong> The trend analysis is using mock data for demonstration. 
            Real data will be fetched from the API when the backend is properly configured.
          </div>
        </CardContent>
      </Card>

      {/* Main Trend Chart */}
      <TrendChart 
        data={trendData || mockTrendData} 
        regressions={regressions.length > 0 ? regressions : mockRegressions}
        loading={loading}
        onPeriodChange={(period) => fetchTrends(period)}
      />

      {/* Trend Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Trend Score Analysis
            {trendScoreLoading && <Badge variant="outline">Loading...</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(trendScore || mockTrendScore) && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {(trendScore || mockTrendScore).trendScore}
                </div>
                <div className="text-sm text-muted-foreground">Trend Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(trendScore || mockTrendScore).summary.averageScore}
                </div>
                <div className="text-sm text-muted-foreground">Average Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {(trendScore || mockTrendScore).metrics.consistencyScore}
                </div>
                <div className="text-sm text-muted-foreground">Consistency</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {(trendScore || mockTrendScore).summary.volatility.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Volatility</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Predictions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Performance Predictions
            {predictionsLoading && <Badge variant="outline">Loading...</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(predictions || mockPredictions) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Predicted Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Predicted Score:</span>
                    <span className="font-bold text-blue-600">
                      {(predictions || mockPredictions).predictedScore}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Confidence:</span>
                    <span className="font-bold">
                      {(predictions || mockPredictions).confidence}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timeframe:</span>
                    <span className="font-bold">
                      {(predictions || mockPredictions).timeframe}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Contributing Factors</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Historical Trend:</span>
                    <span className="font-bold">
                      {(predictions || mockPredictions).factors.historical}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Momentum:</span>
                    <span className="font-bold">
                      {(predictions || mockPredictions).factors.momentum}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Seasonality:</span>
                    <span className="font-bold">
                      {(predictions || mockPredictions).factors.seasonality}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Technical Implementation Details */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Implementation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Backend Services</h4>
              <ul className="text-sm space-y-1">
                <li>• TrendAnalysisService - Multi-timeframe analysis</li>
                <li>• Regression detection with ML algorithms</li>
                <li>• Linear regression for predictions</li>
                <li>• Smart caching with TTL optimization</li>
                <li>• Database integration with Prisma</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Frontend Components</h4>
              <ul className="text-sm space-y-1">
                <li>• Responsive TrendChart with multiple metrics</li>
                <li>• Period selection (7d, 30d, 90d, 1y)</li>
                <li>• Real-time data fetching hooks</li>
                <li>• Loading states and error handling</li>
                <li>• Interactive regression detection display</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">API Endpoints Available</h4>
            <div className="text-sm font-mono space-y-1">
              <div>GET /api/enhanced-analysis/trends/:projectId/:period</div>
              <div>GET /api/enhanced-analysis/regressions/:projectId</div>
              <div>GET /api/enhanced-analysis/predictions/:projectId</div>
              <div>GET /api/enhanced-analysis/trend-score/:projectId</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestTrendAnalysisPage; 