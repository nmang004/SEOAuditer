'use client';

import { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { analysisNavTabs } from '@/lib/constants';

interface AnalysisData {
  id: string;
  url: string;
  projectId: string;
  projectName: string;
  score: number;
  status: 'completed' | 'analyzing' | 'failed';
  createdAt: string;
  completedAt?: string;
}

export default function AnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  // Extract current tab from pathname
  const currentTab = pathname.split('/').pop() || 'overview';

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        // Mock data - replace with actual API call
        const mockAnalysis: AnalysisData = {
          id: params.analysisId as string,
          url: 'https://example.com',
          projectId: 'proj-1',
          projectName: 'Example.com',
          score: 85,
          status: 'completed',
          createdAt: '2024-01-15T10:00:00Z',
          completedAt: '2024-01-15T10:15:00Z',
        };
        
        setTimeout(() => {
          setAnalysis(mockAnalysis);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching analysis:', error);
        setLoading(false);
      }
    };

    if (params.analysisId) {
      fetchAnalysis();
    }
  }, [params.analysisId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Analysis not found</p>
        <Link href="/analyses">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Analyses
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analysis Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/analyses">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              
              <div>
                <CardTitle className="flex items-center gap-2">
                  {analysis.url}
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Project: <Link href={`/projects/${analysis.projectId}`} className="hover:underline">{analysis.projectName}</Link>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge 
                variant={
                  analysis.status === 'completed' ? 'default' :
                  analysis.status === 'analyzing' ? 'secondary' : 'destructive'
                }
              >
                {analysis.status}
              </Badge>
              
              {analysis.status === 'completed' && (
                <div className="text-right">
                  <p className="text-2xl font-bold">{analysis.score}</p>
                  <p className="text-xs text-muted-foreground">SEO Score</p>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tab Navigation */}
      <div className="border-b">
        <Tabs value={currentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-9">
            {analysisNavTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} asChild>
                <Link href={`/analyses/${params.analysisId}/${tab.id}`}>
                  {tab.label}
                </Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {children}
      </div>
    </div>
  );
} 