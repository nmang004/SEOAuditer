"use client";

import React from 'react';
import { m, AnimatePresence  } from 'framer-motion';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowRight, 
  Plus, 
  Zap, 
  Search, 
  LineChart, 
  AlertTriangle, 
  Info,
  BarChart2,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { fadeInUp } from '@/lib/animations';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    label?: string;
    previousValue?: number | string;
    changeType?: 'percentage' | 'absolute';
  };
  progress?: {
    value: number;
    max?: number;
    label?: string;
  };
  action?: {
    label: string;
    onClick: () => void;
    icon: React.ReactNode;
    variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  };
  isLoading?: boolean;
  className?: string;
}

const LoadingSkeleton = () => (
  <Card className="h-full border-border/40 bg-card/50 overflow-hidden">
    <CardHeader className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-16" />
    </CardHeader>
    <CardContent className="space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-2 w-3/4" />
    </CardContent>
    <CardFooter>
      <Skeleton className="h-8 w-full" />
    </CardFooter>
  </Card>
);

const TrendIndicator = ({ value, className = '' }: { value: number; className?: string }) => {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  
  return (
    <span className={cn(
      "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full",
      isNeutral 
        ? "bg-muted text-muted-foreground" 
        : isPositive 
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      className
    )}>
      {isNeutral ? (
        <ArrowRight className="h-3 w-3 mr-1" />
      ) : isPositive ? (
        <ArrowUp className="h-3 w-3 mr-0.5" />
      ) : (
        <ArrowDown className="h-3 w-3 mr-0.5" />
      )}
      {Math.abs(value)}%
    </span>
  );
};

