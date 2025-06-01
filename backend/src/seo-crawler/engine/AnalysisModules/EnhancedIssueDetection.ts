import { PageAnalysis } from '../../types/PageAnalysis';

// Export missing types that are referenced in other modules
export type IssueCategory = 'technical' | 'content' | 'onpage' | 'ux' | 'performance' | 'accessibility' | 'mobile' | 'security' | 'structured-data';

export type IssuePriority = 'critical' | 'high' | 'medium' | 'low';

export interface CategorizedIssues {
  critical: CriticalIssue[];
  high: HighPriorityIssue[];
  medium: MediumPriorityIssue[];
  low: LowPriorityIssue[];
  crossCategory: CrossCategoryIssue[];
  summary: IssueSummary;
  prioritization: IssuePrioritization;
}

export interface SEOIssue {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  fixComplexity: 'easy' | 'medium' | 'hard';
  affectedElements: string[];
  recommendation: string;
  category: IssueCategory;
  estimatedTime: string;
  businessImpact: 'high' | 'medium' | 'low';
  implementationSteps: string[];
  validationCriteria: string[];
}

export interface CriticalIssue extends SEOIssue {
  severity: 'critical';
  blockingIndexing?: boolean;
  securityConcern?: boolean;
}

export interface HighPriorityIssue extends SEOIssue {
  severity: 'high';
  rankingImpact: 'major' | 'moderate';
}

export interface MediumPriorityIssue extends SEOIssue {
  severity: 'medium';
  optimizationOpportunity: boolean;
}

export interface LowPriorityIssue extends SEOIssue {
  severity: 'low';
  enhancementType: 'usability' | 'accessibility' | 'performance';
}

export interface CrossCategoryIssue extends SEOIssue {
  affectedCategories: string[];
  compoundImpact: string;
}

export interface IssueSummary {
  totalIssues: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  avgFixTime: string;
  quickWinsAvailable: number;
}

export interface IssuePrioritization {
  immediate: SEOIssue[];
  shortTerm: SEOIssue[];
  longTerm: SEOIssue[];
  quickWins: SEOIssue[];
  impactMatrix: {
    highImpactEasyFix: SEOIssue[];
    highImpactHardFix: SEOIssue[];
    lowImpactEasyFix: SEOIssue[];
    lowImpactHardFix: SEOIssue[];
  };
}

export interface DetailedRecommendation {
  id: string;
  issueId: string;
  title: string;
  description: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  effort: 'easy' | 'medium' | 'hard';
  timeToImplement: string;
  
  implementation: {
    steps: string[];
    codeExamples: { [key: string]: string };
    tools: string[];
    resources: string[];
  };
  
  expectedResults: {
    seoImpact: string;
    userImpact: string;
    businessImpact: string;
    timeframe: string;
  };
  
  validation: {
    successCriteria: string[];
    testingMethods: string[];
    monitoringMetrics: string[];
  };
}

export class EnhancedIssueDetection {
  async analyze(pageContext: any): Promise<Partial<PageAnalysis> & { 
    categorizedIssues: CategorizedIssues;
    detailedRecommendations: DetailedRecommendation[];
  }> {
    const analyses = pageContext.pageAnalysis || {};
    
    const issues = this.detectAllIssues(analyses);
    const detailedRecommendations = this.generateDetailedRecommendations(issues, pageContext);

    return {
      issues: this.flattenIssues(issues),
      categorizedIssues: issues,
      detailedRecommendations
    };
  }

  private detectAllIssues(analyses: any): CategorizedIssues {
    const critical = this.detectCriticalIssues(analyses);
    const high = this.detectHighPriorityIssues(analyses);
    const medium = this.detectMediumPriorityIssues(analyses);
    const low = this.detectLowPriorityIssues(analyses);
    const crossCategory = this.detectCrossCategoryIssues(analyses);

    const summary = this.generateIssueSummary({
      critical, high, medium, low, crossCategory
    });

    const prioritization = this.prioritizeIssues({
      critical, high, medium, low, crossCategory
    });

    return {
      critical,
      high,
      medium,
      low,
      crossCategory,
      summary,
      prioritization
    };
  }

