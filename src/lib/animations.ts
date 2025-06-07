import { Variants, Transition, Variant } from 'framer-motion';

// Custom type for page transitions
interface PageTransitionVariant extends Record<string, Variant> {
  initial: Variant;
  animate: Variant;
  exit: Variant;
}

// Common transitions
export const transition: Transition = {
  type: 'spring',
  damping: 20,
  stiffness: 100,
  mass: 0.5,
};

// Stagger container configuration
interface StaggerContainerProps {
  staggerChildren?: number;
  delayChildren?: number;
  initialOpacity?: number;
  staggerDirection?: number;
  duration?: number;
}

// Stagger container with configurable options
export const staggerContainer = ({
  staggerChildren = 0.1,
  delayChildren = 0,
  initialOpacity = 0,
  staggerDirection = 1,
  duration = 0.5
}: StaggerContainerProps = {}): Variants => {
  const variants: Variants = {
    hidden: { 
      opacity: initialOpacity,
      transition: {
        when: 'afterChildren'
      } 
    },
    visible: {
      opacity: 1,
      transition: {
        when: 'beforeChildren',
        staggerChildren,
        delayChildren,
        staggerDirection,
        duration,
      },
    },
  };
  
  // Add index signature to satisfy Variants type
  (variants as any)[''] = {};
  return variants;
};

// Stagger item animation
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      ...transition,
    },
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      ...transition,
    }
  }
};

// Page transitions
export const pageTransitions: PageTransitionVariant = {
  initial: { 
    opacity: 0, 
    y: 20,
    transition: {
      ...transition,
      duration: 0.3
    }
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      ...transition,
      duration: 0.5
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      ...transition,
      duration: 0.3
    }
  }
};

// Fade in/out transitions
export const fadeInOut: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeInOut'
    }
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeInOut'
    }
  }
};

// Slide in/out transitions
export const slideInOut = (direction: 'left' | 'right' | 'up' | 'down' = 'left'): Variants => {
  const distance = 20;
  const directionMap = {
    left: { x: -distance },
    right: { x: distance },
    up: { y: -distance },
    down: { y: distance },
  };

  return {
    initial: { ...directionMap[direction], opacity: 0 },
    animate: { 
      x: 0, 
      y: 0, 
      opacity: 1,
      transition: {
        ...transition,
        duration: 0.4
      }
    },
    exit: { 
      ...directionMap[direction], 
      opacity: 0,
      transition: {
        ...transition,
        duration: 0.3
      }
    }
  };
};

// Button hover/active states
export const buttonHover = {
  scale: 1.02,
  transition: {
    type: 'spring',
    stiffness: 400,
    damping: 10
  }
};

export const buttonTap = {
  scale: 0.98,
  transition: {
    type: 'spring',
    stiffness: 400,
    damping: 10
  }
};

// Card hover/active states
export const cardHover = {
  y: -4,
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  transition: {
    type: 'spring',
    stiffness: 300,
    damping: 15
  }
};

export const cardTap = {
  scale: 0.98,
  transition: {
    type: 'spring',
    stiffness: 500,
    damping: 15
  }
};

// Loading animations
export const shimmerAnimation = {
  background: 'linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
};

// Keyframes for animations
export const keyframes = `
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

// For reduced motion preferences
export const reducedMotionConfig = {
  transition: { duration: 0.001 },
  variants: {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 1 }
  }
};

// Fade animations
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { ...transition, duration: 0.3 }
  },
  exit: { opacity: 0 }
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { ...transition, duration: 0.5 }
  },
  exit: { opacity: 0, y: -20 }
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { ...transition, duration: 0.5 }
  },
  exit: { opacity: 0, y: 20 }
};

// Slide animations
export const slideInRight: Variants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { 
    x: 0,
    opacity: 1,
    transition: { 
      ...transition,
      stiffness: 300,
      damping: 30
    }
  },
  exit: { 
    x: '100%',
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

// Scale animations
export const scaleUp: Variants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { ...transition, duration: 0.3 }
  },
  exit: { scale: 0.95, opacity: 0 }
};

// Hover and interaction animations
export const hoverScale = {
  scale: 1.03,
  transition: { duration: 0.2 }
};

export const tapScale = {
  scale: 0.98,
  transition: { duration: 0.1 }
};

// Loading animations
export const spinTransition: Transition = {
  loop: Infinity,
  ease: "linear",
  duration: 1
};

export const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut'
  }
};

// Modal and overlay animations
export const modalOverlay = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.1 }
  }
};

export const modalContent = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.98
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      ...transition,
      type: 'spring',
      damping: 25,
      stiffness: 400
    }
  },
  exit: { 
    opacity: 0, 
    y: 20,
    transition: { duration: 0.2 }
  }
};
