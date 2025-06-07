"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function TestRegisterPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testRegistration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `test${Date.now()}@example.com`,
          password: 'TestPassword123!',
          name: 'Test User'
        }),
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testAuthEndpoint = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/test');
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Page</h1>
      
      <div className="space-y-4">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">Test Backend Connectivity</h2>
          <Button onClick={testAuthEndpoint} disabled={loading}>
            Test Auth Endpoint
          </Button>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">Test Registration Flow</h2>
          <Button onClick={testRegistration} disabled={loading}>
            Test Registration
          </Button>
        </Card>

        {result && (
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-2">Result:</h2>
            <pre className="whitespace-pre-wrap overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </Card>
        )}
      </div>
    </div>
  );
}