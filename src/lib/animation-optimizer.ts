import { useState, useEffect, useRef, useMemo } from 'react';
import { Variants, Transition, AnimationControls, useAnimation as useFramerMotionAnimation } from 'framer-motion';
import { usePerformanceContext } from '@/contexts/performance-context';

type AnimationOptimizerOptions = {
  /** Whether to enable hardware acceleration */
  hardwareAcceleration?: boolean;
  /** Whether to optimize for performance on low-end devices */
  optimizeForLowEnd?: boolean;
  /** Whether to respect reduced motion preferences */
  respectReducedMotion?: boolean;
  /** Custom transition overrides */
  transitionOverrides?: Partial<Transition>;
};

/**
 * Optimize animation variants based on device capabilities and user preferences
 */
export function optimizeVariants(
  variants: Variants,
  options: AnimationOptimizerOptions = {}
): Variants {
  const {
    hardwareAcceleration = true,
    optimizeForLowEnd = true,
    respectReducedMotion = true,
    transitionOverrides = {},
  } = options;

  // Get performance context if available
  let performanceContext;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    performanceContext = usePerformanceContext?.();
  } catch (e) {
    // Not in a React component, use defaults
    performanceContext = null;
  }

  const { settings } = performanceContext || { settings: { reducedMotion: false } };
  const reducedMotion = respectReducedMotion && (settings.reducedMotion || false);
  const isLowEndDevice = isLowEndDeviceDetected();

  // If reduced motion is enabled or we're on a low-end device with optimization enabled
  if (reducedMotion || (isLowEndDevice && optimizeForLowEnd)) {
    // Return simplified variants that disable most animations
    return Object.keys(variants).reduce<Variants>((acc, key) => {
      const variant = variants[key];
      
      // For exit animations, set opacity to 0
      if (key === 'exit' || key === 'exitBeforeEnter') {
        return {
          ...acc,
          [key]: {
            opacity: 0,
            transition: {
              duration: 0.15,
              ease: 'easeInOut',
              ...transitionOverrides,
            },
          },
        };
      }
      
      // For enter animations, just set opacity to 1
      if (key === 'enter' || key === 'initial' || key === 'animate') {
        return {
          ...acc,
          [key]: {
            opacity: 1,
            transition: {
              duration: 0.15,
              ease: 'easeInOut',
              ...transitionOverrides,
            },
          },
        };
      }
      
      // For other variants, keep them as is but simplify transitions
      if (typeof variant === 'object' && variant !== null) {
        return {
          ...acc,
          [key]: {
            ...variant,
            transition: {
              duration: 0.2,
              ease: 'easeInOut',
              ...transitionOverrides,
            },
          },
        };
      }
      
      return { ...acc, [key]: variant };
    }, {});
  }

  // Apply hardware acceleration if enabled
  if (hardwareAcceleration) {
    return Object.keys(variants).reduce<Variants>((acc, key) => {
      const variant = variants[key];
      
      if (typeof variant === 'object' && variant !== null) {
        return {
          ...acc,
          [key]: {
            ...variant,
            willChange: 'transform, opacity',
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            WebkitFontSmoothing: 'subpixel-antialiased',
            ...(transitionOverrides && { transition: transitionOverrides }),
          },
        };
      }
      
      return { ...acc, [key]: variant };
    }, {});
  }

  // Return original variants with any transition overrides applied
  if (Object.keys(transitionOverrides).length > 0) {
    return Object.keys(variants).reduce<Variants>((acc, key) => {
      const variant = variants[key];
      
      if (typeof variant === 'object' && variant !== null) {
        return {
          ...acc,
          [key]: {
            ...variant,
            transition: {
              ...(variant.transition || {}),
              ...transitionOverrides,
            },
          },
        };
      }
      
      return { ...acc, [key]: variant };
    }, {});
  }

  return variants;
}

/**
 * Optimize a single transition object
 */
