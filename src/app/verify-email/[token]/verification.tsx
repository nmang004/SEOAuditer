'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

interface VerificationResult {
  success: boolean;
  message: string;
  error?: string;
  data?: {
    email: string;
    verified: boolean;
    verifiedAt: string;
  };
  metadata?: {
    correlationId: string;
  };
}

interface VerificationPageProps {
  token: string;
}

export default function VerificationPage({ token }: VerificationPageProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const router = useRouter();

  useEffect(() => {
    verifyToken();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const verifyToken = async () => {
    try {
      setStatus('loading');
      console.log('🔍 Verifying token:', token);
      
      // Use the secure token auth endpoint
      const response = await fetch(`/api/secure-auth/verify-email/${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      console.log('📡 Response status:', response.status);
      
      let data: VerificationResult;
      try {
        data = await response.json();
        console.log('📄 Response data:', data);
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response format from server');
      }
      
      setResult(data);

      if (response.ok && data.success) {
        setStatus('success');
        console.log('✅ Verification successful!');
        // Only redirect if this was an actual verification, not a resend
        if (!result?.message?.includes('sent')) {
          setTimeout(() => {
            router.push('/auth/login?verified=true');
          }, 3000);
        }
      } else {
        console.log('❌ Verification failed:', data);
        // Check if token is expired or invalid
        if (data.error?.includes('expired') || data.error?.includes('Invalid') || response.status === 400) {
          setStatus('expired');
        } else {
          setStatus('error');
        }
      }
    } catch (error) {
      console.error('❌ Verification failed:', error);
      setResult({
        success: false,
        message: 'Verification failed due to a network error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      setStatus('error');
    }
  };

  const handleResendVerification = async (email?: string) => {
    const emailToUse = email || result?.data?.email;
    if (!emailToUse) {
      // If no email available, redirect to register page
      router.push('/auth/register');
      return;
    }

    try {
      setIsResending(true);
      
      const response = await fetch('/api/secure-auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailToUse
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setResult({
          success: true,
          message: 'New verification email sent successfully!',
          data: { email: emailToUse, verified: false, verifiedAt: '' }
        });
        setStatus('success');
        // Don't auto-redirect, let user check their email
      } else {
        setResult({
          success: false,
          message: 'Failed to resend verification email',
          error: data.error || 'Unknown error occurred'
        });
        setStatus('error');
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Network error while resending email',
        error: error instanceof Error ? error.message : 'Network error'
      });
      setStatus('error');
    } finally {
      setIsResending(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Clock className="h-16 w-16 text-blue-500 animate-pulse" />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'error':
      case 'expired':
        return <XCircle className="h-16 w-16 text-red-500" />;
      default:
        return <Clock className="h-16 w-16 text-gray-400" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'loading':
        return 'Verifying your email...';
      case 'success':
        if (result?.message?.includes('sent')) {
          return 'New verification email sent!';
        }
        return result?.message || 'Email verified successfully!';
      case 'expired':
        return 'Verification Link Expired';
      case 'error':
        return result?.message || result?.error || 'Verification failed';
      default:
        return 'Processing...';
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'loading':
        return 'Please wait while we verify your email address.';
      case 'success':
        if (result?.message?.includes('sent')) {
          return 'Please check your email inbox and click the new verification link.';
        }
        return 'Your email has been verified. You can now log in to your account.';
      case 'expired':
        return 'This verification link has expired or been used. Request a new verification email to continue.';
      case 'error':
        return result?.error || 'There was an issue verifying your email. Please try again or contact support.';
      default:
        return '';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md p-8 text-center bg-gray-800 border-gray-700">
        <div className="flex flex-col items-center space-y-6">
          {getStatusIcon()}
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">
              {getStatusMessage()}
            </h1>
            <p className="text-gray-400">
              {getStatusDescription()}
            </p>
          </div>

          {status === 'success' && (
            <div className="space-y-3">
              {result?.message?.includes('sent') ? (
                <div className="text-sm text-green-400 bg-green-900/20 p-4 rounded-lg">
                  ✅ {result.message}
                  <br />
                  <span className="text-green-300">Check your email and click the new verification link.</span>
                </div>
              ) : (
                <div className="text-sm text-green-400 bg-green-900/20 p-3 rounded-lg">
                  ✅ Email verified successfully!
                  <br />
                  <span className="text-green-300">Redirecting to login page in 3 seconds...</span>
                </div>
              )}
            </div>
          )}

          {status === 'expired' && (
            <div className="space-y-4 w-full">
              <div className="bg-yellow-900/20 border border-yellow-500/20 p-4 rounded-lg">
                <p className="text-yellow-400 text-sm mb-2">
                  ⚠️ Verification links expire after 1 hour for security
                </p>
                <p className="text-gray-300 text-sm">
                  Enter your email address to receive a fresh verification link
                </p>
              </div>
              
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                  disabled={isResending}
                />
                
                <Button
                  onClick={() => handleResendVerification(emailInput)}
                  disabled={isResending || !emailInput.includes('@')}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending New Link...
                    </>
                  ) : (
                    'Send New Verification Email'
                  )}
                </Button>
              </div>
              
              <div className="text-center">
                <Button
                  onClick={() => router.push('/auth/register')}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Back to Registration
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <Button
                onClick={verifyToken}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Try Again
              </Button>
              <Button
                onClick={() => router.push('/auth/register')}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                Back to Registration
              </Button>
            </div>
          )}

          {(status === 'success' || status === 'loading') && (
            <Button
              onClick={() => router.push('/auth/login')}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Go to Login
            </Button>
          )}

          {result?.metadata?.correlationId && (
            <div className="text-xs text-gray-500 mt-4">
              ID: {result.metadata.correlationId}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}