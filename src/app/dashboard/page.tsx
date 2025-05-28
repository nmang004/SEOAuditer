"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Plus, 
  AlertTriangle, 
  BarChart3, 
  Zap, 
  TrendingUp, 
  CheckCircle,
  ArrowUpRight,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { HeaderStats } from "@/components/dashboard/header-stats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Types
type DashboardData = {
  stats: {
    totalProjects: number;
    activeAnalyses: number;
    averageScore: number;
    weeklyIssues: number;
  };
  seoScore: {
    current: number;
    previous: number;
    categories: {
      technical: number;
      content: number;
      onPage: number;
      userExperience: number;
    };
    previousCategories: {
      technical: number;
      content: number;
      onPage: number;
      userExperience: number;
    };
  };
  recentProjects: Array<{
    id: string;
    name: string;
    url: string;
    lastAnalyzed: string;
    score: number;
    issueCount: number;
    trend: 'up' | 'down' | 'neutral';
    trendPercentage: number;
  }>;
  recentIssues: Array<{
    id: string;
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: 'open' | 'in-progress' | 'resolved';
    detectedDate: string;
    type: string;
    affectedPages: number;
    estimatedImpact: string;
    fixComplexity: 'easy' | 'medium' | 'hard';
    category: 'technical' | 'content' | 'onpage' | 'ux';
  }>;
  performanceData: Array<{
    date: string;
    score: number;
    technical: number;
    content: number;
    onPage: number;
    ux: number;
  }>;
};

// Helper function for random number generation
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to get a random status
function getRandomStatus(): 'open' | 'in-progress' | 'resolved' {
  const statuses: Array<'open' | 'in-progress' | 'resolved'> = ['open', 'in-progress', 'resolved'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

// Generate mock data for the dashboard
const generateMockDashboardData = (): DashboardData => {
  // Mock fetch function
  const fetchData = async (): Promise<DashboardData> => {
    // Simulate API call
    return new Promise<DashboardData>((resolve) => {
      setTimeout(() => {
        resolve({
          stats: {
            totalProjects: 12,
            activeAnalyses: 3,
            averageScore: 78,
            weeklyIssues: 15
          },
          seoScore: {
            current: 82,
            previous: 78,
            categories: {
              technical: 85,
              content: 80,
              onPage: 75,
              userExperience: 88
            },
            previousCategories: {
              technical: 82,
              content: 78,
              onPage: 72,
              userExperience: 85
            }
          },
          recentProjects: [],
          recentIssues: [],
          performanceData: []
        });
      }, 500);
    });
  };
  // Generate mock category scores
  const categoryScores = {
    technical: randomInt(60, 95),
    content: randomInt(60, 95),
    onPage: randomInt(60, 95),
    userExperience: randomInt(60, 95)
  };
  
  // Calculate previous scores (slightly lower for demonstration)
  const previousScores = {
    technical: Math.max(0, (categoryScores.technical || 0) - 8),
    content: Math.max(0, (categoryScores.content || 0) - 5),
    onPage: Math.max(0, (categoryScores.onPage || 0) - 3),
    userExperience: Math.max(0, (categoryScores.userExperience || 0) - 7)
  };
  
  // Calculate overall scores
  const overallScore = Math.round(
    (categoryScores.technical + 
     categoryScores.content + 
     categoryScores.onPage + 
     categoryScores.userExperience) / 4
  );
  
  const previousOverallScore = Math.round(
    (previousScores.technical + 
     previousScores.content + 
     previousScores.onPage + 
     previousScores.userExperience) / 4
  );
  
  // Generate projects and issues
  const mockProjects = generateMockProjects(5);
  const enhancedIssues = generateEnhancedIssues(5);
  const performanceData = generatePerformanceTrends(30);
  
  // Transform enhanced issues to match the expected type
  const transformedIssues = enhancedIssues.map(issue => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    severity: issue.severity,
    status: getRandomStatus(),
    detectedDate: new Date().toISOString(),
    type: issue.type,
    affectedPages: issue.affectedPages,
    estimatedImpact: issue.estimatedImpact, // Changed from issue.impact to issue.estimatedImpact
    fixComplexity: issue.fixComplexity,
    category: issue.category
  }));
  
  // Transform performance data to match the expected structure
  const transformedPerformanceData = Array.isArray(performanceData?.labels) 
    ? performanceData.labels.map((date, index) => ({
        date: date || new Date().toISOString(),
        score: Math.round(performanceData.datasets?.[0]?.data?.[index] || 0),
        technical: Math.round((performanceData.datasets?.[0]?.data?.[index] || 0) * 0.9 + randomInt(-5, 5)),
        content: Math.round((performanceData.datasets?.[0]?.data?.[index] || 0) * 0.95 + randomInt(-5, 5)),
        onPage: Math.round((performanceData.datasets?.[0]?.data?.[index] || 0) * 0.85 + randomInt(-5, 5)),
        ux: Math.round((performanceData.datasets?.[0]?.data?.[index] || 0) * 0.92 + randomInt(-5, 5))
      }))
    : []; // Return empty array if performanceData doesn't have the expected structure
  
  return {
    stats: {
      totalProjects: mockProjects.length,
      activeAnalyses: 2, // Fixed number for demo
      averageScore: overallScore,
      weeklyIssues: enhancedIssues.length
    },
    seoScore: {
      current: overallScore,
      previous: previousOverallScore,
      categories: categoryScores,
      previousCategories: previousScores
    },
    recentProjects: mockProjects.map(project => ({
      ...project,
      lastAnalyzed: project.lastAnalyzed || new Date().toISOString(),
      score: project.score || 0,
      issueCount: randomInt(0, 15),
      trend: ['up', 'down', 'neutral'][randomInt(0, 2)] as 'up' | 'down' | 'neutral',
      trendPercentage: randomInt(1, 20),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt || new Date().toISOString()
    })),
    recentIssues: transformedIssues,
    performanceData: transformedPerformanceData
  };
};

