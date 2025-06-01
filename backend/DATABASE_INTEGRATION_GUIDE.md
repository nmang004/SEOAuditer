# Database Integration Guide

## Overview

This guide covers the comprehensive database integration for the Rival Outranker SEO analysis platform. The system uses PostgreSQL 15+ with Prisma ORM and includes advanced optimization, monitoring, and validation features.

## 🚀 Quick Start

### 1. Environment Setup

Copy the environment variables template and configure your database:

```bash
# Copy environment template
cp .env.example .env

# Configure your database URL
DATABASE_URL="postgresql://username:password@localhost:5432/rival_outranker_dev"
```

### 2. Database Setup

Run the complete database setup:

```bash
# Full setup with optimization and seed data
npm run db:setup

# Or step by step:
npm run migrate:deploy    # Apply migrations
npm run db:optimize      # Optimize database
npm run seed:enhanced    # Add sample data
```

### 3. Verify Installation

```bash
# Run comprehensive validation
npm run db:validate

# Or individual checks:
npm run db:health    # Basic health check
npm run db:monitor   # Detailed monitoring
npm run db:test      # Integration tests
```

## 📊 Features

### Schema Optimization

- **Advanced Indexing**: Optimized indexes for SEO analysis queries
- **Relationship Management**: Proper foreign keys with cascading deletes
- **Data Constraints**: Validation constraints for data integrity
- **Performance Views**: Pre-built analytics views for dashboard queries

### Connection Management

- **Connection Pooling**: Production-ready connection pooling
- **Health Monitoring**: Continuous connection health checks
- **Retry Logic**: Automatic retry with exponential backoff
- **Timeout Management**: Configurable timeouts for different operations

### Query Optimization

- **Index Strategy**: Comprehensive indexing for frequent queries
- **Query Monitoring**: Slow query detection and logging
- **Performance Analytics**: Built-in performance metrics
- **Caching Layer**: Analysis result caching with TTL

### Data Validation

- **Input Sanitization**: XSS and SQL injection protection
- **Schema Validation**: Zod-based validation for all operations
- **URL Validation**: Comprehensive URL format and security validation
- **Score Validation**: SEO score range and consistency validation

## 🛠️ Database Scripts

### Core Operations

```bash
# Database health check
npm run db:health

# Database optimization
npm run db:optimize

# Health monitoring with detailed report
npm run db:monitor

# Comprehensive integration testing
npm run db:test

# Full validation (tests + monitoring)
npm run db:validate
```

### Development Operations

```bash
# Reset and reseed database
npm run db:reset-and-seed

# Migrate and seed
npm run db:migrate-and-seed

# Just seed data
npm run seed:enhanced
```

### Prisma Operations

```bash
# Generate Prisma client
npm run prisma:generate

# Apply migrations
npm run migrate:deploy

# Open Prisma Studio
npm run prisma:studio

# Push schema changes
npm run prisma:push
```

## 🔧 Configuration

### Environment Variables

```bash
# Database connection
DATABASE_URL="postgresql://username:password@localhost:5432/database"

# Connection pooling
DB_CONNECTION_POOL_SIZE=25
DB_MAX_IDLE_CONNECTIONS=5
DB_CONNECTION_LIFETIME=3600000

# Performance tuning
DB_QUERY_TIMEOUT=30000
DB_SLOW_QUERY_THRESHOLD=1000
DB_TRANSACTION_TIMEOUT=60000

# Monitoring
DB_HEALTH_CHECK_INTERVAL=30000
ENABLE_QUERY_LOGGING=false
ENABLE_PERFORMANCE_MONITORING=true
```

### PostgreSQL Configuration

Recommended PostgreSQL settings for optimal performance:

```sql
-- Connection and memory settings
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB

-- Performance settings
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200

-- Monitoring
shared_preload_libraries = 'pg_stat_statements'
track_activity_query_size = 2048
```

## 📈 Monitoring and Analytics

### Health Monitoring

The health monitor provides comprehensive database status:

```bash
npm run db:monitor
```

**Checks include:**
- Connection performance
- Query execution times
- Storage usage and growth
- Index effectiveness
- Connection pool status
- Cache performance
- Data consistency

### Performance Metrics

Built-in performance tracking:
- Query execution times
- Slow query detection
- Connection pool utilization
- Cache hit rates
- Database size trends

### Analytics Views

Pre-built views for dashboard queries:

