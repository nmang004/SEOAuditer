import { DashboardStats, RecentProject, PriorityIssue } from '@/hooks/useDashboardData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

class APIError extends Error {
  constructor(
    message: string, 
    public status: number, 
    public endpoint: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.error || data.message || 'Request failed',
        response.status,
        endpoint
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    // Network or other errors
    console.error(`API request failed for ${endpoint}:`, error);
    throw new APIError(
      'Network error or server unavailable',
      0,
      endpoint
    );
  }
}

export interface DashboardStatsResponse {
  success: boolean;
  data: DashboardStats;
  cached?: boolean;
  lastUpdated?: string;
}

export interface RecentProjectsResponse {
  success: boolean;
  data: RecentProject[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PriorityIssuesResponse {
  success: boolean;
  data: PriorityIssue[];
  total: number;
  critical: number;
  high: number;
}

export interface ProjectAnalysisHistory {
  id: string;
  projectId: string;
  projectName: string;
  overallScore: number;
  technicalScore: number;
  contentScore: number;
  onPageScore: number;
  uxScore: number;
  completedAt: string;
  issueCount: number;
  criticalIssues: number;
  changeFromPrevious: number;
}

export interface AnalysisHistoryResponse {
  success: boolean;
  data: ProjectAnalysisHistory[];
  total: number;
  page: number;
  pageSize: number;
}

// Dashboard Statistics API
export const dashboardAPI = {
  // Get comprehensive dashboard statistics
  async getStats(): Promise<DashboardStats> {
    const response = await apiRequest<DashboardStatsResponse>('/dashboard/stats');
    return response.data;
  },

  // Get recent projects with analysis data
  async getRecentProjects(limit: number = 5): Promise<RecentProject[]> {
    const response = await apiRequest<RecentProjectsResponse>(
      `/dashboard/recent-projects?limit=${limit}`
    );
    return response.data;
  },

  // Get priority issues across all projects
  async getPriorityIssues(limit: number = 10): Promise<PriorityIssue[]> {
    const response = await apiRequest<PriorityIssuesResponse>(
      `/dashboard/priority-issues?limit=${limit}`
    );
    return response.data;
  },

  // Get analysis history with pagination
  async getAnalysisHistory(page: number = 1, pageSize: number = 20): Promise<AnalysisHistoryResponse> {
    return await apiRequest<AnalysisHistoryResponse>(
      `/dashboard/analysis-history?page=${page}&pageSize=${pageSize}`
    );
  },

  // Get performance trends data
  async getPerformanceTrends(days: number = 30): Promise<{
    success: boolean;
    data: Array<{
      date: string;
      overallScore: number;
      technicalScore: number;
      contentScore: number;
      onPageScore: number;
      uxScore: number;
      projectCount: number;
    }>;
  }> {
    return await apiRequest(`/dashboard/performance-trends?days=${days}`);
  },

  // Get project distribution data for charts
  async getProjectDistribution(): Promise<{
    success: boolean;
    data: {
      scoreRanges: Array<{
        range: string;
        count: number;
        percentage: number;
      }>;
      categories: Array<{
        category: string;
        averageScore: number;
        projectCount: number;
      }>;
    };
  }> {
    return await apiRequest('/dashboard/project-distribution');
  },

  // Get issue trends for charts
  async getIssueTrends(days: number = 30): Promise<{
    success: boolean;
    data: Array<{
      date: string;
      newIssues: number;
      resolvedIssues: number;
      criticalIssues: number;
      totalIssues: number;
    }>;
  }> {
    return await apiRequest(`/dashboard/issue-trends?days=${days}`);
  },

  // Invalidate all dashboard caches
  async invalidateCache(): Promise<{ success: boolean; message: string }> {
    return await apiRequest('/dashboard/invalidate-cache', {
      method: 'POST',
    });
  },
};

// Export error class for handling
export { APIError }; 