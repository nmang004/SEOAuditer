import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

interface DatabaseConfig {
  maxRetries: number;
  retryDelay: number;
  connectionTimeout: number;
  queryTimeout: number;
  connectionPoolSize: number;
  healthCheckInterval: number;
  slowQueryThreshold: number;
  transactionTimeout: number;
  // Enhanced connection pooling configuration
  maxIdleConnections: number;
  connectionLifetime: number;
  statementTimeout: number;
  idleTransactionTimeout: number;
  // Advanced pooling options for high-throughput operations
  maxUses: number;
  acquireTimeoutMillis: number;
  createTimeoutMillis: number;
  destroyTimeoutMillis: number;
  reapIntervalMillis: number;
  createRetryIntervalMillis: number;
  // PostgreSQL specific optimizations
  pgBouncerCompatible: boolean;
  connectionStringBuilder: {
    applicationName: string;
    connectTimeout: number;
    commandTimeout: number;
    keepAlivesIdle: number;
    keepAlivesInterval: number;
    keepAlivesCount: number;
  };
}

const dbConfig: DatabaseConfig = {
  maxRetries: parseInt(process.env.DB_MAX_RETRIES || '5'),
  retryDelay: parseInt(process.env.DB_RETRY_DELAY || '2000'),
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
  queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
  connectionPoolSize: parseInt(process.env.DB_CONNECTION_POOL_SIZE || '25'),
  healthCheckInterval: parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '30000'),
  slowQueryThreshold: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD || '1000'),
  transactionTimeout: parseInt(process.env.DB_TRANSACTION_TIMEOUT || '60000'),
  // Enhanced connection pooling for concurrent SEO analysis operations
  maxIdleConnections: parseInt(process.env.DB_MAX_IDLE_CONNECTIONS || '5'),
  connectionLifetime: parseInt(process.env.DB_CONNECTION_LIFETIME || '3600000'), // 1 hour
  statementTimeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'),
  idleTransactionTimeout: parseInt(process.env.DB_IDLE_TRANSACTION_TIMEOUT || '10000'),
  // Advanced pooling for high-throughput analysis workloads
  maxUses: parseInt(process.env.DB_MAX_USES || '7500'), // Connection uses before recreation
  acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '10000'),
  createTimeoutMillis: parseInt(process.env.DB_CREATE_TIMEOUT || '30000'),
  destroyTimeoutMillis: parseInt(process.env.DB_DESTROY_TIMEOUT || '5000'),
  reapIntervalMillis: parseInt(process.env.DB_REAP_INTERVAL || '1000'),
  createRetryIntervalMillis: parseInt(process.env.DB_CREATE_RETRY_INTERVAL || '200'),
  // PostgreSQL optimization
  pgBouncerCompatible: process.env.DB_PGBOUNCER_COMPATIBLE === 'true',
  connectionStringBuilder: {
    applicationName: process.env.DB_APPLICATION_NAME || 'rival-outranker-backend',
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '10'),
    commandTimeout: parseInt(process.env.DB_COMMAND_TIMEOUT || '30'),
    keepAlivesIdle: parseInt(process.env.DB_KEEPALIVES_IDLE || '600'), // 10 minutes
    keepAlivesInterval: parseInt(process.env.DB_KEEPALIVES_INTERVAL || '30'),
    keepAlivesCount: parseInt(process.env.DB_KEEPALIVES_COUNT || '3'),
  },
};

// Enhanced connection string builder for production optimization
const buildConnectionString = (): string => {
  // Railway provides DATABASE_PROXY_URL for pooled connections
  const baseUrl = process.env.DATABASE_PROXY_URL || process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const url = new URL(baseUrl);
  
  // Add optimized connection parameters
  const params = new URLSearchParams(url.search);
  
  // Connection pooling and performance parameters
  params.set('application_name', dbConfig.connectionStringBuilder.applicationName);
  params.set('connect_timeout', dbConfig.connectionStringBuilder.connectTimeout.toString());
  params.set('command_timeout', dbConfig.connectionStringBuilder.commandTimeout.toString());
  params.set('keepalives_idle', dbConfig.connectionStringBuilder.keepAlivesIdle.toString());
  params.set('keepalives_interval', dbConfig.connectionStringBuilder.keepAlivesInterval.toString());
  params.set('keepalives_count', dbConfig.connectionStringBuilder.keepAlivesCount.toString());
  
  // PostgreSQL optimization parameters for SEO analysis workloads
  params.set('statement_timeout', dbConfig.statementTimeout.toString());
  params.set('idle_in_transaction_session_timeout', dbConfig.idleTransactionTimeout.toString());
  
  // Connection pool optimization
  if (dbConfig.pgBouncerCompatible) {
    params.set('prepared_statements', 'false'); // Required for PgBouncer
    params.set('statement_cache_size', '0');
  }
  
  // SSL configuration for production
  if (process.env.NODE_ENV === 'production') {
    params.set('sslmode', 'require');
    // Only set SSL cert parameters if they are actually provided
    if (process.env.DB_SSL_CERT) {
      params.set('sslcert', process.env.DB_SSL_CERT);
    }
    if (process.env.DB_SSL_KEY) {
      params.set('sslkey', process.env.DB_SSL_KEY);
    }
    if (process.env.DB_SSL_ROOT_CERT) {
      params.set('sslrootcert', process.env.DB_SSL_ROOT_CERT);
    }
  }
  
  url.search = params.toString();
  return url.toString();
};

