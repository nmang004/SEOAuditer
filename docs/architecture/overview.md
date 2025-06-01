# System Architecture Overview

This document provides a comprehensive overview of Rival Outranker's architecture, design decisions, and technical implementation.

## 🏗️ High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Frontend     │    │     Backend     │    │    Database     │
│   (Next.js)     │◄──►│   (Express)     │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│ • React 18      │    │ • TypeScript    │    │ • Prisma ORM    │
│ • TailwindCSS   │    │ • WebSocket.IO  │    │ • Redis Cache   │
│ • React Query   │    │ • JWT Auth      │    │ • Migrations    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │  SEO Crawler    │              │
         └──────────────│     Engine      │──────────────┘
                        │                 │
                        │ • Lighthouse    │
                        │ • Page Analysis │
                        │ • Queue System  │
                        └─────────────────┘
```

## 🔧 Technology Stack

### Frontend Layer

- **Framework**: Next.js 15 with App Router
- **UI Library**: React 18 with TypeScript
- **Styling**: TailwindCSS + Shadcn/ui components
- **State Management**: React Query (TanStack Query)
- **Real-time**: Socket.IO client
- **PWA**: Service Worker for offline support

### Backend Layer

- **Runtime**: Node.js 18+ with Express.js
- **Language**: TypeScript with strict configuration
- **Authentication**: JWT with refresh token pattern
- **WebSocket**: Socket.IO for real-time updates
- **Validation**: Zod schemas with middleware
- **Testing**: Jest with Supertest

### Data Layer

- **Primary Database**: PostgreSQL 15+
- **ORM**: Prisma with type-safe queries
- **Cache**: Redis for session and analysis caching
- **Migrations**: Prisma migration system
- **Backup**: Automated backup strategies

### Analysis Engine

- **Crawler**: Custom TypeScript crawler
- **Performance**: Google Lighthouse integration
- **Queue**: Redis-based job queue
- **Analysis Modules**: Pluggable analysis system

## 🔀 Request Flow Architecture

### Frontend Request Flow

```
User Interaction → React Component → React Query → API Call → Backend
                ↑                                               ↓
            UI Update ← React Query Cache ← API Response ← Controller
```

### Backend Request Flow

```
HTTP Request → Middleware Stack → Controller → Service Layer → Database
                                     ↓              ↓
                               Error Handler → Response → Frontend
```

### WebSocket Flow

```
Client Event → Socket.IO Client → Backend Gateway → Room Broadcast
                                        ↓
                              Database Update → Real-time Event
```

## 📁 Directory Structure

### Frontend Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (app)/             # Protected app routes
│   ├── (marketing)/       # Public marketing pages
│   ├── api/               # API route handlers
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/                # Base UI components
│   ├── forms/             # Form components
│   ├── layout/            # Layout components
│   ├── dashboard/         # Dashboard-specific components
│   └── analysis/          # Analysis-related components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and configs
├── types/                 # TypeScript type definitions
└── contexts/              # React context providers
```

### Backend Structure

```
src/
├── controllers/           # HTTP request controllers
├── middleware/            # Express middleware
├── routes/               # API route definitions
├── services/             # Business logic services
├── schemas/              # Zod validation schemas
├── types/                # TypeScript interfaces
├── utils/                # Utility functions
├── seo-crawler/          # SEO analysis engine
│   ├── engine/           # Core crawler engine
│   ├── queue/            # Job queue system
│   ├── storage/          # Data storage layer
│   └── types/            # Crawler type definitions
└── tests/                # Test suites
```

## 🔐 Authentication Architecture

### JWT Token Flow

```
1. User Login → Credentials Validation
2. Generate Access Token (1h) + Refresh Token (7d)
3. Store Refresh Token in httpOnly Cookie
4. Return Access Token to Client
5. Client Stores Access Token in Memory/LocalStorage
6. Include Access Token in API Headers
7. Token Refresh on Expiry
```

### Token Implementation

```typescript
// Token structure
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Middleware implementation
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user as JWTPayload;
    next();
  });
};
```

## 📊 Database Architecture

### Schema Design

```sql
-- Core entities and relationships
Users (1:N) Projects (1:N) SEOAnalyses (1:N) SEOIssues
Users (1:N) Notifications
Projects (1:N) ProjectTrends
SEOAnalyses (1:N) Recommendations
```

