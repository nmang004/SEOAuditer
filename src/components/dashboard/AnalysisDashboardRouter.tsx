'use client';

import React from 'react';

// Simple test version of AnalysisDashboardRouter
export function AnalysisDashboardRouter() {
  console.log('[AnalysisDashboardRouter] Simple test version called');
  
  return (
    <div style={{
      background: 'cyan',
      color: 'black',
      padding: '20px',
      border: '5px solid red',
      fontSize: '18px',
      fontWeight: 'bold',
      minHeight: '100px',
      opacity: 1,
      visibility: 'visible',
      display: 'block',
      position: 'relative',
      zIndex: 9999
    }}>
      🚨 ANALYSISDASHBOARDROUTER IS DEFINITELY RENDERING!
      <br />
      Simple test version - component function was called successfully.
      <br />
      If you see this, the component works but something in the original code was wrong.
    </div>
  );
}

// Export other interfaces that might be needed
export interface Analysis {
  id: string;
  crawlType: 'single' | 'subfolder' | 'domain';
  status: 'pending' | 'running' | 'completed' | 'failed';
  url: string;
  projectId: string;
  createdAt: string;
  completedAt?: string;
  metadata: {
    pagesAnalyzed: number;
    totalPages?: number;
    depth?: number;
    estimatedDuration?: string;
  };
  data?: any;
}

export interface DashboardConfig {
  showSiteMap: boolean;
  showCrossPageInsights: boolean;
  showBulkActions: boolean;
  primaryMetrics: string[];
  defaultView: string;
  tabs: string[];
  features: string[];
}

export interface AnalysisData {
  score: number;
  issues: Issue[];
  recommendations: Recommendation[];
  performance: PerformanceData;
  technical: TechnicalData;
  content: ContentData;
}

export interface Issue {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  pages?: string[];
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  category: string;
  pages?: string[];
}

export interface PerformanceData {
  lcp: number;
  fid: number;
  cls: number;
  loadTime: number;
  pageSize: number;
}

export interface TechnicalData {
  metaTags: any;
  headings: any;
  images: any;
  links: any;
}

export interface ContentData {
  wordCount: number;
  readability: number;
  keywords: string[];
  duplicateContent?: any;
}