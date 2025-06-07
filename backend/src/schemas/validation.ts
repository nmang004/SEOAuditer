import { z } from 'zod';

// ============ UTILITY FUNCTIONS ============

// Enhanced sanitization to prevent XSS and SQL injection
const sanitizeString = (str: string): string => {
  return str
    .trim()
    .replace(/[<>'"&]/g, (char) => {
      const map: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return map[char] || char;
    })
    // Remove potential SQL injection patterns
    .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi, '')
    // Remove script tags and event handlers
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
};

// URL validation with additional security checks
const validateSecureUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    // Allow only HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }
    // Prevent localhost and internal network access in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = parsedUrl.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')
      ) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
};

// ============ BASE SCHEMAS ============

export const uuidSchema = z.string().uuid('Invalid UUID format');
export const emailSchema = z.string()
  .email('Invalid email format')
  .toLowerCase()
  .transform(sanitizeString);

export const urlSchema = z.string()
  .url('Invalid URL format')
  .refine(validateSecureUrl, 'URL must use HTTP/HTTPS protocol and be accessible');

export const scoreSchema = z.number()
  .int('Score must be an integer')
  .min(0, 'Score must be non-negative')
  .max(100, 'Score cannot exceed 100');

export const positiveIntSchema = z.number()
  .int('Must be an integer')
  .positive('Must be positive');

export const nonNegativeIntSchema = z.number()
  .int('Must be an integer')
  .min(0, 'Must be non-negative');

// Enhanced string schema with comprehensive sanitization
const sanitizedStringSchema = (minLength: number = 1, maxLength: number = 255) => 
  z.string()
    .min(minLength, `Minimum length is ${minLength}`)
    .max(maxLength, `Maximum length is ${maxLength}`)
    .transform(sanitizeString);

// Enhanced enum schemas with validation
export const severitySchema = z.enum(['critical', 'high', 'medium', 'low'], {
  errorMap: () => ({ message: 'Severity must be one of: critical, high, medium, low' })
});

export const prioritySchema = z.enum(['immediate', 'high', 'medium', 'low'], {
  errorMap: () => ({ message: 'Priority must be one of: immediate, high, medium, low' })
});

export const categorySchema = z.enum(['technical', 'content', 'onpage', 'ux'], {
  errorMap: () => ({ message: 'Category must be one of: technical, content, onpage, ux' })
});

export const businessImpactSchema = z.enum(['high', 'medium', 'low'], {
  errorMap: () => ({ message: 'Business impact must be one of: high, medium, low' })
});

export const statusSchema = z.enum(['new', 'in_progress', 'fixed', 'wont_fix', 'ignored'], {
  errorMap: () => ({ message: 'Status must be one of: new, in_progress, fixed, wont_fix, ignored' })
});

// SEO-specific validation schemas
export const seoTitleSchema = z.string()
  .min(10, 'SEO title too short (minimum 10 characters)')
  .max(60, 'SEO title too long (maximum 60 characters)')
  .transform(sanitizeString);

export const seoDescriptionSchema = z.string()
  .min(120, 'SEO description too short (minimum 120 characters)')
  .max(160, 'SEO description too long (maximum 160 characters)')
  .transform(sanitizeString);

export const seoKeywordsSchema = z.string()
  .max(200, 'Keywords too long')
  .transform(sanitizeString)
  .optional();

// ============ USER SCHEMAS ============

export const userCreateSchema = z.object({
  email: emailSchema,
  passwordHash: z.string().min(1, 'Password hash is required'),
  name: sanitizedStringSchema(1, 100).optional(),
  subscriptionTier: z.enum(['free', 'basic', 'premium', 'enterprise']).default('free'),
});

export const userUpdateSchema = z.object({
  name: sanitizedStringSchema(1, 100).optional(),
  subscriptionTier: z.enum(['free', 'basic', 'premium', 'enterprise']).optional(),
  emailVerified: z.boolean().optional(),
  lastLogin: z.date().optional(),
});

