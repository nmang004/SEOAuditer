'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !params?.token) return;
    
    const token = params.token as string;
    console.log('Starting verification for token:', token);
    verifyEmail(token);
  }, [mounted, params?.token]);

  const verifyEmail = async (token: string) => {
    try {
      console.log('Verifying token:', token);
      const response = await fetch(`https://seoauditer-production.up.railway.app/api/auth/verify-email/${token}`);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
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
        setMessage(data.error || data.message || `Server returned ${response.status}`);
      }
    } catch (error) {
      console.error('Verification failed:', error);
      setStatus('error');
      setMessage('Network error: ' + (error as Error).message);
    }
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  if (!params?.token) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-lg text-center text-white">
          <h1 className="text-xl mb-4">❌ Invalid Link</h1>
          <p>No verification token found in URL.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg text-center text-white max-w-md w-full">
        {status === 'loading' && (
          <>
            <div className="text-4xl mb-4">⏳</div>
            <h1 className="text-xl mb-2">Verifying Email</h1>
            <p className="text-gray-300">Please wait...</p>
            <div className="mt-4 text-sm text-gray-400">
              Token: {(params.token as string).substring(0, 20)}...
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-xl mb-4">Email Verified!</h1>
            <p className="mb-4 text-gray-300">{message}</p>
            <p className="text-sm text-gray-400 mb-4">Redirecting to login...</p>
            <button
              onClick={() => router.push('/auth/login?verified=true')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded w-full"
            >
              Go to Login
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-xl mb-4">Verification Failed</h1>
            <p className="mb-6 text-gray-300">{message}</p>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/auth/register')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded w-full"
              >
                Create New Account
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded w-full"
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