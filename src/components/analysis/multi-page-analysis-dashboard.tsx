'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Globe, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  FileText,
  Eye,
  Copy,
  ExternalLink,
  ChevronRight,
  BarChart3,
  Zap,
  Target,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiPageAnalysisProps {
  sessionId: string;
  crawlData: {
    session: CrawlSession;
    pages: CrawlPage[];
    insights: CrossPageInsights;
    summary: CrawlSummary;
  };
}

interface CrawlSession {
  sessionId: string;
  crawlType: 'single' | 'subfolder' | 'domain';
  status: string;
  startUrl: string;
  pagesCrawled: number;
  totalPages: number;
  successfulPages: number;
  errorPages: number;
  avgScore: number;
  totalIssues: number;
  criticalIssues: number;
  duration: number;
  startedAt: string;
  completedAt?: string;
}

interface CrawlPage {
  id: string;
  url: string;
  depth: number;
  status: 'success' | 'error' | 'skipped';
  score?: number;
  issues?: number;
  responseTime?: number;
  lastAnalyzed: string;
}

interface CrossPageInsights {
  duplicateContent: DuplicateContentGroup[];
  orphanPages: string[];
  brokenLinks: BrokenLink[];
  siteStructure: SiteStructure;
  technicalIssues: TechnicalIssue[];
}

interface DuplicateContentGroup {
  id: string;
  urls: string[];
  similarity: number;
  contentHash: string;
}

interface BrokenLink {
  id: string;
  url: string;
  foundOn: string[];
  statusCode: number;
  error: string;
}

interface SiteStructure {
  depth: number;
  totalPages: number;
  pagesByDepth: Record<number, number>;
  linkDensity: Record<string, number>;
}

interface TechnicalIssue {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedUrls: string[];
  recommendation: string;
}

interface CrawlSummary {
  totalPages: number;
  successfulPages: number;
  errorPages: number;
  avgScore: number;
  totalIssues: number;
  criticalIssues: number;
  duration: number;
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  total, 
  change, 
  icon, 
  status,
  onClick 
}: {
  title: string;
  value: number | string;
  total?: number;
  change?: number;
  icon: React.ReactNode;
  status?: 'success' | 'warning' | 'error';
  onClick?: () => void;
}) {
  const statusColors = {
    success: 'from-green-500/10 to-emerald-500/10 border-green-500/20',
    warning: 'from-yellow-500/10 to-orange-500/10 border-yellow-500/20',
    error: 'from-red-500/10 to-pink-500/10 border-red-500/20'
  };

  return (
    <Card 
      className={cn(
        "p-6 bg-gradient-to-br border backdrop-blur-sm",
        status ? statusColors[status] : "border-gray-700 bg-gray-800/50",
        onClick ? "cursor-pointer hover:scale-105 transition-transform" : ""
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-white">{value}</span>
            {total && (
              <span className="text-sm text-gray-400">/ {total}</span>
            )}
          </div>
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-xs mt-1",
              change > 0 ? "text-green-400" : change < 0 ? "text-red-400" : "text-gray-400"
            )}>
              <TrendingUp className="h-3 w-3" />
              {change > 0 ? '+' : ''}{change}%
            </div>
          )}
        </div>
        <div className={cn(
          "p-2 rounded-lg",
          status === 'success' ? "bg-green-500/20" :
          status === 'warning' ? "bg-yellow-500/20" :
          status === 'error' ? "bg-red-500/20" :
          "bg-indigo-500/20"
        )}>
          <div className={cn(
            "h-5 w-5",
            status === 'success' ? "text-green-400" :
            status === 'warning' ? "text-yellow-400" :
            status === 'error' ? "text-red-400" :
            "text-indigo-400"
          )}>
            {icon}
          </div>
        </div>
      </div>
    </Card>
  );
}

