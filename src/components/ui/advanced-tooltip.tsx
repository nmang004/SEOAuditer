'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { designTokens } from '@/lib/design-tokens';
import { aria, motionPreferences, screenReader } from '@/lib/accessibility-utils';

export type TooltipPlacement = 
  | 'top' 
  | 'top-start' 
  | 'top-end'
  | 'bottom' 
  | 'bottom-start' 
  | 'bottom-end'
  | 'left' 
  | 'left-start' 
  | 'left-end'
  | 'right' 
  | 'right-start' 
  | 'right-end';

export type TooltipTrigger = 'hover' | 'click' | 'focus' | 'manual';

interface TooltipPosition {
  x: number;
  y: number;
  placement: TooltipPlacement;
}

interface AdvancedTooltipProps {
  children: React.ReactElement;
  content: React.ReactNode;
  placement?: TooltipPlacement;
  trigger?: TooltipTrigger | TooltipTrigger[];
  delay?: number;
  hideDelay?: number;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  arrowClassName?: string;
  offset?: number;
  crossAxisOffset?: number;
  boundaryPadding?: number;
  fallbackPlacements?: TooltipPlacement[];
  portal?: boolean;
  onOpenChange?: (open: boolean) => void;
  maxWidth?: number;
  interactive?: boolean;
  showArrow?: boolean;
  animation?: 'fade' | 'scale' | 'shift' | 'none';
  zIndex?: number;
}

