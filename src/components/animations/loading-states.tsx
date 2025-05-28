'use client';

import { HTMLAttributes, ReactNode } from 'react';
import { m, Variants  } from 'framer-motion';
import { cn } from '@/lib/utils';

// Skeleton Loader
interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  isLoaded?: boolean;
  children?: ReactNode;
}

export function Skeleton({ className, isLoaded = false, children }: SkeletonProps) {
  if (isLoaded) return <>{children}</>;
  
  return (
    <m.div
      className={cn('bg-muted rounded-md animate-pulse', className)}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.5 }}
    />
  );
}

// Shimmer Effect
interface ShimmerProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Shimmer({ width = '100%', height = '100%', className }: ShimmerProps) {
  return (
    <m.div
      className={cn('overflow-hidden relative', className)}
      style={{ width, height }}
    >
      <m.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <div className="absolute inset-0 bg-muted" />
    </m.div>
  );
}

// Progress Ring
interface ProgressRingProps {
  size?: number;
  progress: number;
  strokeWidth?: number;
  className?: string;
}

export function ProgressRing({ size = 24, progress, strokeWidth = 3, className }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <svg height={size} width={size} className="transform -rotate-90">
        <circle
          className="text-muted"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <m.circle
          className="text-primary"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            type: 'spring',
            damping: 20,
            stiffness: 100,
          }}
        />
      </svg>
      {progress > 0 && (
        <span className="absolute text-xs font-medium">
          {Math.min(100, Math.round(progress))}%
        </span>
      )}
    </div>
  );
}

// Loading Spinner
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <m.div
      className={cn(
        'inline-block border-2 border-current border-t-transparent rounded-full',
        sizeMap[size],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 0.8,
        ease: 'linear',
        repeat: Infinity,
      }}
    />
  );
}
