#!/usr/bin/env node

/**
 * Test WelcomeTemplate Directly
 * 
 * This tests if the WelcomeTemplate can be imported and used correctly
 */

console.log('🧪 Testing WelcomeTemplate Direct Import\n');

try {
  console.log('1. Testing require path...');
  const { WelcomeTemplate } = require('./dist/services/email/templates/WelcomeTemplate');
  console.log('✅ WelcomeTemplate imported successfully');
  
  console.log('\n2. Testing template instantiation...');
  const template = new WelcomeTemplate();
  console.log('✅ WelcomeTemplate instantiated successfully');
  
  console.log('\n3. Testing template rendering...');
  const result = template.render({
    name: 'Test User',
    verificationUrl: 'https://example.com/verify/test-token',
    appName: 'SEO Director',
    appUrl: 'https://seoauditer.netlify.app',
    email: 'test@example.com'
  });
  
  console.log('✅ Template rendered successfully');
  console.log('Subject:', result.subject);
  console.log('HTML length:', result.html.length);
  console.log('Text length:', result.text.length);
  
  console.log('\n4. Template content preview:');
  console.log('Subject:', result.subject);
  console.log('HTML preview (first 200 chars):', result.html.substring(0, 200) + '...');
  
  console.log('\n✅ All tests passed! Template is working correctly.');
  
} catch (error) {
  console.error('❌ Template test failed:', error.message);
  console.error('Error details:', error.stack);
  
  console.log('\n🔧 Troubleshooting:');
  if (error.message.includes('Cannot find module')) {
    console.log('- Check if WelcomeTemplate.ts exists in src/services/email/templates/');
    console.log('- Verify the import path is correct');
    console.log('- Make sure TypeScript is compiled to JavaScript');
  }
  
  if (error.message.includes('BaseTemplate')) {
    console.log('- Check if BaseTemplate is properly exported');
    console.log('- Verify BaseTemplate dependencies are available');
  }
}