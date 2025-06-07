"use client";

import { m } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface SEOScoreCardProps {
  score: number;
  label: string;
  description?: string;
  trend?: number;
  category?: "technical" | "content" | "onpage" | "ux";
}

export function SEOScoreCard({
  score,
  label,
  description,
  trend,
  category,
}: SEOScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success-500";
    if (score >= 70) return "text-warning-500";
    return "text-destructive-500";
  };

  const getScoreVariant = (score: number): "success" | "warning" | "default" | "danger" => {
    if (score >= 90) return "success";
    if (score >= 70) return "warning";
    return "danger";
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">{label}</h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {category && (
            <Badge variant="outline" className="capitalize">
              {category}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-baseline">
            <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
              {score}
            </span>
            <span className="text-muted-foreground ml-1">/ 100</span>
          </div>
          {trend && (
            <Badge
              variant={trend > 0 ? "success" : "destructive"}
              className="flex items-center"
            >
              {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </Badge>
          )}
        </div>

        <Progress
          value={score}
          className="h-2"
          variant={getScoreVariant(score)}
        />
      </Card>
    </m.div>
  );
}
