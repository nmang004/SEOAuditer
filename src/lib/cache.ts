import Redis from 'ioredis';
import { LRUCache } from 'lru-cache';
import { logger } from './logger';

// Edge Runtime compatibility
export const runtime = 'nodejs';

// Types
interface CacheEntry<T = any> {
  data: T | string; // Can be compressed (string) or original type
  timestamp: number;
  ttl: number;
  tags: string[];
  version: string;
  compressed?: boolean;
}

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // For cache invalidation
  compress?: boolean; // Compress large payloads
  version?: string; // For cache versioning
  namespace?: string; // Cache namespace
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  totalRequests: number;
  hitRate: number;
  memoryUsage: number;
  redisConnected: boolean;
}

// Performance-optimized caching service
export class AdvancedCacheService {
  private redis: Redis | null = null;
  private memoryCache: LRUCache<string, CacheEntry>;
  private stats: CacheStats;
  private compressionThreshold = 1024; // 1KB
  private defaultTTL = 3600; // 1 hour
  private maxRetries = 3;

  constructor() {
    // Initialize memory cache with optimal settings
    this.memoryCache = new LRUCache({
      max: 1000, // Maximum items
      maxSize: 50 * 1024 * 1024, // 50MB max memory
      sizeCalculation: (value: CacheEntry) => {
        return JSON.stringify(value).length;
      },
      ttl: this.defaultTTL * 1000, // Convert to milliseconds
      allowStale: true,
      updateAgeOnGet: true,
    });

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      totalRequests: 0,
      hitRate: 0,
      memoryUsage: 0,
      redisConnected: false,
    };

    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: this.maxRetries,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
        // Cluster configuration for production
        enableReadyCheck: true,
        // Performance optimizations
        family: 4,
        keyPrefix: 'rival-outranker:',
        db: 0,
      });

      // Connection event handlers
      this.redis.on('connect', () => {
        logger.info('Redis cache connected successfully');
        this.stats.redisConnected = true;
      });

      this.redis.on('error', (error) => {
        logger.error('Redis cache error:', error);
        this.stats.redisConnected = false;
      });

      this.redis.on('close', () => {
        logger.warn('Redis cache connection closed');
        this.stats.redisConnected = false;
      });

      await this.redis.connect();
    } catch (error) {
      logger.error('Failed to initialize Redis cache:', error);
      this.redis = null;
    }
  }

  // Get data with multi-layer fallback
  async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      const fullKey = this.buildKey(key, options.namespace);

      // Layer 1: Memory cache (fastest)
      const memoryEntry = this.memoryCache.get(fullKey);
      if (memoryEntry && this.isValidEntry(memoryEntry)) {
        this.stats.hits++;
        this.updateHitRate();
        logger.debug(`Cache hit (memory): ${fullKey}`);
        return this.deserializeData<T>(memoryEntry.data, memoryEntry.compressed);
      }

      // Layer 2: Redis cache
      if (this.redis && this.stats.redisConnected) {
        const redisData = await this.redis.get(fullKey);
        if (redisData) {
          const entry: CacheEntry = JSON.parse(redisData);
          if (this.isValidEntry(entry)) {
            // Update memory cache for next access
            this.memoryCache.set(fullKey, entry);
            this.stats.hits++;
            this.updateHitRate();
            logger.debug(`Cache hit (Redis): ${fullKey}`);
            return this.deserializeData<T>(entry.data, entry.compressed);
          }
        }
      }

      this.stats.misses++;
      this.updateHitRate();
      logger.debug(`Cache miss: ${fullKey} (${Date.now() - startTime}ms)`);
      return null;

    } catch (error) {
      logger.error('Cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  // Set data in both layers with compression
  async set<T = any>(
    key: string, 
    data: T, 
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const fullKey = this.buildKey(key, options.namespace);
      const ttl = options.ttl || this.defaultTTL;
      const shouldCompress = options.compress || this.shouldCompress(data);
      
      const entry: CacheEntry<T> = {
        data: shouldCompress ? await this.compressData(data) : data,
        timestamp: Date.now(),
        ttl,
        tags: options.tags || [],
        version: options.version || '1.0',
        compressed: shouldCompress,
      };

      // Set in memory cache
      this.memoryCache.set(fullKey, entry, { ttl: ttl * 1000 });

      // Set in Redis with TTL
      if (this.redis && this.stats.redisConnected) {
        await this.redis.setex(fullKey, ttl, JSON.stringify(entry));
        
        // Store tags for invalidation
        if (options.tags && options.tags.length > 0) {
          await this.storeTags(fullKey, options.tags, ttl);
        }
      }

      this.stats.sets++;
      logger.debug(`Cache set: ${fullKey} (compressed: ${shouldCompress})`);

    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  // Intelligent cache invalidation
  async invalidate(key: string, options: CacheOptions = {}): Promise<void> {
    try {
      const fullKey = this.buildKey(key, options.namespace);
      
      // Remove from memory cache
      this.memoryCache.delete(fullKey);
      
      // Remove from Redis
      if (this.redis && this.stats.redisConnected) {
        await this.redis.del(fullKey);
      }

      this.stats.deletes++;
      logger.debug(`Cache invalidated: ${fullKey}`);

    } catch (error) {
      logger.error('Cache invalidation error:', error);
    }
  }

  // Tag-based invalidation
  async invalidateByTags(tags: string[]): Promise<void> {
    if (!this.redis || !this.stats.redisConnected) return;

    try {
      const keysToDelete: string[] = [];
      
      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        const keys = await this.redis.smembers(tagKey);
        keysToDelete.push(...keys);
        
        // Remove the tag set
        await this.redis.del(tagKey);
      }

      // Remove all keys associated with tags
      if (keysToDelete.length > 0) {
        await this.redis.del(...keysToDelete);
        
        // Remove from memory cache
        keysToDelete.forEach(key => this.memoryCache.delete(key));
      }

      this.stats.deletes += keysToDelete.length;
      logger.info(`Invalidated ${keysToDelete.length} cache entries by tags: ${tags.join(', ')}`);

    } catch (error) {
      logger.error('Tag-based cache invalidation error:', error);
    }
  }

  // Cache analytics data with smart TTL
  async cacheAnalysisResult(
    projectId: string,
    url: string,
    analysisType: 'standard' | 'enhanced',
    result: any
  ): Promise<void> {
    const key = `analysis:${projectId}:${analysisType}:${this.hashUrl(url)}`;
    const ttl = analysisType === 'enhanced' ? 7200 : 3600; // 2h for enhanced, 1h for standard
    
    await this.set(key, result, {
      ttl,
      tags: [`project:${projectId}`, `analysis:${analysisType}`, 'results'],
      version: '2.0',
      compress: true,
    });
  }

  // Cache dashboard data with short TTL
  async cacheDashboardData(userId: string, data: any): Promise<void> {
    const key = `dashboard:${userId}`;
    await this.set(key, data, {
      ttl: 300, // 5 minutes
      tags: [`user:${userId}`, 'dashboard'],
      version: '1.0',
    });
  }

  // Cache trend data with medium TTL
  async cacheTrendData(projectId: string, period: string, data: any): Promise<void> {
    const key = `trends:${projectId}:${period}`;
    await this.set(key, data, {
      ttl: 1800, // 30 minutes
      tags: [`project:${projectId}`, 'trends'],
      version: '1.0',
    });
  }

  // Warm cache with critical data
  async warmCache(criticalData: Array<{ key: string; data: any; options?: CacheOptions }>): Promise<void> {
    logger.info(`Warming cache with ${criticalData.length} entries`);
    
    const promises = criticalData.map(({ key, data, options }) =>
      this.set(key, data, { ...options, ttl: (options?.ttl || this.defaultTTL) * 2 })
    );

    await Promise.allSettled(promises);
    logger.info('Cache warming completed');
  }

  // Clear expired entries
  async cleanup(): Promise<void> {
    try {
      // Memory cache has automatic cleanup
      this.memoryCache.purgeStale();
      
      // Update memory usage stats
      this.stats.memoryUsage = this.memoryCache.calculatedSize || 0;
      
      logger.debug('Cache cleanup completed');
    } catch (error) {
      logger.error('Cache cleanup error:', error);
    }
  }

  // Get cache statistics
  getStats(): CacheStats {
    return {
      ...this.stats,
      memoryUsage: this.memoryCache.calculatedSize || 0,
    };
  }

  // Reset statistics
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      totalRequests: 0,
      hitRate: 0,
      memoryUsage: 0,
      redisConnected: this.stats.redisConnected,
    };
  }

  // Utility methods
  private buildKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }

  private hashUrl(url: string): string {
    // Simple hash function for URLs
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private isValidEntry(entry: CacheEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) < (entry.ttl * 1000);
  }

  private shouldCompress(data: any): boolean {
    const size = JSON.stringify(data).length;
    return size > this.compressionThreshold;
  }

  private async compressData(data: any): Promise<string> {
    // Simple compression using JSON stringify with reduced precision
    return JSON.stringify(data);
  }

  private deserializeData<T>(data: any, compressed?: boolean): T {
    if (compressed && typeof data === 'string') {
      return JSON.parse(data);
    }
    return data;
  }

  private async storeTags(key: string, tags: string[], ttl: number): Promise<void> {
    if (!this.redis) return;

    const promises = tags.map(tag => {
      const tagKey = `tag:${tag}`;
      return this.redis!.sadd(tagKey, key).then(() => 
        this.redis!.expire(tagKey, ttl)
      );
    });

    await Promise.all(promises);
  }

  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests) * 100 
      : 0;
  }

  // Graceful shutdown
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
      this.redis = null;
    }
    this.memoryCache.clear();
    logger.info('Cache service disconnected');
  }
}

// Singleton instance
export const cacheService = new AdvancedCacheService();

// Utility functions for common caching patterns
export const cacheUtils = {
  // Generate cache keys
  analysisKey: (projectId: string, url: string, type: string) => 
    `analysis:${projectId}:${type}:${Buffer.from(url).toString('base64')}`,
  
  dashboardKey: (userId: string) => `dashboard:${userId}`,
  
  trendsKey: (projectId: string, period: string) => `trends:${projectId}:${period}`,
  
  // Cache tags
  projectTags: (projectId: string) => [`project:${projectId}`],
  
  userTags: (userId: string) => [`user:${userId}`],
  
  // Cache with automatic key generation
  async cacheAnalysis(projectId: string, url: string, type: string, data: any, ttl = 3600) {
    const key = this.analysisKey(projectId, url, type);
    await cacheService.set(key, data, {
      ttl,
      tags: [...this.projectTags(projectId), `analysis:${type}`],
      compress: true,
    });
    return key;
  },

  async getCachedAnalysis(projectId: string, url: string, type: string) {
    const key = this.analysisKey(projectId, url, type);
    return await cacheService.get(key);
  },
};

export default cacheService; 