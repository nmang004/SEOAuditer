const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllTokens() {
  try {
    console.log('=== CHECKING ALL VERIFICATION TOKENS ===');
    
    const totalTokens = await prisma.verificationToken.count();
    console.log('Total tokens in database:', totalTokens);
    
    const allTokens = await prisma.verificationToken.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`\nShowing latest ${allTokens.length} tokens:`);
    allTokens.forEach((token, index) => {
      console.log(`\nToken ${index + 1}:`);
      console.log('  ID:', token.id);
      console.log('  Email:', token.email);
      console.log('  Purpose:', token.purpose);
      console.log('  Sequence:', token.sequence);
      console.log('  IsValid:', token.isValid);
      console.log('  HashedToken prefix:', token.hashedToken.substring(0, 16) + '...');
      console.log('  ExpiresAt:', token.expiresAt);
      console.log('  CreatedAt:', token.createdAt);
      console.log('  UsedAt:', token.usedAt);
      console.log('  InvalidatedAt:', token.invalidatedAt);
    });
    
    // Check if table exists and is accessible
    console.log('\n=== TABLE STRUCTURE CHECK ===');
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'verification_tokens'
      ORDER BY ordinal_position;
    `;
    
    console.log('Table structure:');
    console.table(tableInfo);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllTokens().catch(console.error);