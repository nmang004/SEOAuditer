# Comprehensive JWT Authentication System Setup Guide

## Overview

This guide covers the setup and deployment of a production-ready JWT-based authentication system with the following security features:

- **RS256 Algorithm**: Asymmetric key signing for enhanced security
- **15-minute Access Tokens**: Short-lived tokens for security
- **7-day Refresh Tokens**: With automatic rotation
- **Rate Limiting**: 5 attempts per 15 minutes for login
- **bcrypt Hashing**: 12 rounds for password security
- **Session Management**: Concurrent session limiting
- **Audit Logging**: Complete security event tracking
- **Role-based Access Control**: User and admin roles with permissions

## Prerequisites

- Node.js 16+ and npm
- PostgreSQL database
- Redis instance
- SMTP server for email verification

## Environment Setup

### 1. Required Environment Variables

Create a `.env` file in your backend directory with the following variables:

```env
# Node Environment
NODE_ENV=development

# Server Configuration
PORT=4000
API_URL=http://localhost:4000
CLIENT_URL=http://localhost:3000
APP_NAME="Rival Outranker"
APP_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/rival_outranker"
DIRECT_URL="postgresql://username:password@localhost:5432/rival_outranker"

# JWT Configuration (Generate using the development endpoint)
JWT_SECRET="your-32-character-secret-here-minimum"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# Redis
REDIS_URL="redis://localhost:6379"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# CORS
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"

# Email Configuration
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM_NAME="Rival Outranker"
EMAIL_FROM_EMAIL=noreply@example.com

# Logging
LOG_LEVEL=info
```

### 2. Generate JWT Keys

The system requires RS256 keys for JWT signing. You can generate them using the development endpoint:

```bash
# Start your development server
npm run dev

# Generate keys
curl http://localhost:4000/api/auth/dev/generate-keys

# Copy the generated keys to your .env file
```

Or generate them manually using OpenSSL:

```bash
# Generate private key
openssl genpkey -algorithm RSA -out private.pem -pkcs8 -pass pass:password

# Generate public key
openssl rsa -pubout -in private.pem -out public.pem

# Convert to environment format (escape newlines)
cat private.pem | sed ':a;N;$!ba;s/\n/\\n/g'
cat public.pem | sed ':a;N;$!ba;s/\n/\\n/g'
```

## Database Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Seed with sample data
npm run seed
```

### 3. Run Database Setup Script

```bash
# Run comprehensive database setup and validation
npm run setup:database
```

This script will:
- Validate environment variables
- Test database connectivity
- Ensure schema integrity
- Optimize performance
- Setup indexes
- Validate data integrity
- Test concurrent operations

## Testing the Authentication System

### 1. Run Unit Tests

```bash
# Run all authentication tests
npm test -- secure-auth.integration.test.ts

# Run with coverage
npm run test:coverage
```

### 2. Manual Testing

#### Register a New User

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "name": "Test User"
  }'
```

#### Login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'
```

#### Access Protected Route

```bash
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Refresh Token

```bash
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Cookie: refreshToken=YOUR_REFRESH_TOKEN"
```

#### Logout

```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Cookie: refreshToken=YOUR_REFRESH_TOKEN"
```

### 3. Test Rate Limiting

```bash
# Test login rate limiting (should fail after 5 attempts)
for i in {1..6}; do
  curl -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "wrongpassword"
    }'
  echo "Attempt $i"
done
```

## Security Features Verification

### 1. JWT Token Structure

Verify that tokens use RS256:

```bash
# Decode JWT header (replace with actual token)
echo "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9" | base64 -d
```

Should show: `{"typ":"JWT","alg":"RS256"}`

### 2. Password Hashing

Check that passwords are hashed with bcrypt (12 rounds):

```sql
SELECT "passwordHash" FROM users WHERE email = 'test@example.com';
```

Should start with: `$2b$12$`

### 3. Session Management

