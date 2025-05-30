'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

interface Analysis {
  id: string;
  url: string;
  projectId: string;
  projectName: string;
  score: number;
  previousScore?: number;
  status: 'completed' | 'analyzing' | 'failed' | 'queued';
  createdAt: string;
  completedAt?: string;
  criticalIssues: number;
  totalIssues: number;
  favicon?: string;
}

export default function AnalysesPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'analyzing' | 'failed'>('all');

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        // Mock data - replace with actual API call
        const mockAnalyses: Analysis[] = [
          {
            id: 'analysis-1',
            url: 'https://example.com',
            projectId: 'proj-1',
            projectName: 'Example.com',
            score: 85,
            previousScore: 78,
            status: 'completed',
            createdAt: '2024-01-15T10:00:00Z',
            completedAt: '2024-01-15T10:15:00Z',
            criticalIssues: 3,
            totalIssues: 12,
            favicon: 'https://www.google.com/s2/favicons?domain=example.com'
          },
          {
            id: 'analysis-2',
            url: 'https://test-site.com',
            projectId: 'proj-2',
            projectName: 'Test Site',
            score: 72,
            status: 'analyzing',
            createdAt: '2024-01-15T09:30:00Z',
            criticalIssues: 8,
            totalIssues: 25,
            favicon: 'https://www.google.com/s2/favicons?domain=test-site.com'
          },
          {
            id: 'analysis-3',
            url: 'https://example.com/blog',
            projectId: 'proj-1',
            projectName: 'Example.com',
            score: 78,
            previousScore: 82,
            status: 'completed',
            createdAt: '2024-01-14T15:20:00Z',
            completedAt: '2024-01-14T15:35:00Z',
            criticalIssues: 5,
            totalIssues: 18,
            favicon: 'https://www.google.com/s2/favicons?domain=example.com'
          }
        ];
        
        setTimeout(() => {
          setAnalyses(mockAnalyses);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching analyses:', error);
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, []);

  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch = 
      analysis.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      analysis.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || analysis.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Analysis['status']) => {
    switch (status) {
      case 'completed': return 'default';
      case 'analyzing': return 'secondary';
      case 'failed': return 'destructive';
      case 'queued': return 'outline';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analyses</h1>
          <p className="text-muted-foreground">
            View and manage all your SEO analyses across projects
          </p>
        </div>
        <Link href="/analyses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Analysis
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search analyses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="analyzing">Analyzing</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Analyses List */}
      {filteredAnalyses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No analyses found</p>
          <Link href="/analyses/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Start Your First Analysis
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnalyses.map((analysis, index) => (
            <motion.div
              key={analysis.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        {analysis.favicon ? (
                          <img 
                            src={analysis.favicon} 
                            alt={`${analysis.projectName} favicon`}
                            className="w-6 h-6"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-primary/20 rounded" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {analysis.url}
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                        <CardDescription>
                          Project: <Link href={`/projects/${analysis.projectId}`} className="hover:underline">{analysis.projectName}</Link>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={getStatusColor(analysis.status)}>
                        {analysis.status}
                      </Badge>
                      {analysis.status === 'completed' && (
                        <Link href={`/analyses/${analysis.id}/overview`}>
                          <Button variant="outline" size="sm">View Results</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-6 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">SEO Score</p>
                      {analysis.status === 'completed' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{analysis.score}</span>
                          {analysis.previousScore && (
                            <Badge 
                              variant={analysis.score > analysis.previousScore ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {analysis.score > analysis.previousScore ? '+' : ''}
                              {analysis.score - analysis.previousScore}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-muted-foreground mb-1">Critical Issues</p>
                      <span className="text-2xl font-bold text-destructive">{analysis.criticalIssues}</span>
                    </div>
                    
                    <div>
                      <p className="text-muted-foreground mb-1">Total Issues</p>
                      <span className="text-2xl font-bold">{analysis.totalIssues}</span>
                    </div>
                    
                    <div>
                      <p className="text-muted-foreground mb-1">
                        {analysis.status === 'completed' ? 'Completed' : 'Started'}
                      </p>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs">
                          {formatDate(analysis.completedAt || analysis.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
} 