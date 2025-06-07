'use client';

import { useState, useEffect } from 'react';

interface MobileDetection {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  orientation: 'portrait' | 'landscape';
}

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useMobile(): MobileDetection {
  const [detection, setDetection] = useState<MobileDetection>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    screenSize: 'xl',
    orientation: 'landscape',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateDetection = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Determine screen size
      let screenSize: MobileDetection['screenSize'] = 'sm';
      if (width >= BREAKPOINTS['2xl']) screenSize = '2xl';
      else if (width >= BREAKPOINTS.xl) screenSize = 'xl';
      else if (width >= BREAKPOINTS.lg) screenSize = 'lg';
      else if (width >= BREAKPOINTS.md) screenSize = 'md';
      else screenSize = 'sm';

      // Determine device type
      const isMobile = width < BREAKPOINTS.md;
      const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
      const isDesktop = width >= BREAKPOINTS.lg;
      
      // Check for touch support
      const isTouchDevice = typeof navigator !== 'undefined' && (
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0
      );

      // Determine orientation
      const orientation = height > width ? 'portrait' : 'landscape';

      setDetection({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        screenSize,
        orientation,
      });
    };

    // Initial detection
    updateDetection();

    // Listen for resize events
    window.addEventListener('resize', updateDetection);
    window.addEventListener('orientationchange', updateDetection);

    return () => {
      window.removeEventListener('resize', updateDetection);
      window.removeEventListener('orientationchange', updateDetection);
    };
  }, []);

  return detection;
}

// Hook for detecting specific breakpoints
export function useBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia(`(min-width: ${BREAKPOINTS[breakpoint]}px)`);
    
    const updateMatches = () => setMatches(mediaQuery.matches);
    updateMatches();

    mediaQuery.addEventListener('change', updateMatches);
    return () => mediaQuery.removeEventListener('change', updateMatches);
  }, [breakpoint]);

  return matches;
}

// Hook for touch events
export function useTouch() {
  const [touchInfo, setTouchInfo] = useState({
    isTouching: false,
    touchCount: 0,
    lastTouch: null as Touch | null,
  });

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      setTouchInfo({
        isTouching: true,
        touchCount: e.touches.length,
        lastTouch: e.touches[0],
      });
    };

    const handleTouchEnd = () => {
      setTouchInfo({
        isTouching: false,
        touchCount: 0,
        lastTouch: null,
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      setTouchInfo(prev => ({
        ...prev,
        touchCount: e.touches.length,
        lastTouch: e.touches[0],
      }));
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchmove', handleTouchMove);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return touchInfo;
}

// Hook for network status
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true); // Default to online during SSR
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    
    // Set initial state
    setIsOnline(navigator.onLine);
    
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    
    const updateConnectionType = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      if (connection) {
        setConnectionType(connection.effectiveType || connection.type || 'unknown');
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Listen for connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateConnectionType);
      updateConnectionType();
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      
      if (connection) {
        connection.removeEventListener('change', updateConnectionType);
      }
    };
  }, []);

  return { isOnline, connectionType };
}

// Hook for device orientation
export function useOrientation() {
  const [orientation, setOrientation] = useState<{
    angle: number;
    type: OrientationType | 'unknown';
  }>({
    angle: 0,
    type: 'unknown',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateOrientation = () => {
      const screen = window.screen as any;
      const orientation = screen.orientation || screen.mozOrientation || screen.msOrientation;
      
      setOrientation({
        angle: orientation?.angle || (window as any).orientation || 0,
        type: orientation?.type || 'unknown',
      });
    };

    updateOrientation();

    window.addEventListener('orientationchange', updateOrientation);
    return () => window.removeEventListener('orientationchange', updateOrientation);
  }, []);

  return orientation;
} 