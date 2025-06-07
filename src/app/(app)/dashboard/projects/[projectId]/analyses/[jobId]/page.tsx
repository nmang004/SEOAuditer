'use client';

import React from 'react';
import { AnalysisDashboardRouter } from '@/components/dashboard/AnalysisDashboardRouter';
import { AnalysisDebugger } from '@/components/debug/AnalysisDebugger';

// Simple Error Boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          background: 'red', 
          color: 'white', 
          padding: '10px', 
          margin: '10px',
          border: '2px solid white'
        }}>
          <h3>🚨 COMPONENT ERROR CAUGHT!</h3>
          <p>Error: {this.state.error?.message || 'Unknown error'}</p>
          <details>
            <summary>Stack trace:</summary>
            <pre style={{ fontSize: '10px', overflow: 'auto' }}>
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function AnalysisResultsPage() {
  console.log('[AnalysisResultsPage] Component rendering');
  
  return (
    <div className="space-y-6" style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(45deg, #ff0000, #00ff00, #0000ff)',
      padding: '20px'
    }}>
      {/* Bright test box to confirm page is rendering */}
      <div style={{
        backgroundColor: '#ff0000',
        color: 'white',
        padding: '20px',
        fontSize: '20px',
        fontWeight: 'bold',
        border: '5px solid #ffff00',
        textAlign: 'center'
      }}>
        🚨 ANALYSIS RESULTS PAGE IS RENDERING - IF YOU SEE THIS, THE PAGE COMPONENT WORKS
      </div>

      {/* Test if components can load */}
      <div style={{
        backgroundColor: '#0000ff',
        color: 'white',
        padding: '20px',
        fontSize: '16px',
        border: '3px solid #ffffff'
      }}>
        <h2>Testing component imports:</h2>
        <p>AnalysisDebugger: {typeof AnalysisDebugger === 'function' ? 'IMPORTED' : 'FAILED'}</p>
        <p>AnalysisDashboardRouter: {typeof AnalysisDashboardRouter === 'function' ? 'IMPORTED' : 'FAILED'}</p>
      </div>

      {/* Try to render components with error boundaries */}
      <div style={{
        backgroundColor: '#00ff00',
        color: 'black',
        padding: '20px',
        fontSize: '16px',
        border: '3px solid #000000'
      }}>
        <h2>Attempting to render AnalysisDebugger:</h2>
        <div style={{ border: '2px solid red', padding: '10px', margin: '10px 0' }}>
          <p>Before AnalysisDebugger</p>
          <ErrorBoundary>
            <div style={{ 
              background: 'yellow', 
              color: 'black', 
              padding: '10px', 
              border: '2px solid black',
              minHeight: '100px'
            }}>
              <AnalysisDebugger />
            </div>
          </ErrorBoundary>
          <p>After AnalysisDebugger</p>
        </div>
        
        {/* Test with manual component content */}
        <div style={{ 
          background: 'orange', 
          color: 'black', 
          padding: '10px', 
          border: '2px solid black',
          margin: '10px 0'
        }}>
          <h3>Manual Test Component:</h3>
          <p>Project ID: {typeof window !== 'undefined' ? window.location.pathname.split('/')[3] : 'unknown'}</p>
          <p>Job ID: {typeof window !== 'undefined' ? window.location.pathname.split('/')[5] : 'unknown'}</p>
          <p>This should always be visible if inline styles work</p>
        </div>
      </div>

      <div style={{
        backgroundColor: '#ff00ff',
        color: 'white',
        padding: '20px',
        fontSize: '16px',
        border: '3px solid #000000'
      }}>
        <h2>Attempting to render AnalysisDashboardRouter:</h2>
        <div style={{ border: '2px solid red', padding: '10px', margin: '10px 0' }}>
          <p>Before AnalysisDashboardRouter</p>
          <ErrorBoundary>
            <AnalysisDashboardRouter />
          </ErrorBoundary>
          <p>After AnalysisDashboardRouter</p>
        </div>
      </div>
    </div>
  );
}