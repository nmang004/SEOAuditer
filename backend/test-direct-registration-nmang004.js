/**
 * Direct Registration Test for nmang004@gmail.com
 * 
 * This script directly calls the registration endpoint to trigger
 * the complete email verification flow.
 */

const fetch = require('node-fetch');

// Test configuration
const BACKEND_URL = 'http://localhost:4000';
const TEST_EMAIL = 'nmang004@gmail.com';
const TEST_NAME = 'Nick Mangubat (Test)';
const TEST_PASSWORD = 'TestPassword123!@#';

console.log('🚀 Starting direct registration test');
console.log(`📧 Target email: ${TEST_EMAIL}`);
console.log(`🌐 Backend URL: ${BACKEND_URL}`);
console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

async function testDirectRegistration() {
  try {
    console.log('\n=== STEP 1: Testing Backend Health ===');
    
    const healthResponse = await fetch(`${BACKEND_URL}/api/health`);
    const healthData = await healthResponse.json();
    
    console.log('✅ Backend health check:');
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Message: ${healthData.message}`);
    console.log(`   Version: ${healthData.version}`);
    
    console.log('\n=== STEP 2: Testing Secure Token Auth Health ===');
    
    const tokenHealthResponse = await fetch(`${BACKEND_URL}/api/secure-auth/token-health`);
    const tokenHealthData = await tokenHealthResponse.json();
    
    console.log('🏥 Token system health:');
    console.log(`   Status: ${tokenHealthResponse.status}`);
    console.log(`   Success: ${tokenHealthData.success}`);
    if (tokenHealthData.data) {
      console.log(`   Email Service: ${JSON.stringify(tokenHealthData.data.emailService)}`);
      console.log(`   Token System: ${JSON.stringify(tokenHealthData.data.tokenSystem)}`);
    }
    
    console.log('\n=== STEP 3: Attempting Registration ===');
    
    const registrationData = {
      email: TEST_EMAIL,
      name: TEST_NAME,
      password: TEST_PASSWORD
    };
    
    console.log('📝 Registration data:');
    console.log(`   Email: ${registrationData.email}`);
    console.log(`   Name: ${registrationData.name}`);
    console.log(`   Password: [${registrationData.password.length} characters]`);
    
    const registrationResponse = await fetch(`${BACKEND_URL}/api/secure-auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(registrationData)
    });
    
    const registrationResult = await registrationResponse.json();
    
    console.log('\n📧 Registration response:');
    console.log(`   Status: ${registrationResponse.status}`);
    console.log(`   Success: ${registrationResult.success}`);
    console.log(`   Message: ${registrationResult.message}`);
    
    if (registrationResult.success) {
      console.log('✅ Registration successful!');
      
      if (registrationResult.data) {
        console.log(`   Requires Verification: ${registrationResult.data.requiresVerification}`);
        console.log(`   Token Sent: ${registrationResult.data.tokenSent}`);
        console.log(`   Email Message ID: ${registrationResult.data.emailMessageId}`);
      }
      
      if (registrationResult.metadata) {
        console.log(`   Correlation ID: ${registrationResult.metadata.correlationId}`);
        console.log(`   Is New User: ${registrationResult.metadata.isNewUser}`);
        console.log(`   Token Sequence: ${registrationResult.metadata.tokenSequence}`);
      }
      
      console.log('\n🎉 EMAIL VERIFICATION TEST SUCCESSFUL!');
      console.log('\n📝 NEXT STEPS:');
      console.log('1. Check nmang004@gmail.com for the verification email');
      console.log('2. Look for an email from the SEO Director system');
      console.log('3. Click the verification link in the email');
      console.log('4. Verify that the verification page loads correctly');
      console.log('5. Confirm that the token works exactly once');
      
      if (registrationResult.data?.emailMessageId) {
        console.log(`\n📧 Email tracking: Message ID ${registrationResult.data.emailMessageId}`);
        console.log('   You can use this ID to track delivery in SendGrid dashboard');
      }
      
    } else {
      console.log('❌ Registration failed:');
      console.log(`   Error: ${registrationResult.error}`);
      console.log(`   Details: ${registrationResult.details}`);
      
      if (registrationResult.correlationId) {
        console.log(`   Correlation ID: ${registrationResult.correlationId}`);
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🔌 Connection refused - Backend server is not running');
      console.error('   Please start the backend server with: npm run dev');
    } else {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test
testDirectRegistration().then(() => {
  console.log('\n✨ Test script completed');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Test script failed:', error);
  process.exit(1);
});