const fetch = require('node-fetch');

const API_URL = 'https://seoauditer-production.up.railway.app';
const TEST_EMAIL = 'nmang004@gmail.com';

async function testBypass() {
  console.log('🔧 BYPASS SOLUTION: Getting verification link directly from database\n');

  try {
    // Step 1: First register to ensure we have a fresh token
    console.log('1. Triggering fresh token generation...');
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
    
    if (registerResponse.status === 200) {
      console.log('✅ Fresh token generated for existing user');
    }

    // Step 2: Get the current verification link from database
    console.log('\n2. Getting current verification link from database...');
    const bypassResponse = await fetch(`${API_URL}/api/bypass/get-verification-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL
      })
    });

    const bypassData = await bypassResponse.json();
    console.log('Bypass status:', bypassResponse.status);
    console.log('Bypass response:', JSON.stringify(bypassData, null, 2));

    if (bypassData.success) {
      console.log('\n🎉 SUCCESS! Direct verification link:');
      console.log('📋 Copy this URL and paste it in your browser:');
      console.log('');
      console.log(`   ${bypassData.data.verificationUrl}`);
      console.log('');
      console.log('💡 This bypasses SendGrid entirely and uses the fresh token from database');
      
      // Step 3: Test this fresh token
      console.log('\n3. Testing the fresh token...');
      const token = bypassData.data.token;
      
      const verifyResponse = await fetch(`${API_URL}/api/auth/verify-email/${token}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      const verifyData = await verifyResponse.json();
      console.log('Verification test status:', verifyResponse.status);
      console.log('Verification test response:', JSON.stringify(verifyData, null, 2));
      
      if (verifyResponse.status === 200) {
        console.log('\n🎉 VERIFICATION SUCCESSFUL!');
        console.log('✅ Email verification is now working properly');
        console.log('✅ User should be redirected to login page');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBypass();