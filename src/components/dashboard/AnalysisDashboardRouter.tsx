'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Folder, 
  Globe, 
  ArrowRight,
  RefreshCw,
  Calendar,
  TrendingUp
} from 'lucide-react';

// Import dashboard components
import { SinglePageDashboard } from './SinglePageDashboard';
import { SubfolderDashboard } from './SubfolderDashboard';
import { FullDomainDashboard } from './FullDomainDashboard';

// Types
export interface Analysis {
  id: string;
  crawlType: 'single' | 'subfolder' | 'domain';
  status: 'pending' | 'running' | 'completed' | 'failed';
  url: string;
  projectId: string;
  createdAt: string;
  completedAt?: string;
  metadata: {
    pagesAnalyzed: number;
    totalPages?: number;
    depth?: number;
    estimatedDuration?: string;
  };
  data?: AnalysisData;
}

export interface AnalysisData {
  score: number;
  issues: Issue[];
  recommendations: Recommendation[];
  performance: PerformanceData;
  technical: TechnicalData;
  content: ContentData;
}

export interface Issue {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  pages?: string[];
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  category: string;
  pages?: string[];
}

export interface PerformanceData {
  lcp: number;
  fid: number;
  cls: number;
  loadTime: number;
  pageSize: number;
}

export interface TechnicalData {
  metaTags: any;
  headings: any;
  images: any;
  links: any;
}

export interface ContentData {
  wordCount: number;
  readability: number;
  keywords: string[];
  duplicateContent?: any;
}

export interface DashboardConfig {
  showSiteMap: boolean;
  showCrossPageInsights: boolean;
  showBulkActions: boolean;
  primaryMetrics: string[];
  defaultView: string;
  tabs: string[];
  features: string[];
}

// Simple test component to verify basic rendering
export function SimpleAnalysisTest() {
  return (
    <div style={{
      background: '#10b981',
      color: 'white',
      padding: '20px',
      border: '3px solid #22c55e',
      borderRadius: '8px',
      margin: '20px 0',
      textAlign: 'center'
    }}>
      <h2>✅ SIMPLE COMPONENT WORKING</h2>
      <p>This proves React components can render</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  );
}

