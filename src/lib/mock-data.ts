import { Project, Analysis, Issue, Recommendation, ScoreCategory } from './types';
import { scoreCategories, issueSeverity } from './constants';
import { generateId } from './utils';

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random date within the last n days
 */
function randomDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, days));
  return date.toISOString();
}

/**
 * Generate mock projects
 */
export function generateMockProjects(count: number = 5): Project[] {
  const websites = [
    { name: 'Tech Innovators', url: 'techinnovators.com' },
    { name: 'Green Solutions', url: 'greensolutions.org' },
    { name: 'Global Finance', url: 'globalfinance.net' },
    { name: 'Health Partners', url: 'healthpartners.com' },
    { name: 'Travel Explorers', url: 'travelexplorers.com' },
    { name: 'Digital Marketing Pro', url: 'digitalmarketingpro.com' },
    { name: 'Creative Studios', url: 'creativestudios.io' },
    { name: 'Food Delivery', url: 'fooddelivery.app' },
    { name: 'Education Portal', url: 'educationportal.edu' },
    { name: 'Fitness Tracker', url: 'fitnesstracker.fit' },
  ];

  return Array.from({ length: count }, (_, i) => {
    const website = websites[i % websites.length];
    const createdAt = randomDate(60);
    const updatedAt = randomDate(30);
    const lastAnalyzed = Math.random() > 0.2 ? randomDate(15) : undefined;
    const score = lastAnalyzed ? randomInt(30, 95) : undefined;

    return {
      id: generateId(),
      name: website.name,
      url: website.url,
      createdAt,
      updatedAt,
      lastAnalyzed,
      score,
    };
  });
}

/**
 * Generate mock issues
 */
export function generateMockIssues(count: number = 10): Issue[] {
  const issueTemplates = [
    {
      title: 'Missing meta descriptions',
      description: 'Several pages are missing meta descriptions, which are important for search engines to understand page content.',
      category: 'On-Page SEO',
      impact: 'Reduced click-through rates from search results',
    },
    {
      title: 'Slow page load speed',
      description: 'Pages are taking more than 3 seconds to load, which can negatively impact user experience and search rankings.',
      category: 'Technical SEO',
      impact: 'Higher bounce rates and lower search rankings',
    },
    {
      title: 'Broken links detected',
      description: 'Multiple broken links were found throughout the website, creating a poor user experience.',
      category: 'Technical SEO',
      impact: 'Negative user experience and wasted crawl budget',
    },
    {
      title: 'Duplicate content issues',
      description: 'Multiple pages contain identical or very similar content, which can confuse search engines.',
      category: 'Content Quality',
      impact: 'Diluted search visibility and potential penalties',
    },
    {
      title: 'Missing alt text on images',
      description: 'Many images are missing alternative text, which is important for accessibility and SEO.',
      category: 'On-Page SEO',
      impact: 'Reduced accessibility and missed ranking opportunities',
    },
    {
      title: 'Non-secure HTTP links',
      description: 'Some resources are being loaded over non-secure HTTP connections.',
      category: 'Technical SEO',
      impact: 'Security warnings and reduced user trust',
    },
    {
      title: 'Low word count on key pages',
      description: 'Several important pages have insufficient content to fully cover the topic.',
      category: 'Content Quality',
      impact: 'Difficulty ranking for relevant keywords',
    },
    {
      title: 'Mobile usability issues',
      description: 'Some elements are too close together or text is too small on mobile devices.',
      category: 'User Experience',
      impact: 'Poor mobile experience and lower mobile rankings',
    },
    {
      title: 'Missing structured data',
      description: 'The website is not using schema markup to help search engines understand the content.',
      category: 'Technical SEO',
      impact: 'Missing rich snippet opportunities in search results',
    },
    {
      title: 'Weak backlink profile',
      description: 'The website has few high-quality backlinks compared to competitors.',
      category: 'Off-Page SEO',
      impact: 'Lower domain authority and rankings',
    },
    {
      title: 'Keyword cannibalization',
      description: 'Multiple pages are targeting the same keywords, causing them to compete with each other.',
      category: 'Content Quality',
      impact: 'Diluted search visibility for target keywords',
    },
    {
      title: 'Poor internal linking structure',
      description: 'Important pages are not receiving enough internal links.',
      category: 'On-Page SEO',
      impact: 'Suboptimal distribution of page authority',
    },
  ];

  const severityLevels = [
    issueSeverity.CRITICAL,
    issueSeverity.HIGH,
    issueSeverity.MEDIUM,
    issueSeverity.LOW,
  ];

  return Array.from({ length: count }, () => {
    const template = issueTemplates[randomInt(0, issueTemplates.length - 1)];
    const severity = severityLevels[randomInt(0, 3)];

    return {
      id: generateId(),
      title: template.title,
      description: template.description,
      severity: severity as "critical" | "high" | "medium" | "low",
      category: template.category,
      impact: template.impact,
    };
  });
}

