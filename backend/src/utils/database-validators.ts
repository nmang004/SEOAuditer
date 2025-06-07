import { z } from 'zod';
import { logger } from './logger';

// ============ URL VALIDATION ============

export const validateURL = (url: string): { isValid: boolean; normalizedUrl?: string; errors: string[] } => {
  const errors: string[] = [];

  try {
    // Basic URL format validation
    const urlObject = new URL(url);
    
    // Protocol validation
    if (!['http:', 'https:'].includes(urlObject.protocol)) {
      errors.push('URL must use HTTP or HTTPS protocol');
    }

    // Domain validation
    if (!urlObject.hostname || urlObject.hostname.length < 3) {
      errors.push('URL must have a valid domain');
    }

    // Check for localhost/IP addresses in production
    if (process.env.NODE_ENV === 'production') {
      const isLocal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)$/i.test(urlObject.hostname);
      const isPrivateIP = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(urlObject.hostname);
      
      if (isLocal || isPrivateIP) {
        errors.push('Local and private IP addresses are not allowed in production');
      }
    }

    // Normalize URL (remove unnecessary parts)
    const normalizedUrl = `${urlObject.protocol}//${urlObject.hostname}${urlObject.pathname !== '/' ? urlObject.pathname : ''}`;

    return {
      isValid: errors.length === 0,
      normalizedUrl: errors.length === 0 ? normalizedUrl : undefined,
      errors
    };
  } catch (error) {
    return {
      isValid: false,
      errors: ['Invalid URL format']
    };
  }
};

// ============ SEO SCORE VALIDATION ============

