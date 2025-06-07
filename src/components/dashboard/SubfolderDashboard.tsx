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
  
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'tree'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'good' | 'warning' | 'error'>('all');

  // Generate mock data
  const pages = useMemo(() => {
    console.log('[SubfolderDashboard] Generating mock pages for analysis:', analysis);
    const mockPages = generateMockPages(analysis);
    console.log('[SubfolderDashboard] Generated pages:', mockPages);
    return mockPages;
  }, [analysis]);
  
  const avgScore = Math.round(pages.reduce((sum, page) => sum + page.score, 0) / pages.length);
  const totalIssues = pages.reduce((sum, page) => sum + page.issues, 0);
  
  console.log('[SubfolderDashboard] Calculated metrics - avgScore:', avgScore, 'totalIssues:', totalIssues, 'pages:', pages.length);

  // Filter pages based on search and filter
  const filteredPages = useMemo(() => {
    return pages.filter(page => {
      const matchesSearch = page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           page.url.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterBy === 'all' || page.status === filterBy;
      return matchesSearch && matchesFilter;
    });
  }, [pages, searchQuery, filterBy]);

  const handlePageSelect = (pageId: string, checked: boolean) => {
    if (checked) {
      setSelectedPages([...selectedPages, pageId]);
    } else {
      setSelectedPages(selectedPages.filter(id => id !== pageId));
    }
  };

  const handleSelectAll = () => {
    if (selectedPages.length === filteredPages.length) {
      setSelectedPages([]);
    } else {
      setSelectedPages(filteredPages.map(page => page.id));
    }
  };

  const bulkRecommendations = [
    {
      title: 'Optimize Images Across Section',
      affectedPages: 6,
      impact: 'high' as const,
      timeToFix: '2 hours',
      description: 'Multiple pages have unoptimized images that slow down loading times'
    },
    {
      title: 'Add Missing Meta Descriptions',
      affectedPages: 4,
      impact: 'medium' as const,
      timeToFix: '30 minutes',
      description: 'Several pages are missing meta descriptions affecting search visibility'
    },
    {
      title: 'Fix Heading Structure',
      affectedPages: 3,
      impact: 'medium' as const,
      timeToFix: '45 minutes',
      description: 'Some pages have improper heading hierarchy (H1, H2, H3)'
    }
  ];

  console.log('[SubfolderDashboard] About to render component with filteredPages:', filteredPages.length);
  
  if (!analysis) {
    console.log('[SubfolderDashboard] No analysis data, rendering error state');
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-400">No analysis data available</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8" style={{ 
      opacity: 1, 
      visibility: 'visible', 
      display: 'block',
      position: 'relative',
      zIndex: 1,
      minHeight: '100vh',
      width: '100%'
    }}>
      {/* Debug indicator */}
      <div className="bg-green-500/20 border border-green-500 rounded p-2 text-green-300 text-sm" style={{ 
        opacity: 1, 
        visibility: 'visible', 
        display: 'block' 
      }}>
        DEBUG: SubfolderDashboard is rendering with {pages.length} pages (filteredPages: {filteredPages.length})
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between" style={{ 
        opacity: 1, 
        visibility: 'visible', 
        display: 'flex' 
      }}>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Folder className="h-6 w-6 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white">Subfolder Analysis</h1>
            <Badge variant="outline" className="border-indigo-500 text-indigo-400">
              {analysis.crawlType}
            </Badge>
          </div>
          <p className="text-gray-400">{analysis.url}</p>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Analyzed {new Date(analysis.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Subfolder Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6" style={{ 
        opacity: 1, 
        visibility: 'visible', 
        display: 'grid' 
      }}>
        <BigMetric
          label="Average Score"
          value={avgScore}
          change={5.2}
          subvalue="vs last analysis"
        />
        <BigMetric
          label="Pages Analyzed"
          value={pages.length}
          subvalue={`of ${pages.length + 5} discovered`}
        />
        <BigMetric
          label="Total Issues"
          value={totalIssues}
          subvalue="across all pages"
        />
        <BigMetric
          label="Coverage"
          value="87%"
          visual={<CoverageDonut value={87} />}
        />
      </div>

      {/* Section-Wide Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <InsightPanel
          title="Content Patterns"
          icon={<FileText className="h-5 w-5 text-indigo-400" />}
          insights={[
            {
              type: 'warning',
              text: '3 pages have less than 300 words',
              action: 'View Pages'
            },
            {
              type: 'success',
              text: 'All pages have unique meta descriptions'
            }
          ]}
        />
        
        <InsightPanel
          title="Technical Consistency"
          icon={<Layers className="h-5 w-5 text-indigo-400" />}
          insights={[
            {
              type: 'warning',
              text: '2 pages missing structured data',
              action: 'Fix Now'
            },
            {
              type: 'success',
              text: 'Consistent URL structure across section'
            }
          ]}
        />
        
        <InsightPanel
          title="Performance Trends"
          icon={<BarChart3 className="h-5 w-5 text-indigo-400" />}
          insights={[
            {
              type: 'success',
              text: 'Average load time: 1.8s',
              action: 'View Details'
            },
            {
              type: 'warning',
              text: '2 pages exceed 3s load time'
            }
          ]}
        />
      </div>

      {/* Page Analysis Section */}
      <div className="space-y-6">
        {/* Controls */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">View:</span>
              <div className="flex rounded-lg bg-gray-700 p-1">
                <Button
                  size="sm"
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('cards')}
                  className="h-7"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('table')}
                  className="h-7"
                >
                  <Table className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'tree' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('tree')}
                  className="h-7"
                >
                  <TreePine className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-900/50 border-gray-700"
                />
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-sm text-white"
              >
                <option value="all">All Pages</option>
                <option value="good">Good</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedPages.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedPages.length === filteredPages.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-gray-400">
                  {selectedPages.length} of {filteredPages.length} selected
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setCompareMode(true)}>
                  <Compare className="h-4 w-4 mr-1" />
                  Compare Selected
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Export Selected
                </Button>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                  Bulk Actions
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Page Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPages.map((page) => (
            <PageCard
              key={page.id}
              page={page}
              selected={selectedPages.includes(page.id)}
              onSelect={(checked) => handlePageSelect(page.id, checked)}
              showComparison={avgScore}
            />
          ))}
        </div>
      </div>

      {/* Bulk Recommendations */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Section-Wide Improvements</h2>
          <p className="text-gray-400">Issues that affect multiple pages in this section</p>
        </div>
        
        <div className="space-y-4">
          {bulkRecommendations.map((rec, index) => (
            <BulkRecommendationCard
              key={index}
              title={rec.title}
              affectedPages={rec.affectedPages}
              impact={rec.impact}
              timeToFix={rec.timeToFix}
              description={rec.description}
              onViewDetails={() => console.log('View details for:', rec.title)}
              onFixAll={() => console.log('Fix all for:', rec.title)}
            />
          ))}
        </div>
      </div>

      {/* Comparison Modal */}
      {compareMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl mx-4 p-6 bg-gray-800 border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Compare Selected Pages</h3>
              <Button variant="ghost" onClick={() => setCompareMode(false)}>
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-400">
                Comparing {selectedPages.length} selected pages...
              </p>
              
              {/* Comparison content would go here */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="font-medium text-gray-400">Page</div>
                <div className="font-medium text-gray-400">Score</div>
                <div className="font-medium text-gray-400">Issues</div>
                
                {selectedPages.slice(0, 3).map(pageId => {
                  const page = pages.find(p => p.id === pageId);
                  if (!page) return null;
                  
                  return (
                    <React.Fragment key={pageId}>
                      <div className="text-white truncate">{page.title}</div>
                      <div className="text-white">{page.score}</div>
                      <div className="text-white">{page.issues}</div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button onClick={() => setCompareMode(false)}>
                Close Comparison
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}