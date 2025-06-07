'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Zap,
  Download,
  RefreshCw,
  Monitor,
  Target,
  Gauge,
  FileImage,
  Link2,
  Type,
  ArrowRight,
  Star,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Analysis, DashboardConfig } from './AnalysisDashboardRouter';

interface SinglePageDashboardProps {
  analysis: Analysis;
  config: DashboardConfig;
}

// Score Circle Component
function ScoreCircle({ score, size = 'medium' }: { score: number; size?: 'small' | 'medium' | 'large' }) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'stroke-green-500';
    if (score >= 70) return 'stroke-yellow-500';
    if (score >= 50) return 'stroke-orange-500';
    return 'stroke-red-500';
  };

  const sizes = {
    small: { size: 80, strokeWidth: 6, fontSize: 'text-lg' },
    medium: { size: 120, strokeWidth: 8, fontSize: 'text-2xl' },
    large: { size: 160, strokeWidth: 10, fontSize: 'text-4xl' }
  };

  const { size: circleSize, strokeWidth, fontSize } = sizes[size];
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={circleSize} height={circleSize} className="transform -rotate-90">
        <circle
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-700"
        />
        <circle
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-1000 ease-out", getScoreBg(score))}
          strokeLinecap="round"
        />
      </svg>
      <div className={cn("absolute inset-0 flex items-center justify-center", fontSize, getScoreColor(score))}>
        <span className="font-bold">{score}</span>
      </div>
    </div>
  );
}

