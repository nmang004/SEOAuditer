"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowUpRight, 
  TrendingUp, 
  TrendingDown, 
  ChevronUp,
  Info,
  Zap,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/animations";

interface CategoryScore {
  name: string;
  score: number;
  previousScore: number;
  color: string;
  description: string;
  improvements: string[];
}

interface SEOScoreOverviewProps {
  score: number;
  previousScore?: number;
  categories: {
    technical: number;
    content: number;
    onPage: number;
    userExperience: number;
  };
  previousCategories?: {
    technical: number;
    content: number;
    onPage: number;
    userExperience: number;
  };
  isLoading?: boolean;
}

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function SEOScoreOverview({
  score = 0,
  previousScore = 0,
  categories,
  previousCategories = {
    technical: 0,
    content: 0,
    onPage: 0,
    userExperience: 0,
  },
  isLoading = false,
}: SEOScoreOverviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    if (!isLoading) {
      // Animate the score counter
      const duration = 1500; // Animation duration in ms
      const stepTime = 20; // Update interval in ms
      const steps = duration / stepTime;
      const increment = (score - animatedScore) / steps;
      
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep += 1;
        if (currentStep >= steps) {
          setAnimatedScore(score);
          clearInterval(timer);
        } else {
          setAnimatedScore(prev => Math.min(prev + increment, score));
        }
      }, stepTime);
      
      return () => clearInterval(timer);
    }
  }, [score, isLoading]);

  const scoreDifference = score - (previousScore || 0);
  const isImprovement = scoreDifference >= 0;
  const differencePercentage = previousScore 
    ? Math.round((Math.abs(scoreDifference) / previousScore) * 100) 
    : 0;
    
  // Get score status and message
  const getScoreStatus = (score: number) => {
    if (score >= 80) return {
      status: 'Excellent',
      message: 'Your site is performing well in search results',
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    };
    if (score >= 50) return {
      status: 'Good',
      message: 'There\'s room for improvement in your SEO strategy',
      icon: <Zap className="h-5 w-5 text-yellow-500" />,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    };
    return {
      status: 'Needs Work',
      message: 'Your site needs significant SEO improvements',
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    };
  };
  
  const scoreStatus = getScoreStatus(score);

  const categoryScores: CategoryScore[] = [
    { 
      name: "Technical", 
      score: categories.technical, 
      previousScore: previousCategories.technical,
      color: "bg-blue-500",
      description: "Technical SEO includes site speed, mobile-friendliness, indexing, and other technical factors.",
      improvements: ["Improve page load speed", "Fix crawl errors", "Optimize robots.txt"]
    },
    { 
      name: "Content", 
      score: categories.content, 
      previousScore: previousCategories.content,
      color: "bg-green-500",
      description: "Content quality, relevance, and optimization for target keywords.",
      improvements: ["Add more long-form content", "Optimize meta descriptions", "Improve content depth"]
    },
    { 
      name: "On-Page", 
      score: categories.onPage, 
      previousScore: previousCategories.onPage,
      color: "bg-yellow-500",
      description: "On-page elements like title tags, headers, and internal linking.",
      improvements: ["Optimize title tags", "Improve header structure", "Enhance internal linking"]
    },
    { 
      name: "User Experience", 
      score: categories.userExperience, 
      previousScore: previousCategories.userExperience,
      color: "bg-purple-500",
      description: "How users interact with and experience your website.",
      improvements: ["Improve mobile experience", "Increase page speed", "Enhance navigation"]
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };
  
  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500/10";
    if (score >= 50) return "bg-yellow-500/10";
    return "bg-red-500/10";
  };

  return (
    <motion.div
      variants={fadeInUp}
      className="w-full"
    >
      <Card className="border-none bg-gradient-to-br from-background/80 to-background/30 shadow-lg backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium">SEO Score Overview</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground flex items-center gap-1"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show Less' : 'View Details'}
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ArrowUpRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Main Score */}
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="relative h-48 w-48">
                  <svg className="h-full w-full" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      className="fill-none stroke-muted/20"
                      strokeWidth="8"
                    />
                    {/* Progress circle */}
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="45"
                      className={cn(
                        "fill-none transition-all duration-1000 ease-out",
                        getScoreColor(score).replace("text", "stroke")
                      )}
                      strokeWidth="8"
                      strokeDasharray="283"
                      initial={{ strokeDashoffset: 283 }}
                      animate={{
                        strokeDashoffset: 283 - (283 * score) / 100
                      }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span 
                        className={cn("text-5xl font-bold", getScoreColor(score))}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      >
                        {isLoading ? "--" : Math.round(animatedScore)}
                      </motion.span>
                      <span className="text-sm text-muted-foreground mt-1">Overall Score</span>
                      
                      {previousScore > 0 && (
                        <motion.div 
                          className={cn(
                            "mt-2 flex items-center text-xs px-2 py-1 rounded-full",
                            isImprovement ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10"
                          )}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          {isImprovement ? (
                            <TrendingUp className="mr-1 h-3 w-3" />
                          ) : (
                            <TrendingDown className="mr-1 h-3 w-3" />
                          )}
                          {differencePercentage}% {isImprovement ? 'increase' : 'decrease'}
                        </motion.div>
                      )}
                    </div>
                  </svg>
                </div>
              </div>
              
              <motion.div 
                className={cn("text-center p-4 rounded-lg w-full", getScoreBgColor(score))}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  {scoreStatus.icon}
                  <h3 className={cn("text-lg font-medium", scoreStatus.color)}>
                    {scoreStatus.status}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {scoreStatus.message}
                </p>
              </motion.div>
            </div>
            
            {/* Category Breakdown */}
            <div className="space-y-6">
              <h3 className="text-sm font-medium">Category Breakdown</h3>
              <motion.div 
                className="space-y-4"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {categoryScores.map((category, index) => {
                  const categoryDifference = category.score - category.previousScore;
                  const isCategoryImprovement = categoryDifference >= 0;
                  const categoryDifferencePercentage = category.previousScore > 0 
                    ? Math.round((Math.abs(categoryDifference) / category.previousScore) * 100)
                    : 0;
                  
                  return (
                    <motion.div 
                      key={category.name} 
                      className="space-y-2"
                      variants={item}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <span 
                            className={cn("mr-2 h-2.5 w-2.5 rounded-full flex-shrink-0", category.color)}
                          />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="flex items-center">
                          <span className={cn(
                            "font-mono font-medium tabular-nums mr-2",
                            category.score >= 70 ? "text-green-500" : 
                            category.score >= 40 ? "text-yellow-500" : "text-red-500"
                          )}>
                            {category.score}%
                          </span>
                          {category.previousScore > 0 && (
                            <span className={cn(
                              "text-xs px-1.5 py-0.5 rounded-full flex items-center",
                              isCategoryImprovement 
                                ? "text-green-500 bg-green-500/10" 
                                : "text-red-500 bg-red-500/10"
                            )}>
                              {isCategoryImprovement ? (
                                <TrendingUp className="h-3 w-3 mr-0.5" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-0.5" />
                              )}
                              {categoryDifferencePercentage}%
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                        <motion.div 
                          className={cn("h-full rounded-full", category.color)}
                          initial={{ width: 0 }}
                          animate={{ width: `${category.score}%` }}
                          transition={{ duration: 1, delay: 0.2 + (index * 0.1) }}
                        />
                      </div>
                      
                      <AnimatePresence>
                        {expanded && (
                          <motion.div 
                            className="pl-4 pt-1 text-xs text-muted-foreground"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="border-l-2 border-muted pl-3 space-y-1.5">
                              <p className="text-xs font-medium text-foreground/80">Quick Wins:</p>
                              <ul className="list-disc pl-4 space-y-1">
                                {category.improvements.map((improvement, i) => (
                                  <li key={i} className="text-muted-foreground">
                                    {improvement}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
