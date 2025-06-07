import { PageAnalysis } from '../../types/PageAnalysis';
import { EnhancedIssueDetection, SEOIssue, IssueCategory, IssuePriority } from './EnhancedIssueDetection';

export interface SmartRecommendation {
  id: string;
  category: IssueCategory;
  priority: IssuePriority;
  title: string;
  description: string;
  businessImpact: {
    category: 'revenue' | 'traffic' | 'conversion' | 'brand' | 'technical';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    estimatedImpact: string;
  };
  implementation: {
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    estimatedTime: string;
    requiredSkills: string[];
    steps: Array<{
      step: number;
      title: string;
      description: string;
      codeExample?: string;
      tools?: string[];
    }>;
  };
  validation: {
    testingSteps: string[];
    successMetrics: string[];
    monitoringRecommendations: string[];
  };
  resources: {
    documentation: string[];
    tools: string[];
    tutorials?: string[];
  };
  timeline: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  quickWin: boolean;
  strategicValue: number; // 1-10 scale
  relatedIssues: string[];
}

export interface RecommendationStrategy {
  quickWins: SmartRecommendation[];
  strategicInitiatives: SmartRecommendation[];
  longTermGoals: SmartRecommendation[];
  priorityMatrix: {
    immediate: SmartRecommendation[];
    shortTerm: SmartRecommendation[];
    mediumTerm: SmartRecommendation[];
    longTerm: SmartRecommendation[];
  };
}

export class EnhancedRecommendationEngine {
  private issueDetection: EnhancedIssueDetection;

  constructor() {
    this.issueDetection = new EnhancedIssueDetection();
  }

  async generateRecommendations(pageContext: any): Promise<Partial<PageAnalysis>> {
    const { pageAnalysis = {} } = pageContext;
    
    // Get detected issues
    const issueResults = await this.issueDetection.analyze(pageContext);
    const issues = issueResults.issues || [];

    // Generate smart recommendations from issues
    const recommendations = this.generateSmartRecommendations(issues, pageAnalysis);
    
    // Create strategic recommendation plan
    const strategy = this.createRecommendationStrategy(recommendations);

    return {
      recommendations: recommendations.map(rec => this.convertToLegacyFormat(rec)),
      enhancedRecommendations: recommendations,
      recommendationStrategy: strategy,
      recommendationSummary: this.generateSummary(recommendations, strategy)
    };
  }

