import { databaseManager } from '../src/config/database';
import { DatabaseService } from '../src/services/DatabaseService';
import { schemas } from '../src/schemas/validation';
import { logger } from '../src/utils/logger';

const dbService = new DatabaseService();

async function seedDatabase() {
  try {
    console.log('🌱 Starting enhanced database seeding...');
    
    // Connect to database
    await databaseManager.connect();
    console.log('✅ Database connected');

    // Clean up existing data (optional - only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 Cleaning up existing test data...');
      await cleanupTestData();
    }

    // Create test user
    const testUser = await createTestUser();
    console.log(`✅ Created test user: ${testUser.email}`);

    // Create test projects
    const projects = await createTestProjects(testUser.id);
    console.log(`✅ Created ${projects.length} test projects`);

    // Create test analyses for each project
    for (const project of projects) {
      const analysis = await createTestAnalysis(project.id);
      console.log(`✅ Created analysis for project: ${project.name}`);

      // Create test issues for the analysis
      const issues = await createTestIssues(analysis.id);
      console.log(`✅ Created ${issues.length} test issues`);

      // Create test recommendations
      const recommendations = await createTestRecommendations(analysis.id, issues);
      console.log(`✅ Created ${recommendations.length} test recommendations`);
    }

    // Create cache entries
    await createCacheEntries();
    console.log('✅ Created test cache entries');

    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    logger.error('Database seeding failed:', error);
    throw error;
  } finally {
    await databaseManager.disconnect();
  }
}

async function cleanupTestData() {
  const prisma = databaseManager.getPrisma();
  
  // Delete in order of dependencies
  await prisma.sEORecommendation.deleteMany({
    where: { analysis: { project: { user: { email: { contains: 'test' } } } } }
  });
  
  await prisma.sEOIssue.deleteMany({
    where: { analysis: { project: { user: { email: { contains: 'test' } } } } }
  });
  
  await prisma.sEOAnalysis.deleteMany({
    where: { project: { user: { email: { contains: 'test' } } } }
  });
  
  await prisma.crawlSession.deleteMany({
    where: { project: { user: { email: { contains: 'test' } } } }
  });
  
  await prisma.project.deleteMany({
    where: { user: { email: { contains: 'test' } } }
  });
  
  await prisma.user.deleteMany({
    where: { email: { contains: 'test' } }
  });
  
  await prisma.analysisCache.deleteMany({
    where: { url: { contains: 'test' } }
  });
}

async function createTestUser() {
  const userData = schemas.user.create.parse({
    email: 'test-user@example.com',
    passwordHash: '$2b$10$mockedhashfortest1234567890123456789012345678901234567890', // bcrypt hash
    name: 'Test User',
    subscriptionTier: 'premium',
  });

  return await dbService.createUser(userData);
}

async function createTestProjects(userId: string) {
  const projectsData = [
    {
      userId,
      name: 'E-commerce Store',
      url: 'https://test-ecommerce.example.com',
      status: 'active' as const,
      scanFrequency: 'weekly' as const,
    },
    {
      userId,
      name: 'Corporate Blog',
      url: 'https://test-blog.example.com',
      status: 'active' as const,
      scanFrequency: 'daily' as const,
    },
    {
      userId,
      name: 'Portfolio Site',
      url: 'https://test-portfolio.example.com',
      status: 'paused' as const,
      scanFrequency: 'monthly' as const,
    },
  ];

  const projects = [];
  for (const projectData of projectsData) {
    const validatedData = schemas.project.create.parse(projectData);
    const project = await dbService.createProject(validatedData);
    projects.push(project);
  }

  return projects;
}

async function createTestAnalysis(projectId: string) {
  const prisma = databaseManager.getPrisma();
  
  // First create a crawl session
  const crawlSession = await prisma.crawlSession.create({
    data: {
      projectId,
      url: 'https://test-url.example.com',
      status: 'completed',
      startedAt: new Date(Date.now() - 300000), // 5 minutes ago
      completedAt: new Date(),
    },
  });

  const analysisData = schemas.seoAnalysis.create.parse({
    crawlSessionId: crawlSession.id,
    projectId,
    overallScore: 78,
    technicalScore: 85,
    contentScore: 72,
    onpageScore: 80,
    uxScore: 75,
    previousScore: 72,
    scoreChange: 6,
  });

  return await dbService.createSEOAnalysis(analysisData);
}

