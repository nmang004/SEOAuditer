'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { AnalysisContent } from './analysis-content';
import { AnimateFadeIn, AnimateStagger, AnimateStaggerItem } from '@/components/animations';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '@/components/navigation/breadcrumb';
import { MobileNavigation } from '@/components/navigation/mobile-navigation';
import { analysisNavItems } from '@/components/navigation/nav-items';

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );
}

export default function CrawlSubmissionPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/crawl/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          projectId: 'manual', // or let user pick
          userId: 'manual', // or from auth
          crawlOptions: { maxPages: 5, crawlDepth: 2, extractOptions: {} },
        }),
      });
      const data = await res.json();
      if (res.ok && data.jobId) {
        router.push(`/analysis/results/${data.jobId}`);
      } else {
        setError(data.error || 'Failed to start crawl');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start crawl');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Breadcrumb />
        <MobileNavigation navItems={analysisNavItems} />
      </div>
      <AnimateStagger className="space-y-8">
        <AnimateStaggerItem>
          <AnimateFadeIn>
            <Suspense fallback={<LoadingSkeleton />}>
              <div className="max-w-xl mx-auto mt-16 p-8 bg-white rounded shadow">
                <h1 className="text-2xl font-bold mb-4">SEO Site Crawler</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="url" className="block font-medium mb-1">Website URL</label>
                    <input
                      id="url"
                      type="url"
                      required
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
                    />
                  </div>
                  {error && <div className="text-red-600 text-sm">{error}</div>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
                  >
                    {loading ? 'Starting Crawl...' : 'Start Crawl'}
                  </button>
                </form>
                <p className="mt-4 text-gray-500 text-sm">
                  Enter a website URL to run a full SEO analysis. You'll be redirected to the results page when the crawl starts.
                </p>
              </div>
            </Suspense>
          </AnimateFadeIn>
        </AnimateStaggerItem>
      </AnimateStagger>
    </div>
  );
}
