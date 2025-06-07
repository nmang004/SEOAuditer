"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { m } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, LogOut, Home, LayoutDashboard } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get user data from localStorage (from JWT token or stored user data)
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // For now, we'll get user data from localStorage if it exists
    // In a production app, you'd decode the JWT or make an API call
    const userData = localStorage.getItem('userData');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      // If no user data in localStorage, we could decode the JWT token
      // For now, we'll redirect to login to get fresh user data
      router.push('/auth/login');
    }
    
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    
    // Redirect to home page
    router.push('/');
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard/projects');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No user data found</p>
          <Button onClick={() => router.push('/auth/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Profile</h1>
            <p className="text-muted-foreground">
              Manage your account and preferences
            </p>
          </div>

          {/* User Info Card */}
          <Card className="p-6 mb-6">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mr-4">
                <User className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Account Status
                </label>
                <div className="flex items-center space-x-2">
                  <div 
                    className={`w-3 h-3 rounded-full ${
                      user.emailVerified ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                  />
                  <span className="text-sm">
                    {user.emailVerified ? 'Email Verified' : 'Email Pending Verification'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Member Since
                </label>
                <p className="text-sm">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  User ID
                </label>
                <p className="text-xs font-mono bg-muted p-2 rounded">
                  {user.id}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Plan Type
                </label>
                <p className="text-sm">
                  Free Tier
                </p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <m.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={handleGoHome}
                variant="outline" 
                className="w-full h-12 flex items-center justify-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Button>
            </m.div>

            <m.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={handleGoToDashboard}
                className="w-full h-12 flex items-center justify-center space-x-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Button>
            </m.div>

            <m.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={handleLogout}
                variant="destructive" 
                className="w-full h-12 flex items-center justify-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </m.div>
          </div>

          {/* Additional Actions */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Need help or have questions?
            </p>
            <div className="space-x-4">
              <Button variant="ghost" size="sm">
                Contact Support
              </Button>
              <Button variant="ghost" size="sm">
                View Documentation
              </Button>
            </div>
          </div>
        </m.div>
      </div>
    </div>
  );
} 