```sql
-- Project dashboard statistics
SELECT * FROM v_project_dashboard_stats WHERE user_id = ?;

-- User analytics summary
SELECT * FROM v_user_analytics_summary WHERE user_id = ?;

-- Issue trend analysis
SELECT * FROM v_issue_trend_analytics WHERE project_id = ?;
```

## 🔒 Security Features

### Input Validation

- **SQL Injection Protection**: Parameterized queries only
- **XSS Prevention**: Input sanitization for all text fields
- **URL Validation**: Security checks for analyzed URLs
- **Data Sanitization**: Automatic cleanup of malicious content

### Access Control

- **User Isolation**: Row-level security for multi-tenant data
- **API Rate Limiting**: Built-in rate limiting for database operations
- **Connection Security**: SSL/TLS encryption for production
- **Audit Logging**: Comprehensive activity logging

## 🚀 Performance Optimization

### Query Optimization

1. **Index Strategy**
   - Composite indexes for multi-column queries
   - Partial indexes for filtered queries
   - Hash indexes for exact matches
   - Expression indexes for computed columns

2. **Query Patterns**
   - Use `withSEOAnalysisIncludes` for standardized includes
   - Implement pagination for large result sets
   - Use aggregation views for dashboard queries
   - Cache frequently accessed data

3. **Connection Management**
   - Connection pooling with optimal size
   - Connection lifetime management
   - Health check automation
   - Retry logic for failed connections

### Database Tuning

1. **PostgreSQL Settings**
   ```sql
   -- Memory optimization
   work_mem = '32MB'
   maintenance_work_mem = '128MB'
   temp_buffers = '32MB'
   
   -- Query optimization
   enable_hashjoin = ON
   enable_mergejoin = ON
   enable_nestloop = OFF
   ```

2. **Index Maintenance**
   ```sql
   -- Regular maintenance
   ANALYZE;
   REINDEX;
   VACUUM ANALYZE;
   ```

## 🐛 Troubleshooting

### Common Issues

1. **Slow Queries**
   ```bash
   # Check slow queries
   npm run db:monitor
   
   # Analyze specific query
   EXPLAIN ANALYZE SELECT ...;
   ```

2. **Connection Issues**
   ```bash
   # Test connection
   npm run db:health
   
   # Check connection pool
   SELECT * FROM pg_stat_activity;
   ```

3. **Data Consistency**
   ```bash
   # Run integrity checks
   npm run db:test
   
   # Check for orphaned records
   SELECT * FROM v_project_dashboard_stats WHERE latest_score IS NULL;
   ```

### Performance Issues

1. **High Memory Usage**
   - Reduce connection pool size
   - Optimize query complexity
   - Implement result pagination

2. **Slow Query Performance**
   - Add missing indexes
   - Optimize WHERE clauses
   - Use EXPLAIN ANALYZE

3. **Connection Pool Exhaustion**
   - Increase max_connections
   - Implement connection retry logic
   - Monitor for connection leaks

## 📊 Monitoring Dashboard

### Key Metrics to Monitor

1. **Performance Metrics**
   - Average query execution time
   - 95th percentile response time
   - Slow query count and trends
   - Cache hit ratio

2. **Resource Metrics**
   - Connection pool utilization
   - Database size growth
   - Index usage efficiency
   - Memory usage patterns

3. **Availability Metrics**
   - Connection success rate
   - Database uptime
   - Failed query ratio
   - Error rates by operation

### Alerting Thresholds

- **Critical**: Query time > 2000ms, Connection usage > 90%
- **Warning**: Query time > 500ms, Connection usage > 70%
- **Info**: Cache hit rate < 80%, Unused indexes > 10

## 🔄 Maintenance Tasks

### Daily Tasks
- Monitor slow queries
- Check connection pool usage
- Verify cache performance

### Weekly Tasks
- Run database health check
- Analyze query performance trends
- Review and optimize slow queries

### Monthly Tasks
- Full database optimization
- Index usage analysis
- Clean up expired cache entries
- Review data growth patterns

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Database Security Best Practices](https://owasp.org/www-project-cheat-sheets/cheatsheets/Database_Security_Cheat_Sheet.html)

## 🆘 Support

For database-related issues:

1. Run comprehensive diagnostics: `npm run db:validate`
2. Check the monitoring report: `npm run db:monitor`
3. Review logs for specific error messages
4. Consult this guide for troubleshooting steps

---

**Last updated**: 2024-01-27
**Database Schema Version**: 1.0.0
**Compatibility**: PostgreSQL 15+, Prisma 5.0+ 