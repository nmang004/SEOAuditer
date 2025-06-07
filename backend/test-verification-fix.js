const fetch = require('node-fetch');

const API_URL = 'https://seoauditer-production.up.railway.app';
const TEST_EMAIL = 'debug-verification@example.com';

async function testTokenVerification() {
  console.log('🔍 TESTING TOKEN VERIFICATION AFTER DATABASE FIX');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Register a user to generate a token
    console.log('Step 1: Registering user to generate token...');
    const registerResponse = await fetch(`${API_URL}/api/secure-auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Debug User',
        email: TEST_EMAIL,
        password: 'SecurePassword123!'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log(`Register Status: ${registerResponse.status}`);
    console.log(`Register Success: ${registerData.success}`);
    
    if (!registerData.success) {
      console.log('❌ Registration failed:', registerData.error);
      return;
    }
    
    // Step 2: Get verification token via bypass endpoint
    console.log('\nStep 2: Getting verification token...');
    const bypassResponse = await fetch(`${API_URL}/api/bypass/get-verification-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL })
    });
    
    const bypassData = await bypassResponse.json();
    console.log(`Bypass Status: ${bypassResponse.status}`);
    console.log(`Bypass Success: ${bypassData.success}`);
    
    if (!bypassData.success) {
      console.log('❌ Token retrieval failed:', bypassData.error);
      return;
    }
    
    const token = bypassData.data.token;
    console.log(`Token received: ${token.substring(0, 8)}...`);
    console.log(`Verification URL: ${bypassData.data.verificationUrl}`);
    
    // Step 3: Test token verification
    console.log('\nStep 3: Testing token verification...');
    const verifyResponse = await fetch(`${API_URL}/api/secure-auth/verify-email/${token}`);
    const verifyData = await verifyResponse.json();
    
    console.log(`Verify Status: ${verifyResponse.status}`);
    console.log(`Verify Success: ${verifyData.success}`);
    
    if (verifyData.success) {
      console.log('✅ TOKEN VERIFICATION SUCCESSFUL!');
      console.log(`Email verified: ${verifyData.data.verified}`);
      console.log(`User email: ${verifyData.data.email}`);
    } else {
      console.log('❌ TOKEN VERIFICATION FAILED:');
      console.log(`Error: ${verifyData.error}`);
    }
    
    console.log('\n='.repeat(60));
    console.log('TEST COMPLETE');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testTokenVerification();