  private detectCriticalIssues(analyses: any): CriticalIssue[] {
    const issues: CriticalIssue[] = [];

    // No-index detection
    if (analyses.onPage?.metaTags?.robots?.includes('noindex')) {
      issues.push({
        id: 'noindex-detected',
        type: 'indexability',
        severity: 'critical',
        title: 'Page blocked from indexing',
        description: 'This page has a "noindex" directive that prevents search engines from indexing it.',
        impact: 'Page will not appear in search results, resulting in zero organic traffic',
        fixComplexity: 'easy',
        affectedElements: ['meta robots tag'],
        recommendation: 'Remove the "noindex" directive if you want this page to be indexed.',
        category: 'technical',
        estimatedTime: '5 minutes',
        businessImpact: 'high',
        blockingIndexing: true,
        implementationSteps: [
          'Locate the meta robots tag in the HTML head',
          'Remove "noindex" from the content attribute',
          'Test the change in staging environment',
          'Deploy to production'
        ],
        validationCriteria: [
          'Meta robots tag no longer contains "noindex"',
          'Google Search Console shows page as indexable',
          'Page appears in search results within 1-2 weeks'
        ]
      });
    }

    // Missing title tag
    if (!analyses.onPage?.metaTags?.title) {
      issues.push({
        id: 'missing-title',
        type: 'meta-tags',
        severity: 'critical',
        title: 'Missing title tag',
        description: 'This page is missing a title tag, which is essential for SEO.',
        impact: 'Severely impacts search rankings and click-through rates. Without a title, search engines cannot properly index or display the page.',
        fixComplexity: 'easy',
        affectedElements: ['title tag'],
        recommendation: 'Add a descriptive, keyword-rich title tag (30-60 characters).',
        category: 'onpage',
        estimatedTime: '10 minutes',
        businessImpact: 'high',
        implementationSteps: [
          'Identify the primary keyword for this page',
          'Create a compelling title that includes the keyword',
          'Ensure title length is between 30-60 characters',
          'Add the title tag to the HTML head section',
          'Test across different devices and browsers'
        ],
        validationCriteria: [
          'Title tag is present in HTML head',
          'Title appears correctly in search results',
          'Title length is optimized for search snippets',
          'Title includes target keywords naturally'
        ]
      });
    }

    // SSL issues
    if (!analyses.technical?.security?.hasSSL) {
      issues.push({
        id: 'no-ssl',
        type: 'security',
        severity: 'critical',
        title: 'No SSL certificate',
        description: 'This page is not served over HTTPS.',
        impact: 'Search engines prefer HTTPS sites, and users see security warnings. This can significantly impact trust and rankings.',
        fixComplexity: 'medium',
        affectedElements: ['entire site'],
        recommendation: 'Install an SSL certificate and redirect all HTTP traffic to HTTPS.',
        category: 'technical',
        estimatedTime: '2-4 hours',
        businessImpact: 'high',
        securityConcern: true,
        implementationSteps: [
          'Purchase and install SSL certificate',
          'Configure web server to serve HTTPS',
          'Update internal links to use HTTPS',
          'Set up 301 redirects from HTTP to HTTPS',
          'Update canonical URLs and sitemap',
          'Test all functionality over HTTPS'
        ],
        validationCriteria: [
          'Site loads correctly over HTTPS',
          'All HTTP URLs redirect to HTTPS',
          'No mixed content warnings',
          'SSL certificate is valid and trusted',
          'Search Console recognizes HTTPS version'
        ]
      });
    }

    // Severe performance issues
    if (analyses.technical?.performance?.score < 30) {
      issues.push({
        id: 'severe-performance',
        type: 'performance',
        severity: 'critical',
        title: 'Severe performance issues',
        description: `Page speed score is critically low (${analyses.technical.performance.score}/100).`,
        impact: 'Extremely poor user experience and significant negative impact on search rankings',
        fixComplexity: 'hard',
        affectedElements: ['entire page performance'],
        recommendation: 'Immediate performance optimization required across all areas.',
        category: 'technical',
        estimatedTime: '1-2 weeks',
        businessImpact: 'high',
        implementationSteps: [
          'Conduct comprehensive performance audit',
          'Optimize critical render path',
          'Compress and optimize all images',
          'Minify and compress CSS/JS resources',
          'Implement browser caching',
          'Consider CDN implementation',
          'Remove unused code and resources'
        ],
        validationCriteria: [
          'Page speed score improves to 50+',
          'Largest Contentful Paint under 4 seconds',
          'First Input Delay under 300ms',
          'Cumulative Layout Shift under 0.25'
        ]
      });
    }

    return issues;
  }

