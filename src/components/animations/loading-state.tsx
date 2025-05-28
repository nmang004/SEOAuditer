'use client';

import { ReactNode } from 'react';
import { m, AnimatePresence  } from 'framer-motion';
import { fadeInOut } from '@/lib/animations';
import { LoadingSpinner } from './loading-states';

interface LoadingStateProps {
  isLoading: boolean;
  children: ReactNode;
  loader?: ReactNode;
  className?: string;
}

export function LoadingState({
  isLoading,
  children,
  loader,
  className = '',
}: LoadingStateProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Content */}
      <AnimatePresence>
        {!isLoading && (
          <m.div
            key="content"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeInOut}
            className="h-full w-full"
          >
            {children}
          </m.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <m.div
            key="loader"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeInOut}
            className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            {loader || <LoadingSpinner size="lg" />}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Skeleton Loader Component
export function SkeletonLoader({
  count = 1,
  className = '',
  itemClassName = '',
}: {
  count?: number;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`h-6 bg-muted rounded-md animate-pulse ${itemClassName}`}
        />
      ))}
    </div>
  );
}

// Shimmer Effect Component
export function ShimmerEffect() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}
