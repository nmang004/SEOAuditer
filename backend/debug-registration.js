const fetch = require('node-fetch');

const API_URL = 'https://seoauditer-production.up.railway.app';
const TEST_EMAIL = 'nmang004@gmail.com';

async function debugRegistration() {
  console.log('🔍 Debugging registration process...\n');

  try {
    console.log('1. Testing API connection...');
    const healthResponse = await fetch(`${API_URL}/api/health`);
    console.log('Health check status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ API is responding');
    } else {
      console.log('❌ API health check failed');
    }

    console.log('\n2. Attempting registration...');
    console.log('URL:', `${API_URL}/api/auth/register`);
    console.log('Email:', TEST_EMAIL);
    
    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: TEST_EMAIL,
        password: 'TestPassword123!'
      })
    });

    console.log('\n3. Registration response:');
    console.log('Status:', registerResponse.status);
    console.log('Status Text:', registerResponse.statusText);
    console.log('Headers:', Object.fromEntries(registerResponse.headers.entries()));
    
    const responseText = await registerResponse.text();
    console.log('Raw response:', responseText);
    
    try {
      const registerData = JSON.parse(responseText);
      console.log('Parsed response:', JSON.stringify(registerData, null, 2));
    } catch (parseError) {
      console.log('❌ Failed to parse JSON response:', parseError.message);
      console.log('Raw response was:', responseText);
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.error('Full error:', error);
  }
}

debugRegistration();