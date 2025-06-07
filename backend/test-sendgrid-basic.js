#!/usr/bin/env node

/**
 * Test Basic SendGrid Functionality
 * 
 * This tests if SendGrid can send a simple email without templates
 */

const fetch = require('node-fetch');

const API_URL = 'https://seoauditer-production.up.railway.app';

async function testBasicSendGrid() {
  console.log('🧪 Testing Basic SendGrid Functionality\n');
  
  try {
    // Create a simple test API endpoint call
    console.log('1. Testing a basic email endpoint (if available)...');
    
    // Try the email health endpoint first
    const healthResponse = await fetch(`${API_URL}/api/email/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Email health response:');
      console.log(JSON.stringify(healthData, null, 2));
      
      if (healthData.email?.sendgrid?.configured) {
        console.log('✅ SendGrid appears to be configured');
      } else {
        console.log('❌ SendGrid not configured according to health check');
      }
    }
    
    // Try to send a simple test email if there's a test endpoint
    console.log('\n2. Looking for email test endpoints...');
    
    const testResponse = await fetch(`${API_URL}/api/email/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'nmang004@gmail.com',
        type: 'welcome'
      })
    });
    
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('Test email response:');
      console.log(JSON.stringify(testData, null, 2));
    } else {
      console.log('No test email endpoint available or failed');
    }
    
    console.log('\n3. Analyzing the issue...');
    console.log('Based on the 500 errors in registration and resend:');
    console.log('');
    console.log('Possible causes:');
    console.log('1. ❌ SendGrid API key invalid or expired');
    console.log('2. ❌ From email address not verified in SendGrid');
    console.log('3. ❌ Template rendering error in production');
    console.log('4. ❌ Database connection issue during token generation');
    console.log('5. ❌ Missing dependencies in production build');
    console.log('');
    console.log('Next steps:');
    console.log('1. Check Railway logs for the specific error message');
    console.log('2. Verify SendGrid API key is valid');
    console.log('3. Verify admin@seodirector.co is verified in SendGrid');
    console.log('4. Test with a simple HTML email (no templates)');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBasicSendGrid().catch(console.error);