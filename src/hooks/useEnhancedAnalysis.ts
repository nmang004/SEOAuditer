'use client';

import { useState, useEffect } from 'react';

interface EnhancedAnalysisData {
  id: string;
  url: string;
  overallScore: number;
  categoryScores: {
    technical: number;
    content: number;
    onPage: number;
    ux: number;
  };
  performance?: {
    coreWebVitals: any;
    performanceScore: number;
    loadTime: number;
    pageSize: number;
    optimizationOpportunities: any[];
  };
  lastAnalyzed: string;
}

interface CoreWebVitalsData {
  url: string;
  timestamp: string;
  deviceType: 'mobile' | 'desktop';
  coreWebVitals: {
    LCP: number;
    FID: number;
    CLS: number;
    FCP: number;
    TTFB: number;
    SI: number;
    TTI: number;
  };
  performanceScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  insights: any;
  recommendations: any[];
}

interface UseEnhancedAnalysisResult {
  data: EnhancedAnalysisData | null;
  coreWebVitals: CoreWebVitalsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useEnhancedAnalysis = (analysisId: string | null): UseEnhancedAnalysisResult => {
  const [data, setData] = useState<EnhancedAnalysisData | null>(null);
  const [coreWebVitals, setCoreWebVitals] = useState<CoreWebVitalsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    if (!analysisId) return;

    setLoading(true);
    setError(null);

    try {
      // Get the auth token from localStorage or your auth context
      const token = localStorage.getItem('authToken'); // Adjust based on your auth implementation
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Fetch detailed analysis
      const analysisResponse = await fetch(`/api/enhanced-analysis/${analysisId}/detailed`, {
        method: 'GET',
        headers,
      });

      if (!analysisResponse.ok) {
        throw new Error(`Analysis fetch failed: ${analysisResponse.status}`);
      }

      const analysisResult = await analysisResponse.json();
      
      if (analysisResult.success) {
        setData(analysisResult.data);

        // If we have performance data, try to get fresh Core Web Vitals
        if (analysisResult.data.performance) {
          try {
            const performanceResponse = await fetch(`/api/enhanced-analysis/${analysisId}/performance`, {
              method: 'GET',
              headers,
            });

            if (performanceResponse.ok) {
              const performanceResult = await performanceResponse.json();
              
              if (performanceResult.success && performanceResult.data?.fresh) {
                setCoreWebVitals(performanceResult.data.fresh);
              }
            }
          } catch (perfError) {
            console.warn('Failed to fetch fresh Core Web Vitals:', perfError);
            // Not a critical error, continue with existing data
          }
        }
      } else {
        throw new Error(analysisResult.error || 'Failed to fetch analysis');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching enhanced analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [analysisId]);

  const refetch = () => {
    fetchAnalysis();
  };

  return {
    data,
    coreWebVitals,
    loading,
    error,
    refetch,
  };
};

// Hook for fetching specific performance metrics
export const usePerformanceMetrics = (analysisId: string | null) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformanceMetrics = async () => {
    if (!analysisId) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/enhanced-analysis/${analysisId}/performance`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Performance metrics fetch failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch performance metrics');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching performance metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceMetrics();
  }, [analysisId]);

  return {
    data,
    loading,
    error,
    refetch: fetchPerformanceMetrics,
  };
};

// Hook for running a new Core Web Vitals analysis
export const useCoreWebVitalsAnalysis = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (url: string, options?: { deviceType?: 'mobile' | 'desktop' }) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch('/api/crawl/start', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          url,
          analysisType: 'enhanced',
          options: {
            includePerformance: true,
            deviceType: options?.deviceType || 'mobile'
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis start failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to start analysis');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error starting Core Web Vitals analysis:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    analyze,
    loading,
    error,
  };
}; 