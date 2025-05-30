'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar,
  BarChart3,
  Activity,
  AlertTriangle
} from 'lucide-react';

interface TrendDataPoint {
  date: Date;
  overallScore: number;
  technicalScore: number;
  contentScore: number;
  onpageScore: number;
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

interface TrendData {
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

interface Regression {
  id: string;
  detectedAt: Date;
  metric: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
  beforeValue: number;
  afterValue: number;
  changePercentage: number;
}

interface TrendChartProps {
  data: TrendData | null;
  regressions?: Regression[];
  loading?: boolean;
  onPeriodChange?: (period: '7d' | '30d' | '90d' | '1y') => void;
}

const TrendChart: React.FC<TrendChartProps> = ({ 
  data, 
  regressions = [], 
  loading = false, 
  onPeriodChange 
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'overall' | 'technical' | 'content' | 'onpage' | 'ux'>('overall');
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>(data?.period || '30d');

  const handlePeriodChange = (period: '7d' | '30d' | '90d' | '1y') => {
    setSelectedPeriod(period);
    onPeriodChange?.(period);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable': return <Minus className="h-4 w-4 text-gray-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600 bg-green-50';
      case 'declining': return 'text-red-600 bg-red-50';
      case 'stable': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'major': return 'bg-orange-100 text-orange-800';
      case 'minor': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMetricData = (dataPoints: TrendDataPoint[], metric: string) => {
    return dataPoints.map(point => {
      switch (metric) {
        case 'technical': return point.technicalScore;
        case 'content': return point.contentScore;
        case 'onpage': return point.onpageScore;
        case 'ux': return point.uxScore;
        default: return point.overallScore;
      }
    });
  };

  const renderSimpleChart = (dataPoints: TrendDataPoint[], metric: string) => {
    if (!dataPoints || dataPoints.length === 0) return null;

    const data = getMetricData(dataPoints, metric);
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    return (
      <div className="h-32 flex items-end space-x-1 bg-gray-50 p-4 rounded-lg">
        {data.map((value, index) => {
          const height = ((value - min) / range) * 100;
          const isRecent = index >= data.length - 3;
          return (
            <div
              key={index}
              className={`flex-1 bg-blue-500 rounded-t-sm transition-all hover:bg-blue-600 ${
                isRecent ? 'opacity-100' : 'opacity-70'
              }`}
              style={{ height: `${Math.max(height, 5)}%` }}
              title={`${dataPoints[index].date.toLocaleDateString()}: ${value}`}
            />
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Trends
            <Badge variant="outline">Loading...</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse bg-gray-200 h-32 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-16 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Trends
            <Badge variant="secondary">No Data</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No trend data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Trends
            <Badge variant="outline" className={getTrendColor(data.summary.overallTrend)}>
              {getTrendIcon(data.summary.overallTrend)}
              {data.summary.overallTrend}
            </Badge>
          </CardTitle>
          
          {/* Period Selection */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1">
              {(['7d', '30d', '90d', '1y'] as const).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePeriodChange(period)}
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.summary.bestScore}</div>
            <div className="text-sm text-muted-foreground">Best Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{data.summary.averageScore}</div>
            <div className="text-sm text-muted-foreground">Average</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{data.summary.worstScore}</div>
            <div className="text-sm text-muted-foreground">Worst Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{data.metrics.consistencyScore}</div>
            <div className="text-sm text-muted-foreground">Consistency</div>
          </div>
        </div>

        {/* Metric Selection */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'overall', label: 'Overall' },
            { key: 'technical', label: 'Technical' },
            { key: 'content', label: 'Content' },
            { key: 'onpage', label: 'On-Page' },
            { key: 'ux', label: 'UX' }
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={selectedMetric === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetric(key as any)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Chart */}
        <div>
          <h4 className="font-medium mb-3 capitalize">{selectedMetric} Score Trend</h4>
          {renderSimpleChart(data.dataPoints, selectedMetric)}
        </div>

        {/* Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Activity className="h-4 w-4" />
              <span className="font-medium">Score Change</span>
            </div>
            <div className={`text-lg font-bold ${
              data.metrics.scoreImprovement > 0 ? 'text-green-600' : 
              data.metrics.scoreImprovement < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {data.metrics.scoreImprovement > 0 ? '+' : ''}{data.metrics.scoreImprovement}
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">Performance Change</span>
            </div>
            <div className={`text-lg font-bold ${
              data.metrics.performanceChange > 0 ? 'text-green-600' : 
              data.metrics.performanceChange < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {data.metrics.performanceChange > 0 ? '+' : ''}{data.metrics.performanceChange}
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4" />
              <span className="font-medium">Volatility</span>
            </div>
            <div className={`text-lg font-bold ${
              data.summary.volatility < 10 ? 'text-green-600' : 
              data.summary.volatility > 20 ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {data.summary.volatility.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Regressions */}
        {regressions && regressions.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Recent Regressions
            </h4>
            <div className="space-y-2">
              {regressions.slice(0, 3).map((regression) => (
                <div key={regression.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Badge className={getSeverityColor(regression.severity)}>
                    {regression.severity}
                  </Badge>
                  <div className="flex-1">
                    <div className="font-medium">{regression.metric}</div>
                    <div className="text-sm text-muted-foreground">{regression.description}</div>
                    <div className="text-xs text-red-600 mt-1">
                      {regression.beforeValue} → {regression.afterValue} ({regression.changePercentage}% change)
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(regression.detectedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Info */}
        <div className="border-t pt-4 text-xs text-muted-foreground">
          <div>Data Points: {data.summary.totalDataPoints}</div>
          <div>Period: {data.period}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendChart; 