import { useEffect, useRef, MutableRefObject } from 'react';
import { a11y } from './design-tokens';

/**
 * Hook to manage keyboard focus within a component
 */
export function useFocusManagement<T extends HTMLElement = HTMLElement>(
  options: {
    /** Whether the focus management is active */
    isActive?: boolean;
    /** Whether to trap focus within the element */
    trapFocus?: boolean;
    /** Callback when focus is set to the element */
    onFocus?: () => void;
    /** Callback when focus leaves the element */
    onBlur?: () => void;
    /** Whether to focus the element on mount */
    autoFocus?: boolean;
  } = {}
): MutableRefObject<T | null> {
  const ref = useRef<T>(null);
  const isReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;
  const {
    isActive = true,
    trapFocus = false,
    onFocus,
    onBlur,
    autoFocus = false,
  } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element || !isActive) return;

    // Focus the element on mount if autoFocus is true
    if (autoFocus) {
      // Use requestAnimationFrame to ensure the element is in the DOM
      requestAnimationFrame(() => {
        if (element) {
          element.focus({ preventScroll: isReducedMotion });
        }
      });
    }

    const handleFocusIn = (e: FocusEvent) => {
      if (onFocus && element.contains(e.target as Node)) {
        onFocus();
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      if (onBlur && !element.contains(e.relatedTarget as Node)) {
        onBlur();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!trapFocus) return;

      const focusableElements = element.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    element.addEventListener('focusin', handleFocusIn);
    element.addEventListener('focusout', handleFocusOut);
    if (trapFocus) {
      element.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      element.removeEventListener('focusin', handleFocusIn);
      element.removeEventListener('focusout', handleFocusOut);
      if (trapFocus) {
        element.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [isActive, trapFocus, onFocus, onBlur, autoFocus, isReducedMotion]);

  return ref;
}

/**
 * Hook to manage keyboard navigation within a component
 */
export function useKeyboardNavigation<T extends HTMLElement = HTMLElement>(
  keyHandlers: Record<string, (e: KeyboardEvent) => void>,
  options: {
    /** Whether the keyboard navigation is active */
    isActive?: boolean;
    /** Whether to prevent default behavior for handled keys */
    preventDefault?: boolean;
    /** Whether to stop propagation for handled keys */
    stopPropagation?: boolean;
    /** The element to attach the event listener to (defaults to document) */
    target?: HTMLElement | Document | Window | null;
  } = {}
): MutableRefObject<T | null> {
  const ref = useRef<T>(null);
  const {
    isActive = true,
    preventDefault = true,
    stopPropagation = false,
    target = typeof document !== 'undefined' ? document : null,
  } = options;

  useEffect(() => {
    if (!isActive || !target) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const handler = keyHandlers[e.key];
      if (handler) {
        if (preventDefault) {
          e.preventDefault();
        }
        if (stopPropagation) {
          e.stopPropagation();
        }
        handler(e);
      }
    };

    target.addEventListener('keydown', handleKeyDown as EventListener);
    return () => {
      target.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [isActive, keyHandlers, preventDefault, stopPropagation, target]);

  return ref;
}

/**
 * Hook to manage focus on mount and cleanup
 */
export function useAutoFocus<T extends HTMLElement = HTMLElement>(
  autoFocus = false,
  options: {
    /** Whether to prevent scroll when focusing */
    preventScroll?: boolean;
  } = {}
): MutableRefObject<T | null> {
  const ref = useRef<T>(null);
  const isReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  useEffect(() => {
    if (autoFocus && ref.current) {
      // Use requestAnimationFrame to ensure the element is in the DOM
      requestAnimationFrame(() => {
        if (ref.current) {
          ref.current.focus({
            preventScroll: options.preventScroll || isReducedMotion,
          });
        }
      });
    }
  }, [autoFocus, options.preventScroll, isReducedMotion]);

  return ref;
}

/**
 * Hook to manage focus when a condition changes
 */
export function useFocusOnChange<T extends HTMLElement = HTMLElement>(
  condition: boolean,
  options: {
    /** Whether to focus the element when the condition becomes true */
    focusOnTrue?: boolean;
    /** Whether to focus the element when the condition becomes false */
    focusOnFalse?: boolean;
    /** Whether to prevent scroll when focusing */
    preventScroll?: boolean;
  } = {}
): MutableRefObject<T | null> {
  const ref = useRef<T>(null);
  const { focusOnTrue = true, focusOnFalse = false, preventScroll = false } = options;
  const isReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;
  const prevConditionRef = useRef<boolean | null>(null);

  useEffect(() => {
    const prevCondition = prevConditionRef.current;
    
    if (prevCondition !== null) {
      if (condition && focusOnTrue && !prevCondition && ref.current) {
        ref.current.focus({ preventScroll: preventScroll || isReducedMotion });
      } else if (!condition && focusOnFalse && prevCondition && ref.current) {
        ref.current.focus({ preventScroll: preventScroll || isReducedMotion });
      }
    }
    
    prevConditionRef.current = condition;
  }, [condition, focusOnFalse, focusOnTrue, preventScroll, isReducedMotion]);

  return ref;
}

/**
 * Hook to manage focus when an element is mounted or unmounted
 */
export function useFocusOnMount<T extends HTMLElement = HTMLElement>(
  isMounted: boolean,
  options: {
    /** Whether to focus the element when mounted */
    focusOnMount?: boolean;
    /** Whether to focus the element when unmounted */
    focusOnUnmount?: boolean;
    /** The element to focus when unmounted */
    unmountFocusRef?: React.RefObject<HTMLElement>;
    /** Whether to prevent scroll when focusing */
    preventScroll?: boolean;
  } = {}
): MutableRefObject<T | null> {
  const ref = useRef<T>(null);
  const {
    focusOnMount = true,
    focusOnUnmount = false,
    unmountFocusRef,
    preventScroll = false,
  } = options;
  const isReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;
  const prevMountedRef = useRef<boolean | null>(null);

  useEffect(() => {
    const prevMounted = prevMountedRef.current;
    
    if (isMounted && focusOnMount && prevMounted === false && ref.current) {
      ref.current.focus({ preventScroll: preventScroll || isReducedMotion });
    } else if (!isMounted && focusOnUnmount && prevMounted === true) {
      if (unmountFocusRef?.current) {
        unmountFocusRef.current.focus({ preventScroll: preventScroll || isReducedMotion });
      } else if (document.activeElement === document.body) {
        // If we're unmounting and focus is on the body, move it to a safe place
        const focusableElements = document.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
          focusableElements[0].focus({ preventScroll: preventScroll || isReducedMotion });
        }
      }
    }
    
    prevMountedRef.current = isMounted;
  }, [isMounted, focusOnMount, focusOnUnmount, unmountFocusRef, preventScroll, isReducedMotion]);

  return ref;
}

// ARIA label utilities
export const ariaLabels = {
  navigation: {
    main: 'Main navigation',
    breadcrumb: 'Breadcrumb navigation',
    pagination: 'Pagination navigation',
    skip: 'Skip to main content',
  },
  actions: {
    close: 'Close',
    open: 'Open',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    expand: 'Expand',
    collapse: 'Collapse',
  },
  status: {
    loading: 'Loading',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
  },
  forms: {
    required: 'Required field',
    optional: 'Optional field',
    invalid: 'Invalid input',
    valid: 'Valid input',
  },
} as const;

// Focus management utilities
export class FocusManager {
  private static focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll(this.focusableSelectors));
  }

  static getFirstFocusableElement(container: HTMLElement): HTMLElement | null {
    const focusable = this.getFocusableElements(container);
    return focusable[0] || null;
  }

  static getLastFocusableElement(container: HTMLElement): HTMLElement | null {
    const focusable = this.getFocusableElements(container);
    return focusable[focusable.length - 1] || null;
  }

  static trapFocus(container: HTMLElement, event: KeyboardEvent) {
    if (event.key !== 'Tab') return;

    const focusable = this.getFocusableElements(container);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  }

  static restoreFocus(previousActiveElement: Element | null) {
    if (previousActiveElement && 'focus' in previousActiveElement) {
      (previousActiveElement as HTMLElement).focus();
    }
  }

  static saveFocus(): Element | null {
    return document.activeElement;
  }
}

