"use client";

import { m } from 'framer-motion';
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Analysis {
  id: string;
  projectName: string;
  url: string;
  date: string;
  score: number;
  status: "completed" | "in_progress" | "failed";
  issues: {
    critical: number;
    warning: number;
    info: number;
  };
}

interface RecentAnalysesProps {
  analyses: Analysis[];
}

export function RecentAnalyses({ analyses }: RecentAnalysesProps) {
  const getStatusColor = (status: Analysis["status"]) => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "warning";
      case "failed":
        return "destructive";
      default:
        return "default";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success-500";
    if (score >= 70) return "text-warning-500";
    return "text-destructive-500";
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Recent Analyses</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/analyses">View All</Link>
          </Button>
        </div>

        <div className="space-y-4">
          {analyses.map((analysis, index) => (
            <m.div
              key={analysis.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                href={`/dashboard/analyses/${analysis.id}`}
                className="block hover:bg-muted/50 rounded-lg p-4 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium">{analysis.projectName}</h3>
                    <p className="text-sm text-muted-foreground">{analysis.url}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getScoreColor(analysis.score)}`}>
                        {analysis.score}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(analysis.date).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant={getStatusColor(analysis.status)}>
                      {analysis.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 flex items-center space-x-4 text-sm">
                  {analysis.issues.critical > 0 && (
                    <div className="flex items-center text-destructive-500">
                      <span className="font-medium">{analysis.issues.critical}</span>
                      <span className="ml-1">Critical</span>
                    </div>
                  )}
                  {analysis.issues.warning > 0 && (
                    <div className="flex items-center text-warning-500">
                      <span className="font-medium">{analysis.issues.warning}</span>
                      <span className="ml-1">Warnings</span>
                    </div>
                  )}
                  {analysis.issues.info > 0 && (
                    <div className="flex items-center text-muted-foreground">
                      <span className="font-medium">{analysis.issues.info}</span>
                      <span className="ml-1">Info</span>
                    </div>
                  )}
                </div>
              </Link>
            </m.div>
          ))}
        </div>
      </Card>
    </m.div>
  );
}