export const userSettingsSchema = z.object({
  userId: uuidSchema,
  notifications: z.record(z.any()).optional(),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  language: z.string().min(2).max(5).default('en'),
  timezone: z.string().default('UTC'),
  emailAlerts: z.boolean().default(true),
  weeklyReports: z.boolean().default(true),
});

// ============ PROJECT SCHEMAS ============

export const projectCreateSchema = z.object({
  userId: uuidSchema,
  name: sanitizedStringSchema(1, 100),
  url: urlSchema,
  faviconUrl: urlSchema.optional(),
  status: z.enum(['active', 'paused', 'archived']).default('active'),
  scanFrequency: z.enum(['manual', 'daily', 'weekly', 'monthly']).default('manual'),
});

export const projectUpdateSchema = z.object({
  name: sanitizedStringSchema(1, 100).optional(),
  url: urlSchema.optional(),
  faviconUrl: urlSchema.optional(),
  status: z.enum(['active', 'paused', 'archived']).optional(),
  scanFrequency: z.enum(['manual', 'daily', 'weekly', 'monthly']).optional(),
  currentScore: scoreSchema.optional(),
  issueCount: nonNegativeIntSchema.optional(),
  lastScanDate: z.date().optional(),
});

// Enhanced filter schema with advanced search capabilities
export const projectFilterSchema = z.object({
  page: positiveIntSchema.default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['name', 'url', 'createdAt', 'lastScanDate', 'currentScore']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['active', 'paused', 'archived']).optional(),
  searchTerm: sanitizedStringSchema(1, 100).optional(),
  scoreRange: z.object({
    min: scoreSchema.optional(),
    max: scoreSchema.optional(),
  }).optional(),
  dateRange: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }).optional(),
}).refine(
  (data) => {
    if (data.scoreRange) {
      const { min, max } = data.scoreRange;
      if (min !== undefined && max !== undefined) {
        return min <= max;
      }
    }
    return true;
  },
  'Minimum score must be less than or equal to maximum score'
).refine(
  (data) => {
    if (data.dateRange) {
      const { from, to } = data.dateRange;
      if (from && to) {
        return from <= to;
      }
    }
    return true;
  },
  'Start date must be before end date'
);

// ============ CRAWL SESSION SCHEMAS ============

export const crawlSessionCreateSchema = z.object({
  id: uuidSchema.optional(),
  projectId: uuidSchema,
  url: urlSchema,
  status: z.enum(['queued', 'running', 'completed', 'failed']).default('queued'),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  errorMessage: sanitizedStringSchema(1, 1000).optional(),
});

export const crawlSessionUpdateSchema = z.object({
  status: z.enum(['queued', 'running', 'completed', 'failed']).optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  errorMessage: sanitizedStringSchema(1, 1000).optional(),
});

// ============ SEO ANALYSIS SCHEMAS ============

export const seoAnalysisCreateSchema = z.object({
  crawlSessionId: uuidSchema,
  projectId: uuidSchema,
  overallScore: scoreSchema.optional(),
  technicalScore: scoreSchema.optional(),
  contentScore: scoreSchema.optional(),
  onpageScore: scoreSchema.optional(),
  uxScore: scoreSchema.optional(),
  previousScore: scoreSchema.optional(),
  scoreChange: z.number().int().min(-100).max(100).optional(),
}).refine(
  (data) => {
    // Ensure score consistency and business logic validation
    const scores = [data.technicalScore, data.contentScore, data.onpageScore, data.uxScore]
      .filter((score): score is number => score !== undefined);
    
    if (scores.length > 0 && data.overallScore !== undefined) {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      return Math.abs(data.overallScore - avgScore) <= 15; // Allow reasonable variance
    }
    return true;
  },
  'Overall score should be consistent with category scores'
).refine(
  (data) => {
    // Validate score change calculation
    if (data.scoreChange !== undefined && data.overallScore !== undefined && data.previousScore !== undefined) {
      const expectedChange = data.overallScore - data.previousScore;
      return Math.abs(data.scoreChange - expectedChange) <= 1; // Allow for rounding
    }
    return true;
  },
  'Score change should match the difference between current and previous scores'
);

