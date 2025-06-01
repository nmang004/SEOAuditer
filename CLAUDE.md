# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rival Outranker is an enterprise-grade SEO analysis platform built with Next.js 15 (frontend) and Express/Node.js (backend). It provides comprehensive website analysis, competitive insights, and actionable SEO recommendations.

## Essential Commands

### Frontend Development (root directory)
```bash
npm run dev              # Start Next.js dev server on port 3000
npm run build            # Build production bundle
npm run start            # Start production server
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
```

### Backend Development (backend/ directory)
```bash
npm run dev              # Start Express server with hot reload on port 4000
npm run build            # Compile TypeScript to dist/
npm run migrate:dev      # Run Prisma migrations
npm run seed             # Seed database with test data
npm run test             # Run Jest tests
```

### Full Stack Development
```bash
# Start everything with Docker
docker-compose up --build

# Or start services individually:
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend  
npm run dev
```

### Database Operations
```bash
cd backend
npm run migrate:dev      # Create/apply migrations
npm run migrate:deploy   # Production migrations
npm run db:push         # Push schema changes without migration
npm run studio          # Open Prisma Studio GUI
npm run seed:enhanced   # Seed with comprehensive test data
```

## Architecture Overview

### URL Route Structure
The app uses Next.js route groups to organize pages:
- `(auth)` - Authentication pages (login, register, forgot-password)
- `(app)` - Protected application pages (dashboard, projects, analyses)
- `(marketing)` - Public pages

### Authentication Flow
- JWT-based authentication with access/refresh token pattern
- Access tokens stored in memory/localStorage
- Refresh tokens in httpOnly cookies
- Protected routes use `auth.middleware.ts`
- Auth state managed via `useAuth` hook

### Data Flow Architecture
1. **Frontend**: React Query manages server state with intelligent caching
2. **API Layer**: Express controllers handle request/response
3. **Service Layer**: Business logic in service classes
4. **Data Layer**: Prisma ORM with PostgreSQL
5. **Real-time**: Socket.IO for live updates during analysis

### SEO Analysis Engine
The crawler uses a modular plugin architecture:
```
backend/src/seo-crawler/
├── engine/
│   ├── CrawlerEngine.ts         # Main orchestrator
│   ├── EnhancedPageAnalyzer.ts  # Analysis pipeline
│   └── AnalysisModules/         # Plugin analyzers
├── queue/                       # Job processing
└── storage/                     # Result persistence
```

Each analysis module (TechnicalSEO, ContentQuality, etc.) implements specific SEO checks and returns standardized results.

### State Management Patterns
- **Global State**: React Context for auth, theme, performance settings
- **Server State**: React Query with query keys like `['dashboard', 'stats']`
- **Local State**: Component-level useState/useReducer
- **Real-time State**: Socket.IO events update React Query cache

### Database Schema Key Relationships
```
User ──┬── Project ──┬── SEOAnalysis ──┬── SEOIssue
       │             │                 └── Recommendation
       │             └── ProjectTrend
       └── Notification
```

### Caching Strategy
1. **React Query**: 5-minute stale time, 10-minute cache time
2. **Redis**: Analysis results cached for 24 hours
3. **CDN**: Static assets with aggressive caching
4. **Database**: Query result caching with Prisma

## Key Development Patterns

### API Endpoint Structure
```typescript
// Controllers follow this pattern:
export const getProjects = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const projects = await prisma.project.findMany({ where: { userId } });
    res.json({ success: true, data: projects });
  } catch (error) {
    handleError(error, res);
  }
};
```

### Component Structure
Components use atomic design with clear separation:
- `ui/` - Base components (Button, Card, Input)
- `dashboard/` - Feature-specific components
- `analysis/` - SEO analysis components

### Error Handling
- Custom error classes (NotFoundError, ValidationError)
- Centralized error middleware
- User-friendly error messages in UI

### Performance Optimizations
- Code splitting with dynamic imports
- Image optimization with Next.js Image
- Database queries optimized with proper indexes
- Background job processing for heavy operations

## Environment Configuration

### Required Environment Variables
**Frontend (.env.local)**:
- `NEXT_PUBLIC_BACKEND_URL` - Backend API URL
- `NEXT_PUBLIC_WS_URL` - WebSocket server URL

**Backend (.env)**:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT signing
- `JWT_REFRESH_SECRET` - Refresh token secret

## Testing Approach

### Backend Testing
```bash
cd backend
npm test                    # Run all tests
npm test auth.test.ts       # Run specific test file
npm test -- --watch         # Watch mode
```

### Frontend Testing
Currently uses linting and type checking:
```bash
npm run lint
npm run build  # Type checking happens during build
```

## Common Development Tasks

### Adding a New API Endpoint
1. Create controller method in `backend/src/controllers/`
2. Add route in `backend/src/routes/`
3. Add validation schema if needed
4. Update TypeScript types
5. Add to API documentation

### Adding a New Analysis Module
1. Create new analyzer in `backend/src/seo-crawler/engine/AnalysisModules/`
2. Implement the analyzer interface
3. Register in `EnhancedPageAnalyzer.ts`
4. Update result types

### Working with Database
```bash
# Make schema changes in schema.prisma, then:
cd backend
npm run migrate:dev -- --name describe_your_change
npm run generate  # Regenerate Prisma Client
```

## Debugging Tips

### Backend Debugging
- Logs are in `backend/logs/` (combined.log, error.log)
- Use `DEBUG=*` environment variable for verbose logging
- Check `backend.log` for server output

### Frontend Debugging
- React Query DevTools available in development
- Check browser console for API errors
- Network tab shows all API calls with full details

### Common Issues
1. **CORS errors**: Check `NEXT_PUBLIC_BACKEND_URL` matches backend port
2. **Database connection**: Ensure PostgreSQL is running and `DATABASE_URL` is correct
3. **TypeScript errors**: Run `npm run build` in both directories to check
4. **Auth issues**: Clear localStorage and cookies, check JWT expiry