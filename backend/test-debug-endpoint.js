const fetch = require('node-fetch');

const API_URL = 'https://seoauditer-production.up.railway.app';
const TEST_EMAIL = 'nmang004@gmail.com';

async function testDebugEndpoint() {
  console.log('🔍 Testing debug endpoint to see actual token generation...\n');

  try {
    console.log('1. Calling debug endpoint for:', TEST_EMAIL);
    
    const response = await fetch(`${API_URL}/api/debug/test-verification-flow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL
      })
    });

    console.log('Status:', response.status);
    
    const data = await response.json();
    console.log('\n2. Debug Response:');
    console.log(JSON.stringify(data, null, 2));

    if (data.success && data.debug) {
      console.log('\n3. Analysis:');
      console.log('User exists:', !data.debug.isNewUser);
      console.log('Email verified:', data.debug.user.emailVerified);
      console.log('Current token in DB:', data.debug.user.tokenFull);
      console.log('Expected verification URL:', data.debug.verificationUrl);
      console.log('');
      
      const currentToken = data.debug.user.tokenFull;
      const oldToken = '5e1c764f38788fe003e5cd70f6e04de2005d2fb3ebdcbcce331ab09756b3539d';
      
      if (currentToken === oldToken) {
        console.log('❌ PROBLEM: Database still has the OLD token!');
        console.log('   This means registration logic is NOT updating the token');
      } else {
        console.log('✅ GOOD: Database has a DIFFERENT token than the old one');
        console.log('   This means SendGrid email tracking is the problem');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDebugEndpoint();