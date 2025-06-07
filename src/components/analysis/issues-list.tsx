"use client";

import { m } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, AlertCircle, CheckCircle2, Info } from "lucide-react";

interface Issue {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "technical" | "content" | "onpage" | "ux";
  status: "open" | "fixed" | "ignored";
  recommendation?: string;
}

interface IssuesListProps {
  issues: Issue[];
  onIssueClick?: (issue: Issue) => void;
}

export function IssuesList({ issues, onIssueClick }: IssuesListProps) {
  const getSeverityColor = (severity: Issue["severity"]): "success" | "warning" | "default" | "danger" => {
    switch (severity) {
      case "critical":
        return "danger";
      case "high":
        return "warning";
      case "medium":
        return "default";
      case "low":
        return "success";
    }
  };

  const getSeverityIcon = (severity: Issue["severity"]) => {
    switch (severity) {
      case "critical":
      case "high":
        return <AlertCircle className="h-4 w-4" />;
      case "medium":
        return <Info className="h-4 w-4" />;
      case "low":
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">SEO Issues</h3>
          <Badge variant="outline">{issues.length} issues found</Badge>
        </div>

        <div className="space-y-4">
          {issues.map((issue, index) => (
            <m.div
              key={issue.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={getSeverityColor(issue.severity)}
                        className="flex items-center gap-1"
                      >
                        {getSeverityIcon(issue.severity)}
                        {issue.severity}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {issue.category}
                      </Badge>
                    </div>
                    <h4 className="font-medium">{issue.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {issue.description}
                    </p>
                    {issue.recommendation && (
                      <p className="text-sm text-muted-foreground mt-2">
                        <span className="font-medium">Recommendation:</span>{" "}
                        {issue.recommendation}
                      </p>
                    )}
                  </div>
                  {onIssueClick && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onIssueClick(issue)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            </m.div>
          ))}
        </div>
      </Card>
    </m.div>
  );
} 