const ProgressBar = ({ 
  value, 
  max = 100, 
  className = '',
  showLabel = true 
}: { 
  value: number; 
  max?: number;
  className?: string;
  showLabel?: boolean;
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className="w-full space-y-1">
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
        <m.div
          className={cn(
            "h-full rounded-full",
            percentage >= 70 
              ? "bg-green-500" 
              : percentage >= 30 
                ? "bg-yellow-500" 
                : "bg-red-500"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
      </div>
    </div>
  );
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  progress,
  action,
  isLoading = false,
  className = '',
}) => {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const isPositive = trend && trend.value > 0;
  const isNeutral = trend && trend.value === 0;
  const changeType = trend?.changeType || 'percentage';
  
  const getTrendLabel = () => {
    if (!trend) return null;
    
    const absValue = Math.abs(trend.value);
    const prefix = isPositive ? '+' : '';
    const suffix = changeType === 'percentage' ? '%' : '';
    
    return (
      <span className={cn(
        "inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded",
        isNeutral 
          ? "text-muted-foreground" 
          : isPositive 
            ? "text-green-600 dark:text-green-400" 
            : "text-red-600 dark:text-red-400"
      )}>
        {isNeutral ? (
          <ArrowRight className="h-3 w-3 mr-1" />
        ) : isPositive ? (
          <ArrowUp className="h-3 w-3 mr-1" />
        ) : (
          <ArrowDown className="h-3 w-3 mr-1" />
        )}
        {prefix}{absValue}{suffix}
      </span>
    );
  };

  return (
    <m.div 
      variants={fadeInUp}
      className="h-full group"
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
    >
      <Card className="h-full border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-200 group-hover:shadow-md group-hover:border-border/60">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {title}
              {description && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[250px] text-xs">
                      <p>{description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </CardTitle>
            <div className="text-2xl font-bold mt-1 flex items-center gap-2">
              {value}
              {trend && getTrendLabel()}
            </div>
          </div>
          <div className="rounded-lg p-2 bg-primary/10 text-primary group-hover:scale-110 transition-transform">
            {icon}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {progress && (
            <ProgressBar 
              value={progress.value} 
              max={progress.max} 
              showLabel={!!progress.label}
            />
          )}
          
          {trend?.previousValue !== undefined && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3 mr-1" />
              <span>vs {trend.previousValue} previous period</span>
            </div>
          )}
        </CardContent>
        
        {action && (
          <CardFooter className="pt-0">
            <Button 
              variant={action.variant || 'ghost'} 
              size="sm" 
              className="w-full h-8 text-xs group/button"
              onClick={action.onClick}
            >
              <span className="group-hover/button:translate-x-0.5 transition-transform">
                {action.icon}
              </span>
              <span className="ml-1.5">{action.label}</span>
            </Button>
          </CardFooter>
        )}
      </Card>
    </m.div>
  );
};

interface StatsRowProps {
  stats: {
    totalProjects: number;
    activeAnalyses: number;
    averageScore: number;
    weeklyIssues: number;
  };
  onAddProject?: () => void;
  onRunAnalysis?: () => void;
  onViewIssues?: () => void;
  onViewProjects?: () => void;
}

export function StatsRow({
  stats,
  onAddProject = () => {},
  onRunAnalysis = () => {},
  onViewIssues = () => {},
  onViewProjects = () => {},
  isLoading = false,
}: StatsRowProps & { isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <LoadingSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Projects"
        value={stats.totalProjects}
        description="Total number of projects being tracked"
        icon={<LineChart className="h-4 w-4" />}
        trend={{
          value: 12,
          label: '4 more than last month',
          previousValue: 8,
          changeType: 'absolute',
        }}
        progress={{
          value: (stats.totalProjects / 15) * 100,
          label: 'Project limit',
        }}
        action={{
          label: 'Add New',
          onClick: onAddProject,
          icon: <Plus className="h-3.5 w-3.5" />,
          variant: 'default',
        }}
        isLoading={isLoading}
      />
      
      <StatCard
        title="Active Analyses"
        value={stats.activeAnalyses}
        description="Currently running SEO analyses"
        icon={<Zap className="h-4 w-4" />}
        trend={{
          value: -2,
          label: '2 less than yesterday',
          previousValue: 5,
          changeType: 'absolute',
        }}
        progress={{
          value: (stats.activeAnalyses / 10) * 100,
          max: 10,
          label: 'Concurrent limit',
        }}
        action={{
          label: 'Run Analysis',
          onClick: onRunAnalysis,
          icon: <Zap className="h-3.5 w-3.5" />,
          variant: 'secondary',
        }}
        isLoading={isLoading}
      />
      
      <StatCard
        title="Avg. SEO Score"
        value={`${stats.averageScore}%`}
        description="Average score across all projects"
        icon={<BarChart2 className="h-4 w-4" />}
        trend={{
          value: 5.5,
          label: '5.5% improvement',
          previousValue: `${stats.averageScore - 5}%`,
          changeType: 'percentage',
        }}
        progress={{
          value: stats.averageScore,
          label: 'SEO Score',
        }}
        action={{
          label: 'View Details',
          onClick: () => {},
          icon: <Search className="h-3.5 w-3.5" />,
          variant: 'outline',
        }}
        isLoading={isLoading}
      />
      
      <StatCard
        title="Weekly Issues"
        value={stats.weeklyIssues}
        description="Issues found this week"
        icon={stats.weeklyIssues > 0 ? 
          <AlertTriangle className="h-4 w-4 text-destructive" /> : 
          <CheckCircle className="h-4 w-4 text-green-500" />
        }
        trend={{
          value: -3,
          label: '3 fewer than last week',
          previousValue: stats.weeklyIssues + 3,
          changeType: 'absolute',
        }}
        progress={{
          value: Math.min(100, (stats.weeklyIssues / 20) * 100),
          label: 'Issues found',
        }}
        action={{
          label: 'View Issues',
          onClick: onViewIssues,
          icon: stats.weeklyIssues > 0 ? 
            <AlertTriangle className="h-3.5 w-3.5" /> : 
            <CheckCircle className="h-3.5 w-3.5" />,
          variant: stats.weeklyIssues > 0 ? 'destructive' : 'outline',
        }}
        isLoading={isLoading}
      />
    </div>
  );
}
