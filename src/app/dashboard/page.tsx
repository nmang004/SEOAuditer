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
import { m } from 'framer-motion';
import { HeaderStats } from "@/components/dashboard/header-stats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEOScoreCard } from "@/components/dashboard/seo-score-card";
import { MetricsOverview } from "@/components/dashboard/metrics-overview";
import { RecentAnalyses } from "@/components/dashboard/recent-analyses";
import { QuickActions } from "@/components/dashboard/quick-actions";

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

  // Prepare metrics for MetricsOverview
  const metrics = [
    {
      label: "Total Projects",
      value: stats.totalProjects,
      trend: "up" as const,
      change: 2,
      description: "+2 from last month",
    },
    {
      label: "Active Analyses",
      value: stats.activeAnalyses,
      trend: "up" as const,
      change: 1,
      description: "+1 from yesterday",
    },
    {
      label: "Avg. SEO Score",
      value: stats.averageScore,
      trend: "up" as const,
      change: 5,
      description: "vs last week",
    },
    {
      label: "Weekly Issues",
      value: stats.weeklyIssues,
      trend: "down" as const,
      change: 2,
      description: "vs last week",
    },
  ];

  // Prepare analyses for RecentAnalyses
  const analyses = recentProjects.map((project, i) => ({
    id: project.id,
    projectName: project.name,
    url: project.url,
    date: project.lastAnalyzed,
    score: project.score,
    status: "completed" as const,
    issues: {
      critical: Math.floor(Math.random() * 3),
      warning: Math.floor(Math.random() * 5),
      info: Math.floor(Math.random() * 2),
    },
  }));

  // Prepare quick actions
  const actions = [
    {
      title: "New Project",
      description: "Add a new website to track and analyze.",
      href: "/dashboard/projects/new",
      icon: <Plus className="h-5 w-5" />,
      color: "primary" as const,
    },
    {
      title: "Run Analysis",
      description: "Start a new SEO analysis for your site.",
      href: "/dashboard/analyses/new",
      icon: <BarChart3 className="h-5 w-5" />,
      color: "success" as const,
    },
    {
      title: "View Reports",
      description: "See detailed SEO reports and trends.",
      href: "/dashboard/analyses",
      icon: <CheckCircle className="h-5 w-5" />,
      color: "warning" as const,
    },
    {
      title: "Export Data",
      description: "Download your SEO data and reports.",
      href: "/dashboard/export",
      icon: <ArrowUpRight className="h-5 w-5" />,
      color: "destructive" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <MetricsOverview metrics={metrics} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <SEOScoreCard
          score={seoScore.current}
          label="SEO Score"
          description="Your current overall SEO score."
          trend={seoScore.current - seoScore.previous}
          category={undefined}
        />
        <QuickActions actions={actions} />
      </div>
      <RecentAnalyses analyses={analyses} />
    </div>
  );
}
