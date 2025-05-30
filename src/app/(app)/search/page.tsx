'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, Folder, BarChart, AlertTriangle, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SearchResult {
  id: string;
  type: 'project' | 'analysis' | 'issue';
  title: string;
  description: string;
  url?: string;
  projectName?: string;
  projectId?: string;
  analysisId?: string;
  relevanceScore: number;
  createdAt: string;
  metadata?: Record<string, any>;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'projects' | 'analyses' | 'issues'>('all');

  useEffect(() => {
    const initialQuery = searchParams.get('q');
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Mock search results - replace with actual API call
      const mockResults: SearchResult[] = [
        {
          id: 'proj-1',
          type: 'project',
          title: 'Example.com',
          description: 'Main business website with e-commerce functionality',
          url: 'https://example.com',
          relevanceScore: 0.95,
          createdAt: '2024-01-10T09:00:00Z',
          metadata: {
            score: 85,
            criticalIssues: 3,
            lastScan: '2024-01-15T10:00:00Z'
          }
        },
        {
          id: 'analysis-1',
          type: 'analysis',
          title: 'Homepage SEO Analysis',
          description: 'Comprehensive SEO audit of the main landing page',
          url: 'https://example.com',
          projectName: 'Example.com',
          projectId: 'proj-1',
          relevanceScore: 0.88,
          createdAt: '2024-01-15T10:00:00Z',
          metadata: {
            score: 85,
            status: 'completed',
            pagesCrawled: 247
          }
        },
        {
          id: 'issue-1',
          type: 'issue',
          title: 'Missing meta descriptions',
          description: 'Several pages are missing meta descriptions, which impacts search engine visibility.',
          url: 'https://example.com',
          projectName: 'Example.com',
          projectId: 'proj-1',
          analysisId: 'analysis-1',
          relevanceScore: 0.75,
          createdAt: '2024-01-15T10:15:00Z',
          metadata: {
            severity: 'high',
            category: 'onpage',
            affectedPages: 12
          }
        }
      ];
      
      // Filter based on search query
      const filtered = mockResults.filter(result => 
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.projectName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setTimeout(() => {
        setResults(filtered);
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error performing search:', error);
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const filteredResults = results.filter(result => 
    typeFilter === 'all' || 
    (typeFilter === 'projects' && result.type === 'project') ||
    (typeFilter === 'analyses' && result.type === 'analysis') ||
    (typeFilter === 'issues' && result.type === 'issue')
  );

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'project': return <Folder className="h-4 w-4 text-blue-600" />;
      case 'analysis': return <BarChart className="h-4 w-4 text-green-600" />;
      case 'issue': return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
  };

  const getResultLink = (result: SearchResult) => {
    switch (result.type) {
      case 'project': return `/projects/${result.id}`;
      case 'analysis': return `/analyses/${result.id}/overview`;
      case 'issue': return `/analyses/${result.analysisId}/issues`;
      default: return '#';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Search</h1>
        <p className="text-muted-foreground mb-6">
          Find projects, analyses, and issues across your SEO workspace
        </p>
        
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search for projects, analyses, issues..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </form>
      </div>

      {query && (
        <>
          {/* Filter Tabs */}
          <Tabs value={typeFilter} onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}>
            <TabsList>
              <TabsTrigger value="all">
                All ({filteredResults.length})
              </TabsTrigger>
              <TabsTrigger value="projects">
                Projects ({results.filter(r => r.type === 'project').length})
              </TabsTrigger>
              <TabsTrigger value="analyses">
                Analyses ({results.filter(r => r.type === 'analysis').length})
              </TabsTrigger>
              <TabsTrigger value="issues">
                Issues ({results.filter(r => r.type === 'issue').length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search Results */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No results found</p>
              <p className="text-muted-foreground">
                Try adjusting your search terms or filters
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResults.map((result) => (
                <Card key={`${result.type}-${result.id}`} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getResultIcon(result.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">
                              <Link href={getResultLink(result)} className="hover:underline">
                                {result.title}
                              </Link>
                            </CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {result.type}
                            </Badge>
                          </div>
                          
                          <CardDescription className="mb-2">
                            {result.description}
                          </CardDescription>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {result.url && (
                              <>
                                <div className="flex items-center gap-1">
                                  <ExternalLink className="h-3 w-3" />
                                  <span>{result.url}</span>
                                </div>
                                <span>•</span>
                              </>
                            )}
                            
                            {result.projectName && (
                              <>
                                <span>
                                  Project: <Link href={`/projects/${result.projectId}`} className="hover:underline text-foreground">{result.projectName}</Link>
                                </span>
                                <span>•</span>
                              </>
                            )}
                            
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(result.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Type-specific metadata */}
                      <div className="flex items-center gap-2">
                        {result.type === 'project' && result.metadata && (
                          <div className="text-right text-sm">
                            <p className="font-bold">{result.metadata.score}</p>
                            <p className="text-muted-foreground">Score</p>
                          </div>
                        )}
                        
                        {result.type === 'analysis' && result.metadata && (
                          <Badge variant={result.metadata.status === 'completed' ? 'default' : 'secondary'}>
                            {result.metadata.status}
                          </Badge>
                        )}
                        
                        {result.type === 'issue' && result.metadata && (
                          <Badge variant={
                            result.metadata.severity === 'critical' ? 'destructive' :
                            result.metadata.severity === 'high' ? 'secondary' : 'outline'
                          }>
                            {result.metadata.severity}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {!query && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Start searching</p>
          <p className="text-muted-foreground">
            Enter a search term to find projects, analyses, and issues
          </p>
        </div>
      )}
    </div>
  );
} 