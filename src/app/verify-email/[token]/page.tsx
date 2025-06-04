'use client';

import { useEffect, useState } from 'react';

export default function VerifyEmailPage() {
  const [token, setToken] = useState<string>('');
  const [status, setStatus] = useState<string>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    try {
      // Extract token from URL with extra safety checks
      const pathname = window.location.pathname;
      console.log('Full pathname:', pathname);
      
      // Extract everything after /verify-email/
      const verifyEmailIndex = pathname.indexOf('/verify-email/');
      if (verifyEmailIndex === -1) {
        setStatus('error');
        setMessage('Invalid verification URL format');
        return;
      }
      
      const tokenPart = pathname.substring(verifyEmailIndex + '/verify-email/'.length);
      console.log('Extracted token part:', tokenPart);
      
      // Clean the token - remove any URL parameters or fragments
      const cleanToken = tokenPart.split('?')[0].split('#')[0];
      console.log('Clean token:', cleanToken);
      
      if (!cleanToken || cleanToken.length < 10) {
        setStatus('error');
        setMessage('Invalid or missing verification token');
        return;
      }
      
      // Validate token format (should be UUID-like or alphanumeric)
      const tokenRegex = /^[a-zA-Z0-9\-_]+$/;
      if (!tokenRegex.test(cleanToken)) {
        setStatus('error');
        setMessage('Invalid token format');
        return;
      }
      
      setToken(cleanToken);
      
      // Add a small delay to ensure UI is ready
      setTimeout(() => {
        verifyEmail(cleanToken);
      }, 200);
      
    } catch (error) {
      console.error('Error extracting token:', error);
      setStatus('error');
      setMessage('Failed to parse verification URL');
    }
  }, []);

  const verifyEmail = async (tokenToVerify: string) => {
    try {
      console.log('Starting verification for token:', tokenToVerify);
      
      // Ensure we're not accidentally treating the token as code
      const safeToken = String(tokenToVerify).trim();
      
      const requestUrl = `https://seoauditer-production.up.railway.app/api/auth/verify-email/${encodeURIComponent(safeToken)}`;
      console.log('Request URL:', requestUrl);
      
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', [...response.headers.entries()]);
      
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      if (!responseText) {
        setStatus('error');
        setMessage('Empty response from server');
        return;
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        setStatus('error');
        setMessage(`Server returned invalid JSON. Status: ${response.status}, Response: ${responseText.substring(0, 100)}`);
        return;
      }

      if (response.ok && data.success) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        
        // Redirect after success
        setTimeout(() => {
          window.location.href = '/auth/login?verified=true';
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || data.message || `Server error: HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Verification network error:', error);
      setStatus('error');
      setMessage(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const goToLogin = () => {
    window.location.href = '/auth/login';
  };

  const goToRegister = () => {
    window.location.href = '/auth/register';
  };

  // Simple loading state
  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#111827',
        display: 'flex',
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
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <h1 style={{ fontSize: '20px', marginBottom: '10px', margin: 0 }}>Verifying Email</h1>
          <p style={{ color: '#d1d5db', margin: '10px 0' }}>Please wait...</p>
          {token && (
            <div style={{ marginTop: '20px', fontSize: '12px', color: '#9ca3af', wordBreak: 'break-all' }}>
              Token: {token.substring(0, 30)}{token.length > 30 ? '...' : ''}
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
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
          <h1 style={{ fontSize: '20px', marginBottom: '20px', margin: 0 }}>Email Verified!</h1>
          <p style={{ marginBottom: '20px', color: '#d1d5db' }}>{message}</p>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '20px' }}>
            Redirecting to login in 3 seconds...
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
        maxWidth: '400px',
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
      </div>
    </div>
  );
}