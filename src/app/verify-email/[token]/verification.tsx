'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, RefreshCw, Mail, AlertCircle } from 'lucide-react';

interface VerificationResult {
  success: boolean;
  message: string;
  alreadyVerified?: boolean;
  error?: string;
  errorCode?: string;
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

type VerificationState = 'loading' | 'success' | 'already-verified' | 'failed';

export default function VerificationPage({ token }: VerificationPageProps) {
  const [state, setState] = useState<VerificationState>('loading');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [showCountdown, setShowCountdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    verifyToken();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-redirect countdown for success state
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (showCountdown && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (showCountdown && countdown === 0) {
      router.push('/auth/login?verified=true');
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showCountdown, countdown, router]);

  const verifyToken = async () => {
    try {
      setState('loading');
      console.log('🔍 Verifying token:', token);
      
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
        if (data.alreadyVerified) {
          console.log('✅ Email already verified');
          setState('already-verified');
        } else {
          console.log('✅ Verification successful!');
          setState('success');
          // Start countdown for auto-redirect
          setShowCountdown(true);
          setCountdown(5);
        }
      } else {
        console.log('❌ Verification failed:', data);
        setState('failed');
      }
    } catch (error) {
      console.error('❌ Verification failed:', error);
      setResult({
        success: false,
        message: 'Verification failed due to a network error',
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: 'NETWORK_ERROR'
      });
      setState('failed');
    }
  };

  const handleResendVerification = async () => {
    const email = emailInput || result?.data?.email;
    if (!email) {
      setResendMessage('Please enter your email address');
      return;
    }

    try {
      setIsResending(true);
      setResendMessage('');
      
      const response = await fetch('/api/secure-auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (data.success) {
        setResendMessage('✅ New verification email sent! Please check your inbox.');
      } else {
        if (response.status === 429) {
          setResendMessage('❌ Too many requests. Please wait 10 minutes before requesting another verification email.');
        } else if (response.status === 400 && data.error?.includes('already verified')) {
          setResendMessage('✅ Your email is already verified! You can log in now.');
        } else {
          setResendMessage(`❌ ${data.error || 'Failed to send verification email'}`);
        }
      }
    } catch (error) {
      setResendMessage('❌ Network error while sending email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleContinueToLogin = () => {
    router.push('/auth/login');
  };

  const renderLoadingState = () => (
    <div className="flex flex-col items-center space-y-6">
      <Clock className="h-16 w-16 text-blue-500 animate-pulse" />
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-white">
          Verifying your email...
        </h1>
        <p className="text-gray-400">
          Please wait while we verify your email address.
        </p>
      </div>
    </div>
  );

  const renderSuccessState = () => (
    <div className="flex flex-col items-center space-y-6">
      <CheckCircle className="h-16 w-16 text-green-500" />
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-white">
          ✅ Email Verified Successfully!
        </h1>
        <p className="text-gray-400">
          Your email has been verified. You can now log in to your account.
        </p>
      </div>

      <div className="space-y-4 w-full">
        <div className="text-center">
          <Button
            onClick={handleContinueToLogin}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            Continue to Login
          </Button>
        </div>

        {showCountdown && (
          <div className="text-center">
            <p className="text-sm text-gray-400">
              Auto-redirecting in {countdown} seconds...
            </p>
            <Button
              onClick={() => setShowCountdown(false)}
              variant="outline"
              size="sm"
              className="mt-2 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel Auto-redirect
            </Button>
          </div>
        )}

        <div className="text-center">
          <p className="text-sm text-green-400">
            Welcome to SEO Auditer!
          </p>
        </div>
      </div>

      {result?.metadata?.correlationId && (
        <div className="text-xs text-gray-500 mt-4">
          ID: {result.metadata.correlationId}
        </div>
      )}
    </div>
  );

  const renderAlreadyVerifiedState = () => (
    <div className="flex flex-col items-center space-y-6">
      <CheckCircle className="h-16 w-16 text-green-500" />
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-white">
          ✅ Email Already Verified
        </h1>
        <p className="text-gray-400">
          Your email has already been verified. You can log in to your account.
        </p>
      </div>

      <div className="space-y-4 w-full">
        <div className="text-center">
          <Button
            onClick={handleContinueToLogin}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            Continue to Login
          </Button>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-400">
            No further action needed.
          </p>
        </div>
      </div>

      {result?.data?.verifiedAt && (
        <div className="text-xs text-gray-500 text-center">
          <p>Verified on: {new Date(result.data.verifiedAt).toLocaleString()}</p>
          {result.metadata?.correlationId && (
            <p className="mt-1">ID: {result.metadata.correlationId}</p>
          )}
        </div>
      )}
    </div>
  );

  const renderFailedState = () => (
    <div className="flex flex-col items-center space-y-6">
      <XCircle className="h-16 w-16 text-red-500" />
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-white">
          ❌ Verification Failed
        </h1>
        <p className="text-gray-400">
          This verification link has expired or is invalid.
        </p>
      </div>

      <div className="space-y-4 w-full">
        <div className="bg-yellow-900/20 border border-yellow-500/20 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-yellow-400 text-sm font-medium mb-1">
                Need a new verification link?
              </p>
              <p className="text-gray-300 text-sm">
                Enter your email address below to receive a fresh verification link.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="email"
              placeholder="Enter your email address"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              disabled={isResending}
            />
          </div>
          
          <Button
            onClick={handleResendVerification}
            disabled={isResending || !emailInput.includes('@')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {isResending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sending New Link...
              </>
            ) : (
              'Resend Verification Email'
            )}
          </Button>

          {resendMessage && (
            <div className={`text-sm p-3 rounded-lg ${
              resendMessage.startsWith('✅') 
                ? 'bg-green-900/20 border border-green-500/20 text-green-400'
                : 'bg-red-900/20 border border-red-500/20 text-red-400'
            }`}>
              {resendMessage}
            </div>
          )}
        </div>

        <div className="text-center space-y-2">
          <Button
            onClick={() => router.push('/auth/register')}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Back to Registration
          </Button>
          
          <p className="text-xs text-gray-500">
            Didn't receive the email? Check your spam folder or{' '}
            <a href="mailto:support@seoauditer.com" className="text-indigo-400 hover:text-indigo-300">
              contact support
            </a>
          </p>
        </div>
      </div>

      {result?.metadata?.correlationId && (
        <div className="text-xs text-gray-500 mt-4">
          Error ID: {result.metadata.correlationId}
        </div>
      )}
    </div>
  );

  const renderState = () => {
    switch (state) {
      case 'loading':
        return renderLoadingState();
      case 'success':
        return renderSuccessState();
      case 'already-verified':
        return renderAlreadyVerifiedState();
      case 'failed':
        return renderFailedState();
      default:
        return renderLoadingState();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md p-8 text-center bg-gray-800 border-gray-700">
        {renderState()}
      </Card>
    </div>
  );
}