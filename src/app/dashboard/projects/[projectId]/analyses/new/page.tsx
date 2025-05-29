'use client';
import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function NewAnalysisPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
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
          projectId,
          userId: 'manual',
          crawlOptions: { maxPages: 5, crawlDepth: 2, extractOptions: {} },
        }),
      });
      let data;
      try {
        data = await res.json();
      } catch (e) {
        setError('Server error: Invalid response (not JSON).');
        setLoading(false);
        return;
      }
      if (res.ok && data.jobId) {
        router.push(`/dashboard/projects/${projectId}/analyses/${data.jobId}`);
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
    <div className="max-w-xl mx-auto mt-16 p-8 bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-2xl shadow-xl border border-blue-100">
      <h1 className="text-3xl font-extrabold mb-4 text-blue-900 tracking-tight">Start New SEO Analysis</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="url" className="block font-semibold mb-2 text-blue-800">Website URL</label>
          <input
            id="url"
            type="url"
            required
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full border-2 border-blue-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white text-lg text-blue-900 placeholder:text-blue-300 transition"
          />
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-shake"><svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" /></svg>{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-3 rounded-lg shadow-md hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition text-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading && <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>}
          {loading ? 'Starting Analysis...' : 'Start Analysis'}
        </button>
      </form>
      <p className="mt-6 text-gray-500 text-base text-center">
        Enter a website URL to run a full SEO analysis.<br />You'll be redirected to the results page when the analysis starts.
      </p>
    </div>
  );
} 