# Localhost Setup Instructions

## Prerequisites
- Node.js 18+ installed
- PostgreSQL (for backend database)
- Redis (for caching - optional)

## Frontend Setup (Next.js)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

   The frontend will be available at: http://localhost:3000

## Backend Setup (Optional)

If you need the backend API running:

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install backend dependencies:**
   ```bash
   npm install
   ```

3. **Setup backend environment variables:**
   Create a `.env` file in the backend directory:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rival_outranker?schema=public
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRES_IN=1d
   PORT=4000
   ```

4. **Setup the database:**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Run the backend server:**
   ```bash
   npm run dev
   ```

   The backend API will be available at: http://localhost:4000

## Quick Start (Frontend Only)

For quick frontend development without backend:

```bash
# From the root directory
npm install
npm run dev
```

Open http://localhost:3000 to view the application.

## Available Routes

- `/` - Homepage (newly updated with dark theme)
- `/features` - Features page
- `/how-it-works` - How it works page
- `/pricing` - Pricing page
- `/dashboard` - Dashboard (requires authentication)
- `/login` - Login page
- `/register` - Registration page

## Troubleshooting

1. **Port already in use:**
   - Kill the process using port 3000: `lsof -ti:3000 | xargs kill -9`
   - Or change the port: `PORT=3001 npm run dev`

2. **Module not found errors:**
   - Delete node_modules and package-lock.json
   - Run `npm install` again

3. **Database connection issues:**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in backend/.env
   - Run migrations: `cd backend && npx prisma migrate dev`

## Development Tips

- Use `npm run lint` to check for linting errors
- Use `npm run build` to test production build locally
- The app uses Tailwind CSS for styling
- Framer Motion for animations
- TypeScript for type safety