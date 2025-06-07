'use client';

import React from 'react';
import { AnalysisDashboardRouter } from '@/components/dashboard/AnalysisDashboardRouter';

export default function AnalysisResultsPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <AnalysisDashboardRouter />
      </div>
    </div>
  );
}