### Key Design Decisions

- **UUID Primary Keys**: For better distribution and security
- **Soft Deletes**: Preserve data integrity with deletedAt timestamps
- **Audit Trails**: Track creation and modification timestamps
- **Indexing Strategy**: Optimized for common query patterns
- **Constraints**: Foreign key constraints with cascade options

### Performance Optimizations

```sql
-- Strategic indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_analyses_project_id ON seo_analyses(project_id);
CREATE INDEX idx_issues_analysis_id ON seo_issues(analysis_id);
CREATE INDEX idx_users_email ON users(email);

-- Composite indexes for complex queries
CREATE INDEX idx_analyses_project_created ON seo_analyses(project_id, created_at);
CREATE INDEX idx_issues_analysis_severity ON seo_issues(analysis_id, severity);
```

## 🚀 SEO Analysis Engine Architecture

### Analysis Pipeline

```
URL Input → Crawler Engine → Analysis Modules → Result Processing → Storage
    ↓              ↓               ↓                ↓              ↓
Queue Job → Page Fetch → Module Execution → Score Calculation → Database
```

### Modular Analysis System

```typescript
// Base analyzer interface
interface AnalysisModule {
  name: string;
  analyze(page: PageData): Promise<AnalysisResult>;
  getScore(results: AnalysisResult[]): number;
}

// Available modules
const analysisModules: AnalysisModule[] = [
  new TechnicalSEOAnalyzer(),
  new ContentQualityAnalyzer(),
  new OnPageSEOAnalyzer(),
  new PerformanceAnalyzer(),
  new StructuredDataAnalyzer()
];
```

### Analysis Modules

1. **Technical SEO Module**
   - Meta tags validation
   - Header structure analysis
   - Internal linking checks
   - XML sitemap validation
   - Robots.txt analysis

2. **Content Quality Module**
   - Content length analysis
   - Keyword density calculation
   - Readability scoring
   - Duplicate content detection
   - Image optimization checks

3. **Performance Module**
   - Core Web Vitals measurement
   - Page load speed analysis
   - Resource optimization
   - Lighthouse integration
   - Mobile performance

4. **On-Page SEO Module**
   - Title tag optimization
   - Meta description analysis
   - URL structure evaluation
   - Schema markup detection
   - Social media tags

## 🔄 Real-Time Architecture

### WebSocket Implementation

```typescript
// Socket.IO namespace configuration
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
});

// Room-based updates
io.on('connection', (socket) => {
  // Join user-specific room
  socket.join(`user:${socket.userId}`);
  
  // Join project-specific rooms
  socket.on('join:project', (projectId) => {
    socket.join(`project:${projectId}`);
  });
  
  // Broadcast analysis updates
  socket.to(`project:${projectId}`).emit('analysis:progress', data);
});
```

### Event Types

```typescript
// Real-time event definitions
interface AnalysisEvents {
  'analysis:started': { projectId: string; analysisId: string };
  'analysis:progress': { analysisId: string; progress: number; stage: string };
  'analysis:completed': { analysisId: string; score: number; issueCount: number };
  'analysis:failed': { analysisId: string; error: string };
  'issue:new': { projectId: string; issue: SEOIssue };
  'issue:resolved': { projectId: string; issueId: string };
  'notification:new': { notification: Notification };
}
```

## 🔒 Security Architecture

### Defense in Depth

1. **Input Validation**: Zod schemas at API boundaries
2. **Authentication**: JWT with secure token handling
3. **Authorization**: Role-based access control
4. **Rate Limiting**: Request throttling by IP/user
5. **CORS**: Strict cross-origin policy
6. **Security Headers**: Comprehensive header configuration
7. **SQL Injection Prevention**: Prisma ORM parameterized queries
8. **XSS Prevention**: Content sanitization and CSP headers

### Security Middleware Stack

```typescript
// Security middleware configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true }
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

## 📈 Performance Architecture

### Caching Strategy

```
Browser Cache → CDN → Application Cache → Database Cache
     (1h)        (24h)        (5min)          (Query)
```

### React Query Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Redis Caching

```typescript
// Analysis result caching
const cacheKey = `analysis:${analysisId}`;
const cachedResult = await redis.get(cacheKey);

if (cachedResult) {
  return JSON.parse(cachedResult);
}

