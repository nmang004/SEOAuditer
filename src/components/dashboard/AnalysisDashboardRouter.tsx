'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Folder, 
  Globe, 
  ArrowRight,
  RefreshCw,
  Calendar,
  TrendingUp
} from 'lucide-react';

// Import dashboard components
import { SinglePageDashboard } from './SinglePageDashboard';
import { SubfolderDashboard } from './SubfolderDashboard';
import { FullDomainDashboard } from './FullDomainDashboard';

// Types
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
  data?: AnalysisData;
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

export interface DashboardConfig {
  showSiteMap: boolean;
  showCrossPageInsights: boolean;
  showBulkActions: boolean;
  primaryMetrics: string[];
  defaultView: string;
  tabs: string[];
  features: string[];
}

// Simple test component to verify basic rendering
export function SimpleAnalysisTest() {
  return (
    <div style={{
      background: '#10b981',
      color: 'white',
      padding: '20px',
      border: '3px solid #22c55e',
      borderRadius: '8px',
      margin: '20px 0',
      textAlign: 'center'
    }}>
      <h2>✅ SIMPLE COMPONENT WORKING</h2>
      <p>This proves React components can render</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  );
}

// Main Dashboard Router Component
export function AnalysisDashboardRouter() {
  console.log('[AnalysisDashboardRouter] Component called - STARTING RENDER');
  
  // STEP 1: Call all hooks unconditionally first (Rules of Hooks)
  const params = useParams();
  const searchParams = useSearchParams();
  
  // Immediate visibility test for this component
  if (typeof window !== 'undefined') {
    console.log('[AnalysisDashboardRouter] Window is available, component should render');
  } else {
    console.log('[AnalysisDashboardRouter] Window not available - SSR mode');
  }

  // Test hooks after calling them
  try {
    console.log('[AnalysisDashboardRouter] Testing with basic hooks...');
    console.log('[AnalysisDashboardRouter] ✅ Basic navigation hooks successful');
    console.log('[AnalysisDashboardRouter] Params:', params);
    console.log('[AnalysisDashboardRouter] SearchParams:', searchParams);
    
    const projectId = params?.projectId as string;
    const jobId = params?.jobId as string;
    console.log('[AnalysisDashboardRouter] ✅ Parameter extraction successful');
    console.log('[AnalysisDashboardRouter] ProjectId:', projectId);
    console.log('[AnalysisDashboardRouter] JobId:', jobId);
    
    return (
      <div style={{
        padding: '20px',
        background: '#1f2937',
        color: 'white',
        border: '2px solid #3b82f6',
        borderRadius: '8px'
      }}>
        <div style={{
          background: '#059669',
          color: 'white',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          ✅ HOOKS STEP 1: Basic navigation hooks working!
        </div>
        <p>useParams: {params ? '✅ SUCCESS' : '❌ FAILED'}</p>
        <p>useSearchParams: {searchParams ? '✅ SUCCESS' : '❌ FAILED'}</p>
        <p>ProjectId: {projectId || 'MISSING'}</p>
        <p>JobId: {jobId || 'MISSING'}</p>
        <p>Next: Add useState hooks</p>
        <SimpleAnalysisTest />
      </div>
    );
  } catch (error) {
    console.error('[AnalysisDashboardRouter] Error with hooks step 1:', error);
    return (
      <div style={{ background: 'red', color: 'white', padding: '20px' }}>
        HOOKS STEP 1 FAILED: {error instanceof Error ? error.message : String(error)}
        <br />
        Stack: {error instanceof Error ? error.stack : 'No stack trace'}
      </div>
    );
  }
}