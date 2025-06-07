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