'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { AnimateFadeIn, AnimateStagger, AnimateStaggerItem } from '@/components/animations';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

// Import analysis components
import {
  AnalysisHeader,
  IssuesDashboard,
  TechnicalAnalysis,
  ContentAnalysis,
  RecommendationsPanel,
  HistoricalTrends
} from '@/components/analysis';

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

        <AnimateStagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-8">
          {Object.entries(analysisData.categories).map(([key, value]) => (
            <AnimateStaggerItem key={key}>
              <Card className="hover:shadow-lg transition-shadow h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{value}</div>
                  <div className="h-2 w-full bg-muted rounded-full mt-2 overflow-hidden">
                    <m.div 
                      className="h-full bg-primary rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </CardContent>
              </Card>
            </AnimateStaggerItem>
          ))}
        </AnimateStagger>
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
                <div className="grid gap-6 md:grid-cols-2">
                  <IssuesDashboard issues={analysisData.issues} />
                  <RecommendationsPanel count={analysisData.recommendations} />
                </div>
              </TabsContent>

              <TabsContent value="technical" className="mt-6">
                <TechnicalAnalysis />
              </TabsContent>

              <TabsContent value="content" className="mt-6">
                <ContentAnalysis />
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
                  <HistoricalTrends timeRange={timeRange} />
                </div>
              </TabsContent>
            </m.div>
          </AnimatePresence>
        </Tabs>
      </AnimateFadeIn>
    </div>
  );
}