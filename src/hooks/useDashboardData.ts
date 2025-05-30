'use client';

import { useState, useEffect, useCallback } from 'react';

export interface DashboardStats {
  totalProjects: number;
  activeAnalyses: number;
  completedAnalyses: number;
  averageScore: number;
  scoreImprovement: number;
  weeklyIssues: number;
  resolvedIssues: number;
  criticalIssues: number;
  lastScanDate: string;
  
  scoreDistribution: {
    excellent: number;    // 80-100
    good: number;        // 60-79
    needsWork: number;   // 40-59
    poor: number;        // 0-39
  };
  
  scoreTrends: Array<{
    date: string;
    overallScore: number;
    technicalScore: number;
    contentScore: number;
    onPageScore: number;
    uxScore: number;
  }>;
  
  topProjects: Array<{
    id: string;
    name: string;
    score: number;
    improvement: number;
  }>;
  
  concerningProjects: Array<{
    id: string;
    name: string;
    score: number;
    criticalIssues: number;
  }>;
}

export interface RecentProject {
  id: string;
  name: string;
  url: string;
  favicon?: string;
  currentScore: number;
  previousScore?: number;
  lastScanDate: Date;
  status: 'completed' | 'analyzing' | 'queued' | 'error';
  criticalIssues: number;
  progress?: number;
  createdAt: string;
  updatedAt: string;
  trend: 'up' | 'down' | 'stable';
  lastAnalysis?: {
    overallScore: number;
    technicalScore: number;
    contentScore: number;
    onPageScore: number;
    uxScore: number;
  };
}

export interface PriorityIssue {
  id: string;
  projectId: string;
  projectName: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  affectedPages: number;
  estimatedImpact: string;
  quickFix: boolean;
}

export interface DashboardData {
  stats: DashboardStats;
  recentProjects: RecentProject[];
  priorityIssues: PriorityIssue[];
  loading: boolean;
  error: string | null;
  cached: boolean;
  lastUpdated: Date | null;
}

export interface UseDashboardDataOptions {
  refreshInterval?: number; // Auto-refresh interval in milliseconds
  enableRealtime?: boolean; // Enable real-time updates
}

interface UseDashboardDataReturn {
  data: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

// Environment-based API configuration
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use backend API directly
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api';
  }
  // Server-side fallback
  return process.env.BACKEND_URL || 'http://localhost:4000/api';
};

// Mock data for development/fallback
const getMockDashboardData = (): DashboardStats => ({
  totalProjects: 8,
  activeAnalyses: 2,
  completedAnalyses: 34,
  averageScore: 82,
  scoreImprovement: 7,
  weeklyIssues: 15,
  resolvedIssues: 23,
  criticalIssues: 3,
  lastScanDate: new Date().toISOString(),
  scoreDistribution: {
    excellent: 3,
    good: 4,
    needsWork: 1,
    poor: 0
  },
  scoreTrends: [
    { date: '2025-05-26', overallScore: 75, technicalScore: 72, contentScore: 78, onPageScore: 80, uxScore: 70 },
    { date: '2025-05-27', overallScore: 77, technicalScore: 74, contentScore: 79, onPageScore: 81, uxScore: 72 },
    { date: '2025-05-28', overallScore: 79, technicalScore: 76, contentScore: 80, onPageScore: 82, uxScore: 74 },
    { date: '2025-05-29', overallScore: 81, technicalScore: 78, contentScore: 82, onPageScore: 83, uxScore: 76 },
    { date: '2025-05-30', overallScore: 82, technicalScore: 79, contentScore: 83, onPageScore: 84, uxScore: 77 },
  ],
  topProjects: [
    { id: '1', name: 'Main Website', score: 89, improvement: 8 },
    { id: '2', name: 'E-commerce Store', score: 85, improvement: 5 },
    { id: '3', name: 'Blog Platform', score: 82, improvement: 3 }
  ],
  concerningProjects: [
    { id: '4', name: 'Legacy Site', score: 58, criticalIssues: 5 },
    { id: '5', name: 'Mobile App Landing', score: 62, criticalIssues: 3 }
  ]
});

export const useDashboardData = (autoRefreshInterval: number = 30000): UseDashboardDataReturn => {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try backend API first
      const apiUrl = getApiBaseUrl();
      
      try {
        const response = await fetch(`${apiUrl}/dashboard/stats`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setData(result.data);
            setLastUpdated(new Date());
            console.log('✅ Dashboard data loaded from backend API');
            return;
          }
        }
      } catch (apiError) {
        console.warn('⚠️ Backend API unavailable, using mock data:', apiError);
      }

      // Fallback to mock data
      const mockData = getMockDashboardData();
      setData(mockData);
      setLastUpdated(new Date());
      console.log('✅ Dashboard data loaded from mock data (fallback)');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(errorMessage);
      console.error('❌ Dashboard data fetch error:', err);
      
      // Even on error, provide mock data
      setData(getMockDashboardData());
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    fetchDashboardData();

    if (autoRefreshInterval > 0) {
      const interval = setInterval(fetchDashboardData, autoRefreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchDashboardData, autoRefreshInterval]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchDashboardData,
    lastUpdated
  };
};

// Hook for recent projects
export const useRecentProjects = (limit: number = 5) => {
  const [data, setData] = useState<RecentProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRecentProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/dashboard/recent-projects?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Transform backend data to match RecentProject interface
          const transformedData: RecentProject[] = result.data.map((project: any) => ({
            id: project.id,
            name: project.name,
            url: project.url,
            favicon: `https://www.google.com/s2/favicons?domain=${new URL(project.url).hostname}`,
            currentScore: project.currentScore || project.lastAnalysis?.overallScore || 0,
            previousScore: project.lastAnalysis?.previousScore || 0,
            lastScanDate: new Date(project.updatedAt || project.createdAt),
            status: 'completed' as const, // Will be updated based on actual status
            criticalIssues: project.lastAnalysis?.criticalIssues || 0,
            progress: undefined,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            trend: project.trend,
            lastAnalysis: project.lastAnalysis
          }));
          
          setData(transformedData);
          setLastUpdated(new Date());
          console.log('✅ Recent projects loaded from backend API');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recent projects';
      setError(errorMessage);
      console.error('❌ Recent projects fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchRecentProjects();
  }, [fetchRecentProjects]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchRecentProjects,
    lastUpdated
  };
};

// Hook for priority issues
export const usePriorityIssues = (limit: number = 10) => {
  const [data, setData] = useState<PriorityIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPriorityIssues = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/dashboard/latest-issues?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Transform backend data to match PriorityIssue interface
          const transformedData: PriorityIssue[] = result.data.map((issue: any) => ({
            id: issue.id,
            projectId: issue.projectId,
            projectName: issue.projectName,
            type: issue.type,
            severity: issue.severity,
            title: issue.title,
            affectedPages: issue.affectedPages,
            estimatedImpact: issue.estimatedImpact,
            quickFix: issue.quickFix || false
          }));
          
          setData(transformedData);
          setLastUpdated(new Date());
          console.log('✅ Priority issues loaded from backend API');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch priority issues';
      setError(errorMessage);
      console.error('❌ Priority issues fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchPriorityIssues();
  }, [fetchPriorityIssues]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchPriorityIssues,
    lastUpdated
  };
}; 