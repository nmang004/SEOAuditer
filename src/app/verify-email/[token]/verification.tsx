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
  const router = useRouter();

  useEffect(() => {
    verifyToken();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const verifyToken = async () => {
    try {
      setStatus('loading');
      
      // Use the secure token auth endpoint
      const response = await fetch(`/api/secure-auth/verify-email/${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      const data: VerificationResult = await response.json();
      setResult(data);

      if (response.ok && data.success) {
        setStatus('success');
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/auth/login?verified=true');
        }, 3000);
      } else {
        // Check if token is expired or invalid
        if (data.error?.includes('expired') || data.error?.includes('Invalid')) {
          setStatus('expired');
        } else {
          setStatus('error');
        }
      }
    } catch (error) {
      console.error('Verification failed:', error);
      setResult({
        success: false,
        message: 'Verification failed due to a network error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      setStatus('error');
    }
  };

  const handleResendVerification = async () => {
    if (!result?.data?.email) return;

    try {
      setIsResending(true);
      
      const response = await fetch('/api/secure-auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: result.data.email
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('New verification email sent! Please check your inbox.');
      } else {
        alert('Failed to resend verification email: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Network error while resending email');
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
        return result?.message || 'Email verified successfully!';
      case 'expired':
        return 'Verification link has expired';
      case 'error':
        return result?.error || 'Verification failed';
      default:
        return 'Processing...';
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'loading':
        return 'Please wait while we verify your email address.';
      case 'success':
        return 'Your email has been verified. You will be redirected to the login page shortly.';
      case 'expired':
        return 'Your verification link has expired. Please request a new one.';
      case 'error':
        return 'There was an issue verifying your email. Please try again or contact support.';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
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
            <div className="text-sm text-green-400 bg-green-900/20 p-3 rounded-lg">
              Redirecting to login page in 3 seconds...
            </div>
          )}

          {status === 'expired' && (
            <div className="space-y-4">
              <Button
                onClick={handleResendVerification}
                disabled={isResending || !result?.data?.email}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send New Verification Email'
                )}
              </Button>
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