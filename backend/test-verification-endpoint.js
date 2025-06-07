const axios = require('axios');

async function testVerificationEndpoint() {
  // Use the token we just generated in the previous test
  const token = 'aaa76376c53cf903a027817bc1f516aff273a8c3120d70034ed44291f15e9b38';
  const baseUrl = 'http://localhost:4000';
  
  console.log('=== TESTING VERIFICATION ENDPOINT ===');
  console.log('Token:', token);
  console.log('URL:', `${baseUrl}/api/secure-auth/verify-email/${token}`);
  
  try {
    const response = await axios.get(`${baseUrl}/api/secure-auth/verify-email/${token}`, {
      timeout: 10000
    });
    
    console.log('✅ Verification successful!');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Verification failed');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    } else if (error.request) {
      console.log('No response received:', error.message);
    } else {
      console.log('Request error:', error.message);
    }
  }
}

testVerificationEndpoint().catch(console.error);