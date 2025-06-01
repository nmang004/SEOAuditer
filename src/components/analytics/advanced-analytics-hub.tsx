"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { m } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Legend
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Target,
  Zap,
  Clock,
  Users,
  Search,
  Globe,
  Award,
  AlertTriangle,
  Download,
  RefreshCw,
  Filter,
  Eye,
  Layers,
  Brain,
  Sparkles,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { fadeInUp, staggerContainer } from '@/lib/animations';

interface AnalyticsData {
  overview: {
    totalProjects: number;
    totalAnalyses: number;
    averageScore: number;
    scoreImprovement: number;
    activeMonitoring: number;
    issuesResolved: number;
  };
  historicalTrends: Array<{
    date: string;
    overallScore: number;
    technicalScore: number;
    contentScore: number;
    onPageScore: number;
    uxScore: number;
    competitorScore: number;
    volumeAnalyzed: number;
  }>;
  competitorAnalysis: Array<{
    name: string;
    score: number;
    change: number;
    marketShare: number;
    strength: 'technical' | 'content' | 'onpage' | 'ux';
  }>;
  performanceMetrics: {
    pageSpeed: number;
    coreWebVitals: number;
    mobileScore: number;
    accessibilityScore: number;
    seoCompliance: number;
    userExperience: number;
  };
  insights: Array<{
    id: string;
    type: 'opportunity' | 'risk' | 'trend' | 'achievement';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    confidence: number;
    actionable: boolean;
  }>;
  realTimeMetrics: {
    crawlsInProgress: number;
    averageResponseTime: number;
    uptime: number;
    errorsDetected: number;
    lastUpdated: Date;
  };
}

interface AdvancedAnalyticsHubProps {
  projectId?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  autoRefresh?: boolean;
  showComparison?: boolean;
}

