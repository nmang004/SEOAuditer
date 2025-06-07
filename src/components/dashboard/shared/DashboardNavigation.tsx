'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  FileText,
  Folder,
  Globe,
  ArrowLeftRight,
  Check,
  Plus,
  Calendar,
  ExternalLink,
  RefreshCw,
  Download,
  Settings,
  Share,
  Bookmark
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Analysis } from '../AnalysisDashboardRouter';

export type CrawlType = 'single' | 'subfolder' | 'domain';

interface RelatedAnalysis {
  id: string;
  crawlType: CrawlType;
  url: string;
  createdAt: string;
  status: string;
  score?: number;
}

// Analysis Type Switcher Component
export function AnalysisTypeSwitcher({ 
  currentAnalysis,
  projectId 
}: {
  currentAnalysis: Analysis;
  projectId: string;
}) {
  const router = useRouter();
  const [relatedAnalyses, setRelatedAnalyses] = useState<RelatedAnalysis[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRelatedAnalyses();
  }, [currentAnalysis.url, projectId]);

  const loadRelatedAnalyses = async () => {
    setLoading(true);
    try {
      // Mock related analyses for now
      const mockAnalyses: RelatedAnalysis[] = [
        {
          id: 'analysis-1',
          crawlType: 'single' as const,
          url: currentAnalysis.url,
          createdAt: '2024-01-15T10:00:00Z',
          status: 'completed',
          score: 88
        },
        {
          id: 'analysis-2',
          crawlType: 'subfolder' as const,
          url: currentAnalysis.url.replace(/\/[^\/]*$/, '/'),
          createdAt: '2024-01-10T15:30:00Z',
          status: 'completed',
          score: 82
        },
        {
          id: 'analysis-3',
          crawlType: 'domain' as const,
          url: new URL(currentAnalysis.url).origin,
          createdAt: '2024-01-05T09:15:00Z',
          status: 'completed',
          score: 79
        }
      ].filter(analysis => 
        analysis.id !== currentAnalysis.id && 
        analysis.crawlType !== currentAnalysis.crawlType
      );

      setRelatedAnalyses(mockAnalyses);
    } catch (error) {
      console.error('Error loading related analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToAnalysis = (analysisId: string) => {
    router.push(`/dashboard/projects/${projectId}/analyses/${analysisId}`);
  };

  const startNewAnalysis = (url: string) => {
    router.push(`/dashboard/projects/${projectId}/analyses/new?url=${encodeURIComponent(url)}`);
  };

  const getTypeIcon = (type: CrawlType) => {
    switch (type) {
      case 'single': return <FileText className="h-4 w-4" />;
      case 'subfolder': return <Folder className="h-4 w-4" />;
      case 'domain': return <Globe className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: CrawlType) => {
    switch (type) {
      case 'single': return 'Single Page';
      case 'subfolder': return 'Subfolder';
      case 'domain': return 'Full Domain';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="border-gray-700 text-gray-300">
          <ArrowLeftRight className="h-4 w-4 mr-2" />
          Switch Analysis Type
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 bg-gray-800 border-gray-700">
        <DropdownMenuLabel className="text-gray-300">Available Analyses</DropdownMenuLabel>
        
        {/* Current Analysis */}
        <DropdownMenuItem disabled className="flex items-center gap-2 opacity-50">
          <Check className="h-4 w-4 text-green-400" />
          {getTypeIcon(currentAnalysis.crawlType)}
          <div className="flex-1">
            <p className="font-medium">{getTypeLabel(currentAnalysis.crawlType)} Analysis</p>
            <p className="text-xs text-gray-500">Current</p>
          </div>
          <Badge variant="outline" className="text-xs">
            Active
          </Badge>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-gray-700" />
        
        {/* Related Analyses */}
        {relatedAnalyses.length > 0 ? (
          relatedAnalyses.map(analysis => (
            <DropdownMenuItem
              key={analysis.id}
              onClick={() => navigateToAnalysis(analysis.id)}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-700"
            >
              {getTypeIcon(analysis.crawlType)}
              <div className="flex-1">
                <p className="font-medium">{getTypeLabel(analysis.crawlType)} Analysis</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(analysis.createdAt)}</span>
                  {analysis.score && (
                    <>
                      <span>•</span>
                      <span>Score: {analysis.score}</span>
                    </>
                  )}
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled className="text-gray-500">
            No related analyses found
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator className="bg-gray-700" />
        
        {/* Start New Analysis */}
        <DropdownMenuItem 
          onClick={() => startNewAnalysis(currentAnalysis.url)}
          className="flex items-center gap-2 cursor-pointer hover:bg-gray-700"
        >
          <Plus className="h-4 w-4" />
          <span>Start New Analysis</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Dashboard Actions Component
export function DashboardActions({ 
  analysis,
  onReanalyze,
  onExport,
  onShare,
  onSchedule
}: {
  analysis: Analysis;
  onReanalyze?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  onSchedule?: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {onReanalyze && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onReanalyze}
          className="border-gray-700 text-gray-300 hover:bg-gray-700"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Re-analyze
        </Button>
      )}
      
      {onExport && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onExport}
          className="border-gray-700 text-gray-300 hover:bg-gray-700"
        >
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>
      )}
      
      {onShare && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onShare}
          className="border-gray-700 text-gray-300 hover:bg-gray-700"
        >
          <Share className="h-4 w-4 mr-1" />
          Share
        </Button>
      )}
      
      {onSchedule && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onSchedule}
          className="border-gray-700 text-gray-300 hover:bg-gray-700"
        >
          <Calendar className="h-4 w-4 mr-1" />
          Schedule
        </Button>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="border-gray-700 text-gray-300 hover:bg-gray-700"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-gray-800 border-gray-700">
          <DropdownMenuItem className="hover:bg-gray-700">
            <Bookmark className="h-4 w-4 mr-2" />
            Bookmark Analysis
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-gray-700">
            <Settings className="h-4 w-4 mr-2" />
            Analysis Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-700" />
          <DropdownMenuItem className="hover:bg-gray-700 text-red-400">
            Delete Analysis
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Breadcrumb Navigation Component
export function DashboardBreadcrumb({ 
  projectId,
  projectName,
  analysisId,
  crawlType,
  url
}: {
  projectId: string;
  projectName?: string;
  analysisId: string;
  crawlType: CrawlType;
  url: string;
}) {
  const router = useRouter();

  const getTypeLabel = (type: CrawlType) => {
    switch (type) {
      case 'single': return 'Single Page';
      case 'subfolder': return 'Subfolder';
      case 'domain': return 'Full Domain';
    }
  };

  const truncateUrl = (url: string, maxLength: number = 40) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-400 mb-6">
      <button
        onClick={() => router.push('/dashboard')}
        className="hover:text-white transition-colors"
      >
        Dashboard
      </button>
      <span>/</span>
      <button
        onClick={() => router.push('/dashboard/projects')}
        className="hover:text-white transition-colors"
      >
        Projects
      </button>
      <span>/</span>
      <button
        onClick={() => router.push(`/dashboard/projects/${projectId}`)}
        className="hover:text-white transition-colors"
      >
        {projectName || projectId}
      </button>
      <span>/</span>
      <button
        onClick={() => router.push(`/dashboard/projects/${projectId}/analyses`)}
        className="hover:text-white transition-colors"
      >
        Analyses
      </button>
      <span>/</span>
      <span className="text-white font-medium">
        {getTypeLabel(crawlType)} Analysis
      </span>
      <span className="text-gray-500">•</span>
      <span className="text-gray-500" title={url}>
        {truncateUrl(url)}
      </span>
    </nav>
  );
}

// Quick Navigation Component
export function QuickNavigation({ 
  activeTab,
  onTabChange,
  tabs
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    badge?: string | number;
  }>;
}) {
  return (
    <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            activeTab === tab.id
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-700"
          )}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.badge && (
            <Badge 
              variant={activeTab === tab.id ? "secondary" : "outline"}
              className="ml-1 text-xs"
            >
              {tab.badge}
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
}

// Analysis Status Indicator Component
export function AnalysisStatusIndicator({ 
  analysis 
}: { 
  analysis: Analysis;
}) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          color: 'text-green-400',
          bg: 'bg-green-500/20',
          icon: <Check className="h-3 w-3" />,
          label: 'Completed'
        };
      case 'running':
        return {
          color: 'text-blue-400',
          bg: 'bg-blue-500/20',
          icon: <RefreshCw className="h-3 w-3 animate-spin" />,
          label: 'Running'
        };
      case 'pending':
        return {
          color: 'text-yellow-400',
          bg: 'bg-yellow-500/20',
          icon: <Calendar className="h-3 w-3" />,
          label: 'Pending'
        };
      case 'failed':
        return {
          color: 'text-red-400',
          bg: 'bg-red-500/20',
          icon: <RefreshCw className="h-3 w-3" />,
          label: 'Failed'
        };
      default:
        return {
          color: 'text-gray-400',
          bg: 'bg-gray-500/20',
          icon: <RefreshCw className="h-3 w-3" />,
          label: 'Unknown'
        };
    }
  };

  const config = getStatusConfig(analysis.status);

  return (
    <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full", config.bg)}>
      <div className={config.color}>
        {config.icon}
      </div>
      <span className={cn("text-sm font-medium", config.color)}>
        {config.label}
      </span>
      {analysis.completedAt && (
        <span className="text-xs text-gray-500">
          • {new Date(analysis.completedAt).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

// Dashboard Header Component
export function DashboardHeader({ 
  analysis,
  projectId,
  projectName,
  onAction
}: {
  analysis: Analysis;
  projectId: string;
  projectName?: string;
  onAction?: (action: string) => void;
}) {
  const getTypeIcon = (type: CrawlType) => {
    switch (type) {
      case 'single': return <FileText className="h-6 w-6 text-indigo-400" />;
      case 'subfolder': return <Folder className="h-6 w-6 text-indigo-400" />;
      case 'domain': return <Globe className="h-6 w-6 text-indigo-400" />;
    }
  };

  const getTypeLabel = (type: CrawlType) => {
    switch (type) {
      case 'single': return 'Single Page Analysis';
      case 'subfolder': return 'Subfolder Analysis';
      case 'domain': return 'Full Domain Analysis';
    }
  };

  return (
    <div className="space-y-4">
      <DashboardBreadcrumb
        projectId={projectId}
        projectName={projectName}
        analysisId={analysis.id}
        crawlType={analysis.crawlType}
        url={analysis.url}
      />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {getTypeIcon(analysis.crawlType)}
            <div>
              <h1 className="text-2xl font-bold text-white">
                {getTypeLabel(analysis.crawlType)}
              </h1>
              <p className="text-gray-400">{analysis.url}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <AnalysisStatusIndicator analysis={analysis} />
            <Badge variant="outline" className="border-indigo-500 text-indigo-400">
              {analysis.crawlType}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <AnalysisTypeSwitcher 
            currentAnalysis={analysis}
            projectId={projectId}
          />
          
          <DashboardActions
            analysis={analysis}
            onReanalyze={() => onAction?.('reanalyze')}
            onExport={() => onAction?.('export')}
            onShare={() => onAction?.('share')}
            onSchedule={() => onAction?.('schedule')}
          />
        </div>
      </div>
    </div>
  );
}