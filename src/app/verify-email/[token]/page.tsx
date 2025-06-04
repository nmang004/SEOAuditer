'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!params) {
      console.log('No params available');
      return;
    }
    
    const token = params.token;
    console.log('Token from params:', token);
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    // Add a small delay to avoid hydration issues
    setTimeout(() => {
      verifyEmail(token as string);
    }, 100);
  }, [params]);

  const verifyEmail = async (token: string) => {
    try {
      setStatus('loading');
      const backendUrl = 'https://seoauditer-production.up.railway.app';
      const url = `${backendUrl}/api/auth/verify-email/${token}`;
      
      console.log('Making request to:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok && data.success) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        
        setTimeout(() => {
          router.push('/auth/login?verified=true');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus('error');
      setMessage('Network error occurred');
    }
  };

  if (status === 'loading') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(to bottom, #0F172A, #1A202C, #0F172A)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          background: 'rgba(31, 41, 55, 0.8)',
          padding: '2rem',
          borderRadius: '1rem',
          textAlign: 'center',
          color: 'white',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{ marginBottom: '1rem' }}>⏳</div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Verifying Email</h1>
          <p>Please wait...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(to bottom, #0F172A, #1A202C, #0F172A)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          background: 'rgba(31, 41, 55, 0.8)',
          padding: '2rem',
          borderRadius: '1rem',
          textAlign: 'center',
          color: 'white',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{ marginBottom: '1rem', fontSize: '3rem' }}>✅</div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Email Verified!</h1>
          <p style={{ marginBottom: '1rem' }}>{message}</p>
          <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Redirecting to login...</p>
          <button
            onClick={() => router.push('/auth/login?verified=true')}
            style={{
              background: 'linear-gradient(to right, #4f46e5, #7c3aed)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              marginTop: '1rem',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(to bottom, #0F172A, #1A202C, #0F172A)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: 'rgba(31, 41, 55, 0.8)',
        padding: '2rem',
        borderRadius: '1rem',
        textAlign: 'center',
        color: 'white',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{ marginBottom: '1rem', fontSize: '3rem' }}>❌</div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Verification Failed</h1>
        <p style={{ marginBottom: '1.5rem' }}>{message}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            onClick={() => router.push('/auth/register')}
            style={{
              background: 'linear-gradient(to right, #4f46e5, #7c3aed)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            Create New Account
          </button>
          <button
            onClick={() => router.push('/auth/login')}
            style={{
              background: 'transparent',
              color: '#d1d5db',
              border: '1px solid #4b5563',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
}