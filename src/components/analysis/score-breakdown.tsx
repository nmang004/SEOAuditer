import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface ScoreBreakdownProps {
  score: number;
}

const categories = [
  {
    name: 'Technical',
    score: 85,
    issues: 5,
    improvements: 12,
    description: 'Server performance, mobile usability, and code quality',
  },
  {
    name: 'Content',
    score: 72,
    issues: 8,
    improvements: 6,
    description: 'Content quality, keyword usage, and readability',
  },
  {
    name: 'On-Page',
    score: 65,
    issues: 12,
    improvements: 9,
    description: 'Meta tags, headings, and URL structure',
  },
  {
    name: 'User Experience',
    score: 91,
    issues: 2,
    improvements: 3,
    description: 'Page load speed, mobile responsiveness, and interactivity',
  },
];

export function ScoreBreakdown({ score }: ScoreBreakdownProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 30) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <div key={category.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{category.name}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{category.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{category.score}</span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
              </div>
              <div className="space-y-1">
                <Progress 
                  value={category.score} 
                  className="h-2"
                  indicatorClassName={getScoreColor(category.score)}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{getScoreLabel(category.score)}</span>
                  <div className="flex gap-2">
                    <span className="text-amber-500">{category.issues} issues</span>
                    <span className="text-green-500">{category.improvements} improvements</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
