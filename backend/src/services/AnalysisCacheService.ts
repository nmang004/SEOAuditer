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

      // Layer 2: Database cache
      const cacheEntry = await this.prisma.analysisCache.findUnique({
        where: { key }
      });

      if (cacheEntry && cacheEntry.expiresAt > new Date()) {
        // Update access statistics
        await this.prisma.analysisCache.update({
          where: { id: cacheEntry.id },
          data: {
            accessCount: { increment: 1 },
            lastAccessed: new Date()
          }
        });

        // Store in memory cache for next time
        this.memoryCache.set(key, {
          data: cacheEntry.data,
          expiresAt: cacheEntry.expiresAt
        });

        this.cacheStats.hits++;
        this.recordResponseTime(Date.now() - startTime);
        return cacheEntry.data as T;
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

    try {
      // Store in database
      await this.prisma.analysisCache.upsert({
        where: { key },
        update: {
          data,
          analysisData: data, // Keep for backward compatibility
          expiresAt,
          tags,
          size,
          accessCount: 0,
          lastAccessed: new Date(),
          version
        },
        create: {
          key,
          url: key, // Use key as URL for now
          urlHash: this.generateUrlHash(key),
          data,
          analysisData: data, // Keep for backward compatibility
          expiresAt,
          tags,
          size,
          version,
          accessCount: 0,
          lastAccessed: new Date()
        }
      });

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
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      // Clear from database - delete entries that contain any of the specified tags
      for (const tag of tags) {
        await this.prisma.$queryRaw`
          DELETE FROM "AnalysisCache" 
          WHERE '${tag}' = ANY(tags)
        `;
      }

      // Clear from memory cache (simplified approach)
      this.memoryCache.clear();

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
      const expiredEntries = await this.prisma.analysisCache.findMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        },
        select: {
          id: true,
          size: true
        }
      });

      const totalSize = expiredEntries.reduce((sum, entry) => sum + (entry.size || 0), 0);

      await this.prisma.analysisCache.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      // Clean memory cache
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.expiresAt <= new Date()) {
          this.memoryCache.delete(key);
        }
      }

      return {
        deletedCount: expiredEntries.length,
        freedSize: totalSize
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
      
      // Get total size using aggregation
      const sizeAggregation = await this.prisma.analysisCache.aggregate({
        _sum: {
          size: true
        }
      });
      
      const expiredCount = await this.prisma.analysisCache.count({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      // Get popular keys with correct field selection
      const popularKeys = await this.prisma.analysisCache.findMany({
        orderBy: {
          accessCount: 'desc'
        },
        take: 10,
        select: {
          key: true,
          accessCount: true,
          lastAccessed: true
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
        totalSize: sizeAggregation._sum.size || 0,
        hitRate: Math.round(hitRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        expiredEntries: expiredCount,
        popularKeys
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
   * Warm up cache with frequently accessed data
   */
  async warmUp(projectIds: string[]): Promise<void> {
    try {
      console.log('Warming up cache for projects:', projectIds);

      for (const projectId of projectIds) {
        // Pre-load recent trends
        const trendPeriods = ['7d', '30d', '90d'];
        for (const period of trendPeriods) {
          // This would trigger loading and caching of trends data
          // Implementation depends on your trends service
        }

        // Pre-load recent analysis results
        const recentAnalyses = await this.prisma.crawlSession.findMany({
          where: { projectId },
          orderBy: { startedAt: 'desc' },
          take: 5,
          include: {
            analysis: true
          }
        });

        for (const session of recentAnalyses) {
          if (session.analysis) {
            // Cache analysis results
            await this.cacheAnalysisResult(
              projectId,
              session.url,
              'enhanced', // Assuming enhanced analysis
              session.analysis,
              7200 // 2 hours
            );
          }
        }
      }

      console.log('Cache warm-up completed');

    } catch (error) {
      console.error('Cache warm-up error:', error);
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