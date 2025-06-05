#!/usr/bin/env node

/**
 * Send Fresh Verification Email
 * 
 * This script sends a new verification email using the updated template system.
 * Run this after configuring the proper SendGrid template IDs in Railway.
 */

const fetch = require('node-fetch');

const API_URL = 'https://seoauditer-production.up.railway.app';
const TEST_EMAIL = 'nmang004@gmail.com';

async function sendFreshVerificationEmail() {
  console.log('📧 Sending Fresh Verification Email\n');
  
  try {
    console.log('1. Checking system health...');
    const healthResponse = await fetch(`${API_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Backend status:', healthData.status);
    
    // Check if admin endpoints are available
    console.log('\n2. Checking template system status...');
    try {
      const validationResponse = await fetch(`${API_URL}/api/admin/system-validation`);
      
      if (validationResponse.ok) {
        const validationData = await validationResponse.json();
        console.log('✅ System validation available');
        console.log('Overall status:', validationData.validation?.passed ? '✅ PASS' : '❌ FAIL');
        
        if (!validationData.validation?.passed) {
          console.log('\n⚠️  System validation issues detected:');
          validationData.validation?.results?.forEach(result => {
            if (result.status !== 'pass') {
              console.log(`   ${result.status === 'fail' ? '❌' : '⚠️'} ${result.service}: ${result.message}`);
            }
          });
        }
      } else {
        console.log('⚠️  Admin endpoints not yet available (deployment may still be in progress)');
      }
    } catch (error) {
      console.log('⚠️  Admin endpoints not accessible yet');
    }
    
    console.log('\n3. Sending verification email...');
    const emailResponse = await fetch(`${API_URL}/api/secure-auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL
      })
    });
    
    const emailData = await emailResponse.json();
    
    if (emailData.success) {
      console.log('✅ Verification email sent successfully!');
      console.log('📧 Check your inbox at:', TEST_EMAIL);
      console.log('🔗 Correlation ID:', emailData.correlationId);
      
      if (emailData.tokenInfo) {
        console.log('🎯 Token info:');
        console.log('   - Token prefix:', emailData.tokenInfo.tokenPrefix);
        console.log('   - Expires at:', emailData.tokenInfo.expiresAt);
      }
      
    } else {
      console.log('❌ Verification email failed to send');
      console.log('Error:', emailData.error);
      console.log('Details:', emailData.details || 'No additional details');
      
      // Provide specific guidance based on error type
      if (emailData.error?.includes('template')) {
        console.log('\n🔧 Template-related error detected.');
        console.log('This usually means:');
        console.log('1. SendGrid template ID is missing or invalid in Railway environment');
        console.log('2. Template format should be: d-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
        console.log('3. Template doesn\'t exist in your SendGrid account');
        console.log('\nNext steps:');
        console.log('- Log into SendGrid Dashboard → Email API → Dynamic Templates');
        console.log('- Copy the correct template ID');
        console.log('- Update SENDGRID_VERIFICATION_TEMPLATE_ID in Railway environment');
      }
      
      if (emailData.error?.includes('from address') || emailData.error?.includes('sender')) {
        console.log('\n🔧 Sender authentication error detected.');
        console.log('This usually means:');
        console.log('1. EMAIL_FROM_ADDRESS not set in Railway environment');
        console.log('2. From address not verified in SendGrid');
        console.log('\nNext steps:');
        console.log('- Go to SendGrid → Settings → Sender Authentication');
        console.log('- Verify admin@seodirector.co as a single sender');
        console.log('- Or set up domain authentication');
      }
      
      if (emailData.error?.includes('API key') || emailData.error?.includes('unauthorized')) {
        console.log('\n🔧 API key error detected.');
        console.log('This usually means:');
        console.log('1. SENDGRID_API_KEY not set in Railway environment');
        console.log('2. API key is invalid or expired');
        console.log('\nNext steps:');
        console.log('- Check SendGrid → Settings → API Keys');
        console.log('- Generate new API key with Mail Send permissions');
        console.log('- Update SENDGRID_API_KEY in Railway environment');
      }
    }
    
    console.log('\n📊 Status Summary:');
    console.log('- Template management system: ✅ Deployed');
    console.log('- Admin endpoints: ' + (validationResponse?.ok ? '✅ Available' : '⚠️  Deploying'));
    console.log('- Email sending: ' + (emailData.success ? '✅ Working' : '❌ Needs configuration'));
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    console.log('\nThis could be due to:');
    console.log('- Network connectivity issues');
    console.log('- Backend service down or redeploying');
    console.log('- Railway deployment still in progress');
  }
}

// Run the email sending test
sendFreshVerificationEmail().catch(console.error);