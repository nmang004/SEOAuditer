const axios = require('axios');

async function testRegistrationFlow() {
  const baseUrl = 'http://localhost:4000';
  const testUser = {
    name: 'Token Test User',
    email: 'token-test@example.com',
    password: 'TestPassword123!@#'
  };
  
  console.log('=== TESTING REGISTRATION FLOW ===');
  console.log('Test user:', testUser);
  
  try {
    // First, register the user
    console.log('\n1. Registering user...');
    const registerResponse = await axios.post(`${baseUrl}/api/secure-auth/register`, testUser, {
      timeout: 15000
    });
    
    console.log('✅ Registration successful!');
    console.log('Status:', registerResponse.status);
    console.log('Response:', registerResponse.data);
    
    // Extract the correlation ID for tracking
    const correlationId = registerResponse.data.metadata?.correlationId;
    console.log('Correlation ID:', correlationId);
    
    // The token should now be in the database and a verification email should be sent
    console.log('\n2. Verification process initiated');
    
    return {
      success: true,
      correlationId,
      email: testUser.email
    };
    
  } catch (error) {
    console.log('❌ Registration failed');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    } else if (error.request) {
      console.log('No response received:', error.message);
    } else {
      console.log('Request error:', error.message);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

testRegistrationFlow().catch(console.error);