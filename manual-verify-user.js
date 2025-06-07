// Manual user verification script for Railway backend
const https = require('https');

async function makeRequest(path, method = 'POST', data = null) {
  const options = {
    hostname: 'seoauditer-production.up.railway.app',
    port: 443,
    path: path,
    method: method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`${method} ${path} - Status: ${res.statusCode}`);
        console.log('Response:', responseData);
        
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function manuallyVerifyUser() {
  try {
    console.log('=== Manual User Verification Process ===\n');
    
    // Step 1: Try to get current verification link
    console.log('1. Checking current verification status...');
    const linkResult = await makeRequest('/api/bypass/get-verification-link', 'POST', {
      email: 'nmang004@gmail.com'
    });
    
    if (linkResult.status === 200) {
      console.log('✅ Found valid verification token!');
      console.log('🔗 Verification URL:', linkResult.data.data.verificationUrl);
      console.log('\n📋 To complete verification:');
      console.log('1. Copy this URL and paste it in your browser:');
      console.log('   ', linkResult.data.data.verificationUrl);
      console.log('2. This will verify your email and enable login');
      return;
    }
    
    // Step 2: If token expired, try to resend verification
    console.log('\n2. Token expired, attempting to resend verification...');
    const resendResult = await makeRequest('/api/secure-auth/resend-verification', 'POST', {
      email: 'nmang004@gmail.com'
    });
    
    if (resendResult.status === 200) {
      console.log('✅ New verification email sent!');
      
      // Try to get the new link
      console.log('\n3. Getting new verification link...');
      const newLinkResult = await makeRequest('/api/bypass/get-verification-link', 'POST', {
        email: 'nmang004@gmail.com'
      });
      
      if (newLinkResult.status === 200) {
        console.log('🔗 New Verification URL:', newLinkResult.data.data.verificationUrl);
        console.log('\n📋 To complete verification:');
        console.log('1. Copy this URL and paste it in your browser:');
        console.log('   ', newLinkResult.data.data.verificationUrl);
        console.log('2. This will verify your email and enable login');
      }
    } else {
      console.log('❌ Email sending failed on Railway backend');
      console.log('💡 This is likely due to SendGrid configuration issues');
      console.log('\n🔧 Alternative solution needed:');
      console.log('- The user exists but needs manual database verification');
      console.log('- Or email service needs to be fixed on Railway');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the verification process
manuallyVerifyUser();