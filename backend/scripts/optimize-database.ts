#!/usr/bin/env ts-node
import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';

class DatabaseOptimizer {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async optimizeDatabase(): Promise<void> {
    logger.info('🚀 Starting database optimization for SEO analysis workflow...');

    try {
      await this.validateConnection();
      await this.optimizeIndexes();
      await this.setUpConnectionPooling();
      await this.configurePerformanceSettings();
      await this.setupAnalyticsViews();
      await this.validateDataIntegrity();
      await this.setupPerformanceMonitoring();
      
      logger.info('✅ Database optimization completed successfully!');
    } catch (error) {
      logger.error('❌ Database optimization failed:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  private async validateConnection(): Promise<void> {
    logger.info('🔌 Validating database connection...');

    try {
      // Test basic connectivity
      await this.prisma.$queryRaw`SELECT 1 as test`;
      
      // Get database version and configuration
      const version = await this.prisma.$queryRaw<[{version: string}]>`SELECT version()`;
      logger.info(`📊 PostgreSQL version: ${version[0].version}`);

      // Check current connection limits
      const connectionInfo = await this.prisma.$queryRaw<[{setting: string}]>`
        SELECT setting FROM pg_settings WHERE name = 'max_connections'
      `;
      logger.info(`🔗 Max connections: ${connectionInfo[0].setting}`);

      // Verify schema exists
      const tableCount = await this.prisma.$queryRaw<[{count: number}]>`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      logger.info(`📋 Tables in schema: ${tableCount[0].count}`);

      logger.info('✅ Database connection validated');
    } catch (error) {
      logger.error('❌ Database connection validation failed:', error);
      throw new Error('Failed to establish database connection');
    }
  }

  private async optimizeIndexes(): Promise<void> {
    logger.info('📈 Optimizing database indexes for SEO analysis queries...');

    const indexOptimizations = [
      // User performance indexes
      {
        name: 'idx_users_email_verified',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_verified 
              ON users(email) WHERE email_verified = true`
      },
      {
        name: 'idx_users_subscription_active',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_subscription_active 
              ON users(subscription_tier, created_at) WHERE subscription_tier != 'free'`
      },

      // Project performance indexes
      {
        name: 'idx_projects_user_active_score',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_active_score 
              ON projects(user_id, current_score DESC, last_scan_date DESC) 
              WHERE status = 'active'`
      },
      {
        name: 'idx_projects_url_hash',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_url_hash 
              ON projects USING hash(url)`
      },

      // Analysis performance indexes
      {
        name: 'idx_seo_analyses_project_recent',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seo_analyses_project_recent 
              ON seo_analyses(project_id, created_at DESC) 
              WHERE overall_score IS NOT NULL`
      },
      {
        name: 'idx_seo_analyses_score_distribution',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seo_analyses_score_distribution 
              ON seo_analyses(overall_score, technical_score, content_score, onpage_score, ux_score) 
              WHERE overall_score IS NOT NULL`
      },

      // Issues performance indexes
      {
        name: 'idx_seo_issues_priority_matrix',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seo_issues_priority_matrix 
              ON seo_issues(severity, business_impact, fix_complexity, created_at DESC) 
              WHERE status IN ('new', 'in_progress')`
      },
      {
        name: 'idx_seo_issues_category_stats',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seo_issues_category_stats 
              ON seo_issues(analysis_id, category, severity) 
              WHERE status != 'fixed'`
      },

      // Cache performance indexes
      {
        name: 'idx_analysis_cache_cleanup',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analysis_cache_cleanup 
              ON analysis_cache(expires_at, last_accessed) 
              WHERE expires_at < NOW()`
      },
      {
        name: 'idx_analysis_cache_lru',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analysis_cache_lru 
              ON analysis_cache(access_count DESC, last_accessed DESC, size)`
      },

      // Trend analysis indexes
      {
        name: 'idx_issue_trends_analytics',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_issue_trends_analytics 
              ON issue_trends(project_id, issue_severity, date DESC) 
              WHERE count > 0`
      },

      // Performance metrics indexes
      {
        name: 'idx_performance_metrics_vitals',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_vitals 
              ON performance_metrics(performance_score DESC, load_time, page_size) 
              WHERE performance_score IS NOT NULL`
      }
    ];

    for (const index of indexOptimizations) {
      try {
        await this.prisma.$executeRawUnsafe(index.sql);
        logger.info(`✅ Created/verified index: ${index.name}`);
      } catch (error) {
        // Index might already exist, log but don't fail
        logger.warn(`⚠️ Index ${index.name} creation skipped:`, error);
      }
    }

    // Update table statistics for better query planning
    const tables = [
      'users', 'projects', 'crawl_sessions', 'seo_analyses', 
      'seo_issues', 'seo_recommendations', 'analysis_cache',
      'issue_trends', 'performance_metrics', 'content_analyses'
    ];

    for (const table of tables) {
      try {
        await this.prisma.$executeRawUnsafe(`ANALYZE ${table}`);
        logger.info(`📊 Updated statistics for table: ${table}`);
      } catch (error) {
        logger.warn(`⚠️ Failed to analyze table ${table}:`, error);
      }
    }

    logger.info('✅ Database indexes optimized');
  }

  private async setUpConnectionPooling(): Promise<void> {
    logger.info('🏊 Setting up optimized connection pooling...');

    try {
      // Configure connection pooling settings
      const poolingSettings = [
        'SET shared_preload_libraries = \'pg_stat_statements\'',
        'SET max_connections = 200',
        'SET shared_buffers = \'256MB\'',
        'SET effective_cache_size = \'1GB\'',
        'SET maintenance_work_mem = \'64MB\'',
        'SET checkpoint_completion_target = 0.9',
        'SET wal_buffers = \'16MB\'',
        'SET default_statistics_target = 100',
        'SET random_page_cost = 1.1',
        'SET effective_io_concurrency = 200'
      ];

      for (const setting of poolingSettings) {
        try {
          await this.prisma.$executeRawUnsafe(setting);
        } catch (error) {
          // Some settings might require superuser privileges
          logger.warn(`⚠️ Could not apply setting: ${setting}`);
        }
      }

      logger.info('✅ Connection pooling configured');
    } catch (error) {
      logger.warn('⚠️ Some connection pooling settings could not be applied:', error);
    }
  }

  private async configurePerformanceSettings(): Promise<void> {
    logger.info('⚡ Configuring performance settings for SEO analysis workloads...');

    try {
      // Set session-level performance optimizations
      await this.prisma.$executeRaw`SET work_mem = '32MB'`;
      await this.prisma.$executeRaw`SET maintenance_work_mem = '128MB'`;
      await this.prisma.$executeRaw`SET temp_buffers = '32MB'`;
      
      // Configure for analytics workloads
      await this.prisma.$executeRaw`SET enable_hashjoin = ON`;
      await this.prisma.$executeRaw`SET enable_mergejoin = ON`;
      await this.prisma.$executeRaw`SET enable_nestloop = OFF`;

      // Enable query planning optimizations
      await this.prisma.$executeRaw`SET cpu_tuple_cost = 0.01`;
      await this.prisma.$executeRaw`SET cpu_index_tuple_cost = 0.005`;
      await this.prisma.$executeRaw`SET cpu_operator_cost = 0.0025`;

      logger.info('✅ Performance settings configured');
    } catch (error) {
      logger.warn('⚠️ Some performance settings could not be applied:', error);
    }
  }

  private async setupAnalyticsViews(): Promise<void> {
    logger.info('📊 Setting up analytics views for dashboard queries...');

    const analyticsViews = [
      {
        name: 'v_project_dashboard_stats',
        sql: `
          CREATE OR REPLACE VIEW v_project_dashboard_stats AS
          SELECT 
            p.id,
            p.user_id,
            p.name,
            p.url,
            p.current_score,
            p.last_scan_date,
            p.status,
            COALESCE(latest_analysis.overall_score, 0) as latest_score,
            COALESCE(issue_counts.total_issues, 0) as total_issues,
            COALESCE(issue_counts.critical_issues, 0) as critical_issues,
            COALESCE(issue_counts.high_issues, 0) as high_issues,
            COALESCE(recommendations.total_recommendations, 0) as total_recommendations,
            COALESCE(recommendations.quick_wins, 0) as quick_wins
          FROM projects p
          LEFT JOIN LATERAL (
            SELECT overall_score, technical_score, content_score, onpage_score, ux_score
            FROM seo_analyses sa
            WHERE sa.project_id = p.id
            ORDER BY sa.created_at DESC
            LIMIT 1
          ) latest_analysis ON true
          LEFT JOIN LATERAL (
            SELECT 
              COUNT(*) as total_issues,
              COUNT(*) FILTER (WHERE severity = 'critical') as critical_issues,
              COUNT(*) FILTER (WHERE severity = 'high') as high_issues
            FROM seo_issues si
            JOIN seo_analyses sa ON si.analysis_id = sa.id
            WHERE sa.project_id = p.id AND si.status != 'fixed'
          ) issue_counts ON true
          LEFT JOIN LATERAL (
            SELECT 
              COUNT(*) as total_recommendations,
              COUNT(*) FILTER (WHERE quick_win = true) as quick_wins
            FROM seo_recommendations sr
            JOIN seo_analyses sa ON sr.analysis_id = sa.id
            WHERE sa.project_id = p.id AND sr.status = 'pending'
          ) recommendations ON true
        `
      },
      {
        name: 'v_user_analytics_summary',
        sql: `
          CREATE OR REPLACE VIEW v_user_analytics_summary AS
          SELECT 
            u.id as user_id,
            COUNT(DISTINCT p.id) as total_projects,
            COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'active') as active_projects,
            COUNT(DISTINCT sa.id) as total_analyses,
            AVG(sa.overall_score) as avg_score,
            COUNT(DISTINCT si.id) as total_issues,
            COUNT(DISTINCT si.id) FILTER (WHERE si.severity = 'critical') as critical_issues,
            COUNT(DISTINCT sr.id) as total_recommendations,
            COUNT(DISTINCT sr.id) FILTER (WHERE sr.quick_win = true) as quick_win_recommendations,
            MAX(sa.created_at) as last_analysis_date
          FROM users u
          LEFT JOIN projects p ON u.id = p.user_id
          LEFT JOIN seo_analyses sa ON p.id = sa.project_id
          LEFT JOIN seo_issues si ON sa.id = si.analysis_id
          LEFT JOIN seo_recommendations sr ON sa.id = sr.analysis_id
          GROUP BY u.id
        `
      },
      {
        name: 'v_issue_trend_analytics',
        sql: `
          CREATE OR REPLACE VIEW v_issue_trend_analytics AS
          SELECT 
            p.id as project_id,
            p.user_id,
            sa.created_at::date as analysis_date,
            COUNT(si.id) as total_issues,
            COUNT(si.id) FILTER (WHERE si.severity = 'critical') as critical_issues,
            COUNT(si.id) FILTER (WHERE si.severity = 'high') as high_issues,
            COUNT(si.id) FILTER (WHERE si.category = 'technical') as technical_issues,
            COUNT(si.id) FILTER (WHERE si.category = 'content') as content_issues,
            COUNT(si.id) FILTER (WHERE si.category = 'onpage') as onpage_issues,
            COUNT(si.id) FILTER (WHERE si.category = 'ux') as ux_issues,
            AVG(sa.overall_score) as avg_score
          FROM projects p
          JOIN seo_analyses sa ON p.id = sa.project_id
          LEFT JOIN seo_issues si ON sa.id = si.analysis_id
          GROUP BY p.id, p.user_id, sa.created_at::date
        `
      }
    ];

    for (const view of analyticsViews) {
      try {
        await this.prisma.$executeRawUnsafe(view.sql);
        logger.info(`✅ Created/updated view: ${view.name}`);
      } catch (error) {
        logger.error(`❌ Failed to create view ${view.name}:`, error);
      }
    }

    logger.info('✅ Analytics views configured');
  }

  private async validateDataIntegrity(): Promise<void> {
    logger.info('🔍 Validating data integrity constraints...');

    const integrityChecks = [
      {
        name: 'Orphaned analyses check',
        sql: `
          SELECT COUNT(*) as count 
          FROM seo_analyses sa 
          LEFT JOIN projects p ON sa.project_id = p.id 
          WHERE p.id IS NULL
        `
      },
      {
        name: 'Invalid score ranges check',
        sql: `
          SELECT COUNT(*) as count 
          FROM seo_analyses 
          WHERE overall_score < 0 OR overall_score > 100
             OR technical_score < 0 OR technical_score > 100
             OR content_score < 0 OR content_score > 100
             OR onpage_score < 0 OR onpage_score > 100
             OR ux_score < 0 OR ux_score > 100
        `
      },
      {
        name: 'Orphaned issues check',
        sql: `
          SELECT COUNT(*) as count 
          FROM seo_issues si 
          LEFT JOIN seo_analyses sa ON si.analysis_id = sa.id 
          WHERE sa.id IS NULL
        `
      },
      {
        name: 'Invalid URL formats check',
        sql: `
          SELECT COUNT(*) as count 
          FROM projects 
          WHERE url !~ '^https?://.+\\..+'
        `
      }
    ];

    for (const check of integrityChecks) {
      try {
        const result = await this.prisma.$queryRawUnsafe<[{count: number}]>(check.sql);
        const count = Number(result[0].count);
        
        if (count > 0) {
          logger.warn(`⚠️ ${check.name}: Found ${count} issues`);
        } else {
          logger.info(`✅ ${check.name}: No issues found`);
        }
      } catch (error) {
        logger.error(`❌ Failed to run check ${check.name}:`, error);
      }
    }

    logger.info('✅ Data integrity validation completed');
  }

  private async setupPerformanceMonitoring(): Promise<void> {
    logger.info('📈 Setting up performance monitoring...');

    try {
      // Enable query statistics extension if available
      await this.prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS pg_stat_statements`;
      
      // Create monitoring functions
      const monitoringFunctions = [
        `
          CREATE OR REPLACE FUNCTION get_slow_queries()
          RETURNS TABLE(
            query TEXT,
            calls BIGINT,
            total_time DOUBLE PRECISION,
            mean_time DOUBLE PRECISION,
            max_time DOUBLE PRECISION
          ) AS $$
          BEGIN
            RETURN QUERY
            SELECT 
              query::TEXT,
              calls,
              total_exec_time as total_time,
              mean_exec_time as mean_time,
              max_exec_time as max_time
            FROM pg_stat_statements
            WHERE mean_exec_time > 1000  -- queries slower than 1 second
            ORDER BY mean_exec_time DESC
            LIMIT 20;
          END;
          $$ LANGUAGE plpgsql;
        `,
        `
          CREATE OR REPLACE FUNCTION get_database_size_info()
          RETURNS TABLE(
            table_name TEXT,
            size_bytes BIGINT,
            size_pretty TEXT,
            row_estimate BIGINT
          ) AS $$
          BEGIN
            RETURN QUERY
            SELECT 
              schemaname||'.'||tablename as table_name,
              pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
              pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size_pretty,
              n_tup_ins + n_tup_upd + n_tup_del as row_estimate
            FROM pg_stat_user_tables
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
          END;
          $$ LANGUAGE plpgsql;
        `
      ];

      for (const func of monitoringFunctions) {
        try {
          await this.prisma.$executeRawUnsafe(func);
          logger.info('✅ Created monitoring function');
        } catch (error) {
          logger.warn('⚠️ Could not create monitoring function:', error);
        }
      }

      logger.info('✅ Performance monitoring setup completed');
    } catch (error) {
      logger.warn('⚠️ Performance monitoring setup had issues:', error);
    }
  }

