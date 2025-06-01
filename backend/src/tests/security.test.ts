import request from 'supertest';
import { app } from '../server';
import { PrismaClient } from '@prisma/client';
import { AdvancedSanitizer } from '../middleware/security.middleware';
import { TwoFactorAuth, PasswordSecurity, AccountLockout } from '../middleware/enhanced-security.middleware';
import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

describe('Comprehensive Security Test Suite', () => {
  let testUser: any;
  let authToken: string;
  
  beforeAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { contains: 'securitytest' } }
    });
    
    // Create test user
    const passwordHash = await bcrypt.hash('SecurePassword123!', 12);
    testUser = await prisma.user.create({
      data: {
        email: 'securitytest@example.com',
        passwordHash,
        name: 'Security Test User',
        emailVerified: true
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { contains: 'securitytest' } }
    });
    await prisma.$disconnect();
  });

  describe('Input Sanitization', () => {
    describe('AdvancedSanitizer', () => {
      test('should sanitize XSS attempts', () => {
        const maliciousInput = '<script>alert("XSS")</script><img src="x" onerror="alert(1)">';
        const sanitized = AdvancedSanitizer.sanitizeString(maliciousInput);
        
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('alert');
      });

      test('should sanitize SQL injection attempts', () => {
        const maliciousInput = "'; DROP TABLE users; --";
        const sanitized = AdvancedSanitizer.sanitizeString(maliciousInput);
        
        expect(sanitized).not.toContain('DROP');
        expect(sanitized).not.toContain('TABLE');
        expect(sanitized).not.toContain('--');
      });

      test('should validate filenames properly', () => {
        expect(AdvancedSanitizer.validateFilename('safe_file.txt')).toBe(true);
        expect(AdvancedSanitizer.validateFilename('malicious.exe')).toBe(false);
        expect(AdvancedSanitizer.validateFilename('../../../etc/passwd')).toBe(false);
        expect(AdvancedSanitizer.validateFilename('file\0.txt')).toBe(false);
      });

      test('should sanitize objects recursively', () => {
        const maliciousObject = {
          name: '<script>alert("XSS")</script>',
          email: 'test@example.com',
          nested: {
            data: "'; DROP TABLE users; --"
          }
        };
        
        const sanitized = AdvancedSanitizer.sanitizeObject(maliciousObject);
        
        expect(sanitized.name).not.toContain('<script>');
        expect(sanitized.nested.data).not.toContain('DROP');
      });
    });

    test('should block requests with malicious input', async () => {
      const maliciousPayload = {
        name: '<script>alert("XSS")</script>',
        description: "'; DROP TABLE users; --"
      };

      const response = await request(app)
        .post('/api/test/sanitization')
        .send(maliciousPayload);

      // Input should be sanitized, not blocked entirely
      expect(response.status).not.toBe(400);
      if (response.body.data) {
        expect(response.body.data.name).not.toContain('<script>');
        expect(response.body.data.description).not.toContain('DROP');
      }
    });
  });

  describe('Rate Limiting', () => {
    test('should apply rate limiting to API endpoints', async () => {
      const promises = [];
      
      // Make multiple requests quickly
      for (let i = 0; i < 110; i++) {
        promises.push(request(app).get('/api/health'));
      }
      
      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    }, 10000);

    test('should apply stricter rate limiting to auth endpoints', async () => {
      const promises = [];
      
      // Make multiple failed login attempts
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'nonexistent@example.com',
              password: 'wrongpassword'
            })
        );
      }
      
      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('Authentication Security', () => {
    describe('Password Security', () => {
      test('should validate password strength', () => {
        const weakPassword = 'password';
        const strongPassword = 'SecurePassword123!';
        
        const weakResult = PasswordSecurity.validatePasswordStrength(weakPassword);
        const strongResult = PasswordSecurity.validatePasswordStrength(strongPassword);
        
        expect(weakResult.valid).toBe(false);
        expect(strongResult.valid).toBe(true);
        expect(strongResult.score).toBeGreaterThan(weakResult.score);
      });

      test('should reject common passwords', () => {
        const commonPasswords = ['password', '123456', 'qwerty'];
        
        commonPasswords.forEach(password => {
          const result = PasswordSecurity.validatePasswordStrength(password);
          expect(result.valid).toBe(false);
          expect(result.feedback).toContain('Password is too common');
        });
      });

      test('should detect sequential patterns', () => {
        const sequentialPasswords = ['abcdef123', 'qwerty789', '123456abc'];
        
        sequentialPasswords.forEach(password => {
          const result = PasswordSecurity.validatePasswordStrength(password);
          expect(result.feedback).toContain('Avoid sequential patterns');
        });
      });
    });

    describe('Account Lockout', () => {
      test('should lock account after repeated failed attempts', async () => {
        const testEmail = 'lockouttest@example.com';
        
        // Create test user
        const passwordHash = await bcrypt.hash('SecurePassword123!', 12);
        await prisma.user.create({
          data: {
            email: testEmail,
            passwordHash,
            name: 'Lockout Test User',
            emailVerified: true
          }
        });

        // Simulate failed login attempts
        for (let i = 0; i < 6; i++) {
          await AccountLockout.recordFailedAttempt(testEmail, '127.0.0.1');
        }

        const lockoutStatus = await AccountLockout.isAccountLocked(testEmail);
        expect(lockoutStatus.locked).toBe(true);

        // Clean up
        await prisma.user.delete({ where: { email: testEmail } });
      });

      test('should unlock account after successful login', async () => {
        const testEmail = 'unlocktest@example.com';
        
        // Create test user
        const passwordHash = await bcrypt.hash('SecurePassword123!', 12);
        await prisma.user.create({
          data: {
            email: testEmail,
            passwordHash,
            name: 'Unlock Test User',
            emailVerified: true,
            failedLoginAttempts: 3
          }
        });

        await AccountLockout.recordSuccessfulLogin(testEmail, '127.0.0.1');

        const user = await prisma.user.findUnique({ where: { email: testEmail } });
        expect(user?.failedLoginAttempts).toBe(0);
        expect(user?.accountLocked).toBe(false);

        // Clean up
        await prisma.user.delete({ where: { email: testEmail } });
      });
    });

    describe('Two-Factor Authentication', () => {
      test('should generate valid 2FA secrets', () => {
        const userEmail = 'test2fa@example.com';
        const result = TwoFactorAuth.generateSecret(userEmail);
        
        expect(result.secret).toBeDefined();
        expect(result.qrCodeUrl).toBeDefined();
        expect(result.backupCodes).toHaveLength(10);
        expect(result.qrCodeUrl).toContain(userEmail);
      });

      test('should verify TOTP tokens', () => {
        const secret = 'JBSWY3DPEHPK3PXP';
        
        // Generate a token (this would normally come from an authenticator app)
        const speakeasy = require('speakeasy');
        const token = speakeasy.totp({
          secret: secret,
          encoding: 'base32'
        });
        
        const isValid = TwoFactorAuth.verifyToken(secret, token);
        expect(isValid).toBe(true);
      });

      test('should handle backup codes correctly', () => {
        const backupCodes = ['ABCD1234', 'EFGH5678', 'IJKL9012'];
        
        // Valid backup code should work once
        expect(TwoFactorAuth.verifyBackupCode(backupCodes, 'ABCD1234')).toBe(true);
        expect(backupCodes).not.toContain('ABCD1234'); // Should be removed
        
        // Same code should not work again
        expect(TwoFactorAuth.verifyBackupCode(backupCodes, 'ABCD1234')).toBe(false);
        
        // Invalid code should not work
        expect(TwoFactorAuth.verifyBackupCode(backupCodes, 'INVALID')).toBe(false);
      });
    });
  });

  describe('File Upload Security', () => {
    test('should reject malicious file types', async () => {
      const maliciousFile = Buffer.from('#!/bin/bash\necho "malicious script"');
      
      const response = await request(app)
        .post('/api/upload/secure')
        .attach('file', maliciousFile, 'malicious.sh')
        .expect(400);

      expect(response.body.message).toContain('File type not allowed');
    });

    test('should validate file content', async () => {
      const maliciousContent = '<script>alert("XSS")</script>';
      const testFile = Buffer.from(maliciousContent);
      
      const response = await request(app)
        .post('/api/upload/secure')
        .attach('file', testFile, 'test.txt');

      if (response.status === 400) {
        expect(response.body.message).toContain('security check failed');
      }
    });

    test('should handle file size limits', async () => {
      // Create a large buffer (>10MB)
      const largeFile = Buffer.alloc(11 * 1024 * 1024, 'a');
      
      const response = await request(app)
        .post('/api/upload/secure')
        .attach('file', largeFile, 'large.txt')
        .expect(413); // Payload too large
    });
  });

  describe('Security Headers', () => {
    test('should include all required security headers', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['referrer-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toBeDefined();
    });

    test('should include HSTS header in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const response = await request(app).get('/api/health');
      
      if (process.env.NODE_ENV === 'production') {
        expect(response.headers['strict-transport-security']).toBeDefined();
      }
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('CORS Configuration', () => {
    test('should allow requests from allowed origins', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000');
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    test('should reject requests from disallowed origins', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://malicious.com');
      
      // Should either be rejected or not include CORS headers
      expect(
        response.status === 403 || 
        !response.headers['access-control-allow-origin']
      ).toBe(true);
    });
  });

  describe('SQL Injection Prevention', () => {
    test('should prevent SQL injection in user queries', async () => {
      const sqlInjectionPayload = {
        email: "admin'; DROP TABLE users; --",
        password: 'password'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(sqlInjectionPayload);

      // Should not cause a server error (500) due to SQL injection
      expect(response.status).not.toBe(500);
      // Should likely be 401 (Unauthorized) due to invalid credentials
      expect([400, 401, 429]).toContain(response.status);
    });

    test('should sanitize search parameters', async () => {
      const response = await request(app)
        .get('/api/projects')
        .query({ search: "'; DROP TABLE projects; --" });

      // Should not cause server error
      expect(response.status).not.toBe(500);
    });
  });

  describe('XSS Prevention', () => {
    test('should prevent stored XSS in user data', async () => {
      const xssPayload = {
        name: '<script>alert("XSS")</script>',
        email: 'xsstest@example.com',
        password: 'SecurePassword123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(xssPayload);

      if (response.status === 201) {
        // If user was created, check that the script was sanitized
        const user = await prisma.user.findUnique({ 
          where: { email: 'xsstest@example.com' } 
        });
        
        if (user) {
          expect(user.name).not.toContain('<script>');
          expect(user.name).not.toContain('alert');
          
          // Clean up
          await prisma.user.delete({ where: { email: 'xsstest@example.com' } });
        }
      }
    });

    test('should prevent reflected XSS in error messages', async () => {
      const xssPayload = '<script>alert("XSS")</script>';
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: xssPayload, password: 'invalid' });

      // Check that script tags are not reflected in response
      expect(JSON.stringify(response.body)).not.toContain('<script>');
      expect(JSON.stringify(response.body)).not.toContain('alert');
    });
  });

  describe('Session Security', () => {
    test('should generate secure session IDs', () => {
      const sessionId1 = require('crypto').randomBytes(32).toString('hex');
      const sessionId2 = require('crypto').randomBytes(32).toString('hex');
      
      expect(sessionId1).not.toBe(sessionId2);
      expect(sessionId1).toHaveLength(64); // 32 bytes = 64 hex chars
    });

    test('should validate session integrity', async () => {
      // This would test session hijacking detection
      // Implementation depends on your session management system
    });
  });

  describe('API Security Monitoring', () => {
    test('should log suspicious API activity', async () => {
      const suspiciousRequests = [
        '/api/users/../../../etc/passwd',
        '/api/admin?id=1 OR 1=1',
        '/api/files?path=../../../sensitive'
      ];

      for (const path of suspiciousRequests) {
        await request(app).get(path);
      }

      // Check if security events were logged
      const securityEvents = await prisma.securityEvent.findMany({
        where: {
          eventType: 'suspicious_activity',
          createdAt: {
            gte: new Date(Date.now() - 60000) // Last minute
          }
        }
      });

      expect(securityEvents.length).toBeGreaterThan(0);
    });

    test('should detect rapid-fire requests', async () => {
      const promises = [];
      
      for (let i = 0; i < 20; i++) {
        promises.push(request(app).get('/api/health'));
      }
      
      await Promise.all(promises);
      
      // Should trigger rate limiting or slow down
      const response = await request(app).get('/api/health');
      
      // Check for rate limit headers or delayed response
      expect(
        response.headers['x-ratelimit-remaining'] !== undefined ||
        response.headers['retry-after'] !== undefined ||
        response.status === 429
      ).toBe(true);
    }, 10000);
  });

  describe('Environment Security', () => {
    test('should not expose sensitive environment variables', async () => {
      const response = await request(app).get('/api/debug/env');
      
      if (response.status === 200) {
        expect(response.body).not.toHaveProperty('DATABASE_URL');
        expect(response.body).not.toHaveProperty('JWT_SECRET');
        expect(response.body).not.toHaveProperty('REDIS_URL');
      } else {
        // Debug endpoint should not be available in production
        expect([404, 403]).toContain(response.status);
      }
    });

    test('should validate JWT configuration', () => {
      const jwtSecret = process.env.JWT_SECRET;
      
      expect(jwtSecret).toBeDefined();
      expect(jwtSecret!.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('Data Protection', () => {
    test('should hash passwords with strong algorithm', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 12);
      
      expect(hash).toMatch(/^\$2[ab]\$12\$/); // bcrypt with 12 rounds
      expect(hash).not.toBe(password);
      expect(await bcrypt.compare(password, hash)).toBe(true);
    });

    test('should not expose password hashes in API responses', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'SecurePassword123!'
        });

      if (response.status === 200 && response.body.user) {
        expect(response.body.user).not.toHaveProperty('passwordHash');
        expect(response.body.user).not.toHaveProperty('password');
      }
    });
  });

  describe('Content Security Policy', () => {
    test('should enforce CSP directives', async () => {
      const response = await request(app).get('/api/health');
      const csp = response.headers['content-security-policy'];
      
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
    });
  });
});

// Performance and Load Testing
describe('Security Performance Tests', () => {
  test('should handle security middleware efficiently', async () => {
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < 50; i++) {
      promises.push(request(app).get('/api/health'));
    }
    
    await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Security middleware should not significantly impact performance
    expect(totalTime).toBeLessThan(10000); // Less than 10 seconds for 50 requests
  }, 15000);

  test('should sanitize large payloads efficiently', () => {
    const largeObject = {
      data: 'x'.repeat(10000),
      nested: {
        moreData: 'y'.repeat(10000)
      }
    };
    
    const startTime = Date.now();
    AdvancedSanitizer.sanitizeObject(largeObject);
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second
  });
}); 