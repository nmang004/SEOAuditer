const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPrismaToken() {
  try {
    console.log('=== TESTING PRISMA TOKEN ACCESS ===');
    
    // Check if verificationToken is available on prisma client
    console.log('prisma.verificationToken exists:', typeof prisma.verificationToken);
    console.log('prisma models:', Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')));
    
    // Try to access it
    try {
      const count = await prisma.verificationToken.count();
      console.log('✅ verificationToken.count() works:', count);
    } catch (error) {
      console.log('❌ verificationToken.count() failed:', error.message);
    }
    
    // Check database connection
    try {
      await prisma.$connect();
      console.log('✅ Database connection successful');
    } catch (error) {
      console.log('❌ Database connection failed:', error.message);
    }
    
    // Test raw query
    try {
      const result = await prisma.$queryRaw`SELECT COUNT(*) FROM verification_tokens`;
      console.log('✅ Raw query works:', result);
    } catch (error) {
      console.log('❌ Raw query failed:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaToken().catch(console.error);