// Keyboard event utilities
export const keyboard = {
  // Common key codes
  keys: {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown',
    TAB: 'Tab',
  },

  // Key event helpers
  isEnterKey: (event: KeyboardEvent) => event.key === keyboard.keys.ENTER,
  isSpaceKey: (event: KeyboardEvent) => event.key === keyboard.keys.SPACE,
  isEscapeKey: (event: KeyboardEvent) => event.key === keyboard.keys.ESCAPE,
  isArrowKey: (event: KeyboardEvent) => 
    [keyboard.keys.ARROW_UP, keyboard.keys.ARROW_DOWN, keyboard.keys.ARROW_LEFT, keyboard.keys.ARROW_RIGHT]
      .includes(event.key),
  isNavigationKey: (event: KeyboardEvent) =>
    [keyboard.keys.ARROW_UP, keyboard.keys.ARROW_DOWN, keyboard.keys.HOME, keyboard.keys.END]
      .includes(event.key),

  // Activation helper (Enter or Space)
  isActivationKey: (event: KeyboardEvent) =>
    event.key === keyboard.keys.ENTER || event.key === keyboard.keys.SPACE,
} as const;

// Screen reader utilities
export const screenReader = {
  // Announce to screen reader
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  },

  // Screen reader only text component
  srOnlyStyles: a11y.srOnly,
};

