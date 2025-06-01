import { useState, useEffect, useMemo } from 'react';
import { Variants, Transition } from 'framer-motion';
import { usePerformanceContext } from '@/contexts/performance-context';

/**
 * Device performance scoring based on hardware concurrency and device memory
 */
interface DevicePerformance {
  score: number; // 0-100
  isLowEnd: boolean;
  isMidTier: boolean;
  isHighEnd: boolean;
  hardwareConcurrency: number;
  deviceMemory: number;
  connection?: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'ethernet' | 'wifi' | 'unknown';
  saveData: boolean;
}

/**
 * Get device performance information
 */
export function getDevicePerformance(): DevicePerformance {
  if (typeof window === 'undefined') {
    return {
      score: 100,
      isLowEnd: false,
      isMidTier: false,
      isHighEnd: true,
      hardwareConcurrency: 8,
      deviceMemory: 8,
      connection: 'wifi',
      saveData: false,
    };
  }

  const nav = window.navigator as any;
  const connection = (nav.connection || nav.mozConnection || nav.webkitConnection) as {
    effectiveType?: string;
    saveData?: boolean;
    downlink?: number;
    rtt?: number;
  };

  const hardwareConcurrency = nav.hardwareConcurrency || 4;
  const deviceMemory = nav.deviceMemory || 4;
  
  // Calculate performance score (0-100)
  let score = 50; // Base score
  
  // Adjust based on hardware concurrency (up to 8 cores)
  score += Math.min(hardwareConcurrency, 8) * 5; // Up to +40
  
  // Adjust based on device memory (up to 8GB)
  score += Math.min(deviceMemory, 8) * 5; // Up to +40
  
  // Adjust based on connection
  if (connection) {
    if (connection.effectiveType) {
      switch (connection.effectiveType) {
        case 'slow-2g': score -= 30; break;
        case '2g': score -= 20; break;
        case '3g': score -= 10; break;
        case '4g': score += 5; break;
        case '5g': score += 10; break;
      }
    }
    
    // Penalize high latency
    if (connection.rtt && connection.rtt > 200) score -= 10;
    
    // Penalize save-data mode
    if (connection.saveData) score -= 15;
  }
  
  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    isLowEnd: score < 40,
    isMidTier: score >= 40 && score < 70,
    isHighEnd: score >= 70,
    hardwareConcurrency,
    deviceMemory,
    connection: connection?.effectiveType as any || 'unknown',
    saveData: !!connection?.saveData,
  };
}

/**
 * Get optimized animation variants based on device performance
 */
export function getOptimizedVariants(
  variants: Variants,
  options: {
    /** Whether to disable animations on low-end devices */
    disableOnLowEnd?: boolean;
    /** Whether to simplify animations on mid-tier devices */
    simplifyOnMidTier?: boolean;
    /** Custom simplified variants for low-end devices */
    simplifiedVariants?: Variants;
    /** Custom transition overrides */
    transitionOverrides?: Partial<Transition>;
  } = {}
): Variants {
  const {
    disableOnLowEnd = true,
    simplifyOnMidTier = true,
    simplifiedVariants,
    transitionOverrides = {},
  } = options;

  // Get performance context if available
  let performanceContext;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    performanceContext = usePerformanceContext?.();
  } catch (e) {
    // Not in a context, use device detection
    performanceContext = null;
  }


  const devicePerf = getDevicePerformance();
  const { settings } = performanceContext || { settings: { reducedMotion: false, disableAnimations: false } };
  
  // Respect reduced motion preference
  if (settings.reducedMotion || settings.disableAnimations) {
    return simplifiedVariants || {
      hidden: { opacity: 1 },
      visible: { opacity: 1 },
    };
  }

  // Disable animations on low-end devices if configured
  if (disableOnLowEnd && devicePerf.isLowEnd) {
    return simplifiedVariants || {
      hidden: { opacity: 1 },
      visible: { opacity: 1 },
    };
  }

  // Simplify animations on mid-tier devices if configured
  if (simplifyOnMidTier && devicePerf.isMidTier) {
    return simplifiedVariants || {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          duration: 0.3,
          ease: 'easeOut',
          ...transitionOverrides,
        },
      },
    };
  }

  // Apply transition overrides to all variants
  if (Object.keys(transitionOverrides).length > 0) {
    const result = { ...variants };
    
    Object.keys(result).forEach((key) => {
      const variant = result[key];
      if (typeof variant === 'object' && variant !== null) {
        result[key] = {
          ...variant,
          transition: {
            ...(variant as any).transition,
            ...transitionOverrides,
          },
        };
      }
    });
    
    return result;
  }

  return variants;
}

