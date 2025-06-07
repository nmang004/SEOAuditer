# Development Setup Guide

This guide will help you set up a complete development environment for Rival Outranker, including all tools, dependencies, and configurations needed for effective development.

## 🛠️ Prerequisites

### Required Software

- **Node.js**: Version 18.0 or higher

  ```bash
  # Check version
  node --version
  npm --version
  
  # Install via nvm (recommended)
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  nvm install 18
  nvm use 18
  ```

- **Docker & Docker Compose**: For database and services

  ```bash
  # Verify installation
  docker --version
  docker-compose --version
  ```

- **Git**: For version control

  ```bash
  git --version
  ```

### Development Tools (Recommended)

- **VS Code**: With recommended extensions
- **Postman**: For API testing
- **DBeaver/PgAdmin**: For database management
- **Redis CLI**: For cache debugging

## 🚀 Initial Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-org/rival-outranker.git
cd rival-outranker

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Environment Configuration

```bash
# Copy environment templates
cp .env.example .env
cp backend/.env.example backend/.env

# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Root `.env.local`:**

```bash
# Frontend configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=http://localhost:4000
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_PWA=true
```

**Backend `.env`:**

```bash
# Server configuration
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rival_outranker_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET="your-generated-secret-here"
JWT_REFRESH_SECRET="your-generated-refresh-secret-here"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# External APIs (optional for development)
LIGHTHOUSE_API_KEY=""
EMAIL_SERVICE_API_KEY=""

# Development settings
DEBUG="app:*"
LOG_LEVEL="debug"
LOG_FILE_ENABLED=true

# Rate limiting (relaxed for development)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

### 3. Database Setup

**Option A: Docker (Recommended)**

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Wait for services to be ready
docker-compose logs postgres redis
```

**Option B: Local Installation**

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib redis-server

# macOS
brew install postgresql redis
brew services start postgresql redis

# Create database
createdb rival_outranker_dev
```

### 4. Database Migration and Seeding

```bash
cd backend

# Run migrations
npm run migrate:dev

# Optimize database for development
npm run db:optimize

# Seed with comprehensive test data
npm run seed:enhanced

# Verify setup
npm run db:validate
```

### 5. Start Development Services

**Terminal 1: Backend**

```bash
cd backend
npm run dev
```

**Terminal 2: Frontend**

```bash
npm run dev
```

**Terminal 3: Database Services (if using Docker)**

```bash
docker-compose up postgres redis
```

### 6. Verify Setup

```bash
# Check all services
curl http://localhost:3000/api/health
curl http://localhost:4000/health
curl http://localhost:4000/health/database
curl http://localhost:4000/health/redis

# Test authentication
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","password":"DevPassword123!","name":"Dev User"}'
```

## 🔧 Development Tools Configuration

### VS Code Setup

**Recommended Extensions:**

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "prisma.prisma",
    "ms-vscode.vscode-json",
    "ms-vscode-remote.remote-containers",
    "redhat.vscode-yaml"
  ]
}
```

**VS Code Settings (`.vscode/settings.json`):**

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "javascript": "html"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

**Launch Configuration (`.vscode/launch.json`):**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/src/index.ts",
      "env": {
        "NODE_ENV": "development"
      },
      "runtimeArgs": ["-r", "ts-node/register"],
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug Frontend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

### Git Configuration

**Pre-commit Hooks:**

```bash
# Install husky for git hooks
npm run prepare

# Verify hooks are installed
ls -la .git/hooks/
```

**Git Hooks Configuration (`.husky/pre-commit`):**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run linting and formatting
npm run lint:fix
npm run format

# Run type checking
npm run type-check

# Run tests
npm run test:changed
```

### Database Development Tools

**Prisma Studio:**

```bash
cd backend
npx prisma studio
# Opens at http://localhost:5555
```

**Database CLI Access:**

```bash
# PostgreSQL CLI
docker-compose exec postgres psql -U postgres -d rival_outranker_dev

# Redis CLI
docker-compose exec redis redis-cli
```

**Database Reset Script:**

```bash
# Create development script
cat > scripts/reset-dev-db.sh << 'EOF'
#!/bin/bash
cd backend

echo "Resetting development database..."
npm run migrate:reset
npm run migrate:dev
npm run seed:enhanced
echo "Database reset complete!"
EOF

chmod +x scripts/reset-dev-db.sh
```

## 🧪 Testing Setup

### Test Environment Configuration

**Backend Test Setup:**

```bash
cd backend

# Create test database
createdb rival_outranker_test

# Test environment variables
cat > .env.test << 'EOF'
NODE_ENV=test
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rival_outranker_test"
REDIS_URL="redis://localhost:6379/1"
JWT_SECRET="test-secret"
JWT_REFRESH_SECRET="test-refresh-secret"
EOF
```

### Running Tests

```bash
# All tests
npm test

# Backend tests only
cd backend && npm test

# Frontend tests only
npm run test:frontend

# Test with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# Integration tests
npm run test:integration

# Security tests
npm run test:security
```

### Test Database Management

```bash
# Setup test database
npm run test:db:setup

# Reset test database
npm run test:db:reset

# Seed test data
npm run test:db:seed
```

## 🔧 Development Scripts

### Package.json Scripts Overview

**Root level scripts:**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "test": "npm run test:frontend && npm run test:backend",
    "test:frontend": "jest --config jest.config.js",
    "test:backend": "cd backend && npm test",
    "prepare": "husky install"
  }
}
```

**Backend scripts:**

```json
{
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "migrate:dev": "prisma migrate dev",
    "migrate:deploy": "prisma migrate deploy",
    "db:seed": "ts-node scripts/seed.ts",
    "db:reset": "prisma migrate reset --force",
    "db:studio": "prisma studio",
    "generate": "prisma generate"
  }
}
```

### Custom Development Scripts

**Performance monitoring:**

```bash
# scripts/monitor-performance.js
const performanceMonitor = require('./performance-monitor');

