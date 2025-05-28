'use client';

import { ReactNode, useEffect } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
import { TooltipProvider } from '@/components/ui/tooltip';
import { NotificationProvider } from '@/components/notifications';
import { PerformanceProvider } from '@/contexts/performance-context';
import { PerformanceOverlay } from '@/components/performance/performance-overlay';
import { PerformanceSettings } from '@/components/performance/performance-settings';

type ProvidersProps = {
  children: ReactNode;
  defaultTheme?: string;
  /** Whether to enable performance monitoring (default: true in development) */
  enablePerformanceMonitoring?: boolean;
};

export function Providers({ 
  children, 
  defaultTheme,
  enablePerformanceMonitoring = process.env.NODE_ENV === 'development'
}: ProvidersProps) {
  // Add performance class to document element for global styling
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updatePerformanceClass = () => {
        const isLowPerf = window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
                        (navigator as any).deviceMemory < 2 ||
                        (navigator as any).hardwareConcurrency < 2;
        
        if (isLowPerf) {
          document.documentElement.classList.add('performance-low');
        } else {
          document.documentElement.classList.remove('performance-low');
        }
      };

      updatePerformanceClass();
      
      // Listen for changes in reduced motion preference
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      mediaQuery.addEventListener('change', updatePerformanceClass);
      
      return () => {
        mediaQuery.removeEventListener('change', updatePerformanceClass);
      };
    }
  }, []);

  return (
    <PerformanceProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme={defaultTheme || 'system'}
        enableSystem
        disableTransitionOnChange
      >
        <NotificationProvider>
          <TooltipProvider>
            <LazyMotion features={domAnimation} strict>
              <AnimatePresence mode="wait" initial={false}>
                <div key="app-content">
                  {children}
                </div>
                
                {/* Performance monitoring UI */}
                {enablePerformanceMonitoring && (
                  <div key="performance-ui">
                    <PerformanceOverlay />
                    <div className="fixed bottom-4 left-4 z-50">
                      <PerformanceSettings />
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </LazyMotion>
          </TooltipProvider>
        </NotificationProvider>
      </NextThemesProvider>
    </PerformanceProvider>
  );
}
