const fetch = require('node-fetch');

const API_URL = 'https://seoauditer-production.up.railway.app';
const TEST_EMAIL = 'nmang004@gmail.com';

async function sendSpecificEmails() {
  console.log('Sending specific email types to:', TEST_EMAIL);
  console.log('Using verified sender: admin@seodirector.co\n');

  const emailTypes = [
    { type: 'welcome', description: 'Welcome to SEO Director' },
    { type: 'email-change', description: 'Verify Your New Email Address' }
  ];

  for (const { type, description } of emailTypes) {
    console.log(`\nSending ${type} email (${description})...`);
    
    try {
      const response = await fetch(`${API_URL}/api/email/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: TEST_EMAIL,
          type: type
        })
      });
      
      const data = await response.json();
      console.log(`Result: ${data.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (data.success) {
        console.log(`Check your inbox for: "${description}"`);
      }
      
      // Wait 2 seconds between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`Error sending ${type} email:`, error.message);
    }
  }
  
  console.log('\n✅ Done! Check your inbox and spam folder for the missing emails.');
}

sendSpecificEmails();