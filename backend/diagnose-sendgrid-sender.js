#!/usr/bin/env node

/**
 * Diagnose SendGrid Sender Authentication
 * 
 * This helps identify why emails are "sent" but not delivered
 */

console.log('🔍 SendGrid Sender Authentication Diagnosis\n');

console.log('='.repeat(60));
console.log('ISSUE: Email API returns "success" but email not delivered');
console.log('='.repeat(60));

console.log('\nThis usually means:');
console.log('1. ❌ From address not verified in SendGrid');
console.log('2. ❌ Domain not authenticated');
console.log('3. ❌ Email sent to spam/junk folder');
console.log('4. ❌ SendGrid account suspended or limited');

console.log('\n='.repeat(60));
console.log('CURRENT CONFIGURATION');
console.log('='.repeat(60));

console.log('\nFrom Address: admin@seodirector.co');
console.log('Domain: seodirector.co');
console.log('Recipient: nmang004@gmail.com');

console.log('\n='.repeat(60));
console.log('SENDER AUTHENTICATION CHECK');
console.log('='.repeat(60));

console.log('\n1. Login to SendGrid Dashboard');
console.log('2. Go to Settings → Sender Authentication');
console.log('3. Check one of these options:');

console.log('\n📧 OPTION A: Single Sender Verification');
console.log('   - Look for admin@seodirector.co in verified senders');
console.log('   - If not verified, click "Verify Single Sender"');
console.log('   - Add admin@seodirector.co and verify via email');

console.log('\n🌐 OPTION B: Domain Authentication (Better)');
console.log('   - Look for seodirector.co in authenticated domains');
console.log('   - If not set up, click "Authenticate Your Domain"');
console.log('   - Follow DNS setup instructions');

console.log('\n='.repeat(60));
console.log('QUICK FIX OPTIONS');
console.log('='.repeat(60));

console.log('\n🚀 OPTION 1: Use a verified sender');
console.log('   If you have another verified email:');
console.log('   1. Update EMAIL_FROM_ADDRESS in Railway');
console.log('   2. Use your verified sender email');

console.log('\n🚀 OPTION 2: Verify admin@seodirector.co');
console.log('   1. SendGrid Dashboard → Settings → Sender Authentication');
console.log('   2. Click "Verify Single Sender"');
console.log('   3. Add admin@seodirector.co');
console.log('   4. Check email and click verification link');

console.log('\n🚀 OPTION 3: Use domain authentication');
console.log('   1. SendGrid Dashboard → Settings → Sender Authentication');
console.log('   2. Click "Authenticate Your Domain"');
console.log('   3. Add seodirector.co');
console.log('   4. Add DNS records to your domain');

console.log('\n='.repeat(60));
console.log('TEST WITH VERIFIED SENDER');
console.log('='.repeat(60));

console.log('\nTo test if this fixes the issue:');
console.log('1. Find a verified sender in your SendGrid dashboard');
console.log('2. Update Railway environment: EMAIL_FROM_ADDRESS=your-verified-email');
console.log('3. Test email sending again');

console.log('\n='.repeat(60));
console.log('DEBUGGING COMMANDS');
console.log('='.repeat(60));

console.log('\nAfter fixing sender authentication, test with:');
console.log('');
console.log('# Test basic email');
console.log('curl -X POST https://seoauditer-production.up.railway.app/api/email/test \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"to":"nmang004@gmail.com","type":"welcome"}\'');
console.log('');
console.log('# Test verification email');
console.log('curl -X POST https://seoauditer-production.up.railway.app/api/secure-auth/resend-verification \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"email":"nmang004@gmail.com"}\'');

console.log('\n='.repeat(60));
console.log('NEXT STEPS');
console.log('='.repeat(60));

console.log('\n1. ✅ Check SendGrid Dashboard for sender authentication');
console.log('2. ✅ Verify admin@seodirector.co or use different sender');
console.log('3. ✅ Test email delivery after verification');
console.log('4. ✅ Check spam/junk folder');
console.log('5. ✅ Test both old and new email systems');

console.log('\n' + '='.repeat(60) + '\n');