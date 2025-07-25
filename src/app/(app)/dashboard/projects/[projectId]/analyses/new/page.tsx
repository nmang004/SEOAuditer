'use client';
import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { EnhancedAnalysisConfigurator, CrawlConfiguration } from '@/components/analysis/enhanced-crawl-configurator';

export default function NewAnalysisPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStartAnalysis = async (config: CrawlConfiguration) => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      
      // Determine the API endpoint based on crawl type
      const endpoint = config.crawlType === 'single' 
        ? '/api/crawl/start' 
        : '/api/crawl/multi/start';
      
      const requestBody = config.crawlType === 'single' 
        ? {
            projectId,
            url: config.startUrl,
            userId: 'manual',
            crawlOptions: {
              maxPages: config.maxPages,
              crawlDepth: config.depth,
              extractOptions: {}
            }
          }
        : {
            projectId,
            config: {
              crawlType: config.crawlType,
              startUrl: config.startUrl,
              depth: config.depth,
              maxPages: config.maxPages,
              filters: config.filters,
              performance: config.performance,
              analysis: config.analysis
            }
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log('[New Analysis] API response:', data);
      
      if (data.success && (data.jobId || data.sessionId)) {
        const analysisId = data.jobId || data.sessionId;
        
        // Store analysis data in localStorage for all sources (admin-bypass, fallback, error-fallback)
        if (data.analysisData) {
          console.log('[New Analysis] Storing analysis data in localStorage:', data.analysisData);
          const existingJobs = JSON.parse(localStorage.getItem('adminAnalysisJobs') || '[]');
          existingJobs.push(data.analysisData);
          localStorage.setItem('adminAnalysisJobs', JSON.stringify(existingJobs));
          
          // Also store the project data if not exists
          const existingProjects = JSON.parse(localStorage.getItem('adminProjects') || '[]');
          const projectExists = existingProjects.find((p: any) => p.id === projectId);
          if (!projectExists) {
            const projectData = {
              id: projectId,
              name: `Project ${projectId.slice(-8)}`,
              url: data.analysisData.url,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            existingProjects.push(projectData);
            localStorage.setItem('adminProjects', JSON.stringify(existingProjects));
            console.log('[New Analysis] Stored project data:', projectData);
          }
        }
        
        // Navigate to the results page
        router.push(`/dashboard/projects/${projectId}/analyses/${analysisId}`);
      } else if (data.success) {
        // Handle cases where response is successful but no explicit ID
        const analysisId = data.sessionId || data.jobId || `temp-${Date.now()}`;
        router.push(`/dashboard/projects/${projectId}/analyses/${analysisId}`);
      } else {
        throw new Error(data.error || 'No job ID or session ID returned');
      }
    } catch (err) {
      console.error('Analysis start error:', err);
      // You could add error state management here if needed
      alert(err instanceof Error ? err.message : 'Failed to start analysis');
    } finally {
      setLoading(false);
    }
  };

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
            Choose your analysis type and configure advanced options for comprehensive SEO insights.
          </p>
        </div>
      </div>

      {/* Enhanced Analysis Configurator */}
      <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-8">
        <EnhancedAnalysisConfigurator onStartAnalysis={handleStartAnalysis} />
      </div>
    </div>
  );
} 