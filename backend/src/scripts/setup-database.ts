#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { databaseManager, dbConfig } from '../config/database';
import { logger } from '../utils/logger';

interface DatabaseSetupResult {
  success: boolean;
  tests: {
    connectivity: boolean;
    schemaValidation: boolean;
    indexValidation: boolean;
    performanceOptimization: boolean;
    monitoring: boolean;
  };
  metrics: {
    connectionTime: number;
    queryResponseTime: number;
    indexCount: number;
    optimizationsApplied: number;
  };
  errors: string[];
  warnings: string[];
}

class DatabaseSetup {
  private prisma: PrismaClient;
  private results: DatabaseSetupResult;

  constructor() {
    this.prisma = databaseManager.getPrisma();
    this.results = {
      success: false,
      tests: {
        connectivity: false,
        schemaValidation: false,
        indexValidation: false,
        performanceOptimization: false,
        monitoring: false,
      },
      metrics: {
        connectionTime: 0,
        queryResponseTime: 0,
        indexCount: 0,
        optimizationsApplied: 0,
      },
      errors: [],
      warnings: [],
    };
  }

  async run(): Promise<DatabaseSetupResult> {
    logger.info('🚀 Starting comprehensive database setup and optimization...');
    
    try {
      await this.testConnectivity();
      await this.validateSchema();
      await this.validateIndexes();
      await this.applyPerformanceOptimizations();
      await this.setupMonitoring();
      
      this.results.success = Object.values(this.results.tests).every(test => test);
      
      if (this.results.success) {
        logger.info('✅ Database setup completed successfully!', {
          metrics: this.results.metrics,
          warnings: this.results.warnings.length,
        });
      } else {
        logger.error('❌ Database setup completed with errors', {
          errors: this.results.errors,
          failedTests: Object.entries(this.results.tests)
            .filter(([_, passed]) => !passed)
            .map(([test]) => test),
        });
      }
      
    } catch (error) {
      this.results.errors.push(`Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      logger.error('💥 Database setup failed catastrophically:', error);
    }
    
    return this.results;
  }

  private async testConnectivity(): Promise<void> {
    logger.info('🔗 Testing database connectivity...');
    
    try {
      const startTime = Date.now();
      
      // Test basic connection
      await databaseManager.connect();
      
      this.results.metrics.connectionTime = Date.now() - startTime;
      
      // Test query execution
      const queryStart = Date.now();
      const result = await this.prisma.$queryRaw`
        SELECT 
          version() as pg_version,
          current_database() as database_name,
          current_user as current_user,
          inet_server_addr() as server_ip,
          inet_server_port() as server_port,
          NOW() as server_time
      `;
      
      this.results.metrics.queryResponseTime = Date.now() - queryStart;
      
      logger.info('✅ Database connectivity test passed', {
        connectionTime: `${this.results.metrics.connectionTime}ms`,
        queryTime: `${this.results.metrics.queryResponseTime}ms`,
        database: Array.isArray(result) && result.length > 0 ? (result[0] as any).database_name : 'unknown',
        version: Array.isArray(result) && result.length > 0 ? (result[0] as any).pg_version?.split(' ')[1] : 'unknown',
      });
      
      this.results.tests.connectivity = true;
      
    } catch (error) {
      const errorMessage = `Connectivity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.results.errors.push(errorMessage);
      logger.error('❌ Database connectivity test failed:', error);
    }
  }

  private async validateSchema(): Promise<void> {
    logger.info('📋 Validating database schema...');
    
    try {
      // Test that all required tables exist
      const requiredTables = [
        'users', 'projects', 'crawl_sessions', 'seo_analyses', 'seo_issues',
        'seo_recommendations', 'meta_tags', 'content_analyses', 'performance_metrics',
        'project_trends', 'analysis_cache', 'notifications', 'activity_logs'
      ];
      
      const existingTables = await this.prisma.$queryRaw<{ table_name: string }[]>`
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
      
      // Test that we can perform basic operations on each table
      const operations = [
        () => this.prisma.user.findFirst({ take: 1 }),
        () => this.prisma.project.findFirst({ take: 1 }),
        () => this.prisma.sEOAnalysis.findFirst({ take: 1 }),
        () => this.prisma.sEOIssue.findFirst({ take: 1 }),
        () => this.prisma.sEORecommendation.findFirst({ take: 1 }),
      ];
      
      await Promise.all(operations.map(op => op()));
      
      logger.info('✅ Schema validation passed', {
        tablesFound: tableNames.length,
        requiredTables: requiredTables.length,
      });
      
      this.results.tests.schemaValidation = true;
      
    } catch (error) {
      const errorMessage = `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.results.errors.push(errorMessage);
      logger.error('❌ Schema validation failed:', error);
    }
  }

  private async validateIndexes(): Promise<void> {
    logger.info('🗂️ Validating database indexes...');
    
    try {
      // Get all indexes
      const indexes = await this.prisma.$queryRaw<{
        schemaname: string;
        tablename: string;
        indexname: string;
        indexdef: string;
      }[]>`
        SELECT schemaname, tablename, indexname, indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
      `;
      
      this.results.metrics.indexCount = indexes.length;
      
      // Critical indexes for SEO analysis performance
      const criticalIndexes = [
        // User operations
        'idx_users_email',
        'idx_users_subscription_verified',
        
        // Project operations
        'idx_projects_user_id',
        'idx_projects_user_status',
        'idx_projects_user_last_scan',
        
        // Analysis operations
        'idx_seo_analyses_project_id',
        'idx_seo_analyses_project_history',
        'idx_seo_analyses_project_trend',
        
        // Issue management
        'idx_seo_issues_analysis_severity',
        'idx_seo_issues_severity_status',
        'idx_seo_issues_blocking',
        
        // Cache operations
        'idx_analysis_cache_key',
        'idx_analysis_cache_expires',
        'idx_analysis_cache_usage',
        
        // Trends and analytics
        'idx_project_trends_project_date',
        'idx_issue_trends_project_date',
      ];
      
      const existingIndexNames = indexes.map(idx => idx.indexname);
      const missingCriticalIndexes = criticalIndexes.filter(
        idx => !existingIndexNames.includes(idx)
      );
      
      if (missingCriticalIndexes.length > 0) {
        this.results.warnings.push(
          `Missing critical indexes: ${missingCriticalIndexes.join(', ')}`
        );
        logger.warn('⚠️ Some critical indexes are missing', {
          missing: missingCriticalIndexes,
          total: criticalIndexes.length,
        });
      }
      
      // Test index usage with sample queries
      await this.testIndexPerformance();
      
      logger.info('✅ Index validation completed', {
        totalIndexes: this.results.metrics.indexCount,
        criticalIndexes: criticalIndexes.length,
        missingCritical: missingCriticalIndexes.length,
      });
      
      this.results.tests.indexValidation = true;
      
    } catch (error) {
      const errorMessage = `Index validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.results.errors.push(errorMessage);
      logger.error('❌ Index validation failed:', error);
    }
  }

  private async testIndexPerformance(): Promise<void> {
    logger.info('⚡ Testing index performance...');
    
    const performanceThresholds = {
      userLookup: 50, // ms
      projectList: 100, // ms
      analysisHistory: 200, // ms
      issueFiltering: 150, // ms
    };
    
    try {
      // Test user lookup performance
      const userQueryStart = Date.now();
      await this.prisma.$queryRaw`
        SELECT id FROM users WHERE email = 'test@example.com' LIMIT 1
      `;
      const userQueryTime = Date.now() - userQueryStart;
      
      if (userQueryTime > performanceThresholds.userLookup) {
        this.results.warnings.push(
          `User lookup query slower than expected: ${userQueryTime}ms > ${performanceThresholds.userLookup}ms`
        );
      }
      
      // Test project listing performance
      const projectQueryStart = Date.now();
      await this.prisma.$queryRaw`
        SELECT p.id, p.name, p.current_score 
        FROM projects p 
        WHERE p.user_id = gen_random_uuid()
        ORDER BY p.last_scan_date DESC 
        LIMIT 10
      `;
      const projectQueryTime = Date.now() - projectQueryStart;
      
      if (projectQueryTime > performanceThresholds.projectList) {
        this.results.warnings.push(
          `Project listing query slower than expected: ${projectQueryTime}ms > ${performanceThresholds.projectList}ms`
        );
      }
      
      logger.info('⚡ Index performance test completed', {
        userLookup: `${userQueryTime}ms`,
        projectList: `${projectQueryTime}ms`,
      });
      
    } catch (error) {
      logger.warn('⚠️ Index performance test had issues:', error);
    }
  }

  private async applyPerformanceOptimizations(): Promise<void> {
    logger.info('🔧 Applying PostgreSQL performance optimizations...');
    
    const optimizations = [
      // Memory settings for SEO analysis workloads
      { name: 'work_mem', value: '256MB', description: 'Memory for sorting and hashing operations' },
      { name: 'maintenance_work_mem', value: '512MB', description: 'Memory for maintenance operations' },
      { name: 'effective_cache_size', value: '2GB', description: 'Estimated system cache size' },
      
      // Disk I/O optimizations
      { name: 'random_page_cost', value: '1.1', description: 'Cost of random page access (SSD optimized)' },
      { name: 'seq_page_cost', value: '1.0', description: 'Cost of sequential page access' },
      
      // Query planner optimizations
      { name: 'default_statistics_target', value: '1000', description: 'Statistics detail level for query planning' },
      { name: 'constraint_exclusion', value: 'partition', description: 'Optimize partitioned table queries' },
      
      // Connection and timeout settings
      { name: 'statement_timeout', value: `${dbConfig.statementTimeout}`, description: 'Maximum statement execution time' },
      { name: 'idle_in_transaction_session_timeout', value: `${dbConfig.idleTransactionTimeout}`, description: 'Idle transaction timeout' },
      
      // Analytics-specific optimizations
      { name: 'enable_hashjoin', value: 'on', description: 'Enable hash joins for analytics queries' },
      { name: 'enable_mergejoin', value: 'on', description: 'Enable merge joins for sorted data' },
      { name: 'enable_nestloop', value: 'on', description: 'Enable nested loop joins' },
      { name: 'enable_material', value: 'on', description: 'Enable materialization of subqueries' },
    ];
    
    let appliedCount = 0;
    
    for (const optimization of optimizations) {
      try {
        await this.prisma.$executeRaw`
          SELECT set_config(${optimization.name}, ${optimization.value}, false)
        `;
        
        appliedCount++;
        logger.debug(`Applied optimization: ${optimization.name} = ${optimization.value}`);
        
      } catch (error) {
        this.results.warnings.push(
          `Failed to apply optimization ${optimization.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
    
    this.results.metrics.optimizationsApplied = appliedCount;
    
    // Enable extensions if not already enabled
    try {
      await this.prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS pg_stat_statements`;
      logger.info('📊 pg_stat_statements extension enabled for query monitoring');
    } catch (error) {
      this.results.warnings.push(
        `Failed to enable pg_stat_statements extension: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
    
    try {
      await this.prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
      logger.info('🔍 pg_trgm extension enabled for text search optimization');
    } catch (error) {
      this.results.warnings.push(
        `Failed to enable pg_trgm extension: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
    
    logger.info('✅ Performance optimizations applied', {
      applied: appliedCount,
      total: optimizations.length,
      warnings: this.results.warnings.length,
    });
    
    this.results.tests.performanceOptimization = true;
  }

  private async setupMonitoring(): Promise<void> {
    logger.info('📊 Setting up database monitoring...');
    
    try {
      // Create monitoring views for SEO analysis performance
      await this.createPerformanceViews();
      
      // Set up automated statistics collection
      await this.configureStatistics();
      
      // Test monitoring queries
      await this.testMonitoringQueries();
      
      logger.info('✅ Database monitoring setup completed');
      this.results.tests.monitoring = true;
      
    } catch (error) {
      const errorMessage = `Monitoring setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.results.errors.push(errorMessage);
      logger.error('❌ Monitoring setup failed:', error);
    }
  }

  private async createPerformanceViews(): Promise<void> {
    // View for slow query monitoring
    await this.prisma.$executeRaw`
      CREATE OR REPLACE VIEW slow_queries AS
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows,
        100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
      FROM pg_stat_statements 
      WHERE calls > 10 AND mean_time > 100
      ORDER BY mean_time DESC
      LIMIT 20;
    `;
    
    // View for index usage statistics
    await this.prisma.$executeRaw`
      CREATE OR REPLACE VIEW index_usage AS
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_tup_read,
        idx_tup_fetch,
        idx_scan,
        CASE 
          WHEN idx_scan = 0 THEN 'UNUSED'
          WHEN idx_scan < 100 THEN 'LOW_USAGE'
          ELSE 'ACTIVE'
        END as usage_status
      FROM pg_stat_user_indexes
      ORDER BY idx_scan DESC;
    `;
    
    // View for table statistics relevant to SEO analysis
    await this.prisma.$executeRaw`
      CREATE OR REPLACE VIEW seo_table_stats AS
      SELECT 
        schemaname,
        relname as table_name,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_rows,
        n_dead_tup as dead_rows,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      AND relname IN ('users', 'projects', 'seo_analyses', 'seo_issues', 'seo_recommendations')
      ORDER BY n_live_tup DESC;
    `;
    
    logger.info('📈 Performance monitoring views created');
  }

  private async configureStatistics(): Promise<void> {
    // Update table statistics for better query planning
    const seoTables = [
      'users', 'projects', 'crawl_sessions', 'seo_analyses', 
      'seo_issues', 'seo_recommendations', 'analysis_cache'
    ];
    
    for (const table of seoTables) {
      try {
        await this.prisma.$executeRaw`ANALYZE ${table}`;
      } catch (error) {
        this.results.warnings.push(`Failed to analyze table ${table}: ${error}`);
      }
    }
    
    logger.info('📊 Table statistics updated for query optimization');
  }

  private async testMonitoringQueries(): Promise<void> {
    try {
      // Test slow query monitoring
      const slowQueries = await this.prisma.$queryRaw`
        SELECT * FROM slow_queries LIMIT 5
      `;
      
      // Test index usage monitoring
      const indexUsage = await this.prisma.$queryRaw`
        SELECT * FROM index_usage WHERE usage_status = 'UNUSED' LIMIT 5
      `;
      
      // Test table statistics
      const tableStats = await this.prisma.$queryRaw`
        SELECT * FROM seo_table_stats LIMIT 5
      `;
      
      // Log monitoring results
      logger.info('📊 Monitoring queries tested successfully', {
        slowQueriesFound: Array.isArray(slowQueries) ? slowQueries.length : 0,
        unusedIndexes: Array.isArray(indexUsage) ? indexUsage.length : 0,
        tablesChecked: Array.isArray(tableStats) ? tableStats.length : 0
      });
      
    } catch (error) {
      this.results.warnings.push(
        `Monitoring query test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getHealthReport(): Promise<any> {
    try {
      const [connectionStats, cacheStats, indexStats, queryStats] = await Promise.all([
        // Connection statistics
        this.prisma.$queryRaw`
          SELECT 
            datname,
            numbackends as active_connections,
            xact_commit as committed_transactions,
            xact_rollback as rolled_back_transactions
          FROM pg_stat_database 
          WHERE datname = current_database()
        `,
        
        // Cache hit ratio
        this.prisma.$queryRaw`
          SELECT 
            round(
              (sum(blks_hit) * 100.0 / nullif(sum(blks_hit) + sum(blks_read), 0))::numeric, 
              2
            ) as cache_hit_ratio
          FROM pg_stat_database
        `,
        
        // Index usage
        this.prisma.$queryRaw`
          SELECT 
            COUNT(*) as total_indexes,
            COUNT(*) FILTER (WHERE idx_scan > 0) as used_indexes,
            COUNT(*) FILTER (WHERE idx_scan = 0) as unused_indexes
          FROM pg_stat_user_indexes
        `,
        
        // Recent query performance
        this.prisma.$queryRaw`
          SELECT 
            COUNT(*) as total_queries,
            AVG(mean_time) as avg_query_time,
            COUNT(*) FILTER (WHERE mean_time > 1000) as slow_queries
          FROM pg_stat_statements
          WHERE calls > 1
        ` 
      ]);
      
      return {
        connection: connectionStats,
        cache: cacheStats,
        indexes: indexStats,
        queries: queryStats,
        timestamp: new Date(),
      };
      
    } catch (error) {
      logger.error('Failed to generate health report:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Main execution function
async function main(): Promise<void> {
  const setup = new DatabaseSetup();
  
  try {
    const results = await setup.run();
    
    if (results.success) {
      console.log('\n🎉 Database setup completed successfully!');
      console.log('\n📊 Setup Results:');
      console.log(`├── Connection Time: ${results.metrics.connectionTime}ms`);
      console.log(`├── Query Response Time: ${results.metrics.queryResponseTime}ms`);
      console.log(`├── Indexes Found: ${results.metrics.indexCount}`);
      console.log(`├── Optimizations Applied: ${results.metrics.optimizationsApplied}`);
      console.log(`└── Warnings: ${results.warnings.length}`);
      
      if (results.warnings.length > 0) {
        console.log('\n⚠️ Warnings:');
        results.warnings.forEach(warning => console.log(`   • ${warning}`));
      }
      
      // Generate health report
      const healthReport = await setup.getHealthReport();
      console.log('\n💊 Database Health Report:');
      console.log(JSON.stringify(healthReport, null, 2));
      
      process.exit(0);
    } else {
      console.log('\n❌ Database setup failed!');
      console.log('\n🚨 Errors:');
      results.errors.forEach(error => console.log(`   • ${error}`));
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Setup script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { DatabaseSetup, type DatabaseSetupResult }; 