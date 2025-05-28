import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink, ChevronRight } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatDate, getSeoScoreColor } from "@/lib/utils";
import { Analysis } from "@/lib/types";
import { staggerContainer, fadeInUp } from "@/lib/animations";

interface AnalysisItemProps {
  analysis: Analysis;
}

function AnalysisItem({ analysis }: AnalysisItemProps) {
  const scoreColor = getSeoScoreColor(analysis.score);
  
  return (
    <motion.div variants={fadeInUp}>
      <div className="flex items-center justify-between rounded-lg border p-4 transition-all hover:bg-accent/50">
        <div className="flex flex-1 items-start space-x-4">
          <div 
            className={cn(
              "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white",
              `bg-${scoreColor}-500`
            )}
          >
            <span className="text-sm font-bold">{analysis.score}</span>
          </div>
          <div className="flex-1 space-y-1">
            <p className="font-medium">{analysis.url}</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(analysis.categoryScores).map(([category, score], index) => (
                <Badge 
                  key={index} 
                  variant={getSeoScoreColor(score) as any}
                  size="sm"
                >
                  {category}: {score}
                </Badge>
              )).slice(0, 3)}
              {Object.keys(analysis.categoryScores).length > 3 && (
                <Badge variant="secondary" size="sm">
                  +{Object.keys(analysis.categoryScores).length - 3} more
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0 text-sm text-muted-foreground">
          {formatDate(analysis.createdAt)}
        </div>
        <Link href={`/dashboard/analyses/${analysis.id}`} className="ml-4">
          <Button variant="ghost" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

interface RecentAnalysesProps {
  analyses: Analysis[];
  isLoading?: boolean;
}

export function RecentAnalyses({ analyses, isLoading = false }: RecentAnalysesProps) {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Recent Analyses</CardTitle>
          <CardDescription>Your latest SEO analysis results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Recent Analyses</CardTitle>
        <CardDescription>Your latest SEO analysis results</CardDescription>
      </CardHeader>
      <CardContent>
        <motion.div 
          className="space-y-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {analyses.length > 0 ? (
            analyses.map((analysis) => (
              <AnalysisItem key={analysis.id} analysis={analysis} />
            ))
          ) : (
            <p className="py-4 text-center text-muted-foreground">
              No recent analyses found. Start by analyzing a website.
            </p>
          )}
        </motion.div>
      </CardContent>
      <CardFooter className="border-t bg-muted/50 px-6 py-4">
        <Button variant="ghost" className="w-full" asChild>
          <Link href="/dashboard/analyses">
            View all analyses
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
