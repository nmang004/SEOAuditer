'use client';

import React from 'react';
import { AnalysisDashboardRouter } from '@/components/dashboard/AnalysisDashboardRouter';

// Error Boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('[ErrorBoundary] Caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Component error:', error, errorInfo);
    // Send to error reporting service
    window.dispatchEvent(new CustomEvent('component-error', { 
      detail: { error: error.message, stack: error.stack, info: errorInfo } 
    }));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          background: '#1f2937',
          border: '2px solid #ef4444',
          borderRadius: '8px',
          color: 'white',
          fontFamily: 'monospace'
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: '10px' }}>🚨 Critical Component Error</h2>
          <p><strong>Error:</strong> {this.state.error?.message || 'Unknown error'}</p>
          <details style={{ marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer', color: '#60a5fa' }}>Stack Trace</summary>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              fontSize: '12px', 
              background: '#111827', 
              padding: '10px', 
              borderRadius: '4px',
              marginTop: '5px',
              overflow: 'auto',
              maxHeight: '200px'
            }}>
              {this.state.error?.stack}
            </pre>
          </details>
          <button 
            onClick={() => this.setState({ hasError: false })}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function AnalysisResultsPage() {
  console.log('[AnalysisResultsPage] Component rendering - START');
  
  // Add global error handler
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('[GlobalError] Uncaught error:', event.error);
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[GlobalError] Unhandled promise rejection:', event.reason);
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  try {
    console.log('[AnalysisResultsPage] About to render components');
    return (
      <div style={{
        minHeight: '100vh',
        padding: '20px',
        background: '#0f172a'
      }}>
        {/* Immediate visibility test */}
        <div style={{
          background: '#16a34a',
          color: 'white',
          padding: '10px',
          margin: '10px 0',
          border: '2px solid #22c55e',
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          ✅ PAGE COMPONENT IS RENDERING - {new Date().toISOString()}
        </div>

        {/* Test basic component import */}
        <div style={{
          background: '#1e40af',
          color: 'white',
          padding: '10px',
          margin: '10px 0',
          border: '2px solid #3b82f6',
          borderRadius: '8px',
          fontSize: '12px'
        }}>
          <p>AnalysisDashboardRouter import: {typeof AnalysisDashboardRouter === 'function' ? '✅ SUCCESS' : '❌ FAILED'}</p>
          <p>React import: {typeof React === 'object' ? '✅ SUCCESS' : '❌ FAILED'}</p>
          <p>Window object: {typeof window === 'object' ? '✅ SUCCESS' : '❌ FAILED'}</p>
        </div>

        {/* Try to render with error boundary */}
        <ErrorBoundary>
          <div style={{
            background: '#7c3aed',
            color: 'white',
            padding: '10px',
            margin: '10px 0',
            border: '2px solid #a855f7',
            borderRadius: '8px',
            fontSize: '12px'
          }}>
            🔄 Attempting to render AnalysisDashboardRouter...
          </div>
          
          <div className="container mx-auto px-4 py-6">
            <AnalysisDashboardRouter />
          </div>
        </ErrorBoundary>

        {/* Success indicator */}
        <div style={{
          background: '#059669',
          color: 'white',
          padding: '10px',
          margin: '10px 0',
          border: '2px solid #10b981',
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: '12px'
        }}>
          ✅ If you see this, the page rendered successfully
        </div>
      </div>
    );
  } catch (error) {
    console.error('[AnalysisResultsPage] Caught error in render:', error);
    return (
      <div style={{
        padding: '20px',
        background: '#ef4444',
        color: 'white',
        fontFamily: 'monospace',
        minHeight: '100vh'
      }}>
        <h1>🚨 CRITICAL RENDER ERROR</h1>
        <p>Error: {error instanceof Error ? error.message : String(error)}</p>
        <p>Stack: {error instanceof Error ? error.stack : 'No stack trace'}</p>
      </div>
    );
  }
}