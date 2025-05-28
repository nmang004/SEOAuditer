import { useState, useEffect } from 'react';

type ColorScheme = 'light' | 'dark' | 'no-preference';
type MotionPreference = 'reduce' | 'no-preference';

/**
 * Hook to detect system color scheme preference
 */
export function useColorScheme(): ColorScheme {
  const [colorScheme, setColorScheme] = useState<ColorScheme>('no-preference');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateColorScheme = () => {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      
      if (isDark) {
        setColorScheme('dark');
      } else if (isLight) {
        setColorScheme('light');
      } else {
        setColorScheme('no-preference');
      }
    };

    // Set initial value
    updateColorScheme();

    // Listen for changes
    const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const lightMediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    
    // Use addListener for better browser support
    const darkListener = (e: MediaQueryListEvent) => e.matches && setColorScheme('dark');
    const lightListener = (e: MediaQueryListEvent) => e.matches && setColorScheme('light');
    
    // Add event listeners
    if (darkMediaQuery.addEventListener) {
      darkMediaQuery.addEventListener('change', darkListener);
      lightMediaQuery.addEventListener('change', lightListener);
    } else {
      // Fallback for older browsers
      darkMediaQuery.addListener((e) => e.matches && setColorScheme('dark'));
      lightMediaQuery.addListener((e) => e.matches && setColorScheme('light'));
    }

    return () => {
      if (darkMediaQuery.removeEventListener) {
        darkMediaQuery.removeEventListener('change', darkListener);
        lightMediaQuery.removeEventListener('change', lightListener);
      } else {
        darkMediaQuery.removeListener((e) => e.matches && setColorScheme('dark'));
        lightMediaQuery.removeListener((e) => e.matches && setColorScheme('light'));
      }
    };
  }, []);

  return colorScheme;
}

/**
 * Hook to detect reduced motion preference
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateMotionPreference = () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setReducedMotion(prefersReducedMotion);
    };

    // Set initial value
    updateMotionPreference();

    // Listen for changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Use addListener for better browser support
    const listener = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener((e) => setReducedMotion(e.matches));
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', listener);
      } else {
        mediaQuery.removeListener((e) => setReducedMotion(e.matches));
      }
    };
  }, []);

  return reducedMotion;
}

/**
 * Hook to detect system preferences including color scheme and reduced motion
 */
export function useSystemPreferences() {
  const colorScheme = useColorScheme();
  const prefersReducedMotion = useReducedMotion();
  
  return {
    /** The current color scheme preference */
    colorScheme,
    /** Whether the user prefers reduced motion */
    prefersReducedMotion,
    /** Whether the current color scheme is dark */
    isDarkMode: colorScheme === 'dark',
    /** Whether the current color scheme is light */
    isLightMode: colorScheme === 'light',
  };
}

/**
 * Hook to sync system color scheme with document classes
 */
export function useSyncColorScheme() {
  const { colorScheme } = useSystemPreferences();

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    
    // Remove any existing color scheme classes
    root.classList.remove('light', 'dark');
    
    // Add the current color scheme class
    if (colorScheme === 'light' || colorScheme === 'dark') {
      root.classList.add(colorScheme);
    }
    
    // Set the data-theme attribute for CSS custom properties
    if (colorScheme === 'light' || colorScheme === 'dark') {
      root.setAttribute('data-theme', colorScheme);
    } else {
      root.removeAttribute('data-theme');
    }
  }, [colorScheme]);
}

/**
 * Hook to sync reduced motion preference with document classes
 */
export function useSyncReducedMotion() {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    
    if (prefersReducedMotion) {
      root.classList.add('reduced-motion');
      root.setAttribute('data-reduced-motion', 'true');
    } else {
      root.classList.remove('reduced-motion');
      root.removeAttribute('data-reduced-motion');
    }
  }, [prefersReducedMotion]);
}

/**
 * Hook to sync all system preferences
 */
export function useSyncSystemPreferences() {
  useSyncColorScheme();
  useSyncReducedMotion();
}

/**
 * Component to sync system preferences with the document
 */
export function SystemPreferencesSync() {
  useSyncSystemPreferences();
  return null;
}

/**
 * Get the current system color scheme (for use outside of React components)
 */
export function getSystemColorScheme(): ColorScheme {
  if (typeof window === 'undefined') return 'no-preference';
  
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  
  return isDark ? 'dark' : isLight ? 'light' : 'no-preference';
}

/**
 * Check if reduced motion is preferred (for use outside of React components)
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
