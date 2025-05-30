'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface AnalysisOverview {
  score: number;
  previousScore?: number;
  metrics: {
    technical: number;
    content: number;
    onpage: number;
    performance: number;
  };
  issues: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recommendations: {
    count: number;
    topRecommendations: string[];
  };
  pagesCrawled: number;
  completedAt: string;
  scanDuration: number; // in minutes
}

export default function AnalysisOverviewPage() {
  const params = useParams();
  const [overview, setOverview] = useState<AnalysisOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        // Mock data - replace with actual API call
        const mockOverview: AnalysisOverview = {
          score: 85,
          previousScore: 78,
          metrics: {
            technical: 90,
            content: 82,
            onpage: 88,
            performance: 80
          },
          issues: {
            critical: 3,
            high: 8,
            medium: 15,
            low: 24
          },
          recommendations: {
            count: 12,
            topRecommendations: [
              'Optimize images for better loading speed',
              'Add missing meta descriptions',
              'Fix broken internal links',
              'Improve page titles for better CTR'
            ]
          },
          pagesCrawled: 247,
          completedAt: '2024-01-15T10:15:00Z',
          scanDuration: 15
        };
        
        setTimeout(() => {
          setOverview(mockOverview);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching analysis overview:', error);
        setLoading(false);
      }
    };

    fetchOverview();
  }, [params.analysisId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load analysis overview</p>
      </div>
    );
  }

  const totalIssues = overview.issues.critical + overview.issues.high + overview.issues.medium + overview.issues.low;
  const scoreChange = overview.previousScore ? overview.score - overview.previousScore : 0;

  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            {scoreChange !== 0 && (
              <Badge variant={scoreChange > 0 ? 'default' : 'destructive'}>
                {scoreChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.score}</div>
            <p className="text-xs text-muted-foreground">
              {scoreChange !== 0 && `${scoreChange > 0 ? '+' : ''}${scoreChange} from last scan`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overview.issues.critical}</div>
            <p className="text-xs text-muted-foreground">
              {totalIssues} total issues found
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pages Crawled</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.pagesCrawled}</div>
            <p className="text-xs text-muted-foreground">
              Scan completed in {overview.scanDuration}m
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.recommendations.count}</div>
            <p className="text-xs text-muted-foreground">
              Actionable improvements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Scores */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Performance by SEO category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Technical SEO</span>
                <span className="text-sm font-bold">{overview.metrics.technical}%</span>
              </div>
              <Progress value={overview.metrics.technical} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">On-Page SEO</span>
                <span className="text-sm font-bold">{overview.metrics.onpage}%</span>
              </div>
              <Progress value={overview.metrics.onpage} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Content Quality</span>
                <span className="text-sm font-bold">{overview.metrics.content}%</span>
              </div>
              <Progress value={overview.metrics.content} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Performance</span>
                <span className="text-sm font-bold">{overview.metrics.performance}%</span>
              </div>
              <Progress value={overview.metrics.performance} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Issues Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Issues Overview</CardTitle>
            <CardDescription>Issues found by severity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-destructive rounded-full" />
                  <span className="font-medium">Critical</span>
                </div>
                <span className="font-bold">{overview.issues.critical}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-orange-100 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full" />
                  <span className="font-medium">High</span>
                </div>
                <span className="font-bold">{overview.issues.high}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-100 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span className="font-medium">Medium</span>
                </div>
                <span className="font-bold">{overview.issues.medium}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full" />
                  <span className="font-medium">Low</span>
                </div>
                <span className="font-bold">{overview.issues.low}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Link href={`/analyses/${params.analysisId}/issues`}>
                <Button variant="outline" className="w-full">
                  View All Issues
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Top Recommendations</CardTitle>
          <CardDescription>Priority actions to improve your SEO score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {overview.recommendations.topRecommendations.map((recommendation, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <span className="flex-1">{recommendation}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <Link href={`/analyses/${params.analysisId}/recommendations`}>
              <Button variant="outline" className="w-full">
                View All Recommendations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 