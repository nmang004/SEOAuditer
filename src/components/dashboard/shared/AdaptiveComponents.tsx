'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText,
  Folder,
  Globe,
  TrendingUp,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  Play,
  Zap,
  Users,
  Star,
  ArrowRight,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Analysis, DashboardConfig, AnalysisData, Recommendation } from '../AnalysisDashboardRouter';

export type CrawlType = 'single' | 'subfolder' | 'domain';

// Adaptive Metric Display Component
export function AdaptiveMetricDisplay({ 
  crawlType, 
  data,
  className 
}: { 
  crawlType: CrawlType;
  data: AnalysisData;
  className?: string;
}) {
  const getRelevantMetrics = (type: CrawlType, analysisData: AnalysisData) => {
    const baseMetrics = [
      {
        id: 'score',
        label: 'SEO Score',
        value: analysisData.score,
        type: 'score' as const,
        icon: <Target className="h-4 w-4" />,
        size: type === 'single' ? ('large' as const) : ('medium' as const)
      }
    ];

    if (type === 'single') {
      return [
        ...baseMetrics,
        {
          id: 'issues',
          label: 'Issues Found',
          value: analysisData.issues.length,
          type: 'count' as const,
          icon: <AlertTriangle className="h-4 w-4" />,
          severity: analysisData.issues.length === 0 ? ('good' as const) : ('warning' as const),
          size: 'medium' as const
        },
        {
          id: 'recommendations',
          label: 'Recommendations',
          value: analysisData.recommendations.length,
          type: 'count' as const,
          icon: <Star className="h-4 w-4" />,
          size: 'medium' as const
        },
        {
          id: 'loadTime',
          label: 'Load Time',
          value: `${analysisData.performance.loadTime}s`,
          type: 'time' as const,
          icon: <Clock className="h-4 w-4" />,
          size: 'medium' as const
        }
      ];
    } else if (type === 'subfolder') {
      return [
        {
          id: 'avgScore',
          label: 'Average Score',
          value: analysisData.score,
          type: 'score' as const,
          icon: <BarChart3 className="h-4 w-4" />,
          size: 'large' as const
        },
        {
          id: 'totalPages',
          label: 'Pages Analyzed',
          value: '8',
          type: 'count' as const,
          icon: <FileText className="h-4 w-4" />,
          size: 'medium' as const
        },
        {
          id: 'commonIssues',
          label: 'Common Issues',
          value: '12',
          type: 'count' as const,
          icon: <AlertTriangle className="h-4 w-4" />,
          severity: 'warning' as const,
          size: 'medium' as const
        },
        {
          id: 'coverage',
          label: 'Coverage',
          value: '87%',
          type: 'percentage' as const,
          icon: <PieChart className="h-4 w-4" />,
          size: 'medium' as const
        }
      ];
    } else { // domain
      return [
        {
          id: 'siteHealth',
          label: 'Site Health',
          value: analysisData.score,
          type: 'score' as const,
          icon: <Activity className="h-4 w-4" />,
          size: 'large' as const
        },
        {
          id: 'crawlCoverage',
          label: 'Crawl Coverage',
          value: '1,247',
          type: 'count' as const,
          icon: <Globe className="h-4 w-4" />,
          size: 'medium' as const
        },
        {
          id: 'criticalPaths',
          label: 'Critical Paths',
          value: '3',
          type: 'count' as const,
          icon: <TrendingUp className="h-4 w-4" />,
          size: 'medium' as const
        },
        {
          id: 'architecture',
          label: 'Architecture Score',
          value: '89%',
          type: 'percentage' as const,
          icon: <Users className="h-4 w-4" />,
          size: 'medium' as const
        }
      ];
    }
  };

  const getColumnCount = (type: CrawlType) => {
    switch (type) {
      case 'single': return 4;
      case 'subfolder': return 4;
      case 'domain': return 4;
      default: return 4;
    }
  };

  const getMetricSize = (metric: any, type: CrawlType) => {
    if (metric.size === 'large') return 'large';
    if (type === 'single' && metric.id === 'score') return 'large';
    return 'medium';
  };

  const metrics = getRelevantMetrics(crawlType, data);
  const columns = getColumnCount(crawlType);

  return (
    <div className={cn(`grid grid-cols-1 md:grid-cols-${columns} gap-4`, className)}>
      {metrics.map(metric => (
        <MetricCard
          key={metric.id}
          {...metric}
          size={getMetricSize(metric, crawlType)}
        />
      ))}
    </div>
  );
}

