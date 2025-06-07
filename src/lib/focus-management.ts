import { RefObject, MutableRefObject, useEffect, useRef } from 'react';

interface FocusTrapOptions {
  /** Whether the focus trap is active */
  isActive?: boolean;
  /** Whether to return focus to the previously focused element when the trap is deactivated */
  returnFocusOnDeactivate?: boolean;
  /** Element to focus when the trap is activated */
  initialFocus?: RefObject<HTMLElement> | (() => HTMLElement | null);
  /** Element to focus when the trap is deactivated */
  fallbackFocus?: HTMLElement | (() => HTMLElement | null);
  /** Callback when the trap is activated */
  onActivate?: () => void;
  /** Callback when the trap is deactivated */
  onDeactivate?: () => void;
  /** Whether to prevent scrolling when focusing elements */
  preventScroll?: boolean;
}

/**
 * Get the first and last focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    '[href]:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([disabled]):not([tabindex="-1"])',
    '[contenteditable]:not([contenteditable="false"])',
    'details > summary:first-of-type',
  ].join(',');

  return Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelectors)
  ).filter(
    (el) =>
      el.getAttribute('tabindex') !== '-1' &&
      !el.hasAttribute('disabled') &&
      !el.getAttribute('aria-hidden') &&
      getComputedStyle(el).display !== 'none' &&
      getComputedStyle(el).visibility !== 'hidden' &&
      // Check if element is visible
      el.offsetWidth > 0 &&
      el.offsetHeight > 0
  );
}

/**
 * Get the first focusable element within a container
 */
function getFirstFocusableElement(container: HTMLElement): HTMLElement | null {
  const focusableElements = getFocusableElements(container);
  return focusableElements[0] || null;
}

/**
 * Get the last focusable element within a container
 */
function getLastFocusableElement(container: HTMLElement): HTMLElement | null {
  const focusableElements = getFocusableElements(container);
  return focusableElements[focusableElements.length - 1] || null;
}

/**
 * Hook to trap focus within a container element
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  options: FocusTrapOptions = {}
): MutableRefObject<T | null> {
  const {
    isActive = true,
    returnFocusOnDeactivate = true,
    initialFocus,
    fallbackFocus,
    onActivate,
    onDeactivate,
    preventScroll = false,
  } = options;

  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<Element | null>(null);
  const focusTrapActive = useRef(false);

  // Handle focus trap activation
  useEffect(() => {
    const container = containerRef.current;
    if (!isActive || !container) return;

    // Store the currently focused element to return focus later
    previousActiveElement.current = document.activeElement;

    // Set up the focus trap
    const activateTrap = () => {
      if (focusTrapActive.current) return;

      // Find the first focusable element or use the provided initial focus
      let focusTarget: HTMLElement | null = null;

      if (typeof initialFocus === 'function') {
        focusTarget = initialFocus();
      } else if (initialFocus?.current) {
        focusTarget = initialFocus.current;
      } else {
        focusTarget = getFirstFocusableElement(container);
      }

      // If no focus target was found, use the container itself if it's focusable
      if (!focusTarget && container.hasAttribute('tabindex')) {
        focusTarget = container;
      }

      // Focus the target element
      if (focusTarget) {
        focusTarget.focus({ preventScroll });
      } else if (process.env.NODE_ENV !== 'production') {
        console.warn('No focusable elements found in the focus trap');
      }

      // Add event listeners
      document.addEventListener('focusin', handleFocusIn, true);
      document.addEventListener('keydown', handleKeyDown, true);

      focusTrapActive.current = true;
      onActivate?.();
    };

    // Handle focus events to keep focus within the trap
    const handleFocusIn = (event: FocusEvent) => {
      const container = containerRef.current;
      if (!container || !document.contains(container)) return;

      // If the focused element is outside the container, move focus to the first focusable element
      if (!container.contains(event.target as Node)) {
        const firstFocusable = getFirstFocusableElement(container);
        if (firstFocusable) {
          firstFocusable.focus({ preventScroll });
        } else if (container.hasAttribute('tabindex')) {
          container.focus({ preventScroll });
        }
      }
    };

    // Handle tab key to cycle focus within the trap
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const container = containerRef.current;
      if (!container) return;

      const focusableElements = getFocusableElements(container);
      if (focusableElements.length === 0) return;

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      // If only one focusable element, keep focus there
      if (focusableElements.length === 1) {
        event.preventDefault();
        firstFocusable.focus({ preventScroll });
        return;
      }

      // Handle shift+tab
      if (event.shiftKey) {
        if (activeElement === firstFocusable || !container.contains(activeElement)) {
          event.preventDefault();
          lastFocusable.focus({ preventScroll });
        }
      } 
      // Handle tab
      else {
        if (activeElement === lastFocusable || !container.contains(activeElement)) {
          event.preventDefault();
          firstFocusable.focus({ preventScroll });
        }
      }
    };

    // Clean up the focus trap
    const deactivateTrap = (returnFocus = true) => {
      if (!focusTrapActive.current) return;

      // Remove event listeners
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('keydown', handleKeyDown, true);

      // Return focus to the previously focused element
      if (returnFocus && returnFocusOnDeactivate && previousActiveElement.current) {
        const previousElement = previousActiveElement.current as HTMLElement;
        if (typeof previousElement.focus === 'function') {
          previousElement.focus({ preventScroll });
        }
      }

      focusTrapActive.current = false;
      onDeactivate?.();
    };

    // Activate the focus trap
    activateTrap();

    // Clean up on unmount
    return () => {
      deactivateTrap(returnFocusOnDeactivate);
    };
  }, [
    isActive,
    returnFocusOnDeactivate,
    initialFocus,
    fallbackFocus,
    onActivate,
    onDeactivate,
    preventScroll,
  ]);

  return containerRef;
}

/**
 * Hook to manage focus restoration when a component unmounts
 */
