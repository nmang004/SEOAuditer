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

export { themes } from './theme-config';

// Theme context for dynamic switching and querying

// Export ThemeMode type for use in other components
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode; initialMode?: ThemeMode }> = ({ children, initialMode = 'system' }) => {
  const [mode, setMode] = React.useState<ThemeMode>(initialMode);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme-mode') as ThemeMode | null;
      if (saved) setMode(saved);
      else setMode(initialMode);
    }
  }, [initialMode]);

  const value = React.useMemo(() => ({
    mode,
    setMode: (newMode: ThemeMode) => {
      setMode(newMode);
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme-mode', newMode);
      }
    }
  }), [mode]);

  return React.createElement(ThemeContext.Provider, { value }, children);
};

export function useThemeMode() {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
}
