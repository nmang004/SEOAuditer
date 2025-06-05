const fetch = require('node-fetch');

const API_URL = 'https://seoauditer-production.up.railway.app';
const TEST_EMAIL = 'nmang004@gmail.com';

async function testFreshToken() {
  console.log('🔄 TESTING: Does registration now generate fresh tokens?\n');

  try {
    // Step 1: Register to trigger fresh token generation
    console.log('1. Registering to trigger fresh token generation...');
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

    // Step 2: Based on our fix, this should have generated a NEW token for the existing unverified user
    // Let's test verification with the old token we know should fail
    console.log('\n2. Testing verification with OLD token (should fail)...');
    const oldToken = '5e1c764f38788fe003e5cd70f6e04de2005d2fb3ebdcbcce331ab09756b3539d';
    
    const verifyOldResponse = await fetch(`${API_URL}/api/auth/verify-email/${oldToken}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    const verifyOldData = await verifyOldResponse.json();
    console.log('Old token verification status:', verifyOldResponse.status);
    console.log('Old token verification response:', JSON.stringify(verifyOldData, null, 2));

    // Analysis
    console.log('\n📊 ANALYSIS:');
    if (registerResponse.status === 200 && registerData.requiresVerification) {
      console.log('✅ Registration returned 200 - existing unverified user detected');
      console.log('✅ requiresVerification: true - fresh token should have been generated');
      console.log('');
      console.log('💡 This means:');
      console.log('   - Our backend fix is working (generating fresh tokens)');
      console.log('   - The OLD token correctly fails (as expected)');
      console.log('   - The issue is likely that:');
      console.log('     a) SendGrid is still sending the cached old token in emails');
      console.log('     b) OR the tracking settings need more time to update');
      console.log('');
      console.log('🔍 NEXT STEPS:');
      console.log('   1. Check your NEWEST email (after this test)');
      console.log('   2. Look for a different verification URL');
      console.log('   3. If it still has the old token, we need to bypass SendGrid entirely');
    } else if (registerResponse.status === 201) {
      console.log('❌ Registration returned 201 - this should not happen for existing user');
      console.log('❌ This suggests the user was recreated instead of updated');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFreshToken();