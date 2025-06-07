'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';

export function AnalysisDebugger() {
  console.log('[AnalysisDebugger] Function called - RENDERING STARTING');
  
  const params = useParams();
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  const projectId = params?.projectId as string;
  const jobId = params?.jobId as string;

  console.log('[AnalysisDebugger] Params extracted:', { projectId, jobId });

  useEffect(() => {
    console.log('[AnalysisDebugger] useEffect running');
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

  console.log('[AnalysisDebugger] About to return JSX');

  // Force visible content with inline styles
  return (
    <div style={{
      background: 'purple',
      color: 'white',
      padding: '20px',
      border: '5px solid yellow',
      fontSize: '16px',
      minHeight: '200px',
      opacity: 1,
      visibility: 'visible',
      display: 'block',
      position: 'relative',
      zIndex: 9999
    }}>
      <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>🔍 FORCED DEBUG INFORMATION</h3>
      <p>Component is rendering!</p>
      <p>Project ID: {projectId || 'MISSING'}</p>
      <p>Job ID: {jobId || 'MISSING'}</p>
      <p>Debug Info Length: {Object.keys(debugInfo).length}</p>
      <p>Timestamp: {new Date().toISOString()}</p>
      
      {/* Original content with fallback */}
      <div style={{ marginTop: '10px', background: 'rgba(0,0,0,0.5)', padding: '10px' }}>
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
      </div>
    </div>
  );
}