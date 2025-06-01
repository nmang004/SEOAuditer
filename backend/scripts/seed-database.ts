import { PrismaClient } from '@prisma/client';
import { databaseManager, DatabasePerformanceMonitor } from '../src/config/database';
import { schemas } from '../src/schemas/validation';
import { logger } from '../src/utils/logger';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Sample data for seeding
const sampleUsers = [
  {
    email: 'john.doe@example.com',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    name: 'John Doe',
    subscriptionTier: 'premium' as const,
  },
  {
    email: 'jane.smith@example.com',
    passwordHash: crypto.createHash('sha256').update('password456').digest('hex'),
    name: 'Jane Smith',
    subscriptionTier: 'basic' as const,
  },
];

const sampleProjects = [
  {
    name: 'E-commerce Website',
    url: 'https://example-ecommerce.com',
    faviconUrl: 'https://example-ecommerce.com/favicon.ico',
    status: 'active' as const,
    scanFrequency: 'weekly' as const,
  },
  {
    name: 'Blog Site',
    url: 'https://example-blog.com',
    status: 'active' as const,
    scanFrequency: 'daily' as const,
  },
  {
    name: 'Corporate Website',
    url: 'https://example-corp.com',
    status: 'paused' as const,
    scanFrequency: 'monthly' as const,
  },
];

const generateSEOIssues = (analysisId: string) => [
  {
    analysisId,
    type: 'missing_meta_description',
    severity: 'high' as const,
    title: 'Missing Meta Description',
    description: 'Page is missing a meta description tag, which affects search engine snippets.',
    recommendation: 'Add a compelling meta description between 120-160 characters.',
    category: 'onpage' as const,
    affectedPages: 15,
    fixComplexity: 'easy' as const,
    estimatedTime: '2-4 hours',
    businessImpact: 'medium' as const,
    implementationSteps: [
      'Identify pages without meta descriptions',
      'Write unique descriptions for each page',
      'Implement meta description tags',
      'Test and validate changes',
    ],
    validationCriteria: [
      'All pages have unique meta descriptions',
      'Descriptions are 120-160 characters long',
      'Descriptions include target keywords',
    ],
    blockingIndexing: false,
    securityConcern: false,
    rankingImpact: 'moderate' as const,
    affectedCategories: ['onpage', 'content'],
  },
  {
    analysisId,
    type: 'slow_page_speed',
    severity: 'critical' as const,
    title: 'Slow Page Load Speed',
    description: 'Page load time exceeds 3 seconds, negatively impacting user experience and SEO.',
    recommendation: 'Optimize images, enable compression, and minimize JavaScript.',
    category: 'technical' as const,
    affectedPages: 1,
    fixComplexity: 'hard' as const,
    estimatedTime: '1-2 weeks',
    businessImpact: 'high' as const,
    implementationSteps: [
      'Audit current performance metrics',
      'Optimize and compress images',
      'Enable GZIP compression',
      'Minimize CSS and JavaScript',
      'Implement lazy loading',
    ],
    validationCriteria: [
      'Page load time under 2 seconds',
      'Core Web Vitals pass Google thresholds',
      'Performance score above 90',
    ],
    blockingIndexing: false,
    securityConcern: false,
    rankingImpact: 'major' as const,
    enhancementType: 'performance' as const,
    affectedCategories: ['technical', 'ux'],
  },
  {
    analysisId,
    type: 'missing_alt_text',
    severity: 'medium' as const,
    title: 'Images Missing Alt Text',
    description: 'Several images lack descriptive alt text, affecting accessibility and SEO.',
    recommendation: 'Add descriptive alt text to all images for better accessibility.',
    category: 'content' as const,
    affectedPages: 8,
    fixComplexity: 'medium' as const,
    estimatedTime: '4-6 hours',
    businessImpact: 'medium' as const,
    implementationSteps: [
      'Identify images without alt text',
      'Write descriptive alt text for each image',
      'Update image tags',
      'Test with screen readers',
    ],
    validationCriteria: [
      'All images have descriptive alt text',
      'Alt text describes image content accurately',
      'Decorative images use empty alt attributes',
    ],
    blockingIndexing: false,
    securityConcern: false,
    rankingImpact: 'minor' as const,
    enhancementType: 'accessibility' as const,
    affectedCategories: ['content', 'ux'],
  },
];

