"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { m } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const router = useRouter();

  // Check backend connectivity on mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch('/api/health/backend');
      const data = await response.json();
      
      if (data.success && data.backend.status === 'connected') {
        setBackendStatus('online');
      } else {
        setBackendStatus('offline');
        if (data.backend.hint) {
          setErrorDetails(data.backend.hint);
        }
      }
    } catch (error) {
      setBackendStatus('offline');
      setErrorDetails('Unable to check backend status');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(""); // Clear error when user types
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error statuses
        if (response.status === 503) {
          setErrorDetails(data.details || '');
          throw new Error(data.error || 'Backend server is unavailable');
        } else if (response.status === 409) {
          throw new Error(data.error || 'Email already exists');
        } else if (response.status === 400) {
          throw new Error(data.error || 'Invalid request');
        } else {
          throw new Error(data.error || 'Registration failed');
        }
      }

      if (data.success && data.data.token) {
        // Store token in localStorage
        localStorage.setItem('token', data.data.token);
        
        // Store user data in localStorage for the profile page
        localStorage.setItem('userData', JSON.stringify(data.data.user));
        
        // Redirect to profile page
        router.push('/profile');
      } else {
        throw new Error('Registration failed - no token received');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      
      // If backend is offline, check again
      if (err.message.includes('Backend server') || err.message.includes('unavailable')) {
        checkBackendHealth();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Create an Account</h1>
        <p className="text-muted-foreground">
          Sign up to start analyzing your website's SEO
        </p>
      </div>

      {/* Backend Status Indicator */}
      {backendStatus !== 'checking' && (
        <div className={`mb-4 p-3 text-sm rounded-md flex items-center gap-2 ${
          backendStatus === 'online' 
            ? 'text-green-700 bg-green-50 border border-green-200' 
            : 'text-amber-700 bg-amber-50 border border-amber-200'
        }`}>
          {backendStatus === 'online' ? (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>Backend server is online</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4" />
              <div>
                <p>Backend server is offline</p>
                {errorDetails && (
                  <p className="text-xs mt-1 opacity-80">{errorDetails}</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
          <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p>{error}</p>
            {errorDetails && error.includes('server') && (
              <p className="text-xs mt-1 opacity-80">{errorDetails}</p>
            )}
          </div>
        </div>
      )}

      <Card className="p-6" noAnimate>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Full Name
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters and include uppercase, lowercase, number, and special character
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="terms"
                required
                className="rounded border-gray-300"
              />
              <label htmlFor="terms" className="text-sm">
                I agree to the{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || backendStatus === 'offline'}
            >
              {isLoading ? "Creating account..." : backendStatus === 'offline' ? "Backend Offline" : "Create account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
      </Card>
    </div>
  );
}