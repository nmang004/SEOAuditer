const fetch = require('node-fetch');

const API_URL = 'https://seoauditer-production.up.railway.app';
const TEST_EMAIL = 'nmang004@gmail.com';

async function createRealVerificationToken() {
  console.log('Creating a real verification token by registering a test user...\n');

  try {
    // Register a new user which will create a real verification token
    console.log('1. Registering test user to generate real verification token...');
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
    console.log('Registration response:', JSON.stringify(registerData, null, 2));

    if (registerResponse.status === 200 || registerResponse.status === 201) {
      console.log('\n✅ Registration successful!');
      console.log('📧 A verification email with a REAL database token has been sent to:', TEST_EMAIL);
      console.log('\nCheck your email and click the verification link to test the verification flow.');
    } else if (registerResponse.status === 400 && registerData.message?.includes('already exists')) {
      console.log('\n⚠️  User already exists. Let me try to resend verification...');
      
      // If user exists but is unverified, the registration endpoint should resend verification
      if (registerData.requiresVerification) {
        console.log('✅ Verification email has been resent with a real token!');
      }
    } else {
      console.log('\n❌ Registration failed:', registerData);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

createRealVerificationToken();