const generateSEORecommendations = (analysisId: string) => [
  {
    analysisId,
    priority: 'immediate' as const,
    category: 'technical' as const,
    title: 'Fix Critical Performance Issues',
    description: 'Address slow loading times and improve Core Web Vitals to enhance user experience and search rankings.',
    implementationSteps: {
      step1: 'Analyze current performance metrics using Google PageSpeed Insights',
      step2: 'Optimize images by compressing and converting to modern formats',
      step3: 'Enable GZIP compression on server',
      step4: 'Minimize and defer non-critical JavaScript',
      step5: 'Implement lazy loading for images and videos',
    },
    codeExamples: {
      lazyLoading: '<img src="image.jpg" loading="lazy" alt="Description">',
      compression: 'Enable gzip in .htaccess or server configuration',
    },
    tools: ['Google PageSpeed Insights', 'GTmetrix', 'WebPageTest'],
    resources: [
      'https://web.dev/performance/',
      'https://developers.google.com/speed/pagespeed/insights/',
    ],
    expectedResults: {
      seoImpact: 'Improved search rankings due to better user experience signals',
      userExperience: '50% reduction in bounce rate, 30% increase in engagement',
      businessImpact: 'Higher conversion rates and improved user satisfaction',
    },
    validation: {
      successCriteria: 'Page load time under 2 seconds, LCP under 2.5s, CLS under 0.1',
      testingMethods: 'Use Lighthouse, PageSpeed Insights, and real user monitoring',
    },
    effortLevel: 'hard' as const,
    timeEstimate: '2-3 weeks',
    businessValue: 'high' as const,
    quickWin: false,
    status: 'pending' as const,
  },
  {
    analysisId,
    priority: 'high' as const,
    category: 'onpage' as const,
    title: 'Optimize Meta Tags',
    description: 'Improve meta titles and descriptions to enhance search visibility and click-through rates.',
    implementationSteps: {
      step1: 'Audit existing meta tags across all pages',
      step2: 'Research target keywords for each page',
      step3: 'Write compelling titles (50-60 characters)',
      step4: 'Create unique descriptions (120-160 characters)',
      step5: 'Implement and test changes',
    },
    tools: ['Screaming Frog', 'Ahrefs', 'SEMrush'],
    resources: [
      'https://moz.com/learn/seo/title-tag',
      'https://moz.com/learn/seo/meta-description',
    ],
    expectedResults: {
      seoImpact: '15-25% improvement in organic click-through rates',
      userExperience: 'Better search result snippets attract more qualified traffic',
      businessImpact: 'Increased organic traffic and better user engagement',
    },
    validation: {
      successCriteria: 'All pages have unique, optimized meta tags within character limits',
      testingMethods: 'Monitor CTR in Google Search Console, A/B test different descriptions',
    },
    effortLevel: 'easy' as const,
    timeEstimate: '1 week',
    businessValue: 'high' as const,
    quickWin: true,
    status: 'pending' as const,
  },
];

