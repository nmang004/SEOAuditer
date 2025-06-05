#!/usr/bin/env node

/**
 * SendGrid Template Discovery Utility
 * 
 * This utility connects to SendGrid and lists all available templates
 * to help identify the correct template IDs for our email system.
 */

const sgMail = require('@sendgrid/mail');

async function discoverSendGridTemplates() {
  console.log('🔍 Discovering SendGrid Templates...\n');
  
  // Check if API key is available
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error('❌ SENDGRID_API_KEY environment variable not found');
    console.log('\nPlease set your SendGrid API key:');
    console.log('export SENDGRID_API_KEY="your-api-key-here"');
    process.exit(1);
  }

  sgMail.setApiKey(apiKey);

  try {
    // Use SendGrid's Web API to fetch templates
    const https = require('https');
    const templates = await fetchTemplates(apiKey);
    
    if (!templates || templates.length === 0) {
      console.log('📝 No templates found in your SendGrid account.');
      console.log('\nYou may need to:');
      console.log('1. Create templates in SendGrid dashboard');
      console.log('2. Check API key permissions');
      return;
    }

    console.log(`📋 Found ${templates.length} template(s):\n`);
    
    templates.forEach((template, index) => {
      console.log(`${index + 1}. Template: "${template.name}"`);
      console.log(`   ID: ${template.id}`);
      console.log(`   Created: ${new Date(template.created_at).toLocaleDateString()}`);
      console.log(`   Updated: ${new Date(template.updated_at).toLocaleDateString()}`);
      
      if (template.versions && template.versions.length > 0) {
        const activeVersion = template.versions.find(v => v.active === 1) || template.versions[0];
        console.log(`   Subject: "${activeVersion.subject || 'No subject'}"`);
        console.log(`   Version ID: ${activeVersion.id}`);
      }
      console.log('');
    });

    // Suggest template mappings based on names
    console.log('🎯 Suggested Template Mappings:\n');
    
    const suggestions = analyzeTemplatesForMapping(templates);
    if (suggestions.verification) {
      console.log(`✅ Email Verification: ${suggestions.verification.id} ("${suggestions.verification.name}")`);
    }
    if (suggestions.welcome) {
      console.log(`✅ Welcome Email: ${suggestions.welcome.id} ("${suggestions.welcome.name}")`);
    }
    if (suggestions.reset) {
      console.log(`✅ Password Reset: ${suggestions.reset.id} ("${suggestions.reset.name}")`);
    }
    
    // Generate environment variables
    console.log('\n📄 Environment Variables to Set:\n');
    if (suggestions.verification) {
      console.log(`SENDGRID_VERIFICATION_TEMPLATE_ID=${suggestions.verification.id}`);
    }
    if (suggestions.welcome) {
      console.log(`SENDGRID_WELCOME_TEMPLATE_ID=${suggestions.welcome.id}`);
    }
    if (suggestions.reset) {
      console.log(`SENDGRID_RESET_TEMPLATE_ID=${suggestions.reset.id}`);
    }
    
    if (!suggestions.verification) {
      console.log('⚠️  No verification template detected. You may need to create one.');
    }

  } catch (error) {
    console.error('❌ Error fetching templates:', error.message);
    if (error.response) {
      console.error('Response:', error.response.body);
    }
  }
}

function fetchTemplates(apiKey) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    
    const options = {
      hostname: 'api.sendgrid.com',
      port: 443,
      path: '/v3/templates?generations=dynamic',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.result) {
            resolve(parsed.result);
          } else if (parsed.templates) {
            resolve(parsed.templates);
          } else {
            resolve(parsed);
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

function analyzeTemplatesForMapping(templates) {
  const suggestions = {};
  
  templates.forEach(template => {
    const name = template.name.toLowerCase();
    
    // Look for verification templates
    if (name.includes('verification') || name.includes('verify') || name.includes('confirm')) {
      suggestions.verification = template;
    }
    
    // Look for welcome templates
    if (name.includes('welcome') || name.includes('onboard')) {
      suggestions.welcome = template;
    }
    
    // Look for password reset templates
    if (name.includes('reset') || name.includes('password') || name.includes('forgot')) {
      suggestions.reset = template;
    }
  });
  
  return suggestions;
}

// Run the discovery
if (require.main === module) {
  discoverSendGridTemplates().catch(console.error);
}

module.exports = { discoverSendGridTemplates };