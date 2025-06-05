"use client";

import React, { useEffect, useState } from "react";
import { m } from 'framer-motion';
import { 
  RefreshCw,
  Settings,
  Download,
  Filter,
  Plus,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Clock,
  Target,
  BarChart,
  Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedStatsOverview } from "@/components/dashboard/enhanced-stats-overview";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { PerformanceTrends } from "@/components/dashboard/performance-trends";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { IssueTrendsChart } from "@/components/charts/issue-trends-chart";
import { 
  useDashboardStats, 
  useRecentProjects, 
  usePriorityIssues,
  usePerformanceTrends,
  useIssueTrends,
  useCacheInvalidation
} from "@/hooks/useReactQueryDashboard";
import { useToast } from "@/components/ui/use-toast";
import { useQueryCache } from "@/providers/QueryProvider";
import { EmptyState } from "@/components/empty-states/empty-state";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryCache = useQueryCache();
  const router = useRouter();

  // Use React Query hooks for data management
  const {
    data: dashboardStats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
    dataUpdatedAt: statsLastUpdated
  } = useDashboardStats();

  const {
    data: recentProjects,
    isLoading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects,
    dataUpdatedAt: projectsLastUpdated
  } = useRecentProjects(5);

  const {
    data: priorityIssues,
    isLoading: issuesLoading,
    error: issuesError,
    refetch: refetchIssues,
    dataUpdatedAt: issuesLastUpdated
  } = usePriorityIssues(10);

  const {
    data: performanceTrendsData,
    isLoading: trendsLoading,
    error: trendsError,
    refetch: refetchTrends
  } = usePerformanceTrends(30);

  const {
    data: issueTrendsData,
    isLoading: issueTrendsLoading,
    refetch: refetchIssueTrends
  } = useIssueTrends(30);

  const cacheInvalidation = useCacheInvalidation();

  // Combine loading states
  const loading = statsLoading || projectsLoading || issuesLoading;
  const error = statsError || projectsError || issuesError || trendsError;
  const lastUpdated = [statsLastUpdated, projectsLastUpdated, issuesLastUpdated]
    .filter(Boolean)
    .sort((a, b) => (b || 0) - (a || 0))[0];

  const lastUpdatedDate = lastUpdated ? new Date(lastUpdated) : null;

  // Check if dashboard is empty (no projects) - account for admin bypass
  // Force empty state for admin users since we're using bypass
  const isDashboardEmpty = true;

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if the tab is visible to conserve resources
      if (!document.hidden) {
        refetchStats();
        refetchProjects();
        refetchIssues();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [refetchStats, refetchProjects, refetchIssues]);

  // Prefetch data on mount for better performance
  useEffect(() => {
    queryCache.prefetchDashboardData();
  }, [queryCache]);

  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetchStats(),
        refetchProjects(),
        refetchIssues(),
        refetchTrends(),
        refetchIssueTrends()
      ]);
      toast({
        title: "Dashboard refreshed",
        description: "Latest data has been loaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Some data could not be updated. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInvalidateCache = async () => {
    try {
      await cacheInvalidation.mutateAsync();
      toast({
        title: "Cache cleared",
        description: "All cached data has been invalidated and will be refetched.",
      });
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  // Export dashboard data
  const handleExportDashboard = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      stats: dashboardStats,
      recentProjects: recentProjects,
      priorityIssues: priorityIssues,
      performanceTrends: performanceTrendsData,
      issueTrends: issueTrendsData,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export completed",
      description: "Dashboard data has been exported successfully.",
    });
  };

  // Show error state
  if (error && !loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error.message || 'Failed to load dashboard data'}</span>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Prepare quick actions
  const actions = [
    {
      title: "New Project",
      description: "Add a new website to track and analyze.",
      href: "/dashboard/projects",
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
      href: "#",
      onClick: handleExportDashboard,
      icon: <Download className="h-5 w-5" />,
      color: "destructive" as const,
    },
  ];

  // Transform recent projects for RecentProjects component
  const transformedRecentProjects = recentProjects?.map(project => ({
    id: project.id,
    name: project.name,
    url: project.url,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    lastAnalyzed: (project.lastScanDate || project.updatedAt).toString(),
    score: project.currentScore
  })) || [];

  // Cache statistics for development
  const cacheStats = queryCache.getCacheStats();

  return (
    <div className="relative">
      {/* Dashboard content */}
      <div className="space-y-8">
        {/* Header Section */}
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              SEO Dashboard
            </h1>
            <p className="text-gray-300 mt-2 text-lg">
              Comprehensive analysis engine insights and real-time monitoring
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0"
              size="sm"
              onClick={() => router.push('/dashboard/projects')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </div>
      </m.div>

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 -mt-4">
          <TabsList className="flex w-full justify-start gap-1 h-12 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-1">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 flex-1 max-w-[160px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-300 hover:text-white rounded-xl transition-all"
            >
              <Target className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="performance" 
              className="flex items-center gap-2 flex-1 max-w-[160px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-300 hover:text-white rounded-xl transition-all"
            >
              <TrendingUp className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger 
              value="issues" 
              className="flex items-center gap-2 flex-1 max-w-[160px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-300 hover:text-white rounded-xl transition-all"
            >
              <AlertTriangle className="h-4 w-4" />
              Issues
            </TabsTrigger>
            <TabsTrigger 
              value="projects" 
              className="flex items-center gap-2 flex-1 max-w-[160px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-300 hover:text-white rounded-xl transition-all"
            >
              <Users className="h-4 w-4" />
              Projects
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {isDashboardEmpty ? (
              <div className="flex items-center justify-center min-h-[600px] py-16">
                <div className="relative w-full max-w-3xl">
                  {/* Animated background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl blur-xl -z-10 animate-pulse"></div>
                  
                  <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-12 text-center">
                    {/* Icon */}
                    <div className="mb-6 flex justify-center">
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm border border-indigo-500/30">
                        <BarChart className="h-10 w-10 text-indigo-400" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                      Welcome to Your SEO Dashboard
                    </h3>
                    <p className="text-gray-300 mb-8 text-lg leading-relaxed max-w-2xl mx-auto">
                      Start by adding your first project to begin tracking SEO performance, identifying issues, and optimizing your website's search visibility.
                    </p>
                    
                    {/* Primary Action */}
                    <Button 
                      onClick={() => router.push('/dashboard/projects')}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 h-12 text-base px-8 mb-8"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Project
                    </Button>
                    
                    {/* Secondary Actions */}
                    <div className="space-y-6">
                      <p className="text-gray-400">Or explore these features:</p>
                      <div className="flex gap-4 justify-center">
                        <Button
                          className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent"
                          size="sm"
                          onClick={() => router.push('/features')}
                        >
                          <Rocket className="h-4 w-4 mr-2" />
                          View Features
                        </Button>
                        <Button
                          className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent"
                          size="sm"
                          onClick={() => router.push('/how-it-works')}
                        >
                          <Target className="h-4 w-4 mr-2" />
                          How It Works
                        </Button>
                      </div>
                      
                      {/* Quick stats preview */}
                      <div className="mt-8 grid grid-cols-3 gap-6 max-w-lg mx-auto">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-indigo-400">10+</div>
                          <div className="text-xs text-gray-500">SEO Metrics</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-400">24/7</div>
                          <div className="text-xs text-gray-500">Monitoring</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-pink-400">99%</div>
                          <div className="text-xs text-gray-500">Accuracy</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          ) : (
            <>
              {/* Enhanced Stats Overview */}
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <EnhancedStatsOverview 
                  loading={statsLoading}
                  lastUpdated={lastUpdatedDate}
                />
              </m.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Chart */}
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <PerformanceChart
                    days={7}
                    height={300}
                    onDataPointClick={(data) => {
                      toast({
                        title: "Performance data",
                        description: `Overall score: ${data.overallScore} on ${data.date}`,
                      });
                    }}
                  />
                </m.div>

                {/* Issue Trends Chart */}
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <IssueTrendsChart
                    days={7}
                    height={300}
                  />
                </m.div>
              </div>

              {/* Quick Actions */}
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <QuickActions actions={actions} />
              </m.div>
            </>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {isDashboardEmpty ? (
            <div className="flex items-center justify-center min-h-[600px] py-16">
              <div className="relative w-full max-w-3xl">
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl blur-xl -z-10 animate-pulse"></div>
                
                <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-12 text-center">
                  {/* Icon */}
                  <div className="mb-6 flex justify-center">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm border border-indigo-500/30">
                      <TrendingUp className="h-10 w-10 text-indigo-400" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    No Performance Data Yet
                  </h3>
                  <p className="text-gray-300 mb-8 text-lg leading-relaxed max-w-2xl mx-auto">
                    Add your first project and run an SEO analysis to see detailed performance metrics, Core Web Vitals, and trend analytics.
                  </p>
                  
                  {/* Primary Action */}
                  <Button 
                    onClick={() => router.push('/dashboard/projects')}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 h-12 text-base px-8 mb-8"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Project
                  </Button>
                  
                  {/* Secondary Actions */}
                  <div className="space-y-6">
                    <p className="text-gray-400">Performance metrics you'll track:</p>
                    
                    {/* Performance metrics preview */}
                    <div className="mt-8 grid grid-cols-3 gap-6 max-w-lg mx-auto">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">95+</div>
                        <div className="text-xs text-gray-500">Performance Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">LCP</div>
                        <div className="text-xs text-gray-500">Core Web Vitals</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">30d</div>
                        <div className="text-xs text-gray-500">Trend Analysis</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              <PerformanceChart
                days={30}
                height={400}
                showControls={true}
              />
              
              <PerformanceTrends 
                data={performanceTrendsData?.data?.map(item => ({
                  date: item.date,
                  score: item.overallScore,
                  technical: item.technicalScore,
                  content: item.contentScore,
                  onPage: item.onPageScore,
                  ux: item.uxScore
                })) || []}
                isLoading={trendsLoading}
              />
            </div>
          )}
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="space-y-6">
          {isDashboardEmpty ? (
            <div className="flex items-center justify-center min-h-[600px] py-16">
              <div className="relative w-full max-w-3xl">
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl blur-xl -z-10 animate-pulse"></div>
                
                <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-12 text-center">
                  {/* Icon */}
                  <div className="mb-6 flex justify-center">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm border border-indigo-500/30">
                      <AlertTriangle className="h-10 w-10 text-indigo-400" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    No SEO Issues Detected
                  </h3>
                  <p className="text-gray-300 mb-8 text-lg leading-relaxed max-w-2xl mx-auto">
                    Add your first project and run a comprehensive SEO audit to identify technical issues, content problems, and optimization opportunities.
                  </p>
                  
                  {/* Primary Action */}
                  <Button 
                    onClick={() => router.push('/dashboard/projects')}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 h-12 text-base px-8 mb-8"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Start Your First Audit
                  </Button>
                  
                  {/* Secondary Actions */}
                  <div className="space-y-6">
                    <p className="text-gray-400">Issues we'll help you identify:</p>
                    
                    {/* Issue types preview */}
                    <div className="mt-8 grid grid-cols-3 gap-6 max-w-lg mx-auto">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">Critical</div>
                        <div className="text-xs text-gray-500">Technical Issues</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-amber-400">Medium</div>
                        <div className="text-xs text-gray-500">Content Issues</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">Low</div>
                        <div className="text-xs text-gray-500">Optimization Tips</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              <IssueTrendsChart
                days={30}
                height={400}
                showControls={true}
              />

              {/* Priority Issues */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Priority Issues
                  </CardTitle>
                  <CardDescription>
                    Critical issues that need immediate attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {issuesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : priorityIssues?.length ? (
                    <div className="space-y-4">
                      {priorityIssues.slice(0, 5).map((issue) => (
                        <div key={issue.id} className="border-l-4 border-red-500 pl-4 py-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{issue.title}</h4>
                            <Badge variant={issue.severity === 'critical' ? 'destructive' : 'secondary'}>
                              {issue.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{issue.title}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Project: {issue.projectName}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>No priority issues found</p>
                      <p className="text-sm">All critical issues have been resolved</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          {isDashboardEmpty ? (
            <div className="flex items-center justify-center min-h-[600px] py-16">
              <div className="relative w-full max-w-3xl">
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl blur-xl -z-10 animate-pulse"></div>
                
                <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-12 text-center">
                  {/* Icon */}
                  <div className="mb-6 flex justify-center">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm border border-indigo-500/30">
                      <Users className="h-10 w-10 text-indigo-400" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    No Projects Created Yet
                  </h3>
                  <p className="text-gray-300 mb-8 text-lg leading-relaxed max-w-2xl mx-auto">
                    Create your first project to start monitoring your website's SEO performance, track rankings, and get actionable insights.
                  </p>
                  
                  {/* Primary Action */}
                  <Button 
                    onClick={() => router.push('/dashboard/projects')}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 h-12 text-base px-8 mb-8"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Project
                  </Button>
                  
                  {/* Secondary Actions */}
                  <div className="space-y-6">
                    <p className="text-gray-400">What you can track per project:</p>
                    
                    {/* Project features preview */}
                    <div className="mt-8 grid grid-cols-3 gap-6 max-w-lg mx-auto">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-400">∞</div>
                        <div className="text-xs text-gray-500">Pages Analyzed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">24/7</div>
                        <div className="text-xs text-gray-500">Monitoring</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-pink-400">Auto</div>
                        <div className="text-xs text-gray-500">Reports</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <RecentProjects 
              projects={transformedRecentProjects}
              isLoading={projectsLoading}
            />
          )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
