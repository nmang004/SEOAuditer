'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { m } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Image,
  Link2,
  Search,
  TrendingUp,
  ExternalLink,
  Loader2,
  RefreshCw,
  Download,
  Share
} from 'lucide-react';
import Link from 'next/link';

interface SEOResults {
  url: string;
  crawledAt: string;
  pages: Array<{
    url: string;
    title: string;
    description: string;
    statusCode: number;
    metadata: {
      title: string;
      description: string;
      keywords: string;
    };
    scores: {
      overall: number;
      technical: number;
      content: number;
      onpage: number;
      ux: number;
    };
    stats: {
      h1Count: number;
      imgWithoutAlt: number;
      internalLinks: number;
      externalLinks: number;
    };
    issues: Array<{
      type: string;
      severity: string;
      message: string;
    }>;
    recommendations: string[];
  }>;
  summary: {
    totalPages: number;
    crawlDuration: number;
    overallScore: number;
    technicalScore: number;
    contentScore: number;
    onpageScore: number;
    uxScore: number;
  };
  issues: Array<{
    type: string;
    severity: string;
    message: string;
  }>;
  recommendations: string[];
}

export default function AnalysisResultsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const jobId = params?.jobId as string;
  const [results, setResults] = useState<SEOResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    
    const token = localStorage.getItem("token");
    fetch(`/api/crawl/results/${jobId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setResults(data.results || data);
        } else {
          setError(data.error || 'Failed to load results');
        }
      })
      .catch(err => setError(err.message || 'Failed to load results'))
      .finally(() => setLoading(false));
  }, [jobId]);

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'from-green-500 to-green-600 text-white border-green-500';
    if (score >= 70) return 'from-yellow-500 to-yellow-600 text-white border-yellow-500';
    return 'from-red-500 to-red-600 text-white border-red-500';
  };

  const getScoreTextColor = (score: number): string => {
    if (score >= 90) return 'text-green-700';
    if (score >= 70) return 'text-yellow-700';
    return 'text-red-700';
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <m.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="h-16 w-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Analysis Results</h2>
          <p className="text-gray-600">Please wait while we fetch your SEO analysis...</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Job ID: {jobId}</span>
          </div>
        </m.div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <m.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full mx-4"
        >
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Results</h2>
              <p className="text-red-700 mb-6">{error}</p>
              <div className="flex gap-3">
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                <Button 
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </m.div>
      </div>
    );
  }
  
  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <m.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full mx-4"
        >
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-blue-900 mb-2">Analysis in Progress</h2>
              <p className="text-blue-700 mb-2">The analysis may still be processing. Results will appear here once complete.</p>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs font-mono">
                Job ID: {jobId}
              </Badge>
              <div className="mt-6">
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </m.div>
      </div>
    );
  }

  // Additional safety checks for the results structure
  if (!results.pages || !Array.isArray(results.pages) || results.pages.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <m.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full mx-4"
        >
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-yellow-900 mb-2">No Analysis Data</h2>
              <p className="text-yellow-700 mb-6">The analysis completed but no page data was found. This might be due to the website being inaccessible or blocking crawlers.</p>
              <Button 
                onClick={() => router.push(`/dashboard/projects/${projectId}/analyses/new`)}
                className="w-full"
              >
                <Search className="h-4 w-4 mr-2" />
                Try New Analysis
              </Button>
            </CardContent>
          </Card>
        </m.div>
      </div>
    );
  }

  const page = results.pages[0]; // Get the first (and usually only) page

  const scoreItems = [
    { 
      label: 'Overall', 
      score: results?.summary?.overallScore || 0, 
      icon: <Target className="h-5 w-5" />,
      description: 'Overall SEO Performance'
    },
    { 
      label: 'Technical', 
      score: results?.summary?.technicalScore || 0, 
      icon: <BarChart3 className="h-5 w-5" />,
      description: 'Technical Implementation'
    },
    { 
      label: 'Content', 
      score: results?.summary?.contentScore || 0, 
      icon: <FileText className="h-5 w-5" />,
      description: 'Content Quality'
    },
    { 
      label: 'On-Page', 
      score: results?.summary?.onpageScore || 0, 
      icon: <Globe className="h-5 w-5" />,
      description: 'On-Page SEO'
    },
    { 
      label: 'UX', 
      score: results?.summary?.uxScore || 0, 
      icon: <TrendingUp className="h-5 w-5" />,
      description: 'User Experience'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <m.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href={`/dashboard/projects/${projectId}/analyses`}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  SEO Analysis Results
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                  Complete analysis for {results?.url || 'Unknown URL'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </m.div>

          {/* Analysis Summary Card */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Analysis Summary</CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <Globe className="h-3 w-3" />
                        {results?.url}
                        <ExternalLink className="h-3 w-3" />
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Analyzed on</p>
                    <p className="text-sm font-medium">
                      {results?.crawledAt ? new Date(results.crawledAt).toLocaleString() : 'Unknown date'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{results?.summary?.crawlDuration || 0}ms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{results?.summary?.totalPages || 1} page{(results?.summary?.totalPages || 1) !== 1 ? 's' : ''}</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Analysis Complete
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </m.div>

          {/* SEO Scores Grid */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8"
          >
            {scoreItems.map((item, index) => (
              <m.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card className={`relative overflow-hidden border-2 ${item.score >= 90 ? 'border-green-200 bg-gradient-to-br from-green-50 to-green-100' : item.score >= 70 ? 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100' : 'border-red-200 bg-gradient-to-br from-red-50 to-red-100'}`}>
                  <CardContent className="p-6 text-center">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3 ${item.score >= 90 ? 'bg-green-100 text-green-600' : item.score >= 70 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                      {item.icon}
                    </div>
                    <div className={`text-4xl font-bold mb-1 ${getScoreTextColor(item.score)}`}>
                      {item.score}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 mb-1">{item.label}</div>
                    <div className="text-xs text-gray-600 mb-3">{item.description}</div>
                    <div className="w-full bg-white/60 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ease-out ${item.score >= 90 ? 'bg-green-500' : item.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${item.score}%` }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
              </m.div>
            ))}
          </m.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Page Information */}
              <m.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Page Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-900 block mb-2">Title</label>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-gray-900">{page?.metadata?.title || 'No title found'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-900 block mb-2">Meta Description</label>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-gray-900">{page?.metadata?.description || 'No meta description found'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-900 block mb-2">Status Code</label>
                        <div className={`p-3 rounded-lg border text-center font-mono ${page?.statusCode === 200 ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                          {page?.statusCode || 'Unknown'}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-900 block mb-2">H1 Tags</label>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center font-mono">
                          {page?.stats?.h1Count || 0}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </m.div>

              {/* Link Analysis */}
              <m.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Link2 className="h-5 w-5 text-purple-600" />
                      Link Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200">
                        <div className="text-3xl font-bold text-blue-700 mb-2">{page?.stats?.internalLinks || 0}</div>
                        <div className="text-sm font-semibold text-blue-800">Internal Links</div>
                        <div className="text-xs text-blue-600 mt-1">Links within your site</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border-2 border-purple-200">
                        <div className="text-3xl font-bold text-purple-700 mb-2">{page?.stats?.externalLinks || 0}</div>
                        <div className="text-sm font-semibold text-purple-800">External Links</div>
                        <div className="text-xs text-purple-600 mt-1">Links to other sites</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </m.div>

              {/* Issues */}
              {results.issues && results.issues.length > 0 && (
                <m.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        Issues Found ({results.issues.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {results.issues.map((issue, index) => (
                        <m.div 
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 + index * 0.1 }}
                          className={`p-4 rounded-xl border-2 ${getSeverityColor(issue.severity)}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-medium flex-1">{issue.message}</p>
                            <Badge variant="outline" className={`text-xs ${getSeverityColor(issue.severity)} border-current`}>
                              {issue.severity.toUpperCase()}
                            </Badge>
                          </div>
                        </m.div>
                      ))}
                    </CardContent>
                  </Card>
                </m.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <m.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700 flex items-center gap-2">
                        {/* eslint-disable-next-line jsx-a11y/alt-text */}
                        <Image className="h-4 w-4" />
                        Images without alt text
                      </span>
                      <span className="font-bold text-gray-900">{page?.stats?.imgWithoutAlt || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Title length</span>
                      <span className="font-bold text-gray-900">{page?.metadata?.title?.length || 0} chars</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Description length</span>
                      <span className="font-bold text-gray-900">{page?.metadata?.description?.length || 0} chars</span>
                    </div>
                  </CardContent>
                </Card>
              </m.div>

              {/* Recommendations */}
              {results.recommendations && results.recommendations.length > 0 && (
                <m.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-900">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {results.recommendations.slice(0, 5).map((rec, index) => (
                        <m.div 
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                          className="p-3 bg-white/60 backdrop-blur-sm border border-green-200 rounded-lg"
                        >
                          <p className="text-sm text-green-800 leading-relaxed">{rec}</p>
                        </m.div>
                      ))}
                    </CardContent>
                  </Card>
                </m.div>
              )}

              {/* Actions */}
              <m.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="font-bold text-blue-900">Next Steps</h3>
                      <p className="text-blue-700 text-sm leading-relaxed">
                        Your SEO analysis is complete! Use the insights above to improve your website's performance.
                      </p>
                      <div className="space-y-3">
                        <Button 
                          onClick={() => router.push(`/dashboard/projects/${projectId}/analyses/new`)}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Run New Analysis
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => router.push(`/dashboard/projects/${projectId}`)}
                          className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back to Project
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </m.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 