"use client";

import React from "react";
import { m } from "framer-motion";
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { Badge } from "@/components/ui/badge";

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "default" | "success" | "warning" | "danger";
}

function MetricCard({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  color = "default",
}: MetricCardProps) {
  const getColorClass = () => {
    switch (color) {
      case "success":
        return "text-success-500";
      case "warning":
        return "text-warning-500";
      case "danger":
        return "text-danger-500";
      default:
        return "text-primary";
    }
  };

  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-success-500" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-danger-500" />;
    return null;
  };

  const getTrendClass = () => {
    if (trend === "up") return "text-success-500";
    if (trend === "down") return "text-danger-500";
    return "text-muted-foreground";
  };

  return (
    <m.div variants={fadeInUp} className="w-full">
      <Card glass hover className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className={cn("rounded-full p-2", `text-${color}-500`)}>
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <div className="mt-1 flex items-center text-xs">
            <span className="text-muted-foreground">{description}</span>
            {trend && trendValue && (
              <div className={cn("ml-2 flex items-center", getTrendClass())}>
                {getTrendIcon()}
                <span className="ml-1">{trendValue}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </m.div>
  );
}

interface Metric {
  label: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  description?: string;
}

interface MetricsOverviewProps {
  metrics: Metric[];
}

/**
 * MetricsOverview displays a grid of key metrics/statistics for the dashboard.
 * @param {MetricsOverviewProps} props
 */
const MetricsOverview = React.memo(function MetricsOverview({ metrics }: MetricsOverviewProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-6">Key Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <m.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {metric.label}
                  </h3>
                  {metric.trend && (
                    <Badge
                      variant={
                        metric.trend === "up"
                          ? "success"
                          : metric.trend === "down"
                          ? "destructive"
                          : "default"
                      }
                      className="flex items-center"
                      aria-label={`${metric.trend === "up" ? "Increase" : metric.trend === "down" ? "Decrease" : "No Change"} by ${Math.abs(metric.change || 0)}%`}
                    >
                      {metric.trend === "up" ? "↑" : metric.trend === "down" ? "↓" : "→"}
                      {metric.change && ` ${Math.abs(metric.change)}%`}
                    </Badge>
                  )}
                </div>
                <div className="text-2xl font-bold">{metric.value}</div>
                {metric.description && (
                  <p className="text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                )}
              </div>
            </m.div>
          ))}
        </div>
      </Card>
    </m.div>
  );
});

export { MetricsOverview };