  private detectHighPriorityIssues(analyses: any): HighPriorityIssue[] {
    const issues: HighPriorityIssue[] = [];

    // Long title tag
    if (analyses.onPage?.metaTags?.title && analyses.onPage.metaTags.title.length > 60) {
      issues.push({
        id: 'title-too-long',
        type: 'meta-tags',
        severity: 'high',
        title: 'Title tag too long',
        description: `Title tag is ${analyses.onPage.metaTags.title.length} characters. Optimal length is 30-60 characters.`,
        impact: 'Title may be truncated in search results, reducing click-through rates',
        fixComplexity: 'easy',
        affectedElements: ['title tag'],
        recommendation: 'Shorten the title tag to 30-60 characters while keeping it descriptive and keyword-rich.',
        category: 'onpage',
        estimatedTime: '15 minutes',
        businessImpact: 'medium',
        rankingImpact: 'moderate',
        implementationSteps: [
          'Review current title for essential elements',
          'Identify and remove unnecessary words',
          'Ensure primary keyword remains prominent',
          'Test title in SERP preview tools',
          'Update title tag in HTML'
        ],
        validationCriteria: [
          'Title length is between 30-60 characters',
          'Title displays fully in search results',
          'Primary keyword is still included',
          'Title remains compelling and descriptive'
        ]
      });
    }

    // Missing meta description
    if (!analyses.onPage?.metaTags?.description) {
      issues.push({
        id: 'missing-meta-description',
        type: 'meta-tags',
        severity: 'high',
        title: 'Missing meta description',
        description: 'This page is missing a meta description tag.',
        impact: 'Search engines will generate their own snippet, which may not be optimal for click-through rates',
        fixComplexity: 'easy',
        affectedElements: ['meta description'],
        recommendation: 'Add a compelling meta description (120-160 characters) that includes target keywords.',
        category: 'onpage',
        estimatedTime: '10 minutes',
        businessImpact: 'medium',
        rankingImpact: 'moderate',
        implementationSteps: [
          'Identify the page\'s main value proposition',
          'Include target keywords naturally',
          'Write compelling copy that encourages clicks',
          'Keep length between 120-160 characters',
          'Add meta description tag to HTML head'
        ],
        validationCriteria: [
          'Meta description tag is present',
          'Description length is optimized',
          'Target keywords are included',
          'Description appears in search results'
        ]
      });
    }

    // Poor page speed
    if (analyses.technical?.performance?.score < 50) {
      issues.push({
        id: 'poor-page-speed',
        type: 'performance',
        severity: 'high',
        title: 'Poor page loading speed',
        description: `Page speed score is ${analyses.technical.performance.score}/100.`,
        impact: 'Affects user experience and search rankings. Users are likely to abandon slow-loading pages.',
        fixComplexity: 'medium',
        affectedElements: ['entire page'],
        recommendation: 'Optimize images, minify CSS/JS, enable compression, and improve server response times.',
        category: 'technical',
        estimatedTime: '3-5 days',
        businessImpact: 'high',
        rankingImpact: 'major',
        implementationSteps: [
          'Run detailed performance audit',
          'Optimize and compress images',
          'Minify CSS and JavaScript files',
          'Enable Gzip compression',
          'Optimize server response times',
          'Implement browser caching',
          'Remove unused code'
        ],
        validationCriteria: [
          'Page speed score improves by at least 20 points',
          'Load time under 3 seconds',
          'Core Web Vitals in "Good" range',
          'User bounce rate decreases'
        ]
      });
    }

    // Missing H1 tag
    if (!analyses.onPage?.headings?.h1 || analyses.onPage.headings.h1.length === 0) {
      issues.push({
        id: 'missing-h1',
        type: 'headings',
        severity: 'high',
        title: 'Missing H1 heading',
        description: 'This page is missing an H1 heading tag.',
        impact: 'H1 tags help search engines understand page structure and content hierarchy',
        fixComplexity: 'easy',
        affectedElements: ['heading structure'],
        recommendation: 'Add a single, descriptive H1 heading that includes target keywords.',
        category: 'onpage',
        estimatedTime: '10 minutes',
        businessImpact: 'medium',
        rankingImpact: 'moderate',
        implementationSteps: [
          'Identify the main topic of the page',
          'Create an H1 that includes target keywords',
          'Ensure H1 is descriptive and compelling',
          'Place H1 near the top of the content',
          'Verify only one H1 exists per page'
        ],
        validationCriteria: [
          'H1 tag is present on the page',
          'H1 includes target keywords',
          'Only one H1 exists per page',
          'H1 accurately describes page content'
        ]
      });
    }

    return issues;
  }

