'use client';

import React from 'react';
import { AnalysisDashboardRouter } from '@/components/dashboard/AnalysisDashboardRouter';
import { AnalysisDebugger } from '@/components/debug/AnalysisDebugger';

export default function AnalysisResultsPage() {
  return (
    <div style={{ 
      padding: '20px',
      backgroundColor: '#1f2937',
      minHeight: '100vh',
      color: 'white'
    }}>
      {/* Ultra-simple test content */}
      <div style={{
        backgroundColor: '#dc2626',
        color: 'white',
        padding: '20px',
        margin: '20px 0',
        fontSize: '24px',
        fontWeight: 'bold',
        border: '3px solid yellow'
      }}>
        🚀 TEST: If you can see this red box, the page is rendering!
      </div>

      {/* Simple data display */}
      <div style={{
        backgroundColor: '#059669',
        color: 'white',
        padding: '20px',
        margin: '20px 0',
        fontSize: '18px',
        border: '2px solid #10b981'
      }}>
        <h2 style={{ margin: '0 0 10px 0' }}>Analysis Data Check:</h2>
        <p>localStorage adminAnalysisJobs: {typeof window !== 'undefined' ? localStorage.getItem('adminAnalysisJobs')?.length || 0 : 'Loading...'} characters</p>
        <p>Page URL: {typeof window !== 'undefined' ? window.location.href : 'Loading...'}</p>
      </div>

      {/* Debug component with forced styling */}
      <div style={{
        backgroundColor: '#1e40af',
        padding: '20px',
        margin: '20px 0',
        border: '2px solid #3b82f6'
      }}>
        <h3 style={{ color: 'white', margin: '0 0 10px 0' }}>Debug Component:</h3>
        <AnalysisDebugger />
      </div>

      {/* Dashboard with forced styling */}
      <div style={{
        backgroundColor: '#7c2d12',
        padding: '20px',
        margin: '20px 0',
        border: '2px solid #ea580c'
      }}>
        <h3 style={{ color: 'white', margin: '0 0 10px 0' }}>Dashboard Component:</h3>
        <AnalysisDashboardRouter />
      </div>
    </div>
  );
}