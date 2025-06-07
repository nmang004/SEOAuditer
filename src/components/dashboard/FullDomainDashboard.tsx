'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe,
  BarChart3,
  Network,
  Eye,
  Calendar,
  TrendingUp,
  TrendingDown,
  MapPin,
  Layers,
  FileText,
  AlertTriangle,
  CheckCircle,
  Download,
  Settings,
  RefreshCw,
  Map as Sitemap,
  TreePine,
  FolderOpen,
  ExternalLink,
  Clock,
  Users,
  Target,
  Zap,
  PieChart,
  Activity,
  Search,
  Link2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Analysis, DashboardConfig } from './AnalysisDashboardRouter';

interface FullDomainDashboardProps {
  analysis: Analysis;
  config: DashboardConfig;
}

interface DomainHealth {
  overall: number;
  technical: number;
  content: number;
  performance: number;
  architecture: number;
}

interface SiteNode {
  id: string;
  url: string;
  title: string;
  score: number;
  depth: number;
  pageType: string;
  traffic?: number;
  issues: number;
  children?: SiteNode[];
}

interface CriticalPath {
  id: string;
  name: string;
  steps: string[];
  conversionRate: number;
  avgTime: number;
  issues: number;
}

// Health Score Visual Component
function HealthScoreVisual({ health }: { health: DomainHealth }) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'stroke-green-500';
    if (score >= 70) return 'stroke-yellow-500';
    if (score >= 50) return 'stroke-orange-500';
    return 'stroke-red-500';
  };

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (health.overall / 100) * circumference;

  return (
    <div className="flex items-center gap-8">
      {/* Main Health Score Circle */}
      <div className="relative">
        <svg width="200" height="200" className="transform -rotate-90">
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-gray-700"
          />
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn("transition-all duration-1000", getScoreBg(health.overall))}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-4xl font-bold", getScoreColor(health.overall))}>
            {health.overall}
          </span>
          <span className="text-sm text-gray-400">Domain Health</span>
        </div>
      </div>

      {/* Health Breakdown */}
      <div className="space-y-4 flex-1">
        {[
          { label: 'Technical Health', value: health.technical, icon: <Settings className="h-4 w-4" /> },
          { label: 'Content Quality', value: health.content, icon: <FileText className="h-4 w-4" /> },
          { label: 'Performance', value: health.performance, icon: <Activity className="h-4 w-4" /> },
          { label: 'Architecture', value: health.architecture, icon: <Network className="h-4 w-4" /> }
        ].map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="p-2 rounded bg-gray-700">
              {item.icon}
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-300">{item.label}</span>
                <span className={cn("text-sm font-semibold", getScoreColor(item.value))}>
                  {item.value}%
                </span>
              </div>
              <Progress value={item.value} className="h-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Domain Stats Component
function DomainStats({ analysis }: { analysis: Analysis }) {
  const stats = [
    { label: 'Total Pages', value: '1,247', change: +12 },
    { label: 'Indexed Pages', value: '1,198', change: +8 },
    { label: 'Max Crawl Depth', value: '7', change: 0 },
    { label: 'Orphan Pages', value: '23', change: -5 }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="p-4 bg-gray-800/50 border-gray-700 text-center">
          <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
          <div className="text-sm text-gray-400 mb-2">{stat.label}</div>
          {stat.change !== 0 && (
            <div className={cn(
              "flex items-center justify-center gap-1 text-xs",
              stat.change > 0 ? "text-green-400" : "text-red-400"
            )}>
              {stat.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {stat.change > 0 ? '+' : ''}{stat.change}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// Interactive Site Map Component
function InteractiveSiteMap({ nodes }: { nodes: SiteNode[] }) {
  const [selectedNode, setSelectedNode] = useState<SiteNode | null>(null);
  const [filterDepth, setFilterDepth] = useState(3);

  // Generate mock site structure
  const siteStructure = useMemo(() => {
    const mockNodes: SiteNode[] = [
      {
        id: 'home',
        url: '/',
        title: 'Homepage',
        score: 92,
        depth: 0,
        pageType: 'landing',
        traffic: 45000,
        issues: 1,
        children: [
          {
            id: 'products',
            url: '/products',
            title: 'Products',
            score: 88,
            depth: 1,
            pageType: 'category',
            traffic: 12000,
            issues: 2,
            children: [
              {
                id: 'product-1',
                url: '/products/seo-tool',
                title: 'SEO Tool',
                score: 85,
                depth: 2,
                pageType: 'product',
                traffic: 3000,
                issues: 1
              }
            ]
          },
          {
            id: 'blog',
            url: '/blog',
            title: 'Blog',
            score: 78,
            depth: 1,
            pageType: 'category',
            traffic: 8000,
            issues: 5,
            children: [
              {
                id: 'blog-1',
                url: '/blog/seo-guide',
                title: 'SEO Guide',
                score: 82,
                depth: 2,
                pageType: 'article',
                traffic: 2500,
                issues: 2
              }
            ]
          },
          {
            id: 'about',
            url: '/about',
            title: 'About Us',
            score: 75,
            depth: 1,
            pageType: 'info',
            traffic: 1500,
            issues: 3
          }
        ]
      }
    ];
    return mockNodes;
  }, []);

  const renderNode = (node: SiteNode, level: number = 0) => {
    if (level > filterDepth) return null;

    const getScoreColor = (score: number) => {
      if (score >= 90) return 'border-green-500 bg-green-500/10';
      if (score >= 70) return 'border-yellow-500 bg-yellow-500/10';
      if (score >= 50) return 'border-orange-500 bg-orange-500/10';
      return 'border-red-500 bg-red-500/10';
    };

    return (
      <div key={node.id} className="space-y-2">
        <div
          className={cn(
            "p-3 border-2 rounded-lg cursor-pointer transition-all",
            getScoreColor(node.score),
            selectedNode?.id === node.id ? "ring-2 ring-indigo-500" : ""
          )}
          onClick={() => setSelectedNode(node)}
          style={{ marginLeft: `${level * 20}px` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {node.pageType === 'landing' && <Globe className="h-4 w-4" />}
                {node.pageType === 'category' && <FolderOpen className="h-4 w-4" />}
                {node.pageType === 'product' && <Target className="h-4 w-4" />}
                {node.pageType === 'article' && <FileText className="h-4 w-4" />}
                {node.pageType === 'info' && <Users className="h-4 w-4" />}
                <span className="font-medium text-white text-sm">{node.title}</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {node.pageType}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-white">{node.score}</span>
              {node.issues > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {node.issues}
                </Badge>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-1">{node.url}</div>
          {node.traffic && (
            <div className="text-xs text-gray-500 mt-1">
              {node.traffic.toLocaleString()} monthly visits
            </div>
          )}
        </div>
        
        {node.children && (
          <div className="space-y-2">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Site Structure</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Depth:</span>
            <input
              type="range"
              min="1"
              max="5"
              value={filterDepth}
              onChange={(e) => setFilterDepth(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-white">{filterDepth}</span>
          </div>
        </div>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {siteStructure.map(node => renderNode(node))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-white mb-4">Page Details</h3>
        {selectedNode ? (
          <Card className="p-4 bg-gray-800/50 border-gray-700">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-white">{selectedNode.title}</h4>
                <p className="text-sm text-gray-400">{selectedNode.url}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-400">Score:</span>
                  <span className="text-white ml-1">{selectedNode.score}</span>
                </div>
                <div>
                  <span className="text-gray-400">Issues:</span>
                  <span className="text-white ml-1">{selectedNode.issues}</span>
                </div>
                <div>
                  <span className="text-gray-400">Depth:</span>
                  <span className="text-white ml-1">{selectedNode.depth}</span>
                </div>
                <div>
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white ml-1">{selectedNode.pageType}</span>
                </div>
              </div>

              {selectedNode.traffic && (
                <div className="text-sm">
                  <span className="text-gray-400">Monthly Traffic:</span>
                  <span className="text-white ml-1">{selectedNode.traffic.toLocaleString()}</span>
                </div>
              )}

              <Button size="sm" className="w-full">
                <Eye className="h-4 w-4 mr-1" />
                Analyze Page
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-4 bg-gray-800/50 border-gray-700 text-center">
            <p className="text-gray-400">Select a page to view details</p>
          </Card>
        )}
      </div>
    </div>
  );
}

// Critical Paths Component
function CriticalPaths() {
  const paths: CriticalPath[] = [
    {
      id: 'conversion',
      name: 'Product Purchase Flow',
      steps: ['Homepage', 'Products', 'Product Page', 'Checkout', 'Success'],
      conversionRate: 2.4,
      avgTime: 8.5,
      issues: 3
    },
    {
      id: 'signup',
      name: 'User Registration',
      steps: ['Homepage', 'Signup', 'Verification', 'Welcome'],
      conversionRate: 12.1,
      avgTime: 3.2,
      issues: 1
    },
    {
      id: 'support',
      name: 'Support Request',
      steps: ['Any Page', 'Contact', 'Form Submit', 'Confirmation'],
      conversionRate: 8.7,
      avgTime: 4.1,
      issues: 2
    }
  ];

  return (
    <div className="space-y-4">
      {paths.map((path) => (
        <Card key={path.id} className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-medium text-white">{path.name}</h4>
              <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                <span>Conversion: {path.conversionRate}%</span>
                <span>Avg Time: {path.avgTime}min</span>
                {path.issues > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {path.issues} issues
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto">
            {path.steps.map((step, index) => (
              <React.Fragment key={step}>
                <div className="flex-shrink-0 px-3 py-1 bg-gray-700 rounded text-sm text-white">
                  {step}
                </div>
                {index < path.steps.length - 1 && (
                  <TrendingUp className="h-4 w-4 text-gray-500 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

// Action Card Component
function ActionCard({
  title,
  description,
  icon,
  onClick
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Card className="p-6 bg-gray-800/50 border-gray-700 hover:bg-gray-700/30 transition-all cursor-pointer" onClick={onClick}>
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-indigo-500/20">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-white mb-2">{title}</h4>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
        <ExternalLink className="h-5 w-5 text-gray-400" />
      </div>
    </Card>
  );
}

// Main Domain Dashboard Component
export function FullDomainDashboard({ analysis, config }: FullDomainDashboardProps) {
  const [activeView, setActiveView] = useState<'overview' | 'explorer' | 'insights'>('overview');

  // Mock domain health data
  const domainHealth: DomainHealth = {
    overall: 84,
    technical: 78,
    content: 88,
    performance: 82,
    architecture: 89
  };

  const mockNodes: SiteNode[] = []; // Will be populated in InteractiveSiteMap

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Globe className="h-6 w-6 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white">Full Domain Analysis</h1>
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

      {/* Domain Health Hero */}
      <Card className="p-8 bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-gray-600">
        <HealthScoreVisual health={domainHealth} />
      </Card>

      {/* Domain Stats */}
      <DomainStats analysis={analysis} />

      {/* View Selector */}
      <div className="flex rounded-lg bg-gray-800 p-1 border border-gray-700 w-fit">
        <Button
          variant={activeView === 'overview' ? 'default' : 'ghost'}
          onClick={() => setActiveView('overview')}
          className="flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Overview
        </Button>
        <Button
          variant={activeView === 'explorer' ? 'default' : 'ghost'}
          onClick={() => setActiveView('explorer')}
          className="flex items-center gap-2"
        >
          <Search className="h-4 w-4" />
          Site Explorer
        </Button>
        <Button
          variant={activeView === 'insights' ? 'default' : 'ghost'}
          onClick={() => setActiveView('insights')}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Domain Insights
        </Button>
      </div>

      {/* Dynamic Content */}
      {activeView === 'overview' && (
        <div className="space-y-8">
          {/* Site Architecture */}
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <h3 className="font-semibold text-white mb-4">Site Architecture Overview</h3>
            <InteractiveSiteMap nodes={mockNodes} />
          </Card>

          {/* Critical Paths */}
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <h3 className="font-semibold text-white mb-4">Critical User Paths</h3>
            <CriticalPaths />
          </Card>
        </div>
      )}

      {activeView === 'explorer' && (
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="font-semibold text-white mb-4">Site Explorer</h3>
          <InteractiveSiteMap nodes={mockNodes} />
        </Card>
      )}

      {activeView === 'insights' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <h3 className="font-semibold text-white mb-4">Content Insights</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-700/30 rounded-lg">
                <h4 className="font-medium text-white mb-2">Duplicate Content</h4>
                <p className="text-sm text-gray-400">12 pages with similar content detected</p>
                <Button size="sm" className="mt-2">View Details</Button>
              </div>
              <div className="p-4 bg-gray-700/30 rounded-lg">
                <h4 className="font-medium text-white mb-2">Content Gaps</h4>
                <p className="text-sm text-gray-400">Missing content for 5 target keywords</p>
                <Button size="sm" className="mt-2">View Opportunities</Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <h3 className="font-semibold text-white mb-4">Technical Insights</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-700/30 rounded-lg">
                <h4 className="font-medium text-white mb-2">Redirect Chains</h4>
                <p className="text-sm text-gray-400">7 redirect chains found affecting performance</p>
                <Button size="sm" className="mt-2">Fix Issues</Button>
              </div>
              <div className="p-4 bg-gray-700/30 rounded-lg">
                <h4 className="font-medium text-white mb-2">Orphan Pages</h4>
                <p className="text-sm text-gray-400">23 pages not linked from any other page</p>
                <Button size="sm" className="mt-2">Review Pages</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Domain Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard
          title="Generate XML Sitemap"
          description="Create an optimized sitemap based on crawl data"
          icon={<Sitemap className="h-5 w-5 text-indigo-400" />}
          onClick={() => console.log('Generate sitemap')}
        />
        <ActionCard
          title="Export Architecture Report"
          description="Comprehensive site structure analysis"
          icon={<Download className="h-5 w-5 text-indigo-400" />}
          onClick={() => console.log('Export architecture')}
        />
        <ActionCard
          title="Schedule Full Re-crawl"
          description="Set up periodic domain monitoring"
          icon={<RefreshCw className="h-5 w-5 text-indigo-400" />}
          onClick={() => console.log('Schedule crawl')}
        />
      </div>
    </div>
  );
}