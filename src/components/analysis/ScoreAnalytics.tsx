'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ScoreData {
  date: string;
  overallScore: number;
  technicalScore: number;
  contentScore: number;
  onPageScore: number;
  uxScore: number;
  issues: number;
  recommendations: number;
}

interface IssueDistribution {
  category: string;
  count: number;
  color: string;
}

interface Insight {
  id: string;
  type: 'improvement' | 'warning' | 'achievement' | 'suggestion';
  title: string;
  description: string;
  value?: string;
  trend?: 'up' | 'down' | 'stable';
  date: string;
}

interface ScoreAnalyticsProps {
  projectId: string;
  currentAnalysisId: string;
}

export function ScoreAnalytics({ projectId, currentAnalysisId }: ScoreAnalyticsProps) {
  const [scoreData, setScoreData] = useState<ScoreData[]>([]);
  const [issueDistribution, setIssueDistribution] = useState<IssueDistribution[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('overallScore');

  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [trendsResponse, issuesResponse, insightsResponse] = await Promise.all([
        fetch(`/api/enhanced-analysis/projects/${projectId}/trends?period=${timeRange}`),
        fetch(`/api/enhanced-analysis/${currentAnalysisId}/issues`),
        fetch(`/api/enhanced-analysis/${currentAnalysisId}/insights`)
      ]);

      const trendsData = await trendsResponse.json();
      const issuesData = await issuesResponse.json();
      const insightsData = await insightsResponse.json();

      if (trendsData.success) {
        setScoreData(trendsData.data.trends || []);
      }

      if (issuesData.success) {
        const distribution = calculateIssueDistribution(issuesData.data.categorized);
        setIssueDistribution(distribution);
      }

      if (insightsData.success) {
        setInsights(insightsData.data.insights || []);
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, timeRange, currentAnalysisId]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  const calculateIssueDistribution = (categorizedIssues: any): IssueDistribution[] => {
    const colors = {
      critical: '#ef4444',
      high: '#f97316',
      medium: '#eab308',
      low: '#3b82f6'
    };

    return Object.entries(categorizedIssues).map(([severity, issues]: [string, any]) => ({
      category: severity,
      count: Array.isArray(issues) ? issues.length : 0,
      color: colors[severity as keyof typeof colors] || '#6b7280'
    }));
  };

  const calculateTrend = (data: ScoreData[], metric: string) => {
    if (data.length < 2) return { direction: 'stable', change: 0, percentage: 0 };
    
    const current = data[data.length - 1][metric as keyof ScoreData] as number;
    const previous = data[data.length - 2][metric as keyof ScoreData] as number;
    const change = current - previous;
    const percentage = previous !== 0 ? ((change / previous) * 100) : 0;
    
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      change: Math.abs(change),
      percentage: Math.abs(percentage)
    };
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'improvement': return TrendingUp;
      case 'warning': return AlertCircle;
      case 'achievement': return Award;
      case 'suggestion': return Zap;
      default: return CheckCircle;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'improvement': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-red-600 bg-red-100';
      case 'achievement': return 'text-purple-600 bg-purple-100';
      case 'suggestion': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const currentTrend = calculateTrend(scoreData, selectedMetric);
  const latestScore = scoreData.length > 0 ? scoreData[scoreData.length - 1] : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Performance Analytics</h2>
          <p className="text-gray-600">Track your SEO progress over time</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadAnalyticsData} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {latestScore && (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Overall Score</p>
                    <div className="text-3xl font-bold">{latestScore.overallScore}</div>
                  </div>
                  <div className={`p-2 rounded-full ${
                    currentTrend.direction === 'up' ? 'bg-green-100' : 
                    currentTrend.direction === 'down' ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    {currentTrend.direction === 'up' ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : currentTrend.direction === 'down' ? (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    ) : (
                      <BarChart3 className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                </div>
                {currentTrend.direction !== 'stable' && (
                  <div className="mt-2">
                    <Badge variant="outline" className={
                      currentTrend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                    }>
                      {currentTrend.direction === 'up' ? '+' : '-'}{currentTrend.change.toFixed(1)} 
                      ({currentTrend.percentage.toFixed(1)}%)
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Issues</p>
                    <div className="text-3xl font-bold">{latestScore.issues}</div>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Recommendations</p>
                    <div className="text-3xl font-bold">{latestScore.recommendations}</div>
                  </div>
                  <Target className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                    <div className="text-lg font-semibold">
                      {new Date(latestScore.date).toLocaleDateString()}
                    </div>
                  </div>
                  <Calendar className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Score Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Category Breakdown</TabsTrigger>
          <TabsTrigger value="issues">Issue Analysis</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Score Trends Over Time</CardTitle>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overallScore">Overall Score</SelectItem>
                    <SelectItem value="technicalScore">Technical Score</SelectItem>
                    <SelectItem value="contentScore">Content Score</SelectItem>
                    <SelectItem value="onPageScore">On-Page Score</SelectItem>
                    <SelectItem value="uxScore">UX Score</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      labelFormatter={(value) => `Date: ${new Date(value).toLocaleDateString()}`}
                      formatter={(value: number) => [`${value}`, 'Score']}
                    />
                    <Area
                      type="monotone"
                      dataKey={selectedMetric}
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreData.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="technicalScore" fill="#ef4444" name="Technical" />
                      <Bar dataKey="contentScore" fill="#f97316" name="Content" />
                      <Bar dataKey="onPageScore" fill="#eab308" name="On-Page" />
                      <Bar dataKey="uxScore" fill="#3b82f6" name="UX" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Latest Scores Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                {latestScore && (
                  <div className="space-y-4">
                    {[
                      { name: 'Technical', score: latestScore.technicalScore, color: 'bg-red-500' },
                      { name: 'Content', score: latestScore.contentScore, color: 'bg-orange-500' },
                      { name: 'On-Page', score: latestScore.onPageScore, color: 'bg-yellow-500' },
                      { name: 'UX', score: latestScore.uxScore, color: 'bg-blue-500' }
                    ].map((category) => (
                      <div key={category.name} className="flex items-center justify-between">
                        <span className="font-medium">{category.name}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${category.color}`}
                              style={{ width: `${category.score}%` }}
                            />
                          </div>
                          <span className="font-bold w-12 text-right">{category.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="issues">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Issue Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={issueDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, count }) => `${category}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {issueDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Issue Severity Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {issueDistribution.map((item) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="capitalize font-medium">{item.category}</span>
                      </div>
                      <Badge variant="outline">{item.count} issues</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.length > 0 ? insights.map((insight) => {
                  const Icon = getInsightIcon(insight.type);
                  const colorClasses = getInsightColor(insight.type);
                  
                  return (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                      <div className={`p-2 rounded-full ${colorClasses}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{insight.title}</h4>
                        <p className="text-gray-600 text-sm mb-2">{insight.description}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{new Date(insight.date).toLocaleDateString()}</span>
                          {insight.value && (
                            <Badge variant="outline">{insight.value}</Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                }) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No insights available yet. Run more analyses to see trends and recommendations.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 