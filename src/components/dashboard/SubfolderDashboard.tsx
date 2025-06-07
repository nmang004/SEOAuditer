'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Folder,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Grid3X3,
  Table,
  TreePine,
  Search,
  Filter,
  Download,
  GitCompare as Compare,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Target,
  Zap,
  FileText,
  ArrowRight,
  ExternalLink,
  Eye,
  Calendar,
  Layers,
  PieChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Analysis, DashboardConfig } from './AnalysisDashboardRouter';

interface SubfolderDashboardProps {
  analysis: Analysis;
  config: DashboardConfig;
}

interface PageData {
  id: string;
  url: string;
  title: string;
  score: number;
  issues: number;
  loadTime: number;
  wordCount: number;
  lastCrawled: string;
  status: 'good' | 'warning' | 'error';
  pageType: string;
}

// Generate mock page data based on analysis
function generateMockPages(analysis: Analysis): PageData[] {
  const baseUrl = analysis.url.replace(/\/$/, '');
  const paths = [
    '/blog/seo-best-practices',
    '/blog/content-marketing-guide',
    '/blog/technical-seo',
    '/blog/local-seo',
    '/blog/mobile-optimization',
    '/blog/page-speed',
    '/blog/keyword-research',
    '/blog/link-building'
  ];

  return paths.map((path, index) => ({
    id: `page-${index}`,
    url: `${baseUrl}${path}`,
    title: path.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Page',
    score: Math.floor(Math.random() * 40) + 60,
    issues: Math.floor(Math.random() * 5),
    loadTime: Math.random() * 3 + 1,
    wordCount: Math.floor(Math.random() * 2000) + 500,
    lastCrawled: new Date().toISOString(),
    status: index % 3 === 0 ? 'error' : index % 2 === 0 ? 'warning' : 'good',
    pageType: 'blog'
  }));
}

// Big Metric Component
function BigMetric({ 
  label, 
  value, 
  subvalue, 
  change, 
  sparkline,
  visual 
}: { 
  label: string;
  value: string | number;
  subvalue?: string;
  change?: number;
  sparkline?: number[];
  visual?: React.ReactNode;
}) {
  return (
    <Card className="p-6 bg-gray-800/50 border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-1">{label}</p>
          <div className="text-3xl font-bold text-white mb-1">{value}</div>
          {subvalue && (
            <p className="text-sm text-gray-500">{subvalue}</p>
          )}
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-sm mt-2",
              change > 0 ? "text-green-400" : change < 0 ? "text-red-400" : "text-gray-400"
            )}>
              {change > 0 ? <TrendingUp className="h-4 w-4" /> : 
               change < 0 ? <TrendingDown className="h-4 w-4" /> : null}
              <span>{change > 0 ? '+' : ''}{change}%</span>
            </div>
          )}
        </div>
        {visual && (
          <div className="ml-4">
            {visual}
          </div>
        )}
      </div>
    </Card>
  );
}

// Coverage Donut Component
function CoverageDonut({ value }: { value: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-20 h-20">
      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-gray-700"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="text-indigo-500 transition-all duration-1000"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-white">{value}%</span>
      </div>
    </div>
  );
}

