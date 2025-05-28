"use client";

import { m } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowUp, ArrowDown, Minus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Backlink {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  domainAuthority: number;
  pageAuthority: number;
  spamScore: number;
  firstSeen: string;
  lastSeen: string;
  isNew: boolean;
  isLost: boolean;
}

interface BacklinkAnalysisProps {
  backlinks: Backlink[];
  totalBacklinks: number;
  newBacklinks: number;
  lostBacklinks: number;
  averageDomainAuthority: number;
  averagePageAuthority: number;
  averageSpamScore: number;
}

export function BacklinkAnalysis({
  backlinks,
  totalBacklinks,
  newBacklinks,
  lostBacklinks,
  averageDomainAuthority,
  averagePageAuthority,
  averageSpamScore,
}: BacklinkAnalysisProps) {
  const getAuthorityColor = (score: number): "success" | "warning" | "default" | "danger" => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    if (score >= 40) return "default";
    return "danger";
  };

  const getSpamScoreColor = (score: number): "success" | "warning" | "default" | "danger" => {
    if (score <= 20) return "success";
    if (score <= 40) return "warning";
    if (score <= 60) return "default";
    return "danger";
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Backlink Analysis</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{totalBacklinks} total backlinks</Badge>
            <Badge variant="success" className="flex items-center gap-1">
              <ArrowUp className="h-3 w-3" />
              {newBacklinks} new
            </Badge>
            <Badge variant="danger" className="flex items-center gap-1">
              <ArrowDown className="h-3 w-3" />
              {lostBacklinks} lost
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Average Domain Authority</span>
                <span>{averageDomainAuthority}</span>
              </div>
              <Progress
                value={averageDomainAuthority}
                className="h-2"
                variant={getAuthorityColor(averageDomainAuthority)}
              />
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Average Page Authority</span>
                <span>{averagePageAuthority}</span>
              </div>
              <Progress
                value={averagePageAuthority}
                className="h-2"
                variant={getAuthorityColor(averagePageAuthority)}
              />
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Average Spam Score</span>
                <span>{averageSpamScore}</span>
              </div>
              <Progress
                value={averageSpamScore}
                className="h-2"
                variant={getSpamScoreColor(averageSpamScore)}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {backlinks.map((backlink, index) => (
            <m.div
              key={backlink.id}
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
                          variant={getAuthorityColor(backlink.domainAuthority)}
                          className="flex items-center gap-1"
                        >
                          DA: {backlink.domainAuthority}
                        </Badge>
                        <Badge
                          variant={getAuthorityColor(backlink.pageAuthority)}
                          className="flex items-center gap-1"
                        >
                          PA: {backlink.pageAuthority}
                        </Badge>
                        <Badge
                          variant={getSpamScoreColor(backlink.spamScore)}
                          className="flex items-center gap-1"
                        >
                          Spam: {backlink.spamScore}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={backlink.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:underline"
                        >
                          {backlink.sourceUrl}
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          asChild
                        >
                          <a
                            href={backlink.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Anchor Text:</span>{" "}
                        {backlink.anchorText}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                      <span>First seen: {backlink.firstSeen}</span>
                    </div>
                    <div>
                      <span>Last seen: {backlink.lastSeen}</span>
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