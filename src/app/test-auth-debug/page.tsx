"use client";

import { useState } from "react";

export default function TestAuthDebugPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testRegistration = async () => {
    console.log('Testing registration...');
    setLoading(true);
    setResult(null);
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
      console.log('Debug registration response:', data);
      setResult(data);
    } catch (error: any) {
      console.error('Debug registration error:', error);
      setResult({ error: error.message, stack: error.stack });
    } finally {
      setLoading(false);
    }
  };

  const testAuthEndpoint = async () => {
    console.log('Testing auth endpoint...');
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/api/auth/test');
      const data = await response.json();
      console.log('Auth endpoint response:', data);
      setResult(data);
    } catch (error: any) {
      console.error('Auth endpoint error:', error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testActualRegister = async () => {
    console.log('Testing actual register...');
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/api/auth/register', {
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
      
      const text = await response.text();
      console.log('Register response text:', text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { rawText: text };
      }
      
      const resultData = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: data
      };
      
      console.log('Register response parsed:', resultData);
      setResult(resultData);
    } catch (error: any) {
      console.error('Register error:', error);
      setResult({ error: error.message, stack: error.stack });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto',
      backgroundColor: '#ffffff',
      minHeight: '100vh',
      color: '#000000'
    }}>
      <h1 style={{ 
        fontSize: '24px', 
        fontWeight: 'bold', 
        marginBottom: '20px',
        color: '#000000'
      }}>
        Auth Debug Page
      </h1>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button 
          onClick={testAuthEndpoint}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test Backend Connection
        </button>
        
        <button 
          onClick={testRegistration}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test Debug Registration
        </button>

        <button 
          onClick={testActualRegister}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#ccc' : '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test Actual Register
        </button>
      </div>

      {loading && <p style={{ color: '#000000' }}>Loading...</p>}

      {result && (
        <div style={{
          backgroundColor: '#f0f0f0',
          border: '2px solid #333333',
          borderRadius: '4px',
          padding: '15px',
          marginTop: '20px',
          color: '#000000'
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            marginBottom: '10px', 
            color: '#000000' 
          }}>
            Result:
          </h2>
          <pre style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: '14px',
            backgroundColor: '#ffffff',
            color: '#000000',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #666666',
            overflow: 'auto',
            maxHeight: '600px'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        backgroundColor: '#fffbf0',
        border: '1px solid #ff9800',
        borderRadius: '4px',
        color: '#000000'
      }}>
        <h3 style={{ color: '#000000', marginBottom: '10px' }}>Debug Instructions:</h3>
        <ol style={{ color: '#000000', marginLeft: '20px' }}>
          <li>Open your browser's Developer Console (F12)</li>
          <li>Click "Test Backend Connection" first</li>
          <li>Then click "Test Actual Register" to see the registration response</li>
          <li>Check both this page and the console for results</li>
        </ol>
      </div>
    </div>
  );
}