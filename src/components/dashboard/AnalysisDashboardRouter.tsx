'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
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

// Dashboard Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 bg-gray-700" />
          <Skeleton className="h-4 w-96 bg-gray-700" />
        </div>
        <Skeleton className="h-6 w-20 bg-gray-700" />
      </div>
      
      {/* Metrics Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 bg-gray-800/50 border-gray-700">
            <Skeleton className="h-4 w-20 bg-gray-700 mb-2" />
            <Skeleton className="h-8 w-16 bg-gray-700" />
          </Card>
        ))}
      </div>
      
      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-64 bg-gray-700 rounded-lg" />
          <Skeleton className="h-32 bg-gray-700 rounded-lg" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 bg-gray-700 rounded-lg" />
          <Skeleton className="h-32 bg-gray-700 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Analysis Status Display
function AnalysisStatus({ analysis }: { analysis: Analysis }) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: <Calendar className="h-3 w-3" /> },
      running: { variant: 'default' as const, icon: <RefreshCw className="h-3 w-3 animate-spin" /> },
      completed: { variant: 'default' as const, icon: <TrendingUp className="h-3 w-3" /> },
      failed: { variant: 'destructive' as const, icon: <RefreshCw className="h-3 w-3" /> }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getCrawlTypeIcon = (crawlType: string) => {
    const icons = {
      single: <FileText className="h-4 w-4" />,
      subfolder: <Folder className="h-4 w-4" />,
      domain: <Globe className="h-4 w-4" />
    };
    return icons[crawlType as keyof typeof icons] || icons.single;
  };

  if (analysis.status !== 'completed') {
    return (
      <Card className="p-8 bg-gray-800/50 border-gray-700 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            {getCrawlTypeIcon(analysis.crawlType)}
            <h2 className="text-xl font-semibold text-white">
              {analysis.crawlType.charAt(0).toUpperCase() + analysis.crawlType.slice(1)} Analysis
            </h2>
            {getStatusBadge(analysis.status)}
          </div>
          
          <p className="text-gray-400 max-w-md">
            {analysis.status === 'pending' && 'Your analysis is queued and will start shortly.'}
            {analysis.status === 'running' && `Analyzing ${analysis.metadata.pagesAnalyzed || 0} pages...`}
            {analysis.status === 'failed' && 'Analysis failed. Please try again.'}
          </p>
          
          {analysis.metadata.estimatedDuration && (
            <p className="text-sm text-gray-500">
              Estimated time: {analysis.metadata.estimatedDuration}
            </p>
          )}
        </div>
      </Card>
    );
  }

  return null;
}

// Dashboard Configuration Generator
function getDashboardConfig(crawlType: string): DashboardConfig {
  const configs: Record<string, DashboardConfig> = {
    single: {
      showSiteMap: false,
      showCrossPageInsights: false,
      showBulkActions: false,
      primaryMetrics: ['score', 'issues', 'recommendations', 'performance'],
      defaultView: 'recommendations',
      tabs: ['overview', 'recommendations', 'technical', 'content', 'performance'],
      features: ['export', 'reanalyze', 'monitor']
    },
    subfolder: {
      showSiteMap: true,
      showCrossPageInsights: true,
      showBulkActions: true,
      primaryMetrics: ['avgScore', 'totalPages', 'commonIssues', 'coverage'],
      defaultView: 'pages',
      tabs: ['overview', 'pages', 'insights', 'recommendations', 'compare'],
      features: ['export', 'bulk-actions', 'compare', 'monitor']
    },
    domain: {
      showSiteMap: true,
      showCrossPageInsights: true,
      showBulkActions: true,
      primaryMetrics: ['siteHealth', 'crawlCoverage', 'criticalPaths', 'architecture'],
      defaultView: 'sitemap',
      tabs: ['overview', 'sitemap', 'insights', 'pages', 'recommendations', 'reports'],
      features: ['export', 'sitemap-generation', 'architecture-report', 'monitor']
    }
  };
  
  return configs[crawlType] || configs.single;
}

// Main Dashboard Router Component
export function AnalysisDashboardRouter() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const projectId = params?.projectId as string;
  const jobId = params?.jobId as string;
  const viewMode = searchParams?.get('view');
  
  // Debug params
  console.log('[AnalysisDashboardRouter] All params:', params);
  console.log('[AnalysisDashboardRouter] ProjectId:', projectId);
  console.log('[AnalysisDashboardRouter] JobId:', jobId);
  console.log('[AnalysisDashboardRouter] ViewMode:', viewMode);

  useEffect(() => {
    loadAnalysis();
  }, [jobId]);

  const loadAnalysis = async () => {
    if (!jobId) return;
    
    try {
      setLoading(true);
      setError(null);

      console.log('[AnalysisDashboardRouter] Loading analysis for jobId:', jobId);
      console.log('[AnalysisDashboardRouter] ProjectId:', projectId);

      // Try to get from localStorage first (for admin bypass)
      const adminJobsString = localStorage.getItem('adminAnalysisJobs') || '[]';
      console.log('[AnalysisDashboardRouter] localStorage adminAnalysisJobs:', adminJobsString);
      
      const adminJobs = JSON.parse(adminJobsString);
      console.log('[AnalysisDashboardRouter] Parsed admin jobs:', adminJobs);
      
      const adminJob = adminJobs.find((job: any) => 
        job.sessionId === jobId || job.jobId === jobId
      );
      console.log('[AnalysisDashboardRouter] Found admin job:', adminJob);

      if (adminJob) {
        console.log('[AnalysisDashboardRouter] Creating analysis from admin job:', adminJob);
        
        // Create mock analysis from admin job
        const mockAnalysis: Analysis = {
          id: jobId,
          crawlType: adminJob.config?.crawlType || 'single',
          status: 'completed',
          url: adminJob.config?.startUrl || adminJob.url || '',
          projectId: adminJob.projectId || projectId,
          createdAt: adminJob.createdAt || new Date().toISOString(),
          completedAt: new Date().toISOString(),
          metadata: {
            pagesAnalyzed: adminJob.estimatedPages || 1,
            totalPages: adminJob.estimatedPages || 1,
            depth: adminJob.config?.depth || 1,
            estimatedDuration: adminJob.estimatedDuration ? `${adminJob.estimatedDuration} minutes` : '30-60 seconds'
          },
          data: generateMockAnalysisData(adminJob.config?.crawlType || 'single')
        };
        
        console.log('[AnalysisDashboardRouter] Created mock analysis:', mockAnalysis);
        setAnalysis(mockAnalysis);
        setLoading(false);
        return;
      }

      // If this looks like an admin-multi job but we didn't find it in localStorage, create mock data
      if (jobId.startsWith('admin-multi-')) {
        console.log('[AnalysisDashboardRouter] Admin-multi job not found in localStorage, creating mock data');
        
        const mockAnalysis: Analysis = {
          id: jobId,
          crawlType: 'subfolder',
          status: 'completed',
          url: 'https://github.com/admin',
          projectId: projectId,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          metadata: {
            pagesAnalyzed: 8,
            totalPages: 10,
            depth: 3,
            estimatedDuration: '15 minutes'
          },
          data: generateMockAnalysisData('subfolder')
        };
        
        console.log('[AnalysisDashboardRouter] Created mock subfolder analysis:', mockAnalysis);
        setAnalysis(mockAnalysis);
        setLoading(false);
        return;
      }

      // Try API call
      const response = await fetch(`/api/projects/${projectId}/analyses/${jobId}`);
      
      if (!response.ok) {
        // Fallback to mock data
        const mockAnalysis: Analysis = {
          id: jobId,
          crawlType: 'single',
          status: 'completed',
          url: 'https://example.com',
          projectId: projectId,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          metadata: {
            pagesAnalyzed: 1,
            estimatedDuration: '30-60 seconds'
          },
          data: generateMockAnalysisData('single')
        };
        
        setAnalysis(mockAnalysis);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      console.error('Error loading analysis:', err);
      setError('Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  const generateMockAnalysisData = (crawlType: string): AnalysisData => {
    return {
      score: Math.floor(Math.random() * 40) + 60, // 60-100
      issues: [
        {
          id: '1',
          type: 'meta',
          severity: 'medium',
          title: 'Missing meta description',
          description: 'This page is missing a meta description tag',
          pages: crawlType !== 'single' ? ['/page1', '/page2'] : undefined
        },
        {
          id: '2',
          type: 'performance',
          severity: 'high',
          title: 'Large image files',
          description: 'Images are not optimized for web',
          pages: crawlType !== 'single' ? ['/page1'] : undefined
        }
      ],
      recommendations: [
        {
          id: '1',
          title: 'Add meta descriptions',
          description: 'Add unique meta descriptions to improve search engine visibility',
          impact: 'medium',
          effort: 'low',
          category: 'SEO',
          pages: crawlType !== 'single' ? ['/page1', '/page2'] : undefined
        },
        {
          id: '2',
          title: 'Optimize images',
          description: 'Compress and resize images to improve page load times',
          impact: 'high',
          effort: 'medium',
          category: 'Performance',
          pages: crawlType !== 'single' ? ['/page1'] : undefined
        }
      ],
      performance: {
        lcp: 2.1,
        fid: 45,
        cls: 0.05,
        loadTime: 1.8,
        pageSize: 2.1
      },
      technical: {
        metaTags: {},
        headings: {},
        images: {},
        links: {}
      },
      content: {
        wordCount: 850,
        readability: 8.2,
        keywords: ['SEO', 'optimization', 'website']
      }
    };
  };

  console.log('[AnalysisDashboardRouter] Render state - loading:', loading, 'error:', error, 'analysis:', !!analysis);
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-500/20 border border-blue-500 rounded p-2 text-blue-300 text-sm">
          DEBUG: Loading analysis {jobId}...
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="space-y-4">
        <div className="bg-red-500/20 border border-red-500 rounded p-2 text-red-300 text-sm">
          DEBUG: Error or no analysis - error: {error}, analysis: {!!analysis}, jobId: {jobId}
        </div>
        <Card className="p-8 bg-gray-800/50 border-gray-700 text-center">
          <h2 className="text-xl font-semibold text-white mb-4">Analysis Not Found</h2>
          <p className="text-gray-400">
            {error || 'The requested analysis could not be found.'}
          </p>
        </Card>
      </div>
    );
  }

  // Show status for non-completed analyses
  const statusDisplay = <AnalysisStatus analysis={analysis} />;
  if (statusDisplay) {
    return statusDisplay;
  }

  // Get dashboard configuration
  const config = getDashboardConfig(analysis.crawlType);
  
  // Force view mode if specified in URL
  const effectiveCrawlType = viewMode || analysis.crawlType;

  // Route to appropriate dashboard
  console.log('[AnalysisDashboardRouter] Routing to dashboard type:', effectiveCrawlType);
  console.log('[AnalysisDashboardRouter] Analysis data:', analysis);
  console.log('[AnalysisDashboardRouter] Config:', config);
  
  switch (effectiveCrawlType) {
    case 'subfolder':
      console.log('[AnalysisDashboardRouter] Rendering SubfolderDashboard with analysis:', analysis);
      return (
        <SubfolderDashboard 
          analysis={analysis} 
          config={config}
        />
      );
    case 'domain':
      console.log('[AnalysisDashboardRouter] Rendering FullDomainDashboard');
      return (
        <FullDomainDashboard 
          analysis={analysis} 
          config={config}
        />
      );
    case 'single':
    default:
      console.log('[AnalysisDashboardRouter] Rendering SinglePageDashboard');
      return (
        <SinglePageDashboard 
          analysis={analysis} 
          config={config}
        />
      );
  }
}