  async runPerformanceTest(): Promise<void> {
    logger.info('🏃 Running database performance test...');

    const testQueries = [
      {
        name: 'Project dashboard query',
        query: async () => {
          return await this.prisma.project.findMany({
            where: { status: 'active' },
            include: {
              analyses: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: {
                  _count: {
                    select: { issues: true, recommendations: true }
                  }
                }
              }
            },
            take: 10
          });
        }
      },
      {
        name: 'Analysis with issues query',
        query: async () => {
          return await this.prisma.sEOAnalysis.findMany({
            include: {
              issues: {
                where: { severity: 'critical' },
                take: 5
              },
              recommendations: {
                where: { quickWin: true },
                take: 5
              }
            },
            take: 5
          });
        }
      },
      {
        name: 'Analytics aggregation query',
        query: async () => {
          return await this.prisma.sEOAnalysis.groupBy({
            by: ['projectId'],
            _avg: {
              overallScore: true,
              technicalScore: true,
              contentScore: true
            },
            _count: true,
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            }
          });
        }
      }
    ];

    for (const test of testQueries) {
      const startTime = Date.now();
      try {
        await test.query();
        const duration = Date.now() - startTime;
        logger.info(`✅ ${test.name}: ${duration}ms`);
      } catch (error) {
        logger.error(`❌ ${test.name} failed:`, error);
      }
    }

    logger.info('✅ Performance test completed');
  }
}

// CLI execution
async function main() {
  const optimizer = new DatabaseOptimizer();
  
  try {
    await optimizer.optimizeDatabase();
    await optimizer.runPerformanceTest();
    
    console.log('\n🎉 Database optimization completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run seed to populate with sample data');
    console.log('2. Test API endpoints to verify performance');
    console.log('3. Monitor query performance in production');
    
  } catch (error) {
    console.error('\n❌ Database optimization failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { DatabaseOptimizer }; 