import * as React from 'react';
import { m } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SkeletonCardProps {
  count?: number;
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ count = 1, className }) => {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <m.div
          key={i}
          className="rounded-lg border bg-card shadow-sm p-6 w-full animate-pulse"
        >
          <div className="h-5 w-1/3 bg-muted rounded mb-4" />
          <div className="h-4 w-2/3 bg-muted rounded mb-2" />
          <div className="h-4 w-1/2 bg-muted rounded mb-2" />
          <div className="h-3 w-full bg-muted rounded" />
        </m.div>
      ))}
    </div>
  );
}; 