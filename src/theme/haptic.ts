/**
 * Haptic feedback utilities for touch interactions
 */
export const haptic = {
  light: () => {
    if (typeof window !== 'undefined' && 'vibrate' in window.navigator) {
      window.navigator.vibrate?.(10);
    }
  },
  medium: () => {
    if (typeof window !== 'undefined' && 'vibrate' in window.navigator) {
      window.navigator.vibrate?.(30);
    }
  },
  heavy: () => {
    if (typeof window !== 'undefined' && 'vibrate' in window.navigator) {
      window.navigator.vibrate?.(50);
    }
  },
};
