const fetch = require('node-fetch');

const API_URL = 'https://seoauditer-production.up.railway.app';
const DIFFERENT_EMAIL = 'test-debug-fresh-' + Date.now() + '@gmail.com';

async function testDifferentEmail() {
  console.log('🧪 Testing with completely different email to check if we get different token...\n');

  try {
    console.log('Email:', DIFFERENT_EMAIL);
    
    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Fresh Test User',
        email: DIFFERENT_EMAIL,
        password: 'TestPassword123!'
      })
    });

    const registerData = await registerResponse.json();
    console.log('Registration Response:');
    console.log('Status:', registerResponse.status);
    console.log('Data:', JSON.stringify(registerData, null, 2));

    if (registerData.success) {
      console.log('\n✅ New user created - this should generate a completely different token');
      console.log('📧 Email sent to:', DIFFERENT_EMAIL);
      console.log('💡 If this email also has the same old token 5e1c764f38788fe003e5cd70f6e04de2005d2fb3ebdcbcce331ab09756b3539d,');
      console.log('   then SendGrid has a serious caching/tracking issue');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDifferentEmail();