#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function startWithMigrate() {
  console.log('Starting application...');
  
  // Check for required environment variables and provide defaults if missing
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not found in environment');
    
    // In production, we should wait for Railway to provide these
    if (process.env.NODE_ENV === 'production') {
      console.error('ERROR: Required environment variables are not set in production');
      console.error('Please ensure DATABASE_URL and JWT_SECRET are configured in Railway');
      process.exit(1);
    }
  }

  if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET not found in environment');
    
    // In production, we must have a proper JWT secret
    if (process.env.NODE_ENV === 'production') {
      console.error('ERROR: JWT_SECRET is required in production');
      process.exit(1);
    }
  }
  
  // Only run migrations if DATABASE_URL is available
  if (process.env.DATABASE_URL) {
    try {
      console.log('Running database migrations...');
      await execAsync('npx prisma migrate deploy');
      console.log('Migrations completed successfully');
    } catch (error) {
      console.error('Migration error:', error.message);
      // Don't exit on migration error - the app might still work
      console.warn('Continuing despite migration error...');
    }
  }
  
  // Start the application
  console.log('Starting server...');
  require('../dist/index.js');
}

startWithMigrate().catch(error => {
  console.error('Startup error:', error);
  process.exit(1);
});