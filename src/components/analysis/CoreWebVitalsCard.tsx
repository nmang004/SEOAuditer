'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Clock, Zap, BarChart } from 'lucide-react';

interface CoreWebVitals {
  LCP: number;  // Largest Contentful Paint (ms)
  FID: number;  // First Input Delay (ms) 
  CLS: number;  // Cumulative Layout Shift (score)
  FCP: number;  // First Contentful Paint (ms)
  TTFB: number; // Time to First Byte (ms)
  SI: number;   // Speed Index
  TTI: number;  // Time to Interactive (ms)
}

interface CoreWebVitalsAnalysis {
  url: string;
  timestamp: string;
  deviceType: 'mobile' | 'desktop';
  coreWebVitals: CoreWebVitals;
  performanceScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  insights: {
    lcpAnalysis: {
      value: number;
      status: 'good' | 'needs-improvement' | 'poor';
      target: number;
      percentile: string;
    };
    fidAnalysis: {
      value: number;
      status: 'good' | 'needs-improvement' | 'poor';
      target: number;
      percentile: string;
    };
    clsAnalysis: {
      value: number;
      status: 'good' | 'needs-improvement' | 'poor';
      target: number;
      percentile: string;
    };
  };
  recommendations: Array<{
    metric: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
  }>;
}

interface CoreWebVitalsCardProps {
  data: CoreWebVitalsAnalysis | null;
  loading?: boolean;
}

const CoreWebVitalsCard: React.FC<CoreWebVitalsCardProps> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Core Web Vitals
            <Badge variant="outline">Analyzing...</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-20 rounded"></div>
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
            <BarChart className="h-5 w-5" />
            Core Web Vitals
            <Badge variant="secondary">No Data</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No Core Web Vitals data available</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-500';
      case 'needs-improvement': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'good': return <Badge className="bg-green-100 text-green-800">Good</Badge>;
      case 'needs-improvement': return <Badge className="bg-yellow-100 text-yellow-800">Needs Improvement</Badge>;
      case 'poor': return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600';
      case 'B': return 'text-blue-600';
      case 'C': return 'text-yellow-600';
      case 'D': return 'text-orange-600';
      case 'F': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatTime = (ms: number): string => {
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(2)}s`;
    }
    return `${Math.round(ms)}ms`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Core Web Vitals
            <Badge variant="outline" className="capitalize">
              {data.deviceType}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${getGradeColor(data.grade)}`}>
              {data.grade}
            </span>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Performance Score</div>
              <div className="text-lg font-semibold">{data.performanceScore}/100</div>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Web Vitals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* LCP */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">LCP</span>
              </div>
              {getStatusBadge(data.insights.lcpAnalysis.status)}
            </div>
            <div className="text-2xl font-bold">{formatTime(data.coreWebVitals.LCP)}</div>
            <div className="text-sm text-muted-foreground">
              Target: ≤ {formatTime(data.insights.lcpAnalysis.target)}
            </div>
            <Progress 
              value={Math.min(100, (data.insights.lcpAnalysis.target / data.coreWebVitals.LCP) * 100)} 
              className="h-2"
            />
            <div className="text-xs text-muted-foreground">
              {data.insights.lcpAnalysis.percentile}
            </div>
          </div>

          {/* FID */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="font-medium">FID</span>
              </div>
              {getStatusBadge(data.insights.fidAnalysis.status)}
            </div>
            <div className="text-2xl font-bold">{formatTime(data.coreWebVitals.FID)}</div>
            <div className="text-sm text-muted-foreground">
              Target: ≤ {formatTime(data.insights.fidAnalysis.target)}
            </div>
            <Progress 
              value={Math.min(100, (data.insights.fidAnalysis.target / data.coreWebVitals.FID) * 100)} 
              className="h-2"
            />
            <div className="text-xs text-muted-foreground">
              {data.insights.fidAnalysis.percentile}
            </div>
          </div>

          {/* CLS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">CLS</span>
              </div>
              {getStatusBadge(data.insights.clsAnalysis.status)}
            </div>
            <div className="text-2xl font-bold">{data.coreWebVitals.CLS.toFixed(3)}</div>
            <div className="text-sm text-muted-foreground">
              Target: ≤ {data.insights.clsAnalysis.target}
            </div>
            <Progress 
              value={Math.min(100, (1 - (data.coreWebVitals.CLS / 0.5)) * 100)} 
              className="h-2"
            />
            <div className="text-xs text-muted-foreground">
              {data.insights.clsAnalysis.percentile}
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Additional Performance Metrics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-sm text-muted-foreground">FCP</div>
              <div className="font-semibold">{formatTime(data.coreWebVitals.FCP)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">TTFB</div>
              <div className="font-semibold">{formatTime(data.coreWebVitals.TTFB)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">SI</div>
              <div className="font-semibold">{formatTime(data.coreWebVitals.SI)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">TTI</div>
              <div className="font-semibold">{formatTime(data.coreWebVitals.TTI)}</div>
            </div>
          </div>
        </div>

        {/* Top Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Top Recommendations</h4>
            <div className="space-y-2">
              {data.recommendations.slice(0, 3).map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Badge 
                    variant={rec.priority === 'critical' ? 'destructive' : 
                            rec.priority === 'high' ? 'default' : 'secondary'}
                    className="mt-0.5"
                  >
                    {rec.priority}
                  </Badge>
                  <div className="flex-1">
                    <div className="font-medium">{rec.title}</div>
                    <div className="text-sm text-muted-foreground">{rec.description}</div>
                    <div className="text-xs text-blue-600 mt-1">{rec.impact}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Info */}
        <div className="border-t pt-4 text-xs text-muted-foreground">
          <div>Analyzed: {new Date(data.timestamp).toLocaleString()}</div>
          <div>URL: {data.url}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CoreWebVitalsCard; 