  private detectMediumPriorityIssues(analyses: any): MediumPriorityIssue[] {
    const issues: MediumPriorityIssue[] = [];

    // Multiple H1 tags
    if (analyses.onPage?.headings?.h1 && analyses.onPage.headings.h1.length > 1) {
      issues.push({
        id: 'multiple-h1',
        type: 'headings',
        severity: 'medium',
        title: 'Multiple H1 headings',
        description: `Found ${analyses.onPage.headings.h1.length} H1 tags. Best practice is to use only one H1 per page.`,
        impact: 'May confuse search engines about page hierarchy and dilute keyword focus',
        fixComplexity: 'easy',
        affectedElements: ['heading structure'],
        recommendation: 'Use only one H1 per page and convert additional H1s to H2 or H3 tags.',
        category: 'onpage',
        estimatedTime: '20 minutes',
        businessImpact: 'low',
        optimizationOpportunity: true,
        implementationSteps: [
          'Identify all H1 tags on the page',
          'Determine which H1 should remain (usually the main heading)',
          'Convert additional H1s to appropriate heading levels (H2, H3)',
          'Ensure heading hierarchy is logical',
          'Test page structure and styling'
        ],
        validationCriteria: [
          'Only one H1 tag exists on the page',
          'Heading hierarchy is logical (H1 > H2 > H3)',
          'Page styling remains intact',
          'Content structure is clear'
        ]
      });
    }

    // Images missing alt text
    if (analyses.onPage?.images?.missingAlt > 0) {
      issues.push({
        id: 'images-missing-alt',
        type: 'accessibility',
        severity: 'medium',
        title: 'Images missing alt text',
        description: `${analyses.onPage.images.missingAlt} images are missing alt text.`,
        impact: 'Reduces accessibility for screen readers and misses SEO opportunities for image search',
        fixComplexity: 'easy',
        affectedElements: ['image tags'],
        recommendation: 'Add descriptive alt text to all images that conveys their purpose and content.',
        category: 'onpage',
        estimatedTime: '30 minutes',
        businessImpact: 'medium',
        optimizationOpportunity: true,
        implementationSteps: [
          'Audit all images on the page',
          'Identify images missing alt attributes',
          'Write descriptive alt text for each image',
          'Include keywords naturally where relevant',
          'Test with screen readers if possible'
        ],
        validationCriteria: [
          'All content images have alt text',
          'Alt text is descriptive and meaningful',
          'Decorative images use empty alt attributes',
          'Page passes accessibility audit tools'
        ]
      });
    }

    // Long meta description
    if (analyses.onPage?.metaTags?.description && analyses.onPage.metaTags.description.length > 160) {
      issues.push({
        id: 'meta-description-too-long',
        type: 'meta-tags',
        severity: 'medium',
        title: 'Meta description too long',
        description: `Meta description is ${analyses.onPage.metaTags.description.length} characters. Optimal length is 120-160 characters.`,
        impact: 'Description may be truncated in search results, reducing effectiveness',
        fixComplexity: 'easy',
        affectedElements: ['meta description'],
        recommendation: 'Shorten meta description to 120-160 characters while maintaining compelling copy.',
        category: 'onpage',
        estimatedTime: '15 minutes',
        businessImpact: 'low',
        optimizationOpportunity: true,
        implementationSteps: [
          'Review current meta description',
          'Identify key messages to preserve',
          'Rewrite to fit 120-160 character limit',
          'Ensure call-to-action remains compelling',
          'Test in SERP preview tools'
        ],
        validationCriteria: [
          'Meta description length is 120-160 characters',
          'Description displays fully in search results',
          'Key value proposition is preserved',
          'Call-to-action is still compelling'
        ]
      });
    }

    return issues;
  }

