const fetch = require('node-fetch');

const API_URL = 'https://seoauditer-production.up.railway.app';

async function testEmailEndpoints() {
  console.log('Testing Email Service Endpoints...\n');

  // Test 1: Health Check
  console.log('1. Testing /api/email/health endpoint:');
  try {
    const healthResponse = await fetch(`${API_URL}/api/email/health`);
    const healthData = await healthResponse.json();
    console.log('Status:', healthResponse.status);
    console.log('Response:', JSON.stringify(healthData, null, 2));
  } catch (error) {
    console.error('Health check failed:', error.message);
  }

  console.log('\n2. Testing /api/email/test endpoint:');
  try {
    const testResponse = await fetch(`${API_URL}/api/email/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'test@example.com',
        type: 'welcome'
      })
    });
    const testData = await testResponse.json();
    console.log('Status:', testResponse.status);
    console.log('Response:', JSON.stringify(testData, null, 2));
  } catch (error) {
    console.error('Test email failed:', error.message);
  }

  console.log('\n3. Testing /api/email/stats endpoint:');
  try {
    const statsResponse = await fetch(`${API_URL}/api/email/stats`);
    const statsData = await statsResponse.json();
    console.log('Status:', statsResponse.status);
    console.log('Response:', JSON.stringify(statsData, null, 2));
  } catch (error) {
    console.error('Stats check failed:', error.message);
  }
}

testEmailEndpoints();