/**
 * Send test email to nmang004@gmail.com using the bulletproof token system
 * 
 * This script tests the complete flow:
 * 1. Generate secure verification token
 * 2. Send email via SendGrid with dynamic template
 * 3. Log all details for verification
 */

const { PrismaClient } = require('@prisma/client');
const { SecureTokenService } = require('./dist/services/SecureTokenService.js');
const { EnhancedEmailService } = require('./dist/services/EnhancedEmailService.js');

// Initialize services
const prisma = new PrismaClient();
const tokenService = new SecureTokenService(prisma);
const emailService = new EnhancedEmailService(prisma);

// Test user details
const TEST_EMAIL = 'nmang004@gmail.com';
const TEST_NAME = 'Nick Mangubat';
const TEST_USER_ID = 'test-user-' + Date.now();

console.log('🚀 Starting bulletproof email verification test');
console.log(`📧 Target email: ${TEST_EMAIL}`);
console.log(`👤 Test user ID: ${TEST_USER_ID}`);
console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

async function testEmailVerificationFlow() {
  try {
    console.log('\n=== STEP 1: Generating Secure Token ===');
    
    const tokenResult = await tokenService.generateVerificationToken(
      TEST_USER_ID,
      TEST_EMAIL,
      'email_verification'
    );
    
    console.log('✅ Token generated successfully:');
    console.log(`   Token: ${tokenResult.token.substring(0, 16)}...`);
    console.log(`   Hashed Token: ${tokenResult.hashedToken.substring(0, 16)}...`);
    console.log(`   Expires At: ${tokenResult.expiresAt.toISOString()}`);
    console.log(`   Sequence: ${tokenResult.metadata.sequence}`);
    console.log(`   Purpose: ${tokenResult.metadata.purpose}`);
    
    console.log('\n=== STEP 2: Sending Email via SendGrid ===');
    
    const emailResult = await emailService.sendVerificationEmail(
      TEST_USER_ID,
      TEST_EMAIL,
      TEST_NAME
    );
    
    if (emailResult.success) {
      console.log('✅ Email sent successfully:');
      console.log(`   Message ID: ${emailResult.messageId}`);
      console.log(`   Token Used: ${emailResult.tokenUsed?.substring(0, 16)}...`);
      console.log(`   Correlation ID: ${emailResult.metadata?.correlationId}`);
      console.log(`   Total Time: ${emailResult.metadata?.totalTimeMs}ms`);
      
      console.log('\n=== STEP 3: Verification URL ===');
      const verificationUrl = `https://seoauditer.netlify.app/verify-email/${tokenResult.token}`;
      console.log(`🔗 Verification URL: ${verificationUrl}`);
      
      console.log('\n=== STEP 4: Token Validation Test ===');
      
      const validationResult = await tokenService.validateToken(
        tokenResult.token,
        'email_verification'
      );
      
      if (validationResult.isValid) {
        console.log('✅ Token validation successful:');
        console.log(`   User ID: ${validationResult.userId}`);
        console.log(`   Email: ${validationResult.email}`);
        console.log(`   Sequence: ${validationResult.metadata?.sequence}`);
      } else {
        console.log('❌ Token validation failed:');
        console.log(`   Error: ${validationResult.error}`);
      }
      
      console.log('\n=== STEP 5: Email Service Health Check ===');
      
      const healthCheck = await emailService.healthCheck();
      console.log('🏥 Email Service Health:');
      console.log(`   Healthy: ${healthCheck.healthy}`);
      console.log(`   Configured: ${healthCheck.details.configured}`);
      console.log(`   SendGrid API Key: ${healthCheck.details.sendgridApiKey ? 'Present' : 'Missing'}`);
      console.log(`   Template Configured: ${healthCheck.details.templateConfigured}`);
      console.log(`   From Email: ${healthCheck.details.fromEmailConfigured}`);
      console.log(`   App URL: ${healthCheck.details.appUrlConfigured}`);
      
      console.log('\n🎉 TEST COMPLETED SUCCESSFULLY!');
      console.log('\n📝 NEXT STEPS:');
      console.log('1. Check nmang004@gmail.com for the verification email');
      console.log('2. Click the verification link in the email');
      console.log('3. Verify that the token works exactly once');
      console.log('4. Check that the email contains the correct verification URL');
      
      console.log('\n💡 DEBUGGING INFO:');
      console.log('If the email doesn\'t arrive:');
      console.log('- Check SendGrid dashboard for delivery status');
      console.log('- Verify SENDGRID_API_KEY environment variable');
      console.log('- Check spam/junk folder');
      console.log('- Ensure SendGrid domain authentication is complete');
      
    } else {
      console.log('❌ Email sending failed:');
      console.log(`   Error: ${emailResult.error}`);
      console.log(`   Metadata: ${JSON.stringify(emailResult.metadata, null, 2)}`);
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the test
testEmailVerificationFlow().then(() => {
  console.log('\n✨ Test script completed');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Test script failed:', error);
  process.exit(1);
});