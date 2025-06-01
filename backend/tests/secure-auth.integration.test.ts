import request from 'supertest';
import { app } from '../src/index';
import { PrismaClient } from '@prisma/client';
import { jwtService } from '../src/services/enhanced-jwt.service';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Secure Authentication System', () => {
  let server: any;
  const testUser = {
    email: `test_${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    name: 'Test User'
  };
  
  let accessToken: string;
  let refreshToken: string;
  let userId: string;

  beforeAll(async () => {
    server = app.listen();
    
    // Clean up any existing test data
    await prisma.user.deleteMany({
      where: { email: { contains: 'test_' } }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { contains: 'test_' } }
    });
    
    await prisma.$disconnect();
    server.close();
  });

  describe('User Registration', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(server)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.name).toBe(testUser.name);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.sessionId).toBeDefined();
      expect(response.body.data.expiresIn).toBe(15 * 60); // 15 minutes

      // Store tokens for later tests
      accessToken = response.body.data.accessToken;
      userId = response.body.data.user.id;

      // Check if refresh token cookie is set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.includes('refreshToken'))).toBe(true);
      expect(cookies.some((cookie: string) => cookie.includes('httpOnly'))).toBe(true);
      expect(cookies.some((cookie: string) => cookie.includes('sameSite=strict'))).toBe(true);
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(server)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'SecurePassword123!',
          name: 'Test User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('ValidationError');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(server)
        .post('/api/auth/register')
        .send({
          email: `weak_${Date.now()}@example.com`,
          password: '123', // Weak password
          name: 'Test User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('ValidationError');
    });

    it('should reject duplicate email registration', async () => {
      const response = await request(server)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('An account with this email already exists');
    });
  });

  describe('User Login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.sessionId).toBeDefined();

      // Update tokens for later tests
      accessToken = response.body.data.accessToken;

      // Check refresh token cookie
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.includes('refreshToken'))).toBe(true);
    });

    it('should reject login with invalid password', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should handle remember me option', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          rememberMe: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Check that refresh token has longer expiry
      const cookies = response.headers['set-cookie'];
      const refreshCookie = cookies.find((cookie: string) => cookie.includes('refreshToken'));
      expect(refreshCookie).toContain('Max-Age=2592000'); // 30 days
    });
  });

  describe('JWT Token Verification', () => {
    it('should verify valid access token structure', () => {
      const decoded = jwt.decode(accessToken) as any;
      
      expect(decoded.userId).toBe(userId);
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.type).toBe('access');
      expect(decoded.role).toBeDefined();
      expect(decoded.sessionId).toBeDefined();
      expect(decoded.permissions).toBeDefined();
      expect(decoded.iss).toBeDefined(); // Issuer
      expect(decoded.aud).toBeDefined(); // Audience
      expect(decoded.exp).toBeDefined(); // Expiration
      expect(decoded.iat).toBeDefined(); // Issued at
      expect(decoded.jti).toBeDefined(); // JWT ID
    });

    it('should use RS256 algorithm', () => {
      const header = jwt.decode(accessToken, { complete: true })?.header;
      expect(header?.alg).toBe('RS256');
    });
  });

  describe('Protected Routes', () => {
    it('should access protected route with valid token', async () => {
      const response = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('should reject protected route without token', async () => {
      const response = await request(server)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token is required');
    });

    it('should reject protected route with invalid token', async () => {
      const response = await request(server)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired access token');
    });
  });

  describe('Password Reset', () => {
    it('should request password reset for existing email', async () => {
      const response = await request(server)
        .post('/api/auth/password-reset')
        .send({
          email: testUser.email
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password reset link has been sent');
    });

    it('should handle password reset for non-existent email gracefully', async () => {
      const response = await request(server)
        .post('/api/auth/password-reset')
        .send({
          email: 'nonexistent@example.com'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password reset link has been sent');
    });

    it('should confirm password reset with valid token', async () => {
      // First, generate a reset token for testing
      const user = await prisma.user.findUnique({
        where: { email: testUser.email }
      });

      const resetToken = 'test-reset-token';
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user!.id },
        data: {
          resetToken,
          resetExpires
        }
      });

      const newPassword = 'NewSecurePassword123!';
      const response = await request(server)
        .post('/api/auth/password-reset/confirm')
        .send({
          token: resetToken,
          password: newPassword,
          confirmPassword: newPassword
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password reset successfully');

      // Verify the password was actually changed
      const loginResponse = await request(server)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: newPassword
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);

      // Update our test password for future tests
      testUser.password = newPassword;
    });
  });

  describe('Session Management', () => {
    it('should get user sessions', async () => {
      const response = await request(server)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions).toBeDefined();
      expect(Array.isArray(response.body.data.sessions)).toBe(true);
    });

    it('should invalidate all sessions', async () => {
      const response = await request(server)
        .post('/api/auth/sessions/invalidate-all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('All sessions invalidated successfully');

      // Try to use the old token - should fail
      const profileResponse = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);

      expect(profileResponse.body.success).toBe(false);
    });
  });

  describe('Logout', () => {
    beforeEach(async () => {
      // Login again to get fresh tokens
      const loginResponse = await request(server)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should logout successfully', async () => {
      const response = await request(server)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');

      // Check that refresh token cookie is cleared
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => 
        cookie.includes('refreshToken=') && cookie.includes('Max-Age=0')
      )).toBe(true);
    });

    it('should handle logout without token gracefully', async () => {
      const response = await request(server)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to login attempts', async () => {
      // Make multiple failed login attempts
      const failedAttempts = [];
      for (let i = 0; i < 6; i++) {
        failedAttempts.push(
          request(server)
            .post('/api/auth/login')
            .send({
              email: testUser.email,
              password: 'wrongpassword'
            })
        );
      }

      const responses = await Promise.all(failedAttempts);
      
      // First 5 should be 401 (Unauthorized)
      responses.slice(0, 5).forEach(response => {
        expect(response.status).toBe(401);
      });

      // 6th should be rate limited (429)
      expect(responses[5].status).toBe(429);
    }, 10000);

    it('should apply rate limiting to registration', async () => {
      const registrationAttempts = [];
      for (let i = 0; i < 6; i++) {
        registrationAttempts.push(
          request(server)
            .post('/api/auth/register')
            .send({
              email: `ratetest_${i}_${Date.now()}@example.com`,
              password: 'SecurePassword123!',
              name: 'Rate Test User'
            })
        );
      }

      const responses = await Promise.all(registrationAttempts);
      
      // Some should succeed, but eventually rate limiting should kick in
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(server)
        .get('/api/auth/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('System Status', () => {
    it('should get public authentication status', async () => {
      const response = await request(server)
        .get('/api/auth/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.algorithm).toBe('RS256');
      expect(response.body.data.accessTokenExpiry).toBe('15m');
      expect(response.body.data.refreshTokenExpiry).toBe('7d');
    });

    it('should get health check', async () => {
      const response = await request(server)
        .get('/api/auth/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.uptime).toBeDefined();
      expect(response.body.data.timestamp).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should validate email format in registration', async () => {
      const response = await request(server)
        .post('/api/auth/register')
        .send({
          email: 'invalid.email',
          password: 'SecurePassword123!',
          name: 'Test User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('ValidationError');
    });

    it('should validate password complexity', async () => {
      const response = await request(server)
        .post('/api/auth/register')
        .send({
          email: `valid_${Date.now()}@example.com`,
          password: 'simple', // Does not meet complexity requirements
          name: 'Test User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('ValidationError');
    });

    it('should validate required fields', async () => {
      const response = await request(server)
        .post('/api/auth/register')
        .send({
          email: `valid_${Date.now()}@example.com`
          // Missing password and name
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('ValidationError');
    });
  });

  describe('Password Security', () => {
    it('should hash passwords with bcrypt', async () => {
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
        select: { passwordHash: true }
      });

      expect(user?.passwordHash).toBeDefined();
      expect(user?.passwordHash).not.toBe(testUser.password);
      expect(user?.passwordHash?.startsWith('$2b$12$')).toBe(true); // bcrypt with 12 rounds
    });
  });

  describe('Audit Logging', () => {
    it('should log security events', async () => {
      // Login to generate a security event
      await request(server)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      // Check if activity log was created
      const activityLogs = await prisma.activityLog.findMany({
        where: {
          event: 'login_success'
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      });

      expect(activityLogs.length).toBeGreaterThan(0);
      expect(activityLogs[0].event).toBe('login_success');
      expect(activityLogs[0].metadata).toBeDefined();
    });
  });
}); 