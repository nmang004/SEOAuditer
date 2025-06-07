# SEO Director - Technical Architecture

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