'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

// Error Boundary to catch any crashes
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: string | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.toString() };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.log('Error caught by boundary:', error, errorInfo);
    try {
      const errorData = {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href
      };
      localStorage.setItem('diagnosticError', JSON.stringify(errorData));
      console.log('Error saved to localStorage');
    } catch (e) {
      console.log('Failed to save error to localStorage:', e);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          fontFamily: 'monospace', 
          padding: '20px', 
          backgroundColor: '#000', 
          color: '#00ff00',
          minHeight: '100vh'
        }}>
          <h1>DIAGNOSTIC PAGE CRASHED - ERROR BOUNDARY ACTIVATED</h1>
          <p>Error: {this.state.error}</p>
          <p>Check browser console and localStorage for 'diagnosticError'</p>
          <button 
            onClick={() => {
              const saved = localStorage.getItem('diagnosticError');
              if (saved) {
                console.log('Saved error:', JSON.parse(saved));
                alert(saved);
              }
            }}
            style={{ padding: '10px', margin: '10px 0' }}
          >
            Show Saved Error
          </button>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '10px', margin: '10px 0' }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Ultra-minimal diagnostic component
function MinimalDiagnostic() {
  console.log('=== MINIMAL DIAGNOSTIC STARTING ===');
  
  // Save to localStorage immediately
  try {
    const startLog = {
      timestamp: new Date().toISOString(),
      message: 'Minimal diagnostic page loaded',
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    localStorage.setItem('minimalDiagnostic', JSON.stringify(startLog));
    console.log('Start log saved to localStorage');
  } catch (e) {
    console.log('Failed to save start log:', e);
  }

  // Extract token from URL safely
  let token = 'UNKNOWN';
  try {
    const pathname = window.location.pathname;
    console.log('Full pathname:', pathname);
    
    const parts = pathname.split('/');
    console.log('URL parts:', parts);
    
    // Find verify-email index
    const verifyIndex = parts.indexOf('verify-email');
    if (verifyIndex !== -1 && verifyIndex + 1 < parts.length) {
      token = parts[verifyIndex + 1] || 'MISSING';
      console.log('Extracted token:', token);
    }
  } catch (e) {
    console.log('Token extraction failed:', e);
    token = 'ERROR';
  }

  // Test API call function
  const testAPICall = async () => {
    console.log('=== TESTING API CALL ===');
    const logEntry: any = { timestamp: new Date().toISOString(), step: 'API_TEST_START' };
    
    try {
      const url = `https://seoauditer-production.up.railway.app/api/auth/verify-email/${encodeURIComponent(token)}`;
      console.log('Making request to:', url);
      
      logEntry.step = 'FETCH_START';
      logEntry.url = url;
      localStorage.setItem('apiTest', JSON.stringify(logEntry));
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        redirect: 'manual'
      });

      console.log('Response received:', response.status, response.statusText);
      
      logEntry.step = 'RESPONSE_RECEIVED';
      logEntry.status = response.status;
      logEntry.statusText = response.statusText;
      localStorage.setItem('apiTest', JSON.stringify(logEntry));
      
      const responseText = await response.text();
      console.log('Response text length:', responseText.length);
      console.log('Response start:', responseText.substring(0, 200));
      
      logEntry.step = 'TEXT_RECEIVED';
      logEntry.responseLength = responseText.length;
      logEntry.responseStart = responseText.substring(0, 500);
      logEntry.fullResponse = responseText; // Save full response
      localStorage.setItem('apiTest', JSON.stringify(logEntry));
      
      // Check if it's CSS
      const isCSS = responseText.trim().startsWith('.') || 
                   (responseText.includes('{') && responseText.includes('}') && !responseText.trim().startsWith('{'));
      
      if (isCSS) {
        console.log('CSS DETECTED!');
        logEntry.step = 'CSS_DETECTED';
        logEntry.cssIndicators = {
          startsWithDot: responseText.trim().startsWith('.'),
          hasCSSSyntax: responseText.includes('{') && responseText.includes('}'),
          startsWithJSON: responseText.trim().startsWith('{')
        };
        localStorage.setItem('apiTest', JSON.stringify(logEntry));
        
        const resultElement = document.getElementById('result');
        if (resultElement) {
          resultElement.innerHTML = 
            '<h2 style="color: red;">CSS DETECTED INSTEAD OF JSON!</h2>' +
            '<p>Response length: ' + responseText.length + '</p>' +
            '<p>First 200 chars: ' + responseText.substring(0, 200) + '</p>';
        }
      } else {
        console.log('Valid response received');
        const resultElement = document.getElementById('result');
        if (resultElement) {
          resultElement.innerHTML = 
            '<h2 style="color: green;">Valid Response Received</h2>' +
            '<p>Length: ' + responseText.length + '</p>' +
            '<pre>' + responseText.substring(0, 500) + '</pre>';
        }
      }
      
    } catch (error) {
      console.log('API call failed:', error);
      logEntry.step = 'ERROR';
      logEntry.error = error instanceof Error ? error.message : String(error);
      localStorage.setItem('apiTest', JSON.stringify(logEntry));
      
      const resultElement = document.getElementById('result');
      if (resultElement) {
        resultElement.innerHTML = 
          '<h2 style="color: red;">API Call Failed</h2>' +
          '<p>Error: ' + (error instanceof Error ? error.message : String(error)) + '</p>';
      }
    }
  };

  return (
    <div 
      suppressHydrationWarning={true}
      style={{ 
        fontFamily: 'monospace', 
        padding: '20px', 
        backgroundColor: '#111', 
        color: '#0f0',
        minHeight: '100vh',
        lineHeight: '1.4'
      }}
    >
      <h1 style={{ color: '#ff0' }}>ULTRA-MINIMAL EMAIL VERIFICATION DIAGNOSTIC</h1>
      
      <div style={{ margin: '20px 0', padding: '10px', backgroundColor: '#222' }}>
        <strong>Status: Page Loaded Successfully</strong><br/>
        Token: {token}<br/>
        URL: {typeof window !== 'undefined' ? window.location.href : 'Loading...'}<br/>
        Time: {new Date().toISOString()}
      </div>

      <button 
        onClick={testAPICall}
        style={{ 
          padding: '15px 30px', 
          fontSize: '16px', 
          backgroundColor: '#006600', 
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          margin: '10px 5px'
        }}
      >
        TEST API CALL
      </button>

      <button 
        onClick={() => {
          const logs = [];
          try {
            const minimal = localStorage.getItem('minimalDiagnostic');
            const api = localStorage.getItem('apiTest');
            const error = localStorage.getItem('diagnosticError');
            
            if (minimal) logs.push('MINIMAL: ' + minimal);
            if (api) logs.push('API: ' + api);
            if (error) logs.push('ERROR: ' + error);
            
            const logText = logs.join('\n\n');
            console.log('All logs:', logText);
            
            // Show in a new window since alert has size limits
            const logWindow = window.open('', '_blank');
            logWindow.document.write(`
              <pre style="font-family: monospace; white-space: pre-wrap; padding: 20px;">
                ${logText}
              </pre>
            `);
          } catch (e) {
            alert('Error reading logs: ' + e.toString());
          }
        }}
        style={{ 
          padding: '15px 30px', 
          fontSize: '16px', 
          backgroundColor: '#666600', 
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          margin: '10px 5px'
        }}
      >
        VIEW ALL LOGS
      </button>

      <button 
        onClick={() => {
          localStorage.clear();
          console.log('LocalStorage cleared');
          alert('All logs cleared');
        }}
        style={{ 
          padding: '15px 30px', 
          fontSize: '16px', 
          backgroundColor: '#660000', 
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          margin: '10px 5px'
        }}
      >
        CLEAR LOGS
      </button>

      <div 
        id="result" 
        style={{ 
          margin: '20px 0', 
          padding: '20px', 
          backgroundColor: '#000', 
          border: '1px solid #333',
          minHeight: '100px'
        }}
      >
        Click "TEST API CALL" to see what the server returns...
      </div>

      <div style={{ fontSize: '12px', color: '#666', marginTop: '20px' }}>
        This page uses no external CSS, no hydration, and catches all errors.<br/>
        All data is logged to localStorage and console.<br/>
        Check browser console for detailed logs.
      </div>
    </div>
  );
}

// Main export with error boundary
export default function VerifyEmailPage() {
  console.log('VerifyEmailPage rendering');
  
  return (
    <ErrorBoundary>
      <MinimalDiagnostic />
    </ErrorBoundary>
  );
}