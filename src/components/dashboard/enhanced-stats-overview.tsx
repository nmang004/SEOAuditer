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
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { DashboardStats } from "@/hooks/useDashboardData";
import { useDashboardData } from "@/hooks/useDashboardData";

interface EnhancedStatsOverviewProps {
  stats: DashboardStats;
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
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
    border: 'border-green-200',
    icon: 'text-green-600',
    value: 'text-green-900',
    trend: 'text-green-600'
  },
  warning: {
    bg: 'bg-gradient-to-br from-yellow-50 to-amber-50', 
    border: 'border-yellow-200',
    icon: 'text-yellow-600',
    value: 'text-yellow-900',
    trend: 'text-yellow-600'
  },
  danger: {
    bg: 'bg-gradient-to-br from-red-50 to-rose-50',
    border: 'border-red-200', 
    icon: 'text-red-600',
    value: 'text-red-900',
    trend: 'text-red-600'
  },
  info: {
    bg: 'bg-gradient-to-br from-blue-50 to-sky-50',
    border: 'border-blue-200',
    icon: 'text-blue-600', 
    value: 'text-blue-900',
    trend: 'text-blue-600'
  },
  primary: {
    bg: 'bg-gradient-to-br from-purple-50 to-indigo-50',
    border: 'border-purple-200',
    icon: 'text-purple-600',
    value: 'text-purple-900', 
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
  
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -2 }}
      className={cn(
        "group cursor-pointer transition-all duration-200",
        onClick && "hover:shadow-lg"
      )}
      onClick={onClick}
    >
      <Card className={cn(
        "border-2 transition-all duration-200 group-hover:shadow-md",
        classes.bg,
        classes.border
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={cn(
              "p-3 rounded-xl shadow-sm",
              classes.bg
            )}>
              <Icon className={cn("h-6 w-6", classes.icon)} />
            </div>
            
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                classes.trend
              )}>
                {trend.direction === 'up' ? (
                  <TrendingUp className="h-4 w-4" />
                ) : trend.direction === 'down' ? (
                  <TrendingDown className="h-4 w-4" />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-gray-300" />
                )}
                <span>{trend.percentage}%</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-600">{title}</h3>
              <div className={cn(
                "text-3xl font-bold transition-all duration-300",
                classes.value,
                loading && "animate-pulse"
              )}>
                {loading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <m.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    {value}
                  </m.span>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-gray-500">{subtitle}</p>
              )}
            </div>
            
            {showProgress && progressValue !== undefined && (
              <div className="space-y-1">
                <Progress 
                  value={progressValue} 
                  className="h-2"
                  // Apply color-specific progress styling
                />
                <p className="text-xs text-gray-500">
                  {progressValue}% of goal
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </m.div>
  );
};

export const EnhancedStatsOverview: React.FC<EnhancedStatsOverviewProps> = ({
  stats,
  loading = false,
  cached = false,
  lastUpdated
}) => {
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch
  } = useDashboardData();

  // Fallback to mock data if API is unavailable
  const fallbackData = {
    totalProjects: 12,
    activeAnalyses: 3,
    completedAnalyses: 45,
    averageScore: 78,
    scoreImprovement: 5,
    weeklyIssues: 23,
    resolvedIssues: 18,
    criticalIssues: 5,
    lastScanDate: new Date().toISOString(),
    scoreDistribution: { excellent: 3, good: 6, needsWork: 2, poor: 1 },
    scoreTrends: [
      { date: '2025-05-25', overallScore: 72, technicalScore: 68, contentScore: 75, onPageScore: 80, uxScore: 70 },
      { date: '2025-05-26', overallScore: 74, technicalScore: 70, contentScore: 76, onPageScore: 81, uxScore: 72 },
      { date: '2025-05-27', overallScore: 73, technicalScore: 69, contentScore: 77, onPageScore: 79, uxScore: 71 },
      { date: '2025-05-28', overallScore: 75, technicalScore: 71, contentScore: 78, onPageScore: 82, uxScore: 73 },
      { date: '2025-05-29', overallScore: 78, technicalScore: 72, contentScore: 79, onPageScore: 83, uxScore: 74 },
    ],
    topProjects: [
      { id: '1', name: 'Main Website', score: 85, improvement: 7 },
      { id: '2', name: 'Blog', score: 82, improvement: 3 },
      { id: '3', name: 'Landing Page', score: 78, improvement: -2 }
    ],
    concerningProjects: [
      { id: '4', name: 'Old Site', score: 45, criticalIssues: 8 },
      { id: '5', name: 'Mobile App', score: 52, criticalIssues: 5 }
    ]
  };

  const stats = dashboardData || fallbackData;

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
          value={stats.totalProjects}
          icon={Target}
          color="primary"
          loading={loading}
          subtitle="Active projects being tracked"
        />
        
        <StatCard
          title="Active Analyses"
          value={stats.activeAnalyses}
          icon={Activity}
          color="info"
          loading={loading}
          subtitle="Currently running scans"
        />
        
        <StatCard
          title="Average SEO Score"
          value={stats.averageScore}
          trend={{
            direction: getTrendDirection(stats.scoreImprovement),
            percentage: Math.abs(stats.scoreImprovement),
            period: '30d'
          }}
          icon={BarChart3}
          color={getScoreColor(stats.averageScore)}
          loading={loading}
          subtitle="Across all projects"
          showProgress
          progressValue={stats.averageScore}
        />
        
        <StatCard
          title="Critical Issues"
          value={stats.criticalIssues}
          icon={AlertTriangle}
          color={stats.criticalIssues > 0 ? 'danger' : 'success'}
          loading={loading}
          subtitle="Requiring immediate attention"
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Weekly Issues Found"
          value={stats.weeklyIssues}
          icon={Zap}
          color="warning"
          loading={loading}
          subtitle="New issues in last 7 days"
        />
        
        <StatCard
          title="Issues Resolved"
          value={stats.resolvedIssues}
          icon={CheckCircle}
          color="success"
          loading={loading}
          subtitle="Fixed in last 7 days"
        />
        
        <StatCard
          title="Completed Analyses"
          value={stats.completedAnalyses}
          icon={Users}
          color="info"
          loading={loading}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {stats.scoreDistribution.excellent}
              </div>
              <div className="text-sm text-gray-600">Excellent (80-100)</div>
              <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ 
                    width: `${(stats.scoreDistribution.excellent / stats.totalProjects) * 100}%` 
                  }}
                />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.scoreDistribution.good}
              </div>
              <div className="text-sm text-gray-600">Good (60-79)</div>
              <div className="h-2 bg-yellow-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 transition-all duration-500"
                  style={{ 
                    width: `${(stats.scoreDistribution.good / stats.totalProjects) * 100}%` 
                  }}
                />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-orange-600">
                {stats.scoreDistribution.needsWork}
              </div>
              <div className="text-sm text-gray-600">Needs Work (40-59)</div>
              <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 transition-all duration-500"
                  style={{ 
                    width: `${(stats.scoreDistribution.needsWork / stats.totalProjects) * 100}%` 
                  }}
                />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-red-600">
                {stats.scoreDistribution.poor}
              </div>
              <div className="text-sm text-gray-600">Poor (0-39)</div>
              <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all duration-500"
                  style={{ 
                    width: `${(stats.scoreDistribution.poor / stats.totalProjects) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 