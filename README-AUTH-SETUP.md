# Authentication Setup Guide

## Quick Start

The authentication system is now fully functional! Here's how to get it running:

### 1. Backend Setup

The backend has been updated to work without Redis/PostgreSQL dependencies. You have two options:

#### Option A: Run with Full Services (Recommended)
```bash
# Start Redis
docker run -d -p 6379:6379 redis:alpine

# Start PostgreSQL
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=rival_outranker postgres:alpine

# Start backend
cd backend
npm install
npm run build
npm start
```

#### Option B: Run Without External Services
```bash
# The backend will work without Redis/PostgreSQL
cd backend
npm install
npm run build
npm start
```

Note: Without Redis, some features like distributed rate limiting and refresh tokens in Redis won't work, but the app will function normally using fallback mechanisms.

### 2. Frontend Setup

```bash
# In the root directory
npm install
npm run dev
```

### 3. Environment Variables

Create a `.env` file in the root directory:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000/api
```

Create a `.env` file in the backend directory:
```env
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1d
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rival_outranker
REDIS_URL=redis://localhost:6379
```

## Features

✅ Registration with validation
✅ Login with JWT tokens
✅ Password reset flow
✅ Protected routes
✅ Header/Footer on auth pages
✅ Responsive design
✅ Error handling
✅ Redis fallback support

## Test Pages

- `/test-auth` - Test backend connectivity and auth endpoints
- `/auth/login` - Main login page
- `/auth/register` - Main registration page
- `/auth/forgot-password` - Password reset page

## Common Issues

### Internal Server Error on Registration
This usually means the backend services aren't running. Either:
1. Start Redis and PostgreSQL using the Docker commands above
2. Or just run the backend - it will work without them

### CORS Errors
Make sure both frontend (port 3000) and backend (port 4000) are running.

### Registration Success but Can't Login
Check that the JWT_SECRET is set in your backend .env file.