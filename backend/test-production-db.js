const fetch = require('node-fetch');

const API_URL = 'https://seoauditer-production.up.railway.app';
const TEST_EMAIL = 'nmang004@gmail.com';

async function checkProductionDatabase() {
  console.log('🔍 Checking PRODUCTION database status...\n');

  try {
    // Check user status in production
    console.log('1. Checking user status in production database...');
    const userStatusResponse = await fetch(`${API_URL}/api/debug/user-status/${encodeURIComponent(TEST_EMAIL)}`);
    
    console.log('Status:', userStatusResponse.status);
    
    const userStatusData = await userStatusResponse.json();
    console.log('User Status Response:');
    console.log(JSON.stringify(userStatusData, null, 2));

    // Check database stats
    console.log('\n2. Checking production database stats...');
    const statsResponse = await fetch(`${API_URL}/api/debug/database-stats`);
    const statsData = await statsResponse.json();
    
    console.log('Database Stats:');
    console.log(JSON.stringify(statsData, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkProductionDatabase();