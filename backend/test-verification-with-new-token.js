const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const axios = require('axios');

const prisma = new PrismaClient();

async function testVerificationWithNewToken() {
  try {
    console.log('=== TESTING VERIFICATION WITH NEW TOKEN ===');
    
    // Get the latest token for token-test@example.com
    const latestToken = await prisma.verificationToken.findFirst({
      where: { 
        email: 'token-test@example.com',
        isValid: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!latestToken) {
      console.log('❌ No valid token found for test user');
      return;
    }
    
    console.log('Found token:');
    console.log('  ID:', latestToken.id);
    console.log('  HashedToken prefix:', latestToken.hashedToken.substring(0, 16) + '...');
    console.log('  Expires:', latestToken.expiresAt);
    console.log('  IsValid:', latestToken.isValid);
    
    // We need to reverse-engineer the original token from the hash
    // Since we can't unhash, we need to generate a new token for this user
    
    console.log('\n=== GENERATING NEW TOKEN FOR TESTING ===');
    
    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: 'token-test@example.com' },
      select: { id: true, email: true, name: true }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('User:', user);
    
    // Generate a new token using the same logic as SecureTokenService
    const userId = user.id;
    const email = user.email;
    const purpose = 'email_verification';
    
    // Step 1: Generate base random token
    const randomBytes = crypto.randomBytes(32);
    const timestamp = Date.now().toString();
    const userContext = `${userId}:${email}:${purpose}`;
    
    // Step 2: Create composite unique string
    const composite = `${randomBytes.toString('hex')}:${timestamp}:${userContext}`;
    
    // Step 3: Generate final token (plaintext - sent in email)
    const finalToken = crypto
      .createHash('sha256')
      .update(composite)
      .digest('hex');
    
    // Step 4: Hash for database storage
    const tokenSalt = process.env.TOKEN_SALT || 'fallback-salt';
    const hashedToken = crypto
      .createHash('sha256')
      .update(finalToken + tokenSalt)
      .digest('hex');
    
    console.log('Generated token:', finalToken);
    console.log('Hashed token prefix:', hashedToken.substring(0, 16) + '...');
    
    // Step 5: Invalidate old tokens and store new one
    await prisma.verificationToken.updateMany({
      where: { userId, purpose, isValid: true },
      data: { isValid: false, invalidatedAt: new Date() }
    });
    
    const expiresAt = new Date(Date.now() + (1 * 60 * 60 * 1000)); // 1 hour
    
    await prisma.verificationToken.create({
      data: {
        hashedToken,
        userId,
        email,
        purpose,
        sequence: 2, // increment sequence
        expiresAt,
        isValid: true,
        createdAt: new Date()
      }
    });
    
    console.log('✅ New token stored in database');
    
    // Step 6: Test the verification endpoint
    console.log('\n=== TESTING VERIFICATION ENDPOINT ===');
    
    const baseUrl = 'http://localhost:4000';
    const verificationUrl = `${baseUrl}/api/secure-auth/verify-email/${finalToken}`;
    
    console.log('Testing URL:', verificationUrl);
    
    try {
      const response = await axios.get(verificationUrl, {
        timeout: 10000
      });
      
      console.log('✅ Verification successful!');
      console.log('Status:', response.status);
      console.log('Response:', response.data);
      
    } catch (error) {
      console.log('❌ Verification failed');
      
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Response:', error.response.data);
      } else {
        console.log('Error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testVerificationWithNewToken().catch(console.error);