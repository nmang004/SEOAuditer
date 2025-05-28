import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn, getSeoScoreColor, formatPercentage } from "@/lib/utils";
import { fadeInUp } from "@/lib/animations";

interface SEOScoreCardProps {
  score: number;
  previousScore?: number;
  isLoading?: boolean;
}

export function SEOScoreCard({ score, previousScore, isLoading = false }: SEOScoreCardProps) {
  const scoreColor = getSeoScoreColor(score);
  const scoreDifference = previousScore ? score - previousScore : 0;
  const isImprovement = scoreDifference > 0;

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Average";
    if (score >= 30) return "Poor";
    return "Critical";
  };

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      <Card glass hover className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Overall SEO Score</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col space-y-4">
              <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className={cn(
                      "flex h-16 w-16 items-center justify-center rounded-full text-white",
                      `bg-${scoreColor}-500`
                    )}
                  >
                    <span className="text-2xl font-bold">{score}</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      {getScoreLabel(score)}
                    </p>
                    {previousScore && (
                      <div className="flex items-center text-sm">
                        {isImprovement ? (
                          <>
                            <TrendingUp className="mr-1 h-3 w-3 text-success-500" />
                            <span className="text-success-500">
                              +{scoreDifference.toFixed(1)} pts
                            </span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="mr-1 h-3 w-3 text-danger-500" />
                            <span className="text-danger-500">
                              {scoreDifference.toFixed(1)} pts
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>0</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>
                <Progress 
                  value={score} 
                  variant={scoreColor as "default" | "success" | "warning" | "danger"}
                  className="h-2"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
