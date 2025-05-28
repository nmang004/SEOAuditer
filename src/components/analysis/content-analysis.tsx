"use client";

import { m } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

interface ContentMetric {
  id: string;
  name: string;
  score: number;
  description: string;
  recommendation?: string;
}

interface ContentAnalysisProps {
  metrics: ContentMetric[];
  readabilityScore: number;
  wordCount: number;
  keywordDensity: number;
  headings: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
  };
  images: {
    total: number;
    withAlt: number;
    withoutAlt: number;
  };
  links: {
    total: number;
    internal: number;
    external: number;
    broken: number;
  };
}

export function ContentAnalysis({
  metrics,
  readabilityScore,
  wordCount,
  keywordDensity,
  headings,
  images,
  links,
}: ContentAnalysisProps) {
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

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Content Analysis</h3>
          <Badge variant="outline">{wordCount} words</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Readability Score</span>
                <span>{readabilityScore}</span>
              </div>
              <Progress
                value={readabilityScore}
                className="h-2"
                variant={getScoreColor(readabilityScore)}
              />
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Keyword Density</span>
                <span>{keywordDensity.toFixed(1)}%</span>
              </div>
              <Progress
                value={keywordDensity}
                className="h-2"
                variant={getScoreColor(keywordDensity * 10)}
              />
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Content Quality</span>
                <span>
                  {Math.round(
                    metrics.reduce((acc, metric) => acc + metric.score, 0) /
                      metrics.length
                  )}
                </span>
              </div>
              <Progress
                value={
                  metrics.reduce((acc, metric) => acc + metric.score, 0) /
                  metrics.length
                }
                className="h-2"
                variant={getScoreColor(
                  metrics.reduce((acc, metric) => acc + metric.score, 0) /
                    metrics.length
                )}
              />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="p-4">
            <h4 className="font-medium mb-4">Headings Structure</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">H1 Tags</span>
                <Badge
                  variant={headings.h1 === 1 ? "success" : "danger"}
                  className="flex items-center gap-1"
                >
                  {headings.h1}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">H2 Tags</span>
                <Badge variant="outline">{headings.h2}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">H3 Tags</span>
                <Badge variant="outline">{headings.h3}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">H4 Tags</span>
                <Badge variant="outline">{headings.h4}</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-4">Images & Links</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Images with Alt Text</span>
                <Badge
                  variant={
                    images.withAlt === images.total ? "success" : "warning"
                  }
                  className="flex items-center gap-1"
                >
                  {images.withAlt}/{images.total}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Internal Links</span>
                <Badge variant="outline">{links.internal}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">External Links</span>
                <Badge variant="outline">{links.external}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Broken Links</span>
                <Badge
                  variant={links.broken === 0 ? "success" : "danger"}
                  className="flex items-center gap-1"
                >
                  {links.broken}
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