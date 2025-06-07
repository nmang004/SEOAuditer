// Quick verification script 
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

async function quickVerify() {
  console.log('🔄 Attempting to generate fresh verification token...\n');
  
  // Try to trigger token regeneration by hitting register again (will fail but might refresh token)
  const registerResult = await makeRequest('/api/secure-auth/register', 'POST', {
    email: 'nmang004@gmail.com',
    password: '6z4vbgdsWKHwEJj!!',
    name: 'Nicholas Mangubat'
  });
  
  console.log('Register attempt status:', registerResult.status);
  console.log('Register response:', JSON.stringify(registerResult.data, null, 2));
  
  // Now try to get verification link again
  console.log('\n🔍 Checking for verification link...');
  const linkResult = await makeRequest('/api/bypass/get-verification-link', 'POST', {
    email: 'nmang004@gmail.com'
  });
  
  console.log('Link result status:', linkResult.status);
  console.log('Link response:', JSON.stringify(linkResult.data, null, 2));
  
  if (linkResult.status === 200 && linkResult.data.success) {
    console.log('\n✅ SUCCESS! Found verification URL:');
    console.log('🔗', linkResult.data.data.verificationUrl);
    console.log('\n📋 Instructions:');
    console.log('1. Copy the URL above');
    console.log('2. Paste it in your browser');  
    console.log('3. Complete verification');
    console.log('4. Return to login page and try logging in');
  } else {
    console.log('\n❌ Still unable to get verification link');
  }
}

quickVerify().catch(console.error);