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

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' = 'light') {
  if (typeof window === 'undefined' || !('vibrate' in window.navigator)) return;
  switch (type) {
    case 'light':
      window.navigator.vibrate(10);
      break;
    case 'medium':
      window.navigator.vibrate([20, 10, 20]);
      break;
    case 'heavy':
      window.navigator.vibrate([40, 20, 40]);
      break;
    case 'success':
      window.navigator.vibrate([20, 10, 40]);
      break;
    default:
      window.navigator.vibrate(10);
  }
}
