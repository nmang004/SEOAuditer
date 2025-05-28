import { useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Info, HelpCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { m, AnimatePresence, useReducedMotion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRafState } from 'react-use';
import { useDebounce } from 'use-debounce';

const severityIcons = {
  critical: AlertTriangle,
  high: AlertTriangle,
  medium: Info,
  low: Info,
} as const;

const severityColors = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
} as const;

const severityDescriptions = {
  critical: 'Critical issues require immediate attention as they significantly impact your SEO performance.',
  high: 'High priority issues should be addressed soon as they affect your search rankings.',
  medium: 'Medium priority issues should be reviewed and fixed when possible.',
  low: 'Low priority issues have minimal impact but should be monitored.'
} as const;

interface IssuesDashboardProps {
  issues: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  isLoading?: boolean;
  className?: string;
}

const loadingIssues = {
  critical: 8,
  high: 12,
  medium: 20,
  low: 15
};

// Lazy loaded animation variants
const lazyVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

// Performance optimized progress bar
const OptimizedProgressBar = ({ 
  percentage, 
  severity 
}: { 
  percentage: number; 
  severity: string;
}) => {
  const [width, setWidth] = useRafState(0);
  const [debouncedPercentage] = useDebounce(percentage, 50);
  const animationRef = useRef<number>();
  const reducedMotion = useReducedMotion();
  const prefersReducedMotion = reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animate = useCallback(() => {
    if (prefersReducedMotion) {
      setWidth(debouncedPercentage);
      return;
    }

    const duration = 800;
    const start = performance.now();
    
    const step = (timestamp: number) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      setWidth(width + (debouncedPercentage - width) * progress);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step);
      }
    };
    
    animationRef.current = requestAnimationFrame(step);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [debouncedPercentage, prefersReducedMotion, setWidth, width]);

  useEffect(() => {
    const cleanup = animate();
    return () => {
      if (cleanup) cleanup();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  return (
    <div className="relative h-2 overflow-hidden rounded-full bg-muted">
      <div
        className={cn('h-full', {
          'bg-red-500': severity === 'critical',
          'bg-orange-500': severity === 'high',
          'bg-yellow-500': severity === 'medium',
          'bg-blue-500': severity === 'low',
        })}
        style={{
          width: `${prefersReducedMotion ? debouncedPercentage : width}%`,
          transition: prefersReducedMotion ? 'width 0.3s ease' : 'none',
        }}
        aria-valuenow={Math.round(debouncedPercentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        role="progressbar"
      />
    </div>
  );
};

export function IssuesDashboard({ 
  issues, 
  isLoading = false, 
  className 
}: IssuesDashboardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '100px' });
  const reducedMotion = useReducedMotion();
  const prefersReducedMotion = reducedMotion || typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  const displayedIssues = isLoading ? loadingIssues : issues;
  const totalIssues = Object.values(displayedIssues).reduce((sum, count) => sum + count, 0);
  const getSeverityPercentage = (count: number) => 
    totalIssues > 0 ? (count / totalIssues) * 100 : 0;
  
  const severityEntries = Object.entries(displayedIssues) as [
    'critical' | 'high' | 'medium' | 'low', 
    number
  ][];
  
  // Only animate if in view and not reduced motion
  const shouldAnimate = isInView && !prefersReducedMotion;

  return (
    <Card className={cn('h-full overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Issues Overview</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <HelpCircle className="h-4 w-4" />
                  <span className="sr-only">More information</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[250px] text-sm">
                <p>This dashboard shows the distribution of SEO issues by severity level.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <AnimatePresence>
            {severityEntries.map(([severity, count]) => {
              const Icon = severityIcons[severity];
              const color = severityColors[severity];
              const percentage = getSeverityPercentage(count);
              const description = severityDescriptions[severity];
              
              return (
                <m.div 
                  key={severity} 
                  className="space-y-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between text-sm">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 group">
                            <Icon className={`h-4 w-4 ${color} transition-transform group-hover:scale-110`} />
                            <span className="capitalize font-medium">{severity}</span>
                            <span className="text-muted-foreground">({count})</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[250px] text-sm">
                          <p>{description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="font-medium">{Math.round(percentage)}%</span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                    <m.div
                      className={cn('h-full', {
                        'bg-red-500': severity === 'critical',
                        'bg-orange-500': severity === 'high',
                        'bg-yellow-500': severity === 'medium',
                        'bg-blue-500': severity === 'low',
                      })}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ 
                        duration: 0.8, 
                        ease: [0.16, 1, 0.3, 1],
                        delay: 0.1
                      }}
                    />
                  </div>
                </m.div>
              );
            })}
          </AnimatePresence>
        </div>
        <m.div 
          className="pt-2 text-sm text-muted-foreground text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {isLoading ? (
            <span className="inline-block h-4 w-40 bg-muted rounded animate-pulse"></span>
          ) : (
            <>
              <span className="font-medium">{totalIssues}</span> total issues found across all categories
            </>
          )}
        </m.div>
      </CardContent>
    </Card>
  );
}