export function AdvancedTooltip({
  children,
  content,
  placement = 'top',
  trigger = 'hover',
  delay = 500,
  hideDelay = 0,
  disabled = false,
  className,
  contentClassName,
  arrowClassName,
  offset = 8,
  crossAxisOffset = 0,
  boundaryPadding = 8,
  fallbackPlacements = ['top', 'bottom', 'left', 'right'],
  portal = true,
  onOpenChange,
  maxWidth = 320,
  interactive = false,
  showArrow = true,
  animation = 'fade',
  zIndex = designTokens.zIndex.tooltip,
}: AdvancedTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({ x: 0, y: 0, placement });
  const [mounted, setMounted] = useState(false);
  
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const delayTimer = useRef<NodeJS.Timeout>();
  const hideTimer = useRef<NodeJS.Timeout>();
  
  const tooltipId = aria.generateId('tooltip');
  const triggers = Array.isArray(trigger) ? trigger : [trigger];

  // Mount state for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Calculate optimal position with collision detection
  const calculatePosition = useCallback((): TooltipPosition => {
    if (!triggerRef.current || !tooltipRef.current) {
      return { x: 0, y: 0, placement };
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const positions: Record<TooltipPlacement, { x: number; y: number }> = {
      'top': {
        x: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2 + crossAxisOffset,
        y: triggerRect.top - tooltipRect.height - offset,
      },
      'top-start': {
        x: triggerRect.left + crossAxisOffset,
        y: triggerRect.top - tooltipRect.height - offset,
      },
      'top-end': {
        x: triggerRect.right - tooltipRect.width - crossAxisOffset,
        y: triggerRect.top - tooltipRect.height - offset,
      },
      'bottom': {
        x: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2 + crossAxisOffset,
        y: triggerRect.bottom + offset,
      },
      'bottom-start': {
        x: triggerRect.left + crossAxisOffset,
        y: triggerRect.bottom + offset,
      },
      'bottom-end': {
        x: triggerRect.right - tooltipRect.width - crossAxisOffset,
        y: triggerRect.bottom + offset,
      },
      'left': {
        x: triggerRect.left - tooltipRect.width - offset,
        y: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2 + crossAxisOffset,
      },
      'left-start': {
        x: triggerRect.left - tooltipRect.width - offset,
        y: triggerRect.top + crossAxisOffset,
      },
      'left-end': {
        x: triggerRect.left - tooltipRect.width - offset,
        y: triggerRect.bottom - tooltipRect.height - crossAxisOffset,
      },
      'right': {
        x: triggerRect.right + offset,
        y: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2 + crossAxisOffset,
      },
      'right-start': {
        x: triggerRect.right + offset,
        y: triggerRect.top + crossAxisOffset,
      },
      'right-end': {
        x: triggerRect.right + offset,
        y: triggerRect.bottom - tooltipRect.height - crossAxisOffset,
      },
    };

    // Check if placement fits in viewport
    const fitsInViewport = (pos: { x: number; y: number }): boolean => {
      return (
        pos.x >= boundaryPadding &&
        pos.y >= boundaryPadding &&
        pos.x + tooltipRect.width <= viewport.width - boundaryPadding &&
        pos.y + tooltipRect.height <= viewport.height - boundaryPadding
      );
    };

    // Try preferred placement first
    let bestPlacement = placement;
    let bestPosition = positions[placement];

    if (!fitsInViewport(bestPosition)) {
      // Try fallback placements
      for (const fallback of fallbackPlacements) {
        const fallbackPosition = positions[fallback];
        if (fitsInViewport(fallbackPosition)) {
          bestPlacement = fallback;
          bestPosition = fallbackPosition;
          break;
        }
      }
    }

    // Constrain to viewport if still outside
    bestPosition.x = Math.max(
      boundaryPadding,
      Math.min(bestPosition.x, viewport.width - tooltipRect.width - boundaryPadding)
    );
    bestPosition.y = Math.max(
      boundaryPadding,
      Math.min(bestPosition.y, viewport.height - tooltipRect.height - boundaryPadding)
    );

    return {
      x: bestPosition.x,
      y: bestPosition.y,
      placement: bestPlacement,
    };
  }, [placement, offset, crossAxisOffset, boundaryPadding, fallbackPlacements]);

  // Update position when tooltip becomes visible
  useEffect(() => {
    if (isOpen && tooltipRef.current) {
      const newPosition = calculatePosition();
      setPosition(newPosition);
    }
  }, [isOpen, calculatePosition]);

  // Handle window resize and scroll
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (tooltipRef.current) {
        const newPosition = calculatePosition();
        setPosition(newPosition);
      }
    };

    const handleResize = () => updatePosition();
    const handleScroll = () => updatePosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, calculatePosition]);

  const showTooltip = useCallback(() => {
    if (disabled) return;

    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = undefined;
    }

    if (delayTimer.current) {
      clearTimeout(delayTimer.current);
    }

    delayTimer.current = setTimeout(() => {
      setIsOpen(true);
      onOpenChange?.(true);
      
      // Announce to screen reader for keyboard users
      if (document.activeElement === triggerRef.current) {
        screenReader.announce(typeof content === 'string' ? content : 'Tooltip opened', 'polite');
      }
    }, delay);
  }, [disabled, delay, content, onOpenChange]);

  const hideTooltip = useCallback(() => {
    if (delayTimer.current) {
      clearTimeout(delayTimer.current);
      delayTimer.current = undefined;
    }

    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }

    hideTimer.current = setTimeout(() => {
      setIsOpen(false);
      onOpenChange?.(false);
    }, hideDelay);
  }, [hideDelay, onOpenChange]);

  const handleMouseEnter = useCallback(() => {
    if (triggers.includes('hover')) {
      showTooltip();
    }
  }, [triggers, showTooltip]);

  const handleMouseLeave = useCallback(() => {
    if (triggers.includes('hover') && !interactive) {
      hideTooltip();
    }
  }, [triggers, interactive, hideTooltip]);

  const handleFocus = useCallback(() => {
    if (triggers.includes('focus')) {
      showTooltip();
    }
  }, [triggers, showTooltip]);

  const handleBlur = useCallback(() => {
    if (triggers.includes('focus')) {
      hideTooltip();
    }
  }, [triggers, hideTooltip]);

  const handleClick = useCallback(() => {
    if (triggers.includes('click')) {
      if (isOpen) {
        hideTooltip();
      } else {
        showTooltip();
      }
    }
  }, [triggers, isOpen, showTooltip, hideTooltip]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideTooltip();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hideTooltip]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (delayTimer.current) clearTimeout(delayTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  // Clone trigger element with event handlers
  const triggerElement = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onClick: handleClick,
    'aria-describedby': isOpen ? tooltipId : undefined,
  });

  // Animation variants
  const animationVariants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.8 },
    },
    shift: {
      initial: { 
        opacity: 0, 
        y: position.placement.startsWith('top') ? 10 : position.placement.startsWith('bottom') ? -10 : 0,
        x: position.placement.startsWith('left') ? 10 : position.placement.startsWith('right') ? -10 : 0,
      },
      animate: { opacity: 1, y: 0, x: 0 },
      exit: { 
        opacity: 0,
        y: position.placement.startsWith('top') ? 10 : position.placement.startsWith('bottom') ? -10 : 0,
        x: position.placement.startsWith('left') ? 10 : position.placement.startsWith('right') ? -10 : 0,
      },
    },
    none: {
      initial: {},
      animate: {},
      exit: {},
    },
  };

  // Arrow positioning
  const getArrowStyle = (): React.CSSProperties => {
    const arrowSize = 6;
    const { placement: finalPlacement } = position;

    const styles: React.CSSProperties = {
      position: 'absolute',
      width: 0,
      height: 0,
      borderStyle: 'solid',
    };

    if (finalPlacement.startsWith('top')) {
      styles.bottom = -arrowSize;
      styles.borderWidth = `${arrowSize}px ${arrowSize}px 0 ${arrowSize}px`;
      styles.borderColor = 'currentColor transparent transparent transparent';
      
      if (finalPlacement === 'top-start') styles.left = 12;
      else if (finalPlacement === 'top-end') styles.right = 12;
      else styles.left = '50%';
      if (finalPlacement === 'top') styles.transform = 'translateX(-50%)';
    } else if (finalPlacement.startsWith('bottom')) {
      styles.top = -arrowSize;
      styles.borderWidth = `0 ${arrowSize}px ${arrowSize}px ${arrowSize}px`;
      styles.borderColor = 'transparent transparent currentColor transparent';
      
      if (finalPlacement === 'bottom-start') styles.left = 12;
      else if (finalPlacement === 'bottom-end') styles.right = 12;
      else styles.left = '50%';
      if (finalPlacement === 'bottom') styles.transform = 'translateX(-50%)';
    } else if (finalPlacement.startsWith('left')) {
      styles.right = -arrowSize;
      styles.borderWidth = `${arrowSize}px 0 ${arrowSize}px ${arrowSize}px`;
      styles.borderColor = 'transparent transparent transparent currentColor';
      
      if (finalPlacement === 'left-start') styles.top = 12;
      else if (finalPlacement === 'left-end') styles.bottom = 12;
      else styles.top = '50%';
      if (finalPlacement === 'left') styles.transform = 'translateY(-50%)';
    } else if (finalPlacement.startsWith('right')) {
      styles.left = -arrowSize;
      styles.borderWidth = `${arrowSize}px ${arrowSize}px ${arrowSize}px 0`;
      styles.borderColor = 'transparent currentColor transparent transparent';
      
      if (finalPlacement === 'right-start') styles.top = 12;
      else if (finalPlacement === 'right-end') styles.bottom = 12;
      else styles.top = '50%';
      if (finalPlacement === 'right') styles.transform = 'translateY(-50%)';
    }

    return styles;
  };

  const tooltipContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className={cn(
            'absolute text-sm text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-md px-3 py-2 shadow-lg pointer-events-none',
            interactive && 'pointer-events-auto',
            contentClassName
          )}
          style={{
            left: position.x,
            top: position.y,
            maxWidth,
            zIndex,
          }}
          variants={animationVariants[animation]}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{
            duration: motionPreferences.prefersReducedMotion() ? 0 : 0.15,
            ease: 'easeOut',
          }}
          onMouseEnter={interactive ? () => {
            if (hideTimer.current) {
              clearTimeout(hideTimer.current);
              hideTimer.current = undefined;
            }
          } : undefined}
          onMouseLeave={interactive ? hideTooltip : undefined}
        >
          {content}
          {showArrow && (
            <div
              className={cn('text-gray-900 dark:text-gray-100', arrowClassName)}
              style={getArrowStyle()}
              aria-hidden="true"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <span className={className}>
        {triggerElement}
      </span>
      {mounted && portal ? createPortal(tooltipContent, document.body) : tooltipContent}
    </>
  );
}

// Simplified tooltip for common use cases
export function Tooltip({
  children,
  content,
  ...props
}: Pick<AdvancedTooltipProps, 'children' | 'content' | 'placement' | 'disabled'>) {
  return (
    <AdvancedTooltip
      {...props}
      content={content}
      trigger="hover"
      delay={700}
      placement={props.placement || 'top'}
    >
      {children}
    </AdvancedTooltip>
  );
} 