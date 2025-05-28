import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn, getSeoScoreColor } from "@/lib/utils";
import { ScoreCategory } from "@/lib/types";
import { fadeInUp, staggerContainer } from "@/lib/animations";

interface ScoreDisplayProps {
  overallScore: number;
  categoryScores: ScoreCategory[];
  isLoading?: boolean;
}

export function ScoreDisplay({ overallScore, categoryScores, isLoading = false }: ScoreDisplayProps) {
  const scoreColor = getSeoScoreColor(overallScore);
  
  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Average";
    if (score >= 30) return "Poor";
    return "Critical";
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">SEO Score Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="h-40 w-40 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="w-full space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="h-2 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">SEO Score Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div 
          className="flex flex-col items-center justify-center space-y-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            variants={fadeInUp}
            className="relative flex h-40 w-40 items-center justify-center rounded-full border-8 border-gray-100 dark:border-gray-800"
          >
            <div 
              className={cn(
                "absolute inset-0 rounded-full",
                `border-8 border-${scoreColor}-500`
              )}
              style={{ 
                clipPath: `polygon(0 0, 100% 0, 100% 100%, 0% 100%)`,
                opacity: 0.2
              }}
            />
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke={`var(--${scoreColor}-500)`}
                strokeWidth="8"
                strokeDasharray={`${overallScore * 2.9} 1000`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="text-center">
              <div className="text-4xl font-bold">{overallScore}</div>
              <div className={`text-sm font-medium text-${scoreColor}-500`}>
                {getScoreLabel(overallScore)}
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} className="w-full space-y-5 pt-4">
            {categoryScores.map((category, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{category.name}</span>
                  <span 
                    className={cn(
                      "font-medium",
                      `text-${getSeoScoreColor(category.score || 0)}-500`
                    )}
                  >
                    {category.score}
                  </span>
                </div>
                <Progress 
                  value={category.score} 
                  variant={getSeoScoreColor(category.score || 0) as "default" | "success" | "warning" | "danger"}
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Weight: {Math.round(category.weight * 100)}%</span>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
