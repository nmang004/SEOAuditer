#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function runMigrations() {
  console.log('=== Railway Database Migration Script ===');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Database URL exists:', !!process.env.DATABASE_URL);
  
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    console.error('Please ensure DATABASE_URL is configured in Railway environment variables');
    process.exit(1);
  }

  try {
    console.log('\n1. Generating Prisma Client...');
    await execAsync('npx prisma generate');
    console.log('✅ Prisma Client generated successfully');

    console.log('\n2. Running database migrations...');
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
    
    if (stdout) console.log('Migration output:', stdout);
    if (stderr) console.log('Migration warnings:', stderr);
    
    console.log('✅ Migrations deployed successfully');

    // Verify tables exist
    console.log('\n3. Verifying database schema...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Users table exists with ${userCount} records`);
      
      const projectCount = await prisma.project.count();
      console.log(`✅ Projects table exists with ${projectCount} records`);
      
      await prisma.$disconnect();
    } catch (error) {
      console.error('❌ Database verification failed:', error.message);
      await prisma.$disconnect();
      throw error;
    }

    console.log('\n✅ All migrations completed successfully!');
    console.log('You can now restart your Railway service.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.stderr) {
      console.error('Error details:', error.stderr);
    }
    process.exit(1);
  }
}

// Run migrations
runMigrations();