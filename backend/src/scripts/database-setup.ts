#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { databaseManager } from '../config/database';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    logger.info('🚀 Starting database setup and optimization...');

    // 1. Test database connection
    logger.info('1. Testing database connection...');
    await databaseManager.connect();
    logger.info('✅ Database connection successful');

    // 2. Run database optimizations for SEO analysis workloads
    logger.info('2. Applying database optimizations...');
    await applyDatabaseOptimizations();
    logger.info('✅ Database optimizations applied');

    // 3. Validate schema and indexes
    logger.info('3. Validating database schema...');
    await validateSchema();
    logger.info('✅ Schema validation complete');

    // 4. Check indexes for performance
    logger.info('4. Validating indexes...');
    await validateIndexes();
    logger.info('✅ Index validation complete');

    // 5. Run performance tests
    logger.info('5. Running performance tests...');
    await runPerformanceTests();
    logger.info('✅ Performance tests complete');

    // 6. Setup monitoring
    logger.info('6. Setting up monitoring...');
    await setupMonitoring();
    logger.info('✅ Monitoring setup complete');

    logger.info('🎉 Database setup completed successfully!');

  } catch (error) {
    logger.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function applyDatabaseOptimizations() {
  const optimizations = [
    // Memory optimizations for SEO analysis workloads
    "SET work_mem = '256MB'",
    "SET shared_buffers = '128MB'",
    "SET effective_cache_size = '1GB'",
    
    // Performance optimizations
    "SET random_page_cost = 1.1", // SSD optimized
    "SET seq_page_cost = 1.0",
    "SET cpu_tuple_cost = 0.01",
    
    // Connection optimizations
    "SET max_connections = 100",
    "SET checkpoint_completion_target = 0.9",
    
    // Query optimization
    "SET enable_hashjoin = on",
    "SET enable_mergejoin = on",
    "SET enable_nestloop = on",
  ];

  for (const query of optimizations) {
    try {
      await prisma.$executeRaw`${query}`;
      logger.debug(`Applied: ${query}`);
    } catch (error) {
      logger.warn(`Failed to apply optimization: ${query}`, error);
    }
  }
}

async function validateSchema() {
  // Check if all required tables exist
  const tables = [
    'users', 'refresh_tokens', 'projects', 'crawl_sessions',
    'seo_analyses', 'seo_issues', 'seo_recommendations',
    'meta_tags', 'analysis_cache'
  ];

  const existingTables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  `;

  const existingTableNames = existingTables.map(t => t.tablename);
  const missingTables = tables.filter(table => !existingTableNames.includes(table));

  if (missingTables.length > 0) {
    throw new Error(`Missing required tables: ${missingTables.join(', ')}`);
  }

  logger.info(`✅ All ${tables.length} required tables exist`);
}

async function validateIndexes() {
  // Check critical indexes for performance
  const criticalIndexes = [
    { table: 'projects', column: 'user_id' },
    { table: 'seo_analyses', column: 'project_id' },
    { table: 'seo_issues', column: 'analysis_id' },
    { table: 'seo_issues', column: 'severity' },
    { table: 'analysis_cache', column: 'url_hash' },
    { table: 'crawl_sessions', column: 'status' },
  ];

  const indexes = await prisma.$queryRaw<{
    tablename: string;
    indexname: string;
    indexdef: string;
  }[]>`
    SELECT 
      t.relname as tablename,
      i.relname as indexname,
      pg_get_indexdef(i.oid) as indexdef
    FROM pg_class t
    JOIN pg_index ix ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    WHERE t.relkind = 'r'
    AND t.relname IN (${criticalIndexes.map(ci => `'${ci.table}'`).join(',')})
  `;

  logger.info(`Found ${indexes.length} indexes on critical tables`);

  // Check for missing critical indexes
  for (const criticalIndex of criticalIndexes) {
    const hasIndex = indexes.some(idx => 
      idx.tablename === criticalIndex.table && 
      idx.indexdef.includes(criticalIndex.column)
    );

    if (!hasIndex) {
      logger.warn(`⚠️  Missing index on ${criticalIndex.table}.${criticalIndex.column}`);
    }
  }
}

async function runPerformanceTests() {
  const startTime = Date.now();

  // Test 1: Basic query performance
  logger.info('Running basic query test...');
  const userCount = await prisma.user.count();
  const basicQueryTime = Date.now() - startTime;
  
  if (basicQueryTime > 1000) {
    logger.warn(`⚠️  Basic query took ${basicQueryTime}ms (should be < 1000ms)`);
  } else {
    logger.info(`✅ Basic query: ${basicQueryTime}ms (${userCount} users)`);
  }

  // Test 2: Complex join performance
  logger.info('Running complex query test...');
  const complexStart = Date.now();
  const analysisWithProjects = await prisma.sEOAnalysis.findMany({
    include: {
      project: true,
      issues: true,
    },
    take: 10,
  });
  const complexQueryTime = Date.now() - complexStart;

  if (complexQueryTime > 3000) {
    logger.warn(`⚠️  Complex query took ${complexQueryTime}ms (should be < 3000ms)`);
  } else {
    logger.info(`✅ Complex query: ${complexQueryTime}ms (${analysisWithProjects.length} results)`);
  }

  // Test 3: Transaction performance
  logger.info('Running transaction test...');
  const transactionStart = Date.now();
  await prisma.$transaction(async (tx) => {
    await tx.user.findFirst();
    await tx.project.findFirst();
    await tx.sEOAnalysis.findFirst();
  });
  const transactionTime = Date.now() - transactionStart;

  if (transactionTime > 2000) {
    logger.warn(`⚠️  Transaction took ${transactionTime}ms (should be < 2000ms)`);
  } else {
    logger.info(`✅ Transaction: ${transactionTime}ms`);
  }
}

async function setupMonitoring() {
  try {
    // Enable pg_stat_statements if available
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS pg_stat_statements`;
    logger.info('✅ pg_stat_statements extension enabled');
  } catch (error) {
    logger.warn('Could not enable pg_stat_statements:', error);
  }

  // Create monitoring views
  try {
    await prisma.$executeRaw`
      CREATE OR REPLACE VIEW database_stats AS
      SELECT 
        (SELECT count(*) FROM users) as total_users,
        (SELECT count(*) FROM projects) as total_projects,
        (SELECT count(*) FROM seo_analyses) as total_analyses,
        (SELECT count(*) FROM seo_issues WHERE severity = 'critical') as critical_issues,
        (SELECT pg_size_pretty(pg_database_size(current_database()))) as database_size,
        now() as last_updated
    `;
    logger.info('✅ Monitoring views created');
  } catch (error) {
    logger.warn('Could not create monitoring views:', error);
  }
}

// Add data validation functions
async function validateDataIntegrity() {
  logger.info('Validating data integrity...');

  // Check for orphaned records
  const orphanedIssues = await prisma.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*) as count
    FROM seo_issues si
    LEFT JOIN seo_analyses sa ON si.analysis_id = sa.id
    WHERE sa.id IS NULL
  `;

  if (orphanedIssues[0]?.count > 0) {
    logger.warn(`⚠️  Found ${orphanedIssues[0].count} orphaned issues`);
  }

  // Check for invalid scores
  const invalidScores = await prisma.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*) as count
    FROM seo_analyses
    WHERE overall_score < 0 OR overall_score > 100
  `;

  if (invalidScores[0]?.count > 0) {
    logger.warn(`⚠️  Found ${invalidScores[0].count} invalid scores`);
  }

  logger.info('✅ Data integrity validation complete');
}

// Export for use in other scripts
export {
  setupDatabase,
  applyDatabaseOptimizations,
  validateSchema,
  validateIndexes,
  runPerformanceTests,
  setupMonitoring,
  validateDataIntegrity
};

// Run if called directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      logger.info('🎉 Database setup script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Database setup script failed:', error);
      process.exit(1);
    });
} 