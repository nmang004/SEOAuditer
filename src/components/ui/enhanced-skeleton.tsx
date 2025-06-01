'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { motionPreferences } from '@/lib/accessibility-utils';

interface SkeletonProps {
  className?: string;
  variant?: 'pulse' | 'wave' | 'shimmer';
  speed?: 'slow' | 'normal' | 'fast';
  children?: React.ReactNode;
}

interface SkeletonCardProps {
  className?: string;
  lines?: number;
  showAvatar?: boolean;
  showImage?: boolean;
  imageHeight?: number;
  variant?: 'pulse' | 'wave' | 'shimmer';
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

interface SkeletonListProps {
  items?: number;
  showAvatar?: boolean;
  lines?: number;
  className?: string;
}

const speedConfig = {
  slow: 2.5,
  normal: 1.5,
  fast: 1,
};

// Base Skeleton Component
export function Skeleton({
  className,
  variant = 'pulse',
  speed = 'normal',
  children,
  ...props
}: SkeletonProps & React.HTMLAttributes<HTMLDivElement>) {
  const duration = speedConfig[speed];
  const reducedMotion = motionPreferences.prefersReducedMotion();
  
  // Filter out event handlers that conflict with motion
  const { onAnimationStart, onAnimationEnd, onDrag, onDragStart, onDragEnd, ...cleanProps } = props;

  const pulseVariants = {
    animate: {
      opacity: [0.4, 0.8, 0.4],
      transition: {
        duration: reducedMotion ? 0 : duration,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const waveVariants = {
    animate: {
      backgroundPosition: ['200% 0', '-200% 0'],
      transition: {
        duration: reducedMotion ? 0 : duration,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };

  const shimmerVariants = {
    animate: {
      x: [-100, 100],
      transition: {
        duration: reducedMotion ? 0 : duration,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };

  const baseClasses = 'bg-gray-200 dark:bg-gray-700 rounded-md';

  if (variant === 'wave') {
    return (
      <motion.div
        className={cn(
          baseClasses,
          'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]',
          className
        )}
        variants={waveVariants}
        animate="animate"
        role="status"
        aria-label="Loading content"
        {...cleanProps}
      >
        {children}
      </motion.div>
    );
  }

  if (variant === 'shimmer') {
    return (
      <div
        className={cn(baseClasses, 'relative overflow-hidden', className)}
        role="status"
        aria-label="Loading content"
        {...cleanProps}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent"
          variants={shimmerVariants}
          animate="animate"
        />
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={cn(baseClasses, className)}
      variants={pulseVariants}
      animate="animate"
      role="status"
      aria-label="Loading content"
      {...cleanProps}
    >
      {children}
    </motion.div>
  );
}

// Avatar Skeleton
export function SkeletonAvatar({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <Skeleton
      className={cn('rounded-full', sizeClasses[size], className)}
      variant="shimmer"
    />
  );
}

// Text Skeleton
export function SkeletonText({
  lines = 1,
  className,
  variant = 'pulse',
}: {
  lines?: number;
  className?: string;
  variant?: 'pulse' | 'wave' | 'shimmer';
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(
            'h-4',
            index === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          )}
          variant={variant}
        />
      ))}
    </div>
  );
}

// Card Skeleton
export function SkeletonCard({
  className,
  lines = 3,
  showAvatar = false,
  showImage = false,
  imageHeight = 200,
  variant = 'pulse',
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'p-6 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4',
        className
      )}
      role="status"
      aria-label="Loading card content"
    >
      {showImage && (
        <Skeleton
          className="w-full rounded-lg"
          style={{ height: imageHeight }}
          variant={variant}
        />
      )}

      <div className="space-y-3">
        {showAvatar && (
          <div className="flex items-center space-x-3">
            <SkeletonAvatar size="md" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/4" variant={variant} />
              <Skeleton className="h-3 w-1/3" variant={variant} />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" variant={variant} />
          <SkeletonText lines={lines} variant={variant} />
        </div>

        <div className="flex space-x-2 pt-2">
          <Skeleton className="h-8 w-20" variant={variant} />
          <Skeleton className="h-8 w-16" variant={variant} />
        </div>
      </div>
    </div>
  );
}

// Table Skeleton
export function SkeletonTable({
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
}: SkeletonTableProps) {
  return (
    <div
      className={cn('space-y-3', className)}
      role="status"
      aria-label="Loading table content"
    >
      {showHeader && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" variant="wave" />
          ))}
        </div>
      )}

      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={cn(
                  'h-10',
                  colIndex === 0 ? 'w-full' : 'w-3/4'
                )}
                variant="pulse"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// List Skeleton
export function SkeletonList({
  items = 5,
  showAvatar = true,
  lines = 2,
  className,
}: SkeletonListProps) {
  return (
    <div
      className={cn('space-y-4', className)}
      role="status"
      aria-label="Loading list content"
    >
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-start space-x-3">
          {showAvatar && <SkeletonAvatar size="md" />}
          
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" variant="shimmer" />
            <SkeletonText lines={lines} variant="pulse" />
            
            <div className="flex space-x-2 pt-1">
              <Skeleton className="h-3 w-16" variant="wave" />
              <Skeleton className="h-3 w-20" variant="wave" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Chart Skeleton
export function SkeletonChart({
  height = 300,
  showLegend = true,
  className,
}: {
  height?: number;
  showLegend?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn('space-y-4', className)}
      role="status"
      aria-label="Loading chart content"
    >
      {/* Chart Title */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-1/3" variant="wave" />
        <Skeleton className="h-4 w-1/2" variant="pulse" />
      </div>

      {/* Chart Area */}
      <div className="relative" style={{ height }}>
        <Skeleton className="w-full h-full" variant="shimmer" />
        
        {/* Simulated chart elements */}
        <div className="absolute inset-4 grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="flex flex-col justify-end space-y-1">
              <Skeleton
                className="w-full"
                style={{ height: `${Math.random() * 60 + 20}%` }}
                variant="pulse"
              />
              <Skeleton className="h-3 w-full" variant="wave" />
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex space-x-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Skeleton className="h-3 w-3 rounded-full" variant="pulse" />
              <Skeleton className="h-3 w-16" variant="wave" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Dashboard Skeleton
export function SkeletonDashboard({ className }: { className?: string }) {
  return (
    <div
      className={cn('space-y-6', className)}
      role="status"
      aria-label="Loading dashboard content"
    >
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/3" variant="wave" />
        <Skeleton className="h-4 w-1/2" variant="pulse" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
            <Skeleton className="h-4 w-2/3" variant="wave" />
            <Skeleton className="h-8 w-1/2" variant="shimmer" />
            <Skeleton className="h-3 w-1/3" variant="pulse" />
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2">
          <SkeletonChart height={400} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <SkeletonCard lines={2} showAvatar={true} />
          <SkeletonList items={3} lines={1} />
        </div>
      </div>

      {/* Table Section */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/4" variant="wave" />
        <SkeletonTable rows={8} columns={5} />
      </div>
    </div>
  );
}

// Project Analysis Skeleton (specific to the SEO tool)
export function SkeletonAnalysis({ className }: { className?: string }) {
  return (
    <div
      className={cn('space-y-6', className)}
      role="status"
      aria-label="Loading analysis content"
    >
      {/* Analysis Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" variant="wave" />
          <Skeleton className="h-4 w-40" variant="pulse" />
        </div>
        <Skeleton className="h-10 w-32" variant="shimmer" />
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg text-center space-y-3">
            <Skeleton className="h-5 w-24 mx-auto" variant="wave" />
            <Skeleton className="h-12 w-16 mx-auto rounded-full" variant="shimmer" />
            <Skeleton className="h-3 w-32 mx-auto" variant="pulse" />
          </div>
        ))}
      </div>

      {/* Analysis Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" variant="wave" />
          <SkeletonList items={5} showAvatar={false} lines={1} />
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-6 w-36" variant="wave" />
          <SkeletonChart height={250} showLegend={false} />
        </div>
      </div>

      {/* Detailed Results */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" variant="wave" />
        <SkeletonTable rows={10} columns={4} />
      </div>
    </div>
  );
}

// Generic Loading State Component
export function LoadingState({
  type = 'card',
  count = 1,
  className,
}: {
  type?: 'card' | 'list' | 'table' | 'dashboard' | 'analysis';
  count?: number;
  className?: string;
}) {
  const renderSkeleton = () => {
    switch (type) {
      case 'list':
        return <SkeletonList items={count} />;
      case 'table':
        return <SkeletonTable rows={count} />;
      case 'dashboard':
        return <SkeletonDashboard />;
      case 'analysis':
        return <SkeletonAnalysis />;
      default:
        return (
          <div className="space-y-4">
            {Array.from({ length: count }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        );
    }
  };

  return (
    <div className={className} aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading content, please wait...</span>
      {renderSkeleton()}
    </div>
  );
} 