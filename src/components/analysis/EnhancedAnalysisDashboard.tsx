'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Target,
  Lightbulb,
  FileText,
  Gauge,
  Users,
  Search,
  Smartphone,
  Shield,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

interface EnhancedAnalysisData {
  id: string;
  overallScore: number;
  categoryScores: {
    technical: number;
    content: number;
    onPage: number;
    ux: number;
  };
  issues: {
    critical: Issue[];
    high: Issue[];
    medium: Issue[];
    low: Issue[];
  };
  content: {
    wordCount: number;
    readabilityScore: number;
    keywordDensity: number;
    readingTime: number;
  };
  recommendations: Recommendation[];
  trends?: {
    direction: 'up' | 'down' | 'stable';
    change: number;
  };
  confidence: number;
  lastAnalyzed: string;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  fixComplexity: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  businessImpact: 'high' | 'medium' | 'low';
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  category: string;
  quickWin: boolean;
  estimatedImpact: string;
  implementationSteps: string[];
}

interface EnhancedAnalysisDashboardProps {
  analysisId: string;
  onRefresh?: () => void;
}

export function EnhancedAnalysisDashboard({ 
  analysisId, 
  onRefresh 
}: EnhancedAnalysisDashboardProps) {
  const [data, setData] = useState<EnhancedAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalysisData();
  }, [analysisId]);

  const loadAnalysisData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/enhanced-analysis/${analysisId}/detailed`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to load analysis data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'immediate': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No analysis data available</p>
          <Button onClick={loadAnalysisData} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalIssues = Object.values(data.issues).flat().length;
  const quickWins = data.recommendations.filter(r => r.quickWin).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">SEO Analysis Results</h1>
          <p className="text-gray-600 mt-1">
            Last analyzed: {new Date(data.lastAnalyzed).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-1">
            <Gauge className="w-3 h-3" />
            {data.confidence}% Confidence
          </Badge>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline">
              Refresh Analysis
            </Button>
          )}
        </div>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className={`text-4xl font-bold ${getScoreColor(data.overallScore)}`}>
              {data.overallScore}
            </div>
            <p className="text-sm text-gray-600 mt-1">Overall Score</p>
            {data.trends && (
              <div className="flex items-center justify-center mt-2">
                {data.trends.direction === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : data.trends.direction === 'down' ? (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                ) : null}
                <span className={`text-sm ${
                  data.trends.direction === 'up' ? 'text-green-600' : 
                  data.trends.direction === 'down' ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {data.trends.change > 0 ? '+' : ''}{data.trends.change}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {Object.entries(data.categoryScores).map(([category, score]) => {
          const icons = {
            technical: Shield,
            content: FileText,
            onPage: Search,
            ux: Users
          };
          const Icon = icons[category as keyof typeof icons];

          return (
            <Card key={category}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-5 h-5 text-gray-600" />
                  <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                    {score}
                  </span>
                </div>
                <p className="text-sm text-gray-600 capitalize">{category}</p>
                <Progress value={score} className="mt-2 h-2" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
            <div>
              <div className="text-2xl font-bold">{totalIssues}</div>
              <p className="text-sm text-gray-600">Total Issues</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center">
            <Zap className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <div className="text-2xl font-bold">{quickWins}</div>
              <p className="text-sm text-gray-600">Quick Wins</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center">
            <FileText className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <div className="text-2xl font-bold">{data.content.wordCount}</div>
              <p className="text-sm text-gray-600">Words</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center">
            <Clock className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <div className="text-2xl font-bold">{data.content.readingTime}m</div>
              <p className="text-sm text-gray-600">Reading Time</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="issues">Issues ({totalIssues})</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="content">Content Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Score Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(data.categoryScores).map(([category, score]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="capitalize font-medium">{category}</span>
                      <div className="flex items-center gap-3">
                        <Progress value={score} className="w-24 h-2" />
                        <span className={`font-bold ${getScoreColor(score)}`}>
                          {score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Issues Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Issues by Severity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data.issues).map(([severity, issues]) => (
                    <div key={severity} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getSeverityColor(severity)}`} />
                        <span className="capitalize font-medium">{severity}</span>
                      </div>
                      <Badge variant="outline">{issues.length}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="issues">
          <div className="space-y-4">
            {Object.entries(data.issues).map(([severity, issues]) => (
              issues.length > 0 && (
                <Card key={severity}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${getSeverityColor(severity)}`} />
                      {severity.charAt(0).toUpperCase() + severity.slice(1)} Issues ({issues.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {issues.map((issue) => (
                        <motion.div
                          key={issue.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold">{issue.title}</h4>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                {issue.category}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {issue.fixComplexity} fix
                              </Badge>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{issue.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Est. time: {issue.estimatedTime}</span>
                            <span>Impact: {issue.businessImpact}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations">
          <div className="space-y-4">
            {/* Quick Wins */}
            {quickWins > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Quick Wins ({quickWins})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.recommendations
                      .filter(rec => rec.quickWin)
                      .map((rec) => (
                        <motion.div
                          key={rec.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="border rounded-lg p-4 border-yellow-200 bg-yellow-50"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold">{rec.title}</h4>
                            <Badge className={`${getPriorityColor(rec.priority)} text-white`}>
                              {rec.priority}
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{rec.description}</p>
                          <div className="text-sm text-green-600 font-medium">
                            Expected impact: {rec.estimatedImpact}
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  All Recommendations ({data.recommendations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.recommendations.map((rec) => (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{rec.title}</h4>
                        <div className="flex gap-2">
                          <Badge className={`${getPriorityColor(rec.priority)} text-white`}>
                            {rec.priority}
                          </Badge>
                          {rec.quickWin && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                              Quick Win
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{rec.description}</p>
                      <div className="text-sm text-green-600 font-medium mb-2">
                        Expected impact: {rec.estimatedImpact}
                      </div>
                      {rec.implementationSteps.length > 0 && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                            Implementation Steps ({rec.implementationSteps.length})
                          </summary>
                          <ol className="mt-2 ml-4 space-y-1 list-decimal">
                            {rec.implementationSteps.map((step, index) => (
                              <li key={index} className="text-gray-600">{step}</li>
                            ))}
                          </ol>
                        </details>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Word Count</span>
                    <span className="font-bold">{data.content.wordCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Reading Time</span>
                    <span className="font-bold">{data.content.readingTime} min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Readability Score</span>
                    <span className={`font-bold ${getScoreColor(data.content.readabilityScore)}`}>
                      {data.content.readabilityScore}/100
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Keyword Density</span>
                    <span className="font-bold">{(data.content.keywordDensity * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.recommendations
                    .filter(rec => rec.category === 'content')
                    .slice(0, 5)
                    .map((rec) => (
                      <div key={rec.id} className="border-l-4 border-blue-500 pl-3">
                        <h5 className="font-medium text-sm">{rec.title}</h5>
                        <p className="text-xs text-gray-600">{rec.description}</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 