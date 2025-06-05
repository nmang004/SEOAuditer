'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Calendar, 
  BarChart3, 
  Eye, 
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  ArrowLeft,
  TrendingUp
} from 'lucide-react';

interface Analysis {
  jobId: string;
  url: string;
  projectId: string;
  status: string;
  createdAt: string;
  source: string;
  results?: {
    seoScore: number;
  };
}

export default function AnalysesListPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyses();
  }, [projectId]);

  const loadAnalyses = () => {
    setLoading(true);
    
    const token = localStorage.getItem('token');
    const isAdminBypass = token?.includes('admin-access-token');
    
    if (isAdminBypass) {
      // Load analyses from localStorage for admin users
      const storedJobs = JSON.parse(localStorage.getItem('adminAnalysisJobs') || '[]');
      const projectAnalyses = storedJobs.filter((job: Analysis) => job.projectId === projectId);
      
      // Load cached results for each analysis
      const analysesWithResults = projectAnalyses.map((analysis: Analysis) => {
        const cacheKey = `analysis_results_${analysis.jobId}`;
        const cachedResults = localStorage.getItem(cacheKey);
        
        if (cachedResults) {
          try {
            const results = JSON.parse(cachedResults);
            return {
              ...analysis,
              status: 'completed',
              results: results.results
            };
          } catch (e) {
            console.error('Failed to parse cached results:', e);
          }
        }
        
        return analysis;
      });
      
      console.log('[Analyses List] Loaded admin analyses:', analysesWithResults);
      setAnalyses(analysesWithResults);
    } else {
      // For regular users, would fetch from backend
      setAnalyses([]);
    }
    
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'in_progress':
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-400" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent">
            <Link href={`/dashboard/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Project Analyses
            </h1>
            <p className="text-gray-300 mt-2 text-lg">
              View and manage all SEO analyses for this project
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadAnalyses}
            disabled={loading}
            className="border border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Button asChild className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0">
            <Link href={`/dashboard/projects/${projectId}/analyses/new`}>
              <Plus className="h-4 w-4 mr-2" />
              New Analysis
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total</p>
              <p className="text-2xl font-bold text-white">{analyses.length}</p>
            </div>
            <BarChart3 className="h-5 w-5 text-indigo-400" />
          </div>
        </div>
        <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-green-400">
                {analyses.filter(a => a.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-400" />
          </div>
        </div>
        <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Avg Score</p>
              <p className="text-2xl font-bold text-blue-400">
                {analyses.filter(a => a.results?.seoScore).length > 0 
                  ? Math.round(analyses.filter(a => a.results?.seoScore).reduce((sum, a) => sum + (a.results?.seoScore || 0), 0) / analyses.filter(a => a.results?.seoScore).length)
                  : '-'
                }
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-blue-400" />
          </div>
        </div>
        <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">
                {analyses.filter(a => a.status === 'pending').length}
              </p>
            </div>
            <Clock className="h-5 w-5 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Analyses List */}
      <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-400" />
            Analysis History
          </h2>
        </div>
        <div className="p-0">
          {loading ? (
            <div className="p-6 text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-gray-300">Loading analyses...</p>
            </div>
          ) : analyses.length === 0 ? (
            <div className="p-12 text-center">
              <div className="h-16 w-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Analyses Yet</h3>
              <p className="text-gray-300 mb-6">
                Start your first SEO analysis to get insights about your website.
              </p>
              <Button asChild className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0">
                <Link href={`/dashboard/projects/${projectId}/analyses/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start Your First Analysis
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {analyses.map((analysis) => (
                <div key={analysis.jobId} className="p-6 hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(analysis.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white truncate">
                            Analysis #{analysis.jobId.slice(-8)}
                          </h3>
                          <div className={`px-2 py-1 rounded text-xs border ${getStatusColor(analysis.status)}`}>
                            {analysis.status}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(analysis.createdAt)}
                          </div>
                          <div className="flex items-center gap-1 truncate">
                            <span className="truncate">{analysis.url}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {analysis.results?.seoScore && (
                        <div className="text-right">
                          <div className="text-sm text-gray-400">Score</div>
                          <div className={`text-2xl font-bold ${getScoreColor(analysis.results.seoScore)}`}>
                            {analysis.results.seoScore}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {analysis.status === 'completed' ? (
                          <Button asChild size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0">
                            <Link href={`/dashboard/projects/${projectId}/analyses/${analysis.jobId}`}>
                              <Eye className="h-3 w-3 mr-1" />
                              View Results
                            </Link>
                          </Button>
                        ) : (
                          <button className="border border-gray-600 text-gray-400 px-3 py-1 rounded text-sm flex items-center gap-1" disabled>
                            <Clock className="h-3 w-3" />
                            In Progress
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}