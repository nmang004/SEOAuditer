import { PrismaClient, Prisma } from '@prisma/client';
import { databaseManager, withPagination, withSorting, withTransaction, withSEOAnalysisIncludes } from '../config/database';
import { schemas } from '../schemas/validation';
import { logger } from '../utils/logger';
import { z } from 'zod';

export class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = databaseManager.getPrisma();
  }

  // ============ OPTIMIZED DASHBOARD QUERIES ============
  
  /**
   * Get dashboard statistics with parallel execution for optimal performance
   */
  async getDashboardStatistics(userId: string): Promise<{
    projectCount: number;
    totalAnalyses: number;
    avgScore: number;
    criticalIssues: number;
    recentActivity: any[];
    scoreDistribution: any[];
    trendData: any[];
  }> {
    return await databaseManager.executeWithRetry(async () => {
      // Execute all dashboard queries in parallel for optimal performance
      const [
        projectStats,
        analysisStats, 
        issueStats,
        recentActivity,
        scoreDistribution,
        trendData
      ] = await Promise.all([
        // Project statistics
        this.prisma.project.aggregate({
          where: { userId },
          _count: { id: true },
          _avg: { currentScore: true },
        }),
        
        // Analysis statistics  
        this.prisma.sEOAnalysis.aggregate({
          where: { project: { userId } },
          _count: { id: true },
          _avg: { overallScore: true },
        }),
        
        // Critical issues count
        this.prisma.sEOIssue.count({
          where: {
            analysis: { project: { userId } },
            severity: 'critical',
            status: { not: 'fixed' },
          },
        }),
        
        // Recent activity (last 10 analyses)
        this.prisma.sEOAnalysis.findMany({
          where: { project: { userId } },
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            overallScore: true,
            scoreChange: true,
            createdAt: true,
            project: {
              select: { name: true, url: true, id: true }
            },
            _count: {
              select: {
                issues: { where: { severity: 'critical' } }
              }
            }
          },
        }),
        
        // Score distribution for charts
        this.getScoreDistribution(userId),
        
        // Trend data for the last 30 days
        this.getTrendAnalysis(userId, 30),
      ]);

      return {
        projectCount: projectStats._count.id,
        totalAnalyses: analysisStats._count.id,
        avgScore: Math.round(analysisStats._avg.overallScore || 0),
        criticalIssues: issueStats,
        recentActivity,
        scoreDistribution,
        trendData,
      };
    }, 3, 'dashboard statistics');
  }

  /**
   * Get score distribution using raw SQL for optimal performance
   */
  private async getScoreDistribution(userId: string): Promise<any[]> {
    return await this.prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN overall_score >= 90 THEN 'excellent'
          WHEN overall_score >= 70 THEN 'good'
          WHEN overall_score >= 50 THEN 'average'
          ELSE 'needs_improvement'
        END as score_range,
        COUNT(*) as count,
        AVG(overall_score) as avg_score
      FROM seo_analyses sa
      JOIN projects p ON sa.project_id = p.id
      WHERE p.user_id = ${userId}
        AND sa.overall_score IS NOT NULL
      GROUP BY score_range
      ORDER BY avg_score DESC
    `;
  }

  /**
   * Get trend analysis with optimized time-series queries
   */
  private async getTrendAnalysis(userId: string, days: number = 30): Promise<any[]> {
    return await this.prisma.$queryRaw`
      SELECT 
        DATE(sa.created_at) as date,
        AVG(sa.overall_score) as avg_score,
        COUNT(*) as analysis_count,
        AVG(sa.technical_score) as avg_technical,
        AVG(sa.content_score) as avg_content,
        AVG(sa.onpage_score) as avg_onpage,
        AVG(sa.ux_score) as avg_ux
      FROM seo_analyses sa
      JOIN projects p ON sa.project_id = p.id
      WHERE p.user_id = ${userId}
        AND sa.created_at >= NOW() - INTERVAL '${days} days'
        AND sa.overall_score IS NOT NULL
      GROUP BY DATE(sa.created_at)
      ORDER BY date DESC
      LIMIT ${days}
    `;
  }

  /**
   * Get optimized project dashboard with aggregated metrics
   */
  async getProjectDashboard(
    projectId: string, 
    userId: string,
    timeRange: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<any> {
    return await databaseManager.executeWithRetry(async () => {
      const timeFilter = this.getTimeRangeFilter(timeRange);
      
      const [project, latestAnalysis, issueBreakdown, trendData, recommendations] = await Promise.all([
        // Project details with latest metrics
        this.prisma.project.findFirst({
          where: { id: projectId, userId },
          select: {
            id: true,
            name: true,
            url: true,
            currentScore: true,
            issueCount: true,
            lastScanDate: true,
            status: true,
            _count: {
              select: {
                analyses: true,
                crawlSessions: { where: { status: 'completed' } }
              }
            }
          },
        }),
        
        // Latest analysis with details
        this.prisma.sEOAnalysis.findFirst({
          where: { projectId, project: { userId } },
          orderBy: { createdAt: 'desc' },
          include: withSEOAnalysisIncludes.detailed,
        }),
        
        // Issue breakdown by severity and category
        this.getIssueBreakdown(projectId),
        
        // Trend data for the specified time range
        this.getProjectTrendData(projectId, timeFilter),
        
        // Top recommendations
        this.prisma.sEORecommendation.findMany({
          where: { 
            analysis: { projectId, project: { userId } }
          },
          orderBy: [
            { priority: 'asc' },
            { businessValue: 'asc' },
            { quickWin: 'desc' }
          ],
          take: 10,
          select: {
            id: true,
            title: true,
            priority: true,
            businessValue: true,
            quickWin: true,
            status: true,
            category: true,
          },
        }),
      ]);

      return {
        project,
        latestAnalysis,
        issueBreakdown,
        trendData,
        recommendations,
      };
    }, 3, 'project dashboard');
  }

  /**
   * Get issue breakdown with optimized aggregation
   */
  private async getIssueBreakdown(projectId: string): Promise<any> {
    return await this.prisma.$queryRaw`
      SELECT 
        severity,
        category,
        status,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE blocking_indexing = true) as blocking_count,
        COUNT(*) FILTER (WHERE security_concern = true) as security_count
      FROM seo_issues si
      JOIN seo_analyses sa ON si.analysis_id = sa.id
      WHERE sa.project_id = ${projectId}
      GROUP BY severity, category, status
      ORDER BY 
        CASE severity 
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        category
    `;
  }

  /**
   * Get project trend data with time-series optimization
   */
  private async getProjectTrendData(projectId: string, timeFilter: Date): Promise<any[]> {
    return await this.prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        overall_score,
        technical_score,
        content_score,
        onpage_score,
        ux_score,
        score_change,
        (
          SELECT COUNT(*) 
          FROM seo_issues si 
          WHERE si.analysis_id = sa.id AND si.severity = 'critical'
        ) as critical_issues
      FROM seo_analyses sa
      WHERE sa.project_id = ${projectId}
        AND sa.created_at >= ${timeFilter}
      ORDER BY sa.created_at DESC
      LIMIT 100
    `;
  }

  private getTimeRangeFilter(timeRange: 'week' | 'month' | 'quarter'): Date {
    const now = new Date();
    switch (timeRange) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'quarter':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }
  }

  // ============ BULK OPERATIONS FOR HIGH THROUGHPUT ============
  
  /**
   * Bulk create SEO analysis with optimized transaction handling
   */
  async bulkCreateAnalyses(
    analyses: z.infer<typeof schemas.seoAnalysis.bulkCreate>
  ): Promise<any[]> {
    const validatedData = schemas.seoAnalysis.bulkCreate.parse(analyses);
    
    return await databaseManager.executeWithRetry(async () => {
      return await withTransaction(async (tx) => {
        const results = [];
        
        // Process in batches of 10 for optimal performance
        const batchSize = 10;
        for (let i = 0; i < validatedData.length; i += batchSize) {
          const batch = validatedData.slice(i, i + batchSize);
          
          const batchResults = await Promise.all(
            batch.map(async (analysisData) => {
              const analysis = await tx.sEOAnalysis.create({
                data: analysisData,
                include: withSEOAnalysisIncludes.basic,
              });
              
              // Update project metrics
              await tx.project.update({
                where: { id: analysisData.projectId },
                data: {
                  currentScore: analysisData.overallScore,
                  lastScanDate: new Date(),
                },
              });
              
              return analysis;
            })
          );
          
          results.push(...batchResults);
        }
        
        return results;
      });
    }, 3, 'bulk analysis creation');
  }

  /**
   * Bulk update issue statuses with optimized queries
   */
  async bulkUpdateIssueStatuses(
    updates: { issueId: string; status: string; notes?: string }[]
  ): Promise<void> {
    return await databaseManager.executeWithRetry(async () => {
      return await withTransaction(async (tx) => {
        // Use batch updates for better performance
        await Promise.all(
          updates.map(update => 
            tx.sEOIssue.update({
              where: { id: update.issueId },
              data: {
                status: update.status,
                updatedAt: new Date(),
                ...(update.notes && { 
                  implementationSteps: { push: update.notes }
                }),
              },
            })
          )
        );
        
        // Update issue counts for affected projects
        const affectedProjectIds = await tx.sEOIssue.findMany({
          where: { id: { in: updates.map(u => u.issueId) } },
          select: { analysis: { select: { projectId: true } } },
        });
        
        const projectIds = affectedProjectIds.map(item => item.analysis.projectId);
        const uniqueProjectIds = Array.from(new Set(projectIds));
        
        await Promise.all(
          uniqueProjectIds.map(async (projectId) => {
            const issueCount = await tx.sEOIssue.count({
              where: {
                analysis: { projectId },
                status: { not: 'fixed' },
              },
            });
            
            await tx.project.update({
              where: { id: projectId },
              data: { issueCount },
            });
          })
        );
      });
    }, 3, 'bulk issue status update');
  }

  // ============ ENHANCED QUERY METHODS ============
  
  /**
   * Get paginated issues with advanced filtering and sorting
   */
  async getIssuesWithFilters(
    analysisId: string,
    filters: z.infer<typeof schemas.seoIssue.advancedFilter>
  ): Promise<any> {
    const validatedFilters = schemas.seoIssue.advancedFilter.parse(filters);
    const { 
      page, limit, sortBy, sortOrder, severity, category, status, 
      businessImpact, searchTerm, fixComplexity, blockingIndexing,
      securityConcern, dateFrom, dateTo 
    } = validatedFilters;

    return await databaseManager.executeWithRetry(async () => {
      const where: Prisma.SEOIssueWhereInput = {
        analysisId,
        ...(severity && { severity }),
        ...(category && { category }),
        ...(status && { status }),
        ...(businessImpact && { businessImpact }),
        ...(fixComplexity && { fixComplexity }),
        ...(blockingIndexing !== undefined && { blockingIndexing }),
        ...(securityConcern !== undefined && { securityConcern }),
        ...(searchTerm && {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { type: { contains: searchTerm, mode: 'insensitive' } },
          ],
        }),
        ...(dateFrom && dateTo && {
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        }),
      };

      const [issues, total, categoryCounts] = await Promise.all([
        this.prisma.sEOIssue.findMany({
          where,
          ...withPagination({}, page, limit),
          ...withSorting({}, sortBy, sortOrder),
          select: {
            id: true,
            type: true,
            severity: true,
            title: true,
            description: true,
            category: true,
            status: true,
            affectedPages: true,
            fixComplexity: true,
            businessImpact: true,
            blockingIndexing: true,
            securityConcern: true,
            rankingImpact: true,
            createdAt: true,
            _count: {
              select: {
                recommendations: true,
              },
            },
          },
        }),
        this.prisma.sEOIssue.count({ where }),
        
        // Get category breakdown for faceted navigation
        this.prisma.sEOIssue.groupBy({
          where: { analysisId },
          by: ['category', 'severity'],
          _count: { _all: true },
        }),
      ]);

      return {
        data: issues,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
        facets: {
          categories: categoryCounts,
        },
      };
    }, 3, 'filtered issues query');
  }

  /**
   * Enhanced cache operations with access tracking
   */
  async getCacheEntry(key: string): Promise<any> {
    return await databaseManager.executeWithRetry(async () => {
      const entry = await this.prisma.analysisCache.findUnique({
        where: { key },
        select: {
          data: true,
          expiresAt: true,
          version: true,
        },
      });
      
      if (entry && entry.expiresAt > new Date()) {
        // Update access statistics atomically
        await this.prisma.analysisCache.update({
          where: { key },
          data: {
            accessCount: { increment: 1 },
            lastAccessed: new Date(),
          },
        });
        
        return entry.data;
      }
      
      return null;
    });
  }

  async setCacheEntry(
    key: string, 
    data: any, 
    ttlSeconds: number = 3600,
    tags: string[] = []
  ): Promise<void> {
    return await databaseManager.executeWithRetry(async () => {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      const dataSize = JSON.stringify(data).length;
      
      await this.prisma.analysisCache.upsert({
        where: { key },
        update: {
          data,
          expiresAt,
          tags,
          size: dataSize,
          lastAccessed: new Date(),
          accessCount: { increment: 1 },
        },
        create: {
          key,
          url: '', // Will be set by caller if needed
          urlHash: key, // Use key as hash for non-URL entries
          data,
          analysisData: data, // Backward compatibility
          expiresAt,
          tags,
          size: dataSize,
        },
      });
    });
  }

  /**
   * Get cache statistics for monitoring
   */
  async getCacheStatistics(): Promise<any> {
    return await databaseManager.executeWithRetry(async () => {
      const [hitRatio, sizeStats, expirationStats] = await Promise.all([
        // Calculate cache hit ratio
        this.prisma.analysisCache.aggregate({
          _avg: { accessCount: true },
          _sum: { accessCount: true },
          _count: { _all: true },
        }),
        
        // Get size distribution
        this.prisma.analysisCache.aggregate({
          _sum: { size: true },
          _avg: { size: true },
          _max: { size: true },
        }),
        
        // Get expiration stats
        this.prisma.analysisCache.count({
          where: { expiresAt: { lt: new Date() } },
        }),
      ]);
      
      return {
        totalEntries: hitRatio._count._all,
        totalSize: sizeStats._sum.size || 0,
        averageSize: Math.round(sizeStats._avg.size || 0),
        maxSize: sizeStats._max.size || 0,
        expiredEntries: expirationStats,
        estimatedHitRatio: hitRatio._avg.accessCount || 0,
      };
    });
  }

  // ============ USER OPERATIONS ============
  
  async createUser(data: z.infer<typeof schemas.user.create>) {
    const validatedData = schemas.user.create.parse(data);
    
    return await databaseManager.executeWithRetry(async () => {
      return await this.prisma.user.create({
        data: validatedData,
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionTier: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  }

  async getUserById(id: string, includeSettings = false) {
    return await databaseManager.executeWithRetry(async () => {
      return await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionTier: true,
          emailVerified: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          settings: includeSettings,
          _count: {
            select: {
              projects: true,
              notifications: {
                where: { readAt: null },
              },
            },
          },
        },
      });
    });
  }

  async getUserByEmail(email: string) {
    return await databaseManager.executeWithRetry(async () => {
      return await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          name: true,
          subscriptionTier: true,
          emailVerified: true,
          lastLogin: true,
        },
      });
    });
  }

  // ============ PROJECT OPERATIONS ============

  async createProject(data: z.infer<typeof schemas.project.create>) {
    const validatedData = schemas.project.create.parse(data);
    
    return await databaseManager.executeWithRetry(async () => {
      return await withTransaction(async (tx) => {
        const project = await tx.project.create({
          data: validatedData,
          select: {
            id: true,
            name: true,
            url: true,
            faviconUrl: true,
            status: true,
            scanFrequency: true,
            currentScore: true,
            issueCount: true,
            lastScanDate: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        // Log project creation activity
        await tx.activityLog.create({
          data: {
            userId: validatedData.userId,
            action: 'project_created',
            entityType: 'project',
            entityId: project.id,
            details: {
              projectName: project.name,
              projectUrl: project.url,
            },
          },
        });

        return project;
      });
    });
  }

  async getProjectsByUser(
    userId: string,
    filters: z.infer<typeof schemas.project.filter>
  ) {
    const validatedFilters = schemas.project.filter.parse(filters);
    const { page, limit, sortBy, sortOrder, status, searchTerm } = validatedFilters;

    return await databaseManager.executeWithRetry(async () => {
      const where: Prisma.ProjectWhereInput = {
        userId,
        ...(status && { status }),
        ...(searchTerm && {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { url: { contains: searchTerm, mode: 'insensitive' } },
          ],
        }),
      };

      const [projects, total] = await Promise.all([
        this.prisma.project.findMany({
          where,
          ...withPagination({}, page, limit),
          ...withSorting({}, sortBy, sortOrder),
          select: {
            id: true,
            name: true,
            url: true,
            faviconUrl: true,
            status: true,
            scanFrequency: true,
            currentScore: true,
            issueCount: true,
            lastScanDate: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                analyses: true,
                crawlSessions: {
                  where: { status: 'completed' },
                },
              },
            },
          },
        }),
        this.prisma.project.count({ where }),
      ]);

      return {
        data: projects,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    });
  }

  async getProjectWithLatestAnalysis(projectId: string, userId: string) {
    return await databaseManager.executeWithRetry(async () => {
      return await this.prisma.project.findFirst({
        where: { id: projectId, userId },
        select: {
          id: true,
          name: true,
          url: true,
          faviconUrl: true,
          status: true,
          scanFrequency: true,
          currentScore: true,
          issueCount: true,
          lastScanDate: true,
          createdAt: true,
          updatedAt: true,
          analyses: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              overallScore: true,
              technicalScore: true,
              contentScore: true,
              onpageScore: true,
              uxScore: true,
              scoreChange: true,
              createdAt: true,
              _count: {
                select: {
                  issues: true,
                  recommendations: true,
                },
              },
              issues: {
                select: {
                  id: true,
                  severity: true,
                  category: true,
                  status: true,
                },
                orderBy: [
                  { severity: 'asc' },
                  { createdAt: 'desc' },
                ],
                take: 10,
              },
            },
          },
        },
      });
    });
  }

  async updateProject(projectId: string, userId: string, data: z.infer<typeof schemas.project.update>) {
    const validatedData = schemas.project.update.parse(data);
    
    return await databaseManager.executeWithRetry(async () => {
      return await this.prisma.project.update({
        where: { id: projectId, userId },
        data: validatedData,
        select: {
          id: true,
          name: true,
          url: true,
          faviconUrl: true,
          status: true,
          scanFrequency: true,
          currentScore: true,
          issueCount: true,
          lastScanDate: true,
          updatedAt: true,
        },
      });
    });
  }

  // ============ SEO ANALYSIS OPERATIONS ============

  async createSEOAnalysis(data: z.infer<typeof schemas.seoAnalysis.create>) {
    const validatedData = schemas.seoAnalysis.create.parse(data);
    
    return await databaseManager.executeWithRetry(async () => {
      return await withTransaction(async (tx) => {
        const analysis = await tx.sEOAnalysis.create({
          data: validatedData,
          include: withSEOAnalysisIncludes.basic,
        });

        // Update project's current score and last scan date
        await tx.project.update({
          where: { id: validatedData.projectId },
          data: {
            currentScore: validatedData.overallScore,
            lastScanDate: new Date(),
          },
        });

        return analysis;
      });
    });
  }

  async getAnalysesByProject(
    projectId: string,
    filters: z.infer<typeof schemas.seoAnalysis.filter>
  ) {
    const validatedFilters = schemas.seoAnalysis.filter.parse(filters);
    const { page, limit, sortBy, sortOrder, dateFrom, dateTo, minScore, maxScore } = validatedFilters;

    return await databaseManager.executeWithRetry(async () => {
      const where: Prisma.SEOAnalysisWhereInput = {
        projectId,
        ...(dateFrom && dateTo && {
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        }),
        ...(minScore !== undefined && maxScore !== undefined && {
          overallScore: {
            gte: minScore,
            lte: maxScore,
          },
        }),
      };

      const [analyses, total] = await Promise.all([
        this.prisma.sEOAnalysis.findMany({
          where,
          ...withPagination({}, page, limit),
          ...withSorting({}, sortBy, sortOrder),
          include: withSEOAnalysisIncludes.basic,
        }),
        this.prisma.sEOAnalysis.count({ where }),
      ]);

      return {
        data: analyses,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    });
  }

  async getAnalysisById(analysisId: string, includeDetailed = false) {
    return await databaseManager.executeWithRetry(async () => {
      return await this.prisma.sEOAnalysis.findUnique({
        where: { id: analysisId },
        include: includeDetailed ? withSEOAnalysisIncludes.detailed : withSEOAnalysisIncludes.basic,
      });
    });
  }

  async getAnalysisWithRelatedData(analysisId: string, userId: string, includeDetailed: boolean = true) {
    return await databaseManager.executeWithRetry(async () => {
      // Validate access and get analysis with all related data
      const analysis = await this.prisma.sEOAnalysis.findFirst({
        where: {
          id: analysisId,
          project: { userId }
        },
        include: includeDetailed ? {
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
          project: {
            select: {
              id: true,
              name: true,
              url: true,
              userId: true
            }
          }
        } : {
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
          project: {
            select: {
              id: true,
              name: true,
              url: true,
              userId: true
            }
          }
        }
      });

      if (!analysis) {
        throw new Error('Analysis not found or access denied');
      }

      return analysis;
    }, 3, 'analysis with related data');
  }

  // ============ ISSUE OPERATIONS ============

  async getIssuesByAnalysis(
    analysisId: string,
    filters: z.infer<typeof schemas.seoIssue.filter>
  ) {
    const validatedFilters = schemas.seoIssue.filter.parse(filters);
    const { page, limit, sortBy, sortOrder, severity, category, status, businessImpact } = validatedFilters;

    return await databaseManager.executeWithRetry(async () => {
      const where: Prisma.SEOIssueWhereInput = {
        analysisId,
        ...(severity && { severity }),
        ...(category && { category }),
        ...(status && { status }),
        ...(businessImpact && { businessImpact }),
      };

      const [issues, total] = await Promise.all([
        this.prisma.sEOIssue.findMany({
          where,
          ...withPagination({}, page, limit),
          ...withSorting({}, sortBy, sortOrder),
          select: {
            id: true,
            type: true,
            severity: true,
            title: true,
            description: true,
            category: true,
            status: true,
            affectedPages: true,
            fixComplexity: true,
            businessImpact: true,
            blockingIndexing: true,
            securityConcern: true,
            createdAt: true,
            _count: {
              select: {
                recommendations: true,
              },
            },
          },
        }),
        this.prisma.sEOIssue.count({ where }),
      ]);

      return {
        data: issues,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    });
  }

  // ============ CACHE OPERATIONS ============

  async getCachedAnalysis(urlHash: string) {
    return await databaseManager.executeWithRetry(async () => {
      const cached = await this.prisma.analysisCache.findUnique({
        where: { 
          urlHash,
          expiresAt: { gt: new Date() },
        },
        select: {
          data: true,
          analysisData: true,
          lastAccessed: true,
          accessCount: true
        },
      });

      if (cached) {
        // Update access statistics atomically
        await this.prisma.analysisCache.update({
          where: { urlHash },
          data: {
            accessCount: { increment: 1 },
            lastAccessed: new Date()
          }
        });
      }

      return cached;
    }, 2, 'cache retrieval');
  }

  async setCachedAnalysis(data: z.infer<typeof schemas.analysisCache.create>) {
    const validatedData = schemas.analysisCache.create.parse(data);
    
    return await databaseManager.executeWithRetry(async () => {
      return await this.prisma.analysisCache.upsert({
        where: { urlHash: validatedData.urlHash },
        create: {
          ...validatedData,
          accessCount: 1,
          lastAccessed: new Date()
        },
        update: {
          data: validatedData.data,
          analysisData: validatedData.analysisData,
          expiresAt: validatedData.expiresAt,
          accessCount: { increment: 1 },
          lastAccessed: new Date(),
          size: validatedData.size || 0
        },
      });
    }, 3, 'cache storage');
  }

  async cleanupExpiredCache() {
    return await databaseManager.executeWithRetry(async () => {
      const result = await this.prisma.analysisCache.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      });

      logger.info(`Cleaned up ${result.count} expired cache entries`);
      return result;
    }, 2, 'cache cleanup');
  }

  // ============ BULK OPERATIONS FOR PERFORMANCE ============

  async createAnalysisWithRelatedData(analysisData: {
    analysis: z.infer<typeof schemas.seoAnalysis.create>;
    issues?: z.infer<typeof schemas.seoIssue.create>[];
    recommendations?: z.infer<typeof schemas.seoRecommendation.create>[];
    metaTags?: z.infer<typeof schemas.metaTags.create>;
    performanceMetrics?: z.infer<typeof schemas.performanceMetrics.create>;
  }) {
    // Validate all input data
    const validatedAnalysis = schemas.seoAnalysis.create.parse(analysisData.analysis);
    const validatedIssues = analysisData.issues?.map(issue => 
      schemas.seoIssue.create.parse(issue)
    ) || [];
    const validatedRecommendations = analysisData.recommendations?.map(rec => 
      schemas.seoRecommendation.create.parse(rec)
    ) || [];

    return await databaseManager.executeWithRetry(async () => {
      return await withTransaction(async (tx) => {
        // Create analysis first
        const analysis = await tx.sEOAnalysis.create({
          data: validatedAnalysis
        });

        // Create related data in parallel where possible
        const [issues, recommendations, metaTags, performanceMetrics] = await Promise.all([
          // Bulk create issues
          validatedIssues.length > 0 ? tx.sEOIssue.createMany({
            data: validatedIssues.map(issue => ({
              ...issue,
              analysisId: analysis.id
            }))
          }) : Promise.resolve({ count: 0 }),

          // Bulk create recommendations
          validatedRecommendations.length > 0 ? tx.sEORecommendation.createMany({
            data: validatedRecommendations.map(rec => ({
              ...rec,
              analysisId: analysis.id
            }))
          }) : Promise.resolve({ count: 0 }),

          // Create meta tags if provided
          analysisData.metaTags ? tx.metaTags.create({
            data: {
              ...analysisData.metaTags,
              analysisId: analysis.id
            }
          }) : Promise.resolve(null),

          // Create performance metrics if provided
          analysisData.performanceMetrics ? tx.performanceMetrics.create({
            data: {
              ...analysisData.performanceMetrics,
              analysisId: analysis.id
            }
          }) : Promise.resolve(null)
        ]);

        // Update project statistics
        await this.updateProjectStatistics(validatedAnalysis.projectId, tx);

        return {
          analysis,
          issuesCreated: issues.count,
          recommendationsCreated: recommendations.count,
          metaTags,
          performanceMetrics
        };
      });
    }, 3, 'analysis creation with related data');
  }

  private async updateProjectStatistics(projectId: string, tx?: Prisma.TransactionClient) {
    const prisma = tx || this.prisma;

    // Get latest analysis for this project
    const latestAnalysis = await prisma.sEOAnalysis.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: {
        overallScore: true,
        createdAt: true,
        _count: {
          select: {
            issues: true
          }
        }
      }
    });

    if (latestAnalysis) {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          currentScore: latestAnalysis.overallScore,
          issueCount: latestAnalysis._count.issues,
          lastScanDate: latestAnalysis.createdAt
        }
      });
    }
  }

  // ============ HEALTH CHECK ============

  async healthCheck() {
    try {
      const startTime = Date.now();

      // Test basic connectivity and complex query
      const [basicTest, complexTest] = await Promise.all([
        this.prisma.$queryRaw`SELECT 1`,
        this.prisma.user.count()
      ]);

      const responseTime = Date.now() - startTime;

      return { 
        status: 'healthy', 
        timestamp: new Date(),
        responseTime: `${responseTime}ms`,
        tests: {
          basic: !!basicTest,
          complex: typeof complexTest === 'number'
        }
      };
    } catch (error) {
      throw new Error(`Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============ DATABASE METRICS ============

  async getDatabaseMetrics() {
    try {
      const [
        connectionInfo,
        databaseSize,
        tableStats,
        activityStats
      ] = await Promise.all([
        // Connection information
        this.prisma.$queryRaw`
          SELECT 
            current_database() as database_name,
            current_user as current_user,
            version() as version,
            NOW() as server_time
        `,

        // Database size
        this.prisma.$queryRaw`
          SELECT 
            pg_size_pretty(pg_database_size(current_database())) as database_size,
            pg_database_size(current_database()) as database_size_bytes
        `,

        // Table statistics
        this.prisma.$queryRaw`
          SELECT 
            schemaname,
            tablename,
            attname,
            n_distinct,
            correlation,
            most_common_vals
          FROM pg_stats 
          WHERE schemaname = 'public'
          LIMIT 10
        `,

        // Current activity
        this.prisma.$queryRaw`
          SELECT 
            COUNT(*) as active_connections,
            COUNT(*) FILTER (WHERE state = 'active') as active_queries,
            COUNT(*) FILTER (WHERE state = 'idle') as idle_connections
          FROM pg_stat_activity 
          WHERE datname = current_database()
        `
      ]);

      return {
        connection: connectionInfo,
        size: databaseSize,
        tableStats,
        activity: activityStats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get database metrics:', error);
      return {
        error: 'Failed to retrieve database metrics',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getCacheStats() {
    try {
      const [
        cacheOverview,
        sizeDistribution,
        accessPatterns,
        expiration
      ] = await Promise.all([
        // Cache overview
        this.prisma.analysisCache.aggregate({
          _count: { id: true },
          _sum: { size: true, accessCount: true },
          _avg: { size: true, accessCount: true }
        }),

        // Size distribution
        this.prisma.$queryRaw`
          SELECT 
            CASE 
              WHEN size < 1024 THEN 'small (<1KB)'
              WHEN size < 10240 THEN 'medium (1-10KB)'
              WHEN size < 102400 THEN 'large (10-100KB)'
              ELSE 'very_large (>100KB)'
            END as size_category,
            COUNT(*) as count,
            AVG(size) as avg_size
          FROM analysis_cache
          GROUP BY size_category
          ORDER BY avg_size
        `,

        // Access patterns
        this.prisma.$queryRaw`
          SELECT 
            DATE(last_accessed) as access_date,
            COUNT(*) as entries_accessed,
            SUM(access_count) as total_accesses,
            AVG(access_count) as avg_accesses
          FROM analysis_cache
          WHERE last_accessed >= NOW() - INTERVAL '7 days'
          GROUP BY DATE(last_accessed)
          ORDER BY access_date DESC
          LIMIT 7
        `,

        // Expiration analysis
        this.prisma.$queryRaw`
          SELECT 
            COUNT(*) FILTER (WHERE expires_at > NOW()) as active_entries,
            COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_entries,
            COUNT(*) FILTER (WHERE expires_at > NOW() + INTERVAL '1 day') as long_term_entries
          FROM analysis_cache
        `
      ]);

      return {
        overview: {
          totalEntries: cacheOverview._count.id,
          totalSize: cacheOverview._sum.size || 0,
          totalAccesses: cacheOverview._sum.accessCount || 0,
          averageSize: Math.round(cacheOverview._avg.size || 0),
          averageAccesses: Math.round(cacheOverview._avg.accessCount || 0)
        },
        sizeDistribution,
        accessPatterns,
        expiration,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get cache stats:', error);
      return {
        error: 'Failed to retrieve cache statistics',
        timestamp: new Date().toISOString()
      };
    }
  }
} 