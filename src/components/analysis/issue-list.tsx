import React from "react";
import { m } from 'framer-motion';
import { 
  AlertTriangle, 
  AlertCircle, 
  AlertOctagon, 
  Info, 
  ChevronDown, 
  ChevronUp 
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
import { Issue } from "@/lib/types";
import { fadeInUp, staggerContainer } from "@/lib/animations";

interface IssueItemProps {
  issue: Issue;
}

function IssueItem({ issue }: IssueItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertOctagon className="h-5 w-5 text-danger-500" />;
      case "high":
        return <AlertTriangle className="h-5 w-5 text-warning-500" />;
      case "medium":
        return <AlertCircle className="h-5 w-5 text-warning-500/80" />;
      case "low":
        return <Info className="h-5 w-5 text-primary" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "danger";
      case "high":
        return "warning";
      case "medium":
        return "warning";
      case "low":
        return "primary";
      default:
        return "default";
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
            <div className="flex-shrink-0">
              {getSeverityIcon(issue.severity)}
            </div>
            <div>
              <h4 className="font-medium">{issue.title}</h4>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant={getSeverityColor(issue.severity) as any} size="sm">
                  {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                </Badge>
                <Badge variant="secondary" size="sm">
                  {issue.category}
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
            <p className="mb-2 text-sm">{issue.description}</p>
            <div className="mt-3 rounded-md bg-muted p-3 text-sm">
              <strong className="block text-xs font-semibold uppercase text-muted-foreground">
                Impact
              </strong>
              <p className="mt-1">{issue.impact}</p>
            </div>
          </div>
        )}
      </div>
    </m.div>
  );
}

interface IssueListProps {
  issues: Issue[];
  isLoading?: boolean;
}

export function IssueList({ issues, isLoading = false }: IssueListProps) {
  const [filter, setFilter] = React.useState<string>("all");
  
  const filteredIssues = React.useMemo(() => {
    if (filter === "all") return issues;
    return issues.filter((issue) => issue.severity === filter);
  }, [issues, filter]);

  const issueCountBySeverity = React.useMemo(() => {
    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    
    issues.forEach((issue) => {
      if (counts[issue.severity as keyof typeof counts] !== undefined) {
        counts[issue.severity as keyof typeof counts]++;
      }
    });
    
    return counts;
  }, [issues]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">SEO Issues</CardTitle>
          <CardDescription>Problems that need to be addressed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20" />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">SEO Issues</CardTitle>
        <CardDescription>Problems that need to be addressed</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({issues.length})
          </Button>
          <Button
            variant={filter === "critical" ? "destructive" : "outline"}
            size="sm"
            onClick={() => setFilter("critical")}
          >
            Critical ({issueCountBySeverity.critical})
          </Button>
          <Button
            variant={filter === "high" ? "warning" : "outline"}
            size="sm"
            onClick={() => setFilter("high")}
            className={filter === "high" ? "bg-warning-500 text-white hover:bg-warning-600" : ""}
          >
            High ({issueCountBySeverity.high})
          </Button>
          <Button
            variant={filter === "medium" ? "warning" : "outline"}
            size="sm"
            onClick={() => setFilter("medium")}
            className={filter === "medium" ? "bg-warning-500/80 text-white hover:bg-warning-500" : ""}
          >
            Medium ({issueCountBySeverity.medium})
          </Button>
          <Button
            variant={filter === "low" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("low")}
          >
            Low ({issueCountBySeverity.low})
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
          {filteredIssues.length > 0 ? (
            filteredIssues.map((issue) => (
              <IssueItem key={issue.id} issue={issue} />
            ))
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              No issues found with the selected filter.
            </p>
          )}
        </m.div>
      </CardContent>
    </Card>
  );
}
