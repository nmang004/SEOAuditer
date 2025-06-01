"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Create a client with optimized settings for dashboard
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default cache time for dashboard data
        staleTime: 30 * 1000, // 30 seconds - data is fresh for this long
        gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
        
        // Retry configuration for better UX
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          // Retry up to 2 times for other errors
          return failureCount < 2;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Background refetching for real-time feel
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        refetchOnReconnect: true,
        
        // Network mode handling
        networkMode: 'online',
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
        networkMode: 'online',
      },
    },
  });
};

let clientSingleton: QueryClient | undefined = undefined;

const getQueryClient = () => {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return createQueryClient();
  }
  
  // Browser: make a new query client if we don't already have one
  // This is important so we don't re-make a new client if React
  // suspends during the initial render
  if (!clientSingleton) {
    clientSingleton = createQueryClient();
  }
  return clientSingleton;
};

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-left"
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  );
}

// Helper hook for cache invalidation patterns
export function useQueryCache() {
  const queryClient = getQueryClient();
  
  const invalidateAll = () => {
    queryClient.invalidateQueries();
  };
  
  const invalidateDashboard = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
  
  const invalidateProjects = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'projects'] });
  };
  
  const invalidateIssues = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'issues'] });
  };
  
  const invalidateTrends = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'trends'] });
  };
  
  const prefetchDashboardData = async () => {
    // Prefetch critical dashboard data
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['dashboard', 'stats'],
        staleTime: 30 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: ['dashboard', 'projects', 'recent', 5],
        staleTime: 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: ['dashboard', 'issues', 'priority', 10],
        staleTime: 30 * 1000,
      }),
    ]);
  };
  
  const getCache = () => queryClient.getQueryCache();
  
  const getCacheStats = () => {
    const cache = getCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      freshQueries: queries.filter(q => q.state.status === 'success' && !q.isStale()).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      loadingQueries: queries.filter(q => q.state.status === 'pending').length,
      cacheSize: queries.reduce((size, query) => {
        return size + (JSON.stringify(query.state.data).length || 0);
      }, 0),
    };
  };
  
  return {
    queryClient,
    invalidateAll,
    invalidateDashboard,
    invalidateProjects,
    invalidateIssues,
    invalidateTrends,
    prefetchDashboardData,
    getCache,
    getCacheStats,
  };
} 