// Color contrast utilities
export const colorContrast = {
  // Calculate relative luminance
  getRelativeLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  // Calculate contrast ratio
  getContrastRatio: (rgb1: [number, number, number], rgb2: [number, number, number]): number => {
    const l1 = colorContrast.getRelativeLuminance(...rgb1);
    const l2 = colorContrast.getRelativeLuminance(...rgb2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  },

  // Check if contrast meets WCAG standards
  meetsContrastStandard: (
    foreground: [number, number, number],
    background: [number, number, number],
    level: 'AA' | 'AAA' = 'AA',
    isLargeText = false
  ): boolean => {
    const ratio = colorContrast.getContrastRatio(foreground, background);
    
    if (level === 'AAA') {
      return isLargeText ? ratio >= 4.5 : ratio >= 7;
    }
    
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  },
};

// Motion preferences
export const motionPreferences = {
  // Check if user prefers reduced motion
  prefersReducedMotion: (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Get animation duration based on preference
  getAnimationDuration: (normalDuration: string): string => {
    return motionPreferences.prefersReducedMotion() ? a11y.reducedMotion.duration : normalDuration;
  },

  // Get animation easing based on preference
  getAnimationEasing: (normalEasing: string): string => {
    return motionPreferences.prefersReducedMotion() ? a11y.reducedMotion.easing : normalEasing;
  },
};

// ARIA helpers
export const aria = {
  // Generate unique IDs for ARIA relationships
  generateId: (prefix = 'id'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // ARIA expanded state helper
  getAriaExpanded: (isExpanded: boolean): 'true' | 'false' => {
    return isExpanded ? 'true' : 'false';
  },

  // ARIA pressed state helper
  getAriaPressed: (isPressed: boolean): 'true' | 'false' => {
    return isPressed ? 'true' : 'false';
  },

  // ARIA selected state helper
  getAriaSelected: (isSelected: boolean): 'true' | 'false' => {
    return isSelected ? 'true' : 'false';
  },

  // ARIA checked state helper
  getAriaChecked: (isChecked: boolean | 'mixed'): 'true' | 'false' | 'mixed' => {
    return isChecked === 'mixed' ? 'mixed' : isChecked ? 'true' : 'false';
  },

  // ARIA disabled state helper
  getAriaDisabled: (isDisabled: boolean): 'true' | 'false' | undefined => {
    return isDisabled ? 'true' : undefined;
  },

  // ARIA current helper
  getAriaCurrent: (
    isCurrent: boolean,
    type: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' = 'page'
  ): string | undefined => {
    return isCurrent ? type : undefined;
  },
};

// Touch target utilities
export const touchTarget = {
  // Check if element meets minimum touch target size
  meetsMinimumSize: (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    const minWidth = parseInt(a11y.minTouchTarget.width);
    const minHeight = parseInt(a11y.minTouchTarget.height);
    
    return rect.width >= minWidth && rect.height >= minHeight;
  },

  // Get recommended padding to meet minimum touch target
  getRecommendedPadding: (element: HTMLElement): { x: number; y: number } => {
    const rect = element.getBoundingClientRect();
    const minWidth = parseInt(a11y.minTouchTarget.width);
    const minHeight = parseInt(a11y.minTouchTarget.height);
    
    const paddingX = Math.max(0, (minWidth - rect.width) / 2);
    const paddingY = Math.max(0, (minHeight - rect.height) / 2);
    
    return { x: paddingX, y: paddingY };
  },
};

// Custom hooks for accessibility
export const useKeyboardNavigation = (
  containerRef: React.RefObject<HTMLElement>,
  options: {
    onEscape?: () => void;
    trapFocus?: boolean;
    autoFocus?: boolean;
  } = {}
) => {
  const { onEscape, trapFocus = false, autoFocus = false } = options;

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Auto focus first element
    if (autoFocus) {
      const firstFocusable = FocusManager.getFirstFocusableElement(container);
      firstFocusable?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle escape key
      if (keyboard.isEscapeKey(event) && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }

      // Handle focus trapping
      if (trapFocus) {
        FocusManager.trapFocus(container, event);
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, onEscape, trapFocus, autoFocus]);
};

// Accessibility testing utilities
export const a11yTest = {
  // Log accessibility issues in development
  logAccessibilityIssues: (element: HTMLElement) => {
    if (process.env.NODE_ENV !== 'development') return;

    const issues: string[] = [];

    // Check for missing alt text on images
    const images = element.querySelectorAll('img');
    images.forEach((img) => {
      if (!img.alt && !img.getAttribute('aria-label')) {
        issues.push(`Image missing alt text: ${img.src}`);
      }
    });

    // Check for interactive elements without accessible names
    const interactive = element.querySelectorAll('button, a, input, select, textarea');
    interactive.forEach((el) => {
      const hasAccessibleName = 
        el.getAttribute('aria-label') ||
        el.getAttribute('aria-labelledby') ||
        el.textContent?.trim() ||
        (el as HTMLInputElement).placeholder;
        
      if (!hasAccessibleName) {
        issues.push(`Interactive element missing accessible name: ${el.tagName}`);
      }
    });

    // Check for headings without proper hierarchy
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > lastLevel + 1) {
        issues.push(`Heading hierarchy skipped: ${heading.tagName} after h${lastLevel}`);
      }
      lastLevel = level;
    });

    if (issues.length > 0) {
      console.warn('Accessibility issues found:', issues);
    }
  },
};
