import { useEffect, useRef, MutableRefObject } from 'react';
import { usePerformanceContext } from '@/contexts/performance-context';

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
  const { settings: { reducedMotion: isReducedMotion } } = usePerformanceContext();
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
  const { settings: { reducedMotion: isReducedMotion } } = usePerformanceContext();

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
  const { settings: { reducedMotion: isReducedMotion } } = usePerformanceContext();
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
  const { settings: { reducedMotion: isReducedMotion } } = usePerformanceContext();
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
