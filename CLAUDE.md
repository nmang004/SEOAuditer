# SEO Director - Project Memory & Guidelines

## Project Overview

**SEO Director** is a comprehensive, enterprise-grade SEO analysis web application that provides real-time website auditing, performance tracking, and actionable optimization recommendations. The platform combines modern web technologies with sophisticated crawling algorithms to deliver professional-grade SEO insights.

### Current Status
- **Production-Ready**: Sophisticated architecture with enterprise-level features
- **Architecture Score**: 4.6/5 (Exceptional engineering quality)
- **Deployment**: Ready for production with minor optimizations needed
- **Technical Debt**: Low level with well-structured codebase

### Target Users
- **SEO Professionals**: Agencies and consultants managing multiple client websites
- **Digital Marketers**: Teams needing comprehensive SEO analysis and reporting
- **Web Developers**: Technical teams implementing SEO improvements
- **Business Owners**: Companies monitoring their website's SEO performance

---

## Technical Architecture

### Frontend Stack (Next.js 14)
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Query + Zustand
- **Animations**: Framer Motion with performance optimizations
- **UI Components**: Custom component library with shadcn/ui base

### Backend Stack (Node.js/Express)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with RS256 + refresh tokens
- **Job Queues**: Redis + BullMQ for background processing
- **Real-time**: WebSocket gateway with room-based subscriptions
- **Caching**: Multi-layer (Memory + Redis) with tag-based invalidation

### SEO Crawler Engine
- **Browser Engine**: Puppeteer with stealth mode
- **Performance Analysis**: Lighthouse integration
- **Analysis Modules**: Technical SEO, Content Quality, On-Page SEO, UX metrics
- **Queue System**: Redis-based with horizontal scaling support
- **Real-time Updates**: WebSocket progress streaming

### Database Architecture
- **22 Models**: Comprehensive schema with 75+ strategic indexes
- **Performance Optimized**: Composite indexes for complex queries
- **Scalability**: UUID primary keys, proper foreign key relationships
- **Analytics**: Pre-calculated scores and dedicated trend tables

---

## Core Features Implemented

### ✅ SEO Analysis Engine
- **Multi-dimensional Scoring**: Technical, Content, On-Page, UX analysis
- **Real-time Crawling**: Puppeteer-based with progress tracking
- **Performance Metrics**: Core Web Vitals via Lighthouse
- **Issue Detection**: Comprehensive SEO issue identification
- **Recommendations**: Actionable optimization suggestions

### ✅ Dashboard & Analytics
- **Project Management**: Multi-project support with URL management
- **Trend Analysis**: Historical performance tracking
- **Real-time Updates**: WebSocket-powered live analysis updates
- **Responsive Design**: Mobile-optimized with PWA capabilities

### ✅ Authentication & Security
- **Multi-layer Auth**: JWT with RS256, refresh tokens, session management
- **Account Protection**: Rate limiting, account lockout, password policies
- **Input Validation**: Comprehensive Zod schemas with XSS/SQL injection protection
- **Security Headers**: CORS, CSP, and comprehensive security middleware

### ✅ Performance & Scalability
- **Advanced Caching**: Memory + Redis with intelligent fallback
- **Horizontal Scaling**: Redis adapters for multi-instance deployment
- **Queue Management**: Background job processing with retry logic
- **Database Optimization**: Query optimization and connection pooling

---

## Development Guidelines

### Code Quality Requirements
Run before committing:
```bash
npm run lint          # Frontend linting
npm run typecheck     # TypeScript validation
cd backend && npm run lint      # Backend linting  
cd backend && npm run typecheck # Backend TypeScript
```

### Architecture Patterns
- **Repository Pattern**: Database abstraction layer
- **Service Layer**: Business logic separation
- **Middleware Pipeline**: Request processing chain
- **Event-Driven**: WebSocket and queue-based async processing

### Component Structure
```
src/
├── app/                 # Next.js App Router
│   ├── (app)/          # Authenticated app routes
│   ├── (marketing)/    # Public marketing pages
│   └── api/            # API route handlers
├── components/         # Reusable UI components
│   ├── ui/            # Base UI primitives
│   ├── analysis/      # SEO analysis components
│   └── dashboard/     # Dashboard-specific components
├── lib/               # Utilities and configurations
└── hooks/             # Custom React hooks
```

---

## Current Technical Concerns

### 🔴 Critical (Address Immediately)
1. **Authentication Consolidation**: Multiple JWT implementations need consolidation
2. **Component Conflicts**: Naming conflicts in UI component exports
3. **Production Optimizations**: Webpack optimizations temporarily disabled
4. **Development Routes**: Test/debug routes present in production code

### 🟡 Medium Priority (Address Soon)
1. **API Response Standardization**: Inconsistent response formats across endpoints
2. **Error Boundary Implementation**: Missing React error boundaries
3. **Bundle Optimization**: Large initial bundle size needs optimization
4. **Database Query Patterns**: Some N+1 query risks in dashboard

### 🟢 Future Enhancements
1. **Microservice Architecture**: Consider service decomposition for scale
2. **Component Library**: Extract UI components to separate package
3. **Edge Computing**: CDN and edge optimization implementation
4. **Advanced Monitoring**: APM and real user monitoring integration

