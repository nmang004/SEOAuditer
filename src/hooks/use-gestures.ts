'use client';

import { useRef, useEffect, useCallback } from 'react';

interface TouchPosition {
  x: number;
  y: number;
}

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventScroll?: boolean;
}

interface PinchConfig {
  onPinchStart?: (scale: number) => void;
  onPinchMove?: (scale: number, delta: number) => void;
  onPinchEnd?: (scale: number) => void;
}

interface LongPressConfig {
  onLongPress?: (e: TouchEvent | MouseEvent) => void;
  delay?: number;
  threshold?: number;
}

interface GestureConfig extends SwipeConfig, PinchConfig, LongPressConfig {
  onTap?: (e: TouchEvent | MouseEvent) => void;
  onDoubleTap?: (e: TouchEvent | MouseEvent) => void;
  doubleTapDelay?: number;
}

export function useGestures<T extends HTMLElement>(config: GestureConfig) {
  const ref = useRef<T>(null);
  const gestureState = useRef({
    isTouch: false,
    startTime: 0,
    startPosition: { x: 0, y: 0 } as TouchPosition,
    lastPosition: { x: 0, y: 0 } as TouchPosition,
    distance: 0,
    scale: 1,
    initialDistance: 0,
    longPressTimer: null as NodeJS.Timeout | null,
    tapCount: 0,
    lastTapTime: 0,
  });

  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinchStart,
    onPinchMove,
    onPinchEnd,
    onLongPress,
    onTap,
    onDoubleTap,
    threshold = 50,
    delay = 500,
    doubleTapDelay = 300,
    preventScroll = false,
  } = config;

  const getDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getPosition = useCallback((e: TouchEvent | MouseEvent): TouchPosition => {
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    } else {
      return {
        x: e.clientX,
        y: e.clientY,
      };
    }
  }, []);

  const clearLongPressTimer = useCallback(() => {
    if (gestureState.current.longPressTimer) {
      clearTimeout(gestureState.current.longPressTimer);
      gestureState.current.longPressTimer = null;
    }
  }, []);

  const handleStart = useCallback((e: TouchEvent | MouseEvent) => {
    gestureState.current.isTouch = 'touches' in e;
    gestureState.current.startTime = Date.now();
    gestureState.current.startPosition = getPosition(e);
    gestureState.current.lastPosition = gestureState.current.startPosition;

    if ('touches' in e && e.touches.length === 2) {
      // Pinch gesture
      gestureState.current.initialDistance = getDistance(e.touches[0], e.touches[1]);
      gestureState.current.scale = 1;
      onPinchStart?.(1);
    } else {
      // Long press detection
      if (onLongPress) {
        gestureState.current.longPressTimer = setTimeout(() => {
          onLongPress(e);
          gestureState.current.longPressTimer = null;
        }, delay);
      }
    }

    if (preventScroll && 'touches' in e) {
      e.preventDefault();
    }
  }, [getPosition, getDistance, onPinchStart, onLongPress, delay, preventScroll]);

  const handleMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (!gestureState.current.isTouch && !('touches' in e)) return;

    const currentPosition = getPosition(e);
    gestureState.current.lastPosition = currentPosition;

    if ('touches' in e && e.touches.length === 2 && gestureState.current.initialDistance > 0) {
      // Pinch gesture
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / gestureState.current.initialDistance;
      const delta = scale - gestureState.current.scale;
      gestureState.current.scale = scale;
      onPinchMove?.(scale, delta);
    } else {
      // Check if movement exceeds threshold (cancels long press)
      const deltaX = Math.abs(currentPosition.x - gestureState.current.startPosition.x);
      const deltaY = Math.abs(currentPosition.y - gestureState.current.startPosition.y);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > (threshold / 2)) {
        clearLongPressTimer();
      }
    }

    if (preventScroll && 'touches' in e) {
      e.preventDefault();
    }
  }, [getPosition, getDistance, onPinchMove, clearLongPressTimer, threshold, preventScroll]);

  const handleEnd = useCallback((e: TouchEvent | MouseEvent) => {
    clearLongPressTimer();

    const endTime = Date.now();
    const duration = endTime - gestureState.current.startTime;
    const endPosition = gestureState.current.lastPosition;

    // Calculate swipe direction and distance
    const deltaX = endPosition.x - gestureState.current.startPosition.x;
    const deltaY = endPosition.y - gestureState.current.startPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Handle pinch end
    if ('changedTouches' in e && gestureState.current.scale !== 1) {
      onPinchEnd?.(gestureState.current.scale);
      gestureState.current.scale = 1;
      gestureState.current.initialDistance = 0;
      return;
    }

    // Handle swipe gestures
    if (distance > threshold && duration < 1000) {
      const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
      
      if (Math.abs(angle) <= 45) {
        // Right swipe
        onSwipeRight?.();
      } else if (Math.abs(angle) >= 135) {
        // Left swipe
        onSwipeLeft?.();
      } else if (angle > 45 && angle < 135) {
        // Down swipe
        onSwipeDown?.();
      } else if (angle < -45 && angle > -135) {
        // Up swipe
        onSwipeUp?.();
      }
    } else if (distance < threshold && duration < 300) {
      // Handle tap/double tap
      const now = Date.now();
      
      if (now - gestureState.current.lastTapTime < doubleTapDelay) {
        // Double tap
        gestureState.current.tapCount++;
        if (gestureState.current.tapCount === 2) {
          onDoubleTap?.(e);
          gestureState.current.tapCount = 0;
        }
      } else {
        // Single tap (delayed to detect double tap)
        gestureState.current.tapCount = 1;
        setTimeout(() => {
          if (gestureState.current.tapCount === 1) {
            onTap?.(e);
          }
          gestureState.current.tapCount = 0;
        }, doubleTapDelay);
      }
      
      gestureState.current.lastTapTime = now;
    }

    // Reset state
    gestureState.current.isTouch = false;
    gestureState.current.startTime = 0;
  }, [
    clearLongPressTimer,
    threshold,
    onPinchEnd,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    doubleTapDelay,
  ]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Touch events
    element.addEventListener('touchstart', handleStart, { passive: !preventScroll });
    element.addEventListener('touchmove', handleMove, { passive: !preventScroll });
    element.addEventListener('touchend', handleEnd, { passive: true });

    // Mouse events (for testing on desktop)
    element.addEventListener('mousedown', handleStart);
    element.addEventListener('mousemove', handleMove);
    element.addEventListener('mouseup', handleEnd);

    return () => {
      clearLongPressTimer();
      
      element.removeEventListener('touchstart', handleStart);
      element.removeEventListener('touchmove', handleMove);
      element.removeEventListener('touchend', handleEnd);
      element.removeEventListener('mousedown', handleStart);
      element.removeEventListener('mousemove', handleMove);
      element.removeEventListener('mouseup', handleEnd);
    };
  }, [handleStart, handleMove, handleEnd, clearLongPressTimer, preventScroll]);

  return ref;
}

