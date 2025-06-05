'use client';

import { useEffect, useState } from 'react';

interface DebugPageProps {
  token: string;
}

export default function DebugPage({ token }: DebugPageProps) {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    console.log('🔍 Debug page loaded with token:', token);
    setDebugInfo({
      token: token,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      location: typeof window !== 'undefined' ? window.location.href : 'server'
    });
  }, [token]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1a1a1a', 
      color: 'white', 
      padding: '2rem',
      fontFamily: 'monospace'
    }}>
      <h1>🔧 Debug Verification Page</h1>
      <h2>Token: {token?.substring(0, 16)}...</h2>
      <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      
      <div style={{ marginTop: '2rem' }}>
        <h3>Test API Call:</h3>
        <button 
          onClick={async () => {
            try {
              const response = await fetch(`/api/secure-auth/verify-email/${encodeURIComponent(token)}`);
              const data = await response.json();
              console.log('API Response:', data);
              setDebugInfo(prev => ({ ...prev, apiResponse: data }));
            } catch (error) {
              console.error('API Error:', error);
              setDebugInfo(prev => ({ ...prev, apiError: error.message }));
            }
          }}
          style={{
            backgroundColor: '#4f46e5',
            color: 'white',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Test API
        </button>
      </div>
    </div>
  );
}