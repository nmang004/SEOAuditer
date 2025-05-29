'use client';

import { ReactNode, useEffect } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
import { TooltipProvider } from '@/components/ui/tooltip';

// Import types
// import { ThemeProvider } from '@/theme';

type ProvidersProps = {
  children: ReactNode;
  defaultTheme?: string;
  /** Whether to enable performance monitoring (default: true in development) */
  enablePerformanceMonitoring?: boolean;
};

export function Providers({ 
  children, 
  defaultTheme = 'system',
  enablePerformanceMonitoring = false
}: ProvidersProps) {
  // Add performance class to document element for global styling
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLowPerf = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      if (isLowPerf) {
        document.documentElement.classList.add('performance-low');
      } else {
        document.documentElement.classList.remove('performance-low');
      }
    }
  }, []);

  // Debug: Check if providers are undefined
  if (typeof window !== 'undefined') {
    // Only log in browser
    // eslint-disable-next-line no-console
    console.log('NextThemesProvider:', NextThemesProvider);
  }

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <LazyMotion features={domAnimation} strict>
          <AnimatePresence mode="wait" initial={false}>
            {children}
          </AnimatePresence>
        </LazyMotion>
      </TooltipProvider>
    </NextThemesProvider>
  );
}
