/**
 * Direct SendGrid Test - bypassing routing issues
 */

const fetch = require('node-fetch');

const payload = {
  email: "nmang004@gmail.com",
  name: "Nick Mangubat (SendGrid Test)", 
  password: "TestPassword123!@#"
};

console.log('🚀 Testing SendGrid integration directly');
console.log('📧 Target email:', payload.email);
console.log('⏰ Timestamp:', new Date().toISOString());

async function testSendGridDirect() {
  try {
    console.log('\n=== Testing Regular Auth Registration ===');
    
    const response = await fetch('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const result = await response.text();
    console.log('Raw response:', result);
    
    try {
      const data = JSON.parse(result);
      console.log('Parsed response:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log('\n🎉 Registration successful!');
        console.log('✅ Email should be sent to nmang004@gmail.com');
        console.log('📧 Check your inbox for verification email');
        
        if (data.data && data.data.requiresVerification) {
          console.log('💡 Email verification required - this is expected');
        }
        
      } else {
        console.log('\n❌ Registration failed:');
        console.log('Error:', data.error);
        console.log('Details:', data.details);
      }
      
    } catch (parseError) {
      console.log('Failed to parse JSON response:', parseError.message);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Backend server is not running');
    }
  }
}

// Run the test
testSendGridDirect().then(() => {
  console.log('\n✨ Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Test failed:', error);
  process.exit(1);
});