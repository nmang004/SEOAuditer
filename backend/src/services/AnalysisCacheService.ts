import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // For cache invalidation
  compress?: boolean;
  version?: string;
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  avgResponseTime: number;
  expiredEntries: number;
  popularKeys: Array<{ key: string; accessCount: number; lastAccessed: Date }>;
}

export class AnalysisCacheService {
  private prisma: PrismaClient;
  private memoryCache: Map<string, any>;
  private cacheStats: {
    hits: number;
    misses: number;
    totalRequests: number;
    responseTime: number[];
  };

  constructor() {
    this.prisma = new PrismaClient();
    this.memoryCache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      responseTime: []
    };
  }

  /**
   * Generate a cache key from various parameters
   */
  private generateKey(namespace: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result: Record<string, any>, key) => {
        result[key] = params[key];
        return result;
      }, {});

    const paramString = JSON.stringify(sortedParams);
    const hash = createHash('md5').update(paramString).digest('hex');
    return `${namespace}:${hash}`;
  }

  /**
   * Generate URL hash for database lookups
   */
  private generateUrlHash(url: string): string {
    return createHash('md5').update(url).digest('hex');
  }

  /**
   * Calculate data size in bytes
   */
  private calculateSize(data: any): number {
    return Buffer.byteLength(JSON.stringify(data), 'utf8');
  }

  /**
   * Get data from cache with multiple fallback layers
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    this.cacheStats.totalRequests++;

    try {
      // Layer 1: Memory cache (fastest)
      if (this.memoryCache.has(key)) {
        const entry = this.memoryCache.get(key);
        if (entry && entry.expiresAt > new Date()) {
          this.cacheStats.hits++;
          this.recordResponseTime(Date.now() - startTime);
          return entry.data;
        } else {
          this.memoryCache.delete(key);
        }
      }

      // Layer 2: Database cache - Use urlHash as unique identifier
      const urlHash = this.generateUrlHash(key);
      const cacheEntry = await this.prisma.analysisCache.findFirst({
        where: { 
          urlHash: urlHash,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (cacheEntry) {
        // Store in memory cache for next time - use analysisData field
        this.memoryCache.set(key, {
          data: cacheEntry.analysisData,
          expiresAt: cacheEntry.expiresAt
        });

        this.cacheStats.hits++;
        this.recordResponseTime(Date.now() - startTime);
        return cacheEntry.analysisData as T;
      }

      this.cacheStats.misses++;
      this.recordResponseTime(Date.now() - startTime);
      return null;

    } catch (error) {
      console.error('Cache get error:', error);
      this.cacheStats.misses++;
      return null;
    }
  }

  /**
   * Store data in cache with multiple layers
   */
  async set(
    key: string, 
    data: any, 
    options: CacheOptions = {}
  ): Promise<void> {
    const {
      ttl = 3600, // Default 1 hour
      tags = [],
      compress = false,
      version = '1.0'
    } = options;

    const expiresAt = new Date(Date.now() + ttl * 1000);
    const size = this.calculateSize(data);
    const urlHash = this.generateUrlHash(key);

    // Log cache metadata for monitoring
    console.log(`[Cache] Setting cache with tags: ${tags.join(', ')}, compression: ${compress}, version: ${version}, size: ${size} bytes`);

    try {
      // Use raw SQL to avoid type issues with the Prisma client
      await this.prisma.$executeRaw`
        INSERT INTO "AnalysisCache" 
        ("id", "url", "urlHash", "analysisData", "expiresAt", "createdAt")
        VALUES 
        (gen_random_uuid(), ${key}, ${urlHash}, ${JSON.stringify(data)}::jsonb, ${expiresAt}, NOW())
        ON CONFLICT ("urlHash") 
        DO UPDATE SET 
          "url" = ${key},
          "analysisData" = ${JSON.stringify(data)}::jsonb,
          "expiresAt" = ${expiresAt}
      `;

      // Store in memory cache
      this.memoryCache.set(key, {
        data,
        expiresAt
      });

    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Cache analysis results with smart key generation
   */
  async cacheAnalysisResult(
    projectId: string,
    url: string,
    analysisType: 'standard' | 'enhanced',
    result: any,
    ttl: number = 3600
  ): Promise<string> {
    const key = this.generateKey('analysis', {
      projectId,
      url,
      type: analysisType,
      version: '2.0'
    });

    await this.set(key, result, {
      ttl,
      tags: [`project:${projectId}`, `analysis:${analysisType}`, 'results']
    });

    return key;
  }

  /**
   * Get cached analysis result
   */
  async getCachedAnalysisResult(
    projectId: string,
    url: string,
    analysisType: 'standard' | 'enhanced'
  ): Promise<any | null> {
    const key = this.generateKey('analysis', {
      projectId,
      url,
      type: analysisType,
      version: '2.0'
    });

    return await this.get(key);
  }

  /**
   * Cache project trends data
   */
  async cacheTrendsData(
    projectId: string,
    period: string,
    data: any,
    ttl: number = 1800 // 30 minutes
  ): Promise<void> {
    const key = this.generateKey('trends', {
      projectId,
      period,
      version: '1.0'
    });

    await this.set(key, data, {
      ttl,
      tags: [`project:${projectId}`, 'trends']
    });
  }

  /**
   * Get cached trends data
   */
  async getCachedTrendsData(
    projectId: string,
    period: string
  ): Promise<any | null> {
    const key = this.generateKey('trends', {
      projectId,
      period,
      version: '1.0'
    });

    return await this.get(key);
  }

  /**
   * Cache issue analysis data
   */
  async cacheIssueAnalysis(
    analysisId: string,
    data: any,
    ttl: number = 7200 // 2 hours
  ): Promise<void> {
    const key = this.generateKey('issues', {
      analysisId,
      version: '1.0'
    });

    await this.set(key, data, {
      ttl,
      tags: [`analysis:${analysisId}`, 'issues']
    });
  }

  /**
   * Get cached issue analysis
   */
  async getCachedIssueAnalysis(analysisId: string): Promise<any | null> {
    const key = this.generateKey('issues', {
      analysisId,
      version: '1.0'
    });

    return await this.get(key);
  }

  /**
   * Cache recommendations data
   */
  async cacheRecommendations(
    analysisId: string,
    data: any,
    ttl: number = 7200 // 2 hours
  ): Promise<void> {
    const key = this.generateKey('recommendations', {
      analysisId,
      version: '1.0'
    });

    await this.set(key, data, {
      ttl,
      tags: [`analysis:${analysisId}`, 'recommendations']
    });
  }

  /**
   * Get cached recommendations
   */
  async getCachedRecommendations(analysisId: string): Promise<any | null> {
    const key = this.generateKey('recommendations', {
      analysisId,
      version: '1.0'
    });

    return await this.get(key);
  }

  /**
   * Invalidate cache by tags - simplified version
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      // Clear memory cache entirely for simplicity
      this.memoryCache.clear();
      
      // Note: Full tag-based invalidation would require custom implementation
      console.log('Cache invalidated for tags:', tags);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Invalidate cache for a specific project
   */
  async invalidateProject(projectId: string): Promise<void> {
    await this.invalidateByTags([`project:${projectId}`]);
  }

  /**
   * Invalidate cache for a specific analysis
   */
  async invalidateAnalysis(analysisId: string): Promise<void> {
    await this.invalidateByTags([`analysis:${analysisId}`]);
  }

  /**
   * Clean up expired cache entries
   */
  async cleanup(): Promise<{ deletedCount: number; freedSize: number }> {
    try {
      const deletedCount = await this.prisma.$executeRaw`
        DELETE FROM "AnalysisCache" WHERE "expiresAt" < NOW()
      `;

      // Clean memory cache
      this.memoryCache.forEach((entry, key) => {
        if (entry.expiresAt <= new Date()) {
          this.memoryCache.delete(key);
        }
      });

      return {
        deletedCount: Number(deletedCount),
        freedSize: 0 // Would need more complex calculation
      };

    } catch (error) {
      console.error('Cache cleanup error:', error);
      return { deletedCount: 0, freedSize: 0 };
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const totalEntries = await this.prisma.analysisCache.count();
      
      const expiredCount = await this.prisma.analysisCache.count({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      const hitRate = this.cacheStats.totalRequests > 0 
        ? (this.cacheStats.hits / this.cacheStats.totalRequests) * 100 
        : 0;

      const avgResponseTime = this.cacheStats.responseTime.length > 0
        ? this.cacheStats.responseTime.reduce((a, b) => a + b, 0) / this.cacheStats.responseTime.length
        : 0;

      return {
        totalEntries,
        totalSize: 0, // Would need more complex calculation
        hitRate: Math.round(hitRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        expiredEntries: expiredCount,
        popularKeys: [] // Simplified for now
      };

    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        totalEntries: 0,
        totalSize: 0,
        hitRate: 0,
        avgResponseTime: 0,
        expiredEntries: 0,
        popularKeys: []
      };
    }
  }

  /**
   * Record response time for statistics
   */
  private recordResponseTime(time: number): void {
    this.cacheStats.responseTime.push(time);
    
    // Keep only last 1000 measurements
    if (this.cacheStats.responseTime.length > 1000) {
      this.cacheStats.responseTime = this.cacheStats.responseTime.slice(-1000);
    }
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.cacheStats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      responseTime: []
    };
  }

  /**
   * Get memory cache size
   */
  getMemoryCacheSize(): number {
    return this.memoryCache.size;
  }

  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    try {
      await this.prisma.analysisCache.deleteMany({});
      this.memoryCache.clear();
      this.resetStats();
    } catch (error) {
      console.error('Clear all cache error:', error);
    }
  }

  /**
   * Check if analysis should be cached based on complexity
   */
  shouldCache(analysisType: string, complexity: 'low' | 'medium' | 'high'): boolean {
    const cacheRules = {
      'enhanced': {
        'low': true,
        'medium': true,
        'high': true
      },
      'standard': {
        'low': true,
        'medium': true,
        'high': false // Don't cache high complexity standard analyses
      }
    };

    return cacheRules[analysisType as keyof typeof cacheRules]?.[complexity] || false;
  }

  /**
   * Get optimal TTL based on data type and freshness requirements
   */
  getOptimalTTL(dataType: string, priority: 'low' | 'medium' | 'high'): number {
    const ttlMatrix = {
      'analysis': { low: 7200, medium: 3600, high: 1800 },      // 2h, 1h, 30min
      'trends': { low: 1800, medium: 900, high: 300 },         // 30min, 15min, 5min
      'issues': { low: 3600, medium: 1800, high: 900 },        // 1h, 30min, 15min
      'recommendations': { low: 7200, medium: 3600, high: 1800 } // 2h, 1h, 30min
    };

    return ttlMatrix[dataType as keyof typeof ttlMatrix]?.[priority] || 3600;
  }
}

// Singleton instance
export const analysisCacheService = new AnalysisCacheService(); 