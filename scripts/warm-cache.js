#!/usr/bin/env node

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

class CacheWarmer {
  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    this.prisma = new PrismaClient();
    this.warmedUrls = [];
  }

  async run() {
    console.log('🔥 Starting cache warming process...');
    
    try {
      await this.warmCriticalPages();
      await this.warmDashboardData();
      await this.warmProjectData();
      await this.warmAnalysisData();
      
      console.log('✅ Cache warming completed successfully!');
      console.log(`🔥 Warmed ${this.warmedUrls.length} cache entries`);
    } catch (error) {
      console.error('❌ Cache warming failed:', error);
      process.exit(1);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async warmCriticalPages() {
    console.log('📄 Warming critical pages...');
    
    const criticalPages = [
      '/',
      '/dashboard',
      '/projects',
      '/reports-demo'
    ];

    for (const page of criticalPages) {
      try {
        const response = await axios.get(`${this.baseUrl}${page}`, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Cache-Warmer/1.0'
          }
        });
        
        if (response.status === 200) {
          this.warmedUrls.push(page);
          console.log(`  ✅ Warmed: ${page}`);
        }
      } catch (error) {
        console.warn(`  ⚠️ Failed to warm ${page}: ${error.message}`);
      }
    }
  }

  async warmDashboardData() {
    console.log('📊 Warming dashboard data...');
    
    const dashboardEndpoints = [
      '/api/dashboard/stats',
      '/api/dashboard/recent-projects',
      '/api/dashboard/priority-issues',
      '/api/dashboard/performance-trends'
    ];

    // Create a dummy authorization header (adjust as needed)
    const headers = {
      'User-Agent': 'Cache-Warmer/1.0',
      'Content-Type': 'application/json'
    };

    for (const endpoint of dashboardEndpoints) {
      try {
        const response = await axios.get(`${this.baseUrl}${endpoint}`, {
          timeout: 10000,
          headers,
          validateStatus: status => status < 500 // Accept 4xx but not 5xx
        });
        
        if (response.status < 400) {
          this.warmedUrls.push(endpoint);
          console.log(`  ✅ Warmed: ${endpoint}`);
        } else {
          console.log(`  ℹ️ Skipped (auth required): ${endpoint}`);
        }
      } catch (error) {
        console.warn(`  ⚠️ Failed to warm ${endpoint}: ${error.message}`);
      }
    }
  }

  async warmProjectData() {
    console.log('📋 Warming project data...');
    
    try {
      // Get recent projects from database
      const recentProjects = await this.prisma.project.findMany({
        take: 10,
        orderBy: { updatedAt: 'desc' },
        where: { isActive: true },
        select: { id: true, name: true }
      });

      console.log(`  Found ${recentProjects.length} recent projects`);

      for (const project of recentProjects) {
        const projectEndpoints = [
          `/api/projects/${project.id}`,
          `/api/projects/${project.id}/analyses`,
          `/api/projects/${project.id}/recent-activity`
        ];

        for (const endpoint of projectEndpoints) {
          try {
            const response = await axios.get(`${this.baseUrl}${endpoint}`, {
              timeout: 5000,
              headers: {
                'User-Agent': 'Cache-Warmer/1.0'
              },
              validateStatus: status => status < 500
            });
            
            if (response.status < 400) {
              this.warmedUrls.push(endpoint);
              console.log(`  ✅ Warmed: ${endpoint}`);
            }
          } catch (error) {
            console.warn(`  ⚠️ Failed to warm ${endpoint}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.warn(`  ⚠️ Failed to fetch projects for warming: ${error.message}`);
    }
  }

  async warmAnalysisData() {
    console.log('🔍 Warming analysis data...');
    
    try {
      // Get recent analyses from database
      const recentAnalyses = await this.prisma.analysis.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        where: { status: 'completed' },
        select: { id: true, projectId: true }
      });

      console.log(`  Found ${recentAnalyses.length} recent analyses`);

      for (const analysis of recentAnalyses) {
        const analysisEndpoints = [
          `/api/analyses/${analysis.id}`,
          `/api/analyses/${analysis.id}/issues`,
          `/api/analyses/${analysis.id}/recommendations`,
          `/api/analyses/${analysis.id}/performance`
        ];

        for (const endpoint of analysisEndpoints) {
          try {
            const response = await axios.get(`${this.baseUrl}${endpoint}`, {
              timeout: 5000,
              headers: {
                'User-Agent': 'Cache-Warmer/1.0'
              },
              validateStatus: status => status < 500
            });
            
            if (response.status < 400) {
              this.warmedUrls.push(endpoint);
              console.log(`  ✅ Warmed: ${endpoint}`);
            }
          } catch (error) {
            console.warn(`  ⚠️ Failed to warm ${endpoint}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.warn(`  ⚠️ Failed to fetch analyses for warming: ${error.message}`);
    }
  }

  async warmCommonQueries() {
    console.log('🔍 Warming common database queries...');
    
    try {
      // Pre-execute common queries to warm database cache
      const queries = [
        // Dashboard stats
        () => this.prisma.project.count({ where: { isActive: true } }),
        () => this.prisma.analysis.count({ where: { status: 'completed' } }),
        () => this.prisma.sEOIssue.count({ where: { isResolved: false } }),
        
        // Recent activity
        () => this.prisma.analysis.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { project: true }
        }),
        
        // Cache statistics
        () => this.prisma.analysisCache.count(),
        () => this.prisma.analysisCache.aggregate({
          _sum: { size: true },
          _avg: { accessCount: true }
        })
      ];

      for (const query of queries) {
        try {
          await query();
          console.log(`  ✅ Warmed database query`);
        } catch (error) {
          console.warn(`  ⚠️ Failed to warm query: ${error.message}`);
        }
      }
    } catch (error) {
      console.warn(`  ⚠️ Failed to warm database queries: ${error.message}`);
    }
  }
}

// Run the cache warmer
if (require.main === module) {
  const warmer = new CacheWarmer();
  warmer.run().catch(console.error);
}

module.exports = CacheWarmer; 