const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function debugVerificationToken() {
  const token = '90bd1137b2886e58430f78cbc28127f00315f366101cba6467379f473ef26481';
  
  console.log('=== DEBUGGING VERIFICATION TOKEN ===');
  console.log('Token from URL:', token);
  console.log('Token length:', token.length);
  
  // Hash the token the same way the service does
  const hashedToken = crypto
    .createHash('sha256')
    .update(token + (process.env.TOKEN_SALT || 'fallback-salt'))
    .digest('hex');
  
  console.log('\nHashed token for lookup:', hashedToken);
  console.log('Hashed token prefix:', hashedToken.substring(0, 16) + '...');
  
  try {
    // Look for tokens in the database
    console.log('\n=== SEARCHING DATABASE ===');
    
    // Search for all tokens for this user
    const user = await prisma.user.findUnique({
      where: { email: 'nmang004@gmail.com' },
      select: { id: true, email: true, emailVerified: true }
    });
    
    if (user) {
      console.log('User found:', user);
      
      const allTokens = await prisma.verificationToken.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log(`\nFound ${allTokens.length} tokens for user:`);
      allTokens.forEach((tokenRecord, index) => {
        console.log(`\nToken ${index + 1}:`);
        console.log('  ID:', tokenRecord.id);
        console.log('  Email:', tokenRecord.email);
        console.log('  Purpose:', tokenRecord.purpose);
        console.log('  Sequence:', tokenRecord.sequence);
        console.log('  IsValid:', tokenRecord.isValid);
        console.log('  HashedToken prefix:', tokenRecord.hashedToken.substring(0, 16) + '...');
        console.log('  ExpiresAt:', tokenRecord.expiresAt);
        console.log('  CreatedAt:', tokenRecord.createdAt);
        console.log('  UsedAt:', tokenRecord.usedAt);
        console.log('  InvalidatedAt:', tokenRecord.invalidatedAt);
        console.log('  Matches lookup hash:', tokenRecord.hashedToken === hashedToken);
      });
      
      // Search for exact match
      const exactMatch = await prisma.verificationToken.findFirst({
        where: {
          hashedToken,
          purpose: 'email_verification',
          isValid: true,
          expiresAt: {
            gt: new Date()
          }
        }
      });
      
      console.log('\n=== EXACT MATCH LOOKUP ===');
      if (exactMatch) {
        console.log('✅ Found exact match:', exactMatch);
      } else {
        console.log('❌ No exact match found');
        
        // Check if token exists but is invalid/expired
        const invalidMatch = await prisma.verificationToken.findFirst({
          where: { hashedToken }
        });
        
        if (invalidMatch) {
          console.log('Found token but it is:', {
            isValid: invalidMatch.isValid,
            expired: invalidMatch.expiresAt < new Date(),
            expiresAt: invalidMatch.expiresAt,
            now: new Date()
          });
        } else {
          console.log('Token hash not found in database at all');
        }
      }
      
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugVerificationToken().catch(console.error);