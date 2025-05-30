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

export const useDashboardData = (options: UseDashboardDataOptions = {}) => {
  const { refreshInterval = 30000, enableRealtime = true } = options;
  
  const [data, setData] = useState<DashboardData>({
    stats: {
      totalProjects: 0,
      activeAnalyses: 0,
      completedAnalyses: 0,
      averageScore: 0,
      scoreImprovement: 0,
      weeklyIssues: 0,
      resolvedIssues: 0,
      criticalIssues: 0,
      lastScanDate: new Date().toISOString(),
      scoreDistribution: { excellent: 0, good: 0, needsWork: 0, poor: 0 },
      scoreTrends: [],
      topProjects: [],
      concerningProjects: []
    },
    recentProjects: [],
    priorityIssues: [],
    loading: true,
    error: null,
    cached: false,
    lastUpdated: null
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Fetch dashboard stats
      const [statsResponse, projectsResponse, issuesResponse] = await Promise.all([
        fetch('/api/dashboard/stats', { headers }),
        fetch('/api/dashboard/recent-projects', { headers }),
        fetch('/api/dashboard/priority-issues', { headers })
      ]);

      if (!statsResponse.ok) {
        throw new Error(`Stats API failed: ${statsResponse.status}`);
      }

      const [statsResult, projectsResult, issuesResult] = await Promise.all([
        statsResponse.json(),
        projectsResponse.ok ? projectsResponse.json() : { success: true, data: [] },
        issuesResponse.ok ? issuesResponse.json() : { success: true, data: [] }
      ]);

      if (!statsResult.success) {
        throw new Error(statsResult.error || 'Failed to fetch dashboard stats');
      }

      setData(prev => ({
        ...prev,
        stats: statsResult.data,
        recentProjects: projectsResult.success ? projectsResult.data : [],
        priorityIssues: issuesResult.success ? issuesResult.data : [],
        loading: false,
        cached: statsResult.cached || false,
        lastUpdated: new Date(),
        error: null
      }));

    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard data'
      }));
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh
  useEffect(() => {
    if (!enableRealtime || refreshInterval <= 0) return;

    const interval = setInterval(fetchDashboardData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchDashboardData, refreshInterval, enableRealtime]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Function to invalidate specific data
  const invalidateCache = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/dashboard/invalidate-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Cache invalidation failed:', error);
    }
  }, [fetchDashboardData]);

  // Function to update project status in real-time
  const updateProjectStatus = useCallback((projectId: string, status: 'completed' | 'analyzing' | 'queued' | 'error', progress?: number) => {
    setData(prev => ({
      ...prev,
      recentProjects: prev.recentProjects.map(project =>
        project.id === projectId
          ? { ...project, status, progress }
          : project
      )
    }));
  }, []);

  // Function to add new issue in real-time
  const addPriorityIssue = useCallback((issue: PriorityIssue) => {
    setData(prev => ({
      ...prev,
      priorityIssues: [issue, ...prev.priorityIssues.slice(0, 9)] // Keep only top 10
    }));
  }, []);

  // Function to remove resolved issue
  const removePriorityIssue = useCallback((issueId: string) => {
    setData(prev => ({
      ...prev,
      priorityIssues: prev.priorityIssues.filter(issue => issue.id !== issueId)
    }));
  }, []);

  return {
    ...data,
    refresh,
    invalidateCache,
    updateProjectStatus,
    addPriorityIssue,
    removePriorityIssue,
    isStale: data.lastUpdated ? Date.now() - data.lastUpdated.getTime() > refreshInterval : false
  };
}; 