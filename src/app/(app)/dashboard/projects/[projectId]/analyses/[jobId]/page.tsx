'use client';

import React from 'react';
import { AnalysisDashboardRouter } from '@/components/dashboard/AnalysisDashboardRouter';

export default function AnalysisResultsPage() {
  // Override any opacity issues with inline styles
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Force visibility for all dashboard content */
      .space-y-8 > *, 
      .space-y-6 > *, 
      .space-y-4 > *,
      .grid > *,
      .flex > * {
        opacity: 1 !important;
        visibility: visible !important;
      }
      
      /* Ensure cards and their content are visible */
      [class*="Card"],
      [class*="card"],
      [class*="bg-gray-800"],
      [class*="bg-gray-700"] {
        opacity: 1 !important;
        visibility: visible !important;
      }
      
      /* Force all text content to be visible */
      h1, h2, h3, h4, h5, h6, p, span, div {
        opacity: 1 !important;
        visibility: visible !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <AnalysisDashboardRouter />
      </div>
    </div>
  );
}