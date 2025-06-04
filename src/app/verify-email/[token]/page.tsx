'use client';

import { useEffect, useState } from 'react';

export default function VerifyEmailPage() {
  const [token, setToken] = useState<string>('');
  const [status, setStatus] = useState<string>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    // Extract token from URL manually to avoid hydration issues
    const pathParts = window.location.pathname.split('/');
    const urlToken = pathParts[pathParts.length - 1];
    console.log('Extracted token from URL:', urlToken);
    
    if (!urlToken || urlToken === 'verify-email') {
      setStatus('error');
      setMessage('No verification token found in URL');
      return;
    }
    
    setToken(urlToken);
    verifyEmail(urlToken);
  }, []);

  const verifyEmail = async (tokenToVerify: string) => {
    try {
      console.log('Verifying token:', tokenToVerify);
      
      const response = await fetch(`https://seoauditer-production.up.railway.app/api/auth/verify-email/${tokenToVerify}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        setStatus('error');
        setMessage(`Server returned invalid response: ${response.status}`);
        return;
      }

      console.log('Parsed response data:', data);

      if (response.ok && data.success) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        
        setTimeout(() => {
          window.location.href = '/auth/login?verified=true';
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || data.message || `Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Verification error:', error);
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

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#111827',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#1f2937',
        padding: '2rem',
        borderRadius: '0.5rem',
        textAlign: 'center',
        color: 'white',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}>
        {status === 'loading' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', margin: 0 }}>Verifying Email</h1>
            <p style={{ color: '#d1d5db', margin: '0.5rem 0' }}>Please wait...</p>
            {token && (
              <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                Token: {token.substring(0, 20)}...
              </div>
            )}
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h1 style={{ fontSize: '1.25rem', marginBottom: '1rem', margin: 0 }}>Email Verified!</h1>
            <p style={{ marginBottom: '1rem', color: '#d1d5db' }}>{message}</p>
            <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '1rem' }}>
              Redirecting to login...
            </p>
            <button
              onClick={goToLogin}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                width: '100%',
                fontSize: '0.875rem'
              }}
            >
              Go to Login
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
            <h1 style={{ fontSize: '1.25rem', marginBottom: '1rem', margin: 0 }}>Verification Failed</h1>
            <p style={{ marginBottom: '1.5rem', color: '#d1d5db' }}>{message}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={goToRegister}
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
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
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Go to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}