#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function startWithMigrate() {
  console.log('Starting application...');
  
  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not found, skipping migrations');
  } else {
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