// Simpler hook for just swipe gestures
export function useSwipe<T extends HTMLElement>(config: SwipeConfig) {
  return useGestures<T>(config);
}

// Hook for pull-to-refresh functionality
export function usePullToRefresh<T extends HTMLElement>(
  onRefresh: () => void | Promise<void>,
  threshold: number = 100
) {
  const ref = useRef<T>(null);
  const pullState = useRef({
    startY: 0,
    currentY: 0,
    isPulling: false,
    isRefreshing: false,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      pullState.current.startY = e.touches[0].clientY;
      pullState.current.isPulling = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pullState.current.isPulling || pullState.current.isRefreshing) return;

    pullState.current.currentY = e.touches[0].clientY;
    const pullDistance = pullState.current.currentY - pullState.current.startY;

    if (pullDistance > 0 && window.scrollY === 0) {
      e.preventDefault();
      
      // Visual feedback can be added here
      const element = ref.current;
      if (element) {
        const opacity = Math.min(pullDistance / threshold, 1);
        element.style.transform = `translateY(${Math.min(pullDistance, threshold)}px)`;
        element.style.opacity = (1 - opacity * 0.3).toString();
      }
    }
  }, [threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!pullState.current.isPulling || pullState.current.isRefreshing) return;

    const pullDistance = pullState.current.currentY - pullState.current.startY;
    const element = ref.current;

    if (pullDistance > threshold) {
      pullState.current.isRefreshing = true;
      
      try {
        await onRefresh();
      } finally {
        pullState.current.isRefreshing = false;
      }
    }

    // Reset visual state
    if (element) {
      element.style.transform = '';
      element.style.opacity = '';
    }

    pullState.current.isPulling = false;
    pullState.current.startY = 0;
    pullState.current.currentY = 0;
  }, [threshold, onRefresh]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return ref;
} 