export const seoAnalysisUpdateSchema = z.object({
  overallScore: scoreSchema.optional(),
  technicalScore: scoreSchema.optional(),
  contentScore: scoreSchema.optional(),
  onpageScore: scoreSchema.optional(),
  uxScore: scoreSchema.optional(),
  previousScore: scoreSchema.optional(),
  scoreChange: z.number().int().min(-100).max(100).optional(),
});

export const seoAnalysisFilterSchema = z.object({
  page: positiveIntSchema.default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'overallScore', 'technicalScore', 'contentScore', 'onpageScore', 'uxScore']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  minScore: scoreSchema.optional(),
  maxScore: scoreSchema.optional(),
  scoreImprovement: z.enum(['improved', 'declined', 'unchanged']).optional(),
}).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return data.dateFrom <= data.dateTo;
    }
    return true;
  },
  'Start date must be before end date'
).refine(
  (data) => {
    if (data.minScore !== undefined && data.maxScore !== undefined) {
      return data.minScore <= data.maxScore;
    }
    return true;
  },
  'Minimum score must be less than or equal to maximum score'
);

// Bulk analysis creation schema for high-throughput operations
export const seoAnalysisBulkCreateSchema = z.array(seoAnalysisCreateSchema)
  .min(1, 'At least one analysis is required')
  .max(50, 'Maximum 50 analyses can be created at once'); // Limit for performance

// ============ SEO ISSUE SCHEMAS ============

export const seoIssueCreateSchema = z.object({
  analysisId: uuidSchema,
  type: sanitizedStringSchema(1, 50),
  severity: severitySchema,
  title: sanitizedStringSchema(1, 200),
  description: sanitizedStringSchema(1, 1000).optional(),
  recommendation: sanitizedStringSchema(1, 1000).optional(),
  affectedElements: z.record(z.any()).optional(),
  status: statusSchema.default('new'),
  category: categorySchema,
  affectedPages: positiveIntSchema.default(1),
  fixComplexity: z.enum(['easy', 'medium', 'hard']).optional(),
  estimatedTime: sanitizedStringSchema(1, 50).optional(),
  businessImpact: businessImpactSchema.optional(),
  implementationSteps: z.array(sanitizedStringSchema(1, 500)).max(10, 'Maximum 10 implementation steps'),
  validationCriteria: z.array(sanitizedStringSchema(1, 300)).max(10, 'Maximum 10 validation criteria'),
  blockingIndexing: z.boolean().default(false),
  securityConcern: z.boolean().default(false),
  rankingImpact: z.enum(['major', 'moderate', 'minor']).optional(),
  enhancementType: z.enum(['usability', 'accessibility', 'performance']).optional(),
  compoundIssue: z.boolean().default(false),
  affectedCategories: z.array(z.string()).max(4, 'Maximum 4 affected categories'),
}).refine(
  (data) => {
    // Critical issues should have high business impact
    if (data.severity === 'critical' && data.businessImpact === 'low') {
      return false;
    }
    return true;
  },
  'Critical issues should not have low business impact'
).refine(
  (data) => {
    // Security concerns should have appropriate severity
    if (data.securityConcern && !['critical', 'high'].includes(data.severity)) {
      return false;
    }
    return true;
  },
  'Security concerns should have critical or high severity'
).refine(
  (data) => {
    // Indexing blocking issues should be high priority
    if (data.blockingIndexing && !['critical', 'high'].includes(data.severity)) {
      return false;
    }
    return true;
  },
  'Indexing blocking issues should have critical or high severity'
);

export const seoIssueUpdateSchema = z.object({
  status: statusSchema.optional(),
  recommendation: sanitizedStringSchema(1, 1000).optional(),
  businessImpact: businessImpactSchema.optional(),
  implementationSteps: z.array(sanitizedStringSchema(1, 500)).max(10).optional(),
  validationCriteria: z.array(sanitizedStringSchema(1, 300)).max(10).optional(),
  notes: sanitizedStringSchema(1, 500).optional(),
});