async function createTestIssues(analysisId: string) {
  const issuesData = [
    {
      analysisId,
      type: 'missing_meta_description',
      severity: 'high' as const,
      title: 'Missing Meta Description',
      description: 'Several pages are missing meta descriptions which are important for SEO.',
      recommendation: 'Add unique meta descriptions to all pages, ideally 150-160 characters long.',
      status: 'new' as const,
      category: 'onpage' as const,
      affectedPages: 15,
      fixComplexity: 'easy' as const,
      estimatedTime: '2-3 hours',
      businessImpact: 'medium' as const,
      implementationSteps: [
        'Audit all pages missing meta descriptions',
        'Write compelling descriptions for each page',
        'Implement descriptions in CMS or HTML',
        'Test and validate changes'
      ],
      validationCriteria: [
        'All pages have meta descriptions',
        'Descriptions are 150-160 characters',
        'No duplicate descriptions exist'
      ],
      affectedCategories: ['onpage', 'content'],
    },
    {
      analysisId,
      type: 'slow_page_speed',
      severity: 'critical' as const,
      title: 'Slow Page Load Speed',
      description: 'Core Web Vitals scores are below Google\'s recommended thresholds.',
      recommendation: 'Optimize images, minify CSS/JS, and implement caching strategies.',
      status: 'new' as const,
      category: 'technical' as const,
      affectedPages: 1,
      fixComplexity: 'hard' as const,
      estimatedTime: '1-2 weeks',
      businessImpact: 'high' as const,
      blockingIndexing: false,
      securityConcern: false,
      rankingImpact: 'major' as const,
      implementationSteps: [
        'Audit page performance with Lighthouse',
        'Optimize and compress images',
        'Minify CSS and JavaScript files',
        'Implement browser caching',
        'Consider CDN implementation'
      ],
      validationCriteria: [
        'LCP under 2.5 seconds',
        'FID under 100ms',
        'CLS under 0.1'
      ],
      affectedCategories: ['technical', 'ux'],
    },
    {
      analysisId,
      type: 'broken_internal_links',
      severity: 'medium' as const,
      title: 'Broken Internal Links',
      description: 'Found several internal links returning 404 errors.',
      recommendation: 'Fix or remove broken internal links to improve user experience and crawlability.',
      status: 'in_progress' as const,
      category: 'technical' as const,
      affectedPages: 8,
      fixComplexity: 'medium' as const,
      estimatedTime: '4-6 hours',
      businessImpact: 'medium' as const,
      implementationSteps: [
        'Identify all broken internal links',
        'Determine correct target URLs',
        'Update or remove broken links',
        'Implement redirects where necessary'
      ],
      validationCriteria: [
        'No 404 errors from internal links',
        'All navigation paths functional',
        'Proper redirects in place'
      ],
      affectedCategories: ['technical'],
    },
  ];

  const prisma = databaseManager.getPrisma();
  const issues = [];
  
  for (const issueData of issuesData) {
    const validatedData = schemas.seoIssue.create.parse(issueData);
    const issue = await prisma.sEOIssue.create({ data: validatedData });
    issues.push(issue);
  }

  return issues;
}

async function createTestRecommendations(analysisId: string, issues: any[]) {
  const recommendationsData = [
    {
      analysisId,
      issueId: issues[0]?.id,
      priority: 'high' as const,
      category: 'onpage' as const,
      title: 'Implement Meta Description Strategy',
      description: 'Create a comprehensive meta description strategy for all pages.',
      implementationSteps: {
        steps: [
          {
            step: 1,
            action: 'Content audit',
            description: 'Review all pages and identify missing meta descriptions',
            duration: '2 hours'
          },
          {
            step: 2,
            action: 'Write descriptions',
            description: 'Create unique, compelling meta descriptions',
            duration: '4 hours'
          }
        ]
      },
      tools: ['Google Search Console', 'Screaming Frog', 'Yoast SEO'],
      resources: [
        'https://developers.google.com/search/docs/advanced/appearance/snippet',
        'https://moz.com/learn/seo/meta-description'
      ],
      expectedResults: {
        seo: 'Improved click-through rates from search results',
        user: 'Better understanding of page content before clicking',
        business: 'Increased organic traffic and engagement'
      },
      validation: {
        criteria: ['All pages have meta descriptions', 'CTR improvement measured'],
        timeline: '2 weeks post-implementation'
      },
      effortLevel: 'easy' as const,
      timeEstimate: '6-8 hours',
      businessValue: 'medium' as const,
      quickWin: true,
      status: 'pending' as const,
    },
    {
      analysisId,
      priority: 'immediate' as const,
      category: 'technical' as const,
      title: 'Performance Optimization Sprint',
      description: 'Comprehensive performance optimization to improve Core Web Vitals.',
      implementationSteps: {
        phase1: ['Image optimization', 'CSS minification'],
        phase2: ['JavaScript optimization', 'Caching implementation'],
        phase3: ['CDN setup', 'Advanced optimizations']
      },
      tools: ['Google PageSpeed Insights', 'GTmetrix', 'WebP Converter'],
      resources: [
        'https://web.dev/vitals/',
        'https://developers.google.com/speed/pagespeed/insights/'
      ],
      expectedResults: {
        seo: 'Better search rankings and Core Web Vitals scores',
        user: 'Faster page loads and improved user experience',
        business: 'Reduced bounce rate and increased conversions'
      },
      validation: {
        criteria: ['Core Web Vitals pass', 'PageSpeed score > 90'],
        timeline: '1 month post-implementation'
      },
      effortLevel: 'hard' as const,
      timeEstimate: '2-3 weeks',
      businessValue: 'high' as const,
      quickWin: false,
      status: 'pending' as const,
    },
  ];

  const recommendations = [];
  for (const recData of recommendationsData) {
    const validatedData = schemas.seoRecommendation.create.parse(recData);
    const prisma = databaseManager.getPrisma();
    const recommendation = await prisma.sEORecommendation.create({
      data: validatedData,
    });
    recommendations.push(recommendation);
  }

  return recommendations;
}

async function createCacheEntries() {
  const prisma = databaseManager.getPrisma();
  
  const cacheEntries = [
    {
      key: 'analysis_test1',
      url: 'https://test-url-1.example.com',
      urlHash: 'abcd1234567890abcd1234567890abcd',
      data: { analysis: 'mock data 1' },
      analysisData: { scores: { overall: 85 } },
      expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
      tags: ['test', 'analysis'],
      size: 1024,
      version: '1.0',
    },
    {
      key: 'analysis_test2',
      url: 'https://test-url-2.example.com',
      urlHash: 'efgh5678901234efgh5678901234efgh',
      data: { analysis: 'mock data 2' },
      analysisData: { scores: { overall: 72 } },
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      tags: ['test', 'performance'],
      size: 2048,
      version: '1.0',
    },
  ];

  for (const cacheData of cacheEntries) {
    const validatedData = schemas.analysisCache.create.parse(cacheData);
    await prisma.analysisCache.create({ data: validatedData });
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