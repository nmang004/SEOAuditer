"use client";

import React from "react";
import Image from "next/image";
import { m } from 'framer-motion';
import { 
  ExternalLink, 
  BarChart2, 
  Settings, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertCircle 
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, getSeoScoreColor, formatDate } from "@/lib/utils";
import { fadeInUp } from "@/lib/animations";
import { ProjectCardProps } from "@/lib/types";
import ReactMemo from 'react';

/**
 * ProjectCard displays a project summary with status, score, and quick actions.
 * @param {ProjectCardProps} props
 */
const ProjectCard = React.memo(({ 
  project, 
  variant = "detailed", 
  showActions = true 
}: ProjectCardProps) => {
  const { 
    name, 
    url, 
    favicon, 
    lastScanDate, 
    currentScore, 
    issueCount, 
    trend, 
    trendPercentage 
  } = project;

  const scoreColor = getSeoScoreColor(currentScore);
  const formattedDate = formatDate(lastScanDate);
  
  // Determine if the project is currently scanning (mock behavior)
  const isScanning = Math.random() > 0.9;
  // Determine if there was an error in scanning (mock behavior)
  const hasError = !isScanning && Math.random() > 0.95;

  // Variants for hover animation
  const cardVariants = {
    initial: { y: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
    hover: { 
      y: -4, 
      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
      transition: { duration: 0.2 }
    },
    tap: { 
      y: -2,
      boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
      transition: { duration: 0.1 }
    }
  };

  return (
    <m.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      custom={1}
    >
      <m.div
        variants={cardVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        className="h-full"
      >
        <Card className={cn(
          "h-full overflow-hidden border-none bg-gradient-to-br from-background/80 to-background/30 shadow-md backdrop-blur-sm",
          variant === "compact" ? "p-3" : "p-4"
        )}>
          <CardContent className="p-0">
            <div className="flex items-start gap-3">
              {/* Project favicon */}
              {favicon && variant !== "compact" && (
                <div className="flex-shrink-0 w-10 h-10 overflow-hidden rounded-md bg-background/50">
                  <Image 
                    src={favicon} 
                    alt={`${name} favicon`} 
                    className="object-cover w-full h-full"
                    width={40}
                    height={40}
                    onError={(e) => {
                      // Fallback for missing favicon
                      (e.target as HTMLImageElement).src = "/favicon.ico";
                    }}
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                {/* Project name and URL */}
                <div className="flex items-center justify-between">
                  <h3 className={cn(
                    "font-semibold truncate",
                    variant === "compact" ? "text-sm" : "text-base"
                  )}>
                    {name}
                  </h3>
                  
                  {/* Status indicators */}
                  {isScanning && (
                    <Badge variant="outline" className="gap-1 ml-2 animate-pulse">
                      <RefreshCw className="w-3 h-3" />
                      <span className="text-xs">Scanning</span>
                    </Badge>
                  )}
                  
                  {hasError && (
                    <Badge variant="destructive" className="gap-1 ml-2">
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-xs">Error</span>
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className="truncate">{url}</span>
                  {variant !== "compact" && (
                    <ExternalLink className="w-3 h-3 ml-1 flex-shrink-0" />
                  )}
                </div>
                
                {/* Score and metrics */}
                {variant !== "list" && (
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center">
                      <div className={cn(
                        "flex items-center justify-center rounded-full text-white font-medium",
                        variant === "compact" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm",
                        scoreColor === "success" ? "bg-success" : 
                        scoreColor === "warning" ? "bg-warning" : 
                        "bg-destructive"
                      )}>
                        {currentScore}
                      </div>
                      
                      {trend && (
                        <div className="flex items-center ml-2">
                          {trend === "up" ? (
                            <>
                              <TrendingUp className="w-3 h-3 mr-1 text-success" />
                              <span className="text-xs text-success">+{trendPercentage}%</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="w-3 h-3 mr-1 text-destructive" />
                              <span className="text-xs text-destructive">-{trendPercentage}%</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {variant === "detailed" && (
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{formattedDate}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* List variant specific layout */}
                {variant === "list" && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div>
                      <div className="flex items-center">
                        <div className={cn(
                          "flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-medium",
                          scoreColor === "success" ? "bg-success" : 
                          scoreColor === "warning" ? "bg-warning" : 
                          "bg-destructive"
                        )}>
                          {currentScore}
                        </div>
                        
                        {trend && (
                          <div className="flex items-center ml-1">
                            {trend === "up" ? (
                              <TrendingUp className="w-3 h-3 text-success" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-destructive" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1 text-muted-foreground" />
                      <span className="text-xs">{issueCount} issues</span>
                    </div>
                    
                    <div className="flex items-center justify-end">
                      <Clock className="w-3 h-3 mr-1 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{formattedDate}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          
          {/* Action buttons */}
          {showActions && variant === "detailed" && (
            <CardFooter className="flex justify-between p-0 pt-4 mt-2">
              <Button size="sm" variant="outline" className="flex-1">
                <RefreshCw className="w-3 h-3 mr-2" />
                Re-scan
              </Button>
              <Button size="sm" variant="outline" className="flex-1 ml-2">
                <BarChart2 className="w-3 h-3 mr-2" />
                Report
              </Button>
              <Button size="sm" variant="outline" className="flex-1 ml-2">
                <Settings className="w-3 h-3 mr-2" />
                Settings
              </Button>
            </CardFooter>
          )}
          
          {showActions && variant === "compact" && (
            <CardFooter className="flex justify-end p-0 pt-2 mt-1">
              <Button size="sm" variant="ghost" className="h-7 px-2">
                <RefreshCw className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 px-2 ml-1">
                <BarChart2 className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 px-2 ml-1">
                <Settings className="w-3 h-3" />
              </Button>
            </CardFooter>
          )}
        </Card>
      </m.div>
    </m.div>
  );
});

ProjectCard.displayName = 'ProjectCard';

export { ProjectCard };
