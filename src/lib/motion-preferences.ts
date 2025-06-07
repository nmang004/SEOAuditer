// Motion Preferences and Animation Utilities
// Respects user's prefers-reduced-motion preference for accessibility

import { designTokens, a11y } from './design-tokens';

export interface MotionConfig {
  duration: number;
  easing: string;
  scale: number;
  opacity: number;
  blur: number;
}

export const motionPreferences = {
  // Check if user prefers reduced motion
  prefersReducedMotion: (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Get appropriate animation duration based on user preference
  getDuration: (normal: string = designTokens.animation.duration.normal): string => {
    return motionPreferences.prefersReducedMotion() ? a11y.reducedMotion.duration : normal;
  },

  // Get appropriate easing function
  getEasing: (normal: string = designTokens.animation.easing.easeOut): string => {
    return motionPreferences.prefersReducedMotion() ? a11y.reducedMotion.easing : normal;
  },

  // Create motion-safe configuration
  getMotionConfig: (config: Partial<MotionConfig> = {}): MotionConfig => {
    const isReduced = motionPreferences.prefersReducedMotion();
    
    return {
      duration: isReduced ? 0.01 : (config.duration || 250),
      easing: isReduced ? 'linear' : (config.easing || designTokens.animation.easing.easeOut),
      scale: isReduced ? 1 : (config.scale || 0.95),
      opacity: isReduced ? 1 : (config.opacity || 0),
      blur: isReduced ? 0 : (config.blur || 8),
    };
  },
};

// Framer Motion variants that respect motion preferences
export const motionVariants = {
  // Page transitions
  pageTransition: {
    initial: (isReduced: boolean) => ({
      opacity: isReduced ? 1 : 0,
      y: isReduced ? 0 : 20,
      filter: isReduced ? 'blur(0px)' : 'blur(8px)',
    }),
    animate: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: motionPreferences.prefersReducedMotion() ? 0.01 : 0.4,
        ease: motionPreferences.getEasing(),
      },
    },
    exit: (isReduced: boolean) => ({
      opacity: isReduced ? 1 : 0,
      y: isReduced ? 0 : -20,
      filter: isReduced ? 'blur(0px)' : 'blur(8px)',
      transition: {
        duration: motionPreferences.prefersReducedMotion() ? 0.01 : 0.3,
        ease: motionPreferences.getEasing(),
      },
    }),
  },

  // Modal/Dialog animations
  modal: {
    overlay: {
      initial: { opacity: 0 },
      animate: { 
        opacity: 1,
        transition: { duration: motionPreferences.prefersReducedMotion() ? 0.01 : 0.2 }
      },
      exit: { 
        opacity: 0,
        transition: { duration: motionPreferences.prefersReducedMotion() ? 0.01 : 0.2 }
      },
    },
    content: {
      initial: (isReduced: boolean) => ({
        opacity: isReduced ? 1 : 0,
        scale: isReduced ? 1 : 0.95,
        y: isReduced ? 0 : 20,
      }),
      animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
          duration: motionPreferences.prefersReducedMotion() ? 0.01 : 0.3,
          ease: motionPreferences.getEasing('cubic-bezier(0.175, 0.885, 0.32, 1.275)'),
        },
      },
      exit: (isReduced: boolean) => ({
        opacity: isReduced ? 1 : 0,
        scale: isReduced ? 1 : 0.95,
        y: isReduced ? 0 : 20,
        transition: {
          duration: motionPreferences.prefersReducedMotion() ? 0.01 : 0.2,
          ease: motionPreferences.getEasing(),
        },
      }),
    },
  },

  // Tooltip animations
  tooltip: {
    initial: (isReduced: boolean) => ({
      opacity: isReduced ? 1 : 0,
      scale: isReduced ? 1 : 0.8,
      y: isReduced ? 0 : 8,
    }),
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: motionPreferences.prefersReducedMotion() ? 0.01 : 0.15,
        ease: motionPreferences.getEasing(),
      },
    },
    exit: (isReduced: boolean) => ({
      opacity: isReduced ? 1 : 0,
      scale: isReduced ? 1 : 0.8,
      y: isReduced ? 0 : 8,
      transition: {
        duration: motionPreferences.prefersReducedMotion() ? 0.01 : 0.1,
        ease: motionPreferences.getEasing(),
      },
    }),
  },

  // Button interactions
  button: {
    whileHover: (isReduced: boolean) => ({
      scale: isReduced ? 1 : 1.02,
      transition: { duration: motionPreferences.prefersReducedMotion() ? 0.01 : 0.15 },
    }),
    whileTap: (isReduced: boolean) => ({
      scale: isReduced ? 1 : 0.98,
      transition: { duration: motionPreferences.prefersReducedMotion() ? 0.01 : 0.1 },
    }),
  },

  // Card hover effects
  card: {
    whileHover: (isReduced: boolean) => ({
      y: isReduced ? 0 : -4,
      boxShadow: isReduced 
        ? designTokens.shadows.DEFAULT 
        : designTokens.shadows.lg,
      transition: { duration: motionPreferences.prefersReducedMotion() ? 0.01 : 0.2 },
    }),
  },

  // List item animations
  listItem: {
    initial: (isReduced: boolean) => ({
      opacity: isReduced ? 1 : 0,
      x: isReduced ? 0 : -20,
    }),
    animate: (index: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        duration: motionPreferences.prefersReducedMotion() ? 0.01 : 0.3,
        delay: motionPreferences.prefersReducedMotion() ? 0 : index * 0.1,
        ease: motionPreferences.getEasing(),
      },
    }),
    exit: (isReduced: boolean) => ({
      opacity: isReduced ? 1 : 0,
      x: isReduced ? 0 : 20,
      transition: {
        duration: motionPreferences.prefersReducedMotion() ? 0.01 : 0.2,
        ease: motionPreferences.getEasing(),
      },
    }),
  },

  // Notification/Toast animations
  notification: {
    initial: (isReduced: boolean) => ({
      opacity: isReduced ? 1 : 0,
      x: isReduced ? 0 : 300,
      scale: isReduced ? 1 : 0.8,
    }),
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: motionPreferences.prefersReducedMotion() ? 0.01 : 0.4,
        ease: motionPreferences.getEasing('cubic-bezier(0.175, 0.885, 0.32, 1.275)'),
      },
    },
    exit: (isReduced: boolean) => ({
      opacity: isReduced ? 1 : 0,
      x: isReduced ? 0 : 300,
      scale: isReduced ? 1 : 0.8,
      transition: {
        duration: motionPreferences.prefersReducedMotion() ? 0.01 : 0.3,
        ease: motionPreferences.getEasing(),
      },
    }),
  },

  // Loading skeleton animations
  skeleton: {
    animate: {
      opacity: motionPreferences.prefersReducedMotion() ? 1 : [0.5, 1, 0.5],
      transition: {
        duration: motionPreferences.prefersReducedMotion() ? 0 : 1.5,
        repeat: motionPreferences.prefersReducedMotion() ? 0 : Infinity,
        ease: 'easeInOut',
      },
    },
  },

  // Slide-in animations for drawers/sidebars
  slideIn: {
    left: {
      initial: (isReduced: boolean) => ({
        x: isReduced ? 0 : '-100%',
        opacity: isReduced ? 1 : 0,
      }),
      animate: {
        x: 0,
        opacity: 1,
        transition: {
          duration: motionPreferences.prefersReducedMotion() ? 0.01 : 0.3,
          ease: motionPreferences.getEasing(),
        },
      },
      exit: (isReduced: boolean) => ({
        x: isReduced ? 0 : '-100%',
        opacity: isReduced ? 1 : 0,
        transition: {
          duration: motionPreferences.prefersReducedMotion() ? 0.01 : 0.3,
          ease: motionPreferences.getEasing(),
        },
      }),
    },
    right: {
      initial: (isReduced: boolean) => ({
        x: isReduced ? 0 : '100%',
        opacity: isReduced ? 1 : 0,
      }),
      animate: {
        x: 0,
        opacity: 1,
        transition: {
          duration: motionPreferences.prefersReducedMotion() ? 0.01 : 0.3,
          ease: motionPreferences.getEasing(),
        },
      },
      exit: (isReduced: boolean) => ({
        x: isReduced ? 0 : '100%',
        opacity: isReduced ? 1 : 0,
        transition: {
          duration: motionPreferences.prefersReducedMotion() ? 0.01 : 0.3,
          ease: motionPreferences.getEasing(),
        },
      }),
    },
  },
};

// Hook to use motion preferences
export function useMotionPreferences() {
  const prefersReducedMotion = motionPreferences.prefersReducedMotion();
  
  return {
    prefersReducedMotion,
    getDuration: motionPreferences.getDuration,
    getEasing: motionPreferences.getEasing,
    getMotionConfig: motionPreferences.getMotionConfig,
  };
}

// Spring animation presets
export const springConfigs = {
  gentle: {
    type: 'spring',
    stiffness: 120,
    damping: 14,
    mass: 0.8,
  },
  wobbly: {
    type: 'spring',
    stiffness: 180,
    damping: 12,
    mass: 0.8,
  },
  stiff: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
    mass: 1,
  },
  slow: {
    type: 'spring',
    stiffness: 60,
    damping: 15,
    mass: 1,
  },
} as const; 