export const seoIssueFilterSchema = z.object({
  page: positiveIntSchema.default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'severity', 'status', 'type', 'businessImpact', 'affectedPages']).default('severity'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  severity: severitySchema.optional(),
  category: categorySchema.optional(),
  status: statusSchema.optional(),
  businessImpact: businessImpactSchema.optional(),
  fixComplexity: z.enum(['easy', 'medium', 'hard']).optional(),
  blockingIndexing: z.boolean().optional(),
  securityConcern: z.boolean().optional(),
  searchTerm: sanitizedStringSchema(1, 100).optional(),
});

// Advanced issue filter schema with additional search capabilities
export const seoIssueAdvancedFilterSchema = seoIssueFilterSchema.extend({
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  rankingImpact: z.enum(['major', 'moderate', 'minor']).optional(),
  enhancementType: z.enum(['usability', 'accessibility', 'performance']).optional(),
  affectedPagesRange: z.object({
    min: positiveIntSchema.optional(),
    max: positiveIntSchema.optional(),
  }).optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags').optional(),
}).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return data.dateFrom <= data.dateTo;
    }
    return true;
  },
  'Start date must be before end date'
).refine(
  (data) => {
    if (data.affectedPagesRange) {
      const { min, max } = data.affectedPagesRange;
      if (min !== undefined && max !== undefined) {
        return min <= max;
      }
    }
    return true;
  },
  'Minimum affected pages must be less than or equal to maximum'
);

// ============ SEO RECOMMENDATION SCHEMAS ============

export const seoRecommendationCreateSchema = z.object({
  analysisId: uuidSchema,
  issueId: uuidSchema.optional(),
  priority: prioritySchema,
  category: categorySchema,
  title: sanitizedStringSchema(1, 200),
  description: sanitizedStringSchema(1, 1000),
  implementationSteps: z.record(z.any()), // JSON field for detailed steps
  codeExamples: z.record(z.any()).optional(), // JSON field for code examples
  tools: z.array(sanitizedStringSchema(1, 100)).max(10, 'Maximum 10 tools'),
  resources: z.array(sanitizedStringSchema(1, 200)).max(10, 'Maximum 10 resources'),
  expectedResults: z.record(z.any()), // JSON field for impact metrics
  validation: z.record(z.any()), // JSON field for success criteria
  effortLevel: z.enum(['easy', 'medium', 'hard']),
  timeEstimate: sanitizedStringSchema(1, 50),
  businessValue: businessImpactSchema,
  quickWin: z.boolean().default(false),
  status: z.enum(['pending', 'in_progress', 'completed', 'dismissed']).default('pending'),
  notes: sanitizedStringSchema(1, 1000).optional(),
}).refine(
  (data) => {
    // Quick wins should be easy to implement
    if (data.quickWin && data.effortLevel === 'hard') {
      return false;
    }
    return true;
  },
  'Quick wins should not require hard effort level'
).refine(
  (data) => {
    // Immediate priority recommendations should have high business value
    if (data.priority === 'immediate' && data.businessValue === 'low') {
      return false;
    }
    return true;
  },
  'Immediate priority recommendations should not have low business value'
);

export const seoRecommendationUpdateSchema = z.object({
  priority: prioritySchema.optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'dismissed']).optional(),
  businessValue: businessImpactSchema.optional(),
  notes: sanitizedStringSchema(1, 1000).optional(),
  completedAt: z.date().optional(),
});

export const seoRecommendationFilterSchema = z.object({
  page: positiveIntSchema.default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'priority', 'businessValue', 'effortLevel', 'status']).default('priority'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  priority: prioritySchema.optional(),
  category: categorySchema.optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'dismissed']).optional(),
  businessValue: businessImpactSchema.optional(),
  effortLevel: z.enum(['easy', 'medium', 'hard']).optional(),
  quickWin: z.boolean().optional(),
  searchTerm: sanitizedStringSchema(1, 100).optional(),
});