async function seedDatabase() {
  try {
    logger.info('🌱 Starting database seeding...');
    
    // Connect to database
    await databaseManager.connect();
    
    logger.info('🧹 Cleaning existing data...');
    // Clean up existing data in reverse order of dependencies
    await prisma.sEORecommendation.deleteMany();
    await prisma.sEOIssue.deleteMany();
    await prisma.performanceMetrics.deleteMany();
    await prisma.contentAnalysis.deleteMany();
    await prisma.sEOScoreBreakdown.deleteMany();
    await prisma.metaTags.deleteMany();
    await prisma.sEOAnalysis.deleteMany();
    await prisma.crawlSession.deleteMany();
    await prisma.project.deleteMany();
    await prisma.activityLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.userSettings.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    
    logger.info('👥 Creating users...');
    const users = [];
    for (const userData of sampleUsers) {
      try {
        const validatedUser = schemas.user.create.parse(userData);
        const user = await prisma.user.create({
          data: validatedUser,
        });
        users.push(user);
        logger.info(`✅ Created user: ${user.email}`);
      } catch (error) {
        logger.error(`❌ Failed to create user ${userData.email}:`, error);
      }
    }
    
    logger.info('🏢 Creating projects...');
    const projects = [];
    for (let i = 0; i < sampleProjects.length; i++) {
      const projectData = {
        ...sampleProjects[i],
        userId: users[i % users.length].id,
      };
      
      try {
        const validatedProject = schemas.project.create.parse(projectData);
        const project = await prisma.project.create({
          data: validatedProject,
        });
        projects.push(project);
        logger.info(`✅ Created project: ${project.name}`);
      } catch (error) {
        logger.error(`❌ Failed to create project ${projectData.name}:`, error);
      }
    }
    
    logger.info('🔍 Creating crawl sessions and analyses...');
    for (const project of projects) {
      // Create crawl session
      const crawlSessionData = {
        projectId: project.id,
        url: project.url,
        status: 'completed' as const,
        startedAt: new Date(Date.now() - 60000), // 1 minute ago
        completedAt: new Date(),
      };
      
      try {
        const validatedCrawlSession = schemas.crawlSession.create.parse(crawlSessionData);
        const crawlSession = await prisma.crawlSession.create({
          data: validatedCrawlSession,
        });
        
        // Create SEO analysis
        const analysisData = {
          crawlSessionId: crawlSession.id,
          projectId: project.id,
          overallScore: Math.floor(Math.random() * 40) + 60, // 60-100
          technicalScore: Math.floor(Math.random() * 30) + 70, // 70-100
          contentScore: Math.floor(Math.random() * 40) + 50, // 50-90
          onpageScore: Math.floor(Math.random() * 30) + 60, // 60-90
          uxScore: Math.floor(Math.random() * 40) + 60, // 60-100
          previousScore: Math.floor(Math.random() * 40) + 50, // 50-90
        };
        
        const validatedAnalysis = schemas.seoAnalysis.create.parse(analysisData);
        const analysis = await prisma.sEOAnalysis.create({
          data: validatedAnalysis,
        });
        
        logger.info(`✅ Created analysis for project: ${project.name} (Score: ${analysis.overallScore})`);
        
        // Create meta tags
        const metaTagsData = {
          analysisId: analysis.id,
          title: `${project.name} - Best Products Online`,
          description: `Discover amazing products at ${project.name}. Quality guaranteed with fast shipping.`,
          titleLength: 35,
          descriptionLength: 85,
          canonicalUrl: project.url,
          robots: 'index, follow',
          openGraph: {
            title: `${project.name} - Best Products Online`,
            description: 'Quality products with fast shipping',
            image: `${project.url}/og-image.jpg`,
          },
          twitterCard: {
            card: 'summary_large_image',
            title: `${project.name}`,
            description: 'Quality products online',
          },
        };
        
        const validatedMetaTags = schemas.metaTags.create.parse(metaTagsData);
        await prisma.metaTags.create({
          data: validatedMetaTags,
        });
        
        // Create content analysis
        const contentAnalysisData = {
          analysisId: analysis.id,
          wordCount: Math.floor(Math.random() * 2000) + 500, // 500-2500
          readingTime: Math.floor(Math.random() * 10) + 3, // 3-13 minutes
          paragraphCount: Math.floor(Math.random() * 20) + 5, // 5-25
          sentenceCount: Math.floor(Math.random() * 50) + 20, // 20-70
          averageSentenceLength: Math.random() * 10 + 15, // 15-25
          topicCoverage: Math.random() * 0.5 + 0.5, // 0.5-1.0
          contentStructure: {
            headingStructure: 'good',
            paragraphLength: 'optimal',
            listUsage: 'adequate',
          },
          readabilityMetrics: {
            fleschKincaid: Math.random() * 20 + 60, // 60-80
            automatedReadability: Math.random() * 15 + 55, // 55-70
          },
          keywordAnalysis: {
            density: Math.random() * 3 + 1, // 1-4%
            distribution: 'good',
            relevance: 'high',
          },
          freshnessData: {
            lastUpdated: new Date().toISOString(),
            updateFrequency: 'monthly',
          },
          qualityMetrics: {
            uniqueness: Math.random() * 20 + 80, // 80-100%
            expertise: 'good',
            trustworthiness: 'high',
          },
          overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
          recommendations: [
            'Add more internal links to related content',
            'Include more relevant keywords naturally',
            'Improve readability with shorter sentences',
          ],
        };
        
        const validatedContentAnalysis = schemas.contentAnalysis.create.parse(contentAnalysisData);
        await prisma.contentAnalysis.create({
          data: validatedContentAnalysis,
        });
        
        // Create performance metrics
        const performanceData = {
          analysisId: analysis.id,
          coreWebVitals: {
            lcp: Math.random() * 2000 + 1500, // 1.5-3.5s
            fid: Math.random() * 200 + 50, // 50-250ms
            cls: Math.random() * 0.3, // 0-0.3
            fcp: Math.random() * 1000 + 800, // 0.8-1.8s
            ttfb: Math.random() * 500 + 200, // 200-700ms
          },
          loadTime: Math.floor(Math.random() * 3000) + 1000, // 1-4s
          pageSize: Math.floor(Math.random() * 2000000) + 500000, // 0.5-2.5MB
          requestCount: Math.floor(Math.random() * 50) + 20, // 20-70
          performanceScore: Math.floor(Math.random() * 40) + 60, // 60-100
          mobilePerfScore: Math.floor(Math.random() * 30) + 50, // 50-80
          optimizationOpportunities: {
            imageOptimization: 'high',
            codeMinification: 'medium',
            caching: 'low',
          },
          lighthouseData: {
            performance: Math.random() * 40 + 60,
            accessibility: Math.random() * 30 + 70,
            bestPractices: Math.random() * 20 + 80,
            seo: Math.random() * 15 + 85,
          },
        };
        
        const validatedPerformanceMetrics = schemas.performanceMetrics.create.parse(performanceData);
        await prisma.performanceMetrics.create({
          data: validatedPerformanceMetrics,
        });
        
        // Create issues
        logger.info(`📋 Creating SEO issues for ${project.name}...`);
        const issues = generateSEOIssues(analysis.id);
        for (const issueData of issues) {
          try {
            const validatedIssue = schemas.seoIssue.create.parse(issueData);
            await prisma.sEOIssue.create({
              data: validatedIssue,
            });
          } catch (error) {
            logger.error(`❌ Failed to create issue:`, error);
          }
        }
        
        // Create recommendations
        logger.info(`💡 Creating recommendations for ${project.name}...`);
        const recommendations = generateSEORecommendations(analysis.id);
        for (const recData of recommendations) {
          try {
            const validatedRecommendation = schemas.seoRecommendation.create.parse(recData);
            await prisma.sEORecommendation.create({
              data: validatedRecommendation,
            });
          } catch (error) {
            logger.error(`❌ Failed to create recommendation:`, error);
          }
        }
        
        // Update project with current score and issue count
        const issueCount = await prisma.sEOIssue.count({
          where: { analysisId: analysis.id },
        });
        
        await prisma.project.update({
          where: { id: project.id },
          data: {
            currentScore: analysis.overallScore,
            issueCount,
            lastScanDate: new Date(),
          },
        });
        
      } catch (error) {
        logger.error(`❌ Failed to create analysis for project ${project.name}:`, error);
      }
    }
    
    // Create some cache entries for testing
    logger.info('💾 Creating analysis cache entries...');
    for (let i = 0; i < 5; i++) {
      const url = `https://example${i}.com`;
      const urlHash = crypto.createHash('md5').update(url).digest('hex');
      const cacheData = {
        key: `analysis_${urlHash}`,
        url,
        urlHash,
        data: {
          timestamp: new Date().toISOString(),
          analysisVersion: '1.0',
        },
        analysisData: {
          scores: {
            overall: Math.floor(Math.random() * 40) + 60,
            technical: Math.floor(Math.random() * 30) + 70,
          },
          issues: Math.floor(Math.random() * 10) + 1,
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        tags: ['seo', 'analysis', 'automated'],
        size: Math.floor(Math.random() * 10000) + 5000,
      };
      
      try {
        const validatedCache = schemas.analysisCache.create.parse(cacheData);
        await prisma.analysisCache.create({
          data: validatedCache,
        });
      } catch (error) {
        logger.error(`❌ Failed to create cache entry:`, error);
      }
    }
    
    // Performance test
    logger.info('⚡ Running performance tests...');
    const startTime = Date.now();
    
    // Test complex query with joins
    const complexQuery = await prisma.sEOAnalysis.findMany({
      include: {
        crawlSession: {
          include: {
            project: true,
          },
        },
        issues: {
          orderBy: [
            { severity: 'asc' },
            { businessImpact: 'asc' },
          ],
        },
        recommendations: {
          orderBy: { priority: 'asc' },
        },
        metaTags: true,
        scoreBreakdown: true,
      },
      take: 10,
    });
    
    const queryTime = Date.now() - startTime;
    logger.info(`✅ Complex query completed in ${queryTime}ms`);
    
    // Get performance metrics
    const metrics = DatabasePerformanceMonitor.getMetrics();
    logger.info('📊 Database Performance Metrics:', metrics);
    
    // Verify data integrity
    logger.info('🔍 Verifying data integrity...');
    const counts = {
      users: await prisma.user.count(),
      projects: await prisma.project.count(),
      analyses: await prisma.sEOAnalysis.count(),
      issues: await prisma.sEOIssue.count(),
      recommendations: await prisma.sEORecommendation.count(),
      cache: await prisma.analysisCache.count(),
    };
    
    logger.info('📈 Final Database Counts:', counts);
    
    logger.info('🎉 Database seeding completed successfully!');
    logger.info('✨ Sample data includes:');
    logger.info(`   - ${counts.users} users with different subscription tiers`);
    logger.info(`   - ${counts.projects} projects with various statuses`);
    logger.info(`   - ${counts.analyses} SEO analyses with comprehensive data`);
    logger.info(`   - ${counts.issues} SEO issues with different severities`);
    logger.info(`   - ${counts.recommendations} actionable recommendations`);
    logger.info(`   - ${counts.cache} cached analysis entries`);
    
  } catch (error) {
    logger.error('💥 Database seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await databaseManager.disconnect();
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase }; 