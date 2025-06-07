import React, { ComponentType, Suspense, lazy as reactLazy, LazyExoticComponent, useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PerformanceBoundary } from '@/components/performance/performance-boundary';

interface LoadableOptions {
  /** Fallback to show while loading */
  fallback?: React.ReactNode;
  /** Component name for debugging */
  name?: string;
  /** Whether to track performance metrics */
  trackPerformance?: boolean;
  /** Whether to wrap with error boundary */
  withErrorBoundary?: boolean;
  /** Whether to use IntersectionObserver to delay loading */
  lazy?: boolean;
  /** IntersectionObserver options */
  intersectionOptions?: IntersectionObserverInit;
}

// Default loading component
const DefaultFallback = () => (
  <div className="space-y-2 p-4">
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
  </div>
);

/**
 * Creates a lazy-loaded component with performance optimizations
 */
export function loadable<P = any>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LoadableOptions = {}
): LazyExoticComponent<ComponentType<P>> {
  const {
    fallback = <DefaultFallback />,
    name = 'UnknownComponent',
    trackPerformance = true,
    withErrorBoundary = true,
    lazy = true,
    intersectionOptions = { rootMargin: '200px', threshold: 0.01 },
  } = options;

  // Create the lazy component
  let LazyComponent = reactLazy(importFn);

  // If lazy loading with IntersectionObserver is enabled
  if (lazy && typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    const LazyWrapper = (props: P) => {
      const [isVisible, setIsVisible] = useState(false);
      const observerRef = useRef<IntersectionObserver | null>(null);
      const elementRef = useRef<HTMLDivElement | null>(null);

      useEffect(() => {
        if (!elementRef.current) return;

        const observer = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        }, intersectionOptions);

        observer.observe(elementRef.current);
        observerRef.current = observer;

        return () => {
          if (observerRef.current) {
            observerRef.current.disconnect();
          }
        };
      }, []);

      if (!isVisible) {
        return <div ref={elementRef} style={{ minHeight: '1px' }} />;
      }

      return <LazyComponent {...(props as any)} />;
    };

    LazyComponent = LazyWrapper as any;
  }

  // Wrap with PerformanceBoundary if tracking is enabled
  if (trackPerformance || withErrorBoundary) {
    const WrappedComponent = (props: P) => (
      <PerformanceBoundary
        name={name}
        trackPerformance={trackPerformance}
        fallback={
          <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <p className="text-sm text-destructive">
              Failed to load {name}. Please refresh the page or try again later.
            </p>
          </div>
        }
      >
        <Suspense fallback={fallback}>
          <LazyComponent {...(props as any)} />
        </Suspense>
      </PerformanceBoundary>
    );

    return WrappedComponent as any;
  }

  // Wrap with Suspense only
  const SuspenseComponent = (props: P) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...(props as any)} />
    </Suspense>
  );

  return SuspenseComponent as any;
}

// Helper function to create named lazy components
export function createLazyComponent<P = any>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  displayName: string,
  options: Omit<LoadableOptions, 'name'> = {}
) {
  const component = loadable(importFn, { ...options, name: displayName });
  // Use Object.defineProperty to safely set displayName on the component
  Object.defineProperty(component, 'displayName', {
    value: displayName,
    writable: false,
    configurable: true
  });
  return component;
}

// Preload function for critical components
export function preload(importFn: () => Promise<{ default: ComponentType<any> }>) {
  return {
    preload: () => importFn(),
    component: (options?: LoadableOptions) => loadable(importFn, options || {}),
  };
}
