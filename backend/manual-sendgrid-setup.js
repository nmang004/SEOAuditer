#!/usr/bin/env node

/**
 * Manual SendGrid Setup Guide
 * 
 * This script provides step-by-step instructions for properly configuring
 * SendGrid templates in the Railway production environment.
 */

console.log('📧 SendGrid Template Setup Guide for Railway Production\n');

console.log('='.repeat(60));
console.log('CURRENT ISSUE: Invalid Template ID Format');
console.log('='.repeat(60));

console.log('\nThe error "template_id must be a valid GUID" indicates that:');
console.log('❌ Current template ID: "d-seo-verification-template" (invalid format)');
console.log('✅ Required format: "d-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" (GUID)');

console.log('\n='.repeat(60));
console.log('STEP 1: Find Your Existing SendGrid Templates');
console.log('='.repeat(60));

console.log('\n1. Log in to your SendGrid Dashboard');
console.log('2. Go to Email API → Dynamic Templates');
console.log('3. Look for templates with these names:');
console.log('   - "Email Verification" or "Verify Email"');
console.log('   - "Welcome" or "Welcome Email"');
console.log('   - Any template related to account verification');

console.log('\n4. For each template, copy the Template ID (format: d-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)');

console.log('\n='.repeat(60));
console.log('STEP 2: Update Railway Environment Variables');
console.log('='.repeat(60));

console.log('\n1. Go to Railway Dashboard → Your Backend Service');
console.log('2. Click "Variables" tab');
console.log('3. Add/Update these variables:');

console.log('\n# Required SendGrid Configuration');
console.log('SENDGRID_API_KEY=SG.your-actual-api-key-here');
console.log('SENDGRID_VERIFICATION_TEMPLATE_ID=d-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
console.log('EMAIL_FROM_ADDRESS=admin@seodirector.co');  // Your verified sender
console.log('EMAIL_FROM_NAME=SEO Director');

console.log('\n# Optional (if you have additional templates)');
console.log('SENDGRID_WELCOME_TEMPLATE_ID=d-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
console.log('SENDGRID_RESET_TEMPLATE_ID=d-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');

console.log('\n='.repeat(60));
console.log('STEP 3: Template Variable Names');
console.log('='.repeat(60));

console.log('\nMake sure your SendGrid templates use these variable names:');
console.log('');
console.log('{{name}}                  - User\'s name');
console.log('{{email}}                 - User\'s email address');
console.log('{{verification_url}}      - Full verification link');
console.log('{{verification_token}}    - Just the token (if needed)');
console.log('{{app_name}}             - "SEO Director"');
console.log('{{support_email}}        - Support contact email');
console.log('{{current_year}}         - Current year');

console.log('\n='.repeat(60));
console.log('STEP 4: Test Template Discovery (After Deployment)');
console.log('='.repeat(60));

console.log('\nOnce Railway finishes deploying the new code:');
console.log('');
console.log('1. Test template discovery:');
console.log('   curl https://seoauditer-production.up.railway.app/api/admin/sendgrid-templates');
console.log('');
console.log('2. Test system validation:');
console.log('   curl https://seoauditer-production.up.railway.app/api/admin/system-validation');
console.log('');
console.log('3. Send test verification email:');
console.log('   curl -X POST https://seoauditer-production.up.railway.app/api/secure-auth/resend-verification \\');
console.log('        -H "Content-Type: application/json" \\');
console.log('        -d \'{"email":"nmang004@gmail.com"}\'');

console.log('\n='.repeat(60));
console.log('STEP 5: If You Don\'t Have Templates Yet');
console.log('='.repeat(60));

console.log('\nIf you need to create templates in SendGrid:');
console.log('');
console.log('1. Go to SendGrid → Email API → Dynamic Templates');
console.log('2. Click "Create Dynamic Template"');
console.log('3. Name it "Email Verification"');
console.log('4. Add a version with this content:');

console.log('\n--- Template Subject ---');
console.log('Verify your email address for {{app_name}}');

console.log('\n--- Template HTML ---');
console.log(`<html>
<body>
  <h1>Welcome to {{app_name}}!</h1>
  <p>Hi {{name}},</p>
  <p>Please verify your email address by clicking the link below:</p>
  <p><a href="{{verification_url}}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Verify Email Address</a></p>
  <p>If the button doesn't work, copy and paste this link into your browser:</p>
  <p>{{verification_url}}</p>
  <p>This link will expire in 24 hours for security reasons.</p>
  <p>If you didn't sign up for {{app_name}}, you can safely ignore this email.</p>
  <p>Best regards,<br>The {{app_name}} Team</p>
  <p><small>Need help? Contact us at {{support_email}}</small></p>
</body>
</html>`);

console.log('\n='.repeat(60));
console.log('TROUBLESHOOTING');
console.log('='.repeat(60));

console.log('\nCommon issues and solutions:');
console.log('');
console.log('❌ "template_id must be a valid GUID"');
console.log('   → Check template ID format (must start with d- and be a proper GUID)');
console.log('');
console.log('❌ "The from address does not match a verified Sender Identity"');
console.log('   → Go to SendGrid → Settings → Sender Authentication');
console.log('   → Verify your domain or add admin@seodirector.co as a single sender');
console.log('');
console.log('❌ "Template not found"');
console.log('   → Verify the template ID exists in your SendGrid account');
console.log('   → Make sure the template is active (not draft)');

console.log('\n✅ Once configured correctly, you should see:');
console.log('   - Template discovery endpoint returns your templates');
console.log('   - System validation passes all checks');
console.log('   - Verification emails send successfully');

console.log('\n' + '='.repeat(60));
console.log('Next: Run node test-new-template-system.js to test the setup');
console.log('='.repeat(60) + '\n');