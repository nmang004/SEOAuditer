'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  console.log('Component rendered with:', { params, token, status });

  useEffect(() => {
    console.log('VerifyEmailPage mounted with token:', token);
    
    if (!token) {
      console.log('No token provided');
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    console.log('Starting email verification for token:', token);
    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      // Use production backend URL if environment variable not set
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://seoauditer-production.up.railway.app';
      console.log('Verifying email with backend URL:', backendUrl);
      console.log('Token:', token);
      
      const response = await fetch(`${backendUrl}/api/auth/verify-email/${token}`, {
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
        setMessage(data.message || 'Your email has been verified successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login?verified=true');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || data.message || 'Failed to verify email. The link may be invalid or expired.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage('An error occurred while verifying your email. Please try again.');
    }
  };

  // Fallback render for debugging
  if (!params) {
    return <div className="min-h-screen bg-red-500 text-white p-8">No params found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] via-[#1A202C] to-[#0F172A] flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8 bg-gray-800/50 backdrop-blur-sm border-gray-700">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 text-indigo-400 animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Verifying Your Email</h1>
              <p className="text-gray-300">Please wait while we verify your email address...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
              <p className="text-gray-300 mb-6">{message}</p>
              <p className="text-sm text-gray-400 mb-6">Redirecting to login in 3 seconds...</p>
              <Link href="/login">
                <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                  Go to Login
                </Button>
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-rose-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
              <p className="text-gray-300 mb-6">{message}</p>
              <div className="space-y-3">
                <Link href="/register">
                  <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                    Create New Account
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700">
                    Go to Login
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}