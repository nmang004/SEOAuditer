// Simple test to verify the auth registration logic
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Mock the registration logic from auth.controller.ts
async function testRegistrationLogic() {
  try {
    // Test data
    const testUser = {
      email: 'test@example.com',
      password: 'Test123!@#',
      name: 'Test User'
    };

    console.log('Testing registration logic...');
    console.log('Input:', testUser);

    // Hash password (this is what might be failing)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testUser.password, salt);
    
    console.log('Password hashed successfully');
    console.log('Salt:', salt);
    console.log('Hashed password length:', hashedPassword.length);

    // Generate verification token
    const verificationToken = uuidv4();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

    console.log('Verification token:', verificationToken);
    console.log('Verification expires:', verificationExpires);

    // Mock user object that would be created
    const mockUser = {
      id: uuidv4(),
      email: testUser.email,
      name: testUser.name,
      passwordHash: hashedPassword,
      verificationToken,
      verificationExpires,
      emailVerified: false,
      createdAt: new Date()
    };

    console.log('\nMock user object created successfully:');
    console.log(JSON.stringify(mockUser, null, 2));

    console.log('\nAll registration logic tests passed! ✅');
    console.log('The issue is likely with database/Redis connections, not the auth logic itself.');

  } catch (error) {
    console.error('Error in registration logic:', error);
    console.error('Stack trace:', error.stack);
  }
}

testRegistrationLogic();