  private detectLowPriorityIssues(analyses: any): LowPriorityIssue[] {
    const issues: LowPriorityIssue[] = [];

    // Missing favicon
    if (!analyses.technical?.favicon) {
      issues.push({
        id: 'missing-favicon',
        type: 'branding',
        severity: 'low',
        title: 'Missing favicon',
        description: 'This page is missing a favicon.',
        impact: 'Minor impact on branding and user experience in browser tabs',
        fixComplexity: 'easy',
        affectedElements: ['favicon link'],
        recommendation: 'Add a favicon to improve branding and user experience.',
        category: 'ux',
        estimatedTime: '30 minutes',
        businessImpact: 'low',
        enhancementType: 'usability',
        implementationSteps: [
          'Create or obtain a favicon image (16x16, 32x32 pixels)',
          'Convert to .ico format or use .png',
          'Upload favicon to website root directory',
          'Add favicon link tag to HTML head',
          'Test favicon appears in browser tabs'
        ],
        validationCriteria: [
          'Favicon appears in browser tabs',
          'Favicon displays in bookmarks',
          'Multiple sizes available for different contexts',
          'Favicon represents brand appropriately'
        ]
      });
    }

    // Missing Open Graph tags
    if (!analyses.onPage?.metaTags?.openGraph) {
      issues.push({
        id: 'missing-open-graph',
        type: 'social-media',
        severity: 'low',
        title: 'Missing Open Graph tags',
        description: 'This page is missing Open Graph meta tags for social media sharing.',
        impact: 'Social media shares may not display optimally, reducing engagement',
        fixComplexity: 'easy',
        affectedElements: ['Open Graph meta tags'],
        recommendation: 'Add Open Graph tags for title, description, image, and URL.',
        category: 'onpage',
        estimatedTime: '45 minutes',
        businessImpact: 'low',
        enhancementType: 'usability',
        implementationSteps: [
          'Add og:title meta tag with page title',
          'Add og:description with compelling description',
          'Add og:image with appropriate image URL',
          'Add og:url with canonical URL',
          'Add og:type (usually "website" or "article")',
          'Test with Facebook and LinkedIn sharing tools'
        ],
        validationCriteria: [
          'All required Open Graph tags are present',
          'Social media previews display correctly',
          'Images meet platform requirements',
          'Sharing generates attractive previews'
        ]
      });
    }

    return issues;
  }

  private detectCrossCategoryIssues(analyses: any): CrossCategoryIssue[] {
    const issues: CrossCategoryIssue[] = [];

    // Poor mobile experience affecting multiple areas
    if (!analyses.technical?.mobile?.responsive && analyses.technical?.performance?.mobile < 50) {
      issues.push({
        id: 'poor-mobile-experience',
        type: 'mobile-optimization',
        severity: 'high',
        title: 'Poor mobile experience',
        description: 'Site has both responsive design and mobile performance issues.',
        impact: 'Affects user experience, search rankings, and conversion rates across mobile devices',
        fixComplexity: 'hard',
        affectedElements: ['responsive design', 'mobile performance', 'user experience'],
        recommendation: 'Implement responsive design and optimize mobile performance comprehensively.',
        category: 'technical',
        estimatedTime: '1-2 weeks',
        businessImpact: 'high',
        affectedCategories: ['technical', 'ux', 'onpage'],
        compoundImpact: 'Mobile users represent majority of traffic - fixing this improves multiple ranking factors',
        implementationSteps: [
          'Audit mobile user experience',
          'Implement responsive design principles',
          'Optimize mobile page speed',
          'Improve touch interactions',
          'Test across multiple devices',
          'Monitor mobile Core Web Vitals'
        ],
        validationCriteria: [
          'Site is fully responsive across devices',
          'Mobile page speed score above 50',
          'Touch targets are appropriately sized',
          'Content fits viewport without horizontal scroll'
        ]
      });
    }

    return issues;
  }

