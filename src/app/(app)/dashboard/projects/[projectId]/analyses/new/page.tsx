'use client';
import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Search, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Globe,
  BarChart3,
  FileText,
  Link2,
  Image,
  Target,
  Loader2,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function NewAnalysisPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }
    
    if (!validateUrl(url)) {
      setError('Please enter a valid URL (including http:// or https://)');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch('/api/crawl/start', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectId,
          url: url.trim(),
          userId: 'manual',
          crawlOptions: {
            maxPages: 5,
            crawlDepth: 2,
            extractOptions: {}
          }
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log('[New Analysis] API response:', data);
      
      if (data.jobId) {
        // For admin bypass, store the analysis request in localStorage
        if (data.source === 'admin-bypass' && data.analysisRequest) {
          console.log('[New Analysis] Storing analysis request for admin bypass');
          const existingJobs = JSON.parse(localStorage.getItem('adminAnalysisJobs') || '[]');
          existingJobs.push(data.analysisRequest);
          localStorage.setItem('adminAnalysisJobs', JSON.stringify(existingJobs));
        }
        
        // Navigate to the results page
        router.push(`/dashboard/projects/${projectId}/analyses/${data.jobId}`);
      } else {
        throw new Error('No job ID returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start analysis');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Technical SEO",
      description: "Title tags, meta descriptions, headings",
      color: "text-indigo-400"
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Content Quality",
      description: "Keyword optimization and content analysis",
      color: "text-green-400"
    },
    {
      icon: <Link2 className="h-5 w-5" />,
      title: "Link Structure",
      description: "Internal and external link analysis",
      color: "text-purple-400"
    },
    {
      icon: <Image className="h-5 w-5" />,
      title: "Image Optimization",
      description: "Alt text and image performance",
      color: "text-pink-400"
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: "SEO Score",
      description: "Overall score and recommendations",
      color: "text-indigo-400"
    }
  ];

  const popularSites = [
    { url: 'https://example.com', label: 'Example.com' },
    { url: 'https://github.com', label: 'GitHub' },
    { url: 'https://stackoverflow.com', label: 'Stack Overflow' }
  ];

  return (
    <div className="space-y-8">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="ghost" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent">
          <Link href={`/dashboard/projects/${projectId}/analyses`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            New SEO Analysis
          </h1>
          <p className="text-gray-300 mt-2 text-lg">
            Enter a URL to analyze its SEO performance and get actionable insights.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-8">
            <div className="mb-6">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-white mb-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Search className="h-4 w-4 text-indigo-400" />
                </div>
                Website Analysis
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-3">
                  Website URL *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full pl-12 pr-4 py-4 text-lg bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
                    disabled={loading}
                  />
                  {url && validateUrl(url) && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Include the protocol (http:// or https://) for best results
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-red-400">Error</h4>
                      <p className="text-sm text-red-300 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5" />
                      Start Analysis
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="border border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white px-8 py-4 rounded-xl font-medium transition-all"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>

            {/* Popular Websites Section */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-400" />
                Popular websites to try:
              </h3>
              <div className="flex flex-wrap gap-2">
                {popularSites.map((site) => (
                  <button
                    key={site.url}
                    type="button"
                    onClick={() => setUrl(site.url)}
                    className="text-sm px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:border-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-400 transition-all"
                    disabled={loading}
                  >
                    {site.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Features Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
            <h3 className="text-xl font-bold text-white mb-6 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              What we'll analyze
            </h3>
            <div className="space-y-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-all"
                >
                  <div className={`${feature.color} mt-0.5`}>
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits Card */}
          <div className="rounded-2xl border border-gray-700 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm p-6">
            <div className="text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <Target className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="font-bold text-green-400">
                Comprehensive Analysis
              </h3>
              <p className="text-sm text-gray-300">
                Get detailed insights and actionable recommendations to improve your website's SEO performance.
              </p>
              <div className="pt-2">
                <div className="inline-flex items-center rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                  Usually takes 30-60 seconds
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 