const https = require('https');

// Script to manually verify a user on Railway backend
async function verifyUser(email) {
  console.log(`Attempting to manually verify user: ${email}`);
  
  // First, let's try to find if there's a verification endpoint
  const options = {
    hostname: 'seoauditer-production.up.railway.app',
    port: 443,
    path: '/api/auth/debug',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response status:', res.statusCode);
        console.log('Response:', data);
        
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

// Run the verification
verifyUser('nmang004@gmail.com')
  .then(result => {
    console.log('Success:', result);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });