const fetch = require('node-fetch');

const API_URL = 'https://seoauditer-production.up.railway.app';
const TEST_EMAIL = 'nmang004@gmail.com';

async function sendTestEmail() {
  console.log('Sending test email to:', TEST_EMAIL);
  console.log('Using verified sender: admin@seodirector.co\n');

  try {
    // First check the health status
    console.log('1. Checking email service health...');
    const healthResponse = await fetch(`${API_URL}/api/email/health`);
    const healthData = await healthResponse.json();
    console.log('Health Status:', healthData.email?.status || 'unknown');
    console.log('From Address:', healthData.email?.environment?.EMAIL_FROM_ADDRESS || 'not set');
    
    // Send test email
    console.log('\n2. Sending test welcome email...');
    const testResponse = await fetch(`${API_URL}/api/email/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: TEST_EMAIL,
        type: 'welcome'
      })
    });
    
    const testData = await testResponse.json();
    console.log('Response:', JSON.stringify(testData, null, 2));
    
    if (testData.success) {
      console.log('\n✅ Email sent successfully! Check your inbox at', TEST_EMAIL);
    } else {
      console.log('\n❌ Email failed to send. Check Railway logs for details.');
    }
    
    // Check stats
    console.log('\n3. Checking email stats...');
    const statsResponse = await fetch(`${API_URL}/api/email/stats`);
    const statsData = await statsResponse.json();
    console.log('Emails sent:', statsData.stats?.sent || 0);
    console.log('Emails failed:', statsData.stats?.failed || 0);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

sendTestEmail();