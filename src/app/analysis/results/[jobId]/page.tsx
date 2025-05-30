'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { TechnicalAnalysis } from '@/components/analysis/technical-analysis';
import { ContentAnalysis } from '@/components/analysis/content-analysis';
import { RecommendationsPanel } from '@/components/analysis/recommendations-panel';
import { SEOScoreBreakdown } from '@/components/analysis/score-breakdown';
import { IssuesDashboard } from '@/components/analysis/issues-dashboard';

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

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded shadow space-y-8">
      <h1 className="text-2xl font-bold mb-2">SEO Analysis Results</h1>
      <div className="text-gray-600 mb-6">URL: <span className="font-mono">{page.url || results.url}</span></div>
      <SEOScoreBreakdown overallScore={overallScore} categories={categories} />
      <TechnicalAnalysis technicalAnalysis={page.technicalSEO} />
      <ContentAnalysis contentAnalysis={page.content} />
      <IssuesDashboard 
        issues={page.issues || results.issues || []} 
        filters={filters} 
        onFilterChange={handleFilterChange} 
        onIssueAction={handleIssueAction} 
      />
      <RecommendationsPanel 
        recommendations={page.recommendations || results.recommendations || []} 
      />
    </div>
  );
} 