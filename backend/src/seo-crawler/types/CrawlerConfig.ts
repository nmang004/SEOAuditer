export interface CrawlerConfig {
  url: string;
  projectId: string;
  userId: string;
  crawlOptions: {
    maxPages: number;
    crawlDepth: number;
    respectRobots: boolean;
    crawlDelay: number;
    userAgent: string;
    timeout: number;
    retryAttempts: number;
    viewport: { width: number; height: number; deviceType: 'desktop' | 'mobile' | 'tablet' };
    extractOptions: {
      screenshots: boolean;
      performanceMetrics: boolean;
      accessibilityCheck: boolean;
      structuredData: boolean;
      socialMetaTags: boolean;
      technicalSEO: boolean;
      contentAnalysis: boolean;
      linkAnalysis: boolean;
      imageAnalysis: boolean;
      mobileOptimization: boolean;
    };
    blockResources: string[];
    allowedDomains: string[];
    excludePatterns: string[];
  };
  callbacks?: {
    onProgress?: (progress: any) => void;
    onPageComplete?: (result: any) => void;
    onIssueFound?: (issue: any) => void;
    onError?: (error: any) => void;
    onComplete?: (results: any) => void;
  };
  queueConfig?: {
    concurrency: number;
    priority: 'high' | 'normal' | 'low';
    scheduledAt?: Date;
    recurringCrawl?: { frequency: 'daily' | 'weekly' | 'monthly'; enabled: boolean };
  };
} 