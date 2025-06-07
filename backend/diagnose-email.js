const fetch = require('node-fetch');

const API_URL = 'https://seoauditer-production.up.railway.app';

async function diagnoseEmail() {
  console.log('=== Email Service Diagnosis ===\n');

  try {
    // 1. Check health and configuration
    console.log('1. Checking email service configuration...');
    const healthResponse = await fetch(`${API_URL}/api/email/health`);
    const healthData = await healthResponse.json();
    
    console.log('\nEnvironment Configuration:');
    console.log('- EMAIL_PROVIDER:', healthData.email?.environment?.EMAIL_PROVIDER || 'not set');
    console.log('- SENDGRID_API_KEY_SET:', healthData.email?.environment?.SENDGRID_API_KEY_SET || false);
    console.log('- SENDGRID_API_KEY_STARTS_WITH_SG:', healthData.email?.environment?.SENDGRID_API_KEY_STARTS_WITH_SG || false);
    console.log('- EMAIL_FROM_ADDRESS:', healthData.email?.environment?.EMAIL_FROM_ADDRESS || 'not set');
    console.log('- EMAIL_FROM_NAME_SET:', healthData.email?.environment?.EMAIL_FROM_NAME_SET || false);
    
    console.log('\nService Status:');
    console.log('- Status:', healthData.email?.status || 'unknown');
    console.log('- Provider:', healthData.email?.provider?.name || 'unknown');
    console.log('- Provider Valid:', healthData.email?.provider?.isValid || false);
    
    console.log('\nStats:');
    console.log('- Sent:', healthData.email?.stats?.sent || 0);
    console.log('- Failed:', healthData.email?.stats?.failed || 0);
    console.log('- Last Error:', healthData.email?.stats?.lastError || 'none');
    
    // 2. Test different email types
    console.log('\n2. Testing different email types...\n');
    
    const emailTypes = ['welcome', 'password-reset', 'password-changed', 'email-change'];
    
    for (const type of emailTypes) {
      console.log(`Testing ${type} email...`);
      const response = await fetch(`${API_URL}/api/email/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'nmang004@gmail.com',
          type: type
        })
      });
      
      const data = await response.json();
      console.log(`- ${type}: ${data.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (!data.success && data.error) {
        console.log(`  Error: ${data.error}`);
      }
    }
    
    // 3. Final stats
    console.log('\n3. Final statistics...');
    const statsResponse = await fetch(`${API_URL}/api/email/stats`);
    const statsData = await statsResponse.json();
    console.log('Total sent:', statsData.stats?.sent || 0);
    console.log('Total failed:', statsData.stats?.failed || 0);
    
    console.log('\n=== Diagnosis Complete ===');
    console.log('\nNext steps:');
    console.log('1. Check Railway logs for detailed error messages');
    console.log('2. Verify the EMAIL_FROM_ADDRESS matches your verified sender');
    console.log('3. Check SendGrid Activity Feed for any blocked emails');
    
  } catch (error) {
    console.error('Diagnosis error:', error.message);
  }
}

diagnoseEmail();