// Quick Stats Component
function QuickStats({ analysis }: { analysis: Analysis }) {
  const stats = [
    {
      label: 'Load Time',
      value: `${analysis.data?.performance.loadTime || 0}s`,
      icon: <Clock className="h-4 w-4" />,
      trend: 'good'
    },
    {
      label: 'Issues Found',
      value: analysis.data?.issues.length || 0,
      icon: <AlertTriangle className="h-4 w-4" />,
      trend: analysis.data?.issues.length === 0 ? 'good' : 'warning'
    },
    {
      label: 'Recommendations',
      value: analysis.data?.recommendations.length || 0,
      icon: <Target className="h-4 w-4" />,
      trend: 'neutral'
    },
    {
      label: 'Page Size',
      value: `${analysis.data?.performance.pageSize || 0}MB`,
      icon: <Gauge className="h-4 w-4" />,
      trend: 'neutral'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="text-center">
          <div className={cn(
            "inline-flex items-center justify-center w-8 h-8 rounded-lg mb-2",
            stat.trend === 'good' ? 'bg-green-500/20 text-green-400' :
            stat.trend === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-gray-500/20 text-gray-400'
          )}>
            {stat.icon}
          </div>
          <div className="text-2xl font-bold text-white">{stat.value}</div>
          <div className="text-sm text-gray-400">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

// Top Recommendation Component
function TopRecommendation({ recommendation }: { recommendation: any }) {
  if (!recommendation) return null;

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20">
            <Star className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Priority Recommendation</h3>
            <p className="text-sm text-gray-400">Highest impact opportunity</p>
          </div>
        </div>
        <Badge className={getImpactColor(recommendation.impact)}>
          {recommendation.impact} impact
        </Badge>
      </div>
      
      <h4 className="text-lg font-medium text-white mb-2">{recommendation.title}</h4>
      <p className="text-gray-300 mb-4">{recommendation.description}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">
            Effort: <span className="text-white capitalize">{recommendation.effort}</span>
          </span>
          <span className="text-gray-400">
            Category: <span className="text-white">{recommendation.category}</span>
          </span>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
          Implement
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
}

// Quick Wins Component
function QuickWins({ recommendations }: { recommendations: any[] }) {
  const quickWins = recommendations
    .filter(r => r.effort === 'low' && r.impact !== 'low')
    .slice(0, 3);

  if (quickWins.length === 0) return null;

  return (
    <Card className="p-6 bg-gray-800/50 border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-yellow-400" />
        <h3 className="font-semibold text-white">Quick Wins</h3>
        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
          {quickWins.length} opportunities
        </Badge>
      </div>
      
      <div className="space-y-3">
        {quickWins.map((win, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30">
            <div>
              <h4 className="text-sm font-medium text-white">{win.title}</h4>
              <p className="text-xs text-gray-400">{win.category}</p>
            </div>
            <Button size="sm" variant="ghost" className="text-yellow-400 hover:text-yellow-300">
              Fix
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Performance Metrics Component
function PerformanceMetrics({ data }: { data: any }) {
  const metrics = [
    { label: 'Largest Contentful Paint', value: `${data.lcp}s`, target: 2.5, current: data.lcp },
    { label: 'First Input Delay', value: `${data.fid}ms`, target: 100, current: data.fid },
    { label: 'Cumulative Layout Shift', value: data.cls, target: 0.1, current: data.cls }
  ];

  return (
    <div className="space-y-4">
      {metrics.map((metric, index) => {
        const isGood = metric.current <= metric.target;
        const percentage = Math.min((metric.current / (metric.target * 2)) * 100, 100);
        
        return (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">{metric.label}</span>
              <span className={cn(
                "text-sm font-semibold",
                isGood ? "text-green-400" : "text-red-400"
              )}>
                {metric.value}
              </span>
            </div>
            <Progress 
              value={percentage} 
              className={cn(
                "h-2",
                isGood ? "bg-green-500/20" : "bg-red-500/20"
              )}
            />
            <div className="text-xs text-gray-400">
              Target: {metric.target}{metric.label.includes('ms') ? 'ms' : metric.label.includes('s') ? 's' : ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Issues List Component
function IssuesList({ issues }: { issues: any[] }) {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' };
      case 'high':
        return { color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' };
      case 'medium':
        return { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' };
      case 'low':
        return { color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' };
      default:
        return { color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/30' };
    }
  };

  return (
    <div className="space-y-4">
      {issues.map((issue, index) => {
        const config = getSeverityConfig(issue.severity);
        
        return (
          <Card key={index} className={cn("p-4 border", config.bg, config.border)}>
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-white">{issue.title}</h4>
              <Badge className={cn(config.bg, config.color, "border-none")}>
                {issue.severity}
              </Badge>
            </div>
            <p className="text-sm text-gray-300 mb-3">{issue.description}</p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="px-2 py-1 rounded bg-gray-700">{issue.type}</span>
              <Button size="sm" variant="ghost" className="h-6 text-xs">
                Learn More
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// Main Dashboard Component
export function SinglePageDashboard({ analysis, config }: SinglePageDashboardProps) {
  const [activeTab, setActiveTab] = useState(config.defaultView);

  const handleReanalyze = () => {
    // TODO: Implement reanalyze functionality
    console.log('Reanalyzing:', analysis.url);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting analysis:', analysis.id);
  };

  const handleMonitor = () => {
    // TODO: Implement monitoring functionality
    console.log('Setting up monitoring for:', analysis.url);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-6 w-6 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white">Single Page Analysis</h1>
            <Badge variant="outline" className="border-indigo-500 text-indigo-400">
              {analysis.crawlType}
            </Badge>
          </div>
          <p className="text-gray-400">{analysis.url}</p>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Analyzed {new Date(analysis.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReanalyze}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Re-analyze
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleMonitor}>
            <Monitor className="h-4 w-4 mr-1" />
            Monitor
          </Button>
        </div>
      </div>

      {/* Hero Section - Score & Quick Stats */}
      <Card className="p-8 bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-gray-600">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="text-center">
            <ScoreCircle score={analysis.data?.score || 0} size="large" />
            <p className="text-sm text-gray-400 mt-2">Overall SEO Score</p>
          </div>
          <div className="flex-1">
            <QuickStats analysis={analysis} />
          </div>
        </div>
      </Card>

      {/* Top Recommendation */}
      {analysis.data?.recommendations && analysis.data.recommendations.length > 0 && (
        <TopRecommendation recommendation={analysis.data.recommendations[0]} />
      )}

      {/* Quick Wins & Recommendation Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analysis.data?.recommendations && (
          <QuickWins recommendations={analysis.data.recommendations} />
        )}
        
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="font-semibold text-white mb-4">Analysis Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Pages Analyzed:</span>
              <span className="text-white">{analysis.metadata.pagesAnalyzed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Analysis Duration:</span>
              <span className="text-white">{analysis.metadata.estimatedDuration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <Badge variant="default" className="bg-green-500/20 text-green-400">
                {analysis.status}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-gray-800 border-gray-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-600">
            Overview
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-indigo-600">
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="technical" className="data-[state=active]:bg-indigo-600">
            Technical
          </TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:bg-indigo-600">
            Content
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-indigo-600">
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 bg-gray-800/50 border-gray-700">
              <h3 className="font-semibold text-white mb-4">Key Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">SEO Score:</span>
                  <span className="text-white font-semibold">{analysis.data?.score || 0}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Load Time:</span>
                  <span className="text-white">{analysis.data?.performance.loadTime || 0}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Page Size:</span>
                  <span className="text-white">{analysis.data?.performance.pageSize || 0}MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Word Count:</span>
                  <span className="text-white">{analysis.data?.content.wordCount || 0}</span>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 bg-gray-800/50 border-gray-700">
              <h3 className="font-semibold text-white mb-4">Issues Summary</h3>
              {analysis.data?.issues && analysis.data.issues.length > 0 ? (
                <div className="space-y-2">
                  {['critical', 'high', 'medium', 'low'].map(severity => {
                    const count = analysis.data?.issues.filter(i => i.severity === severity).length || 0;
                    if (count === 0) return null;
                    
                    return (
                      <div key={severity} className="flex justify-between">
                        <span className="text-gray-400 capitalize">{severity}:</span>
                        <span className="text-white">{count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400">No issues found!</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="mt-6">
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <h3 className="font-semibold text-white mb-4">Action Plan</h3>
            {analysis.data?.recommendations && analysis.data.recommendations.length > 0 ? (
              <div className="space-y-4">
                {analysis.data.recommendations.map((rec, index) => (
                  <Card key={index} className="p-4 bg-gray-700/30 border-gray-600">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-white">{rec.title}</h4>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          {rec.impact} impact
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {rec.effort} effort
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">{rec.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{rec.category}</span>
                      <Button size="sm" variant="ghost">
                        Learn More
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <p className="text-green-400">No recommendations needed!</p>
                <p className="text-gray-400 text-sm">Your page is already well optimized.</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="mt-6">
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <h3 className="font-semibold text-white mb-4">Technical Analysis</h3>
            {analysis.data?.issues ? (
              <IssuesList issues={analysis.data.issues.filter(i => i.type === 'technical' || i.type === 'meta')} />
            ) : (
              <p className="text-gray-400">No technical issues detected.</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <h3 className="font-semibold text-white mb-4">Content Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-white mb-3">Content Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Word Count:</span>
                    <span className="text-white">{analysis.data?.content.wordCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Readability Score:</span>
                    <span className="text-white">{analysis.data?.content.readability || 0}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Keywords Found:</span>
                    <span className="text-white">{analysis.data?.content.keywords?.length || 0}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-3">Key Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.data?.content.keywords?.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="bg-gray-700 text-gray-300">
                      {keyword}
                    </Badge>
                  )) || <span className="text-gray-400">No keywords identified</span>}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <h3 className="font-semibold text-white mb-4">Core Web Vitals</h3>
            {analysis.data?.performance ? (
              <PerformanceMetrics data={analysis.data.performance} />
            ) : (
              <p className="text-gray-400">Performance data not available.</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}