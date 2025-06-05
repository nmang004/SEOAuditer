#!/usr/bin/env node

/**
 * Direct SendGrid Template Discovery
 * 
 * This script uses the production environment variables from Railway
 * to discover existing SendGrid templates.
 */

const https = require('https');
const fetch = require('node-fetch');

const API_URL = 'https://seoauditer-production.up.railway.app';

async function discoverTemplatesThroughAPI() {
  console.log('🔍 Discovering SendGrid Templates via Production API...\n');
  
  try {
    // Try to get environment info first
    console.log('1. Checking email service configuration...');
    const healthResponse = await fetch(`${API_URL}/api/email/health`);
    const healthData = await healthResponse.json();
    
    console.log('Email Service Status:', healthData.email?.status || 'unknown');
    console.log('SendGrid Configured:', healthData.email?.sendgrid?.configured || false);
    
    if (!healthData.email?.sendgrid?.configured) {
      console.log('❌ SendGrid not properly configured in production');
      return;
    }
    
    // Try to send a test email to see what template issues we encounter
    console.log('\n2. Testing email sending to identify template issues...');
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
    
    const testData = await testResponse.json();
    console.log('Test Response:', JSON.stringify(testData, null, 2));
    
    // Check if we get template-related errors
    if (testData.error && testData.error.includes('template')) {
      console.log('\n📋 Template-related error detected. This suggests template configuration issues.');
      
      // Extract any template ID mentioned in the error
      const templateIdMatch = testData.error.match(/d-[a-f0-9-]+/);
      if (templateIdMatch) {
        console.log('Invalid Template ID found in error:', templateIdMatch[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function directSendGridCall() {
  console.log('🔧 Attempting direct SendGrid API call...\n');
  
  // We'll need to extract the API key from the production environment
  // This is a placeholder - we'd need the actual API key
  console.log('⚠️  This requires the actual SendGrid API key from Railway environment');
  console.log('The API key would be used to make a direct call to:');
  console.log('GET https://api.sendgrid.com/v3/templates?generations=dynamic');
  console.log('');
  console.log('Expected response format:');
  console.log(JSON.stringify({
    "result": [
      {
        "id": "d-12345678-90ab-cdef-1234-567890abcdef",
        "name": "Welcome Email Template",
        "generation": "dynamic",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
        "versions": [
          {
            "id": "12345678-90ab-cdef-1234-567890abcdef",
            "template_id": "d-12345678-90ab-cdef-1234-567890abcdef",
            "active": 1,
            "name": "Version 1",
            "subject": "Welcome to SEO Director!",
            "updated_at": "2024-01-01T00:00:00.000Z"
          }
        ]
      }
    ]
  }, null, 2));
}

// Run both discovery methods
async function runDiscovery() {
  await discoverTemplatesThroughAPI();
  console.log('\n' + '='.repeat(60) + '\n');
  await directSendGridCall();
}

runDiscovery().catch(console.error);