  private generateIssueSummary(issues: any): IssueSummary {
    const allIssues = [
      ...issues.critical,
      ...issues.high,
      ...issues.medium,
      ...issues.low,
      ...issues.crossCategory
    ];

    const quickWins = allIssues.filter(issue => 
      issue.fixComplexity === 'easy' && 
      (issue.severity === 'high' || issue.severity === 'critical')
    );

    return {
      totalIssues: allIssues.length,
      criticalCount: issues.critical.length,
      highCount: issues.high.length,
      mediumCount: issues.medium.length,
      lowCount: issues.low.length,
      avgFixTime: this.calculateAverageFixTime(allIssues),
      quickWinsAvailable: quickWins.length
    };
  }

  private prioritizeIssues(issues: any): IssuePrioritization {
    const allIssues = [
      ...issues.critical,
      ...issues.high,
      ...issues.medium,
      ...issues.low,
      ...issues.crossCategory
    ];

    const immediate = issues.critical.concat(
      issues.high.filter((issue: any) => issue.fixComplexity === 'easy')
    );

    const shortTerm = issues.high.filter((issue: any) => issue.fixComplexity !== 'easy')
      .concat(issues.medium.filter((issue: any) => issue.businessImpact === 'high'));

    const longTerm = issues.medium.filter((issue: any) => issue.businessImpact !== 'high')
      .concat(issues.low);

    const quickWins = allIssues.filter((issue: any) => 
      issue.fixComplexity === 'easy' && 
      (issue.severity === 'high' || issue.severity === 'critical')
    );

    return {
      immediate,
      shortTerm,
      longTerm,
      quickWins,
      impactMatrix: this.createImpactMatrix(allIssues)
    };
  }

  private createImpactMatrix(issues: SEOIssue[]): any {
    return {
      highImpactEasyFix: issues.filter(issue => 
        (issue.severity === 'critical' || issue.severity === 'high') && 
        issue.fixComplexity === 'easy'
      ),
      highImpactHardFix: issues.filter(issue => 
        (issue.severity === 'critical' || issue.severity === 'high') && 
        issue.fixComplexity === 'hard'
      ),
      lowImpactEasyFix: issues.filter(issue => 
        (issue.severity === 'medium' || issue.severity === 'low') && 
        issue.fixComplexity === 'easy'
      ),
      lowImpactHardFix: issues.filter(issue => 
        (issue.severity === 'medium' || issue.severity === 'low') && 
        issue.fixComplexity === 'hard'
      )
    };
  }

  private generateDetailedRecommendations(issues: CategorizedIssues, context: any): DetailedRecommendation[] {
    const allIssues = [
      ...issues.critical,
      ...issues.high,
      ...issues.medium.slice(0, 5), // Limit medium priority recommendations
      ...issues.low.slice(0, 3)     // Limit low priority recommendations
    ];

    return allIssues.map(issue => this.createDetailedRecommendation(issue, context));
  }

  private createDetailedRecommendation(issue: SEOIssue, context: any): DetailedRecommendation {
    return {
      id: `rec-${issue.id}`,
      issueId: issue.id,
      title: issue.title,
      description: issue.description,
      priority: this.mapSeverityToPriority(issue.severity),
      impact: issue.businessImpact,
      effort: issue.fixComplexity,
      timeToImplement: issue.estimatedTime,
      
      implementation: {
        steps: issue.implementationSteps,
        codeExamples: this.generateCodeExamples(issue),
        tools: this.recommendTools(issue),
        resources: this.findRelevantResources(issue)
      },
      
      expectedResults: {
        seoImpact: this.estimateSEOImpact(issue),
        userImpact: this.estimateUserImpact(issue),
        businessImpact: issue.impact,
        timeframe: this.estimateResultTimeframe(issue)
      },
      
      validation: {
        successCriteria: issue.validationCriteria,
        testingMethods: this.recommendTestingMethods(issue),
        monitoringMetrics: this.defineMonitoringMetrics(issue)
      }
    };
  }

  // Helper methods
  private flattenIssues(categorizedIssues: CategorizedIssues): SEOIssue[] {
    return [
      ...categorizedIssues.critical,
      ...categorizedIssues.high,
      ...categorizedIssues.medium,
      ...categorizedIssues.low,
      ...categorizedIssues.crossCategory
    ];
  }

  private calculateAverageFixTime(issues: SEOIssue[]): string {
    // Simplified calculation - in practice, would convert time estimates to minutes
    return "2-3 hours";
  }

