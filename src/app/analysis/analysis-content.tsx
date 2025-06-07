'use client';

import { useState, useEffect, Suspense, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { AnimateFadeIn, AnimateStagger, AnimateStaggerItem } from '@/components/animations';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { QuickJumpNavigation } from '@/components/navigation/quick-jump-navigation';
import { analysisNavItems } from '@/components/navigation/nav-items';

// Import analysis components
import { AnalysisHeader } from '@/components/analysis/analysis-header';
import { IssuesDashboard } from '@/components/analysis/issues-dashboard';
import { TechnicalAnalysis } from '@/components/analysis/technical-analysis';
import { ContentAnalysis } from '@/components/analysis/content-analysis';
import { RecommendationsPanel } from '@/components/analysis/recommendations-panel';
import { HistoricalTrends } from '@/components/analysis/historical-trends';

const LazySEOScoreBreakdown = lazy(() => import('@/components/analysis/score-breakdown').then(m => ({ default: m.SEOScoreBreakdown })));
const LazyHistoricalTrends = lazy(() => import('@/components/analysis/historical-trends').then(m => ({ default: m.HistoricalTrends })));
import { SEOScoreBreakdownProps } from '@/lib/analysis-types';
import { generateIssues, generateTechnicalAnalysis, generateContentAnalysis, generateRecommendations } from '@/lib/mock-data-analysis';
import { SEOIssue, FilterState } from '@/lib/analysis-types';

// Types
type AnalysisData = {
  project: {
    name: string;
    url: string;
    lastScanned: string;
  };
  overallScore: number;
  previousScore: number;
  categories: {
    technical: number;
    content: number;
    onPage: number;
    ux: number;
  };
  issues: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recommendations: number;
};

// Mock data for the analysis
const analysisData: AnalysisData = {
  project: {
    name: 'Example Website',
    url: 'example.com',
    lastScanned: new Date().toISOString(),
  },
  overallScore: 78,
  previousScore: 65,
  categories: {
    technical: 85,
    content: 72,
    onPage: 65,
    ux: 91,
  },
  issues: {
    critical: 3,
    high: 7,
    medium: 12,
    low: 5,
  },
  recommendations: 15,
};

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

export function AnalysisContent() {
  const [activeTab, setActiveTab] = useState('issues');
  type TimeRange = '1m' | '3m' | '6m' | '1y';
  const [timeRange, setTimeRange] = useState<TimeRange>('6m');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Add state for issues and filters
  const [issues, setIssues] = useState<SEOIssue[]>(() => generateIssues(50));
  const [issueFilters, setIssueFilters] = useState<FilterState>({ severity: [], category: [], status: [] });
  
  // Simulate data loading
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        setError('Failed to load analysis data');
        toast({
          title: 'Error',
          description: 'Failed to load analysis data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [timeRange, toast]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };

  const handleExport = () => {
    toast({
      title: 'Export started',
      description: 'Your report is being prepared for download.',
    });
    // Simulate export
    setTimeout(() => {
      toast({
        title: 'Export complete',
        description: 'Your report has been downloaded.',
      });
    }, 1500);
  };

  const handleIssueAction = (issueId: string, action: string) => {
    setIssues(prev => prev.map(issue =>
      issue.id === issueId
        ? { ...issue, status: action === 'fixed' ? 'fixed' : action === 'ignored' ? 'ignored' : issue.status }
        : issue
    ));
  };

  const [technicalAnalysis] = useState(() => generateTechnicalAnalysis());
  const previousTechnicalAnalysis = undefined; // For now, can be set to another mock for before/after
  const [contentAnalysis] = useState(() => generateContentAnalysis());
  const [recommendations] = useState(() => generateRecommendations(6));

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AnimateFadeIn>
        <AnalysisHeader 
          project={analysisData.project}
          score={analysisData.overallScore}
          previousScore={analysisData.previousScore}
        />

        <div className="mb-4">
          <QuickJumpNavigation sections={analysisNavItems.map(({ label, href }) => ({ label, href }))} />
        </div>

        {/* Advanced SEO Score Breakdown */}
        <div className="mb-8" id="score">
          <Suspense fallback={<div className="h-40 flex items-center justify-center"><span>Loading score breakdown...</span></div>}>
            <LazySEOScoreBreakdown
              overallScore={analysisData.overallScore}
              categories={{
                technical: { score: analysisData.categories.technical, issues: 3, improvements: 5 },
                content: { score: analysisData.categories.content, issues: 4, improvements: 4 },
                onPage: { score: analysisData.categories.onPage, issues: 6, improvements: 3 },
                userExperience: { score: analysisData.categories.ux, issues: 2, improvements: 2 },
              }}
              showComparison={{
                previousScore: analysisData.previousScore,
                previousCategories: {
                  technical: { score: 70, issues: 5, improvements: 6 },
                  content: { score: 60, issues: 6, improvements: 5 },
                  onPage: { score: 55, issues: 8, improvements: 4 },
                  userExperience: { score: 80, issues: 3, improvements: 3 },
                },
                scanDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
              }}
            />
          </Suspense>
        </div>
        {/* End SEO Score Breakdown */}
      </AnimateFadeIn>

      <AnimateFadeIn delay={0.2}>
        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange} 
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="issues">Issues</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={handleExport}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Export</span>
            </Button>
          </div>

          <AnimatePresence mode="wait">
            <m.div
              key={activeTab}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={fadeInUp}
              transition={{ duration: 0.3 }}
            >
              <TabsContent value="issues" className="mt-6">
                <div className="grid gap-6">
                  <IssuesDashboard
                    issues={issues}
                    filters={issueFilters}
                    onFilterChange={setIssueFilters}
                    onIssueAction={handleIssueAction}
                  />
                </div>
              </TabsContent>

              <TabsContent value="technical" className="mt-6">
                <TechnicalAnalysis technicalAnalysis={technicalAnalysis} previousAnalysis={previousTechnicalAnalysis} />
              </TabsContent>

              <TabsContent value="content" className="mt-6">
                <ContentAnalysis contentAnalysis={contentAnalysis} />
              </TabsContent>

              <TabsContent value="trends" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-end gap-2">
                    {(['1m', '3m', '6m', '1y'] as const).map((range) => (
                      <Button
                        key={range}
                        variant={timeRange === range ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleTimeRangeChange(range as TimeRange)}
                        className="h-8 text-xs"
                      >
                        {range.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                  <Suspense fallback={<div className="h-80 flex items-center justify-center"><span>Loading trends chart...</span></div>}>
                    <LazyHistoricalTrends timeRange={timeRange} />
                  </Suspense>
                </div>
              </TabsContent>

              <TabsContent value="recommendations" className="mt-6">
                <RecommendationsPanel recommendations={recommendations} maxVisible={6} allowCustomOrder showProgress />
              </TabsContent>
            </m.div>
          </AnimatePresence>
        </Tabs>
      </AnimateFadeIn>
    </div>
  );
}