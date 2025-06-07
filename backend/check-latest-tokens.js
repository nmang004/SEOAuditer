const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLatestTokens() {
  try {
    console.log('=== CHECKING LATEST VERIFICATION TOKENS ===');
    
    const totalTokens = await prisma.verificationToken.count();
    console.log('Total tokens in database:', totalTokens);
    
    const latestTokens = await prisma.verificationToken.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: { email: true, name: true }
        }
      }
    });
    
    console.log(`\nShowing latest ${latestTokens.length} tokens:`);
    latestTokens.forEach((token, index) => {
      console.log(`\nToken ${index + 1}:`);
      console.log('  ID:', token.id);
      console.log('  User:', token.user.name, `(${token.user.email})`);
      console.log('  Purpose:', token.purpose);
      console.log('  Sequence:', token.sequence);
      console.log('  IsValid:', token.isValid);
      console.log('  HashedToken prefix:', token.hashedToken.substring(0, 16) + '...');
      console.log('  ExpiresAt:', token.expiresAt);
      console.log('  CreatedAt:', token.createdAt);
      console.log('  UsedAt:', token.usedAt);
      console.log('  InvalidatedAt:', token.invalidatedAt);
    });
    
    // Check for the specific user we just registered
    const testUserTokens = await prisma.verificationToken.findMany({
      where: { email: 'token-test@example.com' },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`\n=== TOKENS FOR token-test@example.com ===`);
    console.log('Found', testUserTokens.length, 'tokens for this user');
    
    if (testUserTokens.length > 0) {
      console.log('✅ Token WAS created despite email failure!');
      const latestToken = testUserTokens[0];
      console.log('Latest token details:');
      console.log('  IsValid:', latestToken.isValid);
      console.log('  Purpose:', latestToken.purpose);
      console.log('  Expires:', latestToken.expiresAt);
      console.log('  Created:', latestToken.createdAt);
    } else {
      console.log('❌ No tokens found for test user');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestTokens().catch(console.error);