"use client";

import React from "react";
import { m } from 'framer-motion';
import { 
  RefreshCw,
  Settings,
  Download,
  Filter,
  Plus,
  BarChart3,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { EnhancedStatsOverview } from "@/components/dashboard/enhanced-stats-overview";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { PerformanceTrends } from "@/components/dashboard/performance-trends";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useToast } from "@/components/ui/use-toast";

export default function DashboardPage() {
  const {
    stats,
    recentProjects,
    priorityIssues,
    loading,
    error,
    cached,
    lastUpdated,
    refresh,
    invalidateCache,
    isStale
  } = useDashboardData({
    refreshInterval: 30000, // Refresh every 30 seconds
    enableRealtime: true
  });

  const { toast } = useToast();

  const handleRefresh = async () => {
    await refresh();
    toast({
      title: "Dashboard refreshed",
      description: "Latest data has been loaded successfully.",
    });
  };

  const handleInvalidateCache = async () => {
    await invalidateCache();
    toast({
      title: "Cache cleared",
      description: "Fresh data is being loaded from the analysis engine.",
    });
  };

  // Show error state
  if (error && !loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
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
      icon: <Download className="h-5 w-5" />,
      color: "destructive" as const,
    },
  ];

  // Transform score trends data for PerformanceTrends component
  const performanceTrendsData = stats.scoreTrends.map(trend => ({
    date: trend.date,
    score: trend.overallScore,
    technical: trend.technicalScore,
    content: trend.contentScore,
    onPage: trend.onPageScore,
    ux: trend.uxScore
  }));

  // Transform recent projects for RecentProjects component
  const transformedProjects = recentProjects.map(project => ({
    id: project.id,
    name: project.name,
    url: project.url,
    lastAnalyzed: project.lastScanDate.toISOString(),
    score: project.currentScore,
    createdAt: project.lastScanDate.toISOString(),
    updatedAt: project.lastScanDate.toISOString()
  }));

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      {/* Header Section */}
      <m.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            SEO Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive analysis engine insights and real-time monitoring
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Data freshness indicators */}
          {isStale && (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              Data may be stale
            </Badge>
          )}
          
          {cached && !isStale && (
            <Badge variant="secondary">
              Cached data
            </Badge>
          )}

          {/* Action buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleInvalidateCache}
            disabled={loading}
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </m.div>

      {/* Enhanced Stats Overview */}
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <EnhancedStatsOverview
          stats={stats}
          loading={loading}
          cached={cached}
          lastUpdated={lastUpdated}
        />
      </m.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Performance Trends */}
        <div className="lg:col-span-2 space-y-6">
          <m.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <PerformanceTrends 
              data={performanceTrendsData}
              isLoading={loading}
            />
          </m.div>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          <m.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <QuickActions actions={actions} />
          </m.div>
        </div>
      </div>

      {/* Recent Projects Section */}
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <RecentProjects
          projects={transformedProjects}
          isLoading={loading}
        />
      </m.div>

      {/* Priority Issues Section */}
      {priorityIssues.length > 0 && (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Priority Issues
              </h2>
              <Button variant="outline" size="sm">
                View All Issues
              </Button>
            </div>
            
            <div className="grid gap-4">
              {priorityIssues.slice(0, 5).map((issue) => (
                <div
                  key={issue.id}
                  className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={
                            issue.severity === 'critical' ? 'destructive' :
                            issue.severity === 'high' ? 'destructive' :
                            issue.severity === 'medium' ? 'secondary' : 'outline'
                          }
                        >
                          {issue.severity}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {issue.projectName}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900">
                        {issue.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {issue.affectedPages} pages affected • {issue.estimatedImpact} impact
                      </p>
                    </div>
                    
                    {issue.quickFix && (
                      <Button size="sm" variant="outline">
                        Quick Fix
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </m.div>
      )}

      {/* Performance Optimization Notice */}
      {loading && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-800">
                Loading latest analysis data...
              </span>
            </div>
          </div>
        </m.div>
      )}
    </div>
  );
}
