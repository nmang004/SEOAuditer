import { Button } from '@/components/ui/button';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface AnalysisHeaderProps {
  project: {
    name: string;
    url: string;
    lastScanned: string;
  };
  score: number;
  previousScore?: number;
}

export function AnalysisHeader({ project, score, previousScore }: AnalysisHeaderProps) {
  const scoreChange = previousScore ? score - previousScore : 0;
  const isImproved = scoreChange > 0;
  const isSame = scoreChange === 0;

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <a 
              href={`https://${project.url}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 text-sm"
            >
              {project.url}
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Last analyzed: {new Date(project.lastScanned).toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">SEO Score</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{score}</span>
              <span className="text-muted-foreground">/ 100</span>
              {previousScore !== undefined && (
                <Badge 
                  variant={isImproved ? 'success' : isSame ? 'default' : 'destructive'}
                  className="ml-2"
                >
                  {isImproved ? '↑' : isSame ? '→' : '↓'} 
                  {!isSame && `${Math.abs(scoreChange)}`}
                </Badge>
              )}
            </div>
            {previousScore !== undefined && (
              <div className="mt-1">
                <Progress 
                  value={score} 
                  className="h-2" 
                  indicatorClassName={score > 80 ? 'bg-green-500' : score > 60 ? 'bg-yellow-500' : 'bg-red-500'}
                />
              </div>
            )}
          </div>
          
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Rescan
          </Button>
        </div>
      </div>
    </div>
  );
}