---

## Database Schema Overview

### Core Entities
- **Users**: Authentication, subscription tiers, security tracking
- **Projects**: Website projects with URL management and scan settings
- **SEOAnalysis**: Analysis results with multi-dimensional scoring
- **SEOIssues**: Detected issues with severity and recommendations
- **SEORecommendations**: Actionable optimization suggestions

### Performance Features
- **75+ Strategic Indexes**: Optimized for all query patterns
- **Trend Tables**: Dedicated analytics tables for performance
- **Composite Indexes**: Multi-column optimization for complex queries
- **JSON Fields**: Flexible structured data storage for analysis results

---

## API Architecture

### Authentication Endpoints
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/verify-email/[token]` - Email verification

### Project Management
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Project details
- `GET /api/projects/[id]/analyses` - Project analysis history

### SEO Analysis
- `POST /api/crawl/start` - Initiate website crawl
- `GET /api/crawl/status/[jobId]` - Check crawl progress
- `GET /api/crawl/results/[jobId]` - Retrieve analysis results

### Dashboard Data
- `GET /api/dashboard/stats` - User dashboard statistics
- `GET /api/dashboard/recent-projects` - Recent project activity
- `GET /api/dashboard/performance-trends` - Performance trend data

---

## Brand Guidelines

### Color System
```scss
// Primary Brand Colors
--indigo-500: #6366f1;    // Main brand
--indigo-600: #4f46e5;    // CTA buttons
--purple-500: #8b5cf6;    // Secondary brand
--pink-500: #ec4899;      // Accent color

// Semantic Colors
--success: #10b981;       // Good SEO scores
--warning: #f59e0b;       // Needs improvement
--danger: #ef4444;        // Critical issues
--info: #0ea5e9;          // Information

// Backgrounds
--bg-primary: #0F172A;    // Dark navy
--bg-secondary: #1A202C;  // Secondary sections
--bg-card: #2D3748;       // Card backgrounds
```

### Typography
- **Primary Font**: Inter (sans-serif)
- **Monospace Font**: JetBrains Mono (code elements)
- **Heading Scale**: Responsive typography with consistent spacing

### Component Patterns
```tsx
// Primary Button
className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"

// Card Container
className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm"

// Feature Icon
className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10"
```

---

## Performance Optimizations

### Caching Strategy
- **Memory Cache**: LRU cache for hot data (50MB limit)
- **Redis Cache**: Distributed cache with tag-based invalidation
- **Smart TTL**: Variable cache duration based on data type
- **Cache Warming**: Proactive caching for critical paths

### Bundle Optimization
- **Code Splitting**: Strategic chunk splitting by feature
- **Tree Shaking**: Automatic unused code elimination
- **Dynamic Imports**: Lazy loading for heavy components
- **Image Optimization**: WebP/AVIF with responsive sizing

### Database Performance
- **Connection Pooling**: Optimized PostgreSQL connections
- **Query Optimization**: Strategic indexes and query patterns
- **Pagination**: Efficient data loading patterns
- **Trend Tables**: Pre-calculated analytics for fast dashboards

---

## Deployment Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...
DATABASE_PROXY_URL=postgresql://...  # Railway pooled connection

# Authentication
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# External Services
REDIS_URL=redis://...
SENDGRID_API_KEY=...

# App Configuration
NEXT_PUBLIC_BACKEND_URL=...
BACKEND_URL=...
```

### Build Commands
```bash
# Frontend
npm run build         # Production build
npm run start         # Production server
npm run dev           # Development server

# Backend
cd backend
npm run build         # TypeScript compilation
npm run start         # Production server
npm run dev           # Development with hot reload
```

---

## Security Implementation

### Authentication Security
- **RS256 JWT**: Asymmetric key authentication
- **Refresh Tokens**: Secure token rotation
- **Session Management**: Concurrent session limits
- **Account Protection**: Lockout and rate limiting

### Input Validation
- **Zod Schemas**: Comprehensive request validation
- **XSS Protection**: Input sanitization and output encoding
- **SQL Injection**: Parameterized queries via Prisma
- **File Upload**: MIME type validation and secure storage

### Security Headers
- **CSP**: Content Security Policy enforcement
- **HSTS**: HTTP Strict Transport Security
- **CORS**: Cross-origin request configuration
- **Rate Limiting**: IP-based request throttling

---

## Commit Guidelines

**Clean commit messages without automated signatures:**
- ❌ Do not include "🤖 Generated with Claude Code"
- ❌ Do not include "Co-Authored-By: Claude"
- ✅ Use clear, descriptive commit messages
- ✅ Follow conventional commit format when possible

### Example Commit Messages
```
feat: implement real-time SEO analysis progress tracking
fix: resolve component naming conflicts in UI library
perf: optimize database queries with strategic indexes
security: enhance JWT token validation and refresh logic
```

---

This documentation serves as the authoritative reference for the SEO Director project architecture, development patterns, and implementation guidelines. All information reflects the verified current state of the codebase as of the comprehensive audit.