export const validateSEOScores = (scores: {
  overall?: number;
  technical?: number;
  content?: number;
  onpage?: number;
  ux?: number;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  const scoreNames = ['overall', 'technical', 'content', 'onpage', 'ux'] as const;

  for (const scoreName of scoreNames) {
    const score = scores[scoreName];
    if (score !== undefined) {
      if (!Number.isInteger(score)) {
        errors.push(`${scoreName} score must be an integer`);
      } else if (score < 0 || score > 100) {
        errors.push(`${scoreName} score must be between 0 and 100`);
      }
    }
  }

  // Validate score relationships (overall should not exceed individual scores significantly)
  if (scores.overall !== undefined && scores.technical !== undefined && 
      scores.content !== undefined && scores.onpage !== undefined && scores.ux !== undefined) {
    
    const avgIndividual = (scores.technical + scores.content + scores.onpage + scores.ux) / 4;
    const deviation = Math.abs(scores.overall - avgIndividual);
    
    if (deviation > 20) {
      logger.warn('Overall score deviates significantly from individual scores', {
        overall: scores.overall,
        average: avgIndividual,
        deviation
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// ============ ANALYSIS DATA VALIDATION ============

export const validateAnalysisData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate required fields
  if (!data.projectId || typeof data.projectId !== 'string') {
    errors.push('Project ID is required and must be a string');
  }

  if (!data.crawlSessionId || typeof data.crawlSessionId !== 'string') {
    errors.push('Crawl session ID is required and must be a string');
  }

  // Validate scores
  const scoreValidation = validateSEOScores(data);
  if (!scoreValidation.isValid) {
    errors.push(...scoreValidation.errors);
  }

  // Validate timestamps
  if (data.createdAt && !(data.createdAt instanceof Date) && isNaN(Date.parse(data.createdAt))) {
    errors.push('Created date must be a valid date');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// ============ ISSUE DATA VALIDATION ============

export const validateIssueData = (issue: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields
  if (!issue.analysisId || typeof issue.analysisId !== 'string') {
    errors.push('Analysis ID is required');
  }

  if (!issue.type || typeof issue.type !== 'string') {
    errors.push('Issue type is required');
  }

  if (!issue.severity || !['critical', 'high', 'medium', 'low'].includes(issue.severity)) {
    errors.push('Issue severity must be one of: critical, high, medium, low');
  }

  if (!issue.title || typeof issue.title !== 'string' || issue.title.trim().length === 0) {
    errors.push('Issue title is required');
  }

  if (!issue.category || !['technical', 'content', 'onpage', 'ux', 'performance', 'accessibility', 'mobile', 'security', 'structured-data'].includes(issue.category)) {
    errors.push('Issue category must be valid');
  }

  // Optional fields validation
  if (issue.affectedPages !== undefined && (!Number.isInteger(issue.affectedPages) || issue.affectedPages < 1)) {
    errors.push('Affected pages must be a positive integer');
  }

  if (issue.businessImpact && !['high', 'medium', 'low'].includes(issue.businessImpact)) {
    errors.push('Business impact must be one of: high, medium, low');
  }

  if (issue.fixComplexity && !['easy', 'medium', 'hard'].includes(issue.fixComplexity)) {
    errors.push('Fix complexity must be one of: easy, medium, hard');
  }

  // Validate arrays
  if (issue.implementationSteps && !Array.isArray(issue.implementationSteps)) {
    errors.push('Implementation steps must be an array');
  }

  if (issue.validationCriteria && !Array.isArray(issue.validationCriteria)) {
    errors.push('Validation criteria must be an array');
  }

  if (issue.affectedCategories && !Array.isArray(issue.affectedCategories)) {
    errors.push('Affected categories must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// ============ PROJECT DATA VALIDATION ============

export const validateProjectData = (project: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields
  if (!project.userId || typeof project.userId !== 'string') {
    errors.push('User ID is required');
  }

  if (!project.name || typeof project.name !== 'string' || project.name.trim().length === 0) {
    errors.push('Project name is required');
  }

  if (project.name && project.name.length > 100) {
    errors.push('Project name must be 100 characters or less');
  }

  // URL validation
  if (!project.url) {
    errors.push('Project URL is required');
  } else {
    const urlValidation = validateURL(project.url);
    if (!urlValidation.isValid) {
      errors.push(...urlValidation.errors);
    }
  }

  // Optional fields validation
  if (project.status && !['active', 'paused', 'archived'].includes(project.status)) {
    errors.push('Project status must be one of: active, paused, archived');
  }

  if (project.scanFrequency && !['manual', 'daily', 'weekly', 'monthly'].includes(project.scanFrequency)) {
    errors.push('Scan frequency must be one of: manual, daily, weekly, monthly');
  }

  if (project.currentScore !== undefined) {
    const scoreValidation = validateSEOScores({ overall: project.currentScore });
    if (!scoreValidation.isValid) {
      errors.push(...scoreValidation.errors);
    }
  }

  if (project.issueCount !== undefined && (!Number.isInteger(project.issueCount) || project.issueCount < 0)) {
    errors.push('Issue count must be a non-negative integer');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// ============ RECOMMENDATION DATA VALIDATION ============

export const validateRecommendationData = (recommendation: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields
  if (!recommendation.analysisId || typeof recommendation.analysisId !== 'string') {
    errors.push('Analysis ID is required');
  }

  if (!recommendation.priority || !['immediate', 'high', 'medium', 'low'].includes(recommendation.priority)) {
    errors.push('Priority must be one of: immediate, high, medium, low');
  }

  if (!recommendation.category || !['technical', 'content', 'onpage', 'ux'].includes(recommendation.category)) {
    errors.push('Category must be one of: technical, content, onpage, ux');
  }

  if (!recommendation.title || typeof recommendation.title !== 'string' || recommendation.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (!recommendation.description || typeof recommendation.description !== 'string' || recommendation.description.trim().length === 0) {
    errors.push('Description is required');
  }

  // Optional fields validation
  if (recommendation.businessValue && !['high', 'medium', 'low'].includes(recommendation.businessValue)) {
    errors.push('Business value must be one of: high, medium, low');
  }

  if (recommendation.effortLevel && !['easy', 'medium', 'hard'].includes(recommendation.effortLevel)) {
    errors.push('Effort level must be one of: easy, medium, hard');
  }

  if (recommendation.status && !['pending', 'in_progress', 'completed', 'dismissed'].includes(recommendation.status)) {
    errors.push('Status must be one of: pending, in_progress, completed, dismissed');
  }

  // Validate arrays and objects
  if (recommendation.implementationSteps && !Array.isArray(recommendation.implementationSteps)) {
    errors.push('Implementation steps must be an array');
  }

  if (recommendation.tools && !Array.isArray(recommendation.tools)) {
    errors.push('Tools must be an array');
  }

  if (recommendation.resources && !Array.isArray(recommendation.resources)) {
    errors.push('Resources must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// ============ CONTENT ANALYSIS VALIDATION ============

export const validateContentAnalysisData = (content: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields
  if (!content.analysisId || typeof content.analysisId !== 'string') {
    errors.push('Analysis ID is required');
  }

  if (content.wordCount !== undefined && (!Number.isInteger(content.wordCount) || content.wordCount < 0)) {
    errors.push('Word count must be a non-negative integer');
  }

  if (content.readingTime !== undefined && (!Number.isInteger(content.readingTime) || content.readingTime < 0)) {
    errors.push('Reading time must be a non-negative integer');
  }

  if (content.paragraphCount !== undefined && (!Number.isInteger(content.paragraphCount) || content.paragraphCount < 0)) {
    errors.push('Paragraph count must be a non-negative integer');
  }

  if (content.sentenceCount !== undefined && (!Number.isInteger(content.sentenceCount) || content.sentenceCount < 0)) {
    errors.push('Sentence count must be a non-negative integer');
  }

  if (content.averageSentenceLength !== undefined && (typeof content.averageSentenceLength !== 'number' || content.averageSentenceLength < 0)) {
    errors.push('Average sentence length must be a non-negative number');
  }

  if (content.topicCoverage !== undefined && (typeof content.topicCoverage !== 'number' || content.topicCoverage < 0 || content.topicCoverage > 100)) {
    errors.push('Topic coverage must be a number between 0 and 100');
  }

  if (content.overallScore !== undefined) {
    const scoreValidation = validateSEOScores({ overall: content.overallScore });
    if (!scoreValidation.isValid) {
      errors.push(...scoreValidation.errors);
    }
  }

  // Validate arrays
  if (content.recommendations && !Array.isArray(content.recommendations)) {
    errors.push('Recommendations must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// ============ PERFORMANCE METRICS VALIDATION ============

export const validatePerformanceMetricsData = (metrics: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields
  if (!metrics.analysisId || typeof metrics.analysisId !== 'string') {
    errors.push('Analysis ID is required');
  }

  if (metrics.performanceScore !== undefined) {
    const scoreValidation = validateSEOScores({ overall: metrics.performanceScore });
    if (!scoreValidation.isValid) {
      errors.push(...scoreValidation.errors);
    }
  }

  if (metrics.mobilePerfScore !== undefined) {
    const scoreValidation = validateSEOScores({ overall: metrics.mobilePerfScore });
    if (!scoreValidation.isValid) {
      errors.push(...scoreValidation.errors);
    }
  }

  // Validate numeric fields
  if (metrics.loadTime !== undefined && (!Number.isInteger(metrics.loadTime) || metrics.loadTime < 0)) {
    errors.push('Load time must be a non-negative integer (milliseconds)');
  }

  if (metrics.pageSize !== undefined && (!Number.isInteger(metrics.pageSize) || metrics.pageSize < 0)) {
    errors.push('Page size must be a non-negative integer (bytes)');
  }

  if (metrics.requestCount !== undefined && (!Number.isInteger(metrics.requestCount) || metrics.requestCount < 0)) {
    errors.push('Request count must be a non-negative integer');
  }

  // Validate Core Web Vitals
  if (metrics.coreWebVitals) {
    const cwv = metrics.coreWebVitals;
    
    if (cwv.lcp !== undefined && (typeof cwv.lcp !== 'number' || cwv.lcp < 0)) {
      errors.push('LCP must be a non-negative number');
    }
    
    if (cwv.fid !== undefined && (typeof cwv.fid !== 'number' || cwv.fid < 0)) {
      errors.push('FID must be a non-negative number');
    }
    
    if (cwv.cls !== undefined && (typeof cwv.cls !== 'number' || cwv.cls < 0)) {
      errors.push('CLS must be a non-negative number');
    }
    
    if (cwv.fcp !== undefined && (typeof cwv.fcp !== 'number' || cwv.fcp < 0)) {
      errors.push('FCP must be a non-negative number');
    }
    
    if (cwv.ttfb !== undefined && (typeof cwv.ttfb !== 'number' || cwv.ttfb < 0)) {
      errors.push('TTFB must be a non-negative number');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// ============ BATCH VALIDATION ============

export const validateBatchData = <T>(
  items: T[],
  validator: (item: T) => { isValid: boolean; errors: string[] },
  itemName: string = 'item'
): { isValid: boolean; errors: string[]; validItems: T[]; invalidItems: Array<{ item: T; errors: string[] }> } => {
  const errors: string[] = [];
  const validItems: T[] = [];
  const invalidItems: Array<{ item: T; errors: string[] }> = [];

  if (!Array.isArray(items)) {
    return {
      isValid: false,
      errors: [`Expected array of ${itemName}s`],
      validItems: [],
      invalidItems: []
    };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const validation = validator(item);
    
    if (validation.isValid) {
      validItems.push(item);
    } else {
      invalidItems.push({
        item,
        errors: validation.errors
      });
      errors.push(`${itemName} ${i + 1}: ${validation.errors.join(', ')}`);
    }
  }

  return {
    isValid: invalidItems.length === 0,
    errors,
    validItems,
    invalidItems
  };
};

// ============ QUERY VALIDATION ============

export const validateQueryParams = (params: any, schema: z.ZodSchema): { isValid: boolean; data?: any; errors: string[] } => {
  try {
    const validatedData = schema.parse(params);
    return {
      isValid: true,
      data: validatedData,
      errors: []
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    
    return {
      isValid: false,
      errors: ['Unknown validation error']
    };
  }
};

// ============ SANITIZATION HELPERS ============

export const sanitizeStringForDatabase = (str: string): string => {
  if (typeof str !== 'string') {
    return '';
  }

  return str
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
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
    .substring(0, 10000); // Limit length to prevent DoS
};

export const sanitizeObjectForDatabase = (obj: any, maxDepth: number = 5): any => {
  if (maxDepth <= 0) {
    return null;
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeStringForDatabase(obj);
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.slice(0, 1000).map(item => sanitizeObjectForDatabase(item, maxDepth - 1));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    const keys = Object.keys(obj).slice(0, 100); // Limit object size

    for (const key of keys) {
      const sanitizedKey = sanitizeStringForDatabase(key);
      if (sanitizedKey) {
        sanitized[sanitizedKey] = sanitizeObjectForDatabase(obj[key], maxDepth - 1);
      }
    }

    return sanitized;
  }

  return null;
};

// ============ EXPORT VALIDATION REGISTRY ============

export const validationRegistry = {
  url: validateURL,
  seoScores: validateSEOScores,
  analysisData: validateAnalysisData,
  issueData: validateIssueData,
  projectData: validateProjectData,
  recommendationData: validateRecommendationData,
  contentAnalysisData: validateContentAnalysisData,
  performanceMetricsData: validatePerformanceMetricsData,
  batchData: validateBatchData,
  queryParams: validateQueryParams,
  sanitizeString: sanitizeStringForDatabase,
  sanitizeObject: sanitizeObjectForDatabase
}; 