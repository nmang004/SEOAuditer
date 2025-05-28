import React from "react";
import { motion } from "framer-motion";
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
    <motion.div variants={fadeInUp} className="w-full">
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
    </motion.div>
  );
}

interface MetricsOverviewProps {
  metrics: {
    totalProjects: number;
    activeAnalyses: number;
    criticalIssues: number;
    improvedPages: number;
  };
  isLoading?: boolean;
}

export function MetricsOverview({ metrics, isLoading = false }: MetricsOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="w-full">
            <CardHeader className="pb-2">
              <div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-2 h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <motion.div 
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <MetricCard
        title="Total Projects"
        value={metrics.totalProjects}
        description="Active projects"
        icon={<Activity className="h-4 w-4" />}
        color="default"
      />
      <MetricCard
        title="Active Analyses"
        value={metrics.activeAnalyses}
        description="Last 30 days"
        icon={<Clock className="h-4 w-4" />}
        trend="up"
        trendValue="+12.5%"
        color="primary"
      />
      <MetricCard
        title="Critical Issues"
        value={metrics.criticalIssues}
        description="Require attention"
        icon={<AlertTriangle className="h-4 w-4" />}
        trend="down"
        trendValue="-3"
        color="danger"
      />
      <MetricCard
        title="Improved Pages"
        value={metrics.improvedPages}
        description="Last 30 days"
        icon={<CheckCircle className="h-4 w-4" />}
        trend="up"
        trendValue="+8"
        color="success"
      />
    </motion.div>
  );
}