// ============ CONTENT ANALYSIS SCHEMAS ============

export const contentAnalysisCreateSchema = z.object({
  analysisId: uuidSchema,
  wordCount: nonNegativeIntSchema,
  readingTime: nonNegativeIntSchema, // in minutes
  paragraphCount: nonNegativeIntSchema,
  sentenceCount: nonNegativeIntSchema,
  averageSentenceLength: z.number().min(0, 'Average sentence length must be non-negative'),
  topicCoverage: z.number().min(0).max(1, 'Topic coverage must be between 0 and 1'),
  contentStructure: z.record(z.any()), // JSON field
  readabilityMetrics: z.record(z.any()), // JSON field
  keywordAnalysis: z.record(z.any()), // JSON field
  freshnessData: z.record(z.any()), // JSON field
  qualityMetrics: z.record(z.any()), // JSON field
  overallScore: scoreSchema,
  recommendations: z.array(sanitizedStringSchema(1, 200)).max(20, 'Maximum 20 recommendations'),
}).refine(
  (data) => {
    // Reading time should be reasonable for word count (average 200 words per minute)
    const expectedReadingTime = Math.ceil(data.wordCount / 200);
    const variance = Math.abs(data.readingTime - expectedReadingTime);
    return variance <= Math.max(2, expectedReadingTime * 0.5); // Allow 50% variance or 2 minutes minimum
  },
  'Reading time should be consistent with word count'
).refine(
  (data) => {
    // Average sentence length should be reasonable
    if (data.sentenceCount > 0) {
      const expectedLength = data.wordCount / data.sentenceCount;
      return Math.abs(data.averageSentenceLength - expectedLength) <= 5; // Allow 5 word variance
    }
    return true;
  },
  'Average sentence length should be consistent with word and sentence counts'
);

// ============ PERFORMANCE METRICS SCHEMAS ============

export const performanceMetricsCreateSchema = z.object({
  analysisId: uuidSchema,
  coreWebVitals: z.record(z.any()), // JSON field for LCP, FID, CLS, etc.
  loadTime: z.number().int().min(0).optional(), // in milliseconds
  pageSize: z.number().int().min(0).optional(), // in bytes
  requestCount: z.number().int().min(0).optional(),
  performanceScore: scoreSchema,
  mobilePerfScore: scoreSchema.optional(),
  optimizationOpportunities: z.record(z.any()), // JSON field
  lighthouseData: z.record(z.any()).optional(), // JSON field
}).refine(
  (data) => {
    // Performance score should be reasonable for load time
    if (data.loadTime !== undefined) {
      // Very fast sites (< 1s) should have high scores
      if (data.loadTime < 1000 && data.performanceScore < 80) {
        return false;
      }
      // Very slow sites (> 10s) should have low scores
      if (data.loadTime > 10000 && data.performanceScore > 50) {
        return false;
      }
    }
    return true;
  },
  'Performance score should be consistent with load time'
);

// ============ META TAGS SCHEMAS ============

export const metaTagsCreateSchema = z.object({
  analysisId: uuidSchema,
  title: sanitizedStringSchema(1, 200).optional(),
  description: sanitizedStringSchema(1, 500).optional(),
  keywords: sanitizedStringSchema(1, 200).optional(),
  titleLength: nonNegativeIntSchema.optional(),
  descriptionLength: nonNegativeIntSchema.optional(),
  canonicalUrl: urlSchema.optional(),
  robots: sanitizedStringSchema(1, 100).optional(),
  openGraph: z.record(z.any()).optional(),
  twitterCard: z.record(z.any()).optional(),
  structuredData: z.record(z.any()).optional(),
  socialOptimization: z.record(z.any()).optional(),
});

// ============ CACHE SCHEMAS ============