// Insight Panel Component
function InsightPanel({ 
  title, 
  icon, 
  insights 
}: { 
  title: string;
  icon: React.ReactNode;
  insights: any[];
}) {
  return (
    <Card className="p-6 bg-gray-800/50 border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-indigo-500/20">
          {icon}
        </div>
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div key={index} className="p-3 rounded-lg bg-gray-700/30">
            <div className="flex items-start gap-2">
              {insight.type === 'warning' && 
                <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              }
              {insight.type === 'success' && 
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
              }
              <div className="flex-1">
                <p className="text-sm text-gray-300">{insight.text}</p>
                {insight.action && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs mt-1 p-0">
                    {insight.action}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Page Card Component
function PageCard({ 
  page, 
  selected, 
  onSelect,
  showComparison 
}: { 
  page: PageData;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  showComparison?: number;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-400 bg-green-500/20';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20';
      case 'error': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <Card className={cn(
      "p-4 transition-all duration-200 hover:shadow-lg",
      selected ? "ring-2 ring-indigo-500 bg-indigo-500/5" : "bg-gray-800/50",
      "border-gray-700"
    )}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          className="mt-1"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-white truncate">{page.title}</h4>
              <p className="text-xs text-gray-400 truncate">{page.url}</p>
            </div>
            <div className={cn("w-2 h-2 rounded-full ml-2 mt-1", getStatusColor(page.status))} />
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-400">Score: </span>
              <span className={getScoreColor(page.score)}>{page.score}</span>
            </div>
            <div>
              <span className="text-gray-400">Issues: </span>
              <span className="text-white">{page.issues}</span>
            </div>
            <div>
              <span className="text-gray-400">Load: </span>
              <span className="text-white">{page.loadTime.toFixed(1)}s</span>
            </div>
            <div>
              <span className="text-gray-400">Words: </span>
              <span className="text-white">{page.wordCount}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-xs">
              {page.pageType}
            </Badge>
            <Button variant="ghost" size="sm" className="h-6 text-xs">
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Bulk Recommendation Card Component
function BulkRecommendationCard({
  title,
  affectedPages,
  impact,
  timeToFix,
  description,
  onViewDetails,
  onFixAll
}: {
  title: string;
  affectedPages: number;
  impact: string;
  timeToFix: string;
  description: string;
  onViewDetails: () => void;
  onFixAll: () => void;
}) {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-400 bg-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <Card className="p-6 bg-gray-800/50 border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-white">{title}</h4>
            <Badge className={getImpactColor(impact)}>
              {impact} impact
            </Badge>
          </div>
          <p className="text-sm text-gray-400 mb-3">{description}</p>
          
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>{affectedPages} pages affected</span>
            <span>~{timeToFix} to fix</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onViewDetails}>
          View Details
        </Button>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={onFixAll}>
          Fix All ({affectedPages} pages)
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
}

// Main Subfolder Dashboard Component
export function SubfolderDashboard({ analysis, config }: SubfolderDashboardProps) {
  console.log('[SubfolderDashboard] Component mounted with analysis:', analysis);
  console.log('[SubfolderDashboard] Config:', config);
  
  // Add immediate debug output
  console.log('[SubfolderDashboard] Component called! Analysis exists:', !!analysis);
  console.log('[SubfolderDashboard] Analysis crawlType:', analysis?.crawlType);
  console.log('[SubfolderDashboard] Analysis status:', analysis?.status);
  
  // Add debug box at very beginning
  const debugStart = (
    <div style={{
      backgroundColor: '#f59e0b',
      color: 'white',
      padding: '8px',
      margin: '5px 0',
      fontSize: '12px',
      border: '2px solid #fbbf24'
    }}>
      🟡 SubfolderDashboard START | Analysis: {analysis ? 'EXISTS' : 'NULL'} | Pages will be: {analysis ? 'Generated' : 'None'}
    </div>
  );

  if (!analysis) {
    console.log('[SubfolderDashboard] No analysis data, rendering error state');
    return (
      <div>
        {debugStart}
        <div className="flex items-center justify-center h-64">
          <p className="text-red-400">No analysis data available</p>
        </div>
      </div>
    );
  }

  console.log('[SubfolderDashboard] About to render simplified component');
  
  // Simplified render to test basic functionality
  return (
    <div className="subfolder-dashboard-container space-y-8" style={{ 
      opacity: 1, 
      visibility: 'visible', 
      display: 'block',
      position: 'relative',
      zIndex: 1,
      minHeight: '100vh',
      width: '100%'
    }}>
      {debugStart}
      
      {/* Success indicator */}
      <div style={{
        backgroundColor: '#16a34a',
        color: 'white',
        padding: '8px',
        fontSize: '12px',
        border: '1px solid #22c55e',
        borderRadius: '4px',
        textAlign: 'center'
      }}>
        ✅ SubfolderDashboard Rendering - Simplified Version for Testing
      </div>
      
      {/* Basic Header */}
      <div style={{ 
        opacity: 1, 
        visibility: 'visible', 
        display: 'block',
        color: 'white',
        padding: '20px',
        backgroundColor: 'rgba(55, 65, 81, 0.5)',
        borderRadius: '8px',
        border: '1px solid #374151'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          Subfolder Analysis Dashboard
        </h1>
        <p style={{ color: '#9CA3AF' }}>URL: {analysis.url}</p>
        <p style={{ color: '#9CA3AF' }}>Type: {analysis.crawlType}</p>
        <p style={{ color: '#9CA3AF' }}>Status: {analysis.status}</p>
        <p style={{ color: '#9CA3AF' }}>Created: {new Date(analysis.createdAt).toLocaleDateString()}</p>
      </div>

      {/* Simple metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        opacity: 1,
        visibility: 'visible'
      }}>
        <div style={{
          backgroundColor: 'rgba(55, 65, 81, 0.5)',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #374151',
          color: 'white'
        }}>
          <h3 style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '8px' }}>Metric 1</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>85</div>
        </div>
        <div style={{
          backgroundColor: 'rgba(55, 65, 81, 0.5)',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #374151',
          color: 'white'
        }}>
          <h3 style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '8px' }}>Metric 2</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>8</div>
        </div>
        <div style={{
          backgroundColor: 'rgba(55, 65, 81, 0.5)',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #374151',
          color: 'white'
        }}>
          <h3 style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '8px' }}>Metric 3</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>12</div>
        </div>
      </div>

      {/* Test if components work */}
      <div style={{
        backgroundColor: 'rgba(55, 65, 81, 0.5)',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #374151',
        color: 'white'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Component Test Area</h2>
        
        {/* Test simple Card component */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Testing Card Component:</h3>
          <Card className="p-4 bg-gray-800/50 border-gray-700">
            <p className="text-white">This is a test card to see if Card component renders</p>
          </Card>
        </div>

        {/* Test Button component */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Testing Button Component:</h3>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            Test Button
          </Button>
        </div>

        {/* Test Badge component */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Testing Badge Component:</h3>
          <Badge variant="outline" className="border-indigo-500 text-indigo-400">
            Test Badge
          </Badge>
        </div>

        {/* Test Icon components */}
        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Testing Icon Components:</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Folder className="h-6 w-6 text-indigo-400" />
            <Calendar className="h-6 w-6 text-indigo-400" />
            <FileText className="h-6 w-6 text-indigo-400" />
          </div>
        </div>
      </div>

      {/* Final test box */}
      <div style={{
        backgroundColor: '#059669',
        color: 'white',
        padding: '8px',
        fontSize: '12px',
        border: '1px solid #10B981',
        borderRadius: '4px',
        textAlign: 'center'
      }}>
        ✅ END OF SUBFOLDER DASHBOARD - If you can see this, basic rendering works
      </div>
    </div>
  );
}