'use client';

import React from 'react';
import { AnalysisDashboardRouter } from '@/components/dashboard/AnalysisDashboardRouter';
import { AnalysisDebugger } from '@/components/debug/AnalysisDebugger';

export default function AnalysisResultsPage() {
  console.log('[AnalysisResultsPage] Component rendering');
  
  return (
    <div className="space-y-6" style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(45deg, #ff0000, #00ff00, #0000ff)',
      padding: '20px'
    }}>
      {/* Bright test box to confirm page is rendering */}
      <div style={{
        backgroundColor: '#ff0000',
        color: 'white',
        padding: '20px',
        fontSize: '20px',
        fontWeight: 'bold',
        border: '5px solid #ffff00',
        textAlign: 'center'
      }}>
        🚨 ANALYSIS RESULTS PAGE IS RENDERING - IF YOU SEE THIS, THE PAGE COMPONENT WORKS
      </div>

      {/* Test if components can load */}
      <div style={{
        backgroundColor: '#0000ff',
        color: 'white',
        padding: '20px',
        fontSize: '16px',
        border: '3px solid #ffffff'
      }}>
        <h2>Testing component imports:</h2>
        <p>AnalysisDebugger: {AnalysisDebugger ? 'IMPORTED' : 'FAILED'}</p>
        <p>AnalysisDashboardRouter: {AnalysisDashboardRouter ? 'IMPORTED' : 'FAILED'}</p>
      </div>

      {/* Try to render components */}
      <div style={{
        backgroundColor: '#00ff00',
        color: 'black',
        padding: '20px',
        fontSize: '16px',
        border: '3px solid #000000'
      }}>
        <h2>Attempting to render AnalysisDebugger:</h2>
        <AnalysisDebugger />
      </div>

      <div style={{
        backgroundColor: '#ff00ff',
        color: 'white',
        padding: '20px',
        fontSize: '16px',
        border: '3px solid #000000'
      }}>
        <h2>Attempting to render AnalysisDashboardRouter:</h2>
        <AnalysisDashboardRouter />
      </div>
    </div>
  );
}