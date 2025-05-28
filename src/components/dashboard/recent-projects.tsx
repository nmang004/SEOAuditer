"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/dashboard/project-card";
import { staggerContainer } from "@/lib/animations";
import { Project } from "@/lib/types";

interface RecentProjectsProps {
  projects: Project[];
  maxItems?: number;
  isLoading?: boolean;
}

export function RecentProjects({ 
  projects, 
  maxItems = 5,
  isLoading = false 
}: RecentProjectsProps) {
  // Transform projects to match the ProjectCardProps format
  const displayProjects = projects.slice(0, maxItems).map(project => {
    // Randomly select a trend
    const trends = ['up', 'down', 'neutral'] as const;
    const trend = trends[Math.floor(Math.random() * trends.length)];
    
    return {
      id: project.id,
      name: project.name,
      url: project.url,
      favicon: `https://www.google.com/s2/favicons?domain=${new URL(project.url).hostname}`,
      lastScanDate: project.lastAnalyzed ? new Date(project.lastAnalyzed) : new Date(),
      currentScore: project.score || 0,
      issueCount: 0, // This will be updated from the analysis data
      trend,
      trendPercentage: trend === 'neutral' ? 0 : Math.floor(Math.random() * 20) + 1
    };
  });

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      <Card className="h-full border-none bg-gradient-to-br from-background/80 to-background/30 shadow-lg backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold">Recent Projects</CardTitle>
        </CardHeader>
        
        <CardContent className="p-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-full h-20 rounded-lg bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : displayProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-muted/30 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground">
                  <path d="M19 11H5M19 11C20.1046 11 21 11.8954 21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11M19 11V9C19 7.89543 18.1046 7 17 7M5 11V9C5 7.89543 5.89543 7 7 7M7 7V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V7M7 7H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium">No projects yet</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Create your first project to start analyzing your website
              </p>
              <Button size="sm">Create Project</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {displayProjects.map((project, index) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  variant="list" 
                  showActions={false} 
                />
              ))}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="pt-0">
          <Button variant="ghost" className="w-full justify-between" size="sm">
            View All Projects
            <ChevronRight className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
