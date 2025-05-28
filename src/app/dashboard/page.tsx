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
  ChevronRight,
  Folder
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
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  // Generate performance data for the last 7 days
  const performanceData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekAgo);
    date.setDate(weekAgo.getDate() + i);
    return {
      date: date.toISOString().split('T')[0],
      score: randomInt(60, 95),
      technical: randomInt(60, 95),
      content: randomInt(60, 95),
      onPage: randomInt(60, 95),
      ux: randomInt(60, 95),
    };
  });

  // Generate recent projects
  const recentProjects = Array.from({ length: 5 }, (_, i) => ({
    id: `project-${i}`,
    name: `Project ${i + 1}`,
    url: `example${i + 1}.com`,
    lastAnalyzed: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    score: randomInt(50, 100),
    issueCount: randomInt(0, 15),
    trend: ['up', 'down', 'neutral'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'neutral',
    trendPercentage: randomInt(1, 20),
  }));

  // Generate recent issues
  const recentIssues = Array.from({ length: 5 }, (_, i) => ({
    id: `issue-${i}`,
    title: `Issue ${i + 1}: ${['Broken Link', 'Missing Alt Text', 'Slow Page Load', 'Duplicate Content', 'Mobile Usability'][i % 5]}`,
    description: `This is a description for issue ${i + 1}`,
    severity: ['critical', 'high', 'medium', 'low'][i % 4] as 'critical' | 'high' | 'medium' | 'low',
    status: getRandomStatus(),
    detectedDate: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    type: ['Technical', 'Content', 'On-page', 'UX'][i % 4],
    affectedPages: randomInt(1, 10),
    estimatedImpact: ['High', 'Medium', 'Low'][i % 3],
    fixComplexity: ['easy', 'medium', 'hard'][i % 3] as 'easy' | 'medium' | 'hard',
    category: ['technical', 'content', 'onpage', 'ux'][i % 4] as 'technical' | 'content' | 'onpage' | 'ux',
  }));

  return {
    stats: {
      totalProjects: randomInt(5, 20),
      activeAnalyses: randomInt(1, 5),
      averageScore: randomInt(60, 90),
      weeklyIssues: randomInt(5, 30),
    },
    seoScore: {
      current: randomInt(60, 95),
      previous: randomInt(55, 90),
      categories: {
        technical: randomInt(60, 95),
        content: randomInt(60, 95),
        onPage: randomInt(60, 95),
        userExperience: randomInt(60, 95),
      },
      previousCategories: {
        technical: randomInt(55, 90),
        content: randomInt(55, 90),
        onPage: randomInt(55, 90),
        userExperience: randomInt(55, 90),
      },
    },
    recentProjects,
    recentIssues,
    performanceData,
  };
};

// Default data to prevent undefined errors
const defaultData: DashboardData = {
  stats: {
    totalProjects: 0,
    activeAnalyses: 0,
    averageScore: 0,
    weeklyIssues: 0,
  },
  seoScore: {
    current: 0,
    previous: 0,
    categories: {
      technical: 0,
      content: 0,
      onPage: 0,
      userExperience: 0,
    },
    previousCategories: {
      technical: 0,
      content: 0,
      onPage: 0,
      userExperience: 0,
    },
  },
  recentProjects: [],
  recentIssues: [],
  performanceData: [],
};

// Helper component for trend indicators
function TrendIndicator({ value, className = "" }: { value: number; className?: string }) {
  if (value === 0) return null;
  
  const isPositive = value > 0;
  const Icon = isPositive ? TrendingUp : TrendingUp; // Using same icon for both for now
  
  return (
    <span className={`inline-flex items-center text-sm font-medium ${
      isPositive ? 'text-green-600' : 'text-red-600'
    } ${className}`}>
      <Icon className="h-4 w-4 mr-1" />
      {Math.abs(value)}%
    </span>
  );
}

// Helper component for severity badges
function SeverityBadge({ severity }: { severity: 'critical' | 'high' | 'medium' | 'low' }) {
  const severityClasses = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityClasses[severity]}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

// Main Dashboard Component
export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // In a real app, this would be an API call
        // const response = await fetch('/api/dashboard');
        // const data = await response.json();
        
        // For now, use mock data
        const data = generateMockDashboardData();
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            variant="outline"
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const { stats, seoScore, recentProjects, recentIssues } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header with title and actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your SEO performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-9 w-full md:w-64"
              placeholder="Search..."
              type="search"
            />
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Analyses</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAnalyses}</div>
            <p className="text-xs text-muted-foreground">
              +1 from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. SEO Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore}</div>
            <div className="flex items-center">
              <TrendIndicator value={5} className="mr-2" />
              <span className="text-xs text-muted-foreground">
                vs last week
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weeklyIssues}</div>
            <div className="flex items-center">
              <TrendIndicator value={-2} className="mr-2" />
              <span className="text-xs text-muted-foreground">
                vs last week
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* SEO Score Overview */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>SEO Score Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-5xl font-bold text-primary">
                  {seoScore.current}
                </div>
                <div className="flex items-center justify-center mt-2">
                  <TrendIndicator value={Math.round(((seoScore.current - seoScore.previous) / seoScore.previous) * 100)} />
                  <span className="ml-2 text-sm text-muted-foreground">
                    vs previous {seoScore.previous}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              {Object.entries(seoScore.categories).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{key}</span>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Issues */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentIssues.slice(0, 5).map((issue) => (
                <div key={issue.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <SeverityBadge severity={issue.severity} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{issue.title}</p>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <span>{issue.type}</span>
                      <span className="mx-1">•</span>
                      <span>{issue.affectedPages} pages affected</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t">
            <Button variant="ghost" className="w-full">
              View all issues
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentProjects.map((project) => (
              <div key={project.id} className="flex items-center p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium">{project.name}</h3>
                    <span className="text-sm text-muted-foreground">{project.url}</span>
                  </div>
                  <div className="flex items-center mt-1 text-sm text-muted-foreground">
                    <span>Last analyzed: {new Date(project.lastAnalyzed).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{project.score}</div>
                    <div className="text-xs text-muted-foreground">Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{project.issueCount}</div>
                    <div className="text-xs text-muted-foreground">Issues</div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="border-t">
          <Button variant="ghost" className="w-full">
            View all projects
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}