const result = await performAnalysis(analysisId);
await redis.setex(cacheKey, 3600, JSON.stringify(result)); // 1 hour cache
```

## 🔄 Data Flow Patterns

### Frontend Data Flow

```typescript
// Typical data flow pattern
const ProjectDashboard = () => {
  // 1. Fetch data with React Query
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectApi.getProjects(),
  });

  // 2. Real-time updates via WebSocket
  useEffect(() => {
    socket.on('project:updated', (updatedProject) => {
      queryClient.setQueryData(['projects'], (old) => 
        old?.map(p => p.id === updatedProject.id ? updatedProject : p)
      );
    });
  }, []);

  // 3. Optimistic updates
  const updateProject = useMutation({
    mutationFn: projectApi.updateProject,
    onMutate: async (newData) => {
      await queryClient.cancelQueries(['projects']);
      const previousProjects = queryClient.getQueryData(['projects']);
      queryClient.setQueryData(['projects'], old => /* optimistic update */);
      return { previousProjects };
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData(['projects'], context.previousProjects);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['projects']);
    },
  });
};
```

### Backend Service Pattern

```typescript
// Service layer pattern
class ProjectService {
  async createProject(userId: string, data: CreateProjectDto) {
    // 1. Validate input
    const validatedData = projectSchema.parse(data);
    
    // 2. Business logic
    const project = await this.projectRepository.create({
      ...validatedData,
      userId,
      status: 'active'
    });
    
    // 3. Side effects
    await this.notificationService.notifyProjectCreated(project);
    await this.cacheService.invalidateUserProjects(userId);
    
    // 4. Real-time updates
    this.socketService.emitToUser(userId, 'project:created', project);
    
    return project;
  }
}
```

## 🧪 Testing Architecture

### Testing Strategy

```
Unit Tests → Integration Tests → E2E Tests → Performance Tests
   (Jest)      (Supertest)       (Cypress)     (Artillery)
```

### Test Structure

```typescript
// Example integration test
describe('Project API', () => {
  beforeEach(async () => {
    await setupTestDatabase();
    await seedTestData();
  });

  describe('POST /api/projects', () => {
    it('should create project with valid data', async () => {
      const projectData = {
        name: 'Test Project',
        url: 'https://example.com'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${validToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.data).toMatchObject(projectData);
    });
  });
});
```

## 🚀 Deployment Architecture

### Container Strategy

```dockerfile
# Multi-stage build for optimization
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Configuration

```
Development → Staging → Production
     ↓           ↓          ↓
  Local DB → Staging DB → Production DB
  File Logs → Cloud Logs → Cloud Logs
  Basic Auth → Full Auth → Enterprise Auth
```

## 🔍 Monitoring & Observability

### Health Check System

```typescript
// Comprehensive health checks
const healthChecks = {
  database: () => prisma.$queryRaw`SELECT 1`,
  redis: () => redis.ping(),
  external_apis: () => checkLighthouseAPI(),
  queue: () => checkQueueHealth()
};

app.get('/health', async (req, res) => {
  const results = await Promise.allSettled(
    Object.entries(healthChecks).map(async ([name, check]) => [name, await check()])
  );
  
  const health = results.reduce((acc, [name, result]) => {
    acc[name] = result.status === 'fulfilled' ? 'healthy' : 'unhealthy';
    return acc;
  }, {});
  
  const isHealthy = Object.values(health).every(status => status === 'healthy');
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    services: health,
    timestamp: new Date().toISOString()
  });
});
```

## 📖 Architecture Decisions

### Key Design Decisions

1. **Monorepo Structure**: Single repository for easier development
2. **TypeScript Everywhere**: End-to-end type safety
3. **Prisma ORM**: Type-safe database access
4. **React Query**: Intelligent data fetching and caching
5. **Socket.IO**: Real-time communication
6. **JWT Authentication**: Stateless authentication
7. **Modular Analysis**: Pluggable analysis modules
8. **Docker First**: Containerized development and deployment

### Trade-offs Considered

- **Performance vs. Maintainability**: Chose maintainable patterns
- **Type Safety vs. Development Speed**: Prioritized type safety
- **Real-time vs. Simplicity**: Added complexity for better UX
- **Caching vs. Data Freshness**: Balanced with intelligent invalidation

---

*This architecture supports scalability, maintainability, and developer productivity while ensuring enterprise-grade security and performance.*
