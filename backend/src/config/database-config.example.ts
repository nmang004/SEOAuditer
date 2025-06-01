// Database Configuration Example for Production Deployment
// Copy this file to database-config.ts and customize for your environment

export const productionDatabaseConfig = {
  // ============ PRIMARY DATABASE CONFIGURATION ============
  database: {
    // Connection URLs
    url: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/rival_outranker',
    directUrl: process.env.DIRECT_URL || process.env.DATABASE_URL,
    
    // Connection Pool Settings (Critical for Performance)
    pooling: {
      // Maximum number of connections in the pool
      connectionLimit: parseInt(process.env.DB_CONNECTION_POOL_SIZE || '20'),
      
      // Maximum idle connections maintained
      maxIdleConnections: parseInt(process.env.DB_MAX_IDLE_CONNECTIONS || '5'),
      
      // Connection lifetime (1 hour default)
      connectionLifetime: parseInt(process.env.DB_CONNECTION_LIFETIME || '3600000'),
      
      // Pool timeout for getting connections
      poolTimeout: parseInt(process.env.DB_POOL_TIMEOUT || '20000'),
    },

    // Query Performance Settings
    performance: {
      // Statement timeout (30 seconds)
      statementTimeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'),
      
      // Idle transaction timeout (10 seconds)
      idleTransactionTimeout: parseInt(process.env.DB_IDLE_TRANSACTION_TIMEOUT || '10000'),
      
      // Query timeout for individual operations
      queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
      
      // Slow query threshold for monitoring
      slowQueryThreshold: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD || '1000'),
    },

    // Reliability Settings
    reliability: {
      // Maximum retry attempts for failed operations
      maxRetries: parseInt(process.env.DB_MAX_RETRIES || '5'),
      
      // Base delay between retries (exponential backoff)
      retryDelay: parseInt(process.env.DB_RETRY_DELAY || '5000'),
      
      // Connection timeout
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
      
      // Health check interval
      healthCheckInterval: parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '30000'),
      
      // Transaction timeout for long operations
      transactionTimeout: parseInt(process.env.DB_TRANSACTION_TIMEOUT || '60000'),
    }
  },

  // ============ POSTGRESQL SPECIFIC OPTIMIZATIONS ============
  postgresql: {
    // Work memory for complex queries (256MB for SEO analysis)
    workMemory: '256MB',
    
    // Shared buffers (25% of RAM recommended)
    sharedBuffers: '128MB',
    
    // Effective cache size (50-75% of RAM)
    effectiveCacheSize: '1GB',
    
    // Random page cost (SSD optimized)
    randomPageCost: 1.1,
    
    // Checkpoint segments
    checkpointSegments: 32,
    
    // WAL buffers
    walBuffers: '16MB',
    
    // Maintenance work memory
    maintenanceWorkMemory: '512MB',
  },

  // ============ ENVIRONMENT SPECIFIC SETTINGS ============
  environments: {
    development: {
      // Enable detailed logging in development
      logging: {
        query: true,
        error: true,
        info: true,
        warn: true,
      },
      
      // Relaxed timeouts for debugging
      timeouts: {
        query: 60000,
        connection: 60000,
      },
      
      // Connection pool (smaller for development)
      pool: {
        min: 2,
        max: 10,
      }
    },

    production: {
      // Minimal logging in production
      logging: {
        query: false,
        error: true,
        info: false,
        warn: true,
      },
      
      // Strict timeouts for production
      timeouts: {
        query: 30000,
        connection: 30000,
      },
      
      // Optimized connection pool
      pool: {
        min: 5,
        max: 20,
      },
      
      // SSL configuration
      ssl: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
        ca: process.env.DB_SSL_CA,
        cert: process.env.DB_SSL_CERT,
        key: process.env.DB_SSL_KEY,
      }
    },

    test: {
      // Fast settings for testing
      logging: {
        query: false,
        error: true,
        info: false,
        warn: false,
      },
      
      // Short timeouts for tests
      timeouts: {
        query: 5000,
        connection: 10000,
      },
      
      // Minimal pool for tests
      pool: {
        min: 1,
        max: 5,
      }
    }
  },

  // ============ PRISMA SPECIFIC CONFIGURATION ============
  prisma: {
    // Generator options
    generator: {
      binaryTargets: ['native', 'rhel-openssl-1.0.x'],
      previewFeatures: ['multiSchema', 'postgresqlExtensions'],
    },
    
    // Database extensions to enable
    extensions: ['postgis', 'pgcrypto', 'pg_stat_statements'],
    
    // Transaction options
    transaction: {
      isolationLevel: 'ReadCommitted',
      maxWait: 10000,
      timeout: 60000,
    }
  },

  // ============ MONITORING AND OBSERVABILITY ============
  monitoring: {
    // Enable performance monitoring
    enableMetrics: process.env.ENABLE_PERFORMANCE_MONITORING === 'true',
    
    // Query logging threshold
    logSlowQueries: true,
    slowQueryThreshold: 1000,
    
    // Connection monitoring
    monitorConnections: true,
    
    // Health check configuration
    healthCheck: {
      enabled: true,
      interval: 30000,
      timeout: 5000,
    }
  }
};

// ============ CONNECTION STRING BUILDERS ============

export const buildConnectionString = (config: {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  pooling?: boolean;
  connectionLimit?: number;
  poolTimeout?: number;
}) => {
  const params = new URLSearchParams();
  
  if (config.ssl) {
    params.append('sslmode', 'require');
  }
  
  if (config.pooling) {
    params.append('connection_limit', (config.connectionLimit || 20).toString());
    params.append('pool_timeout', (config.poolTimeout || 20).toString());
  }
  
  params.append('schema', 'public');
  
  return `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}?${params.toString()}`;
};

export const buildDirectConnectionString = (config: {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}) => {
  const params = new URLSearchParams();
  
  if (config.ssl) {
    params.append('sslmode', 'require');
  }
  
  params.append('schema', 'public');
  
  return `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}?${params.toString()}`;
};

// ============ VALIDATION HELPERS ============

export const validateDatabaseConfig = () => {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate JWT secret length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  
  // Validate database URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
  }
};

// ============ RUNTIME OPTIMIZATION QUERIES ============

export const optimizationQueries = {
  // Run these queries after connecting to optimize for SEO analysis workloads
  seoAnalysisOptimizations: [
    // Increase work memory for complex aggregations
    "SET work_mem = '256MB'",
    
    // Optimize for read-heavy workloads
    "SET random_page_cost = 1.1",
    
    // Enable JIT compilation for complex queries
    "SET jit = on",
    
    // Optimize checkpoint behavior
    "SET checkpoint_completion_target = 0.9",
  ],
  
  // Monitoring queries
  monitoringQueries: {
    // Check slow queries
    slowQueries: `
      SELECT query, calls, total_time, mean_time, rows
      FROM pg_stat_statements
      WHERE mean_time > 1000
      ORDER BY mean_time DESC
      LIMIT 10
    `,
    
    // Check connection usage
    connectionStats: `
      SELECT 
        state,
        count(*) as count
      FROM pg_stat_activity
      WHERE datname = current_database()
      GROUP BY state
    `,
    
    // Check database size
    databaseSize: `
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as size
    `,
    
    // Check index usage
    indexUsage: `
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats
      WHERE tablename IN ('projects', 'seo_analyses', 'seo_issues')
      ORDER BY tablename, attname
    `
  }
}; 