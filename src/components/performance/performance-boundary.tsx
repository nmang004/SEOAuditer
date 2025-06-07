'use client';

import { Component, ErrorInfo, ReactNode, Suspense } from 'react';
import { usePerformance } from '@/hooks/use-performance';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface PerformanceBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, componentStack: string | null) => void;
  name: string;
  /** Whether to show a loading state while the component mounts */
  showLoadingState?: boolean;
  /** Whether to track performance metrics for this boundary */
  trackPerformance?: boolean;
  /** Threshold in milliseconds for performance warnings */
  warningThreshold?: number;
}

interface PerformanceBoundaryState {
  hasError: boolean;
  error: Error | null;
  loading: boolean;
  performanceMetrics: {
    mountTime: number | null;
    renderTime: number | null;
    lastErrorTime: number | null;
  };
}

export class PerformanceBoundary extends Component<PerformanceBoundaryProps, PerformanceBoundaryState> {
  private startTime: number = 0;
  private mountStartTime: number = 0;
  private renderStartTime: number = 0;
  private performanceObserver: PerformanceObserver | null = null;

  static defaultProps = {
    showLoadingState: true,
    trackPerformance: true,
    warningThreshold: 100, // 100ms
  };

  constructor(props: PerformanceBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      loading: true,
      performanceMetrics: {
        mountTime: null,
        renderTime: null,
        lastErrorTime: null,
      },
    };
  }

  componentDidMount() {
    this.mountStartTime = performance.now();
    
    if (this.props.trackPerformance) {
      this.setupPerformanceTracking();
    }
    
    // Simulate loading if needed
    if (this.props.showLoadingState) {
      this.setState({ loading: false });
    }
  }

  componentWillUnmount() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }

  private setupPerformanceTracking() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure') {
            console.debug(`[PerformanceBoundary:${this.props.name}] ${entry.name}: ${entry.duration.toFixed(2)}ms`);
            
            // Check for slow renders
            if (entry.duration > (this.props.warningThreshold || 100)) {
              console.warn(
                `[PerformanceBoundary:${this.props.name}] Slow ${entry.name} detected: ${entry.duration.toFixed(2)}ms`
              );
            }
          }
        });
      });

      this.performanceObserver.observe({ entryTypes: ['measure'] });
    }
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      error,
      loading: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    const componentStack = errorInfo?.componentStack || null;
    
    // Update state with error info
    this.setState({
      hasError: true,
      error,
      loading: false,
      performanceMetrics: {
        ...this.state.performanceMetrics,
        lastErrorTime: performance.now(),
      },
    });

    // Log error
    console.error(`[PerformanceBoundary:${this.props.name}] Error:`, error);
    console.error(`[PerformanceBoundary:${this.props.name}] Component Stack:`, componentStack);

    // Call custom error handler if provided
    if (onError) {
      onError(error, componentStack);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      loading: true,
    });

    // Reset loading state after a short delay
    setTimeout(() => {
      this.setState({ loading: false });
    }, 300);
  };

  render() {
    const { children, fallback, showLoadingState, name } = this.props;
    const { hasError, error, loading } = this.state;

    // Show error boundary fallback
    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="p-4 border border-destructive/30 rounded-lg bg-destructive/5">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="mb-4">
              An error occurred in the {name} component.
            </AlertDescription>
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleRetry}
                className="gap-2"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          </Alert>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-xs">
              <summary className="cursor-pointer text-muted-foreground">Error details</summary>
              <pre className="mt-2 p-2 bg-muted/50 rounded overflow-auto max-h-40">
                {error?.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    // Show loading state if needed
    if (showLoadingState && loading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      );
    }

    // Wrap children in a Suspense boundary for async operations
    return (
      <Suspense
        fallback={
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        }
      >
        {children}
      </Suspense>
    );
  }
}

// Helper component for function components
export function withPerformanceBoundary<P>(
  Component: React.ComponentType<P>,
  options: Omit<PerformanceBoundaryProps, 'children'>
) {
  return function WithPerformanceBoundary(props: P) {
    return (
      <PerformanceBoundary {...options}>
        <Component {...(props as any)} />
      </PerformanceBoundary>
    );
  };
}
