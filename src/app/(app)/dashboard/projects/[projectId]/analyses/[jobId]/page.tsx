'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedAnalysisDashboard } from '@/components/analysis/enhanced-analysis-dashboard';
import { mockEnhancedRecommendations } from '@/lib/mock-enhanced-recommendations';
import { TechnicalAnalysis } from '@/components/analysis/technical-analysis';
import { ContentAnalysis } from '@/components/analysis/content-analysis';
import { 
  ArrowLeft,
  Globe,
  Clock,
  FileText,
  BarChart3,
  Target,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  ExternalLink,
  Loader2,
  RefreshCw,
  Download,
  Share,
  Sparkles,
  Wrench
} from 'lucide-react';
import Link from 'next/link';

interface AnalysisData {
  jobId: string;
  status: string;
  url: string;
  results?: {
    seoScore: number;
    issues: Array<{
      type: string;
      category: string;
      title: string;
      description: string;
      impact: string;
      recommendation: string;
    }>;
    recommendations: any[];
    technicalSEO: {
      titleTag: { status: string; length: number };
      metaDescription: { status: string; length: number };
      headings: { h1: number; h2: number; h3: number };
      images: { total: number; withAlt: number; withoutAlt: number };
    };
    performance: {
      loadTime: number;
      mobileScore: number;
      desktopScore: number;
    };
  };
  completedAt: string;
  source: string;
}