/**
 * Generate mock recommendations
 */
export function generateMockRecommendations(count: number = 5): Recommendation[] {
  const recommendationTemplates = [
    {
      title: 'Add meta descriptions to all pages',
      description: 'Create unique, compelling meta descriptions for each page to improve click-through rates from search results.',
      priority: 'high',
      difficulty: 'easy',
      impact: 'medium',
    },
    {
      title: 'Optimize image sizes',
      description: 'Compress and resize images to improve page load speed while maintaining visual quality.',
      priority: 'medium',
      difficulty: 'easy',
      impact: 'medium',
    },
    {
      title: 'Fix broken links',
      description: 'Identify and fix or redirect all broken links to improve user experience and SEO.',
      priority: 'high',
      difficulty: 'medium',
      impact: 'high',
    },
    {
      title: 'Implement schema markup',
      description: 'Add structured data to help search engines better understand your content and display rich snippets.',
      priority: 'medium',
      difficulty: 'medium',
      impact: 'medium',
    },
    {
      title: 'Improve page load speed',
      description: 'Optimize code, leverage browser caching, and minimize server response time to improve page speed.',
      priority: 'high',
      difficulty: 'hard',
      impact: 'high',
    },
    {
      title: 'Create a content calendar',
      description: 'Develop a regular publishing schedule for fresh, relevant content that targets your key keywords.',
      priority: 'medium',
      difficulty: 'medium',
      impact: 'high',
    },
    {
      title: 'Build quality backlinks',
      description: 'Develop a strategy to earn high-quality backlinks from reputable websites in your industry.',
      priority: 'high',
      difficulty: 'hard',
      impact: 'high',
    },
    {
      title: 'Optimize for mobile devices',
      description: 'Ensure all pages are fully responsive and provide a good user experience on all device sizes.',
      priority: 'high',
      difficulty: 'medium',
      impact: 'high',
    },
  ];

  return Array.from({ length: count }, () => {
    const template = recommendationTemplates[randomInt(0, recommendationTemplates.length - 1)];

    return {
      id: generateId(),
      title: template.title,
      description: template.description,
      priority: template.priority as "high" | "medium" | "low",
      difficulty: template.difficulty as "easy" | "medium" | "hard",
      impact: template.impact as "high" | "medium" | "low",
    };
  });
}

/**
 * Generate mock category scores
 */
export function generateMockCategoryScores(): { [key: string]: number } {
  const result: { [key: string]: number } = {};
  
  scoreCategories.forEach((category) => {
    result[category.name] = randomInt(30, 95);
  });
  
  return result;
}

/**
 * Generate a mock analysis
 */
export function generateMockAnalysis(projectId: string, url: string): Analysis {
  const issues = generateMockIssues(randomInt(5, 12));
  const recommendations = generateMockRecommendations(randomInt(3, 8));
  const categoryScores = generateMockCategoryScores();
  
  // Calculate overall score as weighted average of category scores
  let overallScore = 0;
  let totalWeight = 0;
  
  scoreCategories.forEach((category) => {
    overallScore += categoryScores[category.name] * category.weight;
    totalWeight += category.weight;
  });
  
  overallScore = Math.round(overallScore / totalWeight);
  
  return {
    id: generateId(),
    projectId,
    url,
    createdAt: new Date().toISOString(),
    score: overallScore,
    categoryScores,
    issues,
    recommendations,
  };
}

/**
 * Generate mock analyses for a project
 */
export function generateMockAnalyses(project: Project, count: number = 3): Analysis[] {
  return Array.from({ length: count }, () => {
    return generateMockAnalysis(project.id, project.url);
  });
}

/**
 * Generate enhanced mock projects for the dashboard
 */
export function generateEnhancedProjects(count: number = 5) {
  const websites = [
    { name: 'Tech Innovators', url: 'techinnovators.com', favicon: '/favicons/tech.png' },
    { name: 'Green Solutions', url: 'greensolutions.org', favicon: '/favicons/green.png' },
    { name: 'Global Finance', url: 'globalfinance.net', favicon: '/favicons/finance.png' },
    { name: 'Health Partners', url: 'healthpartners.com', favicon: '/favicons/health.png' },
    { name: 'Travel Explorers', url: 'travelexplorers.com', favicon: '/favicons/travel.png' },
    { name: 'Digital Marketing Pro', url: 'digitalmarketingpro.com', favicon: '/favicons/marketing.png' },
    { name: 'Creative Studios', url: 'creativestudios.io', favicon: '/favicons/creative.png' },
    { name: 'Food Delivery', url: 'fooddelivery.app', favicon: '/favicons/food.png' },
    { name: 'Education Portal', url: 'educationportal.edu', favicon: '/favicons/education.png' },
    { name: 'Fitness Tracker', url: 'fitnesstracker.fit', favicon: '/favicons/fitness.png' },
  ];

  return Array.from({ length: count }, (_, i) => {
    const website = websites[i % websites.length];
    const currentScore = randomInt(30, 95);
    const trendPercentage = randomInt(1, 15);
    const trend = Math.random() > 0.5 ? 'up' : 'down';
    
    return {
      id: generateId(),
      name: website.name,
      url: website.url,
      favicon: website.favicon,
      lastScanDate: new Date(Date.now() - randomInt(1, 14) * 24 * 60 * 60 * 1000),
      currentScore,
      issueCount: randomInt(0, 25),
      trend,
      trendPercentage
    };
  });
}

