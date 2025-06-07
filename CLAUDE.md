# SEO Director - Project Guidelines

## Project Overview
**SEO Director** is an enterprise-grade SEO analysis web application providing real-time website auditing, performance tracking, and actionable optimization recommendations.

**Status**: Production-ready | Architecture Score: 4.6/5 | Low technical debt

## Tech Stack
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + React Query + Framer Motion
- **Backend**: Express.js + TypeScript + PostgreSQL + Prisma + Redis + BullMQ
- **SEO Engine**: Puppeteer + Lighthouse + WebSocket real-time updates
- **Database**: 22 models with 75+ strategic indexes

## Development Commands
```bash
# Frontend
npm run lint          # ESLint validation
npm run typecheck     # TypeScript validation
npm run build         # Production build

# Backend
cd backend
npm run lint          # Backend linting  
npm run typecheck     # Backend TypeScript validation
```

## Architecture Patterns
- **Repository Pattern**: Database abstraction layer
- **Service Layer**: Business logic separation
- **Middleware Pipeline**: Request processing chain
- **Event-Driven**: WebSocket and queue-based async processing

## File Structure
```
src/
├── app/                 # Next.js App Router
│   ├── (app)/          # Authenticated routes
│   ├── (marketing)/    # Public routes
│   └── api/            # API endpoints
├── components/         # UI components
│   ├── ui/            # Base primitives
│   ├── analysis/      # SEO analysis components
│   └── dashboard/     # Dashboard components
├── lib/               # Utilities
└── hooks/             # Custom React hooks
```

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

// Status Indicators
success: "bg-green-500/10 text-green-400"
warning: "bg-yellow-500/10 text-yellow-400" 
danger: "bg-red-500/10 text-red-400"
```

## Critical Issues (Address Immediately)
1. **Authentication Consolidation**: Multiple JWT implementations need unification
2. **Component Conflicts**: Naming conflicts in UI component exports
3. **Production Optimizations**: Webpack optimizations temporarily disabled
4. **Development Routes**: Test routes present in production code

## Commit Guidelines
- Use clear, descriptive commit messages
- Follow conventional commit format when possible
- Never include automated signatures in commit messages, never include "Committed with Claude" or "Created with Claude", things along that line
- Example: `feat: implement real-time SEO analysis progress tracking`

## Environment Variables
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=...
REDIS_URL=redis://...
NEXT_PUBLIC_BACKEND_URL=...
```

---

**Reference Files**: See `docs/` for detailed architecture, development guidelines, and deployment instructions.