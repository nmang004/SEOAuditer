import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';
import * as React from 'react';
import { ButtonHTMLAttributes, forwardRef, useCallback, useMemo, useState, useEffect } from 'react';

// Utility function to merge class names
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Theme configuration
export const themeConfig = {
  // Animation durations (in seconds)
  durations: {
    fast: 0.15,
    normal: 0.3,
    slow: 0.5,
  },
  
  // Easing functions
  easings: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },
  
  // Z-index scale
  zIndex: {
    modal: 50,
    overlay: 40,
    dropdown: 30,
    header: 20,
    base: 1,
  },
  
  // Border radius
  radius: {
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    none: 'none',
  },
  
  // Transitions
  transitions: {
    default: 'all 0.2s ease-in-out',
    transform: 'transform 0.2s ease-in-out',
    opacity: 'opacity 0.2s ease-in-out',
    colors: 'color, background-color, border-color, text-decoration-color, fill, stroke 0.2s ease-in-out',
  },
} as const;

// Animation variants
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

export const slideIn = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
} as const;

// Motion components
export const MotionDiv = motion.div;
export const MotionSpan = motion.span;
export const MotionButton = motion.button;

// Reduced motion hook
export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reducedMotion;
}

// Touchable component props
interface TouchableProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onPress?: () => void;
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'none';
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'subtle' | 'none';
}

// Re-export Touchable component from the UI components
export { Touchable } from '@/components/ui/touchable-fixed';

// Export types
export type ThemeConfig = typeof themeConfig;
export type AnimationVariant = {
  initial: React.CSSProperties;
  animate: React.CSSProperties;
  exit: React.CSSProperties;
};

// Export motion components
export const motionComponents = {
  div: MotionDiv,
  span: MotionSpan,
  button: MotionButton,
} as const;
