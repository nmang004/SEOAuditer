'use client';

import React from 'react';
import { AnalysisDashboardRouter } from '@/components/dashboard/AnalysisDashboardRouter';
import { AnalysisDebugger } from '@/components/debug/AnalysisDebugger';

export default function AnalysisResultsPage() {
  return (
    <div className="space-y-6">
      {/* Add debug component for troubleshooting */}
      <AnalysisDebugger />
      
      {/* Main dashboard */}
      <AnalysisDashboardRouter />
    </div>
  );
}