# Docker Setup Guide for Rival Outranker

This guide will help you set up and run the Rival Outranker application using Docker.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)
- At least 4GB of available RAM
- Ports 3000, 5432, 6379, and 8080 available

## Quick Start

1. **Build and run all services:**
   ```bash
   ./docker-build.sh
   ```

   Or manually:
   ```bash
   docker-compose up --build -d
   ```

2. **Check service status:**
   ```bash
   docker-compose ps
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - API Documentation: http://localhost:8080/api-docs

## Services

### Frontend (Next.js)
- **Port:** 3000
- **Health Check:** http://localhost:3000/api/health
- **Built with:** Node.js 18, Next.js

### Backend (Express + TypeScript)
- **Port:** 8080
- **Health Check:** http://localhost:8080/health
- **Built with:** Node.js 18, Express, TypeScript, Prisma

### PostgreSQL Database
- **Port:** 5432
- **Database:** rival_outranker
- **Username:** postgres
- **Password:** postgres

### Redis Cache
- **Port:** 6379
- **Used for:** Caching and rate limiting

## Environment Variables

The following environment variables are configured in `docker-compose.yml`:

### Frontend
- `NODE_ENV=production`
- `NEXT_PUBLIC_API_URL=http://backend:8080`

### Backend
- `NODE_ENV=production`
- `PORT=8080`
- `DATABASE_URL=postgresql://postgres:postgres@postgres:5432/rival_outranker?schema=public`
- `REDIS_URL=redis://redis:6379`
- `JWT_SECRET=your_super_long_jwt_secret_key_1234567890_change_this_in_production`
- Plus additional configuration variables

## Troubleshooting

### 1. Container Health Checks Failing

Check logs:
```bash
docker-compose logs [service-name]
```

### 2. Port Already in Use

Stop all containers and try again:
```bash
docker-compose down
docker-compose up --build -d
```

### 3. Database Connection Issues

Ensure PostgreSQL is healthy:
```bash
docker-compose exec postgres pg_isready -U postgres
```

### 4. Redis Connection Issues

Check Redis status:
```bash
docker-compose exec redis redis-cli ping
```

### 5. Build Failures

Clean and rebuild:
```bash
docker-compose down
docker system prune -f
docker-compose up --build
```

### 6. Frontend/Backend Communication Issues

Verify network connectivity:
```bash
docker-compose exec frontend curl http://backend:8080/health
```

## Development Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Execute Commands in Containers
```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh

# Database shell
docker-compose exec postgres psql -U postgres -d rival_outranker
```

### Database Operations
```bash
# Run Prisma migrations
docker-compose exec backend npx prisma migrate deploy

# Generate Prisma client
docker-compose exec backend npx prisma generate

# Access Prisma Studio (if needed)
docker-compose exec backend npx prisma studio
```

## Data Persistence

- **PostgreSQL data** is persisted in the `pgdata` Docker volume
- **Redis data** is not persisted (cache only)

## Security Notes

⚠️ **Important for Production:**
1. Change the JWT_SECRET in production
2. Use strong database passwords
3. Configure proper CORS origins
4. Set up SSL/TLS certificates
5. Use environment files instead of hardcoded values

## Clean Up

To remove all containers, networks, and volumes:
```bash
docker-compose down -v
docker system prune -a
```

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │
│   (Next.js)     │◄──►│   (Express)     │
│   Port: 3000    │    │   Port: 8080    │
└─────────────────┘    └─────────────────┘
                              │
                              ▼
┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     Redis       │
│   Port: 5432    │    │   Port: 6379    │
└─────────────────┘    └─────────────────┘
```

All services communicate through a Docker network called `rival-network`. 