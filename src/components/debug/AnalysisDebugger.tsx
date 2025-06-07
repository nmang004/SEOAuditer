'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';

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

  return (
    <Card className="p-4 bg-gray-800/50 border-gray-700" style={{ 
      opacity: 1, 
      visibility: 'visible', 
      display: 'block' 
    }}>
      <h3 className="text-lg font-semibold text-white mb-3">🔍 Debug Information</h3>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-400">Project ID:</span>
          <div className="text-white font-mono">{projectId}</div>
        </div>
        <div>
          <span className="text-gray-400">Job ID:</span>
          <div className="text-white font-mono text-xs">{jobId}</div>
        </div>
        <div>
          <span className="text-gray-400">Data Length:</span>
          <div className="text-white">{debugInfo.localStorage?.raw?.length || 0} chars</div>
        </div>
        <div>
          <span className="text-gray-400">Found Job:</span>
          <div className={debugInfo.localStorage?.foundJob ? "text-green-400" : "text-red-400"}>
            {debugInfo.localStorage?.foundJob ? "✅ Yes" : "❌ No"}
          </div>
        </div>
      </div>
    </Card>
  );
}