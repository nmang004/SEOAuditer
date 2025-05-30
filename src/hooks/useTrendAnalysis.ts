'use client';

import { useState, useEffect, useCallback } from 'react';

interface TrendDataPoint {
  date: Date;
  overallScore: number;
  technicalScore: number;
  contentScore: number;
  onpageScore: number;
  uxScore: number;
  performanceScore?: number;
  accessibilityScore?: number;
  coreWebVitals?: {
    LCP: number;
    FID: number;
    CLS: number;
    FCP: number;
    TTFB: number;
  };
}

interface TrendData {
  projectId: string;
  period: '7d' | '30d' | '90d' | '1y';
  dataPoints: TrendDataPoint[];
  summary: {
    totalDataPoints: number;
    averageScore: number;
    bestScore: number;
    worstScore: number;
    volatility: number;
    overallTrend: 'improving' | 'declining' | 'stable';
  };
  metrics: {
    scoreImprovement: number;
    performanceChange: number;
    consistencyScore: number;
  };
}

interface Regression {
  id: string;
  projectId: string;
  detectedAt: Date;
  metric: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
  beforeValue: number;
  afterValue: number;
  changePercentage: number;
  possibleCauses: string[];
  recommendations: string[];
  status: 'active' | 'resolved' | 'investigating';
}

interface TrendPrediction {
  projectId: string;
  predictedScore: number;
  confidence: number;
  timeframe: '1w' | '1m' | '3m';
  factors: {
    historical: number;
    seasonality: number;
    momentum: number;
  };
}

interface TrendScore {
  trendScore: number;
  period: string;
  summary: TrendData['summary'];
  metrics: TrendData['metrics'];
}

interface UseTrendAnalysisResult {
  // Trend data
  trendData: TrendData | null;
  regressions: Regression[];
  predictions: TrendPrediction | null;
  trendScore: TrendScore | null;
  
  // Loading states
  loading: boolean;
  regressionsLoading: boolean;
  predictionsLoading: boolean;
  trendScoreLoading: boolean;
  
  // Error states
  error: string | null;
  regressionsError: string | null;
  predictionsError: string | null;
  trendScoreError: string | null;
  
  // Actions
  fetchTrends: (period: '7d' | '30d' | '90d' | '1y') => void;
  fetchRegressions: () => void;
  fetchPredictions: (timeframe: '1w' | '1m' | '3m') => void;
  fetchTrendScore: (period: '7d' | '30d' | '90d' | '1y') => void;
  refetch: () => void;
}

export const useTrendAnalysis = (projectId: string | null): UseTrendAnalysisResult => {
  // State
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [regressions, setRegressions] = useState<Regression[]>([]);
  const [predictions, setPredictions] = useState<TrendPrediction | null>(null);
  const [trendScore, setTrendScore] = useState<TrendScore | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState<boolean>(false);
  const [regressionsLoading, setRegressionsLoading] = useState<boolean>(false);
  const [predictionsLoading, setPredictionsLoading] = useState<boolean>(false);
  const [trendScoreLoading, setTrendScoreLoading] = useState<boolean>(false);
  
  // Error states
  const [error, setError] = useState<string | null>(null);
  const [regressionsError, setRegressionsError] = useState<string | null>(null);
  const [predictionsError, setPredictionsError] = useState<string | null>(null);
  const [trendScoreError, setTrendScoreError] = useState<string | null>(null);

  // Helper function to get auth headers
  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  };

  // Fetch trend data
  const fetchTrends = useCallback(async (period: '7d' | '30d' | '90d' | '1y' = '30d') => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/enhanced-analysis/trends/${projectId}/${period}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Trend fetch failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Convert date strings to Date objects
        const processedData = {
          ...result.data,
          dataPoints: result.data.dataPoints.map((point: any) => ({
            ...point,
            date: new Date(point.date)
          }))
        };
        setTrendData(processedData);
      } else {
        throw new Error(result.error || 'Failed to fetch trend data');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching trend data:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Fetch regressions
  const fetchRegressions = useCallback(async () => {
    if (!projectId) return;

    setRegressionsLoading(true);
    setRegressionsError(null);

    try {
      const response = await fetch(`/api/enhanced-analysis/regressions/${projectId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Regressions fetch failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Convert date strings to Date objects
        const processedRegressions = result.data.map((regression: any) => ({
          ...regression,
          detectedAt: new Date(regression.detectedAt)
        }));
        setRegressions(processedRegressions);
      } else {
        throw new Error(result.error || 'Failed to fetch regressions');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setRegressionsError(errorMessage);
      console.error('Error fetching regressions:', err);
    } finally {
      setRegressionsLoading(false);
    }
  }, [projectId]);

  // Fetch predictions
  const fetchPredictions = useCallback(async (timeframe: '1w' | '1m' | '3m' = '1m') => {
    if (!projectId) return;

    setPredictionsLoading(true);
    setPredictionsError(null);

    try {
      const response = await fetch(`/api/enhanced-analysis/predictions/${projectId}?timeframe=${timeframe}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Predictions fetch failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setPredictions(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch predictions');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setPredictionsError(errorMessage);
      console.error('Error fetching predictions:', err);
    } finally {
      setPredictionsLoading(false);
    }
  }, [projectId]);

  // Fetch trend score
  const fetchTrendScore = useCallback(async (period: '7d' | '30d' | '90d' | '1y' = '30d') => {
    if (!projectId) return;

    setTrendScoreLoading(true);
    setTrendScoreError(null);

    try {
      const response = await fetch(`/api/enhanced-analysis/trend-score/${projectId}?period=${period}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Trend score fetch failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setTrendScore(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch trend score');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setTrendScoreError(errorMessage);
      console.error('Error fetching trend score:', err);
    } finally {
      setTrendScoreLoading(false);
    }
  }, [projectId]);

  // Refetch all data
  const refetch = useCallback(() => {
    if (trendData) {
      fetchTrends(trendData.period);
    } else {
      fetchTrends('30d');
    }
    fetchRegressions();
    fetchPredictions('1m');
    fetchTrendScore('30d');
  }, [trendData, fetchTrends, fetchRegressions, fetchPredictions, fetchTrendScore]);

  // Initial data fetch
  useEffect(() => {
    if (projectId) {
      fetchTrends('30d');
      fetchRegressions();
      fetchTrendScore('30d');
    }
  }, [projectId, fetchTrends, fetchRegressions, fetchTrendScore]);

  return {
    // Data
    trendData,
    regressions,
    predictions,
    trendScore,
    
    // Loading states
    loading,
    regressionsLoading,
    predictionsLoading,
    trendScoreLoading,
    
    // Error states
    error,
    regressionsError,
    predictionsError,
    trendScoreError,
    
    // Actions
    fetchTrends,
    fetchRegressions,
    fetchPredictions,
    fetchTrendScore,
    refetch,
  };
}; 