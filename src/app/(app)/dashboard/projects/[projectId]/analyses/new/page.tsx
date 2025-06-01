'use client';
import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { m } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
      if (data.jobId) {
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
      color: "text-blue-600"
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Content Quality",
      description: "Keyword optimization and content analysis",
      color: "text-green-600"
    },
    {
      icon: <Link2 className="h-5 w-5" />,
      title: "Link Structure",
      description: "Internal and external link analysis",
      color: "text-purple-600"
    },
    {
      // eslint-disable-next-line jsx-a11y/alt-text
      icon: <Image className="h-5 w-5" />,
      title: "Image Optimization",
      description: "Alt text and image performance",
      color: "text-orange-600"
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: "SEO Score",
      description: "Overall score and recommendations",
      color: "text-red-600"
    }
  ];

  const popularSites = [
    { url: 'https://example.com', label: 'Example.com' },
    { url: 'https://github.com', label: 'GitHub' },
    { url: 'https://stackoverflow.com', label: 'Stack Overflow' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with Back Button */}
          <m.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            <Button asChild variant="ghost" size="sm">
              <Link href={`/dashboard/projects/${projectId}/analyses`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                New SEO Analysis
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                Enter a URL to analyze its SEO performance and get actionable insights.
              </p>
            </div>
          </m.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <m.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Search className="h-4 w-4 text-blue-600" />
                    </div>
                    Website Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="url" className="block text-sm font-semibold text-gray-900 mb-3">
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
                          className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-300"
                          disabled={loading}
                        />
                        {url && validateUrl(url) && (
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Include the protocol (http:// or https://) for best results
                      </p>
                    </div>

                    {error && (
                      <m.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-50 border-2 border-red-200 rounded-xl p-4"
                      >
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="text-sm font-semibold text-red-900">Error</h4>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                          </div>
                        </div>
                      </m.div>
                    )}

                    <div className="flex gap-4">
                      <Button
                        type="submit"
                        disabled={loading}
                        size="lg"
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="animate-spin h-5 w-5 mr-3" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Zap className="h-5 w-5 mr-3" />
                            Start Analysis
                          </>
                        )}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        size="lg"
                        className="px-8 py-4 rounded-xl border-2 hover:bg-gray-50"
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>

                  {/* Popular Websites Section */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                      Popular websites to try:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {popularSites.map((site) => (
                        <Button
                          key={site.url}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setUrl(site.url)}
                          className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
                          disabled={loading}
                        >
                          {site.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </m.div>

            {/* Features Sidebar */}
            <m.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-900">
                    What we'll analyze
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {features.map((feature, index) => (
                    <m.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-200"
                    >
                      <div className={`${feature.color} mt-0.5`}>
                        {feature.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {feature.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {feature.description}
                        </p>
                      </div>
                    </m.div>
                  ))}
                </CardContent>
              </Card>

              {/* Benefits Card */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-6">
                  <div className="text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                      <Target className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-green-900">
                      Comprehensive Analysis
                    </h3>
                    <p className="text-sm text-green-700">
                      Get detailed insights and actionable recommendations to improve your website's SEO performance.
                    </p>
                    <div className="pt-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        Usually takes 30-60 seconds
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </m.div>
          </div>
        </div>
      </div>
    </div>
  );
} 