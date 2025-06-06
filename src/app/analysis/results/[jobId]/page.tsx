'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { EnhancedAnalysisDashboard } from '@/components/analysis/enhanced-analysis-dashboard';
import { mockEnhancedRecommendations } from '@/lib/mock-enhanced-recommendations';
import { TechnicalAnalysis } from '@/components/analysis/technical-analysis';
import { ContentAnalysis } from '@/components/analysis/content-analysis';
import { RecommendationsPanel } from '@/components/analysis/recommendations-panel';
import { SEOScoreBreakdown } from '@/components/analysis/score-breakdown';
import { IssuesDashboard } from '@/components/analysis/issues-dashboard';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, BarChart3, FileText, Wrench } from 'lucide-react';

export default function CrawlResultsPage() {
  const params = useParams();
  const jobId = params?.jobId as string;
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ severity: [], category: [], status: [] });

  const handleFilterChange = (f: any) => setFilters(f);
  const handleIssueAction = () => {};

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    fetch(`/api/crawl/results/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
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

  if (loading) return <div className="max-w-2xl mx-auto mt-16 text-center">Loading crawl results...</div>;
  if (error) return <div className="max-w-2xl mx-auto mt-16 text-center text-red-600">{error}</div>;
  if (!results) return <div className="max-w-2xl mx-auto mt-16 text-center">No results found.</div>;

  // Handle the case where there's no pages data
  if (!results.pages || results.pages.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-16 text-center p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="text-yellow-600 mb-4">
          <svg className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Analysis Data</h3>
        <p className="text-yellow-600 mb-4">
          The analysis completed but no page data was found. This might be due to the website being inaccessible or blocking crawlers.
        </p>
        <button 
          onClick={() => window.history.back()}
          className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
        >
          Try New Analysis
        </button>
      </div>
    );
  }

  // Get the main page analysis - use the correct data structure
  const page = results.pages[0];
  const scores = page.scores || {};
  const summary = results.summary || {};

  // Prepare props for score breakdown with correct field mapping
  const overallScore = scores.overall || summary.overallScore || 0;
  const categories = {
    technical: { score: scores.technical || summary.technicalScore || 0, issues: 0, improvements: 0 },
    content: { score: scores.content || summary.contentScore || 0, issues: 0, improvements: 0 },
    onPage: { score: scores.onpage || summary.onpageScore || 0, issues: 0, improvements: 0 },
    userExperience: { score: scores.ux || summary.uxScore || 0, issues: 0, improvements: 0 },
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          SEO Analysis Results
        </h1>
        <p className="text-gray-300 text-lg">
          URL: <span className="font-mono text-indigo-400 break-all">{page.url || results.url}</span>
        </p>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
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
            Analysis
          </TabsTrigger>
          <TabsTrigger 
            value="technical" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
          >
            <Wrench className="w-4 h-4 mr-2" />
            Technical
          </TabsTrigger>
          <TabsTrigger 
            value="content" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            Content
          </TabsTrigger>
        </TabsList>

        {/* Enhanced Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <EnhancedAnalysisDashboard
            recommendations={mockEnhancedRecommendations}
            currentScore={overallScore}
            onImplementRecommendation={handleImplementRecommendation}
            onMarkComplete={handleMarkComplete}
            onExportPlan={handleExportPlan}
          />
        </TabsContent>

        {/* Traditional Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <Card className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
            <SEOScoreBreakdown overallScore={overallScore} categories={categories} />
          </Card>
          
          <Card className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
            <IssuesDashboard 
              issues={page.issues || results.issues || []} 
              filters={filters} 
              onFilterChange={handleFilterChange} 
              onIssueAction={handleIssueAction} 
            />
          </Card>
          
          <Card className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
            <RecommendationsPanel 
              recommendations={page.recommendations || results.recommendations || []} 
            />
          </Card>
        </TabsContent>

        {/* Technical Analysis Tab */}
        <TabsContent value="technical" className="space-y-6">
          <Card className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
            <TechnicalAnalysis technicalAnalysis={page.technicalSEO} />
          </Card>
        </TabsContent>

        {/* Content Analysis Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
            <ContentAnalysis contentAnalysis={page.content} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 