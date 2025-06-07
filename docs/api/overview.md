# API Overview

Rival Outranker provides a comprehensive RESTful API for managing SEO projects, analyses, and user data. This document covers authentication, general usage patterns, and API conventions.

## 🔗 Base URL

**Development**: `http://localhost:4000/api`  
**Production**: `https://your-domain.com/api`

## 🔐 Authentication

The API uses JWT (JSON Web Token) authentication with a refresh token pattern for enhanced security.

### Authentication Flow

```mermaid
sequenceDiagram
    Client->>API: POST /auth/register or /auth/login
    API->>Client: Access Token (1h) + Refresh Token (7d)
    Client->>API: API Request with Bearer Token
    API->>Client: API Response
    Note over Client,API: Token expires after 1 hour
    Client->>API: POST /auth/refresh
    API->>Client: New Access Token
```

### Token Structure

```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;  // Issued at
  exp: number;  // Expires at
}
```

### Authorization Header

Include the access token in all authenticated requests:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📝 API Conventions

### Request Format

- **Content-Type**: `application/json`
- **HTTP Methods**: Standard REST methods (GET, POST, PUT, DELETE)
- **URL Structure**: `/api/{resource}/{id?}/{action?}`

### Response Format

All API responses follow a consistent structure:

```typescript
// Success response
interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Error response
interface ErrorResponse {
  success: false;
  error: {
    code: number;
    message: string;
    details?: any;
    field?: string;
  };
  timestamp: string;
  requestId: string;
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|--------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST requests |
| 204 | No Content | Successful DELETE requests |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

## 🚀 Quick Start Examples

### 1. Register a New User

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "John Doe"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "subscriptionTier": "free",
    "emailVerified": false,
    "createdAt": "2025-01-06T12:00:00Z"
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Create a Project

```bash
curl -X POST http://localhost:4000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "My Website",
    "url": "https://example.com"
  }'
```

### 4. Start SEO Analysis

```bash
curl -X POST http://localhost:4000/api/analyses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "projectId": "project-uuid"
  }'
```

## 🔄 Real-Time WebSocket API

For real-time updates, connect to the WebSocket server:

### Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Room Management

```javascript
// Join a project room for project-specific updates
socket.emit('join:project', 'project-uuid');

// Join user room for user-specific notifications
socket.emit('join:user', 'user-uuid');

// Leave a room
socket.emit('leave:project', 'project-uuid');
```

### Real-Time Events

| Event | Description | Payload |
|-------|-------------|---------|
| `analysis:started` | Analysis has begun | `{ projectId, analysisId }` |
| `analysis:progress` | Analysis progress update | `{ analysisId, progress, stage }` |
| `analysis:completed` | Analysis finished successfully | `{ analysisId, score, issueCount }` |
| `analysis:failed` | Analysis failed | `{ analysisId, error }` |
| `issue:new` | New SEO issue detected | `{ projectId, issue }` |
| `issue:resolved` | SEO issue marked as resolved | `{ projectId, issueId }` |
| `notification:new` | New user notification | `{ notification }` |

### Event Listening

```javascript
// Listen for analysis progress
socket.on('analysis:progress', (data) => {
  console.log(`Analysis ${data.analysisId} is ${data.progress}% complete`);
  console.log(`Current stage: ${data.stage}`);
});

// Listen for completed analysis
socket.on('analysis:completed', (data) => {
  console.log(`Analysis completed with score: ${data.score}`);
  console.log(`Issues found: ${data.issueCount}`);
});

// Listen for new notifications
socket.on('notification:new', (data) => {
  showNotification(data.notification);
});
```

## 📊 Pagination

For endpoints that return lists, use pagination parameters:

```bash
# Get projects with pagination
curl "http://localhost:4000/api/projects?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response with meta information:**

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## 🔍 Filtering and Sorting

Many endpoints support filtering and sorting:

```bash
# Filter projects by status
curl "http://localhost:4000/api/projects?status=active" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Sort by creation date (descending)
curl "http://localhost:4000/api/projects?sort=-createdAt" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Combine filters and sorting
curl "http://localhost:4000/api/projects?status=active&sort=-lastScanDate&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Supported Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `page` | Page number (1-based) | `page=2` |
| `limit` | Items per page (max 100) | `limit=20` |
| `sort` | Sort field (prefix with `-` for desc) | `sort=-createdAt` |
| `status` | Filter by status | `status=active` |
| `search` | Text search | `search=example.com` |

## ⚠️ Error Handling

### Common Error Responses

**Validation Error (422):**

```json
{
  "success": false,
  "error": {
    "code": 422,
    "message": "Validation failed",
    "details": {
      "email": ["Email is required"],
      "password": ["Password must be at least 8 characters"]
    }
  },
  "timestamp": "2025-01-06T12:00:00Z",
  "requestId": "req-uuid"
}
```

**Authentication Error (401):**

```json
{
  "success": false,
  "error": {
    "code": 401,
    "message": "Authentication required"
  },
  "timestamp": "2025-01-06T12:00:00Z",
  "requestId": "req-uuid"
}
```

**Not Found Error (404):**

```json
{
  "success": false,
  "error": {
    "code": 404,
    "message": "Project not found"
  },
  "timestamp": "2025-01-06T12:00:00Z",
  "requestId": "req-uuid"
}
```

## 🛡️ Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Default Limit**: 100 requests per 15 minutes per IP
- **Authenticated Users**: 1000 requests per 15 minutes
- **Premium Users**: 5000 requests per 15 minutes

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641544800
```

### Rate Limit Exceeded

```json
{
  "success": false,
  "error": {
    "code": 429,
    "message": "Too many requests. Please try again later."
  },
  "timestamp": "2025-01-06T12:00:00Z"
}
```

## 🔧 Development Tools

### API Client Configuration

**Postman Collection**: Available at `/docs/postman-collection.json`

**OpenAPI Specification**: Available at `/docs/openapi.yaml`

**Swagger UI**: Available at `http://localhost:4000/api-docs` when running locally

### Environment Variables

Set these for API testing:

```bash
export API_BASE_URL="http://localhost:4000/api"
export JWT_TOKEN="your-jwt-token-here"
```

### Testing with curl

```bash
# Set base URL and token
API_URL="http://localhost:4000/api"
TOKEN="your-jwt-token"

# Get user profile
curl -H "Authorization: Bearer $TOKEN" "$API_URL/auth/me"

# Get projects
curl -H "Authorization: Bearer $TOKEN" "$API_URL/projects"

# Get dashboard stats
curl -H "Authorization: Bearer $TOKEN" "$API_URL/dashboard/stats"
```

## 📚 SDK and Libraries

### Official JavaScript/TypeScript SDK

```bash
npm install @rival-outranker/sdk
```

```typescript
import { RivalOutrankerClient } from '@rival-outranker/sdk';

const client = new RivalOutrankerClient({
  baseURL: 'http://localhost:4000/api',
  token: 'your-jwt-token'
});

// Use the client
const projects = await client.projects.list();
const analysis = await client.analyses.create({ projectId: 'project-id' });
```

### Community Libraries

- **Python**: `rival-outranker-py`
- **PHP**: `rival-outranker-php`
- **Ruby**: `rival-outranker-ruby`

## 🔗 Related Documentation

- **[Endpoint Reference](endpoints.md)** - Complete API endpoint documentation
- **[Examples](examples.md)** - Detailed request/response examples
- **[Error Codes](errors.md)** - Complete error code reference
- **[WebSocket Events](websocket.md)** - Real-time event documentation

## 📞 Support

- **API Issues**: [GitHub Issues](../../issues/new?template=api-bug.md)
- **Feature Requests**: [GitHub Discussions](../../discussions)
- **API Documentation**: This document and OpenAPI spec
- **Rate Limit Increases**: Contact <support@rival-outranker.com>

---

*Ready to start using the API? Check out our [endpoint documentation](endpoints.md) for detailed information about each endpoint.*
