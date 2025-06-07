const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Checking database connection and data...\n');

  try {
    // Test database connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Check if there are any users at all
    console.log('\n2. Checking for any users in database...');
    const userCount = await prisma.user.count();
    console.log('Total users in database:', userCount);

    if (userCount > 0) {
      console.log('\n3. Recent users:');
      const recentUsers = await prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          email: true,
          name: true,
          emailVerified: true,
          verificationToken: true,
          createdAt: true
        }
      });
      
      recentUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} - Verified: ${user.emailVerified} - Created: ${user.createdAt}`);
      });
    } else {
      console.log('❌ No users found in database');
    }

    // Check database URL (without exposing the full URL)
    console.log('\n4. Database connection info:');
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      const urlParts = dbUrl.split('@');
      if (urlParts.length > 1) {
        const hostPart = urlParts[1].split('/')[0];
        console.log('Database host:', hostPart);
      }
      console.log('Database URL set:', !!dbUrl);
    } else {
      console.log('❌ DATABASE_URL not found in environment');
    }

    // Test a simple write operation
    console.log('\n5. Testing write operation...');
    try {
      const testUser = await prisma.user.create({
        data: {
          email: 'test-write-' + Date.now() + '@test.com',
          name: 'Test Write User',
          passwordHash: 'test-hash'
        }
      });
      console.log('✅ Write operation successful, user ID:', testUser.id);
      
      // Clean up test user
      await prisma.user.delete({ where: { id: testUser.id } });
      console.log('✅ Test user cleaned up');
    } catch (writeError) {
      console.log('❌ Write operation failed:', writeError.message);
    }

  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();