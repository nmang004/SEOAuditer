// Part 1: Mock Data Generator Functions
import { subDays, subMonths, format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import {
  SEOIssue,
  Recommendation,
  TechnicalAnalysisData,
  ContentAnalysisData,
  AnalysisData
} from './analysis-types';

// Helper function to generate random scores
const randomScore = (min = 0, max = 100) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate random issues
const generateIssues = (count: number): SEOIssue[] => {
  const severities: Array<SEOIssue['severity']> = ['critical', 'high', 'medium', 'low'];
  const categories: Array<SEOIssue['category']> = ['technical', 'content', 'onpage', 'ux'];
  const statuses: Array<SEOIssue['status']> = ['new', 'in-progress', 'fixed', 'ignored'];
  const impacts: Array<SEOIssue['impact']> = ['high', 'medium', 'low'];
  
  const issueTemplates = [
    {
      title: 'Missing Meta Description',
      description: 'The page is missing a meta description which is important for SEO and click-through rates.',
      category: 'content' as const,
    },
    {
      title: 'Slow Page Load Time',
      description: 'The page takes too long to load, which can negatively impact user experience and search rankings.',
      category: 'technical' as const,
    },
    {
      title: 'Broken Internal Link',
      description: 'A link on this page points to a non-existent page on your site.',
      category: 'onpage' as const,
    },
    {
      title: 'Missing Alt Text',
      description: 'Some images are missing alt text, which is important for accessibility and SEO.',
      category: 'content' as const,
    },
    {
      title: 'Mobile Viewport Not Set',
      description: 'The viewport meta tag is missing or incorrectly configured.',
      category: 'technical' as const,
    },
    {
      title: 'Low Readability Score',
      description: 'The content may be difficult to read for your target audience.',
      category: 'content' as const,
    },
    {
      title: 'Duplicate Title Tag',
      description: 'This title tag is used on multiple pages, which can confuse search engines.',
      category: 'onpage' as const,
    },
    {
      title: 'Missing H1 Tag',
      description: 'The page is missing an H1 heading, which is important for SEO.',
      category: 'content' as const,
    },
  ];

  return Array.from({ length: count }, (_, i) => {
    const template = issueTemplates[Math.floor(Math.random() * issueTemplates.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const impact = impacts[Math.floor(Math.random() * impacts.length)];
    
    return {
      id: uuidv4(),
      title: template.title,
      description: template.description,
      severity,
      category: template.category,
      affectedElements: ['div#main-content', 'img.banner', 'a.read-more'].slice(0, Math.floor(Math.random() * 3) + 1),
      recommendation: 'Fix this issue by following the recommended best practices.',
      estimatedTimeToFix: ['5 minutes', '15 minutes', '30 minutes', '1 hour', '2 hours'][Math.floor(Math.random() * 5)],
      impact,
      status,
      detectedDate: subDays(new Date(), Math.floor(Math.random() * 30)),
    };
  });
};

// Generate recommendations
const generateRecommendations = (count: number): Recommendation[] => {
  const priorities: Array<Recommendation['priority']> = ['high', 'medium', 'low'];
  const difficulties: Array<Recommendation['difficulty']> = ['easy', 'medium', 'hard'];
  
  const recommendationTemplates = [
    {
      title: 'Add Meta Description',
      description: 'Craft a compelling meta description that includes your target keywords.',
      category: 'Content',
      impact: 'Increases click-through rates from search results',
      steps: [
        'Write a unique meta description between 120-160 characters',
        'Include your primary keyword naturally',
        'Make it compelling to encourage clicks',
        'Avoid duplicate meta descriptions'
      ]
    },
    {
      title: 'Optimize Images',
      description: 'Compress and properly format images to improve page load times.',
      category: 'Performance',
      impact: 'Reduces page load time and improves user experience',
      steps: [
        'Use modern image formats (WebP, AVIF)',
        'Compress images without losing quality',
        'Specify image dimensions',
        'Use lazy loading for below-the-fold images'
      ]
    },
    {
      title: 'Improve Mobile Responsiveness',
      description: 'Ensure the site is fully responsive on all device sizes.',
      category: 'UX',
      impact: 'Improves mobile user experience and search rankings',
      steps: [
        'Test on multiple device sizes',
        'Use flexible grid layouts',
        'Optimize touch targets',
        'Ensure readable font sizes'
      ]
    },
    {
      title: 'Fix Broken Links',
      description: 'Identify and fix or remove broken internal and external links.',
      category: 'SEO',
      impact: 'Improves user experience and search engine crawling',
      steps: [
        'Run a site crawl to identify broken links',
        'Update or remove broken internal links',
        'Update or remove broken external links',
        'Set up 301 redirects for moved pages'
      ]
    }
  ];

  return Array.from({ length: count }, (_, i) => {
    const template = recommendationTemplates[Math.floor(Math.random() * recommendationTemplates.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    
    return {
      id: uuidv4(),
      title: template.title,
      description: template.description,
      priority,
      category: template.category,
      estimatedImpact: template.impact,
      timeToImplement: ['Quick win', 'Short-term', 'Medium-term', 'Long-term'][Math.floor(Math.random() * 4)],
      difficulty,
      steps: template.steps,
      resources: [
        { title: 'Moz SEO Guide', url: 'https://moz.com/learn/seo' },
        { title: 'Google Search Central', url: 'https://developers.google.com/search' }
      ],
      relatedIssues: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => uuidv4())
    };
  });
};

// Generate technical analysis data
const generateTechnicalAnalysis = (): TechnicalAnalysisData => {
  const score = randomScore(50, 95);
  
  return {
    pageSpeed: {
      score,
      loadTime: Math.round((Math.random() * 5 + 1) * 100) / 100, // 1-6 seconds
      firstContentfulPaint: Math.round((Math.random() * 3 + 0.5) * 100) / 100, // 0.5-3.5 seconds
      largestContentfulPaint: Math.round((Math.random() * 4 + 1) * 100) / 100, // 1-5 seconds
      cumulativeLayoutShift: Math.round((Math.random() * 0.2) * 100) / 100, // 0-0.2
      recommendations: [
        'Enable compression',
        'Leverage browser caching',
        'Minify JavaScript and CSS'
      ]
    },
    mobileFriendliness: {
      score: randomScore(60, 100),
      hasViewportMeta: Math.random() > 0.2,
      usesResponsiveDesign: Math.random() > 0.3,
      touchTargetsAppropriate: Math.random() > 0.4,
      issues: ['Text too small to read', 'Clickable elements too close together'].slice(0, Math.floor(Math.random() * 3))
    },
    crawlability: {
      robotsTxtValid: Math.random() > 0.2,
      hasXMLSitemap: Math.random() > 0.2,
      canonicalTagsPresent: Math.random() > 0.3,
      noIndexPages: Math.floor(Math.random() * 15),
      redirectChains: Math.floor(Math.random() * 8)
    },
    security: {
      hasSSL: Math.random() > 0.1,
      mixedContent: Math.random() > 0.7,
      securityHeaders: ['X-Content-Type-Options', 'X-Frame-Options', 'X-XSS-Protection', 'Content-Security-Policy']
        .slice(0, Math.floor(Math.random() * 4) + 1),
      vulnerabilities: Math.random() > 0.8 ? ['jQuery 1.11.0 has known vulnerabilities'] : []
    }
  };
};

// Generate content analysis data
const generateContentAnalysis = (): ContentAnalysisData => {
  const wordCount = Math.floor(Math.random() * 2000) + 500; // 500-2500 words
  
  return {
    metaTags: {
      title: {
        present: Math.random() > 0.1,
        length: Math.floor(Math.random() * 50) + 30, // 30-80 characters
        optimized: Math.random() > 0.3
      },
      description: {
        present: Math.random() > 0.1,
        length: Math.floor(Math.random() * 100) + 100, // 100-200 characters
        optimized: Math.random() > 0.4
      },
      keywords: {
        present: Math.random() > 0.5,
        relevant: Math.random() > 0.6
      }
    },
    headingStructure: {
      h1Count: Math.floor(Math.random() * 2) + 1, // 1-2 H1s
      hierarchyValid: Math.random() > 0.3,
      keywordOptimized: Math.random() > 0.4,
      missingLevels: [2, 3, 4, 5, 6].filter(() => Math.random() > 0.7)
    },
    contentQuality: {
      wordCount,
      readabilityScore: randomScore(40, 100),
      keywordDensity: Math.round((Math.random() * 3 + 0.5) * 100) / 100, // 0.5-3.5%
      duplicateContent: Math.random() > 0.7,
      internalLinks: Math.floor(wordCount / 300), // Roughly 1 internal link per 300 words
      externalLinks: Math.floor(wordCount / 500) // Roughly 1 external link per 500 words
    },
    images: {
      total: Math.floor(wordCount / 200), // Roughly 1 image per 200 words
      withAltText: Math.floor(Math.random() * 100), // 0-100% of images
      oversized: Math.floor(Math.random() * 50), // 0-50% of images
      modernFormats: Math.floor(Math.random() * 30) // 0-30% of images
    }
  };
};

// Generate historical data
const generateHistoricalData = (months: number) => {
  const now = new Date();
  const data = [];
  
  for (let i = months; i >= 0; i--) {
    const date = subMonths(now, i);
    const baseScore = randomScore(50, 90);
    const variation = Math.sin(i) * 5; // Add some natural variation
    
    data.push({
      date,
      overallScore: Math.min(100, Math.max(0, Math.round(baseScore + variation))),
      technicalScore: Math.min(100, Math.max(0, Math.round(baseScore * 0.9 + Math.random() * 10))),
      contentScore: Math.min(100, Math.max(0, Math.round(baseScore * 1.1 - Math.random() * 5))),
      onPageScore: Math.min(100, Math.max(0, Math.round(baseScore * 0.95 + Math.random() * 8))),
      userExperienceScore: Math.min(100, Math.max(0, Math.round(baseScore + Math.random() * 12 - 6))),
      issuesCount: Math.floor(Math.random() * 50) + 10 // 10-60 issues
    });
  }
  
  return data;
};

// Export the complete mock data generator
export const generateMockAnalysisData = (): AnalysisData => {
  const issues = generateIssues(25); // Generate 25 random issues
  const recommendations = generateRecommendations(10); // Generate 10 recommendations
  const historicalData = generateHistoricalData(6); // 6 months of historical data
  
  const technicalAnalysis = generateTechnicalAnalysis();
  const contentAnalysis = generateContentAnalysis();
  
  // Calculate category scores based on the analysis
  const categories = {
    technical: {
      score: technicalAnalysis.pageSpeed.score,
      issues: technicalAnalysis.mobileFriendliness.issues.length + 
              (technicalAnalysis.crawlability.robotsTxtValid ? 0 : 1) +
              (technicalAnalysis.crawlability.hasXMLSitemap ? 0 : 1) +
              technicalAnalysis.crawlability.noIndexPages +
              technicalAnalysis.crawlability.redirectChains,
      improvements: technicalAnalysis.pageSpeed.recommendations.length
    },
    content: {
      score: contentAnalysis.contentQuality.readabilityScore,
      issues: (contentAnalysis.metaTags.title.present ? 0 : 1) +
              (contentAnalysis.metaTags.description.present ? 0 : 1) +
              (contentAnalysis.headingStructure.hierarchyValid ? 0 : 1) +
              (contentAnalysis.contentQuality.duplicateContent ? 1 : 0),
      improvements: 3 // Placeholder
    },
    onPage: {
      score: Math.round((contentAnalysis.metaTags.title.optimized ? 25 : 0) +
                       (contentAnalysis.metaTags.description.optimized ? 25 : 0) +
                       (contentAnalysis.headingStructure.keywordOptimized ? 25 : 0) +
                       (contentAnalysis.contentQuality.keywordDensity > 0.5 && 
                        contentAnalysis.contentQuality.keywordDensity < 3 ? 25 : 0)),
      issues: issues.filter(i => i.category === 'onpage').length,
      improvements: 2 // Placeholder
    },
    userExperience: {
      score: Math.round((technicalAnalysis.mobileFriendliness.score * 0.7) + 
                       (technicalAnalysis.pageSpeed.score * 0.3)),
      issues: issues.filter(i => i.category === 'ux').length,
      improvements: 2 // Placeholder
    }
  };
  
  // Calculate overall score as average of category scores
  const overallScore = Math.round((
    categories.technical.score * 0.3 + 
    categories.content.score * 0.25 +
    categories.onPage.score * 0.25 +
    categories.userExperience.score * 0.2
  ));
  
  return {
    id: uuidv4(),
    projectId: uuidv4(),
    projectName: 'Acme Corp Website',
    url: 'https://acmecorp.com',
    scanDate: new Date(),
    overallScore,
    categories,
    issues,
    recommendations,
    technicalAnalysis,
    contentAnalysis,
    historicalData,
    previousScan: {
      scanDate: subDays(new Date(), 30),
      overallScore: Math.max(0, Math.min(100, overallScore + (Math.random() * 20 - 10))),
      categories: {
        technical: {
          score: Math.max(0, Math.min(100, categories.technical.score + (Math.random() * 10 - 5))),
          issues: Math.max(0, categories.technical.issues + Math.floor(Math.random() * 5 - 2)),
          improvements: Math.max(0, categories.technical.improvements + Math.floor(Math.random() * 3 - 1))
        },
        content: {
          score: Math.max(0, Math.min(100, categories.content.score + (Math.random() * 10 - 5))),
          issues: Math.max(0, categories.content.issues + Math.floor(Math.random() * 3 - 1)),
          improvements: Math.max(0, categories.content.improvements + Math.floor(Math.random() * 2 - 1))
        },
        onPage: {
          score: Math.max(0, Math.min(100, categories.onPage.score + (Math.random() * 15 - 5))),
          issues: Math.max(0, categories.onPage.issues + Math.floor(Math.random() * 4 - 2)),
          improvements: Math.max(0, categories.onPage.improvements + Math.floor(Math.random() * 2 - 1))
        },
        userExperience: {
          score: Math.max(0, Math.min(100, categories.userExperience.score + (Math.random() * 12 - 6))),
          issues: Math.max(0, categories.userExperience.issues + Math.floor(Math.random() * 3 - 1)),
          improvements: Math.max(0, categories.userExperience.improvements + Math.floor(Math.random() * 2 - 1))
        }
      }
    }
  };
};

// Export a default instance of the mock data
export const mockAnalysisData = generateMockAnalysisData();

export { generateIssues, generateTechnicalAnalysis, generateContentAnalysis, generateRecommendations };