export default function AnalysisResultsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const jobId = params?.jobId as string;
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    
    const token = localStorage.getItem("token");
    console.log('[Analysis Results] Fetching results for job:', jobId);
    
    // For admin jobs, try to get the URL from stored analysis jobs
    let analysisUrl = '';
    const isAdminBypass = token?.includes('admin-access-token');
    const isAdminJob = jobId.startsWith('admin-job-');
    
    if (isAdminBypass && isAdminJob) {
      // First, check if we have cached results for this job
      const cacheKey = `analysis_results_${jobId}`;
      const cachedResults = localStorage.getItem(cacheKey);
      
      if (cachedResults) {
        console.log('[Analysis Results] Using cached results for job:', jobId);
        try {
          const parsedResults = JSON.parse(cachedResults);
          setData(parsedResults);
          setLoading(false);
          return;
        } catch (e) {
          console.error('[Analysis Results] Failed to parse cached results:', e);
        }
      }
      
      // If no cached results, get the URL from stored jobs
      const storedJobs = JSON.parse(localStorage.getItem('adminAnalysisJobs') || '[]');
      const job = storedJobs.find((j: any) => j.jobId === jobId);
      if (job) {
        analysisUrl = job.url;
        console.log('[Analysis Results] Found stored URL for admin job:', analysisUrl);
      }
    }
    
    // Build API URL with query parameter for the URL to analyze
    const apiUrl = analysisUrl 
      ? `/api/crawl/results/${jobId}?url=${encodeURIComponent(analysisUrl)}`
      : `/api/crawl/results/${jobId}`;
    
    fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(res => res.json())
      .then(response => {
        console.log('[Analysis Results] API response:', response);
        if (response.success && response.data) {
          setData(response.data);
          
          // Store results in localStorage for admin users to persist across refreshes
          if (isAdminBypass && isAdminJob) {
            const cacheKey = `analysis_results_${jobId}`;
            localStorage.setItem(cacheKey, JSON.stringify(response.data));
            console.log('[Analysis Results] Stored results in localStorage for job:', jobId);
          }
        } else {
          setError(response.error || 'Failed to load results');
        }
      })
      .catch(err => {
        console.error('[Analysis Results] Error:', err);
        setError(err.message || 'Failed to load results');
      })
      .finally(() => setLoading(false));
  }, [jobId]);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number): string => {
    if (score >= 80) return 'from-green-500/10 to-emerald-500/10 border-green-500/20';
    if (score >= 60) return 'from-yellow-500/10 to-orange-500/10 border-yellow-500/20';
    return 'from-red-500/10 to-pink-500/10 border-red-500/20';
  };

  const handleImplementRecommendation = (id: string) => {
    console.log('Implementing recommendation:', id);
    // TODO: Implement auto-fix functionality
  };

  const handleMarkComplete = (id: string) => {
    console.log('Marking recommendation as complete:', id);
    // TODO: Update recommendation status
  };

  const handleExportPlan = () => {
    console.log('Exporting implementation plan');
    // TODO: Generate and download implementation plan
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Loading Analysis Results</h2>
            <p className="text-gray-300">Please wait while we fetch your SEO analysis...</p>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400">
              <Clock className="h-4 w-4" />
              <span>Job ID: {jobId}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-sm p-8 text-center">
              <div className="h-12 w-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Results</h2>
              <p className="text-red-300 mb-6">{error}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => window.location.reload()}
                  className="flex-1 border border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </button>
                <button 
                  onClick={() => router.back()}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 backdrop-blur-sm p-8 text-center">
              <div className="h-12 w-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-indigo-400 mb-2">Analysis in Progress</h2>
              <p className="text-indigo-300 mb-2">The analysis may still be processing. Results will appear here once complete.</p>
              <div className="inline-flex items-center rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-400 mb-6">
                Job ID: {jobId}
              </div>
              <div>
                <button 
                  onClick={() => window.location.reload()}
                  className="border border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 mx-auto"
                >
                  <RefreshCw className="h-4 w-4" />
                  Check Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const results = data.results;
  if (!results) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 backdrop-blur-sm p-8 text-center">
              <div className="h-12 w-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
              </div>
              <h2 className="text-xl font-bold text-yellow-400 mb-2">No Analysis Data</h2>
              <p className="text-yellow-300 mb-6">The analysis completed but no data was found. This might be due to the website being inaccessible.</p>
              <button 
                onClick={() => router.push(`/dashboard/projects/${projectId}/analyses/new`)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 mx-auto"
              >
                <BarChart3 className="h-4 w-4" />
                Try New Analysis
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Transform backend data to match enhanced recommendations format if needed
  const enhancedRecommendations = results.recommendations?.length > 0 
    ? results.recommendations 
    : mockEnhancedRecommendations;

  console.log('[AnalysisResultsPage] ===== PARENT DEBUG =====');
  console.log('[AnalysisResultsPage] results.recommendations:', results.recommendations);
  console.log('[AnalysisResultsPage] results.recommendations?.length:', results.recommendations?.length);
  console.log('[AnalysisResultsPage] mockEnhancedRecommendations:', mockEnhancedRecommendations);
  console.log('[AnalysisResultsPage] enhancedRecommendations:', enhancedRecommendations);
  console.log('[AnalysisResultsPage] enhancedRecommendations length:', enhancedRecommendations?.length || 0);
  console.log('[AnalysisResultsPage] currentScore:', results.seoScore);
  console.log('[AnalysisResultsPage] usingMockData:', results.recommendations?.length === 0);
  
  // Check the structure of the first recommendation
  if (enhancedRecommendations && enhancedRecommendations.length > 0) {
    console.log('[AnalysisResultsPage] First recommendation structure:');
    console.log('  - id:', enhancedRecommendations[0]?.id);
    console.log('  - title:', enhancedRecommendations[0]?.title);
    console.log('  - description:', enhancedRecommendations[0]?.description);
    console.log('  - impact:', enhancedRecommendations[0]?.impact);
    console.log('  - typeof:', typeof enhancedRecommendations[0]);
    console.log('  - keys:', enhancedRecommendations[0] ? Object.keys(enhancedRecommendations[0]) : 'no keys');
    console.log('  - full object:', enhancedRecommendations[0]);
  }
  console.log('[AnalysisResultsPage] ===== END PARENT DEBUG =====');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent">
            <Link href={`/dashboard/projects/${projectId}/analyses`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              SEO Analysis Results
            </h1>
            <p className="text-gray-300 mt-2 text-lg">
              URL: <span className="font-mono text-indigo-400 break-all">{data.url || 'Unknown URL'}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="border border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="border border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2">
            <Share className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>

      {/* Analysis Summary */}
      <Card className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Globe className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Analysis Summary</h2>
              <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                <Globe className="h-3 w-3" />
                {data.url}
                <ExternalLink className="h-3 w-3" />
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Analyzed on</p>
            <p className="text-sm font-medium text-gray-300">
              {data.completedAt ? new Date(data.completedAt).toLocaleString() : 'Just now'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Analysis complete</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>1 page analyzed</span>
          </div>
          <div className="inline-flex items-center rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
            Analysis Complete
          </div>
        </div>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
          <TabsTrigger 
            value="recommendations" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Action Plan
          </TabsTrigger>
          <TabsTrigger 
            value="analysis" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analysis Overview
          </TabsTrigger>
          <TabsTrigger 
            value="technical" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
          >
            <Wrench className="w-4 h-4 mr-2" />
            Technical Details
          </TabsTrigger>
        </TabsList>

        {/* Enhanced Recommendations Tab - DEFAULT */}
        <TabsContent value="recommendations" className="space-y-6">
          <EnhancedAnalysisDashboard
            recommendations={enhancedRecommendations}
            currentScore={results.seoScore}
            onImplementRecommendation={handleImplementRecommendation}
            onMarkComplete={handleMarkComplete}
            onExportPlan={handleExportPlan}
          />
        </TabsContent>

        {/* Analysis Overview Tab */}
        <TabsContent value="analysis" className="space-y-6">
          {/* Main SEO Score */}
          <Card className={`rounded-2xl border bg-gradient-to-br backdrop-blur-sm p-8 text-center ${getScoreBg(results.seoScore)}`}>
            <div className="h-16 w-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-indigo-400" />
            </div>
            <div className={`text-6xl font-bold mb-2 ${getScoreColor(results.seoScore)}`}>
              {results.seoScore}
            </div>
            <div className="text-xl font-bold text-white mb-2">Overall SEO Score</div>
            <div className="text-gray-300 mb-6">Your website's overall SEO performance</div>
            <div className="w-full max-w-md mx-auto bg-gray-700/50 rounded-full h-3">
              <div 
                className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                style={{ width: `${results.seoScore}%` }}
              ></div>
            </div>
          </Card>

          {/* Performance */}
          <Card className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700/30 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">{results.performance.loadTime}s</div>
                <div className="text-sm text-gray-400">Load Time</div>
              </div>
              <div className="bg-gray-700/30 p-4 rounded-lg text-center">
                <div className={`text-2xl font-bold mb-1 ${getScoreColor(results.performance.mobileScore)}`}>
                  {results.performance.mobileScore}
                </div>
                <div className="text-sm text-gray-400">Mobile Score</div>
              </div>
              <div className="bg-gray-700/30 p-4 rounded-lg text-center">
                <div className={`text-2xl font-bold mb-1 ${getScoreColor(results.performance.desktopScore)}`}>
                  {results.performance.desktopScore}
                </div>
                <div className="text-sm text-gray-400">Desktop Score</div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Technical Details Tab */}
        <TabsContent value="technical" className="space-y-6">
          {/* Technical SEO */}
          <Card className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-400" />
              Technical SEO
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-700/30 p-4 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Title Tag</div>
                <div className={`font-medium ${results.technicalSEO.titleTag.status === 'good' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {results.technicalSEO.titleTag.status === 'good' ? 'Good' : 'Needs Work'}
                </div>
                <div className="text-xs text-gray-500">{results.technicalSEO.titleTag.length} characters</div>
              </div>
              <div className="bg-gray-700/30 p-4 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Meta Description</div>
                <div className={`font-medium ${results.technicalSEO.metaDescription.status === 'good' ? 'text-green-400' : 'text-red-400'}`}>
                  {results.technicalSEO.metaDescription.status === 'missing' ? 'Missing' : 'Good'}
                </div>
                <div className="text-xs text-gray-500">{results.technicalSEO.metaDescription.length} characters</div>
              </div>
              <div className="bg-gray-700/30 p-4 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">H1 Tags</div>
                <div className={`font-medium ${results.technicalSEO.headings.h1 === 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {results.technicalSEO.headings.h1} found
                </div>
              </div>
              <div className="bg-gray-700/30 p-4 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Images</div>
                <div className="font-medium text-gray-300">{results.technicalSEO.images.total} total</div>
                <div className="text-xs text-gray-500">{results.technicalSEO.images.withoutAlt} without alt text</div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}