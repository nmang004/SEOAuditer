'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export function AnalysisDebugger() {
  const params = useParams();
  const [storageData, setStorageData] = useState<string>('Loading...');
  
  const projectId = params?.projectId as string;
  const jobId = params?.jobId as string;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('adminAnalysisJobs') || '[]';
      setStorageData(data);
    }
  }, []);

  return (
    <div style={{
      backgroundColor: '#4338ca',
      color: 'white',
      padding: '20px',
      fontSize: '16px',
      border: '3px solid #6366f1'
    }}>
      <h2 style={{ margin: '0 0 10px 0' }}>🔍 Analysis Debugger</h2>
      <p><strong>Project ID:</strong> {projectId}</p>
      <p><strong>Job ID:</strong> {jobId}</p>
      <p><strong>localStorage Data Length:</strong> {storageData.length} characters</p>
      <p><strong>Has Data:</strong> {storageData.length > 2 ? '✅ Yes' : '❌ No'}</p>
    </div>
  );
}