setInterval(async () => {
  const metrics = await performanceMonitor.collect();
  console.log('Performance metrics:', metrics);
}, 30000);
```

**Database health check:**

```bash
# scripts/check-db-health.js
const { PrismaClient } = require('@prisma/client');
const redis = require('redis');

async function checkHealth() {
  try {
    const prisma = new PrismaClient();
    const redisClient = redis.createClient();
    
    await prisma.$queryRaw`SELECT 1`;
    await redisClient.ping();
    
    console.log('✅ All services healthy');
  } catch (error) {
    console.error('❌ Health check failed:', error);
  }
}

checkHealth();
```

## 🔍 Debugging Setup

### Backend Debugging

**Debug Configuration:**

```typescript
// backend/src/config/debug.ts
import debug from 'debug';

export const dbgApp = debug('app:main');
export const dbgDB = debug('app:database');
export const dbgAuth = debug('app:auth');
export const dbgCrawler = debug('app:crawler');
export const dbgWS = debug('app:websocket');
```

**Usage in code:**

```typescript
import { dbgAuth } from '../config/debug';

export const authenticateUser = async (credentials) => {
  dbgAuth('Authenticating user: %s', credentials.email);
  // ... authentication logic
};
```

**Debug Environment:**

```bash
# Enable all debug output
DEBUG=app:* npm run dev

# Enable specific modules
DEBUG=app:auth,app:database npm run dev

# Debug with file output
DEBUG=app:* npm run dev 2>&1 | tee debug.log
```

### Frontend Debugging

**React DevTools:**

```bash
# Install React DevTools extension for Chrome/Firefox
# Available in browser extension store
```

**Next.js Debugging:**

```javascript
// next.config.js
module.exports = {
  // Enable source maps in development
  productionBrowserSourceMaps: process.env.NODE_ENV === 'development',
  
  // Webpack configuration for debugging
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = 'eval-source-map';
    }
    return config;
  }
};
```

### Database Debugging

**Prisma Query Logging:**

```typescript
// backend/src/config/database.ts
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
});
```

**SQL Query Analysis:**

```sql
-- Enable query logging in PostgreSQL
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 0;
SELECT pg_reload_conf();

-- View slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

## 📊 Development Monitoring

### Application Metrics

**Simple metrics collection:**

```typescript
// backend/src/utils/metrics.ts
class MetricsCollector {
  private metrics = new Map();

  increment(key: string) {
    this.metrics.set(key, (this.metrics.get(key) || 0) + 1);
  }

  gauge(key: string, value: number) {
    this.metrics.set(key, value);
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }
}

export const metrics = new MetricsCollector();
```

### Log Aggregation

**Structured logging:**

```typescript
// backend/src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});
```

## 🔄 Hot Reload Configuration

### Backend Hot Reload

**Nodemon Configuration (`backend/nodemon.json`):**

```json
{
  "watch": ["src"],
  "ext": "ts,js,json",
  "ignore": ["src/**/*.test.ts", "node_modules"],
  "exec": "ts-node src/index.ts",
  "env": {
    "NODE_ENV": "development"
  },
  "delay": "1000"
}
```

### Frontend Hot Reload

**Next.js automatically handles hot reload, but you can configure:**

```javascript
// next.config.js
module.exports = {
  // Fast refresh configuration
  experimental: {
    fastRefresh: true,
  },
  
  // Webpack HMR configuration
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  }
};
```

## 🎯 Performance Optimization for Development

### Development-Specific Optimizations

```typescript
// backend/src/config/development.ts
export const devConfig = {
  // Faster database queries in development
  database: {
    pool: {
      min: 2,
      max: 10
    }
  },
  
  // Relaxed rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 1000
  },
  
  // Enhanced logging
  logging: {
    level: 'debug',
    sql: true
  }
};
```

### Memory Usage Monitoring

```bash
# Monitor Node.js memory usage
node --inspect src/index.ts

# Chrome DevTools: chrome://inspect
# Heap snapshots and performance profiling
```

## 📋 Development Checklist

Before starting development, ensure:

- [ ] Node.js 18+ installed
- [ ] Docker and Docker Compose running
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Test data seeded
- [ ] All services healthy (frontend, backend, database, redis)
- [ ] Git hooks installed
- [ ] VS Code extensions installed
- [ ] API testing tool (Postman) configured
- [ ] Development scripts tested

## 🆘 Troubleshooting

### Common Development Issues

**Port conflicts:**

```bash
# Find what's using a port
lsof -i :3000
lsof -i :4000

# Kill process
kill -9 <PID>
```

**Database connection issues:**

```bash
# Check PostgreSQL status
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Test connection
psql postgresql://postgres:postgres@localhost:5432/rival_outranker_dev
```

**Node modules issues:**

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

**TypeScript compilation errors:**

```bash
# Clean TypeScript build
rm -rf dist .next

# Regenerate Prisma client
cd backend && npx prisma generate
```

### Getting Help

- **Development Issues**: [GitHub Issues](../../issues/new?template=development.md)
- **Setup Problems**: [GitHub Discussions](../../discussions)
- **Code Reviews**: Use pull request templates
- **Documentation**: Check other docs in `/docs` directory

---

*Your development environment is now ready! Start with the [Quick Start Guide](../getting-started/quick-start.md) to begin developing.*
