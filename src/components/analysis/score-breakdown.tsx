import { m } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SEOScoreBreakdownProps } from '@/lib/analysis-types';
import { cn } from '@/lib/utils';
import React from 'react';

/**
 * SEOScoreBreakdown Component
 *
 * Displays a large animated circular progress for the overall SEO score, with four smaller category circles.
 * Includes comparison arrows, color-coded indicators, and accessible ARIA labels.
 *
 * @param {SEOScoreBreakdownProps} props - The props for the component.
 *
 * @example
 * <SEOScoreBreakdown
 *   overallScore={85}
 *   categories={{
 *     technical: { score: 80, issues: 3, improvements: 5 },
 *     content: { score: 90, issues: 2, improvements: 2 },
 *     onPage: { score: 75, issues: 4, improvements: 3 },
 *     userExperience: { score: 88, issues: 1, improvements: 1 },
 *   }}
 *   showComparison={{
 *     previousScore: 78,
 *     previousCategories: {
 *       technical: { score: 70, issues: 5, improvements: 6 },
 *       content: { score: 80, issues: 3, improvements: 4 },
 *       onPage: { score: 65, issues: 6, improvements: 5 },
 *       userExperience: { score: 82, issues: 2, improvements: 2 },
 *     },
 *     scanDate: new Date('2024-01-01'),
 *   }}
 * />
 */

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 30) return 'text-orange-500';
  return 'text-red-500';
}

function getCircleColor(score: number) {
  if (score >= 80) return '#22c55e'; // green-500
  if (score >= 60) return '#eab308'; // yellow-500
  if (score >= 30) return '#f59e42'; // orange-500
  return '#ef4444'; // red-500
}

function getScoreLabel(score: number) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 30) return 'Needs Improvement';
  return 'Poor';
}

export const SEOScoreBreakdown = React.memo(function SEOScoreBreakdown({
  overallScore,
  categories,
  showComparison
}: SEOScoreBreakdownProps) {
  const [displayScore, setDisplayScore] = useState(0);
  useEffect(() => {
    let frame: number;
    let start = 0;
    const duration = 1200;
    const step = () => {
      start += 1;
      const progress = Math.min(start / (duration / 16), 1);
      setDisplayScore(Math.round(progress * overallScore));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(frame);
  }, [overallScore]);

  const radius = 95;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  const categoryKeys = [
    { key: 'technical', label: 'Technical' },
    { key: 'content', label: 'Content' },
    { key: 'onPage', label: 'On-Page' },
    { key: 'userExperience', label: 'User Experience' },
  ];

  return (
    <Card id="score" className="overflow-visible bg-gradient-to-br from-background/80 to-background/30 shadow-lg backdrop-blur-sm border-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          SEO Score Breakdown
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Breakdown of your website's SEO performance across key categories</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-8 md:gap-10" role="img" aria-label="SEO score breakdown chart" tabIndex={0} aria-describedby="score-breakdown-desc">
          {/* Central Score Circle */}
          <div className="relative flex flex-col items-center justify-center">
            <svg className="w-[200px] h-[200px] -rotate-90" viewBox="0 0 220 220" aria-label={`Overall SEO score: ${overallScore}`} role="img">
              <circle
                cx="110"
                cy="110"
                r={radius}
                className="fill-none stroke-muted/20"
                strokeWidth="18"
              />
              <m.circle
                cx="110"
                cy="110"
                r={radius}
                className="fill-none"
                stroke={getCircleColor(overallScore)}
                strokeWidth="18"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('text-7xl font-extrabold', getScoreColor(overallScore))}>{displayScore}</span>
              <span className="text-lg text-muted-foreground font-semibold">Overall</span>
              <span className="text-base text-muted-foreground">{getScoreLabel(overallScore)}</span>
              {showComparison && (
                <div className="flex items-center mt-1 text-xs">
                  {showComparison.previousScore !== undefined && (
                    showComparison.previousScore < overallScore ? (
                      <>
                        <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                        <span className="text-green-500">+{overallScore - showComparison.previousScore}</span>
                      </>
                    ) : showComparison.previousScore > overallScore ? (
                      <>
                        <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
                        <span className="text-red-500">-{showComparison.previousScore - overallScore}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">No change</span>
                    )
                  )}
                </div>
              )}
            </div>
            <span id="score-breakdown-desc" className="sr-only">Circular chart showing overall SEO score and category breakdowns for technical, content, on-page, and user experience.</span>
          </div>
          {/* Category Circles Row */}
          <div className="flex flex-row flex-wrap justify-center gap-6 md:gap-10 lg:gap-14 xl:gap-16 mt-8">
            {categoryKeys.map(({ key, label }, i) => {
              const cat = categories[key as keyof typeof categories];
              const catRadius = 40;
              const catCirc = 2 * Math.PI * catRadius;
              const catOffset = catCirc - (cat.score / 100) * catCirc;
              return (
                <TooltipProvider key={key}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative flex flex-col items-center group cursor-pointer min-w-[90px] md:min-w-[100px]">
                        <svg className="w-[80px] h-[80px]" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r={catRadius}
                            className="fill-none stroke-muted/20"
                            strokeWidth="8"
                          />
                          <m.circle
                            cx="50"
                            cy="50"
                            r={catRadius}
                            className="fill-none"
                            stroke={getCircleColor(cat.score)}
                            strokeWidth="8"
                            strokeDasharray={catCirc}
                            strokeDashoffset={catOffset}
                            strokeLinecap="round"
                            initial={{ strokeDashoffset: catCirc }}
                            animate={{ strokeDashoffset: catOffset }}
                            transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
                          />
                        </svg>
                        <span className={cn('text-lg font-bold', getScoreColor(cat.score))}>{cat.score}</span>
                        <span className="text-xs text-muted-foreground">{label}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        <div className="font-semibold mb-1">{label} SEO</div>
                        <div className="mb-1">{cat.issues} issues, {cat.improvements} improvements</div>
                        <div className="mb-1">{getScoreLabel(cat.score)}</div>
                        {showComparison && showComparison.previousCategories && (
                          <div className="flex items-center gap-1 mt-1">
                            {(() => {
                              const prev = showComparison.previousCategories[key as keyof typeof categories]?.score;
                              if (prev === undefined) return null;
                              if (cat.score > prev) return <><TrendingUp className="w-3 h-3 text-green-500" /><span className="text-green-500">+{cat.score - prev}</span></>;
                              if (cat.score < prev) return <><TrendingDown className="w-3 h-3 text-red-500" /><span className="text-red-500">-{prev - cat.score}</span></>;
                              return <span className="text-muted-foreground">No change</span>;
                            })()}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