/**
 * Get optimized transition based on device performance
 */
export function getOptimizedTransition(
  defaultTransition: Transition,
  options: {
    /** Whether to disable animations on low-end devices */
    disableOnLowEnd?: boolean;
    /** Whether to simplify animations on mid-tier devices */
    simplifyOnMidTier?: boolean;
    /** Custom simplified transition */
    simplifiedTransition?: Partial<Transition>;
  } = {}
): Transition | false {
  const {
    disableOnLowEnd = true,
    simplifyOnMidTier = true,
    simplifiedTransition = { duration: 0.2, ease: 'easeOut' },
  } = options;

  // Get performance context if available
  let performanceContext;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    performanceContext = usePerformanceContext?.();
  } catch (e) {
    // Not in a context, use device detection
    performanceContext = null;
  }

  const devicePerf = getDevicePerformance();
  const { settings } = performanceContext || { settings: { reducedMotion: false, disableAnimations: false } };
  
  // Respect reduced motion preference
  if (settings.reducedMotion || settings.disableAnimations) {
    return false;
  }

  // Disable animations on low-end devices if configured
  if (disableOnLowEnd && devicePerf.isLowEnd) {
    return false;
  }

  // Simplify animations on mid-tier devices if configured
  if (simplifyOnMidTier && devicePerf.isMidTier) {
    return {
      ...defaultTransition,
      ...simplifiedTransition,
    };
  }

  return defaultTransition;
}

/**
 * Hook to get device performance information
 */
export function useDevicePerformance() {
  const [performance, setPerformance] = useState<DevicePerformance>(() => getDevicePerformance());

  useEffect(() => {
    const handleConnectionChange = () => {
      setPerformance(getDevicePerformance());
    };

    // Listen for connection changes
    const nav = window.navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return performance;
}

/**
 * Hook to check if animations should be disabled
 */
export function useShouldAnimate() {
  const devicePerf = useDevicePerformance();
  const { settings } = usePerformanceContext?.() || { settings: { reducedMotion: false, disableAnimations: false } };
  
  // Only disable animations if explicitly disabled or in reduced motion mode
  return !(settings.reducedMotion || settings.disableAnimations);
}

/**
 * Hook to get optimized animation variants
 */
export function useOptimizedVariants(
  variants: Variants,
  options?: Parameters<typeof getOptimizedVariants>[1]
) {
  const devicePerf = useDevicePerformance();
  const shouldAnimate = useShouldAnimate();
  
  return useMemo(() => {
    if (!shouldAnimate) {
      return options?.simplifiedVariants || {
        hidden: { opacity: 1 },
        visible: { opacity: 1 },
      };
    }
    
    return getOptimizedVariants(variants, {
      ...options,
      disableOnLowEnd: false, // Already handled by shouldAnimate
    });
  }, [variants, options, shouldAnimate]);
}

/**
 * Hook to get optimized transition
 */
export function useOptimizedTransition(
  defaultTransition: Transition,
  options?: Parameters<typeof getOptimizedTransition>[1]
) {
  const devicePerf = useDevicePerformance();
  const shouldAnimate = useShouldAnimate();
  
  return useMemo(() => {
    if (!shouldAnimate) {
      return false;
    }
    
    return getOptimizedTransition(defaultTransition, {
      ...options,
      disableOnLowEnd: false, // Already handled by shouldAnimate
    });
  }, [defaultTransition, options, shouldAnimate]);
}
