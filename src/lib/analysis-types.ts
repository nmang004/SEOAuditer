/**
 * SEO Score Breakdown Props
 */
export interface SEOScoreBreakdownProps {
  overallScore: number;
  categories: {
    technical: { score: number; issues: number; improvements: number };
    content: { score: number; issues: number; improvements: number };
    onPage: { score: number; issues: number; improvements: number };
    userExperience: { score: number; issues: number; improvements: number };
  };
  showComparison?: {
    previousScore: number;
    previousCategories: CategoryScores;
    scanDate: Date;
  };
}

/**
 * Category Scores
 */
export interface CategoryScores {
  technical: { score: number; issues: number; improvements: number };
  content: { score: number; issues: number; improvements: number };
  onPage: { score: number; issues: number; improvements: number };
  userExperience: { score: number; issues: number; improvements: number };
}

/**
 * SEO Issue
 */
export interface SEOIssue {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'technical' | 'content' | 'onpage' | 'ux';
  affectedElements: string[];
  recommendation: string;
  estimatedTimeToFix: string;
  impact: 'high' | 'medium' | 'low';
  status: 'new' | 'in-progress' | 'fixed' | 'ignored';
  detectedDate: Date;
}

/**
 * Filter State
 */
export interface FilterState {
  severity: string[];
  category: string[];
  status: string[];
}

/**
 * Issues Dashboard Props
 */
export interface IssuesDashboardProps {
  issues: SEOIssue[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onIssueAction: (issueId: string, action: string) => void;
}

/**
 * Technical Analysis Data
 */
export interface TechnicalAnalysisData {
  pageSpeed: {
    score: number;
    loadTime: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    recommendations: string[];
  };
  mobileFriendliness: {
    score: number;
    hasViewportMeta: boolean;
    usesResponsiveDesign: boolean;
    touchTargetsAppropriate: boolean;
    issues: string[];
  };
  crawlability: {
    robotsTxtValid: boolean;
    hasXMLSitemap: boolean;
    canonicalTagsPresent: boolean;
    noIndexPages: number;
    redirectChains: number;
  };
  security: {
    hasSSL: boolean;
    mixedContent: boolean;
    securityHeaders: string[];
    vulnerabilities: string[];
  };
}

/**
 * Content Analysis Data
 */
export interface ContentAnalysisData {
  metaTags: {
    title: { present: boolean; length: number; optimized: boolean };
    description: { present: boolean; length: number; optimized: boolean };
    keywords: { present: boolean; relevant: boolean };
  };
  headingStructure: {
    h1Count: number;
    hierarchyValid: boolean;
    keywordOptimized: boolean;
    missingLevels: number[];
  };
  contentQuality: {
    wordCount: number;
    readabilityScore: number;
    keywordDensity: number;
    duplicateContent: boolean;
    internalLinks: number;
    externalLinks: number;
  };
  images: {
    total: number;
    withAltText: number;
    oversized: number;
    modernFormats: number;
  };
}

/**
 * Recommendation
 */
export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  estimatedImpact: string;
  timeToImplement: string;
  difficulty: 'easy' | 'medium' | 'hard';
  steps: string[];
  resources: Array<{ title: string; url: string }>;
  relatedIssues: string[];
}

/**
 * Recommendations Panel Props
 */
export interface RecommendationsPanelProps {
  recommendations: Recommendation[];
  maxVisible?: number;
  allowCustomOrder?: boolean;
  showProgress?: boolean;
}

/**
 * Historical Trends Props
 */
export interface HistoricalTrendsProps {
  data: Array<{
    date: Date;
    overallScore: number;
    technicalScore: number;
    contentScore: number;
    onPageScore: number;
    userExperienceScore: number;
    issuesCount: number;
  }>;
  timeRange: '7d' | '30d' | '90d' | '6m' | '1y';
  onTimeRangeChange: (range: string) => void;
}

/**
 * Analysis Data
 */
export interface AnalysisData {
  id: string;
  projectId: string;
  projectName: string;
  url: string;
  scanDate: Date;
  overallScore: number;
  categories: CategoryScores;
  issues: SEOIssue[];
  recommendations: Recommendation[];
  technicalAnalysis: TechnicalAnalysisData;
  contentAnalysis: ContentAnalysisData;
  historicalData: HistoricalTrendsProps['data'];
  previousScan?: {
    scanDate: Date;
    overallScore: number;
    categories: CategoryScores;
  };
}