export function optimizeTransition(
  transition: Transition,
  options: Omit<AnimationOptimizerOptions, 'transitionOverrides'> = {}
): Transition {
  const { hardwareAcceleration = true, optimizeForLowEnd = true } = options;
  
  // Get performance context if available
  let performanceContext;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    performanceContext = usePerformanceContext?.();
  } catch (e) {
    // Not in a React component, use defaults
    performanceContext = null;
  }

  const { settings } = performanceContext || { settings: { reducedMotion: false } };
  const reducedMotion = options.respectReducedMotion !== false && settings.reducedMotion;
  const isLowEndDevice = isLowEndDeviceDetected();

  // If reduced motion is enabled or we're on a low-end device with optimization enabled
  if (reducedMotion || (isLowEndDevice && optimizeForLowEnd)) {
    return {
      duration: 0.15,
      ease: 'easeInOut',
      ...transition,
    };
  }

  // Apply hardware acceleration if enabled
  if (hardwareAcceleration) {
    return {
      ...transition,
      willChange: 'transform, opacity',
      transformStyle: 'preserve-3d',
      backfaceVisibility: 'hidden',
    };
  }

  return transition;
}

/**
 * Hook to optimize animations based on device capabilities and user preferences
 */
export function useOptimizedAnimations(
  variants: Variants,
  options: AnimationOptimizerOptions = {}
) {
  const { settings } = usePerformanceContext?.() || { settings: { reducedMotion: false } };
  const reducedMotion = options.respectReducedMotion !== false && settings.reducedMotion;
  
  // Memoize the optimized variants to prevent unnecessary recalculations
  const optimizedVariants = useMemo(() => {
    return optimizeVariants(variants, options);
  }, [variants, options]);

  return {
    variants: optimizedVariants,
    reducedMotion,
  };
}

/**
 * Hook to control animation playback based on performance settings
 */
export function useControlledAnimation(
  controls: AnimationControls,
  animationName: string,
  options: {
    /** Whether to play the animation immediately */
    autoPlay?: boolean;
    /** Whether to respect reduced motion preferences */
    respectReducedMotion?: boolean;
    /** Callback when the animation starts */
    onStart?: () => void;
    /** Callback when the animation completes */
    onComplete?: () => void;
  } = {}
) {
  const {
    autoPlay = true,
    respectReducedMotion = true,
    onStart,
    onComplete,
  } = options;
  
  const { settings } = usePerformanceContext?.() || { settings: { reducedMotion: false } };
  const reducedMotion = respectReducedMotion && settings.reducedMotion;
  const hasPlayedRef = useRef(false);

  // Play the animation when the component mounts or when autoPlay changes
  useEffect(() => {
    if (!autoPlay || reducedMotion) return;
    
    const playAnimation = async () => {
      try {
        onStart?.();
        await controls.start(animationName);
        onComplete?.();
      } catch (error) {
        console.error(`Error playing animation "${animationName}":`, error);
      }
    };

    if (!hasPlayedRef.current) {
      hasPlayedRef.current = true;
      playAnimation();
    }

    return () => {
      controls.stop();
    };
  }, [autoPlay, animationName, controls, onStart, onComplete, reducedMotion]);

  // Return the controls and whether the animation is playing
  return {
    controls,
    isPlaying: false, // controls.isAnimating() is not available in the current version
    reducedMotion,
    play: async () => {
      if (reducedMotion) {
        onComplete?.();
        return;
      }
      onStart?.();
      await controls.start(animationName);
      onComplete?.();
    },
    stop: () => {
      controls.stop();
    },
  };
}

/**
 * Detect if the current device is low-end
 */
function isLowEndDeviceDetected(): boolean {
  if (typeof window === 'undefined' || !('navigator' in window)) {
    return false;
  }

  const { deviceMemory, hardwareConcurrency, connection } = navigator as any;
  
  // Check for low memory devices
  const hasLowMemory = deviceMemory !== undefined && deviceMemory < 2;
  
  // Check for low CPU cores
  const hasLowCores = hardwareConcurrency !== undefined && hardwareConcurrency < 2;
  
  // Check for slow connections
  const isSlowConnection = connection && 
    (connection.saveData || 
     (connection.effectiveType && 
      ['slow-2g', '2g'].includes(connection.effectiveType)));
  
  return hasLowMemory || hasLowCores || isSlowConnection;
}

/**
 * Hook to detect if the current device is low-end
 */
export function useIsLowEndDevice(): boolean {
  const [isLowEnd, setIsLowEnd] = useState(false);
  
  useEffect(() => {
    setIsLowEnd(isLowEndDeviceDetected());
    
    // Listen for changes in connection
    const handleConnectionChange = () => {
      setIsLowEnd(isLowEndDeviceDetected());
    };
    
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
      return () => {
        connection.removeEventListener('change', handleConnectionChange);
      };
    }
    
    return () => {};
  }, []);
  
  return isLowEnd;
}