  private generateSmartRecommendations(issues: SEOIssue[], pageAnalysis: any): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];

    for (const issue of issues) {
      const recommendation = this.createRecommendationFromIssue(issue, pageAnalysis);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    // Add proactive recommendations based on analysis
    recommendations.push(...this.generateProactiveRecommendations(pageAnalysis));

    // Sort by strategic value and priority
    return recommendations.sort((a, b) => {
      const priorityWeight = this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority);
      if (priorityWeight !== 0) return priorityWeight;
      return b.strategicValue - a.strategicValue;
    });
  }

  private createRecommendationFromIssue(issue: SEOIssue, pageAnalysis: any): SmartRecommendation | null {
    const baseRecommendation = {
      id: `rec_${issue.id}`,
      category: issue.category,
      priority: issue.severity as IssuePriority,
      title: issue.title,
      description: issue.description,
      businessImpact: {
        category: 'technical' as const,
        severity: issue.businessImpact as 'low' | 'medium' | 'high' | 'critical',
        description: issue.impact,
        estimatedImpact: this.estimateBusinessImpact(issue.businessImpact, issue.category)
      },
      timeline: this.mapPriorityToTimeline(issue.severity as IssuePriority),
      quickWin: issue.fixComplexity === 'easy' && issue.businessImpact !== 'low',
      strategicValue: this.calculateStrategicValue(issue),
      relatedIssues: [] as any[]
    };

    // Generate specific implementation guidance based on issue type
    switch (issue.category) {
      case 'technical':
        return this.generateTechnicalRecommendation(baseRecommendation, issue, pageAnalysis);
      case 'content':
        return this.generateContentRecommendation(baseRecommendation, issue, pageAnalysis);
      case 'onpage':
        return this.generateOnPageRecommendation(baseRecommendation, issue, pageAnalysis);
      case 'ux':
        return this.generateGenericRecommendation(baseRecommendation, issue);
      default:
        return this.generateGenericRecommendation(baseRecommendation, issue);
    }
  }

  private estimateBusinessImpact(severity: string, category: string): string {
    const impactMap = {
      high: {
        technical: '25-40% improvement in search visibility',
        content: '15-30% increase in organic traffic',
        onpage: '20-35% improvement in click-through rates',
        ux: '10-25% improvement in conversion rates'
      },
      medium: {
        technical: '10-20% improvement in search visibility',
        content: '5-15% increase in organic traffic',
        onpage: '8-20% improvement in click-through rates',
        ux: '5-15% improvement in conversion rates'
      },
      low: {
        technical: '2-8% improvement in search visibility',
        content: '1-5% increase in organic traffic',
        onpage: '2-8% improvement in click-through rates',
        ux: '1-5% improvement in conversion rates'
      }
    };

    return impactMap[severity as keyof typeof impactMap]?.[category as keyof typeof impactMap.high] || 'Minor improvement expected';
  }

  private generateTechnicalRecommendation(
    base: Partial<SmartRecommendation>, 
    issue: SEOIssue, 
    pageAnalysis: any
  ): SmartRecommendation {
    const technicalRecommendations = {
      'missing-https': {
        implementation: {
          difficulty: 'intermediate' as const,
          estimatedTime: '2-4 hours',
          requiredSkills: ['server administration', 'SSL/TLS'],
          steps: [
            {
              step: 1,
              title: 'Obtain SSL Certificate',
              description: 'Get an SSL certificate from a trusted Certificate Authority or use Let\'s Encrypt for free certificates.',
              tools: ['Let\'s Encrypt', 'Cloudflare', 'AWS Certificate Manager']
            },
            {
              step: 2,
              title: 'Install Certificate',
              description: 'Install the SSL certificate on your web server.',
              codeExample: `# For Apache
SSLEngine on
SSLCertificateFile /path/to/certificate.crt
SSLCertificateKeyFile /path/to/private.key`
            },
            {
              step: 3,
              title: 'Configure HTTPS Redirects',
              description: 'Set up 301 redirects from HTTP to HTTPS.',
              codeExample: `# .htaccess for Apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]`
            },
            {
              step: 4,
              title: 'Update Internal Links',
              description: 'Update all internal links to use HTTPS URLs.'
            }
          ]
        },
        validation: {
          testingSteps: [
            'Test HTTPS access to all pages',
            'Verify SSL certificate validity',
            'Check for mixed content warnings',
            'Test redirects from HTTP to HTTPS'
          ],
          successMetrics: [
            'All pages accessible via HTTPS',
            'No SSL certificate errors',
            'No mixed content warnings',
            'Proper 301 redirects from HTTP'
          ],
          monitoringRecommendations: [
            'Monitor SSL certificate expiration',
            'Set up SSL monitoring alerts',
            'Regular security scans'
          ]
        },
        resources: {
          documentation: [
            'https://developers.google.com/search/blog/2014/08/https-as-ranking-signal',
            'https://letsencrypt.org/getting-started/'
          ],
          tools: ['SSL Labs Test', 'Qualys SSL Test', 'Mozilla Observatory']
        }
      },
      'missing-robots-txt': {
        implementation: {
          difficulty: 'beginner' as const,
          estimatedTime: '30 minutes',
          requiredSkills: ['basic web development'],
          steps: [
            {
              step: 1,
              title: 'Create robots.txt File',
              description: 'Create a robots.txt file in your website root directory.',
              codeExample: `User-agent: *
Disallow: /admin/
Disallow: /private/
Allow: /

Sitemap: https://yourdomain.com/sitemap.xml`
            },
            {
              step: 2,
              title: 'Upload to Root Directory',
              description: 'Upload the file to https://yourdomain.com/robots.txt'
            },
            {
              step: 3,
              title: 'Test robots.txt',
              description: 'Use Google Search Console robots.txt Tester to validate the file.'
            }
          ]
        },
        validation: {
          testingSteps: [
            'Access robots.txt via browser',
            'Test with Google Search Console robots.txt Tester',
            'Verify crawl directives are working'
          ],
          successMetrics: [
            'robots.txt accessible at /robots.txt',
            'Valid syntax confirmed by GSC',
            'Appropriate crawl directives in place'
          ],
          monitoringRecommendations: [
            'Monitor crawl errors in GSC',
            'Regular robots.txt validation'
          ]
        },
        resources: {
          documentation: [
            'https://developers.google.com/search/docs/crawling-indexing/robots/intro'
          ],
          tools: ['Google Search Console', 'Screaming Frog']
        }
      }
    };

    const specific = technicalRecommendations[issue.id as keyof typeof technicalRecommendations] || 
                    this.generateGenericTechnicalImplementation(issue);

    return {
      ...base,
      ...specific
    } as SmartRecommendation;
  }

  private generateContentRecommendation(
    base: Partial<SmartRecommendation>, 
    issue: SEOIssue, 
    pageAnalysis: any
  ): SmartRecommendation {
    const contentRecommendations = {
      'thin-content': {
        implementation: {
          difficulty: 'intermediate' as const,
          estimatedTime: '4-8 hours',
          requiredSkills: ['content writing', 'SEO', 'research'],
          steps: [
            {
              step: 1,
              title: 'Content Audit',
              description: 'Analyze current content depth and identify gaps.',
              tools: ['Screaming Frog', 'Ahrefs', 'SEMrush']
            },
            {
              step: 2,
              title: 'Keyword Research',
              description: 'Research additional relevant keywords and topics to cover.'
            },
            {
              step: 3,
              title: 'Content Expansion',
              description: 'Add comprehensive, valuable content targeting identified keywords.',
              codeExample: `Target word count: 1500+ words
Include:
- Introduction with value proposition
- Main content sections with subheadings
- Examples and case studies
- Actionable takeaways
- Related resources`
            },
            {
              step: 4,
              title: 'Content Optimization',
              description: 'Optimize for readability, structure, and user engagement.'
            }
          ]
        },
        validation: {
          testingSteps: [
            'Check word count (aim for 1500+ words)',
            'Verify comprehensive topic coverage',
            'Test readability scores',
            'Assess user engagement metrics'
          ],
          successMetrics: [
            'Word count increased to 1500+ words',
            'Improved topic authority',
            'Better readability scores',
            'Increased time on page'
          ],
          monitoringRecommendations: [
            'Track organic traffic growth',
            'Monitor ranking improvements',
            'Watch user engagement metrics'
          ]
        },
        resources: {
          documentation: [
            'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'
          ],
          tools: ['Grammarly', 'Hemingway Editor', 'Yoast SEO'],
          tutorials: ['Content Marketing Institute guides']
        }
      },
      'poor-readability': {
        implementation: {
          difficulty: 'beginner' as const,
          estimatedTime: '2-3 hours',
          requiredSkills: ['content editing', 'writing'],
          steps: [
            {
              step: 1,
              title: 'Analyze Current Readability',
              description: 'Use readability tools to identify specific issues.',
              tools: ['Hemingway Editor', 'Grammarly', 'Yoast SEO']
            },
            {
              step: 2,
              title: 'Simplify Sentence Structure',
              description: 'Break down complex sentences into shorter, clearer ones.'
            },
            {
              step: 3,
              title: 'Improve Paragraph Structure',
              description: 'Use shorter paragraphs and clear topic sentences.'
            },
            {
              step: 4,
              title: 'Add Visual Elements',
              description: 'Include bullet points, subheadings, and white space.'
            }
          ]
        },
        validation: {
          testingSteps: [
            'Test readability with multiple tools',
            'Review average sentence length',
            'Check paragraph structure',
            'Assess visual hierarchy'
          ],
          successMetrics: [
            'Flesch Reading Ease score > 60',
            'Average sentence length < 20 words',
            'Clear paragraph structure',
            'Improved user engagement'
          ],
          monitoringRecommendations: [
            'Regular readability audits',
            'User feedback collection',
            'Engagement metric tracking'
          ]
        },
        resources: {
          documentation: [
            'https://yoast.com/what-is-readability/'
          ],
          tools: ['Hemingway Editor', 'Grammarly', 'Readable.com']
        }
      }
    };

    const specific = contentRecommendations[issue.id as keyof typeof contentRecommendations] || 
                    this.generateGenericContentImplementation(issue);

    return {
      ...base,
      ...specific
    } as SmartRecommendation;
  }

  private generateOnPageRecommendation(
    base: Partial<SmartRecommendation>, 
    issue: SEOIssue, 
    pageAnalysis: any
  ): SmartRecommendation {
    const onPageRecommendations = {
      'missing-title': {
        implementation: {
          difficulty: 'beginner' as const,
          estimatedTime: '15 minutes',
          requiredSkills: ['basic HTML'],
          steps: [
            {
              step: 1,
              title: 'Research Target Keywords',
              description: 'Identify primary and secondary keywords for the page.'
            },
            {
              step: 2,
              title: 'Craft Compelling Title',
              description: 'Write a descriptive, keyword-rich title under 60 characters.',
              codeExample: `<title>Primary Keyword | Secondary Keyword - Brand Name</title>`
            },
            {
              step: 3,
              title: 'Implement Title Tag',
              description: 'Add the title tag to the HTML head section.'
            }
          ]
        },
        validation: {
          testingSteps: [
            'Check title appears in browser tab',
            'Verify title length under 60 characters',
            'Test title in SERP preview tools'
          ],
          successMetrics: [
            'Title tag present and visible',
            'Optimal length (50-60 characters)',
            'Includes target keywords',
            'Compelling and descriptive'
          ],
          monitoringRecommendations: [
            'Monitor click-through rates',
            'Track ranking improvements',
            'A/B test different titles'
          ]
        },
        resources: {
          documentation: [
            'https://developers.google.com/search/docs/appearance/title-link'
          ],
          tools: ['SERP Preview Tools', 'Yoast SEO', 'Screaming Frog']
        }
      }
      // Add more on-page recommendations...
    };

    const specific = onPageRecommendations[issue.id as keyof typeof onPageRecommendations] || 
                    this.generateGenericOnPageImplementation(issue);

    return {
      ...base,
      ...specific
    } as SmartRecommendation;
  }

  private generateGenericRecommendation(
    base: Partial<SmartRecommendation>, 
    issue: SEOIssue
  ): SmartRecommendation {
    return {
      ...base,
      implementation: {
        difficulty: 'intermediate' as const,
        estimatedTime: '1-2 hours',
        requiredSkills: ['SEO basics'],
        steps: [
          {
            step: 1,
            title: 'Investigate Issue',
            description: issue.description
          },
          {
            step: 2,
            title: 'Implement Solution',
            description: 'Follow best practices to resolve the identified issue.'
          }
        ]
      },
      validation: {
        testingSteps: ['Verify issue resolution'],
        successMetrics: ['Issue no longer detected'],
        monitoringRecommendations: ['Monitor for regression']
      },
      resources: {
        documentation: ['https://developers.google.com/search/docs'],
        tools: ['Google Search Console']
      }
    } as SmartRecommendation;
  }

  private generateGenericTechnicalImplementation(issue: SEOIssue) {
    return {
      implementation: {
        difficulty: 'intermediate' as const,
        estimatedTime: '1-2 hours',
        requiredSkills: ['technical SEO', 'web development'],
        steps: [
          {
            step: 1,
            title: 'Technical Analysis',
            description: issue.description
          }
        ]
      },
      validation: {
        testingSteps: ['Technical verification'],
        successMetrics: ['Technical issue resolved'],
        monitoringRecommendations: ['Regular technical audits']
      },
      resources: {
        documentation: ['https://developers.google.com/search/docs'],
        tools: ['Google Search Console', 'Screaming Frog']
      }
    };
  }

  private generateGenericContentImplementation(issue: SEOIssue) {
    return {
      implementation: {
        difficulty: 'beginner' as const,
        estimatedTime: '2-4 hours',
        requiredSkills: ['content writing', 'SEO'],
        steps: [
          {
            step: 1,
            title: 'Content Review',
            description: issue.description
          }
        ]
      },
      validation: {
        testingSteps: ['Content quality check'],
        successMetrics: ['Improved content metrics'],
        monitoringRecommendations: ['Content performance monitoring']
      },
      resources: {
        documentation: ['https://developers.google.com/search/docs/fundamentals/creating-helpful-content'],
        tools: ['Grammarly', 'Hemingway Editor']
      }
    };
  }

  private generateGenericOnPageImplementation(issue: SEOIssue) {
    return {
      implementation: {
        difficulty: 'beginner' as const,
        estimatedTime: '30 minutes - 1 hour',
        requiredSkills: ['basic HTML', 'SEO'],
        steps: [
          {
            step: 1,
            title: 'On-Page Optimization',
            description: issue.description
          }
        ]
      },
      validation: {
        testingSteps: ['On-page element verification'],
        successMetrics: ['Proper on-page optimization'],
        monitoringRecommendations: ['Regular on-page audits']
      },
      resources: {
        documentation: ['https://moz.com/learn/seo'],
        tools: ['Yoast SEO', 'Screaming Frog']
      }
    };
  }

  private generateProactiveRecommendations(pageAnalysis: any): SmartRecommendation[] {
    const proactive: SmartRecommendation[] = [];

    // Content enhancement opportunities
    if (pageAnalysis.content?.wordCount && pageAnalysis.content.wordCount > 500) {
      proactive.push({
        id: 'proactive_content_enhancement',
        category: 'content',
        priority: 'medium',
        title: 'Content Enhancement Opportunity',
        description: 'Your content has good length. Consider adding more depth with examples, case studies, or related topics.',
        businessImpact: {
          category: 'traffic',
          severity: 'medium',
          description: 'Enhanced content can improve rankings and user engagement',
          estimatedImpact: '10-20% increase in organic traffic'
        },
        implementation: {
          difficulty: 'intermediate',
          estimatedTime: '4-6 hours',
          requiredSkills: ['content writing', 'research'],
          steps: [
            {
              step: 1,
              title: 'Content Gap Analysis',
              description: 'Identify opportunities to expand on current topics.'
            },
            {
              step: 2,
              title: 'Add Supporting Content',
              description: 'Include examples, case studies, or additional perspectives.'
            }
          ]
        },
        validation: {
          testingSteps: ['Monitor user engagement', 'Track time on page'],
          successMetrics: ['Increased dwell time', 'Better user engagement'],
          monitoringRecommendations: ['Track organic traffic growth']
        },
        resources: {
          documentation: ['https://developers.google.com/search/docs/fundamentals/creating-helpful-content'],
          tools: ['Google Analytics', 'Search Console']
        },
        timeline: 'short-term',
        quickWin: false,
        strategicValue: 7,
        relatedIssues: []
      });
    }

    return proactive;
  }

  private createRecommendationStrategy(recommendations: SmartRecommendation[]): RecommendationStrategy {
    const quickWins = recommendations.filter(rec => rec.quickWin);
    const strategicInitiatives = recommendations.filter(rec => 
      rec.strategicValue >= 7 && !rec.quickWin
    );
    const longTermGoals = recommendations.filter(rec => 
      rec.timeline === 'long-term' || rec.implementation.difficulty === 'expert'
    );

    return {
      quickWins,
      strategicInitiatives,
      longTermGoals,
      priorityMatrix: {
        immediate: recommendations.filter(rec => rec.timeline === 'immediate'),
        shortTerm: recommendations.filter(rec => rec.timeline === 'short-term'),
        mediumTerm: recommendations.filter(rec => rec.timeline === 'medium-term'),
        longTerm: recommendations.filter(rec => rec.timeline === 'long-term')
      }
    };
  }

  private generateSummary(recommendations: SmartRecommendation[], strategy: RecommendationStrategy) {
    return {
      totalRecommendations: recommendations.length,
      quickWinsCount: strategy.quickWins.length,
      strategicInitiativesCount: strategy.strategicInitiatives.length,
      estimatedImplementationTime: this.calculateTotalImplementationTime(recommendations),
      priorityDistribution: {
        critical: recommendations.filter(r => r.priority === 'critical').length,
        high: recommendations.filter(r => r.priority === 'high').length,
        medium: recommendations.filter(r => r.priority === 'medium').length,
        low: recommendations.filter(r => r.priority === 'low').length
      },
      categoryDistribution: this.getCategoryDistribution(recommendations),
      averageStrategicValue: recommendations.reduce((sum, rec) => sum + rec.strategicValue, 0) / recommendations.length
    };
  }

  private mapPriorityToTimeline(priority: IssuePriority): 'immediate' | 'short-term' | 'medium-term' | 'long-term' {
    switch (priority) {
      case 'critical': return 'immediate';
      case 'high': return 'short-term';
      case 'medium': return 'medium-term';
      case 'low': return 'long-term';
      default: return 'medium-term';
    }
  }

  private calculateStrategicValue(issue: SEOIssue): number {
    let value = 5; // Base value

    // Adjust based on business impact (string in SEOIssue)
    switch (issue.businessImpact) {
      case 'high': value += 2; break;
      case 'medium': value += 1; break;
      case 'low': break;
      default: break;
    }

    // Adjust based on fix complexity (easier fixes get higher strategic value)
    switch (issue.fixComplexity) {
      case 'easy': value += 2; break;
      case 'medium': value += 1; break;
      case 'hard': value -= 1; break;
      default: break;
    }

    return Math.max(1, Math.min(10, value));
  }

  private getPriorityWeight(priority: IssuePriority): number {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  private calculateTotalImplementationTime(recommendations: SmartRecommendation[]): string {
    const timeRegex = /(\d+(?:\.\d+)?)-?(\d+(?:\.\d+)?)?/;
    let totalHours = 0;
    let timeCount = 0;

    for (const rec of recommendations) {
      const timeStr = rec.implementation.estimatedTime;
      const match = timeStr.match(timeRegex);
      
      if (match) {
        const min = parseFloat(match[1]);
        const max = match[2] ? parseFloat(match[2]) : min;
        totalHours += (min + max) / 2;
        timeCount++;
      }
    }

    if (timeCount === 0) return 'Unknown';

    const hours = Math.round(totalHours);
    if (hours < 8) return `${hours} hours`;
    if (hours < 40) return `${Math.round(hours / 8)} days`;
    return `${Math.round(hours / 40)} weeks`;
  }

  private getCategoryDistribution(recommendations: SmartRecommendation[]) {
    const distribution: Record<string, number> = {};
    for (const rec of recommendations) {
      distribution[rec.category] = (distribution[rec.category] || 0) + 1;
    }
    return distribution;
  }

  private convertToLegacyFormat(recommendation: SmartRecommendation) {
    return {
      type: recommendation.category,
      priority: recommendation.priority,
      title: recommendation.title,
      description: recommendation.description,
      quickWin: recommendation.quickWin,
      doc: recommendation.resources.documentation[0] || ''
    };
  }
} 