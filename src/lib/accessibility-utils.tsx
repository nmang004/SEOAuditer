// Accessibility utilities for WCAG 2.1 AA compliance
import { useEffect, useRef, MutableRefObject } from 'react';
import React from 'react';
import { a11y } from './design-tokens';

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
      .includes(event.key as any),
  isNavigationKey: (event: KeyboardEvent) =>
    [keyboard.keys.ARROW_UP, keyboard.keys.ARROW_DOWN, keyboard.keys.HOME, keyboard.keys.END]
      .includes(event.key as any),

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

// Motion preferences
export const motionPreferences = {
  // Check if user prefers reduced motion
  prefersReducedMotion: (): boolean => {
    if (typeof window === 'undefined') return false;
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

// Screen reader only component
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <span
      className="sr-only"
      aria-live="polite"
    >
      {children}
    </span>
  );
};

// Skip link component
export const SkipLink: React.FC<{ href: string; children: React.ReactNode }> = ({ 
  href, 
  children 
}) => {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:shadow-lg"
      style={{
        position: 'absolute',
        left: '-10000px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
      onFocus={(e) => {
        e.target.style.position = 'absolute';
        e.target.style.left = '16px';
        e.target.style.top = '16px';
        e.target.style.width = 'auto';
        e.target.style.height = 'auto';
        e.target.style.overflow = 'visible';
      }}
      onBlur={(e) => {
        e.target.style.position = 'absolute';
        e.target.style.left = '-10000px';
        e.target.style.top = 'auto';
        e.target.style.width = '1px';
        e.target.style.height = '1px';
        e.target.style.overflow = 'hidden';
      }}
    >
      {children}
    </a>
  );
}; 