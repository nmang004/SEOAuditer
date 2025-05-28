"use client";

import { m } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Info, ExternalLink } from "lucide-react";

interface TechnicalMetric {
  id: string;
  name: string;
  score: number;
  description: string;
  recommendation?: string;
  details?: {
    name: string;
    value: string | number;
    status: "success" | "warning" | "danger";
  }[];
}

interface TechnicalAnalysisProps {
  metrics: TechnicalMetric[];
  performanceScore: number;
  mobileScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  seoScore: number;
  pageSpeed: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    timeToInteractive: number;
    totalBlockingTime: number;
    cumulativeLayoutShift: number;
  };
  metaTags: {
    title: string;
    description: string;
    canonical: string;
    robots: string;
    ogTags: Record<string, string>;
  };
}

export function TechnicalAnalysis({
  metrics,
  performanceScore,
  mobileScore,
  accessibilityScore,
  bestPracticesScore,
  seoScore,
  pageSpeed,
  metaTags,
}: TechnicalAnalysisProps) {
  const getScoreColor = (score: number): "success" | "warning" | "default" | "danger" => {
    if (score >= 90) return "success";
    if (score >= 70) return "warning";
    if (score >= 50) return "default";
    return "danger";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle2 className="h-4 w-4" />;
    if (score >= 70) return <Info className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Technical Analysis</h3>
          <Badge variant="outline">Page Speed Insights</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Performance</span>
                <span>{performanceScore}</span>
              </div>
              <Progress
                value={performanceScore}
                className="h-2"
                variant={getScoreColor(performanceScore)}
              />
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Mobile</span>
                <span>{mobileScore}</span>
              </div>
              <Progress
                value={mobileScore}
                className="h-2"
                variant={getScoreColor(mobileScore)}
              />
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Accessibility</span>
                <span>{accessibilityScore}</span>
              </div>
              <Progress
                value={accessibilityScore}
                className="h-2"
                variant={getScoreColor(accessibilityScore)}
              />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="p-4">
            <h4 className="font-medium mb-4">Page Speed Metrics</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">First Contentful Paint</span>
                <Badge
                  variant={getScoreColor(pageSpeed.firstContentfulPaint / 20)}
                  className="flex items-center gap-1"
                >
                  {formatTime(pageSpeed.firstContentfulPaint)}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Largest Contentful Paint</span>
                <Badge
                  variant={getScoreColor(pageSpeed.largestContentfulPaint / 20)}
                  className="flex items-center gap-1"
                >
                  {formatTime(pageSpeed.largestContentfulPaint)}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Time to Interactive</span>
                <Badge
                  variant={getScoreColor(pageSpeed.timeToInteractive / 20)}
                  className="flex items-center gap-1"
                >
                  {formatTime(pageSpeed.timeToInteractive)}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Blocking Time</span>
                <Badge
                  variant={getScoreColor(pageSpeed.totalBlockingTime / 20)}
                  className="flex items-center gap-1"
                >
                  {formatTime(pageSpeed.totalBlockingTime)}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cumulative Layout Shift</span>
                <Badge
                  variant={getScoreColor(pageSpeed.cumulativeLayoutShift * 100)}
                  className="flex items-center gap-1"
                >
                  {pageSpeed.cumulativeLayoutShift.toFixed(2)}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-4">Meta Tags</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Title</span>
                <Badge
                  variant={metaTags.title.length >= 30 && metaTags.title.length <= 60 ? "success" : "warning"}
                  className="flex items-center gap-1"
                >
                  {metaTags.title.length} chars
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Description</span>
                <Badge
                  variant={metaTags.description.length >= 120 && metaTags.description.length <= 160 ? "success" : "warning"}
                  className="flex items-center gap-1"
                >
                  {metaTags.description.length} chars
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Canonical URL</span>
                <Badge
                  variant={metaTags.canonical ? "success" : "danger"}
                  className="flex items-center gap-1"
                >
                  {metaTags.canonical ? "Present" : "Missing"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Robots Meta</span>
                <Badge
                  variant={metaTags.robots ? "success" : "warning"}
                  className="flex items-center gap-1"
                >
                  {metaTags.robots || "Not specified"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Open Graph Tags</span>
                <Badge
                  variant={Object.keys(metaTags.ogTags).length > 0 ? "success" : "warning"}
                  className="flex items-center gap-1"
                >
                  {Object.keys(metaTags.ogTags).length} tags
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <m.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={getScoreColor(metric.score)}
                          className="flex items-center gap-1"
                        >
                          {getScoreIcon(metric.score)}
                          {metric.score}
                        </Badge>
                        <h4 className="font-medium">{metric.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {metric.description}
                      </p>
                      {metric.recommendation && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <span className="font-medium">Recommendation:</span>{" "}
                          {metric.recommendation}
                        </p>
                      )}
                      {metric.details && (
                        <div className="mt-4 space-y-2">
                          {metric.details.map((detail, detailIndex) => (
                            <div
                              key={detailIndex}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-muted-foreground">
                                {detail.name}
                              </span>
                              <Badge
                                variant={detail.status}
                                className="flex items-center gap-1"
                              >
                                {detail.value}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </m.div>
          ))}
        </div>
      </Card>
    </m.div>
  );
} 