```bash
# Get user sessions
curl -X GET http://localhost:4000/api/auth/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Invalidate all sessions
curl -X POST http://localhost:4000/api/auth/sessions/invalidate-all \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Security Headers

```bash
curl -I http://localhost:4000/api/auth/health
```

Should include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Production Deployment

### 1. Environment Configuration

```env
NODE_ENV=production
```

### 2. Security Checklist

- [ ] Use HTTPS in production
- [ ] Set secure cookies (`secure: true`)
- [ ] Use strong JWT keys (2048-bit RSA minimum)
- [ ] Enable Redis persistence
- [ ] Configure proper CORS origins
- [ ] Set up log monitoring
- [ ] Enable database connection pooling
- [ ] Configure firewall rules
- [ ] Set up SSL/TLS for database connections
- [ ] Enable audit logging
- [ ] Configure backup strategies

### 3. Performance Optimizations

- [ ] Enable Redis clustering
- [ ] Set up database read replicas
- [ ] Configure CDN for static assets
- [ ] Enable gzip compression
- [ ] Set up load balancing
- [ ] Configure connection pooling
- [ ] Enable query optimization

### 4. Monitoring Setup

```bash
# Health check endpoint
curl http://localhost:4000/api/auth/health

# System status (admin only)
curl http://localhost:4000/api/auth/status \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Troubleshooting

### Common Issues

1. **JWT Key Errors**
   ```
   Error: JWT key initialization failed
   ```
   - Ensure JWT_PRIVATE_KEY and JWT_PUBLIC_KEY are properly formatted
   - Check for escaped newlines in environment variables

2. **Redis Connection Issues**
   ```
   Error: Redis connection failed
   ```
   - Verify Redis is running
   - Check REDIS_URL configuration
   - System will continue without Redis (degraded functionality)

3. **Database Connection Issues**
   ```
   Error: Database connection failed
   ```
   - Verify PostgreSQL is running
   - Check DATABASE_URL format
   - Ensure database exists and user has permissions

4. **Rate Limiting Not Working**
   - Check Redis connection
   - Verify rate limiting middleware is applied
   - Review IP detection configuration

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
```

### Database Diagnostics

```bash
# Run database diagnostics
npm run db:diagnose

# Check database performance
npm run db:performance
```

## API Documentation

### Authentication Endpoints

| Endpoint | Method | Description | Rate Limit |
|----------|--------|-------------|------------|
| `/api/auth/register` | POST | User registration | 5/hour |
| `/api/auth/login` | POST | User login | 5/15min |
| `/api/auth/logout` | POST | User logout | None |
| `/api/auth/refresh` | POST | Token refresh | 5/15min |
| `/api/auth/me` | GET | Get current user | None |
| `/api/auth/password-reset` | POST | Request password reset | 3/hour |
| `/api/auth/password-reset/confirm` | POST | Confirm password reset | 5/15min |
| `/api/auth/verify-email/:token` | GET | Verify email | None |

### Admin Endpoints

| Endpoint | Method | Description | Permission |
|----------|--------|-------------|------------|
| `/api/auth/admin/users` | GET | List all users | `read:all_users` |
| `/api/auth/admin/users/:id/lock` | POST | Lock/unlock user | `update:all_users` |
| `/api/auth/admin/users/:id/activity` | GET | User activity logs | `read:all_users` |

## Security Best Practices

1. **Token Management**
   - Never store access tokens in localStorage
   - Use httpOnly cookies for refresh tokens
   - Implement token rotation
   - Set appropriate expiration times

2. **Password Security**
   - Enforce strong password policies
   - Use bcrypt with 12+ rounds
   - Implement account lockout
   - Monitor for credential stuffing

3. **Session Security**
   - Limit concurrent sessions
   - Implement session invalidation
   - Track session activity
   - Log security events

4. **Network Security**
   - Use HTTPS in production
   - Implement proper CORS
   - Set security headers
   - Enable rate limiting

5. **Database Security**
   - Use parameterized queries
   - Implement proper indexing
   - Enable audit logging
   - Regular security updates

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the test files for examples
3. Check application logs
4. Verify environment configuration
5. Test with development endpoints

## Contributing

When making changes to the authentication system:

1. Run all tests: `npm test`
2. Update documentation
3. Follow security best practices
4. Test rate limiting scenarios
5. Verify audit logging works
6. Check performance impact 