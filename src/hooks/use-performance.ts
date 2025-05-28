import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  fps: number;
  frameCount: number;
  averageFrameTime: number;
  maxFrameTime: number;
  minFrameTime: number;
  jank: number;
}

interface UsePerformanceOptions {
  /** How often to calculate metrics in milliseconds */
  interval?: number;
  /** Callback when metrics are calculated */
  onMetrics?: (metrics: PerformanceMetrics) => void;
  /** Whether to enable monitoring */
  enabled?: boolean;
}

const DEFAULT_INTERVAL = 1000; // 1 second
const FRAME_BUDGET = 16; // 60fps = ~16ms per frame

export function usePerformance({
  interval = DEFAULT_INTERVAL,
  onMetrics,
  enabled = true,
}: UsePerformanceOptions = {}) {
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const frameTimesRef = useRef<number[]>([]);
  const jankCountRef = useRef(0);
  const animationFrameRef = useRef<number>();
  const lastIntervalRef = useRef(0);
  const isActiveRef = useRef(false);

  const calculateMetrics = useCallback((): PerformanceMetrics => {
    const frameTimes = frameTimesRef.current;
    const totalFrames = frameCountRef.current;
    const jank = jankCountRef.current;

    if (frameTimes.length === 0) {
      return {
        fps: 0,
        frameCount: 0,
        averageFrameTime: 0,
        maxFrameTime: 0,
        minFrameTime: 0,
        jank: 0,
      };
    }

    const totalTime = frameTimes.reduce((sum, time) => sum + time, 0);
    const averageFrameTime = totalTime / frameTimes.length;
    const fps = 1000 / averageFrameTime;
    const maxFrameTime = Math.max(...frameTimes);
    const minFrameTime = Math.min(...frameTimes);

    return {
      fps,
      frameCount: totalFrames,
      averageFrameTime,
      maxFrameTime,
      minFrameTime,
      jank,
    };
  }, []);

  const resetMetrics = useCallback(() => {
    frameCountRef.current = 0;
    frameTimesRef.current = [];
    jankCountRef.current = 0;
    lastFrameTimeRef.current = performance.now();
    lastIntervalRef.current = lastFrameTimeRef.current;
  }, []);

  const checkFrame = useCallback(
    (timestamp: number) => {
      if (!isActiveRef.current) return;

      // Calculate time since last frame
      const now = performance.now();
      const delta = now - lastFrameTimeRef.current;
      
      // Track frame time
      if (delta > 0) {
        frameCountRef.current++;
        frameTimesRef.current.push(delta);
        
        // Track jank (frames that took more than 2x the frame budget)
        if (delta > FRAME_BUDGET * 2) {
          jankCountRef.current++;
        }
      }

      // Calculate metrics at the specified interval
      if (now - lastIntervalRef.current >= interval) {
        const metrics = calculateMetrics();
        onMetrics?.(metrics);
        
        // Reset for next interval
        resetMetrics();
        lastIntervalRef.current = now;
      }

      lastFrameTimeRef.current = now;
      animationFrameRef.current = requestAnimationFrame(checkFrame);
    },
    [calculateMetrics, interval, onMetrics, resetMetrics]
  );

  const startMonitoring = useCallback(() => {
    if (isActiveRef.current) return;
    
    isActiveRef.current = true;
    resetMetrics();
    lastIntervalRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(checkFrame);
  }, [checkFrame, resetMetrics]);

  const stopMonitoring = useCallback(() => {
    if (!isActiveRef.current) return;
    
    isActiveRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
  }, []);

  // Handle mount/unmount
  useEffect(() => {
    if (enabled) {
      startMonitoring();
    }
    
    return () => {
      stopMonitoring();
    };
  }, [enabled, startMonitoring, stopMonitoring]);

  // Handle enabled state changes
  useEffect(() => {
    if (enabled) {
      startMonitoring();
    } else {
      stopMonitoring();
    }
  }, [enabled, startMonitoring, stopMonitoring]);

  return {
    start: startMonitoring,
    stop: stopMonitoring,
    reset: resetMetrics,
    getMetrics: calculateMetrics,
  };
}
