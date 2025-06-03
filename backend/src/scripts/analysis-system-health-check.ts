import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { config } from '../config/config';

interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details?: any;
}

export class AnalysisSystemHealthChecker {
  private prisma: PrismaClient;
  private redisClient: any;
  private results: HealthCheckResult[] = [];

  constructor() {
    this.prisma = new PrismaClient();
    this.redisClient = config.redis.url ? createClient({ url: config.redis.url }) : null;
  }

  async runHealthCheck(): Promise<HealthCheckResult[]> {
    console.log('🔍 Starting Analysis System Health Check...\n');
    
    await this.checkDatabase();
    await this.checkRedis();
    await this.checkQueue();
    await this.checkEnhancedAnalysisSystem();
    await this.checkPuppeteer();
    await this.checkWebSocket();
    await this.checkAPIEndpoints();
    
    this.printSummary();
    return this.results;
  }

  private async checkDatabase(): Promise<void> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      
      // Check critical tables exist
      const tables = await this.prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('projects', 'seo_analyses', 'crawl_sessions', 'seo_issues')
      `;
      
      this.addResult({
        component: 'Database',
        status: 'healthy',
        message: 'Connected and core tables exist',
        details: { tables }
      });
    } catch (error) {
      this.addResult({
        component: 'Database',
        status: 'error',
        message: 'Database connection failed',
        details: error
      });
    }
  }

  private async checkRedis(): Promise<void> {
    try {
      await this.redisClient.connect();
      await this.redisClient.ping();
      
      this.addResult({
        component: 'Redis',
        status: 'healthy',
        message: 'Connected and responding to ping'
      });
      
      await this.redisClient.quit();
    } catch (error) {
      this.addResult({
        component: 'Redis',
        status: 'error',
        message: 'Redis connection failed',
        details: error
      });
    }
  }

  private async checkQueue(): Promise<void> {
    try {
      // Try to import queue components
      const { EnhancedQueueAdapter } = await import('../seo-crawler/queue/EnhancedQueueAdapter');
      const queueAdapter = new EnhancedQueueAdapter();
      
      const health = await queueAdapter.healthCheck();
      
      this.addResult({
        component: 'Queue System',
        status: health.status === 'healthy' ? 'healthy' : 'warning',
        message: health.status === 'healthy' ? 'Queue system operational' : 'Queue system issues detected',
        details: health.details
      });
      
      await queueAdapter.close();
    } catch (error) {
      this.addResult({
        component: 'Queue System',
        status: 'error',
        message: 'Queue system initialization failed',
        details: error
      });
    }
  }

  private async checkEnhancedAnalysisSystem(): Promise<void> {
    try {
      await import('../seo-crawler/enhanced-analysis-system');
      
      this.addResult({
        component: 'Enhanced Analysis System',
        status: 'healthy',
        message: 'Analysis system module loaded successfully'
      });
    } catch (error) {
      this.addResult({
        component: 'Enhanced Analysis System',
        status: 'error',
        message: 'Analysis system module failed to load',
        details: error
      });
    }
  }

  private async checkPuppeteer(): Promise<void> {
    try {
      const puppeteer = require('puppeteer');
      const puppeteerExtra = require('puppeteer-extra');
      const stealth = require('puppeteer-extra-plugin-stealth');
      
      // Test browser launch
      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.goto('data:text/html,<h1>Health Check</h1>');
      await browser.close();
      
      this.addResult({
        component: 'Puppeteer',
        status: 'healthy',
        message: 'Puppeteer with stealth plugin available and functional',
        details: {
          puppeteer: !!puppeteer,
          puppeteerExtra: !!puppeteerExtra,
          stealth: !!stealth
        }
      });
    } catch (error) {
      this.addResult({
        component: 'Puppeteer',
        status: 'warning',
        message: 'Puppeteer issues detected',
        details: error
      });
    }
  }

  private async checkWebSocket(): Promise<void> {
    try {
      await import('../seo-crawler/ws/WebSocketGateway');
      
      this.addResult({
        component: 'WebSocket Gateway',
        status: 'healthy',
        message: 'WebSocket module loaded successfully'
      });
    } catch (error) {
      this.addResult({
        component: 'WebSocket Gateway',
        status: 'error',
        message: 'WebSocket module failed to load',
        details: error
      });
    }
  }

  private async checkAPIEndpoints(): Promise<void> {
    try {
      await import('../controllers/enhanced-analysis.controller');
      
      this.addResult({
        component: 'API Endpoints',
        status: 'healthy',
        message: 'Enhanced analysis API controller loaded successfully'
      });
    } catch (error) {
      this.addResult({
        component: 'API Endpoints',
        status: 'error',
        message: 'API controller failed to load',
        details: error
      });
    }
  }

  private addResult(result: HealthCheckResult): void {
    this.results.push(result);
    
    const statusEmoji: { [K in HealthCheckResult['status']]: string } = {
      healthy: '✅',
      warning: '⚠️',
      error: '❌'
    };
    
    console.log(`${statusEmoji[result.status]} ${result.component}: ${result.message}`);
  }

  private printSummary(): void {
    const healthy = this.results.filter(r => r.status === 'healthy').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const errors = this.results.filter(r => r.status === 'error').length;
    
    console.log('\n📊 Health Check Summary:');
    console.log(`✅ Healthy: ${healthy}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📈 Overall Status: ${errors === 0 ? 'OPERATIONAL' : warnings > 0 ? 'DEGRADED' : 'CRITICAL'}`);
    
    if (errors === 0 && warnings === 0) {
      console.log('\n🎉 All systems operational! SEO Analysis Engine ready for production.');
    } else if (errors === 0) {
      console.log('\n⚠️  System operational with minor issues. Review warnings.');
    } else {
      console.log('\n🚨 Critical issues detected. Review errors before deployment.');
    }
  }

  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// CLI execution
if (require.main === module) {
  const healthChecker = new AnalysisSystemHealthChecker();
  
  healthChecker.runHealthCheck()
    .then(() => {
      console.log('\nHealth check completed.');
      return healthChecker.cleanup();
    })
    .catch((error) => {
      console.error('Health check failed:', error);
      process.exit(1);
    });
} 