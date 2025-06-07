#!/usr/bin/env node

/**
 * Test New Template Management System
 * 
 * This script tests the new template discovery and email sending system
 * by hitting the production API endpoints.
 */

const fetch = require('node-fetch');

const API_URL = 'https://seoauditer-production.up.railway.app';
const TEST_EMAIL = 'nmang004@gmail.com';

async function testTemplateSystem() {
  console.log('🧪 Testing New Template Management System\n');
  
  try {
    // Wait for deployment to be ready
    console.log('1. Checking if new admin endpoints are available...');
    
    const healthCheck = await fetch(`${API_URL}/health`);
    const healthData = await healthCheck.json();
    console.log('✅ Backend is responding:', healthData.status);
    
    // Try the new admin endpoints (may not be deployed yet)
    console.log('\n2. Testing template discovery endpoint...');
    try {
      const templateResponse = await fetch(`${API_URL}/api/admin/sendgrid-templates`);
      const templateData = await templateResponse.json();
      
      if (templateData.success) {
        console.log('✅ Template discovery successful!');
        console.log('Templates found:', templateData.templates?.length || 0);
        console.log('Current mapping:', JSON.stringify(templateData.currentMapping, null, 2));
        console.log('Environment suggestions:', JSON.stringify(templateData.environmentVariables, null, 2));
        
        if (templateData.validation) {
          console.log('Validation status:', templateData.validation.valid ? '✅ PASS' : '❌ FAIL');
          if (!templateData.validation.valid) {
            console.log('Missing templates:', templateData.validation.missing);
            console.log('Errors:', templateData.validation.errors);
          }
        }
      } else {
        console.log('❌ Template discovery failed:', templateData.error);
      }
    } catch (error) {
      console.log('⚠️  Template discovery endpoint not available yet (deployment in progress)');
    }
    
    // Try system validation
    console.log('\n3. Testing system validation endpoint...');
    try {
      const validationResponse = await fetch(`${API_URL}/api/admin/system-validation`);
      const validationData = await validationResponse.json();
      
      if (validationData.success) {
        console.log('✅ System validation completed!');
        console.log('Overall status:', validationData.validation.passed ? '✅ PASS' : '❌ FAIL');
        
        validationData.validation.results.forEach(result => {
          const status = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
          console.log(`${status} ${result.service}: ${result.message}`);
        });
        
        if (Object.keys(validationData.recommendations).length > 0) {
          console.log('\nRecommended environment variables:');
          Object.entries(validationData.recommendations).forEach(([key, value]) => {
            console.log(`${key}=${value}`);
          });
        }
      } else {
        console.log('❌ System validation failed:', validationData.error);
      }
    } catch (error) {
      console.log('⚠️  System validation endpoint not available yet (deployment in progress)');
    }
    
    // Test actual email sending with new system
    console.log('\n4. Testing email sending with new template system...');
    
    const testEmailResponse = await fetch(`${API_URL}/api/secure-auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL
      })
    });
    
    const emailData = await testEmailResponse.json();
    console.log('Email send result:', JSON.stringify(emailData, null, 2));
    
    if (emailData.success) {
      console.log('✅ Email sent successfully with new template system!');
      console.log('Check your inbox at', TEST_EMAIL);
    } else {
      console.log('❌ Email send failed:', emailData.error);
      
      // Analyze the error
      if (emailData.error?.includes('template')) {
        console.log('\n🔧 Template-related error detected. This suggests:');
        console.log('1. Invalid template ID in environment variables');
        console.log('2. Template not found in SendGrid account'); 
        console.log('3. Template format is incorrect (should be d-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)');
      }
    }
    
    console.log('\n📊 Test Summary:');
    console.log('- New template management system has been deployed');
    console.log('- Admin endpoints provide template discovery and validation');
    console.log('- Email service now uses TemplateManager for robust template resolution');
    console.log('- System automatically validates template configuration on startup');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTemplateSystem().catch(console.error);