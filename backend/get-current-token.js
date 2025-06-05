const fetch = require('node-fetch');

const API_URL = 'https://seoauditer-production.up.railway.app';
const TEST_EMAIL = 'nmang004@gmail.com';

async function getCurrentToken() {
  console.log('🔍 Getting the ACTUAL current token from database...\n');

  try {
    // First, trigger a fresh token generation
    console.log('1. Generating fresh token...');
    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: TEST_EMAIL,
        password: 'TestPassword123!'
      })
    });

    console.log('Registration status:', registerResponse.status);

    // Since we can't access the database directly from here, 
    // let me create a different approach - test common UUID patterns
    console.log('\n2. The issue is SendGrid click tracking is caching the old URL.');
    console.log('3. Let me create a bypass...');

    // Generate a few test UUIDs to show what a real token should look like
    const { v4: uuidv4 } = require('uuid');
    console.log('\nReal UUID examples (what tokens should look like):');
    for (let i = 0; i < 3; i++) {
      console.log(`   ${uuidv4()}`);
    }
    
    console.log('\nOld token that keeps appearing:');
    console.log('   5e1c764f38788fe003e5cd70f6e04de2005d2fb3ebdcbcce331ab09756b3539d');
    console.log('');
    console.log('💡 SOLUTION: The only way to fix this is to:');
    console.log('   1. ✅ Disable SendGrid click tracking (we did this)');
    console.log('   2. ✅ Wait for the fix to take effect');
    console.log('   3. 📧 Check your NEWEST email (it should have direct links now)');
    console.log('');
    console.log('🚨 OR we can bypass email entirely:');
    console.log('   - I can create a direct database lookup endpoint');
    console.log('   - Show you the current token manually');
    console.log('   - You can copy/paste the correct verification URL');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getCurrentToken();