// Main Dashboard Router Component
export function AnalysisDashboardRouter() {
  console.log('[AnalysisDashboardRouter] Component called - STARTING RENDER');
  
  // STEP 1, 2, 3: Call all hooks unconditionally first (Rules of Hooks)
  const params = useParams();
  const searchParams = useSearchParams();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const projectId = params?.projectId as string;
  const jobId = params?.jobId as string;
  const viewMode = searchParams?.get('view');
  
  // Add the data loading logic back
  const loadAnalysis = useCallback(async () => {
    console.log('[AnalysisDashboardRouter] ✅ useCallback loadAnalysis created');
    if (!jobId) {
      console.log('[AnalysisDashboardRouter] No jobId provided');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('[AnalysisDashboardRouter] Loading analysis for jobId:', jobId);

      // Try to get from localStorage first (for admin bypass)
      const adminJobsString = localStorage.getItem('adminAnalysisJobs') || '[]';
      console.log('[AnalysisDashboardRouter] localStorage data length:', adminJobsString.length);
      
      let adminJobs = [];
      try {
        adminJobs = JSON.parse(adminJobsString);
        console.log('[AnalysisDashboardRouter] Parsed admin jobs:', adminJobs.length);
      } catch (parseError) {
        console.error('[AnalysisDashboardRouter] Failed to parse localStorage:', parseError);
        adminJobs = [];
      }
      
      const adminJob = adminJobs.find((job: any) => {
        return job.sessionId === jobId || job.jobId === jobId;
      });
      console.log('[AnalysisDashboardRouter] Found admin job:', !!adminJob);

      if (adminJob) {
        // Create mock analysis from admin job
        const mockAnalysis: Analysis = {
          id: jobId,
          crawlType: adminJob.config?.crawlType || 'subfolder',
          status: 'completed',
          url: adminJob.config?.startUrl || adminJob.url || 'https://github.com/admin',
          projectId: adminJob.projectId || projectId,
          createdAt: adminJob.createdAt || new Date().toISOString(),
          completedAt: new Date().toISOString(),
          metadata: {
            pagesAnalyzed: adminJob.estimatedPages || 8,
            totalPages: adminJob.estimatedPages || 8,
            depth: adminJob.config?.depth || 3,
            estimatedDuration: adminJob.estimatedDuration ? `${adminJob.estimatedDuration} minutes` : '15 minutes'
          },
          data: {
            score: Math.floor(Math.random() * 40) + 60,
            issues: [],
            recommendations: [],
            performance: { lcp: 2.1, fid: 45, cls: 0.05, loadTime: 1.8, pageSize: 2.1 },
            technical: { metaTags: {}, headings: {}, images: {}, links: {} },
            content: { wordCount: 850, readability: 8.2, keywords: ['SEO', 'optimization', 'website'] }
          }
        };
        
        console.log('[AnalysisDashboardRouter] ✅ Created mock analysis');
        setAnalysis(mockAnalysis);
        setLoading(false);
        return;
      }

      // Fallback for admin-multi jobs
      if (jobId.startsWith('admin-multi-')) {
        console.log('[AnalysisDashboardRouter] Creating fallback mock data');
        const mockAnalysis: Analysis = {
          id: jobId,
          crawlType: 'subfolder',
          status: 'completed',
          url: 'https://github.com/admin',
          projectId: projectId,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          metadata: { pagesAnalyzed: 8, totalPages: 10, depth: 3, estimatedDuration: '15 minutes' },
          data: {
            score: 85,
            issues: [],
            recommendations: [],
            performance: { lcp: 2.1, fid: 45, cls: 0.05, loadTime: 1.8, pageSize: 2.1 },
            technical: { metaTags: {}, headings: {}, images: {}, links: {} },
            content: { wordCount: 850, readability: 8.2, keywords: ['SEO', 'optimization', 'website'] }
          }
        };
        
        setAnalysis(mockAnalysis);
        setLoading(false);
        return;
      }

    } catch (err) {
      console.error('[AnalysisDashboardRouter] Error loading analysis:', err);
      setError('Failed to load analysis');
    } finally {
      setLoading(false);
    }
  }, [jobId, projectId]);

  useEffect(() => {
    console.log('[AnalysisDashboardRouter] ✅ useEffect triggered');
    loadAnalysis();
  }, [loadAnalysis]);
  
  // Immediate visibility test for this component
  if (typeof window !== 'undefined') {
    console.log('[AnalysisDashboardRouter] Window is available, component should render');
  } else {
    console.log('[AnalysisDashboardRouter] Window not available - SSR mode');
  }

  // Step 4: Render actual dashboard components
  console.log('[AnalysisDashboardRouter] ✅ STEP 4: Rendering dashboard components');
  console.log('[AnalysisDashboardRouter] Analysis:', analysis);
  console.log('[AnalysisDashboardRouter] Loading:', loading);
  console.log('[AnalysisDashboardRouter] Error:', error);

  // Show loading state
  if (loading) {
    console.log('[AnalysisDashboardRouter] Showing loading state');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analysis...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    console.log('[AnalysisDashboardRouter] Showing error state:', error);
    return (
      <Card className="p-6 bg-red-500/10 border-red-500/30">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-400 mb-2">Analysis Error</h3>
          <p className="text-gray-300">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-red-600 hover:bg-red-700"
          >
            Retry Analysis
          </Button>
        </div>
      </Card>
    );
  }

  // Show no analysis state
  if (!analysis) {
    console.log('[AnalysisDashboardRouter] No analysis data available');
    return (
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No Analysis Data</h3>
          <p className="text-gray-500">Unable to load analysis results.</p>
        </div>
      </Card>
    );
  }

  // Configure dashboard based on analysis type
  const dashboardConfig: DashboardConfig = {
    showSiteMap: analysis.crawlType === 'domain',
    showCrossPageInsights: analysis.crawlType !== 'single',
    showBulkActions: analysis.crawlType !== 'single',
    primaryMetrics: ['score', 'issues', 'recommendations'],
    defaultView: 'overview',
    tabs: ['overview', 'recommendations', 'technical', 'content', 'performance'],
    features: analysis.crawlType === 'domain' 
      ? ['site-explorer', 'architecture-analysis', 'critical-paths']
      : analysis.crawlType === 'subfolder'
      ? ['bulk-operations', 'cross-page-insights', 'pattern-analysis']
      : ['detailed-recommendations', 'technical-audit', 'performance-metrics']
  };

  console.log('[AnalysisDashboardRouter] ✅ Rendering dashboard for type:', analysis.crawlType);
  console.log('[AnalysisDashboardRouter] Dashboard config:', dashboardConfig);

  // Render appropriate dashboard component
  try {
    switch (analysis.crawlType) {
      case 'single':
        console.log('[AnalysisDashboardRouter] Rendering SinglePageDashboard');
        return <SinglePageDashboard analysis={analysis} config={dashboardConfig} />;
      
      case 'subfolder':
        console.log('[AnalysisDashboardRouter] Rendering SubfolderDashboard');
        return <SubfolderDashboard analysis={analysis} config={dashboardConfig} />;
      
      case 'domain':
        console.log('[AnalysisDashboardRouter] Rendering FullDomainDashboard');
        return <FullDomainDashboard analysis={analysis} config={dashboardConfig} />;
      
      default:
        console.log('[AnalysisDashboardRouter] Unknown crawl type, defaulting to SinglePageDashboard');
        return <SinglePageDashboard analysis={analysis} config={dashboardConfig} />;
    }
  } catch (renderError) {
    console.error('[AnalysisDashboardRouter] Error rendering dashboard component:', renderError);
    return (
      <Card className="p-6 bg-red-500/10 border-red-500/30">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-400 mb-2">Dashboard Render Error</h3>
          <p className="text-gray-300">
            Failed to render {analysis.crawlType} dashboard: {renderError instanceof Error ? renderError.message : String(renderError)}
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-red-600 hover:bg-red-700"
          >
            Refresh Page
          </Button>
        </div>
      </Card>
    );
  }
}