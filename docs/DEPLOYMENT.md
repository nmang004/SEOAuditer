# SEO Director - Deployment Configuration

## Environment Variables

### Required Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database
DATABASE_PROXY_URL=postgresql://...  # Railway pooled connection

# Authentication
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# External Services
REDIS_URL=redis://localhost:6379
SENDGRID_API_KEY=your-sendgrid-api-key

# App Configuration
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url
BACKEND_URL=https://your-backend-url
NODE_ENV=production
```

### Optional Environment Variables
```bash
# Feature Flags
FEATURE_CONSOLIDATED_AUTH=true
FEATURE_NEW_COMPONENTS=true
FEATURE_PROD_OPTIMIZATIONS=true
FEATURE_BLOCK_DEV_ROUTES=true

# Development
ENABLE_DEMO_ROUTES=false
ANALYZE=true  # For bundle analysis
```

## Build Commands

### Frontend Build
```bash
npm run build         # Production build
npm run start         # Production server
npm run dev           # Development server
npm run analyze       # Bundle analysis
```

### Backend Build
```bash
cd backend
npm run build         # TypeScript compilation
npm run start         # Production server
npm run dev           # Development with hot reload
npm run migrate       # Database migrations
```

## Production Optimizations

### Next.js Configuration
- Remove console logs in production
- Enable tree shaking and code splitting
- Optimize images with WebP/AVIF
- Configure proper caching headers
- Enable compression

### Database Optimizations
- Connection pooling enabled
- Strategic indexes in place
- Query optimization patterns
- Trend tables for analytics

### Caching Strategy
- Memory cache for hot data
- Redis cache for distributed scenarios
- Tag-based cache invalidation
- Smart TTL configuration

## Security Checklist

### Production Security
- [ ] HTTPS enabled and enforced
- [ ] Security headers configured
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Input validation implemented
- [ ] Error messages sanitized

### Monitoring & Logging
- [ ] Application performance monitoring
- [ ] Error tracking configured
- [ ] Database performance monitoring
- [ ] Cache hit rate monitoring
- [ ] Security audit logging
- [ ] Real user monitoring

## Deployment Checklist

### Pre-Deployment
- [ ] Run full test suite
- [ ] Verify environment variables
- [ ] Check database migrations
- [ ] Test critical user paths
- [ ] Validate performance metrics
- [ ] Review security configurations

### Post-Deployment
- [ ] Verify application health
- [ ] Check database connectivity
- [ ] Test authentication flows
- [ ] Validate cache performance
- [ ] Monitor error rates
- [ ] Confirm all features working