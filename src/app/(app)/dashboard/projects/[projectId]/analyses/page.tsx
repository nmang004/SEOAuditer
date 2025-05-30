'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { m } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Calendar, 
  BarChart3, 
  Eye, 
  TrendingUp, 
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

interface Analysis {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  analysis?: {
    overallScore?: number;
  };
}

interface AnalysesResponse {
  success: boolean;
  data: Analysis[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

interface ProjectData {
  id: string;
  name: string;
  url: string;
  status: string;
}

export default function AnalysesListPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const [project, setProject] = useState<ProjectData | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectLoading, setProjectLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const fetchProject = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }

      const result = await response.json();
      if (result.success) {
        setProject(result.data);
      }
    } catch (err) {
      console.error('Error fetching project:', err);
    } finally {
      setProjectLoading(false);
    }
  }, [projectId]);

  const fetchAnalyses = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${projectId}/analyses?limit=20`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analyses');
      }

      const result: AnalysesResponse = await response.json();
      if (result.success) {
        setAnalyses(result.data);
      } else {
        throw new Error('Failed to load analyses');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analyses');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
    fetchAnalyses();
  }, [fetchProject, fetchAnalyses]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'text-gray-500';
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
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

  const filteredAnalyses = analyses.filter(analysis => {
    if (filter === 'all') return true;
    return analysis.status === filter;
  });

  const statusCounts = {
    all: analyses.length,
    completed: analyses.filter(a => a.status === 'completed').length,
    in_progress: analyses.filter(a => a.status === 'in_progress').length,
    pending: analyses.filter(a => a.status === 'pending').length,
    failed: analyses.filter(a => a.status === 'failed').length,
  };

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/dashboard/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {project?.name ? `${project.name} - Analyses` : 'Project Analyses'}
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage all SEO analyses for this project
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalyses}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild>
            <Link href={`/dashboard/projects/${projectId}/analyses/new`}>
              <Plus className="h-4 w-4 mr-2" />
              New Analysis
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Card 
            key={status}
            className={`cursor-pointer transition-all hover:shadow-md ${
              filter === status ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setFilter(status)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground capitalize">
                    {status === 'all' ? 'Total' : status.replace('_', ' ')}
                  </p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
                {getStatusIcon(status)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analyses List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analysis History
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="capitalize">
                {filter === 'all' ? 'All Analyses' : filter.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-4 p-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Analyses</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <Button onClick={fetchAnalyses} variant="outline">
                Try Again
              </Button>
            </div>
          ) : filteredAnalyses.length === 0 ? (
            <div className="p-6 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {filter === 'all' ? 'No Analyses Yet' : `No ${filter.replace('_', ' ')} analyses`}
              </h3>
              <p className="text-muted-foreground mb-4">
                {filter === 'all' 
                  ? 'Start your first SEO analysis to get insights about your website.'
                  : `There are no analyses with ${filter.replace('_', ' ')} status.`
                }
              </p>
              {filter === 'all' && (
                <Button asChild>
                  <Link href={`/dashboard/projects/${projectId}/analyses/new`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Start Your First Analysis
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredAnalyses.map((analysis, index) => (
                <m.div
                  key={analysis.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-6 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(analysis.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">
                            Analysis #{analysis.id.slice(-8)}
                          </h3>
                          <Badge 
                            variant="outline" 
                            className={`${getStatusColor(analysis.status)} border text-xs`}
                          >
                            {analysis.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Started: {formatDate(analysis.startedAt)}
                          </div>
                          {analysis.completedAt && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Completed: {formatDate(analysis.completedAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {analysis.analysis?.overallScore && (
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Score</div>
                          <div className={`text-2xl font-bold ${getScoreColor(analysis.analysis.overallScore)}`}>
                            {analysis.analysis.overallScore}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {analysis.status === 'completed' && (
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/dashboard/projects/${projectId}/analyses/${analysis.id}`}>
                              <Eye className="h-3 w-3 mr-1" />
                              View Results
                            </Link>
                          </Button>
                        )}
                        {(analysis.status === 'pending' || analysis.status === 'in_progress') && (
                          <Button size="sm" variant="outline" disabled>
                            <Clock className="h-3 w-3 mr-1" />
                            In Progress
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </m.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 