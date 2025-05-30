'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, AlertCircle, Info, CheckCircle, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Issue {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'technical' | 'content' | 'onpage' | 'performance';
  status: 'new' | 'in-progress' | 'resolved' | 'dismissed';
  url: string;
  projectId: string;
  projectName: string;
  analysisId: string;
  detectedAt: string;
  affectedPages: number;
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        // Mock data - replace with actual API call
        const mockIssues: Issue[] = [
          {
            id: 'issue-1',
            title: 'Missing meta descriptions',
            description: 'Several pages are missing meta descriptions, which impacts search engine visibility.',
            severity: 'high',
            category: 'onpage',
            status: 'new',
            url: 'https://example.com',
            projectId: 'proj-1',
            projectName: 'Example.com',
            analysisId: 'analysis-1',
            detectedAt: '2024-01-15T10:15:00Z',
            affectedPages: 12
          },
          {
            id: 'issue-2',
            title: 'Large images without optimization',
            description: 'Multiple images are over 500KB and not optimized for web delivery.',
            severity: 'critical',
            category: 'performance',
            status: 'new',
            url: 'https://example.com',
            projectId: 'proj-1',
            projectName: 'Example.com',
            analysisId: 'analysis-1',
            detectedAt: '2024-01-15T10:15:00Z',
            affectedPages: 8
          },
          {
            id: 'issue-3',
            title: 'Broken internal links',
            description: 'Found broken internal links that return 404 errors.',
            severity: 'high',
            category: 'technical',
            status: 'in-progress',
            url: 'https://test-site.com',
            projectId: 'proj-2',
            projectName: 'Test Site',
            analysisId: 'analysis-2',
            detectedAt: '2024-01-14T15:35:00Z',
            affectedPages: 5
          }
        ];
        
        setTimeout(() => {
          setIssues(mockIssues);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching issues:', error);
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = 
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSeverity = severityFilter === 'all' || issue.severity === severityFilter;
    
    return matchesSearch && matchesSeverity;
  });

  const getSeverityIcon = (severity: Issue['severity']) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'high': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Info className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: Issue['severity']) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: Issue['status']) => {
    switch (status) {
      case 'new': return 'destructive';
      case 'in-progress': return 'secondary';
      case 'resolved': return 'default';
      case 'dismissed': return 'outline';
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
            <Skeleton key={i} className="h-24 w-full" />
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
          <h1 className="text-3xl font-bold">Issues</h1>
          <p className="text-muted-foreground">
            Track and manage SEO issues across all your projects
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs value={severityFilter} onValueChange={(value) => setSeverityFilter(value as typeof severityFilter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="critical">Critical</TabsTrigger>
            <TabsTrigger value="high">High</TabsTrigger>
            <TabsTrigger value="medium">Medium</TabsTrigger>
            <TabsTrigger value="low">Low</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">No issues found</p>
          <p className="text-muted-foreground">
            {searchQuery || severityFilter !== 'all' 
              ? 'Try adjusting your filters'
              : 'Great job! All your SEO issues have been resolved.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue) => (
            <Card key={issue.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{issue.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {issue.description}
                      </CardDescription>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>
                          Project: <Link href={`/projects/${issue.projectId}`} className="hover:underline text-foreground">{issue.projectName}</Link>
                        </span>
                        <span>•</span>
                        <span>{issue.affectedPages} pages affected</span>
                        <span>•</span>
                        <span>Detected {formatDate(issue.detectedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getSeverityColor(issue.severity)}>
                      {issue.severity}
                    </Badge>
                    <Badge variant={getStatusColor(issue.status)}>
                      {issue.status.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="px-2 py-1 bg-muted rounded text-xs font-medium">
                      {issue.category.toUpperCase()}
                    </span>
                    <span>{issue.url}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/analyses/${issue.analysisId}/issues`}>
                      <Button variant="outline" size="sm">
                        View in Analysis
                      </Button>
                    </Link>
                    <Button size="sm">
                      Mark as Resolved
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 