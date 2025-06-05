const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const TEST_EMAIL = 'nmang004@gmail.com';

async function checkUserStatus() {
  console.log('🔍 Checking user status in database...\n');

  try {
    const user = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        verificationToken: true,
        verificationExpires: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      console.log('❌ No user found with email:', TEST_EMAIL);
      return;
    }

    console.log('📊 User Status:');
    console.log('================');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Email Verified:', user.emailVerified);
    console.log('Verification Token:', user.verificationToken);
    console.log('Token Expires:', user.verificationExpires);
    console.log('Created:', user.createdAt);
    console.log('Updated:', user.updatedAt);
    console.log('');

    if (user.emailVerified) {
      console.log('✅ User is already verified!');
      console.log('💡 This is why registration isn\'t generating new tokens.');
    } else {
      console.log('❌ User is NOT verified.');
      if (user.verificationToken) {
        const isExpired = new Date() > new Date(user.verificationExpires);
        console.log('Token Status:', isExpired ? '⏰ EXPIRED' : '✅ Valid');
        
        if (isExpired) {
          console.log('💡 Token is expired. Registration should generate a new one.');
        } else {
          console.log('💡 Token is still valid. Current token should work.');
        }
      } else {
        console.log('💡 No verification token found.');
      }
    }

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserStatus();