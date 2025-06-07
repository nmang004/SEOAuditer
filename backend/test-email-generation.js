const fetch = require('node-fetch');

const API_URL = 'https://seoauditer-production.up.railway.app';
const TEST_EMAIL = 'test-debug-' + Date.now() + '@example.com';

async function testEmailGeneration() {
  console.log('🧪 Testing email generation with unique email...\n');

  try {
    console.log('1. Registering with unique email to trigger fresh token generation...');
    console.log('Email:', TEST_EMAIL);
    
    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Debug Test User',
        email: TEST_EMAIL,
        password: 'TestPassword123!'
      })
    });

    const registerData = await registerResponse.json();
    console.log('\n2. Registration Response:');
    console.log('Status:', registerResponse.status);
    console.log('Data:', JSON.stringify(registerData, null, 2));

    if (registerData.success) {
      console.log('\n✅ New user created with fresh token!');
      console.log('📧 This proves token generation is working.');
      console.log('💡 The issue must be that you\'re clicking old email links.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEmailGeneration();