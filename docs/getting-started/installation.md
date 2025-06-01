# Installation Guide

This comprehensive guide will help you set up Rival Outranker in different environments, from local development to production deployment.

## 📋 Prerequisites

### System Requirements

- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher  
- **Docker**: Version 20.0 or higher (recommended)
- **Docker Compose**: Version 2.0 or higher
- **Git**: For cloning the repository

### Hardware Requirements

**Minimum (Development)**:

- RAM: 4GB
- Storage: 2GB free space
- CPU: 2 cores

**Recommended (Production)**:

- RAM: 8GB+
- Storage: 20GB+ free space  
- CPU: 4+ cores

### Network Requirements

Ensure the following ports are available:

- `3000` - Frontend (Next.js)
- `4000` - Backend API (Express)
- `5432` - PostgreSQL Database
- `6379` - Redis Cache

## 🚀 Quick Installation (Docker - Recommended)

The fastest way to get Rival Outranker running is with Docker Compose:

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/rival-outranker.git
cd rival-outranker
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit configuration (optional for development)
nano .env
```

### 3. Start All Services

```bash
# Build and start all services
docker-compose up --build

# Or use the build script
./docker-build.sh
```

### 4. Verify Installation

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 5. Access the Application

- **Frontend**: <http://localhost:3000>
- **Backend API**: <http://localhost:4000>
- **API Documentation**: <http://localhost:4000/api-docs>
- **Health Check**: <http://localhost:4000/health>

### 6. Seed Sample Data

```bash
# Add sample projects and data
docker-compose exec backend npm run seed:enhanced
```

## 💻 Manual Installation

For development or when Docker isn't available:

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Database Setup

**Option A: Docker for Database Only**

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis
```

**Option B: Local Installation**

```bash
# Install PostgreSQL and Redis locally
# Ubuntu/Debian:
sudo apt-get install postgresql redis-server

# macOS with Homebrew:
brew install postgresql redis

# Start services
sudo systemctl start postgresql redis-server
# or on macOS:
brew services start postgresql redis
```

### 3. Environment Configuration

```bash
# Copy and edit environment file
cp .env.example .env
```

Configure your `.env` file:

```bash
# Database configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rival_outranker_dev"

# Redis configuration  
REDIS_URL="redis://localhost:6379"

# JWT secrets (generate secure random strings)
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-token-secret"

# Backend URL for frontend
NEXT_PUBLIC_BACKEND_URL="http://localhost:4000"
NEXT_PUBLIC_WS_URL="http://localhost:4000"
```

### 4. Database Migration

```bash
cd backend

# Run database migrations
npm run migrate:dev

# Optimize database performance
npm run db:optimize

# Seed with sample data
npm run seed:enhanced
```

### 5. Start Development Servers

Open two terminal windows:

**Terminal 1: Backend**

```bash
cd backend
npm run dev
```

**Terminal 2: Frontend**

```bash
npm run dev
```

### 6. Verify Setup

- Frontend: <http://localhost:3000>
- Backend: <http://localhost:4000>
- Test API: <http://localhost:4000/health>

## 🔧 Configuration Options

### Environment Variables

**Frontend Configuration (`.env.local`)**:

```bash
# API endpoints
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=http://localhost:4000

# Analytics (optional)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID

# Features flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_PWA=true
```

**Backend Configuration (`.env`)**:

```bash
# Server configuration
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rival_outranker_dev

# Redis cache
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# External APIs
LIGHTHOUSE_API_KEY=your-lighthouse-api-key
EMAIL_SERVICE_API_KEY=your-email-service-key

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE_ENABLED=true
```

### Database Configuration

**PostgreSQL Settings** (optional optimization):

```sql
-- Performance tuning for development
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';

-- Reload configuration
SELECT pg_reload_conf();
```

## 🧪 Verification & Testing

### Health Checks

```bash
# Backend health check
curl http://localhost:4000/health

# Database connectivity
curl http://localhost:4000/health/database

# Redis connectivity  
curl http://localhost:4000/health/redis
```

### Run Test Suites

```bash
# Frontend tests
npm test

# Backend tests
cd backend
npm test

# Integration tests
npm run test:integration

# Security tests
npm run test:security
```

### Performance Verification

```bash
# Database performance test
cd backend
npm run db:monitor

# API performance test
npm run test:performance

# Load test (optional)
npm run test:load
```

## 🐳 Docker Configuration

### Development Docker Setup

**docker-compose.yml** highlights:

```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_BACKEND_URL=http://backend:4000
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/rival_outranker
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: rival_outranker
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
```

### Custom Docker Configuration

**Frontend Dockerfile**:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

**Backend Dockerfile**:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 4000

# Start application
CMD ["npm", "start"]
```

## 🔍 Troubleshooting

### Common Issues

**Port Already in Use**:

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different ports
PORT=3001 npm run dev
```

**Database Connection Issues**:

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U postgres -d rival_outranker_dev

# Reset database
npm run db:reset
```

**Docker Issues**:

```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# View container logs
docker-compose logs backend
```

**Node.js Version Issues**:

```bash
# Install Node Version Manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node 18
nvm install 18
nvm use 18
```

### Log Locations

- **Frontend logs**: Browser console and terminal
- **Backend logs**: `backend/logs/combined.log`
- **Database logs**: Docker logs or system logs
- **Redis logs**: Docker logs or system logs

### Getting Help

- **Documentation**: [docs/](../README.md)
- **Issues**: [GitHub Issues](../../issues)
- **Discussions**: [GitHub Discussions](../../discussions)
- **Security**: [Security Policy](../../SECURITY.md)

## ✅ Next Steps

After successful installation:

1. **[Quick Start Guide](quick-start.md)** - Get familiar with the application
2. **[User Guide](../user-guide/dashboard.md)** - Learn to use the features
3. **[Development Guide](../development/setup.md)** - Start developing
4. **[API Documentation](../api/overview.md)** - Explore the API

---

*Installation complete! 🎉 You're ready to start using Rival Outranker.*
