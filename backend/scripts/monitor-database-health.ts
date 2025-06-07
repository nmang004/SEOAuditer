#!/usr/bin/env ts-node
import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';

interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  metrics?: any;
  recommendations?: string[];
}

interface DatabaseHealthReport {
  timestamp: Date;
  overallStatus: 'healthy' | 'warning' | 'critical';
  checks: {
    connectivity: HealthCheckResult;
    performance: HealthCheckResult;
    storage: HealthCheckResult;
    indexes: HealthCheckResult;
    connections: HealthCheckResult;
    queries: HealthCheckResult;
    cache: HealthCheckResult;
  };
  summary: {
    totalChecks: number;
    healthyChecks: number;
    warningChecks: number;
    criticalChecks: number;
  };
  recommendations: string[];
}

class DatabaseHealthMonitor {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }

  async runHealthCheck(): Promise<DatabaseHealthReport> {
    logger.info('🏥 Starting database health check...');

    const report: DatabaseHealthReport = {
      timestamp: new Date(),
      overallStatus: 'healthy',
      checks: {
        connectivity: await this.checkConnectivity(),
        performance: await this.checkPerformance(),
        storage: await this.checkStorage(),
        indexes: await this.checkIndexes(),
        connections: await this.checkConnections(),
        queries: await this.checkQueries(),
        cache: await this.checkCache(),
      },
      summary: {
        totalChecks: 0,
        healthyChecks: 0,
        warningChecks: 0,
        criticalChecks: 0,
      },
      recommendations: [],
    };

    // Calculate summary
    const checks = Object.values(report.checks);
    report.summary.totalChecks = checks.length;
    
    checks.forEach(check => {
      switch (check.status) {
        case 'healthy':
          report.summary.healthyChecks++;
          break;
        case 'warning':
          report.summary.warningChecks++;
          break;
        case 'critical':
          report.summary.criticalChecks++;
          break;
      }
    });

    // Determine overall status
    if (report.summary.criticalChecks > 0) {
      report.overallStatus = 'critical';
    } else if (report.summary.warningChecks > 0) {
      report.overallStatus = 'warning';
    } else {
      report.overallStatus = 'healthy';
    }

    // Collect recommendations
    checks.forEach(check => {
      if (check.recommendations) {
        report.recommendations.push(...check.recommendations);
      }
    });

    await this.prisma.$disconnect();
    return report;
  }

  private async checkConnectivity(): Promise<HealthCheckResult> {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1 as test`;
      const connectionTime = Date.now() - start;

      if (connectionTime > 5000) {
        return {
          status: 'critical',
          message: `Database connection is very slow (${connectionTime}ms)`,
          metrics: { connectionTime },
          recommendations: [
            'Check database server performance',
            'Verify network connectivity',
            'Consider connection pooling optimization'
          ]
        };
      } else if (connectionTime > 1000) {
        return {
          status: 'warning',
          message: `Database connection is slow (${connectionTime}ms)`,
          metrics: { connectionTime },
          recommendations: [
            'Monitor connection performance',
            'Consider optimizing network configuration'
          ]
        };
      }

      return {
        status: 'healthy',
        message: `Database connection is healthy (${connectionTime}ms)`,
        metrics: { connectionTime }
      };
    } catch (error) {
      return {
        status: 'critical',
        message: `Database connectivity failed: ${error}`,
        recommendations: [
          'Check database server status',
          'Verify connection string',
          'Check network connectivity'
        ]
      };
    }
  }

  private async checkPerformance(): Promise<HealthCheckResult> {
    try {
      const start = Date.now();
      
      // Test complex query performance
      const result = await this.prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*) as count FROM seo_analyses 
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `;
      
      const queryTime = Date.now() - start;
      const analysisCount = Number(result[0]?.count || 0);

      const metrics = {
        queryTime,
        analysisCount,
        avgQueryTime: queryTime,
      };

      if (queryTime > 2000) {
        return {
          status: 'critical',
          message: `Query performance is critical (${queryTime}ms)`,
          metrics,
          recommendations: [
            'Check database indexes',
            'Analyze slow queries',
            'Consider query optimization',
            'Monitor database load'
          ]
        };
      } else if (queryTime > 500) {
        return {
          status: 'warning',
          message: `Query performance is slow (${queryTime}ms)`,
          metrics,
          recommendations: [
            'Monitor query performance trends',
            'Consider index optimization'
          ]
        };
      }

      return {
        status: 'healthy',
        message: `Query performance is good (${queryTime}ms)`,
        metrics
      };
    } catch (error) {
      return {
        status: 'critical',
        message: `Performance check failed: ${error}`,
        recommendations: ['Investigate database performance issues']
      };
    }
  }

  private async checkStorage(): Promise<HealthCheckResult> {
    try {
      const sizeInfo = await this.prisma.$queryRaw<Array<{
        table_name: string;
        size_bytes: number;
        row_count: number;
      }>>`
        SELECT 
          schemaname||'.'||tablename as table_name,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
          n_tup_ins + n_tup_upd as row_count
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
      `;

      const totalSize = sizeInfo.reduce((sum: number, table: {table_name: string; size_bytes: number; row_count: number}) => sum + Number(table.size_bytes), 0);
      const totalRows = sizeInfo.reduce((sum: number, table: {table_name: string; size_bytes: number; row_count: number}) => sum + Number(table.row_count), 0);
      
      const sizeInMB = totalSize / (1024 * 1024);
      const sizeInGB = sizeInMB / 1024;

      const metrics = {
        totalSizeBytes: totalSize,
        totalSizeMB: Math.round(sizeInMB),
        totalSizeGB: Math.round(sizeInGB * 100) / 100,
        totalRows,
        largestTables: sizeInfo.slice(0, 5)
      };

      if (sizeInGB > 10) {
        return {
          status: 'warning',
          message: `Database size is growing large (${metrics.totalSizeGB}GB)`,
          metrics,
          recommendations: [
            'Monitor database growth trends',
            'Consider data archival strategies',
            'Implement cleanup procedures for old data'
          ]
        };
      } else if (sizeInGB > 50) {
        return {
          status: 'critical',
          message: `Database size is very large (${metrics.totalSizeGB}GB)`,
          metrics,
          recommendations: [
            'Implement immediate data cleanup',
            'Consider database partitioning',
            'Archive old analysis data'
          ]
        };
      }

      return {
        status: 'healthy',
        message: `Database storage is healthy (${metrics.totalSizeGB}GB)`,
        metrics
      };
    } catch (error) {
      return {
        status: 'warning',
        message: `Storage check failed: ${error}`,
        recommendations: ['Check database permissions for storage queries']
      };
    }
  }

  private async checkIndexes(): Promise<HealthCheckResult> {
    try {
      const indexUsage = await this.prisma.$queryRaw<Array<{
        schemaname: string;
        tablename: string;
        indexname: string;
        idx_scan: number;
        idx_tup_read: number;
        idx_tup_fetch: number;
      }>>`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC
      `;

      const unusedIndexes = indexUsage.filter((idx: any) => Number(idx.idx_scan) === 0);
      const activeIndexes = indexUsage.filter((idx: any) => Number(idx.idx_scan) > 0);

      const metrics = {
        totalIndexes: indexUsage.length,
        activeIndexes: activeIndexes.length,
        unusedIndexes: unusedIndexes.length,
        topIndexes: activeIndexes.slice(0, 5),
        unusedIndexList: unusedIndexes.map((idx: any) => idx.indexname)
      };

      if (unusedIndexes.length > 10) {
        return {
          status: 'warning',
          message: `Many unused indexes detected (${unusedIndexes.length})`,
          metrics,
          recommendations: [
            'Review and remove unused indexes',
            'Monitor index usage patterns',
            'Consider index optimization'
          ]
        };
      } else if (metrics.activeIndexes / metrics.totalIndexes < 0.5) {
        return {
          status: 'warning',
          message: `Low index utilization (${Math.round(metrics.activeIndexes / metrics.totalIndexes * 100)}%)`,
          metrics,
          recommendations: [
            'Analyze query patterns',
            'Optimize frequently used queries',
            'Remove unused indexes'
          ]
        };
      }

      return {
        status: 'healthy',
        message: `Index usage is healthy (${metrics.activeIndexes}/${metrics.totalIndexes} active)`,
        metrics
      };
    } catch (error) {
      return {
        status: 'warning',
        message: `Index check failed: ${error}`,
        recommendations: ['Check database permissions for index statistics']
      };
    }
  }

  private async checkConnections(): Promise<HealthCheckResult> {
    try {
      const connectionInfo = await this.prisma.$queryRaw<Array<{
        setting: string;
      }>>`
        SELECT setting FROM pg_settings WHERE name = 'max_connections'
      `;

      const activeConnections = await this.prisma.$queryRaw<Array<{
        count: number;
      }>>`
        SELECT COUNT(*) as count FROM pg_stat_activity WHERE state = 'active'
      `;

      const maxConnections = Number(connectionInfo[0]?.setting || 100);
      const currentConnections = Number(activeConnections[0]?.count || 0);
      const connectionUsage = (currentConnections / maxConnections) * 100;

      const metrics = {
        maxConnections,
        currentConnections,
        connectionUsage: Math.round(connectionUsage),
        availableConnections: maxConnections - currentConnections
      };

      if (connectionUsage > 90) {
        return {
          status: 'critical',
          message: `Connection pool nearly exhausted (${Math.round(connectionUsage)}%)`,
          metrics,
          recommendations: [
            'Increase max_connections setting',
            'Implement connection pooling',
            'Optimize application connection usage',
            'Monitor for connection leaks'
          ]
        };
      } else if (connectionUsage > 70) {
        return {
          status: 'warning',
          message: `High connection usage (${Math.round(connectionUsage)}%)`,
          metrics,
          recommendations: [
            'Monitor connection trends',
            'Consider connection pooling optimization'
          ]
        };
      }

      return {
        status: 'healthy',
        message: `Connection usage is healthy (${Math.round(connectionUsage)}%)`,
        metrics
      };
    } catch (error) {
      return {
        status: 'warning',
        message: `Connection check failed: ${error}`,
        recommendations: ['Check database permissions for connection statistics']
      };
    }
  }

  private async checkQueries(): Promise<HealthCheckResult> {
    try {
      // This requires pg_stat_statements extension
      const slowQueries = await this.prisma.$queryRaw<Array<{
        query: string;
        calls: number;
        total_time: number;
        mean_time: number;
      }>>`
        SELECT 
          query,
          calls,
          total_exec_time as total_time,
          mean_exec_time as mean_time
        FROM pg_stat_statements
        WHERE mean_exec_time > 1000
        ORDER BY mean_exec_time DESC
        LIMIT 10
      `;

      const metrics = {
        slowQueriesCount: slowQueries.length,
        slowQueries: slowQueries.map(q => ({
          query: q.query.substring(0, 100) + '...',
          calls: Number(q.calls),
          meanTime: Math.round(Number(q.mean_time))
        }))
      };

      if (slowQueries.length > 5) {
        return {
          status: 'warning',
          message: `Multiple slow queries detected (${slowQueries.length})`,
          metrics,
          recommendations: [
            'Optimize slow queries',
            'Add appropriate indexes',
            'Consider query restructuring'
          ]
        };
      } else if (slowQueries.length > 0) {
        return {
          status: 'warning',
          message: `Some slow queries detected (${slowQueries.length})`,
          metrics,
          recommendations: [
            'Monitor query performance',
            'Consider query optimization'
          ]
        };
      }

      return {
        status: 'healthy',
        message: 'No slow queries detected',
        metrics
      };
    } catch (error) {
      // pg_stat_statements might not be available
      return {
        status: 'healthy',
        message: 'Query monitoring not available (pg_stat_statements extension not installed)',
        recommendations: ['Consider installing pg_stat_statements for query monitoring']
      };
    }
  }

  private async checkCache(): Promise<HealthCheckResult> {
    try {
      const cacheStats = await this.prisma.$queryRaw<Array<{
        total_records: number;
        expired_records: number;
        avg_access_count: number;
        cache_size_mb: number;
      }>>`
        SELECT 
          COUNT(*) as total_records,
          COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_records,
          AVG(access_count) as avg_access_count,
          ROUND(SUM(size)::numeric / 1024 / 1024, 2) as cache_size_mb
        FROM analysis_cache
      `;

      const stats = cacheStats[0];
      const totalRecords = Number(stats?.total_records || 0);
      const expiredRecords = Number(stats?.expired_records || 0);
      const avgAccessCount = Number(stats?.avg_access_count || 0);
      const cacheSizeMB = Number(stats?.cache_size_mb || 0);

      const expiredPercentage = totalRecords > 0 ? (expiredRecords / totalRecords) * 100 : 0;

      const metrics = {
        totalRecords,
        expiredRecords,
        expiredPercentage: Math.round(expiredPercentage),
        avgAccessCount: Math.round(avgAccessCount),
        cacheSizeMB
      };

      if (expiredPercentage > 50) {
        return {
          status: 'warning',
          message: `High cache expiration rate (${Math.round(expiredPercentage)}%)`,
          metrics,
          recommendations: [
            'Implement cache cleanup job',
            'Optimize cache TTL settings',
            'Monitor cache hit rates'
          ]
        };
      } else if (cacheSizeMB > 1000) {
        return {
          status: 'warning',
          message: `Large cache size (${cacheSizeMB}MB)`,
          metrics,
          recommendations: [
            'Consider cache size limits',
            'Implement LRU eviction policy'
          ]
        };
      }

      return {
        status: 'healthy',
        message: `Cache performance is healthy (${totalRecords} records, ${cacheSizeMB}MB)`,
        metrics
      };
    } catch (error) {
      return {
        status: 'warning',
        message: `Cache check failed: ${error}`,
        recommendations: ['Verify analysis_cache table exists']
      };
    }
  }

  async generateHealthReport(): Promise<string> {
    const report = await this.runHealthCheck();
    
    let output = '\n';
    output += '🏥 DATABASE HEALTH REPORT\n';
    output += '========================\n\n';
    output += `📅 Timestamp: ${report.timestamp.toISOString()}\n`;
    output += `🎯 Overall Status: ${this.getStatusIcon(report.overallStatus)} ${report.overallStatus.toUpperCase()}\n\n`;

    output += '📊 SUMMARY\n';
    output += '----------\n';
    output += `Total Checks: ${report.summary.totalChecks}\n`;
    output += `✅ Healthy: ${report.summary.healthyChecks}\n`;
    output += `⚠️  Warning: ${report.summary.warningChecks}\n`;
    output += `🚨 Critical: ${report.summary.criticalChecks}\n\n`;

    output += '🔍 DETAILED CHECKS\n';
    output += '------------------\n';

    for (const [checkName, result] of Object.entries(report.checks)) {
      output += `${this.getStatusIcon(result.status)} ${checkName.toUpperCase()}: ${result.message}\n`;
      
      if (result.metrics) {
        output += `   📈 Metrics: ${JSON.stringify(result.metrics, null, 2).replace(/\n/g, '\n   ')}\n`;
      }
      
      if (result.recommendations && result.recommendations.length > 0) {
        output += `   💡 Recommendations:\n`;
        result.recommendations.forEach(rec => {
          output += `      - ${rec}\n`;
        });
      }
      output += '\n';
    }

    if (report.recommendations.length > 0) {
      output += '🎯 TOP RECOMMENDATIONS\n';
      output += '----------------------\n';
      report.recommendations.forEach((rec, index) => {
        output += `${index + 1}. ${rec}\n`;
      });
    }

    return output;
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      default: return '❓';
    }
  }
}

// CLI execution
async function main() {
  const monitor = new DatabaseHealthMonitor();
  
  try {
    const healthReport = await monitor.generateHealthReport();
    console.log(healthReport);
    
    const report = await monitor.runHealthCheck();
    
    if (report.overallStatus === 'critical') {
      console.error('\n🚨 CRITICAL ISSUES DETECTED - Immediate attention required!');
      process.exit(1);
    } else if (report.overallStatus === 'warning') {
      console.warn('\n⚠️ WARNING ISSUES DETECTED - Consider addressing soon.');
      process.exit(0);
    } else {
      console.log('\n✅ Database is healthy!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ Health check failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { DatabaseHealthMonitor, type DatabaseHealthReport }; 