'use client';

import React from 'react';
import { AnalysisDashboardRouter } from '@/components/dashboard/AnalysisDashboardRouter';
import { AnalysisDebugger } from '@/components/debug/AnalysisDebugger';

export default function AnalysisResultsPage() {
  return (
    <div className="space-y-6" style={{ 
      opacity: 1, 
      visibility: 'visible', 
      display: 'block',
      position: 'relative',
      zIndex: 1 
    }}>
      {/* Success indicator - can be removed later */}
      <div style={{
        backgroundColor: '#16a34a',
        color: 'white',
        padding: '10px',
        fontSize: '14px',
        fontWeight: 'bold',
        border: '2px solid #22c55e',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        ✅ Page Rendering Successfully - Analysis Dashboard Active
      </div>

      {/* Add debug component for troubleshooting */}
      <div style={{ opacity: 1, visibility: 'visible', display: 'block' }}>
        <AnalysisDebugger />
      </div>
      
      {/* Main dashboard */}
      <div style={{ opacity: 1, visibility: 'visible', display: 'block' }}>
        <AnalysisDashboardRouter />
      </div>
    </div>
  );
}