export function AdvancedAnalyticsHub({
  projectId,
  timeRange = '30d',
  autoRefresh = true,
  showComparison = false
}: AdvancedAnalyticsHubProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<string>('overallScore');
  const [selectedPeriod, setSelectedPeriod] = useState(timeRange);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Color schemes for different metrics
  const metricColors = {
    overallScore: '#3b82f6',
    technicalScore: '#10b981',
    contentScore: '#8b5cf6',
    onPageScore: '#f59e0b',
    uxScore: '#ec4899',
    competitorScore: '#ef4444'
  };

  const competitorColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Mock data generation (replace with real API calls)
  const generateMockData = (): AnalyticsData => ({
    overview: {
      totalProjects: 12,
      totalAnalyses: 156,
      averageScore: 82,
      scoreImprovement: 7,
      activeMonitoring: 8,
      issuesResolved: 34
    },
    historicalTrends: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      overallScore: 75 + Math.random() * 20,
      technicalScore: 70 + Math.random() * 25,
      contentScore: 80 + Math.random() * 15,
      onPageScore: 78 + Math.random() * 18,
      uxScore: 72 + Math.random() * 22,
      competitorScore: 70 + Math.random() * 20,
      volumeAnalyzed: 10 + Math.random() * 20
    })),
    competitorAnalysis: [
      { name: 'Competitor A', score: 85, change: 3, marketShare: 25, strength: 'technical' },
      { name: 'Competitor B', score: 78, change: -2, marketShare: 20, strength: 'content' },
      { name: 'Competitor C', score: 82, change: 5, marketShare: 18, strength: 'onpage' },
      { name: 'Competitor D', score: 76, change: 1, marketShare: 15, strength: 'ux' },
    ],
    performanceMetrics: {
      pageSpeed: 88,
      coreWebVitals: 92,
      mobileScore: 85,
      accessibilityScore: 78,
      seoCompliance: 91,
      userExperience: 86
    },
    insights: [
      {
        id: '1',
        type: 'opportunity',
        title: 'Mobile Performance Gap',
        description: 'Your mobile score is 15 points below desktop. Focus on mobile optimization.',
        impact: 'high',
        confidence: 87,
        actionable: true
      },
      {
        id: '2',
        type: 'trend',
        title: 'Content Quality Improving',
        description: 'Content scores have increased 12% over the last 30 days.',
        impact: 'medium',
        confidence: 94,
        actionable: false
      },
      {
        id: '3',
        type: 'risk',
        title: 'Competitor Gaining Ground',
        description: 'Competitor A has improved their technical score by 8 points this month.',
        impact: 'medium',
        confidence: 78,
        actionable: true
      }
    ],
    realTimeMetrics: {
      crawlsInProgress: 3,
      averageResponseTime: 1.2,
      uptime: 99.8,
      errorsDetected: 2,
      lastUpdated: new Date()
    }
  });

  // Data fetching with auto-refresh
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      // In a real implementation, this would be API calls
      // const response = await fetch(`/api/analytics/advanced?period=${selectedPeriod}&project=${projectId}`);
      // const result = await response.json();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData = generateMockData();
      setData(mockData);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh setup
  useEffect(() => {
    fetchAnalyticsData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAnalyticsData, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    }
  }, [selectedPeriod, projectId, autoRefresh, fetchAnalyticsData]);

  // Metric trend calculation
  const getTrendDirection = (current: number, previous: number): 'up' | 'down' | 'stable' => {
    const diff = current - previous;
    if (diff > 1) return 'up';
    if (diff < -1) return 'down';
    return 'stable';
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up': return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'down': return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Target className="h-5 w-5 text-blue-500" />;
      case 'risk': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'trend': return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'achievement': return <Award className="h-5 w-5 text-yellow-500" />;
      default: return <Brain className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Advanced Analytics Hub</h2>
            <p className="text-gray-600">Loading comprehensive SEO insights...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Failed to load analytics data</p>
          <Button onClick={fetchAnalyticsData} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <m.div
      variants={staggerContainer()}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics Hub</h2>
          <p className="text-gray-600">Comprehensive SEO analysis and competitive intelligence</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1">
            <Activity className="h-3 w-3" />
            Live Data
          </Badge>
          
          <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as '7d' | '30d' | '90d' | '1y')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={fetchAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Real-time Metrics Bar */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Real-time Status</span>
              </div>
              <div className="text-sm text-gray-600">
                {data.realTimeMetrics.crawlsInProgress} crawls in progress
              </div>
              <div className="text-sm text-gray-600">
                {data.realTimeMetrics.averageResponseTime}s avg response
              </div>
              <div className="text-sm text-gray-600">
                {data.realTimeMetrics.uptime}% uptime
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Last updated: {data.realTimeMetrics.lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold">{data.overview.totalProjects}</p>
              </div>
              <Globe className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Analyses Run</p>
                <p className="text-2xl font-bold">{data.overview.totalAnalyses}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Score</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{data.overview.averageScore}</p>
                  {getTrendIcon(getTrendDirection(data.overview.averageScore, 75))}
                </div>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Improvement</p>
                <p className="text-2xl font-bold text-green-600">+{data.overview.scoreImprovement}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Monitoring</p>
                <p className="text-2xl font-bold">{data.overview.activeMonitoring}</p>
              </div>
              <Eye className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Issues Resolved</p>
                <p className="text-2xl font-bold">{data.overview.issuesResolved}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
          <TabsTrigger value="competitors">Competitor Analysis</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="performance">Performance Radar</TabsTrigger>
          <TabsTrigger value="monitoring">Real-time Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Historical Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(metricColors).map(([metric, color]) => (
                    <Button
                      key={metric}
                      variant={selectedMetric === metric ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedMetric(metric)}
                      className="capitalize"
                    >
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: color }}
                      />
                      {metric.replace('Score', '')}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.historicalTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis yAxisId="score" domain={[0, 100]} />
                    <YAxis yAxisId="volume" orientation="right" />
                    <Tooltip 
                      labelFormatter={(value) => `Date: ${new Date(value).toLocaleDateString()}`}
                    />
                    <Legend />
                    <Area
                      yAxisId="score"
                      type="monotone"
                      dataKey={selectedMetric}
                      stroke={metricColors[selectedMetric as keyof typeof metricColors]}
                      fill={metricColors[selectedMetric as keyof typeof metricColors]}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Bar
                      yAxisId="volume"
                      dataKey="volumeAnalyzed"
                      fill="#e5e7eb"
                      opacity={0.5}
                      name="Pages Analyzed"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Competitor Landscape</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.competitorAnalysis}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Share Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.competitorAnalysis}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, marketShare }) => `${name}: ${marketShare}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="marketShare"
                      >
                        {data.competitorAnalysis.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={competitorColors[index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Competitor Performance Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.competitorAnalysis.map((competitor, index) => (
                  <div key={competitor.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: competitorColors[index] }}
                      />
                      <div>
                        <p className="font-medium">{competitor.name}</p>
                        <p className="text-sm text-gray-600">Strong in {competitor.strength}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{competitor.score}</p>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(getTrendDirection(competitor.score, competitor.score - competitor.change))}
                        <span className={`text-sm ${competitor.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {competitor.change > 0 ? '+' : ''}{competitor.change}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6">
            {data.insights.map((insight) => (
              <Card key={insight.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{insight.title}</h3>
                          <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}>
                            {insight.impact} impact
                          </Badge>
                          {insight.actionable && (
                            <Badge variant="outline">Actionable</Badge>
                          )}
                        </div>
                        <p className="text-gray-600">{insight.description}</p>
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Confidence:</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-24">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${insight.confidence}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{insight.confidence}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {insight.actionable && (
                      <Button size="sm" variant="outline">
                        Take Action
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Radar Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={Object.entries(data.performanceMetrics).map(([key, value]) => ({
                    subject: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                    A: value,
                    fullMark: 100
                  }))}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Performance"
                      dataKey="A"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(data.performanceMetrics).map(([key, value]) => (
              <Card key={key}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </p>
                      <p className="text-2xl font-bold">{value}</p>
                    </div>
                    <div className={`text-right ${value >= 80 ? 'text-green-600' : value >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {value >= 80 ? 'Excellent' : value >= 60 ? 'Good' : 'Needs Work'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Crawls</p>
                    <p className="text-2xl font-bold">{data.realTimeMetrics.crawlsInProgress}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Response Time</p>
                    <p className="text-2xl font-bold">{data.realTimeMetrics.averageResponseTime}s</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">System Uptime</p>
                    <p className="text-2xl font-bold">{data.realTimeMetrics.uptime}%</p>
                  </div>
                  <Globe className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Errors Detected</p>
                    <p className="text-2xl font-bold">{data.realTimeMetrics.errorsDetected}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Health Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Real-time monitoring dashboard would show live system metrics, error logs, and performance indicators here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </m.div>
  );
} 