export const cacheEntryCreateSchema = z.object({
  key: sanitizedStringSchema(1, 255),
  url: urlSchema,
  urlHash: sanitizedStringSchema(1, 255), // MD5 hash of URL for faster lookups
  data: z.record(z.any()), // JSON field - Cache data
  analysisData: z.record(z.any()), // JSON field - Cached analysis results (for backward compatibility)
  expiresAt: z.date(),
  tags: z.array(sanitizedStringSchema(1, 50)).max(20, 'Maximum 20 tags').default([]),
  size: nonNegativeIntSchema.default(0),
});

export const cacheFilterSchema = z.object({
  tags: z.array(z.string()).max(10, 'Maximum 10 tags').optional(),
  expired: z.boolean().optional(),
  sizeRange: z.object({
    min: nonNegativeIntSchema.optional(),
    max: nonNegativeIntSchema.optional(),
  }).optional(),
});

// ============ BULK OPERATION SCHEMAS ============

export const bulkIssueUpdateSchema = z.object({
  issueIds: z.array(uuidSchema).min(1, 'At least one issue ID is required').max(100, 'Maximum 100 issues can be updated at once'),
  updates: z.object({
    status: statusSchema.optional(),
    businessImpact: businessImpactSchema.optional(),
    notes: sanitizedStringSchema(1, 500).optional(),
  }),
});

export const bulkRecommendationUpdateSchema = z.object({
  recommendationIds: z.array(uuidSchema).min(1, 'At least one recommendation ID is required').max(100, 'Maximum 100 recommendations can be updated at once'),
  updates: z.object({
    status: z.enum(['pending', 'in_progress', 'completed', 'dismissed']).optional(),
    priority: prioritySchema.optional(),
    notes: sanitizedStringSchema(1, 500).optional(),
  }),
});

// ============ EXPORT SCHEMAS COLLECTION ============

export const schemas = {
  user: {
    create: userCreateSchema,
    update: userUpdateSchema,
    settings: userSettingsSchema,
  },
  project: {
    create: projectCreateSchema,
    update: projectUpdateSchema,
    filter: projectFilterSchema,
  },
  crawlSession: {
    create: crawlSessionCreateSchema,
    update: crawlSessionUpdateSchema,
  },
  seoAnalysis: {
    create: seoAnalysisCreateSchema,
    update: seoAnalysisUpdateSchema,
    filter: seoAnalysisFilterSchema,
    bulkCreate: seoAnalysisBulkCreateSchema,
  },
  seoIssue: {
    create: seoIssueCreateSchema,
    update: seoIssueUpdateSchema,
    filter: seoIssueFilterSchema,
    advancedFilter: seoIssueAdvancedFilterSchema,
    bulkUpdate: bulkIssueUpdateSchema,
  },
  seoRecommendation: {
    create: seoRecommendationCreateSchema,
    update: seoRecommendationUpdateSchema,
    filter: seoRecommendationFilterSchema,
    bulkUpdate: bulkRecommendationUpdateSchema,
  },
  contentAnalysis: {
    create: contentAnalysisCreateSchema,
  },
  performanceMetrics: {
    create: performanceMetricsCreateSchema,
  },
  metaTags: {
    create: metaTagsCreateSchema,
  },
  analysisCache: {
    create: cacheEntryCreateSchema,
    filter: cacheFilterSchema,
  },
  cache: {
    create: cacheEntryCreateSchema,
    filter: cacheFilterSchema,
  },
  
  // Utility schemas
  uuid: uuidSchema,
  email: emailSchema,
  url: urlSchema,
  score: scoreSchema,
  severity: severitySchema,
  priority: prioritySchema,
  category: categorySchema,
  businessImpact: businessImpactSchema,
  status: statusSchema,
};

// ============ TYPE EXPORTS ============

export type UserCreate = z.infer<typeof userCreateSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type UserSettings = z.infer<typeof userSettingsSchema>;

export type ProjectCreate = z.infer<typeof projectCreateSchema>;
export type ProjectUpdate = z.infer<typeof projectUpdateSchema>;
export type ProjectFilter = z.infer<typeof projectFilterSchema>;

