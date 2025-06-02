# Authentication Setup Instructions

## Running the Application

The application consists of a Next.js frontend and a Node.js/Express backend. Both servers need to be running for authentication to work properly.

### Prerequisites

1. Ensure you have Node.js installed (v18 or higher)
2. Ensure PostgreSQL is running (for the database)
3. Ensure Redis is running (optional, but recommended)

### Step 1: Start the Backend Server

Open a terminal and run:

```bash
cd backend
npm install  # Only needed first time
npm run dev
```

The backend server should start on port 4000. You should see:
- `✅ Server started successfully on port 4000`

### Step 2: Start the Frontend Server

Open a new terminal and run:

```bash
npm install  # Only needed first time
npm run dev
```

The frontend server should start on port 3000. Open http://localhost:3000 in your browser.

### Step 3: Test Authentication

1. Navigate to http://localhost:3000/auth/register to create a new account
2. Navigate to http://localhost:3000/auth/login to log in

## Troubleshooting

### "Backend server is not running" Error

If you see this error:
1. Check that the backend server is running on port 4000
2. Check the backend terminal for any error messages
3. Ensure your `.env` file in the backend directory has the correct database URL

### Database Connection Issues

1. Ensure PostgreSQL is running
2. Check the `DATABASE_URL` in `backend/.env`
3. Run database migrations:
   ```bash
   cd backend
   npm run migrate:dev
   ```

### CORS Issues

The backend is configured to accept requests from `http://localhost:3000`. If you're running the frontend on a different port, update the `ALLOWED_ORIGINS` in `backend/.env`.

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rival_outranker?schema=public
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here
NODE_ENV=development
PORT=4000
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000/api
```

## Security Notes

- The authentication system uses JWT tokens with RS256 signing
- Tokens are stored in httpOnly cookies for security
- Password hashing uses bcrypt with 12 rounds
- Rate limiting is enabled on auth endpoints
- Email verification is required (can be bypassed in development mode)