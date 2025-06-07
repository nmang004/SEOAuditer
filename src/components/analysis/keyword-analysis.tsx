"use client";

import { m } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface Keyword {
  id: string;
  keyword: string;
  position: number;
  previousPosition?: number;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  competition: number;
}

interface KeywordAnalysisProps {
  keywords: Keyword[];
}

export function KeywordAnalysis({ keywords }: KeywordAnalysisProps) {
  const getPositionChange = (position: number, previousPosition?: number) => {
    if (!previousPosition) return null;
    const change = previousPosition - position;
    if (change === 0) return { icon: <Minus className="h-4 w-4" />, color: "default" };
    if (change > 0) return { icon: <ArrowUp className="h-4 w-4" />, color: "success" };
    return { icon: <ArrowDown className="h-4 w-4" />, color: "danger" };
  };

  const getDifficultyColor = (difficulty: number): "success" | "warning" | "default" | "danger" => {
    if (difficulty >= 80) return "danger";
    if (difficulty >= 60) return "warning";
    if (difficulty >= 40) return "default";
    return "success";
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Keyword Analysis</h3>
          <Badge variant="outline">{keywords.length} keywords tracked</Badge>
        </div>

        <div className="space-y-4">
          {keywords.map((keyword, index) => {
            const positionChange = getPositionChange(keyword.position, keyword.previousPosition);
            
            return (
              <m.div
                key={keyword.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{keyword.keyword}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            Position: {keyword.position}
                          </Badge>
                          {positionChange && (
                            <Badge
                              variant={positionChange.color as "success" | "danger" | "default"}
                              className="flex items-center gap-1"
                            >
                              {positionChange.icon}
                              {Math.abs(keyword.previousPosition! - keyword.position)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          Search Volume
                        </div>
                        <div className="font-medium">
                          {keyword.searchVolume.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Difficulty</span>
                        <span>{keyword.difficulty}%</span>
                      </div>
                      <Progress
                        value={keyword.difficulty}
                        className="h-2"
                        variant={getDifficultyColor(keyword.difficulty)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">CPC</div>
                        <div className="font-medium">
                          ${keyword.cpc.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Competition</div>
                        <div className="font-medium">
                          {(keyword.competition * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </m.div>
            );
          })}
        </div>
      </Card>
    </m.div>
  );
} 