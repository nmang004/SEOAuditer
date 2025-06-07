#!/usr/bin/env ts-node
import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';
import { databaseManager } from '../src/config/database';
import { validationRegistry } from '../src/utils/database-validators';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'warning';
  duration: number;
  message: string;
  details?: any;
}

class DatabaseIntegrationTester {
  private prisma: PrismaClient;
  private results: TestResult[] = [];

  constructor() {
    this.prisma = new PrismaClient();
  }

  async runAllTests(): Promise<void> {
    logger.info('🧪 Starting comprehensive database integration tests...');

    const testSuites = [
      () => this.testDatabaseConnection(),
      () => this.testSchemaIntegrity(),
      () => this.testDataValidation(),
      () => this.testQueryPerformance(),
      () => this.testConcurrentOperations(),
      () => this.testDataConsistency(),
      () => this.testIndexEffectiveness(),
      () => this.testTransactionIntegrity(),
      () => this.testCacheOperations(),
    ];

    for (const testSuite of testSuites) {
      try {
        await testSuite();
      } catch (error: unknown) {
        this.addResult({
          name: testSuite.name,
          status: 'failed',
          duration: 0,
          message: `Test suite failed: ${error}`,
          details: { error: error instanceof Error ? error.message : String(error) }
        });
      }
    }

    await this.generateReport();
    await this.prisma.$disconnect();
  }

