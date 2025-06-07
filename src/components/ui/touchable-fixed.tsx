'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TouchableProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'subtle' | 'none';
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'none';
  onPress?: () => void;
}

export const Touchable = React.forwardRef<HTMLButtonElement, TouchableProps>(
  (
    {
      children,
      onPress,
      hapticFeedback = 'light',
      className = '',
      disabled = false,
      variant = 'default',
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (onPress) {
        onPress();
      }
      
      if (rest.onClick) {
        rest.onClick(e);
      }
    };

    const buttonClasses = cn(
      'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:pointer-events-none',
      variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
      variant === 'subtle' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      variant === 'none' && '',
      disabled && 'opacity-50 cursor-not-allowed',
      className
    );

    return (
      <button
        ref={ref}
        type={type as 'button' | 'submit' | 'reset'}
        onClick={handleClick}
        disabled={disabled}
        className={buttonClasses}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

Touchable.displayName = 'Touchable';
