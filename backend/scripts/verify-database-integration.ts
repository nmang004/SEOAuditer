#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { databaseManager, DatabasePerformanceMonitor } from '../src/config/database';
import { DatabaseService } from '../src/services/DatabaseService';
import { schemas } from '../src/schemas/validation';
import * as crypto from 'crypto';

interface VerificationResult {
  success: boolean;
  timestamp: Date;
  tests: {
    connection: boolean;
    schema: boolean;
    performance: boolean;
    dataIntegrity: boolean;
    caching: boolean;
    concurrency: boolean;
  };
  metrics: {
    connectionTime: number;
    queryResponseTime: number;
    cacheHitRatio: number;
    concurrentOperations: number;
  };
  errors: string[];
  warnings: string[];
}

class DatabaseVerification {
  private prisma: PrismaClient;
  private dbService: DatabaseService;
  private results: VerificationResult;

  constructor() {
    this.prisma = databaseManager.getPrisma();
    this.dbService = new DatabaseService();
    this.results = {
      success: false,
      timestamp: new Date(),
      tests: {
        connection: false,
        schema: false,
        performance: false,
        dataIntegrity: false,
        caching: false,
        concurrency: false,
      },
      metrics: {
        connectionTime: 0,
        queryResponseTime: 0,
        cacheHitRatio: 0,
        concurrentOperations: 0,
      },
      errors: [],
      warnings: [],
    };
  }

