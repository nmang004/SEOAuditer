'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/use-mobile';
import { hapticFeedback } from '@/lib/pwa';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
  threshold?: number;
  className?: string;
  refreshingText?: string;
  pullText?: string;
  releaseText?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
  threshold = 80,
  className,
  refreshingText = 'Refreshing...',
  pullText = 'Pull to refresh',
  releaseText = 'Release to refresh',
}: PullToRefreshProps) {
  const { isMobile } = useMobile();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [pullDistance, setPullDistance] = React.useState(0);
  const [canRefresh, setCanRefresh] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  const touchStartY = React.useRef(0);
  const touchCurrentY = React.useRef(0);
  const initialScrollTop = React.useRef(0);

  const handleTouchStart = React.useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing || !isMobile) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > 0) return; // Only allow refresh at top of page

    touchStartY.current = e.touches[0].clientY;
    initialScrollTop.current = scrollTop;
    setIsDragging(true);
  }, [disabled, isRefreshing, isMobile]);

  const handleTouchMove = React.useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing || !isDragging || !isMobile) return;

    touchCurrentY.current = e.touches[0].clientY;
    const deltaY = touchCurrentY.current - touchStartY.current;

    // Only handle downward pulls when at the top
    if (deltaY > 0 && initialScrollTop.current === 0) {
      e.preventDefault();
      
      // Apply resistance to the pull
      const resistance = 2.5;
      const distance = Math.min(deltaY / resistance, threshold * 1.5);
      
      setPullDistance(distance);
      setCanRefresh(distance >= threshold);

      // Haptic feedback when reaching threshold
      if (distance >= threshold && !canRefresh) {
        hapticFeedback('medium');
      }
    }
  }, [disabled, isRefreshing, isDragging, isMobile, threshold, canRefresh]);

  const handleTouchEnd = React.useCallback(async () => {
    if (disabled || isRefreshing || !isDragging || !isMobile) return;

    setIsDragging(false);

    if (canRefresh && pullDistance >= threshold) {
      setIsRefreshing(true);
      hapticFeedback('heavy');
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        setCanRefresh(false);
      }
    } else {
      // Animate back to original position
      setPullDistance(0);
      setCanRefresh(false);
    }
  }, [disabled, isRefreshing, isDragging, isMobile, canRefresh, pullDistance, threshold, onRefresh]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || !isMobile) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, isMobile]);

  const progress = Math.min(pullDistance / threshold, 1);
  const iconRotation = progress * 180;

  const getStatusText = () => {
    if (isRefreshing) return refreshingText;
    if (canRefresh) return releaseText;
    return pullText;
  };

  const getStatusIcon = () => {
    if (isRefreshing) {
      return <RotateCcw className="h-5 w-5 animate-spin" />;
    }
    return (
      <motion.div
        animate={{ rotate: iconRotation }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <ArrowDown className="h-5 w-5" />
      </motion.div>
    );
  };

  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      style={{
        transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
      }}
    >
      {/* Pull indicator */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: 1, 
              height: 'auto',
            }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 left-0 right-0 z-10 bg-background/90 backdrop-blur-sm border-b"
            style={{
              transform: `translateY(-100%)`,
            }}
          >
            <div className="flex items-center justify-center py-4 gap-3">
              <div className={cn(
                'transition-colors duration-200',
                canRefresh ? 'text-primary' : 'text-muted-foreground'
              )}>
                {getStatusIcon()}
              </div>
              
              <span className={cn(
                'text-sm font-medium transition-colors duration-200',
                canRefresh ? 'text-primary' : 'text-muted-foreground'
              )}>
                {getStatusText()}
              </span>
              
              {/* Progress indicator */}
              <div className="w-8 h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full origin-left"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: progress }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

// Hook for easier usage
export function usePullToRefresh(
  onRefresh: () => Promise<void> | void,
  options?: {
    disabled?: boolean;
    threshold?: number;
  }
) {
  const { isMobile } = useMobile();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const refresh = React.useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, isRefreshing]);

  return {
    isRefreshing,
    refresh,
    isSupported: isMobile,
    PullToRefreshWrapper: React.useCallback(
      ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <PullToRefresh
          onRefresh={refresh}
          disabled={options?.disabled}
          threshold={options?.threshold}
          className={className}
        >
          {children}
        </PullToRefresh>
      ),
      [refresh, options?.disabled, options?.threshold]
    ),
  };
} 