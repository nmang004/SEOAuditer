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

  // Transform backend recommendations to enhanced format
  const transformBackendRecommendations = (backendRecs: string[], issues: any[] = []): any[] => {
    const recommendations: any[] = [];
    
    // Transform basic string recommendations
    backendRecs?.forEach((rec, index) => {
      const lowRec = rec.toLowerCase();
      
      if (lowRec.includes('meta description')) {
        recommendations.push({
          id: `backend-rec-${index}`,
          title: 'Add Missing Meta Description',
          description: rec,
          impact: {
            seoScore: 8,
            userExperience: 6,
            conversionPotential: 9,
            implementationEffort: 'low' as const,
            timeToImplement: 3,
          },
          implementation: {
            autoFixAvailable: true,
            codeSnippet: {
              before: '<!-- No meta description -->',
              after: '<meta name="description" content="Your compelling description here">',
              language: 'html',
            },
            stepByStep: ['Add meta description tag', 'Write compelling copy', 'Keep it 150-160 characters'],
            tools: ['HTML Editor', 'CMS'],
            documentation: ['https://developers.google.com/search/docs/appearance/snippet'],
          },
          businessCase: {
            estimatedTrafficIncrease: '15-25%',
            competitorComparison: 'Appears in search results snippets',
            roi: '3 minutes work = better click-through rates',
          },
          quickWin: true,
          category: 'onpage',
          priority: 'high' as const,
        });
      } else if (lowRec.includes('h1') || lowRec.includes('heading')) {
        recommendations.push({
          id: `backend-rec-${index}`,
          title: 'Fix Missing H1 Tag',
          description: rec,
          impact: {
            seoScore: 9,
            userExperience: 7,
            conversionPotential: 8,
            implementationEffort: 'low' as const,
            timeToImplement: 2,
          },
          implementation: {
            autoFixAvailable: true,
            codeSnippet: {
              before: '<div class="main-title">Your Title</div>',
              after: '<h1 class="main-title">Your Title</h1>',
              language: 'html',
            },
            stepByStep: ['Identify the main heading', 'Replace with H1 tag', 'Ensure only one H1 per page'],
            tools: ['HTML Editor', 'SEO Checker'],
            documentation: ['https://moz.com/learn/seo/headings'],
          },
          businessCase: {
            estimatedTrafficIncrease: '10-20%',
            competitorComparison: 'Required for proper page structure',
            roi: '2 minutes work = major SEO improvement',
          },
          quickWin: true,
          category: 'onpage',
          priority: 'high' as const,
        });
      } else if (lowRec.includes('alt text') || lowRec.includes('image')) {
        recommendations.push({
          id: `backend-rec-${index}`,
          title: 'Optimize Images with Alt Text',
          description: rec,
          impact: {
            seoScore: 6,
            userExperience: 9,
            conversionPotential: 5,
            implementationEffort: 'low' as const,
            timeToImplement: 8,
          },
          implementation: {
            autoFixAvailable: true,
            codeSnippet: {
              before: '<img src="image.jpg" class="photo">',
              after: '<img src="image.jpg" alt="Descriptive alt text" class="photo">',
              language: 'html',
            },
            stepByStep: ['Identify images without alt text', 'Write descriptive alt text', 'Include relevant keywords'],
            tools: ['HTML Editor', 'Image Audit Tool'],
            documentation: ['https://moz.com/learn/seo/alt-text'],
          },
          businessCase: {
            estimatedTrafficIncrease: '5-10%',
            competitorComparison: 'Essential for accessibility compliance',
            roi: '8 minutes work = improved accessibility + SEO',
          },
          quickWin: true,
          category: 'onpage',
          priority: 'medium' as const,
        });
      } else {
        // Generic recommendation
        recommendations.push({
          id: `backend-rec-${index}`,
          title: rec.length > 50 ? rec.substring(0, 50) + '...' : rec,
          description: rec,
          impact: {
            seoScore: 5,
            userExperience: 5,
            conversionPotential: 5,
            implementationEffort: 'medium' as const,
            timeToImplement: 15,
          },
          implementation: {
            autoFixAvailable: false,
            codeSnippet: {
              before: '<!-- Before implementation -->',
              after: '<!-- After implementation -->',
              language: 'html',
            },
            stepByStep: ['Review the recommendation', 'Plan implementation', 'Test changes'],
            tools: ['Manual Implementation'],
            documentation: [],
          },
          businessCase: {
            estimatedTrafficIncrease: '5-15%',
            competitorComparison: 'General SEO improvement',
            roi: 'Standard optimization benefit',
          },
          quickWin: false,
          category: 'general',
          priority: 'medium' as const,
        });
      }
    });
    
    // Add issue-based recommendations
    issues?.forEach((issue, index) => {
      if (issue.type === 'error' || issue.type === 'warning') {
        recommendations.push({
          id: `issue-rec-${index}`,
          title: `Fix: ${issue.title}`,
          description: issue.description,
          impact: {
            seoScore: issue.impact === 'high' ? 9 : issue.impact === 'medium' ? 6 : 3,
            userExperience: 5,
            conversionPotential: issue.impact === 'high' ? 8 : 5,
            implementationEffort: 'low' as const,
            timeToImplement: issue.impact === 'high' ? 5 : 10,
          },
          implementation: {
            autoFixAvailable: false,
            codeSnippet: {
              before: '<!-- Current implementation -->',
              after: '<!-- Recommended implementation -->',
              language: 'html',
            },
            stepByStep: [issue.recommendation || 'Follow best practices'],
            tools: ['HTML Editor'],
            documentation: [],
          },
          businessCase: {
            estimatedTrafficIncrease: issue.impact === 'high' ? '10-20%' : '5-10%',
            competitorComparison: 'Fix critical SEO issue',
            roi: 'Quick improvement',
          },
          quickWin: issue.impact !== 'low',
          category: issue.category.toLowerCase().replace(' ', ''),
          priority: issue.impact as 'high' | 'medium' | 'low',
        });
      }
    });
    
    return recommendations.length > 0 ? recommendations : mockEnhancedRecommendations;
  };

  // Use backend data when available, fall back to mock data
  const enhancedRecommendations = results?.recommendations 
    ? transformBackendRecommendations(results.recommendations, results.issues)
    : mockEnhancedRecommendations;

  return (
    <>
      <style jsx global>{`
        [data-state="active"] {
          opacity: 1 !important;
          will-change: auto !important;
        }
        [data-state="active"] * {
          opacity: 1 !important;
          will-change: auto !important;
        }
      `}</style>
      <div className="space-y-8 pb-8" style={{ opacity: 1, willChange: 'auto' }}>
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
      <Tabs defaultValue="analysis" className="space-y-6">
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
        <TabsContent value="analysis" className="space-y-8" style={{ opacity: 1, willChange: 'auto' }}>
          {/* Debug visibility indicator */}
          <div className="bg-green-500 text-white p-2 rounded text-center font-bold" style={{ opacity: 1, willChange: 'auto' }}>
            ✅ ANALYSIS TAB IS VISIBLE - Content should appear below
          </div>
          {/* Hero Score Section */}
          <div className="relative overflow-hidden rounded-2xl border border-indigo-500/50 bg-gradient-to-br from-gray-800 to-gray-900 p-8" style={{ opacity: 1, willChange: 'auto' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 -z-10"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/20 to-transparent rounded-full blur-3xl -z-20"></div>
            
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Score Display */}
              <div className="text-center lg:text-left space-y-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center rounded-full bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 text-sm font-medium text-indigo-400 mb-4">
                    🏆 Overall Performance
                  </div>
                  <div className={`text-8xl font-extrabold ${getScoreColor(results.seoScore)} leading-none`}>
                    {results.seoScore}
                  </div>
                  <div className="text-2xl font-bold text-white">SEO Score</div>
                  <div className="text-lg text-gray-300">
                    {results.seoScore >= 80 ? 'Excellent! Your site is well optimized.' :
                     results.seoScore >= 60 ? 'Good foundation with room for improvement.' :
                     'Significant SEO opportunities.'}
                  </div>
                </div>
                
                {/* Progress Ring */}
                <div className="flex justify-center lg:justify-start">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-gray-700"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - results.seoScore / 100)}`}
                        className="text-indigo-500 transition-all duration-1000 ease-out"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-lg font-bold ${getScoreColor(results.seoScore)}`}>
                        {results.seoScore}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Key Insights */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-4">Key Insights</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${results.issues?.filter(i => i.type === 'error').length > 0 ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                        {results.issues?.filter(i => i.type === 'error').length > 0 ? 
                          <AlertCircle className="w-4 h-4 text-red-400" /> :
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        }
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {results.issues?.filter(i => i.type === 'error').length || 0} Critical Issues
                        </div>
                        <div className="text-sm text-gray-400">
                          {results.issues?.filter(i => i.type === 'error').length === 0 ? 
                            'No critical issues found' : 
                            'Needs attention'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-amber-500/20 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {results.issues?.filter(i => i.type === 'warning').length || 0} Warnings
                        </div>
                        <div className="text-sm text-gray-400">Opportunities</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Target className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {results.recommendations?.length || 0} Recommendations
                        </div>
                        <div className="text-sm text-gray-400">Action items</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ opacity: 1, willChange: 'auto' }}>
            <Card className="rounded-2xl border border-gray-700 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Load Time</h3>
                  <p className="text-xs text-gray-400">Page loading speed</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400 mb-2">
                    {results.performance.loadTime}s
                  </div>
                  <div className="text-sm text-gray-300">
                    {results.performance.loadTime <= 2 ? 'Excellent' :
                     results.performance.loadTime <= 3 ? 'Good' :
                     results.performance.loadTime <= 4 ? 'Fair' : 'Needs Work'}
                  </div>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                      results.performance.loadTime <= 2 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                      results.performance.loadTime <= 3 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                      results.performance.loadTime <= 4 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                      'bg-gradient-to-r from-red-500 to-pink-500'
                    }`}
                    style={{ width: `${Math.min(100, (5 - results.performance.loadTime) * 20)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-400 text-center">
                  Target: Under 3 seconds
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-gray-700 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Mobile Score</h3>
                  <p className="text-xs text-gray-400">Mobile optimization</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${getScoreColor(results.performance.mobileScore)}`}>
                    {results.performance.mobileScore}
                  </div>
                  <div className="text-sm text-gray-300">
                    {results.performance.mobileScore >= 80 ? 'Excellent' :
                     results.performance.mobileScore >= 60 ? 'Good' : 'Needs Work'}
                  </div>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-1000 ease-out"
                    style={{ width: `${results.performance.mobileScore}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-400 text-center">
                  Target: 80+
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-gray-700 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Desktop Score</h3>
                  <p className="text-xs text-gray-400">Desktop optimization</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${getScoreColor(results.performance.desktopScore)}`}>
                    {results.performance.desktopScore}
                  </div>
                  <div className="text-sm text-gray-300">
                    {results.performance.desktopScore >= 80 ? 'Excellent' :
                     results.performance.desktopScore >= 60 ? 'Good' : 'Needs Work'}
                  </div>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000 ease-out"
                    style={{ width: `${results.performance.desktopScore}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-400 text-center">
                  Target: 90+
                </div>
              </div>
            </Card>
          </div>

          {/* Issues Breakdown */}
          <Card className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6" style={{ opacity: 1, willChange: 'auto' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Issues Breakdown</h3>
                  <p className="text-gray-400 text-sm">Categorized analysis findings</p>
                </div>
              </div>
              <div className="text-sm text-gray-400">
                {(results.issues?.length || 0)} total issues found
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-red-400 mb-1">
                  {results.issues?.filter(i => i.type === 'error').length || 0}
                </div>
                <div className="text-sm text-red-300 font-medium">Critical Errors</div>
                <div className="text-xs text-gray-400 mt-1">Fix immediately</div>
              </div>
              
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-amber-400 mb-1">
                  {results.issues?.filter(i => i.type === 'warning').length || 0}
                </div>
                <div className="text-sm text-amber-300 font-medium">Warnings</div>
                <div className="text-xs text-gray-400 mt-1">Should address</div>
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-1">
                  {results.issues?.filter(i => i.impact === 'high').length || 0}
                </div>
                <div className="text-sm text-blue-300 font-medium">High Impact</div>
                <div className="text-xs text-gray-400 mt-1">Priority fixes</div>
              </div>
              
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-400 mb-1">
                  {results.recommendations?.filter(r => r.includes && (r.includes('quick') || r.includes('easy'))).length || 0}
                </div>
                <div className="text-sm text-green-300 font-medium">Quick Wins</div>
                <div className="text-xs text-gray-400 mt-1">Easy to fix</div>
              </div>
            </div>

            {/* Recent Issues List */}
            {results.issues && results.issues.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-white">Most Critical Issues</h4>
                <div className="space-y-2">
                  {results.issues
                    .filter(issue => issue.type === 'error' || issue.impact === 'high')
                    .slice(0, 3)
                    .map((issue, index) => (
                      <div key={index} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded-lg ${
                            issue.type === 'error' ? 'bg-red-500/20' : 'bg-amber-500/20'
                          }`}>
                            {issue.type === 'error' ? 
                              <AlertCircle className="w-4 h-4 text-red-400" /> :
                              <AlertTriangle className="w-4 h-4 text-amber-400" />
                            }
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-medium text-white text-sm">{issue.title}</h5>
                              <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                                issue.impact === 'high' ? 'bg-red-500/10 text-red-400' :
                                issue.impact === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                                'bg-blue-500/10 text-blue-400'
                              }`}>
                                {issue.impact}
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 mb-2">{issue.description}</p>
                            <p className="text-xs text-gray-500">💡 {issue.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
                {results.issues.length > 3 && (
                  <div className="text-center">
                    <button className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                      View all issues →
                    </button>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Next Steps */}
          <Card className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm p-6" style={{ opacity: 1, willChange: 'auto' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Recommended Next Steps</h3>
                <p className="text-gray-400 text-sm">Based on your analysis results</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-indigo-400 font-medium mb-2">🚀 Quick Wins</div>
                <div className="text-sm text-gray-300 mb-3">
                  Easy fixes for immediate SEO gains.
                </div>
                <button className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  View Action Plan →
                </button>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-green-400 font-medium mb-2">🔧 Technical Fixes</div>
                <div className="text-sm text-gray-300 mb-3">
                  Fix critical technical issues.
                </div>
                <button className="text-xs text-green-400 hover:text-green-300 transition-colors">
                  View Technical Details →
                </button>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-purple-400 font-medium mb-2">📈 Monitor Progress</div>
                <div className="text-sm text-gray-300 mb-3">
                  Track progress and re-analyze.
                </div>
                <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                  Schedule Re-analysis →
                </button>
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
    </>
  );
}