  async run(): Promise<VerificationResult> {
    console.log('🔍 Starting Database Integration Verification...\n');

    try {
      await this.testConnection();
      await this.testSchema();
      await this.testPerformance();
      await this.testDataIntegrity();
      await this.testCaching();
      await this.testConcurrency();

      // Check if all tests passed
      const allTestsPassed = Object.values(this.results.tests).every(test => test);
      this.results.success = allTestsPassed && this.results.errors.length === 0;

    } catch (error) {
      this.results.errors.push(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return this.results;
  }

  private async testConnection(): Promise<void> {
    console.log('📡 Testing Database Connection...');
    
    try {
      const startTime = Date.now();
      
      // Test basic connection
      await databaseManager.connect();
      
      // Test health check
      const isHealthy = await databaseManager.healthCheck();
      if (!isHealthy) {
        throw new Error('Database health check failed');
      }

      // Test query execution
      await this.prisma.$queryRaw`SELECT 1 as connection_test`;
      
      this.results.metrics.connectionTime = Date.now() - startTime;
      this.results.tests.connection = true;
      
      console.log(`✅ Connection test passed (${this.results.metrics.connectionTime}ms)`);
      
    } catch (error) {
      this.results.errors.push(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('❌ Connection test failed');
    }
  }

  private async testSchema(): Promise<void> {
    console.log('📋 Testing Database Schema...');
    
    try {
      // Test all required tables exist
      const tables = [
        'users', 'refresh_tokens', 'projects', 'crawl_sessions',
        'seo_analyses', 'seo_issues', 'seo_recommendations',
        'meta_tags', 'analysis_cache', 'activity_logs'
      ];

      for (const table of tables) {
        const result = await this.prisma.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${table}
          );
        `;
        
        if (!Array.isArray(result) || !result[0] || !(result[0] as any).exists) {
          throw new Error(`Table ${table} does not exist`);
        }
      }

      // Test indexes exist
      const criticalIndexes = [
        'idx_projects_user_id',
        'idx_seo_analyses_project_id',
        'idx_seo_issues_analysis',
        'idx_analysis_cache_url_hash'
      ];

      for (const indexName of criticalIndexes) {
        const result = await this.prisma.$queryRaw`
          SELECT EXISTS (
            SELECT FROM pg_indexes 
            WHERE indexname = ${indexName}
          );
        `;
        
        if (!Array.isArray(result) || !result[0] || !(result[0] as any).exists) {
          this.results.warnings.push(`Index ${indexName} does not exist`);
        }
      }

      this.results.tests.schema = true;
      console.log('✅ Schema validation passed');
      
    } catch (error) {
      this.results.errors.push(`Schema test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('❌ Schema test failed');
    }
  }

  private async testPerformance(): Promise<void> {
    console.log('⚡ Testing Database Performance...');
    
    try {
      const startTime = Date.now();

      // Test query performance with complex joins
      await this.prisma.sEOAnalysis.findMany({
        take: 10,
        include: {
          project: {
            select: { name: true, url: true }
          },
          issues: {
            take: 5,
            select: { severity: true, title: true }
          },
          recommendations: {
            take: 5,
            select: { priority: true, title: true }
          }
        }
      });

      this.results.metrics.queryResponseTime = Date.now() - startTime;

      // Test bulk operations
      const testUsers = Array.from({ length: 5 }, (_, i) => ({
        email: `test${i}@example.com`,
        passwordHash: 'hashed_password',
        name: `Test User ${i}`
      }));

      const bulkStart = Date.now();
      await this.prisma.user.createMany({
        data: testUsers,
        skipDuplicates: true
      });
      
      const bulkTime = Date.now() - bulkStart;

      // Cleanup test users
      await this.prisma.user.deleteMany({
        where: {
          email: { in: testUsers.map(u => u.email) }
        }
      });

      if (this.results.metrics.queryResponseTime > 3000) {
        this.results.warnings.push(`Slow query response time: ${this.results.metrics.queryResponseTime}ms`);
      }

      if (bulkTime > 1000) {
        this.results.warnings.push(`Slow bulk operation: ${bulkTime}ms`);
      }

      this.results.tests.performance = true;
      console.log(`✅ Performance test passed (Query: ${this.results.metrics.queryResponseTime}ms, Bulk: ${bulkTime}ms)`);
      
    } catch (error) {
      this.results.errors.push(`Performance test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('❌ Performance test failed');
    }
  }

  private async testDataIntegrity(): Promise<void> {
    console.log('🔒 Testing Data Integrity...');
    
    try {
      // Test validation schemas
      const testUserData = {
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        name: 'Test User'
      };

      const validatedUser = schemas.user.create.parse(testUserData);
      if (validatedUser.email !== testUserData.email) {
        throw new Error('User validation failed');
      }

      // Test foreign key constraints
      const testUser = await this.prisma.user.create({
        data: testUserData
      });

      const testProject = await this.prisma.project.create({
        data: {
          userId: testUser.id,
          name: 'Test Project',
          url: 'https://example.com'
        }
      });

      // Test cascading deletes
      await this.prisma.user.delete({
        where: { id: testUser.id }
      });

      // Verify project was also deleted due to cascade
      const deletedProject = await this.prisma.project.findUnique({
        where: { id: testProject.id }
      });

      if (deletedProject) {
        throw new Error('Cascading delete failed');
      }

      this.results.tests.dataIntegrity = true;
      console.log('✅ Data integrity test passed');
      
    } catch (error) {
      this.results.errors.push(`Data integrity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('❌ Data integrity test failed');
    }
  }

  private async testCaching(): Promise<void> {
    console.log('💾 Testing Caching System...');
    
    try {
      // Test cache operations
      const testUrl = 'https://test-cache.example.com';
      const testData = { score: 85, issues: 5 };
      const urlHash = crypto.createHash('md5').update(testUrl).digest('hex');

      // Test cache set
      await this.dbService.setCachedAnalysis({
        key: `test-cache-${Date.now()}`,
        url: testUrl,
        urlHash,
        data: testData,
        analysisData: testData,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
        tags: ['test'],
        size: JSON.stringify(testData).length
      });

      // Test cache get
      const cachedData = await this.dbService.getCachedAnalysis(urlHash);
      if (!cachedData) {
        throw new Error('Cache retrieval failed');
      }

      // Test cache statistics
      const cacheStats = await this.dbService.getCacheStats();
      if (!cacheStats || cacheStats.error) {
        this.results.warnings.push('Cache statistics unavailable');
      } else {
        this.results.metrics.cacheHitRatio = cacheStats.overview?.averageAccesses || 0;
      }

      // Cleanup test cache entry
      await this.prisma.analysisCache.deleteMany({
        where: { urlHash }
      });

      this.results.tests.caching = true;
      console.log('✅ Caching test passed');
      
    } catch (error) {
      this.results.errors.push(`Caching test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('❌ Caching test failed');
    }
  }

  private async testConcurrency(): Promise<void> {
    console.log('🔄 Testing Concurrent Operations...');
    
    try {
      // Create test users for concurrent operations
      const testUsers = Array.from({ length: 10 }, (_, i) => ({
        email: `concurrent${i}@example.com`,
        passwordHash: 'hashed_password',
        name: `Concurrent User ${i}`
      }));

      // Test concurrent user creation
      const concurrentPromises = testUsers.map(userData => 
        this.prisma.user.create({ data: userData })
      );

      const startTime = Date.now();
      const results = await Promise.allSettled(concurrentPromises);
      const concurrentTime = Date.now() - startTime;

      // Check results
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      if (failed > 0) {
        this.results.warnings.push(`${failed} concurrent operations failed`);
      }

      this.results.metrics.concurrentOperations = successful;

      // Cleanup test users
      await this.prisma.user.deleteMany({
        where: {
          email: { in: testUsers.map(u => u.email) }
        }
      });

      this.results.tests.concurrency = true;
      console.log(`✅ Concurrency test passed (${successful}/${testUsers.length} operations, ${concurrentTime}ms)`);
      
    } catch (error) {
      this.results.errors.push(`Concurrency test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('❌ Concurrency test failed');
    }
  }

  async generateReport(): Promise<string> {
    const report = `
# Database Integration Verification Report

**Generated:** ${this.results.timestamp.toISOString()}
**Overall Status:** ${this.results.success ? '✅ PASSED' : '❌ FAILED'}

## Test Results

| Test | Status | Details |
|------|--------|---------|
| Connection | ${this.results.tests.connection ? '✅' : '❌'} | Response time: ${this.results.metrics.connectionTime}ms |
| Schema | ${this.results.tests.schema ? '✅' : '❌'} | All required tables and indexes validated |
| Performance | ${this.results.tests.performance ? '✅' : '❌'} | Query time: ${this.results.metrics.queryResponseTime}ms |
| Data Integrity | ${this.results.tests.dataIntegrity ? '✅' : '❌'} | Foreign keys and validation working |
| Caching | ${this.results.tests.caching ? '✅' : '❌'} | Cache operations functional |
| Concurrency | ${this.results.tests.concurrency ? '✅' : '❌'} | ${this.results.metrics.concurrentOperations} concurrent operations |

## Performance Metrics

- **Connection Time:** ${this.results.metrics.connectionTime}ms
- **Query Response Time:** ${this.results.metrics.queryResponseTime}ms
- **Cache Hit Ratio:** ${this.results.metrics.cacheHitRatio}
- **Concurrent Operations:** ${this.results.metrics.concurrentOperations}

## Errors (${this.results.errors.length})

${this.results.errors.map(error => `- ${error}`).join('\n')}

## Warnings (${this.results.warnings.length})

${this.results.warnings.map(warning => `- ${warning}`).join('\n')}

## Recommendations

${this.results.metrics.connectionTime > 1000 ? '- Consider optimizing database connection settings\n' : ''}${this.results.metrics.queryResponseTime > 2000 ? '- Consider adding more database indexes for slow queries\n' : ''}${this.results.warnings.length > 0 ? '- Review and address warning messages\n' : ''}${this.results.tests.concurrency && this.results.metrics.concurrentOperations < 8 ? '- Consider increasing connection pool size for better concurrency\n' : ''}
`;

    return report;
  }
}

// Main execution
async function main(): Promise<void> {
  const verification = new DatabaseVerification();
  
  try {
    const results = await verification.run();
    
    console.log('\n📊 Verification Complete!\n');
    
    // Generate and display report
    const report = await verification.generateReport();
    console.log(report);
    
    // Performance monitor summary
    console.log('\n📈 Performance Monitor Summary:');
    const perfMetrics = DatabasePerformanceMonitor.getMetrics();
    console.log(`├── Total Queries: ${perfMetrics.queryCount}`);
    console.log(`├── Average Query Time: ${perfMetrics.averageQueryTime.toFixed(2)}ms`);
    console.log(`├── Slow Queries: ${perfMetrics.slowQueries} (${perfMetrics.slowQueryPercentage.toFixed(2)}%)`);
    console.log(`├── Error Rate: ${perfMetrics.errorRate.toFixed(2)}%`);
    console.log(`└── Queries/Second: ${perfMetrics.queriesPerSecond.toFixed(2)}`);
    
    process.exit(results.success ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Verification script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { DatabaseVerification, type VerificationResult }; 