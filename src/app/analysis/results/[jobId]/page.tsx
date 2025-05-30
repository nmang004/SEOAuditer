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
  // Minimal filter state for IssuesDashboard - moved to top
  const [filters, setFilters] = useState({ severity: [], category: [], status: [] });

  const handleFilterChange = (f: any) => setFilters(f);
  const handleIssueAction = () => {};

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    fetch(`/api/crawl/results/${jobId}`)
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

  // Assume results.pages[0] is the main page analysis
  const page = results.pages?.[0] || results;

  // Prepare props for score breakdown
  const overallScore = page.score ?? page.overallScore;
  const categories = {
    technical: { score: page.technicalScore ?? 0, issues: 0, improvements: 0 },
    content: { score: page.contentScore ?? 0, issues: 0, improvements: 0 },
    onPage: { score: page.onpageScore ?? 0, issues: 0, improvements: 0 },
    userExperience: { score: page.uxScore ?? 0, issues: 0, improvements: 0 },
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded shadow space-y-8">
      <h1 className="text-2xl font-bold mb-2">SEO Analysis Results</h1>
      <div className="text-gray-600 mb-6">URL: <span className="font-mono">{page.url}</span></div>
      <SEOScoreBreakdown overallScore={overallScore} categories={categories} />
      <TechnicalAnalysis technicalAnalysis={page.technicalSEO} />
      <ContentAnalysis contentAnalysis={page.content} />
      <IssuesDashboard issues={page.seoIssues || results.issues || []} filters={filters} onFilterChange={handleFilterChange} onIssueAction={handleIssueAction} />
      <RecommendationsPanel recommendations={page.recommendations || results.recommendations || []} />
    </div>
  );
} 