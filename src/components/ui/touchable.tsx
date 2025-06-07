'use client';

import React from 'react';
import { haptic } from '@/theme/haptic';
import { cn } from '@/lib/utils';

interface TouchableProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'subtle' | 'none';
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'none';
}

export const Touchable = React.forwardRef<HTMLButtonElement, TouchableProps>(
  (
    {
      children,
      className = '',
      disabled = false,
      variant = 'default',
      hapticFeedback = 'light',
      onClick,
      ...props
    },
    ref
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      
      // Trigger haptic feedback if available
      if (hapticFeedback !== 'none') {
        haptic[hapticFeedback]();
      }
      
      // Call the original onClick handler if provided
      if (onClick) {
        onClick(e);
      }
    };

    const variantClasses = {
      default: 'active:scale-[0.98]',
      subtle: 'active:scale-[0.99]',
      none: '',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'select-none touch-manipulation',
          'disabled:opacity-50 disabled:pointer-events-none',
          variantClasses[variant],
          className
        )}
        disabled={disabled}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Touchable.displayName = 'Touchable';
