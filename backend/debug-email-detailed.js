#!/usr/bin/env node

/**
 * Detailed Email Debugging
 * 
 * This script helps debug the specific email sending issue
 */

const fetch = require('node-fetch');

const API_URL = 'https://seoauditer-production.up.railway.app';
const TEST_EMAIL = 'nmang004@gmail.com';

async function debugEmailSystem() {
  console.log('🔍 Detailed Email System Debug\n');
  
  try {
    // 1. Check system validation
    console.log('1. System Validation Status:');
    const validationResponse = await fetch(`${API_URL}/api/admin/system-validation`);
    const validationData = await validationResponse.json();
    
    console.log('Overall passed:', validationData.validation.passed);
    
    validationData.validation.results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
      console.log(`${icon} ${result.service}: ${result.message}`);
      if (result.details && result.details.templateType) {
        console.log(`   Template type: ${result.details.templateType}`);
      }
    });
    
    // 2. Check email service health specifically
    console.log('\n2. Email Service Health:');
    const healthResponse = await fetch(`${API_URL}/api/email/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Email service status:', healthData.email?.status || 'unknown');
      console.log('SendGrid configured:', healthData.email?.sendgrid?.configured || false);
      console.log('From address:', healthData.email?.environment?.EMAIL_FROM_ADDRESS || 'not set');
    } else {
      console.log('❌ Email health endpoint not available');
    }
    
    // 3. Try to register a new user (which triggers verification email)
    console.log('\n3. Testing Registration (triggers verification email):');
    const registerResponse = await fetch(`${API_URL}/api/secure-auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: `test${Date.now()}@example.com`,
        password: 'TestPassword123!',
        name: 'Test User'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('Registration response:', JSON.stringify(registerData, null, 2));
    
    if (registerData.success) {
      console.log('✅ Registration successful - verification email should be sent');
    } else {
      console.log('❌ Registration failed:', registerData.error);
    }
    
    // 4. Try resend verification
    console.log('\n4. Testing Resend Verification:');
    const resendResponse = await fetch(`${API_URL}/api/secure-auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL
      })
    });
    
    const resendData = await resendResponse.json();
    console.log('Resend response:', JSON.stringify(resendData, null, 2));
    
    // 5. Check if there are any rate limiting issues
    console.log('\n5. Rate Limiting Check:');
    console.log('Response status:', resendResponse.status);
    console.log('Response headers:');
    resendResponse.headers.forEach((value, key) => {
      if (key.includes('rate') || key.includes('limit') || key.includes('retry')) {
        console.log(`   ${key}: ${value}`);
      }
    });
    
    // 6. Analyze error patterns
    console.log('\n6. Error Analysis:');
    if (resendData.error === 'Failed to resend verification email') {
      console.log('This generic error suggests an internal server error.');
      console.log('Possible causes:');
      console.log('- SendGrid API key issues');
      console.log('- Email template rendering errors');
      console.log('- Database connection issues');
      console.log('- Token generation failures');
      console.log('- Email service configuration problems');
    }
    
    // 7. Check if the issue is specific to resend vs new registration
    console.log('\n7. Testing Different Email Endpoints:');
    
    // Try bypass endpoint if available
    try {
      const bypassResponse = await fetch(`${API_URL}/api/bypass/send-verification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: TEST_EMAIL
        })
      });
      
      if (bypassResponse.ok) {
        const bypassData = await bypassResponse.json();
        console.log('Bypass endpoint response:', JSON.stringify(bypassData, null, 2));
      } else {
        console.log('Bypass endpoint not available or failed');
      }
    } catch (error) {
      console.log('Bypass endpoint not accessible');
    }
    
  } catch (error) {
    console.error('❌ Debug script failed:', error.message);
  }
}

debugEmailSystem().catch(console.error);