"use client";

import React, { useEffect, useState } from "react";
import { m } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Folder, 
  Activity, 
  AlertCircle, 
  CheckCircle,
  Loader2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/animations";

interface StatCardProps {
  title: string;
  value: number;
  previousValue?: number;
  icon: React.ReactNode;
  variant: 'simple' | 'trend' | 'progress' | 'comparison';
  format?: 'number' | 'percentage' | 'currency';
  color?: 'default' | 'success' | 'warning' | 'danger';
  isLoading?: boolean;
  hasError?: boolean;
}

/**
 * StatCard displays a statistic with icon, trend, and progress.
 * @param {StatCardProps} props
 */
const StatCard = React.memo(function StatCard({
  title,
  value,
  previousValue,
  icon,
  variant = 'simple',
  format = 'number',
  color = 'default',
  isLoading = false,
  hasError = false
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const difference = previousValue !== undefined ? value - previousValue : 0;
  const percentChange = previousValue ? Math.round((difference / previousValue) * 100) : 0;
  const isPositive = difference > 0;
  
  // Format the value based on the format prop
  const formatValue = (val: number) => {
    switch (format) {
      case 'percentage':
        return `${val}%`;
      case 'currency':
        return `$${val.toLocaleString()}`;
      default:
        return val.toLocaleString();
    }
  };
  
  // Animated counting effect
  useEffect(() => {
    if (isLoading || hasError) {
      setDisplayValue(0);
      return;
    }

    const duration = 1000; // ms
    const frameDuration = 1000 / 60; // 60fps
    const totalFrames = Math.round(duration / frameDuration);
    const increment = value / totalFrames;

    let currentFrame = 0;
    const counter = setInterval(() => {
      currentFrame++;
      const newValue = Math.min(Math.round(increment * currentFrame), value);
      setDisplayValue(newValue);

      if (currentFrame === totalFrames) {
        clearInterval(counter);
      }
    }, frameDuration);

    return () => clearInterval(counter);
  }, [value, isLoading, hasError]);

  // Get color classes based on color prop
  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return "text-success";
      case 'warning':
        return "text-warning";
      case 'danger':
        return "text-destructive";
      default:
        return "text-primary";
    }
  };

  // Get icon background color
  const getIconBgColor = () => {
    switch (color) {
      case 'success':
        return "bg-success/10 text-success";
      case 'warning':
        return "bg-warning/10 text-warning";
      case 'danger':
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  return (
    <m.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      <Card className="border-none bg-gradient-to-br from-background/80 to-background/30 shadow-md backdrop-blur-sm">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full py-4">
              <Loader2 className="w-8 h-8 mb-2 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : hasError ? (
            <div className="flex flex-col items-center justify-center h-full py-4">
              <AlertCircle className="w-8 h-8 mb-2 text-destructive" />
              <p className="text-sm text-destructive">Failed to load data</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
                <div className={cn("p-2 rounded-full", getIconBgColor())}>
                  {icon}
                </div>
              </div>
              
              {/* Simple number with label */}
              {variant === 'simple' && (
                <div className="mt-2">
                  <p className={cn("text-2xl font-bold", getColorClasses())}>
                    {formatValue(displayValue)}
                  </p>
                </div>
              )}
              
              {/* Number with trend indicator */}
              {variant === 'trend' && (
                <div className="mt-2">
                  <p className={cn("text-2xl font-bold", getColorClasses())}>
                    {formatValue(displayValue)}
                  </p>
                  {previousValue !== undefined && (
                    <div className="flex items-center mt-1">
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4 mr-1 text-success" />
                      ) : (
                        <TrendingDown className="w-4 h-4 mr-1 text-destructive" />
                      )}
                      <span className={cn(
                        "text-xs font-medium",
                        isPositive ? "text-success" : "text-destructive"
                      )}>
                        {isPositive ? '+' : ''}{percentChange}%
                      </span>
                      <span className="ml-1 text-xs text-muted-foreground">
                        vs previous period
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Progress bar with percentage */}
              {variant === 'progress' && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className={cn("text-2xl font-bold", getColorClasses())}>
                      {formatValue(displayValue)}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      out of {formatValue(100)}
                    </span>
                  </div>
                  <Progress 
                    value={displayValue} 
                    className="h-2" 
                    indicatorColor={color === 'default' ? 'primary' : color} 
                  />
                </div>
              )}
              
              {/* Comparison with previous period */}
              {variant === 'comparison' && (
                <div className="mt-2">
                  <p className={cn("text-2xl font-bold", getColorClasses())}>
                    {formatValue(displayValue)}
                  </p>
                  {previousValue !== undefined && (
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center">
                        <span className="text-xs text-muted-foreground">Previous:</span>
                        <span className="ml-1 text-xs font-medium">
                          {formatValue(previousValue)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-muted-foreground">Change:</span>
                        <span className={cn(
                          "ml-1 text-xs font-medium",
                          isPositive ? "text-success" : "text-destructive"
                        )}>
                          {isPositive ? '+' : ''}{formatValue(difference)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </m.div>
  );
});

export { StatCard };

interface StatsRowProps {
  stats: {
    totalProjects: number;
    activeAnalyses: number;
    averageScore: number;
    weeklyIssues: number;
  };
  isLoading?: boolean;
}

export function StatsRow({ stats, isLoading = false }: StatsRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Projects"
        value={stats.totalProjects}
        previousValue={stats.totalProjects - 2}
        icon={<Folder className="w-4 h-4" />}
        variant="trend"
        color="default"
        isLoading={isLoading}
      />
      
      <StatCard
        title="Active Analyses"
        value={stats.activeAnalyses}
        previousValue={stats.activeAnalyses - 1}
        icon={<Activity className="w-4 h-4" />}
        variant="simple"
        color="success"
        isLoading={isLoading}
      />
      
      <StatCard
        title="Average SEO Score"
        value={stats.averageScore}
        previousValue={stats.averageScore - 5}
        icon={<CheckCircle className="w-4 h-4" />}
        variant="progress"
        format="percentage"
        color={stats.averageScore >= 80 ? "success" : stats.averageScore >= 50 ? "warning" : "danger"}
        isLoading={isLoading}
      />
      
      <StatCard
        title="Issues Found This Week"
        value={stats.weeklyIssues}
        previousValue={stats.weeklyIssues + 5}
        icon={<AlertCircle className="w-4 h-4" />}
        variant="comparison"
        color="warning"
        isLoading={isLoading}
      />
    </div>
  );
}
