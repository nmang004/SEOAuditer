#!/usr/bin/env node

const Redis = require('ioredis');
const { PrismaClient } = require('@prisma/client');

class CacheCleaner {
  constructor() {
    this.redis = null;
    this.prisma = new PrismaClient();
  }

  async run() {
    console.log('🧹 Starting cache clearing process...');
    
    try {
      await this.connectRedis();
      await this.clearRedisCache();
      await this.clearDatabaseCache();
      await this.clearNextJSCache();
      
      console.log('✅ Cache clearing completed successfully!');
    } catch (error) {
      console.error('❌ Cache clearing failed:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  async connectRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redis = new Redis(redisUrl);
      
      await this.redis.ping();
      console.log('📡 Connected to Redis');
    } catch (error) {
      console.warn('⚠️ Redis not available, skipping Redis cache clearing');
      this.redis = null;
    }
  }

  async clearRedisCache() {
    if (!this.redis) return;

    try {
      const keys = await this.redis.keys('rival-outranker:*');
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`🗑️ Cleared ${keys.length} Redis cache entries`);
      } else {
        console.log('📭 No Redis cache entries to clear');
      }
    } catch (error) {
      console.error('❌ Failed to clear Redis cache:', error);
    }
  }

  async clearDatabaseCache() {
    try {
      // Clear expired cache entries
      const expiredResult = await this.prisma.analysisCache.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      console.log(`🗑️ Cleared ${expiredResult.count} expired database cache entries`);

      // Optionally clear all cache entries (uncomment if needed)
      // const allResult = await this.prisma.analysisCache.deleteMany({});
      // console.log(`🗑️ Cleared ${allResult.count} database cache entries`);

    } catch (error) {
      console.error('❌ Failed to clear database cache:', error);
    }
  }

  async clearNextJSCache() {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const cacheDir = path.join(process.cwd(), '.next/cache');
      
      try {
        await fs.access(cacheDir);
        
        // Remove cache directory contents
        const { execSync } = require('child_process');
        execSync(`rm -rf ${cacheDir}/*`, { stdio: 'inherit' });
        
        console.log('🗑️ Cleared Next.js cache');
      } catch (error) {
        console.log('📭 No Next.js cache to clear');
      }
    } catch (error) {
      console.error('❌ Failed to clear Next.js cache:', error);
    }
  }

  async cleanup() {
    if (this.redis) {
      await this.redis.disconnect();
    }
    
    await this.prisma.$disconnect();
  }
}

// Run the cache cleaner
if (require.main === module) {
  const cleaner = new CacheCleaner();
  cleaner.run().catch(console.error);
}

module.exports = CacheCleaner; 