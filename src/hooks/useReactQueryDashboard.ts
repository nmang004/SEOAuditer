'use client';

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardAPI, APIError } from '@/lib/api/dashboard-api';
import { DashboardStats, RecentProject, PriorityIssue } from '@/hooks/useDashboardData';
import { useToast } from '@/components/ui/use-toast';

// Query Keys for consistent cache management
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  projects: () => [...dashboardKeys.all, 'projects'] as const,
  recentProjects: (limit: number) => [...dashboardKeys.projects(), 'recent', limit] as const,
  issues: () => [...dashboardKeys.all, 'issues'] as const,
  priorityIssues: (limit: number) => [...dashboardKeys.issues(), 'priority', limit] as const,
  trends: () => [...dashboardKeys.all, 'trends'] as const,
  performanceTrends: (days: number) => [...dashboardKeys.trends(), 'performance', days] as const,
  issueTrends: (days: number) => [...dashboardKeys.trends(), 'issues', days] as const,
  distribution: () => [...dashboardKeys.all, 'distribution'] as const,
  analysisHistory: () => [...dashboardKeys.all, 'analysis-history'] as const,
};

// Dashboard Statistics Hook with intelligent caching
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardAPI.getStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Recent Projects Hook with pagination support
export function useRecentProjects(limit: number = 5) {
  return useQuery({
    queryKey: dashboardKeys.recentProjects(limit),
    queryFn: () => dashboardAPI.getRecentProjects(limit),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 1 * 60 * 1000, // Refresh every minute
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

// Priority Issues Hook with real-time updates
export function usePriorityIssues(limit: number = 10) {
  return useQuery({
    queryKey: dashboardKeys.priorityIssues(limit),
    queryFn: () => dashboardAPI.getPriorityIssues(limit),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 1 * 60 * 1000, // Refresh every minute
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

// Performance Trends Hook for charts
export function usePerformanceTrends(days: number = 30) {
  return useQuery({
    queryKey: ['dashboard', 'trends', 'performance', days] as const,
    queryFn: () => dashboardAPI.getPerformanceTrends(days),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: { success: true, data: [] },
  });
}

// Issue Trends Hook for analytics
export function useIssueTrends(days: number = 30) {
  return useQuery({
    queryKey: ['dashboard', 'trends', 'issues', days] as const,
    queryFn: () => dashboardAPI.getIssueTrends(days),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: { success: true, data: [] },
  });
}

// Project Distribution Hook
export function useProjectDistribution() {
  return useQuery({
    queryKey: dashboardKeys.distribution(),
    queryFn: dashboardAPI.getProjectDistribution,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

// Analysis History Hook with Infinite Scroll
export function useAnalysisHistory(pageSize: number = 20) {
  return useInfiniteQuery({
    queryKey: [...dashboardKeys.analysisHistory(), pageSize],
    queryFn: ({ pageParam = 1 }) => 
      dashboardAPI.getAnalysisHistory(pageParam, pageSize),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const hasMore = lastPage.data.length === pageSize;
      return hasMore ? allPages.length + 1 : undefined;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Cache Invalidation Mutation
export function useCacheInvalidation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: dashboardAPI.invalidateCache,
    onSuccess: () => {
      // Invalidate all dashboard queries
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      toast({
        title: 'Cache cleared',
        description: 'Dashboard data has been refreshed',
      });
    },
    onError: (error: APIError) => {
      toast({
        title: 'Failed to clear cache',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Combined Dashboard Data Hook (for backward compatibility)
export function useEnhancedDashboardData() {
  const statsQuery = useDashboardStats();
  const projectsQuery = useRecentProjects(5);
  const issuesQuery = usePriorityIssues(10);
  const trendsQuery = usePerformanceTrends(30);

  const isLoading = statsQuery.isLoading || projectsQuery.isLoading || issuesQuery.isLoading;
  const isError = statsQuery.isError || projectsQuery.isError || issuesQuery.isError;
  const error = statsQuery.error || projectsQuery.error || issuesQuery.error;

  // Calculate freshness
  const lastUpdated = [
    statsQuery.dataUpdatedAt,
    projectsQuery.dataUpdatedAt,
    issuesQuery.dataUpdatedAt,
  ].filter(Boolean).sort((a, b) => b - a)[0];

  const isStale = [
    statsQuery.isStale,
    projectsQuery.isStale,
    issuesQuery.isStale,
  ].some(Boolean);

  return {
    // Data
    stats: statsQuery.data,
    recentProjects: projectsQuery.data,
    priorityIssues: issuesQuery.data,
    performanceTrends: trendsQuery.data,
    
    // Loading states
    isLoading,
    isError,
    error: error?.message || null,
    
    // Freshness indicators
    lastUpdated: lastUpdated ? new Date(lastUpdated) : null,
    isStale,
    
    // Actions
    refetch: () => {
      statsQuery.refetch();
      projectsQuery.refetch();
      issuesQuery.refetch();
      trendsQuery.refetch();
    },
    
    // Individual query states for granular control
    queries: {
      stats: statsQuery,
      projects: projectsQuery,
      issues: issuesQuery,
      trends: trendsQuery,
    },
  };
}

// Data prefetching utility
export function usePrefetchDashboardData() {
  const queryClient = useQueryClient();

  const prefetchAll = () => {
    // Prefetch all dashboard data
    queryClient.prefetchQuery({
      queryKey: dashboardKeys.stats(),
      queryFn: dashboardAPI.getStats,
      staleTime: 30 * 1000,
    });

    queryClient.prefetchQuery({
      queryKey: dashboardKeys.recentProjects(5),
      queryFn: () => dashboardAPI.getRecentProjects(5),
      staleTime: 60 * 1000,
    });

    queryClient.prefetchQuery({
      queryKey: dashboardKeys.priorityIssues(10),
      queryFn: () => dashboardAPI.getPriorityIssues(10),
      staleTime: 30 * 1000,
    });
  };

  return { prefetchAll };
} 