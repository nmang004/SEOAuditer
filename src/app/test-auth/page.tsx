'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function TestAuthPage() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testBackendConnection = async () => {
    setLoading(true);
    setStatus('Testing backend connection...');
    
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      
      if (response.ok) {
        setStatus(`✅ Backend connected successfully! Status: ${JSON.stringify(data)}`);
      } else {
        setStatus(`❌ Backend error: ${response.status} - ${JSON.stringify(data)}`);
      }
    } catch (error) {
      setStatus(`❌ Connection error: ${error}`);
    }
    
    setLoading(false);
  };

  const testLogin = async () => {
    setLoading(true);
    setStatus('Testing login endpoint...');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPass123!',
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStatus(`✅ Login endpoint working! Response: ${JSON.stringify(data)}`);
      } else {
        setStatus(`ℹ️ Login endpoint responded with: ${response.status} - ${JSON.stringify(data)}`);
      }
    } catch (error) {
      setStatus(`❌ Login endpoint error: ${error}`);
    }
    
    setLoading(false);
  };

  const testRegister = async () => {
    setLoading(true);
    setStatus('Testing register endpoint...');
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: `test${Date.now()}@example.com`,
          password: 'TestPass123!',
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStatus(`✅ Register endpoint working! Response: ${JSON.stringify(data)}`);
      } else {
        setStatus(`ℹ️ Register endpoint responded with: ${response.status} - ${JSON.stringify(data)}`);
      }
    } catch (error) {
      setStatus(`❌ Register endpoint error: ${error}`);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Auth System Test Page</h1>
        
        <Card className="p-6" noAnimate>
          <h2 className="text-xl font-semibold mb-4">Backend Connection Test</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={testBackendConnection} disabled={loading}>
                Test Backend Connection
              </Button>
              <Button onClick={testLogin} disabled={loading}>
                Test Login Endpoint
              </Button>
              <Button onClick={testRegister} disabled={loading}>
                Test Register Endpoint
              </Button>
            </div>
            
            {status && (
              <div className="p-4 bg-muted rounded-lg font-mono text-sm whitespace-pre-wrap">
                {status}
              </div>
            )}
          </div>
        </Card>
        
        <Card className="p-6" noAnimate>
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <div className="space-y-2">
            <p><a href="/auth/login" className="text-primary hover:underline">/auth/login</a> - Main login page</p>
            <p><a href="/auth/register" className="text-primary hover:underline">/auth/register</a> - Main register page</p>
            <p><a href="/auth/forgot-password" className="text-primary hover:underline">/auth/forgot-password</a> - Forgot password page</p>
            <p><a href="/test-login" className="text-primary hover:underline">/test-login</a> - Test login page with header/footer</p>
          </div>
        </Card>
      </div>
    </div>
  );
}