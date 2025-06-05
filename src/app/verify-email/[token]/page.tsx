'use client';

import { useEffect, useState } from 'react';

interface DiagnosticInfo {
  step: string;
  details: any;
  timestamp: string;
}

export default function VerifyEmailPage() {
  const [token, setToken] = useState<string>('');
  const [status, setStatus] = useState<string>('loading');
  const [message, setMessage] = useState<string>('');
  const [diagnostics, setDiagnostics] = useState<DiagnosticInfo[]>([]);
  const [savedLogs, setSavedLogs] = useState<string[]>([]);
  const [showSavedLogs, setShowSavedLogs] = useState(false);

  // Persistent logging that survives crashes
  const addPersistentLog = (message: string, details?: any) => {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        message,
        details: details ? JSON.stringify(details) : null,
        url: window.location.href
      };
      
      // Save to localStorage
      const existingLogs = JSON.parse(localStorage.getItem('emailVerifyLogs') || '[]');
      existingLogs.push(logEntry);
      localStorage.setItem('emailVerifyLogs', JSON.stringify(existingLogs));
      
      // Also log to console
      console.log(`[PERSISTENT] ${message}:`, details);
    } catch (error) {
      console.error('Failed to save persistent log:', error);
    }
  };

  const addDiagnostic = (step: string, details: any) => {
    try {
      const newDiagnostic = {
        step,
        details,
        timestamp: new Date().toISOString()
      };
      setDiagnostics(prev => [...prev, newDiagnostic]);
      console.log(`[DIAGNOSTIC] ${step}:`, details);
      
      // Also save persistently
      addPersistentLog(step, details);
    } catch (error) {
      addPersistentLog('Error in addDiagnostic', { error: error.message, step });
    }
  };

  // Load saved logs on component mount
  const loadSavedLogs = () => {
    try {
      const logs = JSON.parse(localStorage.getItem('emailVerifyLogs') || '[]');
      setSavedLogs(logs);
      return logs;
    } catch (error) {
      addPersistentLog('Error loading saved logs', { error: error.message });
      return [];
    }
  };

  useEffect(() => {
    // Load any previous logs first
    const previousLogs = loadSavedLogs();
    addPersistentLog('New session started', { 
      previousLogCount: previousLogs.length,
      pathname: window.location.pathname 
    });

    addDiagnostic('Page Load', {
      pathname: window.location.pathname,
      href: window.location.href,
      userAgent: navigator.userAgent,
      hasServiceWorker: 'serviceWorker' in navigator,
      previousLogCount: previousLogs.length
    });

    // AGGRESSIVELY FORCE UNREGISTER SERVICE WORKER
    if ('serviceWorker' in navigator) {
      addDiagnostic('Starting Aggressive SW Cleanup', {
        hasController: !!navigator.serviceWorker.controller,
        controllerState: navigator.serviceWorker.controller?.state,
        controllerScriptURL: navigator.serviceWorker.controller?.scriptURL
      });

      // Force unregister all service workers
      navigator.serviceWorker.getRegistrations().then(registrations => {
        addDiagnostic('Service Worker Cleanup', {
          foundRegistrations: registrations.length,
          registrations: registrations.map(r => ({ 
            scope: r.scope, 
            state: r.active?.state,
            scriptURL: r.active?.scriptURL
          }))
        });
        
        // Unregister all found registrations
        const unregisterPromises = registrations.map(registration => {
          return registration.unregister().then(success => {
            addDiagnostic('Service Worker Unregistered', { 
              success, 
              scope: registration.scope,
              scriptURL: registration.active?.scriptURL 
            });
            return success;
          });
        });

        return Promise.all(unregisterPromises);
      }).then(() => {
        // Clear all caches after unregistering
        if ('caches' in window) {
          return caches.keys().then(names => {
            addDiagnostic('Clearing Caches', { cacheNames: names });
            return Promise.all(names.map(name => {
              return caches.delete(name).then(success => {
                addDiagnostic('Cache Deleted', { cacheName: name, success });
                return success;
              });
            }));
          });
        }
      }).then(() => {
        addDiagnostic('SW Cleanup Complete', {
          timestamp: Date.now(),
          hasControllerAfter: !!navigator.serviceWorker.controller
        });

        // Force reload to ensure SW is completely gone
        if (navigator.serviceWorker.controller) {
          addDiagnostic('SW Still Active - Force Reloading Page', {});
          setTimeout(() => window.location.reload(), 1000);
          return;
        }
      }).catch(error => {
        addDiagnostic('SW Cleanup Error', {
          error: error.message,
          stack: error.stack
        });
      });
    }

    try {
      // Extract token from URL with comprehensive logging
      const pathname = window.location.pathname;
      addDiagnostic('URL Analysis', {
        fullPathname: pathname,
        segments: pathname.split('/'),
        urlLength: pathname.length
      });
      
      // Extract everything after /verify-email/
      const verifyEmailIndex = pathname.indexOf('/verify-email/');
      if (verifyEmailIndex === -1) {
        addDiagnostic('Route Error', { error: 'verify-email not found in pathname' });
        setStatus('error');
        setMessage('Invalid verification URL format');
        return;
      }
      
      const tokenPart = pathname.substring(verifyEmailIndex + '/verify-email/'.length);
      addDiagnostic('Token Extraction', {
        rawTokenPart: tokenPart,
        length: tokenPart.length,
        hasQueryParams: tokenPart.includes('?'),
        hasHash: tokenPart.includes('#')
      });
      
      // Clean the token - remove any URL parameters or fragments
      const cleanToken = tokenPart.split('?')[0].split('#')[0];
      addDiagnostic('Token Cleaning', {
        cleanToken,
        originalLength: tokenPart.length,
        cleanLength: cleanToken.length,
        wasModified: tokenPart !== cleanToken
      });
      
      if (!cleanToken || cleanToken.length < 10) {
        addDiagnostic('Token Validation Failed', { 
          token: cleanToken, 
          length: cleanToken.length,
          minimumRequired: 10
        });
        setStatus('error');
        setMessage('Invalid or missing verification token');
        return;
      }
      
      // Validate token format (should be UUID-like or alphanumeric)
      const tokenRegex = /^[a-zA-Z0-9\-_]+$/;
      const isValidFormat = tokenRegex.test(cleanToken);
      addDiagnostic('Token Format Validation', {
        token: cleanToken,
        regex: tokenRegex.toString(),
        isValid: isValidFormat,
        invalidChars: isValidFormat ? null : cleanToken.match(/[^a-zA-Z0-9\-_]/g)
      });
      
      if (!isValidFormat) {
        setStatus('error');
        setMessage('Invalid token format');
        return;
      }
      
      setToken(cleanToken);
      addDiagnostic('Token Set Successfully', { finalToken: cleanToken });
      
      // Add a longer delay to ensure Service Worker cleanup is complete
      setTimeout(() => {
        addDiagnostic('Pre-Verification Check', {
          online: navigator.onLine,
          connectionType: (navigator as any).connection?.effectiveType || 'unknown',
          serviceWorkerState: navigator.serviceWorker?.controller?.state || 'none',
          hasServiceWorkerReady: navigator.serviceWorker ? 'true' : 'false'
        });
        verifyEmail(cleanToken);
      }, 2000); // Increased delay to allow SW cleanup
      
    } catch (error) {
      addDiagnostic('Critical Error in Token Extraction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null
      });
      setStatus('error');
      setMessage('Failed to parse verification URL');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const verifyEmail = async (tokenToVerify: string) => {
    try {
      addPersistentLog('=== VERIFICATION START ===');
      addDiagnostic('Verification Start', { token: tokenToVerify });
      
      // Ensure we're not accidentally treating the token as code
      const safeToken = String(tokenToVerify).trim();
      const requestUrl = `https://seoauditer-production.up.railway.app/api/auth/verify-email/${encodeURIComponent(safeToken)}`;
      
      addPersistentLog('Request prepared', {
        originalToken: tokenToVerify,
        safeToken,
        encodedToken: encodeURIComponent(safeToken),
        requestUrl,
        method: 'GET'
      });
      
      addDiagnostic('Request Preparation', {
        originalToken: tokenToVerify,
        safeToken,
        encodedToken: encodeURIComponent(safeToken),
        requestUrl,
        method: 'GET'
      });
      
      // Check if service worker is active
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        addDiagnostic('Service Worker Active', {
          state: navigator.serviceWorker.controller.state,
          scriptURL: navigator.serviceWorker.controller.scriptURL
        });
      } else {
        addDiagnostic('Service Worker Status', { active: false });
      }
      
      addDiagnostic('Making Request', { 
        timestamp: new Date().toISOString(),
        url: requestUrl
      });

      addPersistentLog('Making fetch request...');
      
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        redirect: 'manual' // Prevent automatic redirects that might cause issues
      });

      addPersistentLog('Fetch response received', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        type: response.type,
        url: response.url,
        redirected: response.redirected
      });

      addDiagnostic('Response Received', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        type: response.type,
        url: response.url,
        redirected: response.redirected
      });

      // Get headers safely
      const headers: Record<string, string> = {};
      try {
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        addDiagnostic('Response Headers', headers);
      } catch (headerError) {
        addDiagnostic('Header Reading Error', { 
          error: headerError instanceof Error ? headerError.message : 'Unknown' 
        });
      }
      
      const responseText = await response.text();
      
      addPersistentLog('Response text received', {
        length: responseText.length,
        firstChars: responseText.substring(0, 200),
        contentType: headers['content-type'] || 'unknown',
        fullResponse: responseText.substring(0, 1000) // First 1000 chars
      });
      
      addDiagnostic('Response Text', {
        length: responseText.length,
        firstChars: responseText.substring(0, 100),
        contentType: headers['content-type'] || 'unknown'
      });
      
      if (!responseText) {
        addDiagnostic('Empty Response Error', {});
        setStatus('error');
        setMessage('Empty response from server');
        return;
      }
      
      // Check if response looks like CSS (this is the critical check!)
      const isCSSResponse = responseText.trim().startsWith('.') || 
          (responseText.includes('{') && responseText.includes('}') && 
          !responseText.trim().startsWith('{'));
          
      if (isCSSResponse) {
        addPersistentLog('CSS DETECTED INSTEAD OF JSON!', {
          responseType: 'CSS',
          firstLine: responseText.split('\n')[0],
          fullFirstLines: responseText.split('\n').slice(0, 5),
          possibleCSSIndicators: {
            startsWithDot: responseText.trim().startsWith('.'),
            hasCSSSyntax: responseText.includes('{') && responseText.includes('}'),
            startsWithJSON: responseText.trim().startsWith('{')
          },
          responseLength: responseText.length,
          statusCode: response.status,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        addDiagnostic('CSS DETECTED INSTEAD OF JSON!', {
          responseType: 'CSS',
          firstLine: responseText.split('\n')[0],
          possibleCSSIndicators: {
            startsWithDot: responseText.trim().startsWith('.'),
            hasCSSSyntax: responseText.includes('{') && responseText.includes('}'),
            startsWithJSON: responseText.trim().startsWith('{')
          }
        });
        setStatus('error');
        setMessage('CRITICAL: Server returned CSS instead of JSON! This indicates a routing problem.');
        return;
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
        addDiagnostic('JSON Parse Success', { data });
      } catch (parseError) {
        addDiagnostic('JSON Parse Error', {
          error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
          responseLength: responseText.length,
          responseStart: responseText.substring(0, 200)
        });
        setStatus('error');
        setMessage(`Server returned invalid JSON. Status: ${response.status}, Response start: ${responseText.substring(0, 100)}`);
        return;
      }

      if (response.ok && data.success) {
        addDiagnostic('Verification Success', data);
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        
        // DO NOT auto-redirect - let user manually navigate to avoid crashes
        addPersistentLog('Verification successful - NOT auto-redirecting to prevent crashes');
        addDiagnostic('Verification Success - Manual Navigation Required', { 
          target: '/auth/login?verified=true',
          autoRedirectDisabled: true 
        });
      } else {
        addDiagnostic('Verification Failed', { 
          responseOk: response.ok,
          dataSuccess: data.success,
          data 
        });
        setStatus('error');
        setMessage(data.error || data.message || `Server error: HTTP ${response.status}`);
      }
    } catch (error) {
      addPersistentLog('CRITICAL ERROR IN VERIFICATION', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null,
        name: error instanceof Error ? error.name : 'UnknownError',
        tokenUsed: tokenToVerify
      });
      
      addDiagnostic('Network Error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null,
        name: error instanceof Error ? error.name : 'UnknownError'
      });
      setStatus('error');
      setMessage(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const goToLogin = () => {
    addDiagnostic('Manual Login Redirect', {});
    addPersistentLog('User manually navigating to login');
    window.location.href = '/auth/login';
  };

  const goToRegister = () => {
    addDiagnostic('Manual Register Redirect', {});
    addPersistentLog('User manually navigating to register');
    window.location.href = '/auth/register';
  };

  const viewSavedLogs = () => {
    const logs = loadSavedLogs();
    setShowSavedLogs(true);
  };

  const clearSavedLogs = () => {
    localStorage.removeItem('emailVerifyLogs');
    setSavedLogs([]);
    setShowSavedLogs(false);
    addPersistentLog('Logs cleared by user');
  };

  // Diagnostic display component
  const DiagnosticDisplay = () => (
    <div style={{
      marginTop: '20px',
      padding: '20px',
      backgroundColor: '#0f172a',
      borderRadius: '8px',
      maxHeight: '300px',
      overflowY: 'auto',
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <h3 style={{ color: '#f59e0b', marginBottom: '10px' }}>Diagnostic Log:</h3>
      {diagnostics.map((diag, index) => (
        <div key={index} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #374151' }}>
          <div style={{ color: '#10b981', fontWeight: 'bold' }}>
            {diag.timestamp.split('T')[1].split('.')[0]} - {diag.step}
          </div>
          <pre style={{ margin: '5px 0', color: '#d1d5db', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(diag.details, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );

  // Simple loading state
  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#111827',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          backgroundColor: '#1f2937',
          padding: '40px',
          borderRadius: '8px',
          textAlign: 'center',
          color: 'white',
          maxWidth: '800px',
          width: '100%',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
          <h1 style={{ fontSize: '20px', marginBottom: '10px', margin: 0 }}>Diagnosing Email Verification</h1>
          <p style={{ color: '#d1d5db', margin: '10px 0' }}>Analyzing request flow...</p>
          {token && (
            <div style={{ marginTop: '20px', fontSize: '12px', color: '#9ca3af', wordBreak: 'break-all' }}>
              Token: {token.substring(0, 30)}{token.length > 30 ? '...' : ''}
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={viewSavedLogs}
              style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              View Saved Logs ({savedLogs.length})
            </button>
            <button
              onClick={clearSavedLogs}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Clear Logs
            </button>
          </div>
          <DiagnosticDisplay />
          {showSavedLogs && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#374151',
              borderRadius: '8px',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ color: '#f59e0b', margin: 0 }}>Persistent Logs (Survives Crashes):</h3>
                <button
                  onClick={() => setShowSavedLogs(false)}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Hide
                </button>
              </div>
              {savedLogs.map((log: any, index) => (
                <div key={index} style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #4b5563' }}>
                  <div style={{ color: '#10b981', fontSize: '11px' }}>
                    {log.timestamp} - {log.message}
                  </div>
                  {log.details && (
                    <pre style={{ margin: '4px 0', color: '#d1d5db', fontSize: '10px', whiteSpace: 'pre-wrap' }}>
                      {typeof log.details === 'string' ? log.details : JSON.stringify(JSON.parse(log.details), null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#111827',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          backgroundColor: '#1f2937',
          padding: '40px',
          borderRadius: '8px',
          textAlign: 'center',
          color: 'white',
          maxWidth: '800px',
          width: '100%',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
          <h1 style={{ fontSize: '20px', marginBottom: '20px', margin: 0 }}>Email Verified!</h1>
          <p style={{ marginBottom: '20px', color: '#d1d5db' }}>{message}</p>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '20px' }}>
            Auto-redirect disabled. Please click to continue.
          </p>
          <button
            onClick={goToLogin}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              width: '100%',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Go to Login Now
          </button>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={viewSavedLogs}
              style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              View Saved Logs ({savedLogs.length})
            </button>
            <button
              onClick={clearSavedLogs}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Clear Logs
            </button>
          </div>
          <DiagnosticDisplay />
          {showSavedLogs && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#374151',
              borderRadius: '8px',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ color: '#f59e0b', margin: 0 }}>Persistent Logs (Survives Crashes):</h3>
                <button
                  onClick={() => setShowSavedLogs(false)}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Hide
                </button>
              </div>
              {savedLogs.map((log: any, index) => (
                <div key={index} style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #4b5563' }}>
                  <div style={{ color: '#10b981', fontSize: '11px' }}>
                    {log.timestamp} - {log.message}
                  </div>
                  {log.details && (
                    <pre style={{ margin: '4px 0', color: '#d1d5db', fontSize: '10px', whiteSpace: 'pre-wrap' }}>
                      {typeof log.details === 'string' ? log.details : JSON.stringify(JSON.parse(log.details), null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#111827',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#1f2937',
        padding: '40px',
        borderRadius: '8px',
        textAlign: 'center',
        color: 'white',
        maxWidth: '800px',
        width: '100%',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
        <h1 style={{ fontSize: '20px', marginBottom: '20px', margin: 0 }}>Verification Failed</h1>
        <p style={{ marginBottom: '30px', color: '#d1d5db', wordBreak: 'break-word' }}>{message}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={goToRegister}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Create New Account
          </button>
          <button
            onClick={goToLogin}
            style={{
              backgroundColor: '#4b5563',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Go to Login
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={viewSavedLogs}
            style={{
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            View Saved Logs ({savedLogs.length})
          </button>
          <button
            onClick={clearSavedLogs}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Clear Logs
          </button>
        </div>
        <DiagnosticDisplay />
        {showSavedLogs && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#374151',
            borderRadius: '8px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ color: '#f59e0b', margin: 0 }}>Persistent Logs (Survives Crashes):</h3>
              <button
                onClick={() => setShowSavedLogs(false)}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Hide
              </button>
            </div>
            {savedLogs.map((log: any, index) => (
              <div key={index} style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #4b5563' }}>
                <div style={{ color: '#10b981', fontSize: '11px' }}>
                  {log.timestamp} - {log.message}
                </div>
                {log.details && (
                  <pre style={{ margin: '4px 0', color: '#d1d5db', fontSize: '10px', whiteSpace: 'pre-wrap' }}>
                    {typeof log.details === 'string' ? log.details : JSON.stringify(JSON.parse(log.details), null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}