export function useRestoreFocus(
  options: {
    /** Whether to restore focus when the component unmounts */
    restoreFocus?: boolean;
    /** Element to focus when the component unmounts */
    focusElement?: HTMLElement | (() => HTMLElement | null);
    /** Whether to prevent scrolling when focusing the element */
    preventScroll?: boolean;
  } = {}
) {
  const { restoreFocus = true, focusElement, preventScroll = false } = options;
  const previousActiveElement = useRef<Element | null>(null);

  // Store the currently focused element when the component mounts
  useEffect(() => {
    if (restoreFocus) {
      previousActiveElement.current = document.activeElement;
    }

    // Restore focus when the component unmounts
    return () => {
      if (!restoreFocus) return;

      // Use the provided focus element if available
      if (focusElement) {
        const elementToFocus = typeof focusElement === 'function' 
          ? focusElement() 
          : focusElement;
        
        if (elementToFocus && 'focus' in elementToFocus) {
          elementToFocus.focus({ preventScroll });
          return;
        }
      }

      // Otherwise, restore focus to the previously focused element
      const previousElement = previousActiveElement.current as HTMLElement;
      if (
        previousElement &&
        typeof previousElement.focus === 'function' &&
        document.contains(previousElement)
      ) {
        previousElement.focus({ preventScroll });
      } else {
        // Fallback to focusing the body if the previous element is no longer in the DOM
        document.body.focus();
      }
    };
  }, [restoreFocus, focusElement, preventScroll]);

  return {
    /** The previously focused element */
    previousActiveElement: previousActiveElement.current as HTMLElement | null,
  };
}

/**
 * Hook to trap focus within a modal or dialog
 */
export function useModalFocusTrap<T extends HTMLElement = HTMLElement>(
  isOpen: boolean,
  options: Omit<FocusTrapOptions, 'isActive'> & {
    /** Whether to hide content outside the modal from screen readers */
    inertOutside?: boolean;
  } = {}
) {
  const { inertOutside = true, ...focusTrapOptions } = options;
  const containerRef = useFocusTrap<T>({
    ...focusTrapOptions,
    isActive: isOpen,
  });

  // Add inert attribute to elements outside the modal when it's open
  useEffect(() => {
    if (!isOpen || !inertOutside || typeof document === 'undefined') return;

    const root = document.documentElement;
    const mainContent = document.querySelector('main') || document.body;
    const elements = Array.from(document.body.children).filter(
      (child) => child !== containerRef.current && child !== root
    );

    // Save previous inert states
    const previousStates = new Map<Element, string | null>();
    elements.forEach((el) => {
      previousStates.set(el, el.getAttribute('inert'));
      el.setAttribute('inert', '');
    });

    // Ensure the main content is focusable for screen readers
    if (mainContent) {
      mainContent.setAttribute('aria-hidden', 'true');
    }

    // Clean up
    return () => {
      elements.forEach((el) => {
        const previousState = previousStates.get(el);
        if (previousState === null) {
          el.removeAttribute('inert');
        } else if (previousState) {
          el.setAttribute('inert', previousState);
        }
      });

      if (mainContent) {
        mainContent.removeAttribute('aria-hidden');
      }
    };
  }, [isOpen, inertOutside, containerRef]);

  return containerRef;
}
