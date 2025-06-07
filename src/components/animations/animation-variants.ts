// Animation variants for use with Framer Motion
// Page transitions
export const pageTransitions = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } },
};

// Staggered container for list animations
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Staggered item for list animations
export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
};

// Loading state animation
export const loadingState = {
  initial: { opacity: 0.5 },
  animate: { opacity: 1, transition: { yoyo: Infinity, duration: 0.8 } },
};

// Error state animation
export const errorState = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

// Success confirmation animation
export const successState = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, scale: 1.1, transition: { duration: 0.2 } },
}; 