export type SEOAnalysisCreate = z.infer<typeof seoAnalysisCreateSchema>;
export type SEOAnalysisUpdate = z.infer<typeof seoAnalysisUpdateSchema>;
export type SEOAnalysisFilter = z.infer<typeof seoAnalysisFilterSchema>;
export type SEOAnalysisBulkCreate = z.infer<typeof seoAnalysisBulkCreateSchema>;

export type SEOIssueCreate = z.infer<typeof seoIssueCreateSchema>;
export type SEOIssueUpdate = z.infer<typeof seoIssueUpdateSchema>;
export type SEOIssueFilter = z.infer<typeof seoIssueFilterSchema>;
export type SEOIssueAdvancedFilter = z.infer<typeof seoIssueAdvancedFilterSchema>;

export type SEORecommendationCreate = z.infer<typeof seoRecommendationCreateSchema>;
export type SEORecommendationUpdate = z.infer<typeof seoRecommendationUpdateSchema>;
export type SEORecommendationFilter = z.infer<typeof seoRecommendationFilterSchema>;

export type ContentAnalysisCreate = z.infer<typeof contentAnalysisCreateSchema>;
export type PerformanceMetricsCreate = z.infer<typeof performanceMetricsCreateSchema>;

// ============ VALIDATION UTILITIES ============

/**
 * Validates and sanitizes input data for database operations
 */
export const validateAndSanitize = {
  user: {
    create: (data: unknown) => schemas.user.create.parse(data),
    update: (data: unknown) => schemas.user.update.parse(data),
  },
  project: {
    create: (data: unknown) => schemas.project.create.parse(data),
    update: (data: unknown) => schemas.project.update.parse(data),
    filter: (data: unknown) => schemas.project.filter.parse(data),
  },
  seoAnalysis: {
    create: (data: unknown) => schemas.seoAnalysis.create.parse(data),
    update: (data: unknown) => schemas.seoAnalysis.update.parse(data),
    filter: (data: unknown) => schemas.seoAnalysis.filter.parse(data),
    bulkCreate: (data: unknown) => schemas.seoAnalysis.bulkCreate.parse(data),
  },
  seoIssue: {
    create: (data: unknown) => schemas.seoIssue.create.parse(data),
    update: (data: unknown) => schemas.seoIssue.update.parse(data),
    filter: (data: unknown) => schemas.seoIssue.filter.parse(data),
    advancedFilter: (data: unknown) => schemas.seoIssue.advancedFilter.parse(data),
  },
  seoRecommendation: {
    create: (data: unknown) => schemas.seoRecommendation.create.parse(data),
    update: (data: unknown) => schemas.seoRecommendation.update.parse(data),
    filter: (data: unknown) => schemas.seoRecommendation.filter.parse(data),
  },
};

/**
 * Business logic validation helpers
 */
export const businessValidation = {
  /**
   * Validates that critical issues have appropriate business impact
   */
  validateCriticalIssue: (severity: string, businessImpact: string): boolean => {
    if (severity === 'critical') {
      return ['high', 'medium'].includes(businessImpact);
    }
    return true;
  },

  /**
   * Validates score consistency across categories
   */
  validateScoreConsistency: (
    overallScore: number,
    categoryScores: number[]
  ): boolean => {
    if (categoryScores.length === 0) return true;
    const avgScore = categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length;
    return Math.abs(overallScore - avgScore) <= 15; // Allow 15 point variance
  },

  /**
   * Validates that quick wins have appropriate effort level
   */
  validateQuickWin: (isQuickWin: boolean, effortLevel: string): boolean => {
    if (isQuickWin) {
      return ['easy', 'medium'].includes(effortLevel);
    }
    return true;
  },

  /**
   * Validates reading time consistency with word count
   */
  validateReadingTime: (wordCount: number, readingTime: number): boolean => {
    const expectedTime = Math.ceil(wordCount / 200); // 200 words per minute
    const variance = Math.abs(readingTime - expectedTime);
    return variance <= Math.max(2, expectedTime * 0.5);
  },
}; 