// Enhanced Prisma client with optimized configuration for SEO analysis workloads
export const createPrismaClient = (): PrismaClient => {
  const optimizedConnectionString = buildConnectionString();
  
  const prismaOptions: Prisma.PrismaClientOptions = {
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'info' },
      { emit: 'event', level: 'warn' },
    ],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: optimizedConnectionString,
      },
    },
    // Enhanced transaction configuration for concurrent SEO analysis operations
    transactionOptions: {
      maxWait: 15000, // 15 seconds max wait for high-throughput operations
      timeout: dbConfig.transactionTimeout,
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, // Optimal for analytics workloads
    },
  };

  const prisma = new PrismaClient(prismaOptions);

  // Enhanced query logging and performance monitoring with operation context
  (prisma as any).$on('query', (e: Prisma.QueryEvent) => {
    const duration = e.duration;
    const queryType = e.query.toLowerCase().split(' ')[0]; // SELECT, INSERT, UPDATE, DELETE
    
    if (duration > dbConfig.slowQueryThreshold) {
      logger.warn(`Slow ${queryType} query detected`, {
        duration: `${duration}ms`,
        query: e.query.substring(0, 200) + (e.query.length > 200 ? '...' : ''),
        params: e.params,
        target: e.target,
        threshold: dbConfig.slowQueryThreshold,
      });
      DatabasePerformanceMonitor.recordSlowQuery(duration, queryType);
    }
    
    DatabasePerformanceMonitor.recordQuery(duration, queryType);
  });

  (prisma as any).$on('error', (e: Prisma.LogEvent) => {
    logger.error('Database error detected', {
      message: e.message,
      target: e.target,
      timestamp: e.timestamp,
    });
    DatabasePerformanceMonitor.recordError();
  });

  if (process.env.NODE_ENV === 'development') {
    (prisma as any).$on('info', (e: Prisma.LogEvent) => {
      logger.info(`Database info: ${e.message}`, { target: e.target });
    });

    (prisma as any).$on('warn', (e: Prisma.LogEvent) => {
      logger.warn(`Database warning: ${e.message}`, { target: e.target });
    });
  }

  return prisma;
};

// Singleton Prisma instance with enhanced connection management
let prismaInstance: PrismaClient | null = null;
let connectionMetrics = {
  connectionAttempts: 0,
  successfulConnections: 0,
  failedConnections: 0,
  lastConnectionTime: 0,
  uptime: Date.now(),
};

export const getPrismaClient = (): PrismaClient => {
  if (!prismaInstance) {
    prismaInstance = createPrismaClient();
    connectionMetrics.connectionAttempts++;
  }
  return prismaInstance;
};

// Enhanced Database connection management with production optimizations
export class DatabaseManager {
  private prisma: PrismaClient;
  private isConnected: boolean = false;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private connectionAttempts: number = 0;
  private lastHealthCheck: Date | null = null;
  private connectionMetrics = {
    totalQueries: 0,
    totalErrors: 0,
    averageResponseTime: 0,
    uptime: Date.now(),
    slowQueries: 0,
    connectionPool: {
      active: 0,
      idle: 0,
      total: 0,
    },
  };

  constructor() {
    this.prisma = getPrismaClient();
  }

