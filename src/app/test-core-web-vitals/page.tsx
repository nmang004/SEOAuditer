'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CoreWebVitalsCard from '@/components/analysis/CoreWebVitalsCard';
import { useCoreWebVitalsAnalysis } from '@/hooks/useEnhancedAnalysis';
import { Play, RefreshCw } from 'lucide-react';

const TestCoreWebVitalsPage = () => {
  const [url, setUrl] = useState('https://www.google.com');
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('mobile');
  const [analysisResult, setAnalysisResult] = useState(null);
  const { analyze, loading, error } = useCoreWebVitalsAnalysis();

  const handleAnalyze = async () => {
    try {
      const result = await analyze(url, { deviceType });
      setAnalysisResult(result);
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  // Mock data for testing the component
  const mockCoreWebVitalsData = {
    url: "https://www.google.com",
    timestamp: new Date().toISOString(),
    deviceType: "mobile" as const,
    coreWebVitals: {
      LCP: 1250,
      FID: 85,
      CLS: 0.08,
      FCP: 900,
      TTFB: 180,
      SI: 1100,
      TTI: 2200
    },
    performanceScore: 87,
    grade: "B" as const,
    insights: {
      lcpAnalysis: {
        value: 1250,
        status: "needs-improvement" as const,
        target: 1200,
        percentile: "Top 50%"
      },
      fidAnalysis: {
        value: 85,
        status: "good" as const,
        target: 100,
        percentile: "Top 25%"
      },
      clsAnalysis: {
        value: 0.08,
        status: "good" as const,
        target: 0.1,
        percentile: "Top 25%"
      }
    },
    recommendations: [
      {
        metric: "LCP",
        priority: "high" as const,
        title: "Optimize Largest Contentful Paint",
        description: "Reduce LCP by optimizing images and preloading critical resources",
        impact: "Could improve LCP by 200-400ms"
      },
      {
        metric: "FCP",
        priority: "medium" as const,
        title: "Eliminate render-blocking resources",
        description: "Remove unnecessary CSS and JavaScript that blocks initial render",
        impact: "Could improve FCP by 100-200ms"
      }
    ]
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Core Web Vitals Test</h1>
        <p className="text-muted-foreground">
          Test the Core Web Vitals analysis implementation
        </p>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Run Core Web Vitals Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">URL to Analyze</label>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL to analyze..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Device Type</label>
              <select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value as 'mobile' | 'desktop')}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="mobile">Mobile</option>
                <option value="desktop">Desktop</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleAnalyze} 
                disabled={loading || !url}
                className="min-w-[120px]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}

          {analysisResult && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              <strong>Analysis Started:</strong> Check the analysis results below when complete.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mock Data Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Core Web Vitals Component Demo (Mock Data)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            This shows how the Core Web Vitals component looks with sample data:
          </p>
          <CoreWebVitalsCard data={mockCoreWebVitalsData} />
        </CardContent>
      </Card>

      {/* Loading State Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Loading State Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            This shows the loading state of the component:
          </p>
          <CoreWebVitalsCard data={null} loading={true} />
        </CardContent>
      </Card>

      {/* Empty State Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Empty State Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            This shows the empty state when no data is available:
          </p>
          <CoreWebVitalsCard data={null} loading={false} />
        </CardContent>
      </Card>

      {/* Implementation Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-green-600 mb-2">✅ Completed</h4>
              <ul className="text-sm space-y-1">
                <li>• LighthouseService with Chrome integration</li>
                <li>• CoreWebVitalsAnalyzer with Google thresholds</li>
                <li>• Enhanced API endpoints</li>
                <li>• React component for display</li>
                <li>• TypeScript interfaces</li>
                <li>• React hooks for API integration</li>
                <li>• Performance scoring (0-100)</li>
                <li>• A-F grading system</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-600 mb-2">🚧 Next Steps (Phase 2)</h4>
              <ul className="text-sm space-y-1">
                <li>• Historical trend analysis</li>
                <li>• Advanced accessibility analysis</li>
                <li>• Competitor comparison</li>
                <li>• Automated reporting</li>
                <li>• Performance optimization suggestions</li>
                <li>• Real-time monitoring alerts</li>
                <li>• Export functionality (PDF/CSV)</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
            <strong>Note:</strong> To test the actual Core Web Vitals analysis, ensure the backend is running 
            and you have proper authentication configured. The analysis requires Chrome/Chromium to be installed 
            on the server.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestCoreWebVitalsPage; 