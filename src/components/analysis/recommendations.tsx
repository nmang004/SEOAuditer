import React from "react";
import { m } from 'framer-motion';
import { 
  Lightbulb, 
  ChevronDown, 
  ChevronUp, 
  ArrowUpRight,
  Zap,
  Clock,
  TrendingUp
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Recommendation } from "@/lib/types";
import { fadeInUp, staggerContainer } from "@/lib/animations";

interface RecommendationItemProps {
  recommendation: Recommendation;
}

function RecommendationItem({ recommendation }: RecommendationItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case "hard":
        return <Clock className="h-4 w-4 text-danger-500" />;
      case "medium":
        return <Clock className="h-4 w-4 text-warning-500" />;
      case "easy":
        return <Zap className="h-4 w-4 text-success-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case "high":
        return <TrendingUp className="h-4 w-4 text-success-500" />;
      case "medium":
        return <TrendingUp className="h-4 w-4 text-warning-500" />;
      case "low":
        return <TrendingUp className="h-4 w-4 text-muted-foreground" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  return (
    <m.div variants={fadeInUp}>
      <div className="rounded-lg border bg-card transition-all hover:bg-accent/50">
        <div 
          className="flex cursor-pointer items-center justify-between p-4"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 rounded-full bg-primary-50 p-2 text-primary-900 dark:bg-primary-900/20 dark:text-primary-50">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium">{recommendation.title}</h4>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant={getPriorityColor(recommendation.priority) as any} size="sm">
                  {recommendation.priority.charAt(0).toUpperCase() + recommendation.priority.slice(1)} Priority
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        
        {isExpanded && (
          <div className="border-t px-4 py-3">
            <p className="mb-4 text-sm">{recommendation.description}</p>
            
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                {getDifficultyIcon(recommendation.difficulty)}
                <span className="ml-1 text-muted-foreground">
                  {recommendation.difficulty.charAt(0).toUpperCase() + recommendation.difficulty.slice(1)} difficulty
                </span>
              </div>
              
              <div className="flex items-center">
                {getImpactIcon(recommendation.impact)}
                <span className="ml-1 text-muted-foreground">
                  {recommendation.impact.charAt(0).toUpperCase() + recommendation.impact.slice(1)} impact
                </span>
              </div>
            </div>
            
            <div className="mt-4">
              <Button size="sm" className="gap-1">
                Learn how to implement
                <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </m.div>
  );
}

interface RecommendationsProps {
  recommendations: Recommendation[];
  isLoading?: boolean;
}

export function Recommendations({ recommendations, isLoading = false }: RecommendationsProps) {
  const [filter, setFilter] = React.useState<string>("all");
  
  const filteredRecommendations = React.useMemo(() => {
    if (filter === "all") return recommendations;
    return recommendations.filter((rec) => rec.priority === filter);
  }, [recommendations, filter]);

  const recCountByPriority = React.useMemo(() => {
    const counts = {
      high: 0,
      medium: 0,
      low: 0,
    };
    
    recommendations.forEach((rec) => {
      if (counts[rec.priority as keyof typeof counts] !== undefined) {
        counts[rec.priority as keyof typeof counts]++;
      }
    });
    
    return counts;
  }, [recommendations]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Recommendations</CardTitle>
          <CardDescription>Suggested improvements for better rankings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20" />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Recommendations</CardTitle>
        <CardDescription>Suggested improvements for better rankings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({recommendations.length})
          </Button>
          <Button
            variant={filter === "high" ? "destructive" : "outline"}
            size="sm"
            onClick={() => setFilter("high")}
          >
            High Priority ({recCountByPriority.high})
          </Button>
          <Button
            variant={filter === "medium" ? "warning" : "outline"}
            size="sm"
            onClick={() => setFilter("medium")}
            className={filter === "medium" ? "bg-warning-500 text-white hover:bg-warning-600" : ""}
          >
            Medium Priority ({recCountByPriority.medium})
          </Button>
          <Button
            variant={filter === "low" ? "success" : "outline"}
            size="sm"
            onClick={() => setFilter("low")}
            className={filter === "low" ? "bg-success-500 text-white hover:bg-success-600" : ""}
          >
            Low Priority ({recCountByPriority.low})
          </Button>
        </div>

        <m.div 
          className="space-y-3"
          variants={{
            hidden: { opacity: 0, transition: { when: 'afterChildren' } },
            visible: { 
              opacity: 1, 
              transition: { 
                when: 'beforeChildren',
                staggerChildren: 0.1,
                delayChildren: 0,
                staggerDirection: 1,
                duration: 0.5
              } 
            }
          }}
          initial="hidden"
          animate="visible"
        >
          {filteredRecommendations.length > 0 ? (
            filteredRecommendations.map((recommendation) => (
              <RecommendationItem key={recommendation.id} recommendation={recommendation} />
            ))
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              No recommendations found with the selected filter.
            </p>
          )}
        </m.div>
      </CardContent>
    </Card>
  );
}
