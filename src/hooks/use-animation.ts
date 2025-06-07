import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useInView, AnimationControls, useAnimation as useFramerMotionAnimation, Variants, Transition } from 'framer-motion';
import debounce from 'lodash/debounce';
import { usePerformanceContext } from '@/contexts/performance-context';
import { optimizeVariants, optimizeTransition } from '@/lib/animation-optimizer';

export interface UseAnimationOptions {
  /** Threshold for intersection observer (0-1) */
  threshold?: number;
  /** Margin around the root for intersection detection */
  margin?: string;
  /** Whether to trigger animation only once */
  once?: boolean;
  /** Amount of element that needs to be visible (some, all, or number 0-1) */
  amount?: 'some' | 'all' | number;
  /** Whether to enable viewport tracking */
  viewport?: boolean;
  /** Custom animation variants */
  variants?: any;
  /** Custom transition overrides */
  transition?: any;
  /** Whether to optimize for performance */
  optimizePerformance?: boolean;
  /** Whether to respect reduced motion preferences */
  respectReducedMotion?: boolean;
  /** Callback when element comes into view */
  onViewportEnter?: () => void;
  /** Callback when element leaves view */
  onViewportLeave?: () => void;
}

export interface UseAnimationReturn {
  /** Ref to attach to the animated element */
  ref: (node: HTMLElement | null) => void;
  /** Whether the element is currently in view */
  isVisible: boolean;
  /** Whether the component has mounted */
  isMounted: boolean;
  /** Whether reduced motion is enabled */
  isReducedMotion: boolean;
  /** Animation controls for manual control */
  controls: AnimationControls;
  /** Optimized animation variants */
  variants: any;
  /** Optimized transition */
  transition: any;
}

export function useAnimation({
  threshold = 0.1,
  margin = '0px',
  once = true,
  amount = 0.1,
  viewport = true,
  variants = {},
  transition: customTransition = {},
  optimizePerformance = true,
  respectReducedMotion = true,
  onViewportEnter,
  onViewportLeave,
}: UseAnimationOptions = {}): UseAnimationReturn {
  const ref = useRef<HTMLElement>(null);
  const framerMotionControls = useFramerMotionAnimation();
  const [isMounted, setIsMounted] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const { settings } = usePerformanceContext?.() || { settings: { reducedMotion: false } };
  
  // Check for reduced motion preference
  const isReducedMotion = respectReducedMotion && settings.reducedMotion;
  
  // Handle viewport intersection
  const handleViewportChange = useCallback((entry: IntersectionObserverEntry) => {
    if (entry.isIntersecting) {
      setIsInView(true);
      onViewportEnter?.();
    } else {
      setIsInView(false);
      onViewportLeave?.();
    }
  }, [onViewportEnter, onViewportLeave]);
  
  // Use Framer Motion's useInView for viewport detection
  const framerInView = useInView(ref, { 
    amount, 
    once, 
    margin,
  });
  
  // Handle viewport enter/leave with custom callbacks
  useEffect(() => {
    if (!viewport) return;
    
    const currentRef = ref.current;
    if (!currentRef) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        handleViewportChange(entry);
      } else if (!once) {
        onViewportLeave?.();
      }
    }, { threshold: typeof amount === 'number' ? amount : 0, rootMargin: margin });
    
    observer.observe(currentRef);
    
    return () => {
      observer.disconnect();
    };
  }, [amount, margin, once, viewport, handleViewportChange, onViewportLeave]);
  
  // Handle intersection changes with debounce
  useEffect(() => {
    if (!viewport || !ref.current || isReducedMotion) {
      setIsInView(true);
      return;
    }

    const handleIntersection = debounce((entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          handleViewportChange(entry);
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          handleViewportChange(entry);
        }
      });
    }, 50); // Reduced debounce time for better responsiveness

    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin: margin,
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      handleIntersection.cancel();
      observer.disconnect();
    };
  }, [viewport, isReducedMotion, margin, once, threshold, handleViewportChange]);

  // Set mounted state after initial render
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Memoize the ref callback to prevent infinite loops
  const setRef = useCallback(<T extends HTMLElement>(node: T | null) => {
    if (node) {
      // Use type assertion to bypass readonly check
      (ref as React.MutableRefObject<HTMLElement | null>).current = node;
    }
  }, []);
  
  // Optimize variants and transitions
  const { variants: optimizedVariants, transition: optimizedTransition } = useMemo(() => {
    if (!optimizePerformance) {
      return { variants, transition: customTransition };
    }
    
    return {
      variants: optimizeVariants(variants, { 
        respectReducedMotion,
        transitionOverrides: customTransition 
      }),
      transition: optimizeTransition(customTransition, { respectReducedMotion })
    };
  }, [variants, customTransition, optimizePerformance, respectReducedMotion]);

  // Handle animation controls based on visibility
  useEffect(() => {
    if (isReducedMotion) {
      framerMotionControls.set('visible');
      return;
    }
    
    if (isInView) {
      framerMotionControls.start('visible');
    } else if (!once) {
      framerMotionControls.start('hidden');
    }
  }, [isInView, framerMotionControls, isReducedMotion, once]);

  return {
    ref: setRef,
    isVisible: isReducedMotion ? true : isInView,
    isMounted,
    isReducedMotion,
    controls: framerMotionControls,
    variants: optimizedVariants,
    transition: optimizedTransition,
  };
}

// Export a simpler version for basic usage
export function useViewportAnimation(options: Omit<UseAnimationOptions, 'viewport'> = {}) {
  return useAnimation({ ...options, viewport: true });
}

// Export a version that doesn't use viewport detection
export function useManualAnimation(options: Omit<UseAnimationOptions, 'viewport'> = {}) {
  return useAnimation({ ...options, viewport: false });
}
