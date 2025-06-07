const fetch = require('node-fetch');

const API_URL = 'https://seoauditer-production.up.railway.app';
const TEST_EMAIL = 'nmang004@gmail.com';

async function manualTokenTest() {
  console.log('🔧 MANUAL TOKEN TEST - Bypassing SendGrid entirely...\n');

  try {
    // Step 1: Register to trigger token generation
    console.log('1. Registering to trigger token generation...');
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

    const registerData = await registerResponse.json();
    console.log('Registration status:', registerResponse.status);
    console.log('Registration response:', JSON.stringify(registerData, null, 2));

    // Step 2: Try verifying with a few different token patterns to see what works
    console.log('\n2. Testing different verification approaches...');
    
    // Test with the old token we keep seeing
    const oldToken = '5e1c764f38788fe003e5cd70f6e04de2005d2fb3ebdcbcce331ab09756b3539d';
    console.log('\nTesting old token:', oldToken);
    
    const verifyOldResponse = await fetch(`${API_URL}/api/auth/verify-email/${oldToken}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    const verifyOldData = await verifyOldResponse.json();
    console.log('Old token status:', verifyOldResponse.status);
    console.log('Old token response:', JSON.stringify(verifyOldData, null, 2));

    // If old token failed, let's see what error we get
    if (!verifyOldData.success) {
      console.log('\n💡 As expected, old token failed. This confirms:');
      console.log('   - API verification endpoint is working');
      console.log('   - Token validation is working');
      console.log('   - The issue is that emails contain the wrong/old token');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

manualTokenTest();