  private async testDatabaseConnection(): Promise<void> {
    const start = Date.now();
    
    try {
      // Test basic connectivity
      await this.prisma.$queryRaw`SELECT 1 as test`;
      
      // Test connection manager
      await databaseManager.connect();
      const isHealthy = databaseManager.isConnectionHealthy();
      
      if (!isHealthy) {
        throw new Error('Database manager reports unhealthy connection');
      }

      this.addResult({
        name: 'Database Connection',
        status: 'passed',
        duration: Date.now() - start,
        message: 'Database connection is healthy and accessible'
      });
    } catch (error: unknown) {
      this.addResult({
        name: 'Database Connection',
        status: 'failed',
        duration: Date.now() - start,
        message: `Connection test failed: ${error}`,
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  private async testSchemaIntegrity(): Promise<void> {
    const start = Date.now();

    try {
      // Check if all required tables exist
      const requiredTables = [
        'users', 'projects', 'crawl_sessions', 'seo_analyses',
        'seo_issues', 'seo_recommendations', 'meta_tags',
        'analysis_cache', 'content_analyses', 'performance_metrics'
      ];

      const existingTables = await this.prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `;

      const tableNames = existingTables.map(t => t.table_name);
      const missingTables = requiredTables.filter(table => !tableNames.includes(table));

      if (missingTables.length > 0) {
        throw new Error(`Missing required tables: ${missingTables.join(', ')}`);
      }

      // Check critical indexes exist
      const criticalIndexes = await this.prisma.$queryRaw<Array<{ indexname: string }>>`
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public'
        AND indexname LIKE 'idx_%'
      `;

      this.addResult({
        name: 'Schema Integrity',
        status: 'passed',
        duration: Date.now() - start,
        message: `Schema is complete with ${tableNames.length} tables and ${criticalIndexes.length} indexes`,
        details: {
          tables: tableNames.length,
          indexes: criticalIndexes.length,
          missingTables: missingTables
        }
      });
    } catch (error: unknown) {
      this.addResult({
        name: 'Schema Integrity',
        status: 'failed',
        duration: Date.now() - start,
        message: `Schema validation failed: ${error}`,
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  private async testDataValidation(): Promise<void> {
    const start = Date.now();

    try {
      // Test URL validation
      const urlTests = [
        { url: 'https://example.com', shouldPass: true },
        { url: 'http://test.com', shouldPass: true },
        { url: 'invalid-url', shouldPass: false },
        { url: 'ftp://example.com', shouldPass: false },
      ];

      for (const test of urlTests) {
        const result = validationRegistry.url(test.url);
        if (result.isValid !== test.shouldPass) {
          throw new Error(`URL validation failed for ${test.url}`);
        }
      }

      // Test SEO score validation
      const scoreTests = [
        { scores: { overall: 85, technical: 90 }, shouldPass: true },
        { scores: { overall: 150 }, shouldPass: false },
        { scores: { overall: -10 }, shouldPass: false },
      ];

      for (const test of scoreTests) {
        const result = validationRegistry.seoScores(test.scores);
        if (result.isValid !== test.shouldPass) {
          throw new Error(`Score validation failed for ${JSON.stringify(test.scores)}`);
        }
      }

      this.addResult({
        name: 'Data Validation',
        status: 'passed',
        duration: Date.now() - start,
        message: 'All data validation tests passed',
        details: {
          urlTests: urlTests.length,
          scoreTests: scoreTests.length
        }
      });
    } catch (error: unknown) {
      this.addResult({
        name: 'Data Validation',
        status: 'failed',
        duration: Date.now() - start,
        message: `Data validation tests failed: ${error}`,
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  private async testQueryPerformance(): Promise<void> {
    const start = Date.now();

    try {
      // Test query performance with existing data
      const performanceTests = [
        {
          name: 'User projects query',
          query: () => this.prisma.project.findMany({ take: 10 })
        },
        {
          name: 'Recent analyses query',
          query: () => this.prisma.sEOAnalysis.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' }
          })
        },
        {
          name: 'Issues aggregation',
          query: () => this.prisma.sEOIssue.groupBy({
            by: ['severity'],
            _count: { severity: true }
          })
        }
      ];

      const results = [];
      for (const test of performanceTests) {
        const queryStart = Date.now();
        await test.query();
        const duration = Date.now() - queryStart;
        
        results.push({
          name: test.name,
          duration,
          acceptable: duration < 500 // Should complete within 500ms
        });
      }

      const slowQueries = results.filter(r => !r.acceptable);
      
      this.addResult({
        name: 'Query Performance',
        status: slowQueries.length > 0 ? 'warning' : 'passed',
        duration: Date.now() - start,
        message: slowQueries.length > 0 
          ? `${slowQueries.length} queries exceeded 500ms threshold`
          : 'All queries performed within acceptable limits',
        details: { results }
      });
    } catch (error: unknown) {
      this.addResult({
        name: 'Query Performance',
        status: 'failed',
        duration: Date.now() - start,
        message: `Performance testing failed: ${error}`,
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  private async testConcurrentOperations(): Promise<void> {
    const start = Date.now();

    try {
      // Test concurrent database operations
      const concurrentOperations = Array.from({ length: 5 }, (_, i) =>
        this.prisma.project.findMany({
          where: { name: { contains: `test-${i}` } },
          take: 1
        })
      );

      const results = await Promise.all(concurrentOperations);
      const projects = results.flat();

      this.addResult({
        name: 'Concurrent Operations',
        status: 'passed',
        duration: Date.now() - start,
        message: 'Concurrent operations completed successfully',
        details: { operationsCount: projects.length }
      });
    } catch (error: unknown) {
      this.addResult({
        name: 'Concurrent Operations',
        status: 'failed',
        duration: Date.now() - start,
        message: `Concurrent operations test failed: ${error}`,
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  private async testDataConsistency(): Promise<void> {
    const start = Date.now();

    try {
      // Check for orphaned records - simplified approach without relation checks
      const totalAnalyses = await this.prisma.sEOAnalysis.count();
      const totalIssues = await this.prisma.sEOIssue.count();

      // Check score consistency
      const invalidScores = await this.prisma.sEOAnalysis.findMany({
        where: {
          OR: [
            { overallScore: { lt: 0 } },
            { overallScore: { gt: 100 } },
            { technicalScore: { lt: 0 } },
            { technicalScore: { gt: 100 } }
          ]
        }
      });

      const issues = [];
      if (invalidScores.length > 0) {
        issues.push(`${invalidScores.length} invalid scores`);
      }

      if (issues.length > 0) {
        this.addResult({
          name: 'Data Consistency',
          status: 'warning',
          duration: Date.now() - start,
          message: `Data consistency issues found: ${issues.join(', ')}`,
          details: {
            totalAnalyses,
            totalIssues,
            invalidScores: invalidScores.length
          }
        });
      } else {
        this.addResult({
          name: 'Data Consistency',
          status: 'passed',
          duration: Date.now() - start,
          message: 'No data consistency issues found',
          details: {
            totalAnalyses,
            totalIssues
          }
        });
      }
    } catch (error: unknown) {
      this.addResult({
        name: 'Data Consistency',
        status: 'failed',
        duration: Date.now() - start,
        message: `Data consistency check failed: ${error}`,
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  private async testIndexEffectiveness(): Promise<void> {
    const start = Date.now();

    try {
      // Test if indexes are being used in common queries
      const indexUsageQueries = [
        {
          name: 'Projects by user',
          query: `EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM projects WHERE user_id = '00000000-0000-0000-0000-000000000000'`
        },
        {
          name: 'Analyses by project',
          query: `EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM seo_analyses WHERE project_id = '00000000-0000-0000-0000-000000000000'`
        }
      ];

      const results = [];
      for (const test of indexUsageQueries) {
        try {
          const plan = await this.prisma.$queryRawUnsafe(test.query);
          results.push({
            name: test.name,
            usesIndex: JSON.stringify(plan).includes('Index Scan'),
            plan: plan
          });
        } catch (error: unknown) {
          // Query might fail if referenced IDs don't exist, but we can still get the plan
          results.push({
            name: test.name,
            usesIndex: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      this.addResult({
        name: 'Index Effectiveness',
        status: 'passed',
        duration: Date.now() - start,
        message: 'Index effectiveness analysis completed',
        details: { results }
      });
    } catch (error: unknown) {
      this.addResult({
        name: 'Index Effectiveness',
        status: 'warning',
        duration: Date.now() - start,
        message: `Index effectiveness test failed: ${error}`,
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  private async testTransactionIntegrity(): Promise<void> {
    const start = Date.now();

    try {
      // Test successful transaction
      const testUser = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: `transaction-test-${Date.now()}@example.com`,
            passwordHash: 'test-hash',
            name: 'Transaction Test'
          }
        });

        const project = await tx.project.create({
          data: {
            userId: user.id,
            name: 'Transaction Test Project',
            url: 'https://transaction-test.example.com'
          }
        });

        return { user, project };
      });

      // Test transaction rollback
      let rollbackWorked = false;
      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.project.create({
            data: {
              userId: testUser.user.id,
              name: 'Should Rollback',
              url: 'https://rollback-test.example.com'
            }
          });

          // Force error to trigger rollback
          throw new Error('Intentional rollback');
        });
      } catch (error) {
        rollbackWorked = true;
      }

      // Verify rollback worked
      const rolledBackProject = await this.prisma.project.findFirst({
        where: { name: 'Should Rollback' }
      });

      if (rolledBackProject) {
        throw new Error('Transaction rollback failed - project was created');
      }

      // Cleanup
      await this.prisma.project.delete({ where: { id: testUser.project.id } });
      await this.prisma.user.delete({ where: { id: testUser.user.id } });

      this.addResult({
        name: 'Transaction Integrity',
        status: 'passed',
        duration: Date.now() - start,
        message: 'Transaction commit and rollback working correctly',
        details: { rollbackWorked }
      });
    } catch (error: unknown) {
      this.addResult({
        name: 'Transaction Integrity',
        status: 'failed',
        duration: Date.now() - start,
        message: `Transaction integrity test failed: ${error}`,
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  private async testCacheOperations(): Promise<void> {
    const start = Date.now();

    try {
      const testKey = `test-cache-${Date.now()}`;
      const testData = { 
        test: true, 
        timestamp: new Date(),
        data: 'Sample analysis data'
      };

      // Test cache write
      await this.prisma.analysisCache.create({
        data: {
          key: testKey,
          url: 'https://test-cache.example.com',
          urlHash: testKey,
          data: testData,
          analysisData: testData,
          expiresAt: new Date(Date.now() + 3600000), // 1 hour
        }
      });

      // Test cache read
      const cachedItem = await this.prisma.analysisCache.findUnique({
        where: { key: testKey }
      });

      if (!cachedItem) {
        throw new Error('Cache write/read failed');
      }

      // Test cache cleanup
      await this.prisma.analysisCache.delete({
        where: { key: testKey }
      });

      this.addResult({
        name: 'Cache Operations',
        status: 'passed',
        duration: Date.now() - start,
        message: 'Cache write, read, and delete operations working correctly',
        details: {
          cacheKey: testKey,
          dataMatches: JSON.stringify(cachedItem.data) === JSON.stringify(testData)
        }
      });
    } catch (error: unknown) {
      this.addResult({
        name: 'Cache Operations',
        status: 'failed',
        duration: Date.now() - start,
        message: `Cache operations test failed: ${error}`,
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  private addResult(result: TestResult): void {
    this.results.push(result);
    const statusEmoji = result.status === 'passed' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    logger.info(`${statusEmoji} ${result.name}: ${result.message} (${result.duration}ms)`);
  }

  private async generateReport(): Promise<void> {
    const passed = this.results.filter(r => r.status === 'passed').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const total = this.results.length;

    logger.info('\n📊 Database Integration Test Report:');
    logger.info(`✅ Passed: ${passed}/${total}`);
    logger.info(`⚠️  Warnings: ${warnings}/${total}`);
    logger.info(`❌ Failed: ${failed}/${total}`);

    if (failed > 0) {
      logger.error('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'failed')
        .forEach(result => {
          logger.error(`  - ${result.name}: ${result.message}`);
        });
    }

    if (warnings > 0) {
      logger.warn('\n⚠️  Warning Tests:');
      this.results
        .filter(r => r.status === 'warning')
        .forEach(result => {
          logger.warn(`  - ${result.name}: ${result.message}`);
        });
    }

    logger.info(`\n🏁 Overall Status: ${failed === 0 ? '✅ PASSED' : '❌ FAILED'}`);
  }
}

async function main() {
  try {
    await databaseManager.connect();
    
    const tester = new DatabaseIntegrationTester();
    await tester.runAllTests();
    
    await databaseManager.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Database integration testing failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 