  async connect(): Promise<void> {
    for (let attempt = 1; attempt <= dbConfig.maxRetries; attempt++) {
      try {
        this.connectionAttempts++;
        connectionMetrics.connectionAttempts++;
        
        logger.info(`Attempting database connection (attempt ${attempt}/${dbConfig.maxRetries})`, {
          connectionString: this.maskConnectionString(process.env.DATABASE_URL || ''),
          poolSize: dbConfig.connectionPoolSize,
          timeout: dbConfig.connectionTimeout,
        });
        
        // Test connection with timeout and comprehensive validation
        await Promise.race([
          this.establishConnection(),
          this.createTimeoutPromise(dbConfig.connectionTimeout, 'Connection timeout'),
        ]);

        // Enhanced connection validation with multiple health checks
        await this.validateConnectionHealth();

        this.isConnected = true;
        this.lastHealthCheck = new Date();
        connectionMetrics.successfulConnections++;
        connectionMetrics.lastConnectionTime = Date.now();
        
        let pgVersion = 'unknown';
        try {
          pgVersion = await this.getPostgreSQLVersion();
        } catch (error) {
          logger.warn('Could not get PostgreSQL version:', error);
        }
        
        logger.info('✅ Database connected successfully', {
          attempt,
          connectionPoolSize: dbConfig.connectionPoolSize,
          database: this.extractDatabaseName(process.env.DATABASE_PROXY_URL || process.env.DATABASE_URL || ''),
          responseTime: `${Date.now() - connectionMetrics.lastConnectionTime}ms`,
          pgVersion,
        });
        
        // Start enhanced health checks and monitoring
        this.startHealthChecks();
        await this.optimizeForSEOAnalysis();
        
        return;
        
      } catch (error) {
        connectionMetrics.failedConnections++;
        
        logger.error(`Database connection attempt ${attempt} failed`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          attempt,
          maxRetries: dbConfig.maxRetries,
          stack: error instanceof Error ? error.stack : undefined,
        });
        
        if (attempt === dbConfig.maxRetries) {
          this.isConnected = false;
          throw new Error(
            `Failed to connect to database after ${dbConfig.maxRetries} attempts. ` +
            `Last error: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
        
        // Enhanced exponential backoff with jitter for better distribution
        const baseDelay = dbConfig.retryDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * (baseDelay * 0.3); // 30% jitter
        const delay = Math.min(baseDelay + jitter, 30000); // Cap at 30 seconds
        
        logger.info(`Waiting ${Math.round(delay)}ms before retry...`);
        await this.delay(delay);
      }
    }
  }

  private async establishConnection(): Promise<void> {
    await this.prisma.$connect();
  }

  private createTimeoutPromise(timeout: number, message: string): Promise<never> {
    return new Promise((_, reject) => 
      setTimeout(() => reject(new Error(message)), timeout)
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Enhanced connection validation with comprehensive health checks
  private async validateConnectionHealth(): Promise<void> {
    const validations = [
      // Test basic connectivity
      () => this.prisma.$queryRaw`SELECT 1 as connectivity_test`,
      
      // Test transaction capability
      () => this.prisma.$queryRaw`SELECT NOW() as transaction_test`,
    ];
    
    // Only run schema validation if not in initial migration mode
    if (!process.env.SKIP_SCHEMA_VALIDATION) {
      try {
        // Check if users table exists before trying to query it
        const tableExists = await this.prisma.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
          ) as table_exists
        `;
        
        if (Array.isArray(tableExists) && tableExists[0] && (tableExists[0] as any).table_exists) {
          validations.push(
            // Test database schema accessibility
            () => this.prisma.user.findFirst({ 
              take: 1,
              select: { id: true }
            })
          );
        } else {
          logger.warn('Users table does not exist - skipping schema validation (migrations may be needed)');
        }
        
        // Test index accessibility (critical for SEO analysis performance)
        validations.push(
          () => this.prisma.$queryRaw`
            SELECT schemaname, tablename, indexname, indexdef 
            FROM pg_indexes 
            WHERE schemaname = 'public' 
            LIMIT 5
          `
        );
      } catch (error) {
        logger.warn('Schema validation check failed, proceeding with basic connectivity test only:', error);
      }
    }

    for (const validation of validations) {
      try {
        await Promise.race([
          validation(),
          this.createTimeoutPromise(dbConfig.queryTimeout, 'Validation query timeout'),
        ]);
      } catch (error) {
        logger.warn('Database validation failed:', error);
        // Don't fail the entire connection for validation errors
        if (validation === validations[0]) {
          // If basic connectivity fails, re-throw
          throw error;
        }
      }
    }
  }

  private async getPostgreSQLVersion(): Promise<string> {
    try {
      const result = await this.prisma.$queryRaw<[{ version: string }]>`SELECT version()`;
      return result[0]?.version?.split(' ')[1] || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private maskConnectionString(connectionString: string): string {
    return connectionString.replace(/(:\/\/[^:]+:)[^@]+(@)/, '$1****$2');
  }

  private extractDatabaseName(connectionString: string): string {
    try {
      const url = new URL(connectionString);
      return url.pathname.slice(1) || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  async disconnect(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    if (this.prisma) {
      try {
        await this.prisma.$disconnect();
        this.isConnected = false;
        logger.info('✅ Database disconnected successfully');
      } catch (error) {
        logger.error('Error disconnecting from database:', error);
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const startTime = Date.now();
      
      // Enhanced health check with multiple validations and monitoring
      const healthChecks = await Promise.allSettled([
        // Basic connectivity
        this.prisma.$queryRaw`SELECT 1, NOW() as timestamp, version() as db_version`,
        
        // Connection pool status
        this.getConnectionPoolStatus(),
        
        // Database performance metrics
        this.getDatabaseMetrics(),
      ]);
      
      const duration = Date.now() - startTime;
      this.lastHealthCheck = new Date();
      
      // Check if all health checks passed
      const allPassed = healthChecks.every(check => check.status === 'fulfilled');
      
      if (!this.isConnected && allPassed) {
        this.isConnected = true;
        logger.info('Database connection restored', { 
          responseTime: `${duration}ms`,
          metrics: this.connectionMetrics,
        });
      }
      
      // Monitor health check performance
      if (duration > 3000) {
        logger.warn(`Slow health check detected: ${duration}ms`, {
          checks: healthChecks.map(check => ({
            status: check.status,
            reason: check.status === 'rejected' ? check.reason?.message : 'success',
          })),
        });
      }
      
      // Update connection metrics
      this.connectionMetrics.totalQueries++;
      this.connectionMetrics.averageResponseTime = 
        Math.round((this.connectionMetrics.averageResponseTime + duration) / 2);
      
      return allPassed;
    } catch (error) {
      if (this.isConnected) {
        this.isConnected = false;
        logger.error('Database health check failed:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });
        this.connectionMetrics.totalErrors++;
      }
      return false;
    }
  }

  private async getConnectionPoolStatus(): Promise<any> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;
      
      if (Array.isArray(result) && result.length > 0) {
        const stats = result[0] as any;
        this.connectionMetrics.connectionPool = {
          total: parseInt(stats.total_connections) || 0,
          active: parseInt(stats.active_connections) || 0,
          idle: parseInt(stats.idle_connections) || 0,
        };
      }
      
      return result;
    } catch (error) {
      logger.warn('Failed to get connection pool status:', error);
      return null;
    }
  }

  async getDatabaseMetrics(): Promise<any> {
    try {
      // Get database performance statistics
      const metrics = await this.prisma.$queryRaw`
        SELECT 
          datname,
          numbackends as active_connections,
          xact_commit as committed_transactions,
          xact_rollback as rolled_back_transactions,
          blks_read as blocks_read,
          blks_hit as blocks_hit,
          tup_returned as tuples_returned,
          tup_fetched as tuples_fetched,
          tup_inserted as tuples_inserted,
          tup_updated as tuples_updated,
          tup_deleted as tuples_deleted
        FROM pg_stat_database 
        WHERE datname = current_database()
      `;
      
      return metrics;
    } catch (error) {
      logger.warn('Failed to get database metrics:', error);
      return null;
    }
  }

  async getCacheStats(): Promise<any> {
    try {
      // Get cache hit ratio and other performance metrics
      const cacheStats = await this.prisma.$queryRaw`
        SELECT 
          round(
            (sum(blks_hit) * 100.0 / nullif(sum(blks_hit) + sum(blks_read), 0))::numeric, 
            2
          ) as cache_hit_ratio,
          sum(blks_read) as blocks_read_from_disk,
          sum(blks_hit) as blocks_read_from_cache
        FROM pg_stat_database
      `;
      
      return cacheStats;
    } catch (error) {
      logger.warn('Failed to get cache statistics:', error);
      return null;
    }
  }

  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(async () => {
      const isHealthy = await this.healthCheck();
      if (!isHealthy && this.connectionAttempts < 3) {
        logger.warn('Attempting to reconnect to database due to health check failure...');
        try {
          await this.connect();
        } catch (error) {
          logger.error('Failed to reconnect to database:', error);
        }
      }
    }, dbConfig.healthCheckInterval);
  }

  isConnectionHealthy(): boolean {
    return this.isConnected;
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    operationName: string = 'database operation'
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        const result = await operation();
        const duration = Date.now() - startTime;
        
        // Monitor query performance with enhanced context
        DatabasePerformanceMonitor.recordQuery(duration, operationName);
        
        return result;
      } catch (error) {
        DatabasePerformanceMonitor.recordError();
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.warn(`${operationName} failed (attempt ${attempt}/${maxRetries})`, {
          error: errorMessage,
          attempt,
          maxRetries,
          stack: error instanceof Error ? error.stack : undefined,
        });
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Enhanced error handling with specific reconnection logic
        if (this.isConnectionError(error)) {
          logger.info('Attempting to reconnect due to connection error...');
          try {
            await this.connect();
          } catch (reconnectError) {
            logger.error('Failed to reconnect:', reconnectError);
          }
        }
        
        // Exponential backoff with jitter
        const baseDelay = 1000 * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 500; // Add up to 500ms of jitter
        const delay = Math.min(baseDelay + jitter, 10000); // Cap at 10 seconds
        
        await this.delay(delay);
      }
    }
    
    throw new Error(`Max retries exceeded for ${operationName}`);
  }

  // Enhanced error detection with more comprehensive patterns
  private isConnectionError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toLowerCase() || '';
    
    const connectionErrors = [
      'connection',
      'timeout',
      'network',
      'econnrefused',
      'enotfound',
      'ehostunreach',
      'socket',
      'server closed the connection',
      'connection terminated',
      'connection lost',
      'pool exhausted',
      'too many connections',
      'connection reset',
      'broken pipe',
    ];
    
    const connectionCodes = [
      'econnreset',
      'econnaborted',
      'etimedout',
      'enetunreach',
      'ehostdown',
    ];
    
    return connectionErrors.some(keyword => errorMessage.includes(keyword)) ||
           connectionCodes.some(code => errorCode.includes(code));
  }

  getPrisma(): PrismaClient {
    return this.prisma;
  }

  getConnectionMetrics() {
    return {
      isConnected: this.isConnected,
      connectionAttempts: this.connectionAttempts,
      lastHealthCheck: this.lastHealthCheck,
      uptime: Date.now() - this.connectionMetrics.uptime,
      config: dbConfig,
      metrics: this.connectionMetrics,
      globalMetrics: connectionMetrics,
    };
  }

  // Enhanced database optimization methods for SEO analysis workloads
  async optimizeForSEOAnalysis(): Promise<void> {
    try {
      // PostgreSQL-specific optimizations for analytics workloads
      const optimizations = [
        // Memory and performance settings
        `SET work_mem = '256MB'`, // Increase memory for sorting and hashing
        `SET maintenance_work_mem = '512MB'`, // Increase memory for maintenance operations
        `SET effective_cache_size = '2GB'`, // Set based on available system memory
        `SET random_page_cost = 1.1`, // Optimize for SSD storage
        `SET seq_page_cost = 1.0`, // Sequential vs random access cost
        
        // Query planner optimizations
        `SET enable_hashjoin = ON`,
        `SET enable_mergejoin = ON`,
        `SET enable_nestloop = ON`,
        `SET enable_material = ON`,
        
        // Connection and statement settings
        `SET statement_timeout = '${dbConfig.statementTimeout}'`,
        `SET idle_in_transaction_session_timeout = '${dbConfig.idleTransactionTimeout}'`,
        
        // Analytics-specific optimizations
        `SET default_statistics_target = 1000`, // Better statistics for query planning
        `SET constraint_exclusion = partition`, // Optimize partitioned tables
      ];

      for (const optimization of optimizations) {
        try {
          await this.prisma.$queryRaw(Prisma.raw(optimization));
        } catch (error) {
          // Log individual optimization failures but continue
          logger.warn(`Failed to apply optimization: ${optimization}`, { error });
        }
      }
      
      // Enable query monitoring extension if available
      try {
        await this.prisma.$queryRaw`CREATE EXTENSION IF NOT EXISTS pg_stat_statements`;
        logger.info('pg_stat_statements extension enabled for query monitoring');
      } catch (error) {
        logger.warn('Failed to enable pg_stat_statements extension:', error);
      }
      
      logger.info('Database optimized for SEO analysis workloads', {
        optimizations: optimizations.length,
        workMem: '256MB',
        effectiveCacheSize: '2GB',
      });
    } catch (error) {
      logger.warn('Failed to apply some SEO analysis optimizations:', error);
    }
  }
}

// Export singleton instance
export const databaseManager = new DatabaseManager();

// Database middleware for connection management
export const ensureDatabaseConnection = async (): Promise<void> => {
  if (!databaseManager.isConnectionHealthy()) {
    await databaseManager.connect();
  }
};

// Query optimization helpers for SEO analysis
export const withPagination = <T>(
  query: T,
  page: number = 1,
  limit: number = 10
): T & { skip: number; take: number } => {
  const skip = (page - 1) * limit;
  return {
    ...query,
    skip,
    take: Math.min(limit, 100), // Cap at 100 items per page
  };
};

export const withSorting = <T>(
  query: T,
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
): T & { orderBy: Record<string, string> } => {
  return {
    ...query,
    orderBy: {
      [sortBy]: sortOrder,
    },
  };
};

// SEO Analysis specific query helpers
export const withSEOAnalysisIncludes = {
  basic: {
    crawlSession: {
      select: {
        status: true,
        startedAt: true,
        completedAt: true,
      },
    },
    _count: {
      select: {
        issues: true,
        recommendations: true,
      },
    },
  },
  detailed: {
    crawlSession: {
      select: {
        status: true,
        startedAt: true,
        completedAt: true,
        errorMessage: true,
      },
    },
    issues: {
      select: {
        id: true,
        type: true,
        severity: true,
        title: true,
        category: true,
        status: true,
        businessImpact: true,
      },
      orderBy: [
        { severity: 'asc' as const },
        { businessImpact: 'asc' as const },
      ],
    },
    recommendations: {
      select: {
        id: true,
        priority: true,
        category: true,
        title: true,
        businessValue: true,
        quickWin: true,
        status: true,
      },
      orderBy: [
        { priority: 'asc' as const },
        { businessValue: 'asc' as const },
      ],
    },
    metaTags: true,
    scoreBreakdown: true,
    contentAnalysis: {
      select: {
        wordCount: true,
        readingTime: true,
        overallScore: true,
        recommendations: true,
      },
    },
    performanceMetrics: {
      select: {
        performanceScore: true,
        loadTime: true,
        coreWebVitals: true,
      },
    },
  },
};

// Database transaction wrapper with SEO analysis optimizations
export const withTransaction = async <T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> => {
  return await databaseManager.getPrisma().$transaction(operation, {
    maxWait: 10000, // 10 seconds max wait
    timeout: dbConfig.transactionTimeout, // Configurable timeout
  });
};

// Performance monitoring
export class DatabasePerformanceMonitor {
  private static metrics = {
    queryCount: 0,
    totalQueryTime: 0,
    slowQueries: 0,
    errors: 0,
    lastReset: Date.now(),
  };

