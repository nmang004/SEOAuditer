'use client';

import { ReactNode, useEffect } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';

type ProvidersProps = {
  children: ReactNode;
  defaultTheme?: string;
  /** Whether to enable performance monitoring (default: true in development) */
  enablePerformanceMonitoring?: boolean;
};

export function Providers({ 
  children, 
  defaultTheme = 'system',
  enablePerformanceMonitoring = process.env.NODE_ENV === 'development'
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

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </NextThemesProvider>
  );
}
