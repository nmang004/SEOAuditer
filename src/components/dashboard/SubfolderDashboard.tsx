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
  
  if (!analysis) {
    return (
      <div style={{
        backgroundColor: '#dc2626',
        color: 'white',
        padding: '20px',
        fontSize: '18px',
        border: '3px solid yellow'
      }}>
        ❌ No analysis data available
      </div>
    );
  }
  
  return (
    <div style={{
      backgroundColor: '#0f172a',
      color: 'white',
      padding: '20px',
      minHeight: '50vh'
    }}>
      {/* Ultra-simple test content */}
      <div style={{
        backgroundColor: '#16a34a',
        color: 'white',
        padding: '20px',
        margin: '10px 0',
        fontSize: '20px',
        border: '3px solid #22c55e'
      }}>
        ✅ SubfolderDashboard is rendering! Analysis URL: {analysis.url}
      </div>

      {/* Simple metrics */}
      <div style={{
        backgroundColor: '#2563eb',
        color: 'white',
        padding: '20px',
        margin: '10px 0',
        fontSize: '16px',
        border: '2px solid #3b82f6'
      }}>
        <h2 style={{ margin: '0 0 10px 0' }}>📊 Analysis Overview</h2>
        <p>Crawl Type: {analysis.crawlType}</p>
        <p>Status: {analysis.status}</p>
        <p>Pages Analyzed: {analysis.metadata?.pagesAnalyzed || 0}</p>
        <p>Created: {new Date(analysis.createdAt).toLocaleDateString()}</p>
      </div>

      {/* Mock page data */}
      <div style={{
        backgroundColor: '#7c3aed',
        color: 'white',
        padding: '20px',
        margin: '10px 0',
        fontSize: '16px',
        border: '2px solid #8b5cf6'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>📄 Sample Pages</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              backgroundColor: '#374151',
              padding: '10px',
              border: '1px solid #6b7280',
              borderRadius: '4px'
            }}>
              <strong>Page {i}</strong> - Score: {80 + i * 5} - Issues: {i}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div style={{
        backgroundColor: '#ea580c',
        color: 'white',
        padding: '20px',
        margin: '10px 0',
        fontSize: '16px',
        border: '2px solid #f97316'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>💡 Top Recommendations</h3>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Optimize images across section (6 pages affected)</li>
          <li>Add missing meta descriptions (4 pages affected)</li>
          <li>Fix heading structure (3 pages affected)</li>
        </ul>
      </div>
    </div>
  );
}