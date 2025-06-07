const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function testTokenGeneration() {
  const userId = '2e3b439a-fe9c-4070-ab79-14cb079efc80'; // nmang004@gmail.com
  const email = 'nmang004@gmail.com';
  const purpose = 'email_verification';
  
  console.log('=== TESTING TOKEN GENERATION ===');
  console.log('UserId:', userId);
  console.log('Email:', email);
  console.log('Purpose:', purpose);
  
  try {
    // Step 1: Generate token exactly like the service does
    const randomBytes = crypto.randomBytes(32);
    const timestamp = Date.now().toString();
    const userContext = `${userId}:${email}:${purpose}`;
    
    console.log('\n=== TOKEN GENERATION STEPS ===');
    console.log('Random bytes length:', randomBytes.length);
    console.log('Timestamp:', timestamp);
    console.log('User context:', userContext);
    
    // Step 2: Create composite unique string
    const composite = `${randomBytes.toString('hex')}:${timestamp}:${userContext}`;
    console.log('Composite length:', composite.length);
    
    // Step 3: Generate final token (plaintext - sent in email)
    const finalToken = crypto
      .createHash('sha256')
      .update(composite)
      .digest('hex');
      
    console.log('Final token:', finalToken);
    console.log('Final token length:', finalToken.length);
    
    // Step 4: Hash for database storage
    const tokenSalt = process.env.TOKEN_SALT || 'fallback-salt';
    console.log('Token salt:', tokenSalt);
    
    const hashedToken = crypto
      .createHash('sha256')
      .update(finalToken + tokenSalt)
      .digest('hex');
      
    console.log('Hashed token:', hashedToken);
    console.log('Hashed token prefix:', hashedToken.substring(0, 16) + '...');
    
    // Step 5: Set expiration
    const expiresAt = new Date(Date.now() + (1 * 60 * 60 * 1000)); // 1 hour
    console.log('Expires at:', expiresAt);
    
    // Step 6: Get sequence number
    const result = await prisma.verificationToken.aggregate({
      where: {
        userId,
        purpose
      },
      _max: {
        sequence: true
      }
    });
    
    const sequence = (result._max.sequence || 0) + 1;
    console.log('Next sequence:', sequence);
    
    // Step 7: Try to store the token
    console.log('\n=== ATTEMPTING TO STORE TOKEN ===');
    
    const tokenData = {
      hashedToken,
      userId,
      email,
      purpose,
      sequence,
      expiresAt,
      isValid: true,
      createdAt: new Date()
    };
    
    console.log('Token data to store:', tokenData);
    
    try {
      const storedToken = await prisma.verificationToken.create({
        data: tokenData
      });
      
      console.log('✅ Token stored successfully:', {
        id: storedToken.id,
        email: storedToken.email,
        hashedTokenPrefix: storedToken.hashedToken.substring(0, 16) + '...'
      });
      
      // Verify it can be found
      const foundToken = await prisma.verificationToken.findFirst({
        where: {
          hashedToken,
          purpose,
          isValid: true,
          expiresAt: {
            gt: new Date()
          }
        }
      });
      
      if (foundToken) {
        console.log('✅ Token can be found for verification');
        
        // Test the verification URL
        console.log('\n=== VERIFICATION URL ===');
        console.log('Verification URL would be:');
        console.log(`https://seoauditer.netlify.app/verify-email/${finalToken}`);
        
      } else {
        console.log('❌ Token was stored but cannot be found for verification');
      }
      
    } catch (storeError) {
      console.log('❌ Failed to store token:', storeError.message);
      console.log('Store error details:', storeError);
    }
    
  } catch (error) {
    console.error('Error in token generation test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTokenGeneration().catch(console.error);