// Insight Card Component
function InsightCard({ 
  insight, 
  expandable = false,
  children 
}: { 
  insight: TechnicalIssue;
  expandable?: boolean;
  children?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  const severityColors = {
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    critical: 'bg-red-500/10 text-red-400 border-red-500/20'
  };

  return (
    <Card className="border-gray-700 bg-gray-800/50">
      <div 
        className={cn(
          "p-4",
          expandable ? "cursor-pointer hover:bg-gray-700/30" : ""
        )}
        onClick={() => expandable && setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-medium text-white">{insight.title}</h4>
              <Badge className={cn("text-xs", severityColors[insight.severity])}>
                {insight.severity}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {insight.affectedUrls.length} pages
              </Badge>
            </div>
            <p className="text-sm text-gray-400 mb-2">{insight.description}</p>
            {!expanded && insight.affectedUrls.length > 0 && (
              <div className="text-xs text-gray-500">
                Affects: {insight.affectedUrls.slice(0, 2).join(', ')}
                {insight.affectedUrls.length > 2 && ` and ${insight.affectedUrls.length - 2} more`}
              </div>
            )}
          </div>
          {expandable && (
            <ChevronRight 
              className={cn(
                "h-4 w-4 text-gray-400 transition-transform",
                expanded ? "rotate-90" : ""
              )} 
            />
          )}
        </div>
      </div>
      
      {expanded && children && (
        <div className="border-t border-gray-700 p-4">
          {children}
        </div>
      )}
    </Card>
  );
}

// Pages Table Component
function PagesTable({ pages }: { pages: CrawlPage[] }) {
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'url' | 'score' | 'issues' | 'depth'>('score');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all');

  const filteredPages = pages
    .filter(page => {
      if (statusFilter !== 'all' && page.status !== statusFilter) return false;
      if (filter && !page.url.toLowerCase().includes(filter.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return (b.score || 0) - (a.score || 0);
        case 'issues':
          return (b.issues || 0) - (a.issues || 0);
        case 'depth':
          return a.depth - b.depth;
        default:
          return a.url.localeCompare(b.url);
      }
    });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by URL..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
        </select>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="score">Sort by Score</option>
          <option value="issues">Sort by Issues</option>
          <option value="url">Sort by URL</option>
          <option value="depth">Sort by Depth</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">URL</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Score</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Issues</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Depth</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Status</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredPages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-white truncate" title={page.url}>
                        {page.url}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {page.score !== undefined ? (
                      <span className={cn(
                        "font-medium",
                        page.score >= 80 ? "text-green-400" :
                        page.score >= 60 ? "text-yellow-400" :
                        "text-red-400"
                      )}>
                        {page.score}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {page.issues !== undefined ? (
                      <Badge variant={page.issues > 5 ? "destructive" : page.issues > 0 ? "secondary" : "default"}>
                        {page.issues}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-xs">
                      {page.depth}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge 
                      variant={
                        page.status === 'success' ? 'default' :
                        page.status === 'error' ? 'destructive' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {page.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredPages.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No pages match your filters
          </div>
        )}
      </div>
    </div>
  );
}

// Main Dashboard Component
export function MultiPageAnalysisDashboard({ sessionId, crawlData }: MultiPageAnalysisProps) {
  const { session, pages, insights, summary } = crawlData;
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Multi-Page Analysis Results
          </h1>
          <p className="text-gray-400 mt-1">
            {session.crawlType.charAt(0).toUpperCase() + session.crawlType.slice(1)} crawl of {session.startUrl}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-gray-600 text-gray-300">
            <RefreshCw className="h-4 w-4 mr-2" />
            Re-analyze
          </Button>
          <Button variant="outline" className="border-gray-600 text-gray-300">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pages Analyzed"
          value={session.pagesCrawled}
          total={session.totalPages}
          icon={<Globe />}
          status="success"
        />
        <StatCard
          title="Issues Found"
          value={session.totalIssues}
          icon={<AlertTriangle />}
          status={session.criticalIssues > 0 ? "error" : session.totalIssues > 0 ? "warning" : "success"}
        />
        <StatCard
          title="Average Score"
          value={Math.round(session.avgScore)}
          change={5} // This would be calculated from previous crawls
          icon={<TrendingUp />}
          status={session.avgScore >= 80 ? "success" : session.avgScore >= 60 ? "warning" : "error"}
        />
        <StatCard
          title="Crawl Duration"
          value={`${Math.round(session.duration / 60)}m`}
          icon={<Clock />}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Zap className="w-4 h-4 mr-2" />
            Site Insights
          </TabsTrigger>
          <TabsTrigger value="pages">
            <FileText className="w-4 h-4 mr-2" />
            Pages ({pages.length})
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <Target className="w-4 h-4 mr-2" />
            Action Plan
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Site Structure Visualization */}
          <Card className="p-6 border-gray-700 bg-gray-800/50">
            <h3 className="text-xl font-semibold text-white mb-4">Site Structure</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-white mb-3">Pages by Depth</h4>
                <div className="space-y-2">
                  {Object.entries(insights.siteStructure.pagesByDepth).map(([depth, count]) => (
                    <div key={depth} className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 w-16">Level {depth}:</span>
                      <Progress 
                        value={(count / session.totalPages) * 100} 
                        className="flex-1 h-2" 
                      />
                      <span className="text-sm text-white w-8">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-white mb-3">Quick Stats</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Maximum Depth:</span>
                    <span className="text-white">{insights.siteStructure.depth} levels</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Successful Pages:</span>
                    <span className="text-green-400">{session.successfulPages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Error Pages:</span>
                    <span className="text-red-400">{session.errorPages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Orphan Pages:</span>
                    <span className="text-yellow-400">{insights.orphanPages.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Site Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Duplicate Content */}
            {insights.duplicateContent.length > 0 && (
              <Card className="p-6 border-gray-700 bg-gray-800/50">
                <h3 className="text-lg font-semibold text-white mb-4">Duplicate Content</h3>
                <div className="space-y-3">
                  {insights.duplicateContent.slice(0, 3).map((group) => (
                    <div key={group.id} className="bg-gray-900/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">
                          {Math.round(group.similarity)}% similar
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {group.urls.length} pages
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-400 space-y-1">
                        {group.urls.slice(0, 2).map((url) => (
                          <div key={url} className="truncate">{url}</div>
                        ))}
                        {group.urls.length > 2 && (
                          <div>+ {group.urls.length - 2} more pages</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Broken Links */}
            {insights.brokenLinks.length > 0 && (
              <Card className="p-6 border-gray-700 bg-gray-800/50">
                <h3 className="text-lg font-semibold text-white mb-4">Broken Links</h3>
                <div className="space-y-3">
                  {insights.brokenLinks.slice(0, 5).map((link) => (
                    <div key={link.id} className="bg-gray-900/50 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white truncate">
                            {link.url}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Status: {link.statusCode} • Found on {link.foundOn.length} pages
                          </div>
                        </div>
                        <Badge variant="destructive" className="text-xs ml-2">
                          {link.statusCode}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Technical Issues */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Technical Issues</h3>
            {insights.technicalIssues.map((insight) => (
              <InsightCard 
                key={insight.id} 
                insight={insight} 
                expandable 
              >
                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium text-white mb-2">Recommendation</h5>
                    <p className="text-sm text-gray-300">{insight.recommendation}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-white mb-2">Affected Pages</h5>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {insight.affectedUrls.map((url, i) => (
                        <div key={i} className="text-xs text-gray-400 truncate">
                          {url}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </InsightCard>
            ))}
          </div>
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages">
          <PagesTable pages={pages} />
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card className="p-6 border-indigo-500/20 bg-indigo-500/5">
            <h3 className="text-xl font-semibold text-white mb-4">Bulk Action Plan</h3>
            <p className="text-gray-300 mb-6">
              Apply these optimizations across multiple pages for maximum impact.
            </p>
            
            <div className="space-y-4">
              <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                Fix All Meta Description Issues ({insights.technicalIssues.filter(i => i.type === 'meta_description').length} pages)
              </Button>
              <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                Optimize All Image Alt Tags ({insights.technicalIssues.filter(i => i.type === 'image_alt').length} pages)
              </Button>
              <Button className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700">
                Fix Heading Structure Issues ({insights.technicalIssues.filter(i => i.type === 'headings').length} pages)
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}