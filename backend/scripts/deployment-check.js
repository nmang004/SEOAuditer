#!/usr/bin/env node

/**
 * Deployment check script for Railway
 * This runs before the main app to ensure environment is properly configured
 */

console.log('=== SEO Director Backend Deployment Check ===\n');

const requiredVars = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  PORT: process.env.PORT || '8080'
};

const optionalVars = {
  REDIS_URL: process.env.REDIS_URL,
  NODE_ENV: process.env.NODE_ENV,
  RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT
};

let hasErrors = false;

console.log('Required Environment Variables:');
for (const [key, value] of Object.entries(requiredVars)) {
  if (!value) {
    console.log(`❌ ${key}: NOT SET`);
    hasErrors = true;
  } else {
    console.log(`✅ ${key}: ${key === 'JWT_SECRET' ? '[REDACTED]' : value.substring(0, 30) + '...'}`);
  }
}

console.log('\nOptional Environment Variables:');
for (const [key, value] of Object.entries(optionalVars)) {
  if (!value) {
    console.log(`⚠️  ${key}: NOT SET (optional)`);
  } else {
    console.log(`✅ ${key}: ${value}`);
  }
}

if (hasErrors) {
  console.log('\n❌ DEPLOYMENT CANNOT PROCEED');
  console.log('\nTo fix this:');
  console.log('1. In Railway Dashboard, go to your backend service');
  console.log('2. Click on "Variables" tab');
  console.log('3. Add the missing variables:');
  console.log('   - DATABASE_URL: Should be auto-added when you add PostgreSQL service');
  console.log('   - JWT_SECRET: Generate with: openssl rand -hex 32');
  console.log('\nSee backend/RAILWAY_ENV_SETUP.md for detailed instructions\n');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set!');
  console.log('Proceeding with deployment...\n');
}