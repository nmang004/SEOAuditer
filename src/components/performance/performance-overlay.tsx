'use client';

import { useEffect, useState } from 'react';
import { usePerformanceContext } from '@/contexts/performance-context';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

export function PerformanceOverlay() {
  const { metrics, settings } = usePerformanceContext();
  const [isVisible, setIsVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only show in development or when explicitly enabled
  if (process.env.NODE_ENV !== 'development' && !process.env.NEXT_PUBLIC_PERF_DEBUG) {
    return null;
  }

  if (!isClient) return null;

  const fpsColor = metrics.fps > 50 ? 'text-green-500' : 
                  metrics.fps > 30 ? 'text-yellow-500' : 
                  'text-red-500';

  const jankColor = metrics.jank > 5 ? 'text-red-500' : 
                   metrics.jank > 2 ? 'text-yellow-500' : 
                   'text-green-500';

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className={cn(
            'p-2 rounded-full bg-background/80 backdrop-blur-md border shadow-lg',
            'hover:bg-accent transition-colors',
            'flex items-center justify-center w-10 h-10',
            isVisible ? 'text-primary' : 'text-muted-foreground'
          )}
          aria-label={isVisible ? 'Hide performance metrics' : 'Show performance metrics'}
        >
          <Info className="h-5 w-5" />
        </button>

        {isVisible && (
          <div className="absolute bottom-full right-0 mb-2 w-64 bg-background/90 backdrop-blur-md rounded-lg border shadow-lg p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">FPS</span>
              <span className={cn('font-mono', fpsColor)}>
                {Math.round(metrics.fps)}
              </span>
            </div>
            
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary"
                style={{ 
                  width: `${Math.min(100, (metrics.fps / 60) * 100)}%`,
                  transition: 'width 300ms ease-out',
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <div className="text-xs text-muted-foreground">Frame Time</div>
                <div className="font-mono">
                  {metrics.averageFrameTime.toFixed(1)}ms
                </div>
              </div>
              
              <div>
                <div className="text-xs text-muted-foreground">Jank</div>
                <div className={cn('font-mono', jankColor)}>
                  {metrics.jank}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground mb-1">Settings</div>
              <div className="flex items-center justify-between text-xs">
                <span>Performance Mode:</span>
                <span className="uppercase font-medium">
                  {settings.performanceMode || 'balanced'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Reduced Motion:</span>
                <span>{settings.reducedMotion ? 'On' : 'Off'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Animations:</span>
                <span>{settings.disableAnimations ? 'Off' : 'On'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