// Default data to prevent undefined errors
const defaultData: DashboardData = {
  stats: {
    totalProjects: 0,
    activeAnalyses: 0,
    averageScore: 0,
    weeklyIssues: 0
  },
  seoScore: {
    current: 0,
    previous: 0,
    categories: {
      technical: 0,
      content: 0,
      onPage: 0,
      userExperience: 0
    },
    previousCategories: {
      technical: 0,
      content: 0,
      onPage: 0,
      userExperience: 0
    }
  },
  recentProjects: [],
  recentIssues: [],
  performanceData: []
};

// Helper component for trend indicators
const TrendIndicator = ({ value, className = "" }: { value: number; className?: string }) => {
  if (value === 0) return null;
  const isPositive = value > 0;
  const Icon = isPositive ? TrendingUp : TrendingUp; // Using same icon for both for now
  
  return (
    <span className={`inline-flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'} ${className}`}>
      <Icon className="w-4 h-4 mr-1" />
      {Math.abs(value)}%
    </span>
  );
};

const DashboardPage = () => {
  const [data, setData] = React.useState<DashboardData>(defaultData);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  // Fetch data on component mount
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const mockData = generateMockDashboardData();
        setData(mockData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load data'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter projects based on search query
  const filteredProjects = React.useMemo(() => {
    if (!searchQuery) return data.recentProjects || [];
    return (data.recentProjects || []).filter(project =>
      project?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project?.url?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data.recentProjects, searchQuery]);
  
  // Get performance data with fallback
  const performanceData = data.performanceData || [];
  const recentProjects = data.recentProjects || [];
  const seoScore = data.seoScore || { current: 0, previous: 0, categories: { technical: 0, content: 0, onPage: 0, userExperience: 0 } };

  if (isLoading) return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <div className="text-center text-destructive">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
        <h3 className="text-lg font-medium">Failed to load dashboard</h3>
        <p className="text-muted-foreground mt-2">{error.message}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your SEO performance
          </p>
        </div>
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects, pages, or issues..."
            className="pl-10 w-full md:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
              New Project
            </Button>
            <div className="space-y-2">
              <button className="flex w-full items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground">
                <Zap className="h-4 w-4" />
                Run New Analysis
              </button>
              <button className="flex w-full items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground">
                <CheckCircle className="h-4 w-4" />
                View All Issues
              </button>
              <button className="flex w-full items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground">
                <BarChart3 className="h-4 w-4" />
                Generate Report
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Projects & Issues */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Recent Projects */}
          <div className="lg:col-span-1">
            <RecentProjects 
              projects={recentProjects} 
              isLoading={isLoading} 
            />
          </div>
          
          {/* SEO Score Overview */}
          <div className="lg:col-span-2">
            <SEOScoreOverview 
              score={seoScore.current} 
              previousScore={seoScore.previous}
              categories={seoScore.categories}
              previousCategories={seoScore.previousCategories}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Performance Trends */}
        <div className="mt-6">
          <PerformanceTrends 
            data={performanceData} 
            isLoading={isLoading} 
          />
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;