// Metric Card Component
export function MetricCard({
  label,
  value,
  type,
  icon,
  severity,
  size = 'medium',
  change
}: {
  label: string;
  value: string | number;
  type: 'score' | 'count' | 'time' | 'percentage';
  icon: React.ReactNode;
  severity?: 'good' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  change?: number;
}) {
  const getSeverityColor = (sev?: string) => {
    switch (sev) {
      case 'good': return 'text-green-400 bg-green-500/20';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20';
      case 'error': return 'text-red-400 bg-red-500/20';
      default: return 'text-indigo-400 bg-indigo-500/20';
    }
  };

  const getValueSize = (size: string) => {
    switch (size) {
      case 'small': return 'text-lg';
      case 'large': return 'text-4xl';
      default: return 'text-2xl';
    }
  };

  return (
    <Card className="p-6 bg-gray-800/50 border-gray-700">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2 rounded-lg", getSeverityColor(severity))}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-xs",
            change > 0 ? "text-green-400" : change < 0 ? "text-red-400" : "text-gray-400"
          )}>
            {change > 0 ? <TrendingUp className="h-3 w-3" /> : null}
            <span>{change > 0 ? '+' : ''}{change}%</span>
          </div>
        )}
      </div>
      
      <div className={cn("font-bold text-white mb-1", getValueSize(size))}>
        {value}
      </div>
      <div className="text-sm text-gray-400">{label}</div>
    </Card>
  );
}

// Intelligent Recommendations Component
export function IntelligentRecommendations({ 
  crawlType,
  recommendations 
}: {
  crawlType: CrawlType;
  recommendations: Recommendation[];
}) {
  if (crawlType === 'single') {
    return <SinglePageRecommendations recommendations={recommendations} />;
  }
  
  // Group by impact across pages for multi-page crawls
  const grouped = groupRecommendationsByImpact(recommendations);
  
  return (
    <MultiPageRecommendations
      crawlType={crawlType}
      quickWins={grouped.quickWins}
      highImpact={grouped.highImpact}
      technical={grouped.technical}
    />
  );
}

