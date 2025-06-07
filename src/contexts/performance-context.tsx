import { usePerformance } from '@/hooks/use-performance';

import { createContext, useContext, useEffect, useState } from 'react';

export interface PerformanceMetrics {
  fps: number;
  frameCount: number;
  averageFrameTime: number;
  jank: number;
  isReducedMotion?: boolean;
}

interface PerformanceSettings {
  disableAnimations: boolean;
  reducedMotion: boolean;
  enabled: boolean;
  performanceMode: 'balanced' | 'high' | 'low';
}

interface PerformanceContextType {
  metrics: PerformanceMetrics;
  settings: PerformanceSettings;
  isMonitoring: boolean;
  updateSettings: (settings: Partial<PerformanceSettings>) => void;
  isReducedMotion: boolean;
}

const defaultSettings: PerformanceSettings = {
  disableAnimations: false,
  reducedMotion: false,
  enabled: true,
  performanceMode: 'balanced',
};

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameCount: 0,
    averageFrameTime: 0,
    jank: 0,
    isReducedMotion: false,
  });

  const [settings, setSettings] = useState<PerformanceSettings>(() => {
    if (typeof window === 'undefined') return defaultSettings;
    
    try {
      const saved = localStorage.getItem('performanceSettings');
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch (error) {
      console.error('Failed to parse performance settings:', error);
      return defaultSettings;
    }
  });

  // Save settings to localStorage when they change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('performanceSettings', JSON.stringify(settings));
      
      // Update document class for reduced motion
      if (settings.reducedMotion || settings.disableAnimations) {
        document.documentElement.classList.add('reduced-motion');
      } else {
        document.documentElement.classList.remove('reduced-motion');
      }
    } catch (error) {
      console.error('Failed to save performance settings:', error);
    }
  }, [settings]);

  // Handle reduced motion preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reducedMotion = mediaQuery.matches;
    
    const handleChange = (event: MediaQueryListEvent) => {
      const reduced = event.matches;
      setSettings((prev: PerformanceSettings) => ({
        ...prev,
        reducedMotion: reduced,
      }));
      setMetrics((prev: PerformanceMetrics) => ({
        ...prev,
        isReducedMotion: reduced,
      }));
    };
    
    // Set initial state
    handleChange({ matches: reducedMotion } as MediaQueryListEvent);
    
    // Modern browsers support addEventListener on MediaQueryList
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    
    // Fallback for older browsers
    // @ts-ignore
    mediaQuery.addListener(handleChange);
    return () => {
      // @ts-ignore
      mediaQuery.removeListener(handleChange);
    };
  }, []);

  // Monitor performance
  const { start, stop } = usePerformance({
    interval: 5000, // Update metrics every 5 seconds
    onMetrics: (newMetrics) => {
      setMetrics(prev => ({
        ...prev,
        ...newMetrics,
      }));
      
      // Automatically adjust performance settings based on metrics
      if (newMetrics.fps < 30 && settings.enabled) {
        setSettings(prev => ({
          ...prev,
          enabled: false,
          disableAnimations: true,
        }));
      } else if (newMetrics.fps > 50 && !settings.enabled) {
        setSettings(prev => ({
          ...prev,
          enabled: true,
          disableAnimations: false,
        }));
      }
    },
    enabled: settings.enabled, // Enable by default in development
  });

  const updateSettings = (newSettings: Partial<PerformanceSettings>) => {
    setSettings((prev: PerformanceSettings) => ({
      ...prev,
      ...newSettings,
    }));
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return (
    <PerformanceContext.Provider
      value={{
        metrics,
        settings,
        updateSettings,
        isMonitoring: true,
        isReducedMotion: settings.reducedMotion,
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformanceContext() {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformanceContext must be used within a PerformanceProvider');
  }
  return context;
}

// Helper hook to check if animations should be disabled
export function useShouldAnimate() {
  const { settings } = usePerformanceContext();
  return !(settings.disableAnimations || settings.reducedMotion);
}
