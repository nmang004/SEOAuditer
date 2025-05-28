import * as React from 'react';
import { motion } from 'framer-motion';

export * from './theme-config';

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
export { motion };
export const MotionDiv = motion.div;
export const MotionSpan = motion.span;
export const MotionButton = motion.button;

// Reduced motion hook
export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
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

// Re-export Touchable component from the UI components
export { Touchable } from '@/components/ui/touchable-fixed';

// Export types
export type { ThemeConfig } from './theme-config';

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