// Single Page Recommendations
function SinglePageRecommendations({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-white">Action Plan</h3>
      {recommendations.map((rec, index) => (
        <Card key={index} className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-white">{rec.title}</h4>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {rec.impact} impact
              </Badge>
              <Badge variant="outline" className="text-xs">
                {rec.effort} effort
              </Badge>
            </div>
          </div>
          <p className="text-sm text-gray-300 mb-3">{rec.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{rec.category}</span>
            <Button size="sm" variant="ghost">
              Implement
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Multi Page Recommendations
function MultiPageRecommendations({
  crawlType,
  quickWins,
  highImpact,
  technical
}: {
  crawlType: CrawlType;
  quickWins: Recommendation[];
  highImpact: Recommendation[];
  technical: Recommendation[];
}) {
  return (
    <div className="space-y-6">
      {/* Quick Win Opportunities */}
      <QuickWinOpportunities
        title={`${crawlType === 'subfolder' ? 'Section' : 'Site'}-Wide Quick Wins`}
        recommendations={quickWins}
        estimatedImpact={calculateTotalImpact(quickWins)}
      />
      
      {/* High Impact Changes */}
      <HighImpactChanges
        recommendations={highImpact}
        affectedPages={getAffectedPages(highImpact)}
      />
      
      {/* Technical Debt */}
      <TechnicalDebt
        recommendations={technical}
        effortEstimate={calculateEffort(technical)}
      />
    </div>
  );
}

// Quick Win Opportunities Component
function QuickWinOpportunities({
  title,
  recommendations,
  estimatedImpact
}: {
  title: string;
  recommendations: Recommendation[];
  estimatedImpact: number;
}) {
  if (recommendations.length === 0) return null;

  return (
    <Card className="p-6 bg-gradient-to-r from-green-500/10 to-yellow-500/10 border-green-500/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-green-500/20">
          <Zap className="h-5 w-5 text-green-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="text-sm text-gray-400">
            {recommendations.length} opportunities • +{estimatedImpact} score impact
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        {recommendations.slice(0, 3).map((rec, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30">
            <div>
              <h4 className="text-sm font-medium text-white">{rec.title}</h4>
              <p className="text-xs text-gray-400">
                {rec.pages ? `${rec.pages.length} pages` : '1 page'} • {rec.category}
              </p>
            </div>
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              Fix Now
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

// High Impact Changes Component
function HighImpactChanges({
  recommendations,
  affectedPages
}: {
  recommendations: Recommendation[];
  affectedPages: number;
}) {
  return (
    <Card className="p-6 bg-gray-800/50 border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-red-500/20">
          <Target className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">High Impact Opportunities</h3>
          <p className="text-sm text-gray-400">
            {recommendations.length} recommendations affecting {affectedPages} pages
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <div key={index} className="p-4 rounded-lg bg-gray-700/30">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-white">{rec.title}</h4>
              <Badge className="bg-red-500/20 text-red-400">
                High Impact
              </Badge>
            </div>
            <p className="text-sm text-gray-300 mb-3">{rec.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {rec.pages ? `${rec.pages.length} pages affected` : 'Single page'}
              </span>
              <Button size="sm" variant="outline">
                View Details
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Technical Debt Component
function TechnicalDebt({
  recommendations,
  effortEstimate
}: {
  recommendations: Recommendation[];
  effortEstimate: string;
}) {
  return (
    <Card className="p-6 bg-gray-800/50 border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-blue-500/20">
          <Users className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Technical Improvements</h3>
          <p className="text-sm text-gray-400">
            {recommendations.length} technical fixes • {effortEstimate} estimated effort
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30">
            <div>
              <h4 className="text-sm font-medium text-white">{rec.title}</h4>
              <p className="text-xs text-gray-400">{rec.effort} effort • {rec.category}</p>
            </div>
            <Button size="sm" variant="ghost">
              Schedule
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Dashboard Type Helper Component
export function DashboardTypeHelper({ currentType }: { currentType: CrawlType }) {
  const [showHelper, setShowHelper] = useState(true);
  
  if (!showHelper) return null;
  
  const getDashboardDescription = (type: CrawlType): string => {
    const descriptions = {
      single: "Single page analysis shows detailed insights for one URL",
      subfolder: "Subfolder analysis compares all pages within a section",
      domain: "Domain analysis provides comprehensive site-wide insights"
    };
    return descriptions[type];
  };

  const getDashboardTip = (type: CrawlType): string => {
    const tips = {
      single: "Focus on the action plan tab for immediate improvements",
      subfolder: "Use bulk actions to fix issues across multiple pages efficiently",
      domain: "Explore the site map to understand your architecture and critical paths"
    };
    return tips[type];
  };

  const showDashboardTour = (type: CrawlType) => {
    // TODO: Implement dashboard tour functionality
    console.log(`Starting tour for ${type} dashboard`);
  };

  return (
    <Card className="p-4 bg-blue-500/10 border-blue-500/20 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Info className="h-5 w-5 text-blue-400" />
          <div>
            <p className="font-medium text-white">
              {getDashboardDescription(currentType)}
            </p>
            <p className="text-sm text-gray-400">
              {getDashboardTip(currentType)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => showDashboardTour(currentType)}
            className="text-blue-400 hover:text-blue-300"
          >
            <Play className="h-4 w-4 mr-1" />
            Take Tour
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowHelper(false)}
            className="text-gray-400 hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Progressive Features Component
export function ProgressiveFeatures({ 
  crawlType,
  userExperience = 'intermediate'
}: {
  crawlType: CrawlType;
  userExperience?: 'beginner' | 'intermediate' | 'advanced';
}) {
  const features = getAvailableFeatures(crawlType, userExperience);
  
  return (
    <div className="space-y-4">
      {/* Core Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.core.map(feature => (
          <FeatureCard key={feature.id} {...feature} />
        ))}
      </div>
      
      {/* Advanced Features */}
      {features.advanced.length > 0 && (
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <details>
            <summary className="cursor-pointer font-medium text-white mb-4">
              Advanced Features ({features.advanced.length})
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.advanced.map(feature => (
                <FeatureCard key={feature.id} {...feature} badge="Pro" />
              ))}
            </div>
          </details>
        </Card>
      )}
      
      {/* Locked Features */}
      {features.locked.length > 0 && (
        <LockedFeatures
          features={features.locked}
          onUpgrade={() => console.log('Navigate to upgrade')}
        />
      )}
    </div>
  );
}

// Feature Card Component
function FeatureCard({ 
  title, 
  description, 
  icon, 
  badge,
  onClick 
}: { 
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  onClick?: () => void;
}) {
  return (
    <Card className="p-4 bg-gray-800/50 border-gray-700 hover:bg-gray-700/30 transition-all cursor-pointer" onClick={onClick}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-indigo-500/20">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-white">{title}</h4>
            {badge && (
              <Badge variant="outline" className="text-xs">
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
      </div>
    </Card>
  );
}

// Locked Features Component
function LockedFeatures({
  features,
  onUpgrade
}: {
  features: any[];
  onUpgrade: () => void;
}) {
  return (
    <Card className="p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
      <div className="text-center">
        <h3 className="font-semibold text-white mb-2">Unlock Advanced Features</h3>
        <p className="text-sm text-gray-400 mb-4">
          Get access to {features.length} additional features with Pro
        </p>
        <Button onClick={onUpgrade} className="bg-gradient-to-r from-purple-600 to-pink-600">
          Upgrade to Pro
        </Button>
      </div>
    </Card>
  );
}

// Helper Functions
function groupRecommendationsByImpact(recommendations: Recommendation[]) {
  return {
    quickWins: recommendations.filter(r => r.effort === 'low' && r.impact !== 'low'),
    highImpact: recommendations.filter(r => r.impact === 'high'),
    technical: recommendations.filter(r => r.category.toLowerCase().includes('technical'))
  };
}

function calculateTotalImpact(recommendations: Recommendation[]): number {
  return recommendations.length * 5; // Mock calculation
}

function getAffectedPages(recommendations: Recommendation[]): number {
  const allPages = recommendations.flatMap(r => r.pages || ['single']);
  return new Set(allPages).size;
}

function calculateEffort(recommendations: Recommendation[]): string {
  const totalHours = recommendations.length * 2; // Mock calculation
  return `${totalHours} hours`;
}

function getAvailableFeatures(crawlType: CrawlType, userExperience: string) {
  const baseFeatures = [
    {
      id: 'export',
      title: 'Export Reports',
      description: 'Download comprehensive analysis reports',
      icon: <FileText className="h-4 w-4" />
    },
    {
      id: 'monitor',
      title: 'Set Up Monitoring',
      description: 'Track changes over time',
      icon: <Activity className="h-4 w-4" />
    }
  ];

  const advancedFeatures = crawlType !== 'single' ? [
    {
      id: 'bulk-actions',
      title: 'Bulk Actions',
      description: 'Fix issues across multiple pages',
      icon: <Zap className="h-4 w-4" />
    },
    {
      id: 'compare',
      title: 'Page Comparison',
      description: 'Compare pages side by side',
      icon: <BarChart3 className="h-4 w-4" />
    }
  ] : [];

  const lockedFeatures = [
    {
      id: 'api',
      title: 'API Access',
      description: 'Integrate with your workflow',
      icon: <Users className="h-4 w-4" />
    },
    {
      id: 'white-label',
      title: 'White Label Reports',
      description: 'Custom branded reports',
      icon: <Star className="h-4 w-4" />
    }
  ];

  return {
    core: baseFeatures,
    advanced: advancedFeatures,
    locked: lockedFeatures
  };
}