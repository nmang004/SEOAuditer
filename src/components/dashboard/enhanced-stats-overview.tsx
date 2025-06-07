"use client";

import React from "react";
import { m } from 'framer-motion';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Target,
  BarChart3,
  Users,
  Zap,
  Minus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useDashboardStats } from "@/hooks/useReactQueryDashboard";
import { Skeleton } from "@/components/ui/skeleton";

interface EnhancedStatsOverviewProps {
  loading?: boolean;
  cached?: boolean;
  lastUpdated?: Date | null;
}

interface StatCardProps {
  title: string;
  value: number | string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
  icon: React.ComponentType<{ className?: string }>;
  color: 'success' | 'warning' | 'danger' | 'info' | 'primary';
  loading?: boolean;
  onClick?: () => void;
  subtitle?: string;
  showProgress?: boolean;
  progressValue?: number;
}

const colorClasses = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-600',
    text: 'text-green-900',
    trend: 'text-green-600'
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-600',
    text: 'text-yellow-900',
    trend: 'text-yellow-600'
  },
  danger: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    text: 'text-red-900',
    trend: 'text-red-600'
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600', 
    text: 'text-blue-900',
    trend: 'text-blue-600'
  },
  primary: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: 'text-purple-600',
    text: 'text-purple-900', 
    trend: 'text-purple-600'
  }
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  trend,
  icon: Icon,
  color,
  loading,
  onClick,
  subtitle,
  showProgress,
  progressValue
}) => {
  const classes = colorClasses[color];
  
  if (loading) {
    return (
      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = trend?.direction === 'up' ? TrendingUp : 
                   trend?.direction === 'down' ? TrendingDown : Minus;

  return (
    <m.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card 
        className={`border-0 shadow-md hover:shadow-lg transition-all cursor-pointer ${classes.bg} ${classes.border}`}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${classes.icon}`} />
                <p className="text-sm font-medium text-gray-600">{title}</p>
              </div>
              
              <div className="space-y-1">
                <p className={`text-3xl font-bold ${classes.text}`}>
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </p>
                {subtitle && (
                  <p className="text-xs text-gray-500">{subtitle}</p>
                )}
              </div>

              {showProgress && progressValue !== undefined && (
                <div className="space-y-1">
                  <Progress value={progressValue} className="h-2" />
                  <p className="text-xs text-gray-500">{progressValue}% completion</p>
                </div>
              )}

              {trend && (
                <div className={`flex items-center gap-1 text-sm ${classes.trend}`}>
                  <TrendIcon className="h-4 w-4" />
                  <span>{trend.percentage}% {trend.period}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </m.div>
  );
};

export const EnhancedStatsOverview: React.FC<EnhancedStatsOverviewProps> = ({
  loading = false,
  cached = false,
  lastUpdated
}) => {
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch
  } = useDashboardStats();

  // Use the loading prop or the query loading state
  const isDataLoading = loading || isLoading;

  // Fallback to empty data if API is unavailable
  const fallbackData = {
    totalProjects: 0,
    activeAnalyses: 0,
    completedAnalyses: 0,
    averageScore: 0,
    scoreImprovement: 0,
    weeklyIssues: 0,
    resolvedIssues: 0,
    criticalIssues: 0,
    lastScanDate: new Date().toISOString(),
    scoreDistribution: { excellent: 0, good: 0, needsWork: 0, poor: 0 },
    scoreTrends: [],
    topProjects: [],
    concerningProjects: []
  };

  const statsData = dashboardData || fallbackData;
  
  // Ensure scoreDistribution exists and has required properties
  const safeScoreDistribution = {
    excellent: statsData.scoreDistribution?.excellent || 0,
    good: statsData.scoreDistribution?.good || 0,
    needsWork: statsData.scoreDistribution?.needsWork || 0,
    poor: statsData.scoreDistribution?.poor || 0
  };

  const getScoreColor = (score: number): 'success' | 'warning' | 'danger' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning'; 
    return 'danger';
  };

  const getTrendDirection = (value: number): 'up' | 'down' | 'stable' => {
    if (value > 0) return 'up';
    if (value < 0) return 'down';
    return 'stable';
  };

  return (
    <div className="space-y-6">
      {/* Header with cache status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-600">Real-time insights from your SEO analysis engine</p>
        </div>
        
        <div className="flex items-center gap-2">
          {cached && (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              Cached
            </Badge>
          )}
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Projects"
          value={statsData.totalProjects}
          icon={Target}
          color="primary"
          loading={isDataLoading}
          subtitle="Active projects being tracked"
        />
        
        <StatCard
          title="Active Analyses"
          value={statsData.activeAnalyses}
          icon={Activity}
          color="info"
          loading={isDataLoading}
          subtitle="Currently running scans"
        />
        
        <StatCard
          title="Average SEO Score"
          value={statsData.averageScore}
          trend={{
            direction: getTrendDirection(statsData.scoreImprovement),
            percentage: Math.abs(statsData.scoreImprovement),
            period: '30d'
          }}
          icon={BarChart3}
          color={getScoreColor(statsData.averageScore)}
          loading={isDataLoading}
          subtitle="Across all projects"
          showProgress
          progressValue={statsData.averageScore}
        />
        
        <StatCard
          title="Critical Issues"
          value={statsData.criticalIssues}
          icon={AlertTriangle}
          color={statsData.criticalIssues > 0 ? 'danger' : 'success'}
          loading={isDataLoading}
          subtitle="Requiring immediate attention"
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Weekly Issues Found"
          value={statsData.weeklyIssues}
          icon={Zap}
          color="warning"
          loading={isDataLoading}
          subtitle="New issues in last 7 days"
        />
        
        <StatCard
          title="Issues Resolved"
          value={statsData.resolvedIssues}
          icon={CheckCircle}
          color="success"
          loading={isDataLoading}
          subtitle="Fixed in last 7 days"
        />
        
        <StatCard
          title="Completed Analyses"
          value={statsData.completedAnalyses}
          icon={Users}
          color="info"
          loading={isDataLoading}
          subtitle="Total scans completed"
        />
      </div>

      {/* Score Distribution Overview */}
      <Card className="border-0 bg-gradient-to-br from-gray-50 to-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Score Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isDataLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="text-center space-y-2">
                  <Skeleton className="h-8 w-8 mx-auto" />
                  <Skeleton className="h-4 w-20 mx-auto" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-green-600">
                  {safeScoreDistribution.excellent}
                </div>
                <div className="text-sm text-gray-600">Excellent (80-100)</div>
                <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ 
                      width: `${statsData.totalProjects > 0 ? (safeScoreDistribution.excellent / statsData.totalProjects) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-yellow-600">
                  {safeScoreDistribution.good}
                </div>
                <div className="text-sm text-gray-600">Good (60-79)</div>
                <div className="h-2 bg-yellow-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500 transition-all duration-500"
                    style={{ 
                      width: `${statsData.totalProjects > 0 ? (safeScoreDistribution.good / statsData.totalProjects) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-orange-600">
                  {safeScoreDistribution.needsWork}
                </div>
                <div className="text-sm text-gray-600">Needs Work (40-59)</div>
                <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 transition-all duration-500"
                    style={{ 
                      width: `${statsData.totalProjects > 0 ? (safeScoreDistribution.needsWork / statsData.totalProjects) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-red-600">
                  {safeScoreDistribution.poor}
                </div>
                <div className="text-sm text-gray-600">Poor (0-39)</div>
                <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 transition-all duration-500"
                    style={{ 
                      width: `${statsData.totalProjects > 0 ? (safeScoreDistribution.poor / statsData.totalProjects) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 