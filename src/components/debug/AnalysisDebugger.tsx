'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function AnalysisDebugger() {
  const params = useParams();
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  const projectId = params?.projectId as string;
  const jobId = params?.jobId as string;

  useEffect(() => {
    console.log('[AnalysisDebugger] Component mounted');
    console.log('[AnalysisDebugger] Params:', { projectId, jobId });
    
    // Check localStorage
    const adminJobsString = localStorage.getItem('adminAnalysisJobs') || '[]';
    let adminJobs = [];
    try {
      adminJobs = JSON.parse(adminJobsString);
    } catch (e) {
      console.error('[AnalysisDebugger] Failed to parse adminAnalysisJobs:', e);
    }
    
    const adminJob = adminJobs.find((job: any) => 
      job.sessionId === jobId || job.jobId === jobId
    );
    
    setDebugInfo({
      params: { projectId, jobId },
      localStorage: {
        raw: adminJobsString,
        parsed: adminJobs,
        foundJob: adminJob
      },
      timestamp: new Date().toISOString()
    });
  }, [projectId, jobId]);

  const createTestData = () => {
    const testJob = {
      sessionId: jobId,
      jobId: jobId,
      projectId: projectId,
      url: 'https://github.com/admin',
      config: {
        crawlType: 'subfolder',
        startUrl: 'https://github.com/admin',
        depth: 3,
        maxPages: 50
      },
      createdAt: new Date().toISOString(),
      estimatedPages: 8,
      estimatedDuration: 5,
      status: 'completed'
    };

    const existingJobs = JSON.parse(localStorage.getItem('adminAnalysisJobs') || '[]');
    const updatedJobs = existingJobs.filter((job: any) => 
      job.sessionId !== jobId && job.jobId !== jobId
    );
    updatedJobs.push(testJob);
    
    localStorage.setItem('adminAnalysisJobs', JSON.stringify(updatedJobs));
    
    console.log('[AnalysisDebugger] Created test data:', testJob);
    
    // Refresh debug info
    setDebugInfo((prev: any) => ({
      ...prev,
      localStorage: {
        ...prev.localStorage,
        parsed: updatedJobs,
        foundJob: testJob
      },
      testDataCreated: true
    }));
  };

  const clearData = () => {
    localStorage.removeItem('adminAnalysisJobs');
    setDebugInfo((prev: any) => ({
      ...prev,
      localStorage: {
        raw: '[]',
        parsed: [],
        foundJob: null
      },
      dataCleared: true
    }));
  };

  return (
    <div className="space-y-6 p-6">
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Analysis Debug Information</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">URL Parameters</h3>
            <pre className="bg-gray-900 p-3 rounded text-sm text-gray-300 overflow-auto">
              {JSON.stringify(debugInfo.params, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">localStorage Data</h3>
            <pre className="bg-gray-900 p-3 rounded text-sm text-gray-300 overflow-auto max-h-64">
              {JSON.stringify(debugInfo.localStorage, null, 2)}
            </pre>
          </div>

          <div className="flex gap-2">
            <Button onClick={createTestData} className="bg-green-600 hover:bg-green-700">
              Create Test Data
            </Button>
            <Button onClick={clearData} variant="outline">
              Clear Data
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              Reload Page
            </Button>
          </div>

          {debugInfo.testDataCreated && (
            <div className="p-3 bg-green-500/20 border border-green-500 rounded text-green-300">
              ✅ Test data created! Try refreshing the page to see if the dashboard loads.
            </div>
          )}

          {debugInfo.dataCleared && (
            <div className="p-3 bg-blue-500/20 border border-blue-500 rounded text-blue-300">
              🔄 Data cleared! localStorage has been reset.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}