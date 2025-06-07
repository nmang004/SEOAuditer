"use client";

import React, { useEffect, useState } from "react";
import { m } from 'framer-motion';
import { TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn, getSeoScoreColor, formatPercentage } from "@/lib/utils";
import { fadeInUp } from "@/lib/animations";
import { SEOScoreProps } from "@/lib/types";

export function EnhancedSEOScore({
  score,
  previousScore,
  size = "lg",
  showDetails = true,
  animated = true,
  breakdown
}: SEOScoreProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const scoreColor = getSeoScoreColor(score);
  const scoreDifference = previousScore ? score - previousScore : 0;
  const isImprovement = scoreDifference > 0;

  // Size classes for the circle
  const sizeClasses = {
    sm: "w-24 h-24 text-xl",
    md: "w-32 h-32 text-2xl",
    lg: "w-40 h-40 text-3xl",
    xl: "w-48 h-48 text-4xl"
  };

  // Animated counting effect
  useEffect(() => {
    if (!animated) {
      setDisplayScore(score);
      return;
    }

    const duration = 1500; // ms
    const frameDuration = 1000 / 60; // 60fps
    const totalFrames = Math.round(duration / frameDuration);
    const increment = score / totalFrames;

    let currentFrame = 0;
    const counter = setInterval(() => {
      currentFrame++;
      const newValue = Math.min(Math.round(increment * currentFrame), score);
      setDisplayScore(newValue);

      if (currentFrame === totalFrames) {
        clearInterval(counter);
      }
    }, frameDuration);

    return () => clearInterval(counter);
  }, [score, animated]);

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Average";
    if (score >= 30) return "Poor";
    return "Critical";
  };

  // Calculate circle dimensions
  const radius = size === "xl" ? 90 : size === "lg" ? 75 : size === "md" ? 60 : 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <m.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      <Card className="overflow-hidden border-none bg-gradient-to-br from-background/80 to-background/30 shadow-lg backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold">SEO Health Score</CardTitle>
        </CardHeader>
        <CardContent className="pb-0">
          <div className="flex flex-col items-center justify-center space-y-4 md:flex-row md:space-x-8 md:space-y-0">
            {/* Circular progress indicator */}
            <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
              <svg className="w-full h-full -rotate-90">
                {/* Background circle */}
                <circle
                  cx="50%"
                  cy="50%"
                  r={radius}
                  className="fill-none stroke-muted/20"
                  strokeWidth="10"
                />
                {/* Progress circle with animation */}
                <circle
                  cx="50%"
                  cy="50%"
                  r={radius}
                  className={cn("fill-none transition-all duration-1000 ease-out", 
                    scoreColor === "success" ? "stroke-success" : 
                    scoreColor === "warning" ? "stroke-warning" : 
                    "stroke-destructive"
                  )}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={animated ? strokeDashoffset : circumference - (score / 100) * circumference}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className={cn("font-bold", 
                  size === "xl" ? "text-5xl" : 
                  size === "lg" ? "text-4xl" : 
                  size === "md" ? "text-3xl" : 
                  "text-2xl"
                )}>
                  {displayScore}
                </span>
                <span className="text-sm text-muted-foreground">{getScoreLabel(score)}</span>
                {previousScore && (
                  <div className="flex items-center mt-1 text-xs">
                    {isImprovement ? (
                      <>
                        <TrendingUp className="w-3 h-3 mr-1 text-success" />
                        <span className="text-success">+{scoreDifference}</span>
                      </>
                    ) : scoreDifference < 0 ? (
                      <>
                        <TrendingDown className="w-3 h-3 mr-1 text-destructive" />
                        <span className="text-destructive">{scoreDifference}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">No change</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Category breakdown */}
            {showDetails && breakdown && (
              <div className="w-full space-y-4">
                <h4 className="font-medium">Score Breakdown</h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Technical</span>
                      <span className="text-sm font-medium">{breakdown.technical}%</span>
                    </div>
                    <Progress value={breakdown.technical} className="h-2" 
                      indicatorColor={getSeoScoreColor(breakdown.technical)} />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Content</span>
                      <span className="text-sm font-medium">{breakdown.content}%</span>
                    </div>
                    <Progress value={breakdown.content} className="h-2" 
                      indicatorColor={getSeoScoreColor(breakdown.content)} />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">On-Page</span>
                      <span className="text-sm font-medium">{breakdown.onPage}%</span>
                    </div>
                    <Progress value={breakdown.onPage} className="h-2" 
                      indicatorColor={getSeoScoreColor(breakdown.onPage)} />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">User Experience</span>
                      <span className="text-sm font-medium">{breakdown.userExperience}%</span>
                    </div>
                    <Progress value={breakdown.userExperience} className="h-2" 
                      indicatorColor={getSeoScoreColor(breakdown.userExperience)} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-4">
          <Button variant="ghost" className="w-full justify-between" size="sm">
            View Details
            <ChevronRight className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>
    </m.div>
  );
}