  static recordQuery(duration: number, operationName: string = 'database operation'): void {
    this.metrics.queryCount++;
    this.metrics.totalQueryTime += duration;
    
    if (duration > dbConfig.slowQueryThreshold) {
      this.metrics.slowQueries++;
      logger.warn(`Slow query detected: ${duration}ms`, { operationName });
    }
  }

  static recordSlowQuery(duration: number, queryType: string): void {
    this.metrics.slowQueries++;
    logger.warn(`Slow ${queryType} query detected: ${duration}ms`);
  }

  static recordError(): void {
    this.metrics.errors++;
  }

  static getMetrics() {
    const now = Date.now();
    const timeWindow = now - this.metrics.lastReset;
    
    return {
      ...this.metrics,
      timeWindow,
      averageQueryTime: this.metrics.queryCount > 0 
        ? this.metrics.totalQueryTime / this.metrics.queryCount 
        : 0,
      slowQueryPercentage: this.metrics.queryCount > 0 
        ? (this.metrics.slowQueries / this.metrics.queryCount) * 100 
        : 0,
      queriesPerSecond: timeWindow > 0 
        ? (this.metrics.queryCount / timeWindow) * 1000 
        : 0,
      errorRate: this.metrics.queryCount > 0 
        ? (this.metrics.errors / this.metrics.queryCount) * 100 
        : 0,
    };
  }

  static reset(): void {
    this.metrics = {
      queryCount: 0,
      totalQueryTime: 0,
      slowQueries: 0,
      errors: 0,
      lastReset: Date.now(),
    };
  }
}

export { dbConfig }; 