  private mapSeverityToPriority(severity: string): 'immediate' | 'high' | 'medium' | 'low' {
    switch (severity) {
      case 'critical': return 'immediate';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'low';
    }
  }

  private generateCodeExamples(issue: SEOIssue): { [key: string]: string } {
    const examples: { [key: string]: string } = {};

    switch (issue.type) {
      case 'meta-tags':
        if (issue.id === 'missing-title') {
          examples.html = '<title>Your Compelling Page Title - Brand Name</title>';
        }
        if (issue.id === 'missing-meta-description') {
          examples.html = '<meta name="description" content="Compelling description of your page content that encourages clicks.">';
        }
        break;
      case 'security':
        if (issue.id === 'no-ssl') {
          examples.nginx = `
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name example.com;
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
}`;
        }
        break;
    }

    return examples;
  }

  private recommendTools(issue: SEOIssue): string[] {
    const tools: string[] = [];

    switch (issue.category) {
      case 'technical':
        tools.push('Google PageSpeed Insights', 'GTmetrix', 'Lighthouse');
        break;
      case 'onpage':
        tools.push('Screaming Frog', 'Ahrefs Site Audit', 'SEMrush');
        break;
      case 'content':
        tools.push('Hemingway Editor', 'Grammarly', 'Yoast SEO');
        break;
    }

    return tools;
  }

  private findRelevantResources(issue: SEOIssue): string[] {
    const resources: string[] = [];

    switch (issue.type) {
      case 'meta-tags':
        resources.push(
          'Google\'s Title Link Guidelines',
          'Meta Description Best Practices',
          'Moz\'s On-Page SEO Guide'
        );
        break;
      case 'performance':
        resources.push(
          'Web.dev Performance Guide',
          'Google Core Web Vitals',
          'PageSpeed Insights Documentation'
        );
        break;
    }

    return resources;
  }

  private estimateSEOImpact(issue: SEOIssue): string {
    switch (issue.severity) {
      case 'critical':
        return 'High - Fixing this issue will significantly improve search visibility and rankings';
      case 'high':
        return 'Medium-High - Noticeable improvement in search performance expected';
      case 'medium':
        return 'Medium - Moderate improvement in specific ranking factors';
      case 'low':
        return 'Low - Minor improvement in overall SEO health';
      default:
        return 'Variable impact depending on implementation quality';
    }
  }

  private estimateUserImpact(issue: SEOIssue): string {
    if (issue.category === 'ux' || issue.type === 'performance') {
      return 'High - Users will experience improved loading speed and usability';
    }
    if (issue.type === 'accessibility') {
      return 'High - Improved accessibility for users with disabilities';
    }
    return 'Medium - Indirect improvement through better search visibility';
  }

  private estimateResultTimeframe(issue: SEOIssue): string {
    switch (issue.severity) {
      case 'critical':
        return '1-2 weeks for immediate impact, full benefits within 4-6 weeks';
      case 'high':
        return '2-4 weeks for noticeable improvement';
      case 'medium':
        return '4-8 weeks for measurable results';
      case 'low':
        return '8-12 weeks for visible impact';
      default:
        return 'Results timeframe varies by implementation';
    }
  }

  private recommendTestingMethods(issue: SEOIssue): string[] {
    const methods: string[] = ['Manual verification'];

    switch (issue.category) {
      case 'technical':
        methods.push('Browser developer tools', 'Automated testing tools');
        break;
      case 'onpage':
        methods.push('SEO audit tools', 'SERP preview tools');
        break;
      case 'ux':
        methods.push('User testing', 'Accessibility audit tools');
        break;
    }

    return methods;
  }

  private defineMonitoringMetrics(issue: SEOIssue): string[] {
    const metrics: string[] = [];

    switch (issue.category) {
      case 'technical':
        metrics.push('Page speed scores', 'Core Web Vitals', 'Search Console performance');
        break;
      case 'onpage':
        metrics.push('Click-through rates', 'Search rankings', 'Impressions');
        break;
      case 'content':
        metrics.push('Time on page', 'Bounce rate', 'Engagement metrics');
        break;
      case 'ux':
        metrics.push('User satisfaction', 'Conversion rates', 'Accessibility scores');
        break;
    }

    return metrics;
  }
} 