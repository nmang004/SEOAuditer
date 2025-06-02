const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mock in-memory database
const users = [];

// Mock JWT secret
const JWT_SECRET = 'test-jwt-secret-for-development-only';

// Mock email service
const sendEmail = async (options) => {
  console.log('Mock email sent:', options);
  return true;
};

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    console.log('Registration request:', { email, name });

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields'
        }
      });
    }

    // Check if user exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Email already in use'
        }
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = uuidv4();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

    // Create user
    const user = {
      id: uuidv4(),
      email,
      name,
      passwordHash: hashedPassword,
      verificationToken,
      verificationExpires,
      emailVerified: false,
      createdAt: new Date()
    };

    // Save to mock database
    users.push(user);

    // Send verification email (mock)
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email',
      template: 'verify-email',
      context: {
        name: user.name,
        verificationUrl: `http://localhost:3000/verify-email/${verificationToken}`
      }
    });

    // Generate JWT token
    const accessToken = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Return success response
    const responseUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    };

    console.log('User registered successfully:', responseUser);

    res.status(201).json({
      success: true,
      data: {
        user: responseUser,
        token: accessToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        details: error.message
      }
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Mock auth server is running'
  });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Mock auth server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('- POST /api/auth/register');
  console.log('- GET /api/health');
});