/**
 * Generate enhanced issues for the dashboard
 */
export function generateEnhancedIssues(count: number = 10) {
  const issueTypes = [
    { type: 'Missing Meta Description', category: 'onpage' },
    { type: 'Slow Page Load Speed', category: 'technical' },
    { type: 'Duplicate Content', category: 'content' },
    { type: 'Mobile Usability Issues', category: 'ux' },
    { type: 'Missing Alt Text', category: 'onpage' },
    { type: 'Broken Links', category: 'technical' },
    { type: 'Thin Content', category: 'content' },
    { type: 'Poor Readability', category: 'content' },
    { type: 'No HTTPS', category: 'technical' },
    { type: 'Keyword Cannibalization', category: 'onpage' },
    { type: 'Excessive Ads', category: 'ux' },
    { type: 'No Schema Markup', category: 'technical' },
  ];

  const severityLevels: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low'];
  const complexityLevels: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];

  return Array.from({ length: count }, () => {
    const issueType = issueTypes[randomInt(0, issueTypes.length - 1)];
    const affectedPages = randomInt(1, 50);
    const severity = severityLevels[randomInt(0, severityLevels.length - 1)];
    
    return {
      id: generateId(),
      type: issueType.type,
      category: issueType.category as 'technical' | 'content' | 'onpage' | 'ux',
      severity,
      title: `${affectedPages} pages with ${issueType.type.toLowerCase()}`,
      description: `This issue affects user experience and search engine rankings. ${severity === 'critical' ? 'Urgent attention required.' : ''}`,
      affectedPages,
      estimatedImpact: severity === 'critical' ? 'High' : severity === 'high' ? 'Medium to High' : 'Low to Medium',
      fixComplexity: complexityLevels[randomInt(0, complexityLevels.length - 1)]
    };
  });
}

/**
 * Generate performance trend data
 */
export function generatePerformanceTrends(days: number = 30) {
  const labels = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  // Generate score data with realistic fluctuations
  const generateScoreData = (baseScore: number) => {
    return Array.from({ length: days }, () => {
      // Add some random fluctuation but keep within reasonable bounds
      const fluctuation = randomInt(-5, 5);
      return Math.max(0, Math.min(100, baseScore + fluctuation));
    });
  };

  return {
    labels,
    datasets: [
      {
        label: 'My E-commerce Site',
        data: generateScoreData(75),
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsla(var(--primary), 0.1)',
        borderWidth: 2,
      },
      {
        label: 'Company Blog',
        data: generateScoreData(65),
        borderColor: 'hsl(var(--success))',
        backgroundColor: 'hsla(var(--success), 0.1)',
        borderWidth: 2,
      },
      {
        label: 'Landing Page',
        data: generateScoreData(85),
        borderColor: 'hsl(var(--warning))',
        backgroundColor: 'hsla(var(--warning), 0.1)',
        borderWidth: 2,
      },
    ],
  };
}

/**
 * Get all mock data for the dashboard
 */
export function getMockDashboardData() {
  const projects = generateMockProjects(5);
  
  // Generate analyses for each project
  const recentAnalyses = projects
    .filter(project => project.lastAnalyzed)
    .flatMap(project => 
      generateMockAnalyses(project, randomInt(1, 3))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  
  const issues = generateMockIssues(8);
  const recommendations = generateMockRecommendations(5);
  
  // Enhanced dashboard data
  const enhancedProjects = generateEnhancedProjects(5);
  const enhancedIssues = generateEnhancedIssues(10);
  const performanceTrends = generatePerformanceTrends();
  
  // Dashboard stats
  const stats = {
    totalProjects: 12,
    activeAnalyses: 3,
    averageScore: 76,
    weeklyIssues: 23
  };
  
  // SEO score breakdown
  const scoreBreakdown = {
    technical: randomInt(60, 95),
    content: randomInt(60, 95),
    onPage: randomInt(60, 95),
    userExperience: randomInt(60, 95)
  };
  
  return {
    projects,
    recentAnalyses,
    issues,
    recommendations,
    enhancedProjects,
    enhancedIssues,
    performanceTrends,
    stats,
    scoreBreakdown
  };
}
