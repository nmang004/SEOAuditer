"use client";

import * as React from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { LoadingSpinner } from '@/components/animations/loading-states';
import { successState } from '@/components/animations/animation-variants';
import { cn } from '@/lib/utils';

export interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  success?: boolean;
  children: React.ReactNode;
}

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ loading = false, success = false, children, className, disabled, ...props }, ref) => {
    const reducedMotion = useReducedMotion();
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
      setIsMobile(window.innerWidth < 768);
    }, []);

    const hoverScale = isMobile ? 1.01 : 1.02;
    const tapScale = isMobile ? 0.99 : 0.98;
    return (
      <m.button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition focus:outline-none',
          className
        )}
        style={{ willChange: 'transform, opacity' }}
        whileHover={(!disabled && !loading && !success && !reducedMotion) ? { scale: hoverScale, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' } : {}}
        whileTap={(!disabled && !loading && !success && !reducedMotion) ? { scale: tapScale } : {}}
        disabled={disabled || loading}
        {...props}
      >
        {/* Loading State */}
        {loading && (
          <span className="absolute left-3">
            <LoadingSpinner size="sm" />
          </span>
        )}
        {/* Success State */}
        {success && (
          <m.span
            className="absolute left-3 text-success-500"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={successState}
            style={{ willChange: 'transform, opacity' }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" strokeWidth="2" d="M5 10l4 4 6-8"/></svg>
          </m.span>
        )}
        {/* Button Text */}
        <span className={cn('transition-opacity', loading ? 'opacity-60' : 'opacity-100', success ? 'text-success-600' : '')}>
          {children}
        </span>
      </m.button>
    );
  }
);
AnimatedButton.displayName = 'AnimatedButton';
