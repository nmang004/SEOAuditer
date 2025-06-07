/**
 * Project type definition
 */
export interface Project {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  lastAnalyzed?: string;
  score?: number;
}

/**
 * Analysis type definition
 */
export interface Analysis {
  id: string;
  projectId: string;
  url: string;
  createdAt: string;
  score: number;
  categoryScores: {
    [key: string]: number;
  };
  issues: Issue[];
  recommendations: Recommendation[];
}

/**
 * SEO Issue type definition
 */
export interface Issue {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  impact: string;
}

/**
 * SEO Recommendation type definition
 */
export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  difficulty: "easy" | "medium" | "hard";
  impact: "high" | "medium" | "low";
}

/**
 * User type definition
 */
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

/**
 * Navigation item type definition
 */
export interface NavigationItem {
  title: string;
  href: string;
  icon: string;
  children?: NavigationItem[];
}

/**
 * SEO Score Category type definition
 */
export interface ScoreCategory {
  name: string;
  weight: number;
  score?: number;
}

/**
 * Chart data type definition
 */
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

/**
 * SEO Score Display Props
 */
export interface SEOScoreProps {
  score: number;           // 0-100
  previousScore?: number;  // For trend calculation
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showDetails?: boolean;
  animated?: boolean;
  breakdown?: {
    technical: number;
    content: number;
    onPage: number;
    userExperience: number;
  };
}

/**
 * Project Card Props
 */
export interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    url: string;
    favicon?: string;
    lastScanDate: Date;
    currentScore: number;
    issueCount: number;
    trend: 'up' | 'down' | 'neutral';
    trendPercentage: number;
  };
  variant?: 'compact' | 'detailed' | 'list';
  showActions?: boolean;
}

/**
 * Issue type definition with enhanced fields
 */
export interface EnhancedIssue {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedPages: number;
  estimatedImpact: string;
  fixComplexity: 'easy' | 'medium' | 'hard';
  category: 'technical' | 'content' | 'onpage' | 'ux';
}

/**
 * Issue List Props
 */
export interface IssueListProps {
  issues: EnhancedIssue[];
  maxItems?: number;
  groupBy?: 'severity' | 'category' | 'project';
  showFilters?: boolean;
  allowDismiss?: boolean;
}

/**
 * Dashboard Stats
 */
export interface DashboardStats {
  totalProjects: number;
  activeAnalyses: number;
  averageScore: number;
  weeklyIssues: number;
}
