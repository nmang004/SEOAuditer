import { NextRequest, NextResponse } from 'next/server';

interface DashboardConfig {
  dashboardType: 'single' | 'subfolder' | 'domain';
  layout: {
    showSiteMap: boolean;
    showCrossPageInsights: boolean;
    showBulkActions: boolean;
    primaryMetrics: string[];
    defaultView: string;
    tabs: string[];
  };
  features: string[];
  permissions: string[];
  customization: {
    theme: string;
    viewPreferences: Record<string, any>;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const analysisId = resolvedParams.id;
  
  try {
    // In a real implementation, you would:
    // 1. Fetch the analysis from database
    // 2. Determine crawl type from analysis metadata
    // 3. Get user preferences
    // 4. Generate appropriate dashboard config
    
    // For now, we'll determine the dashboard type from the analysis ID pattern
    let dashboardType: 'single' | 'subfolder' | 'domain' = 'single';
    
    if (analysisId.includes('multi') || analysisId.includes('subfolder')) {
      dashboardType = 'subfolder';
    } else if (analysisId.includes('domain') || analysisId.includes('site')) {
      dashboardType = 'domain';
    }
    
    // Generate config based on dashboard type
    const config: DashboardConfig = getDashboardConfig(dashboardType);
    
    return NextResponse.json({
      success: true,
      config
    });
    
  } catch (error) {
    console.error('Error fetching dashboard config:', error);
    
    // Fallback to single page dashboard config
    return NextResponse.json({
      success: true,
      config: getDashboardConfig('single')
    });
  }
}

function getDashboardConfig(dashboardType: 'single' | 'subfolder' | 'domain'): DashboardConfig {
  const configs: Record<string, DashboardConfig> = {
    single: {
      dashboardType: 'single',
      layout: {
        showSiteMap: false,
        showCrossPageInsights: false,
        showBulkActions: false,
        primaryMetrics: ['score', 'issues', 'recommendations', 'performance'],
        defaultView: 'recommendations',
        tabs: ['overview', 'recommendations', 'technical', 'content', 'performance']
      },
      features: [
        'export-report',
        'reanalyze',
        'monitor-page',
        'share-results',
        'download-pdf'
      ],
      permissions: [
        'view-analysis',
        'export-data',
        'share-results'
      ],
      customization: {
        theme: 'dark',
        viewPreferences: {
          showScoreRing: true,
          showQuickWins: true,
          expandedRecommendations: false
        }
      }
    },
    
    subfolder: {
      dashboardType: 'subfolder',
      layout: {
        showSiteMap: true,
        showCrossPageInsights: true,
        showBulkActions: true,
        primaryMetrics: ['avgScore', 'totalPages', 'commonIssues', 'coverage'],
        defaultView: 'pages',
        tabs: ['overview', 'pages', 'insights', 'recommendations', 'compare']
      },
      features: [
        'export-report',
        'bulk-actions',
        'page-comparison',
        'section-insights',
        'bulk-recommendations',
        'progress-tracking',
        'filter-pages',
        'sort-pages'
      ],
      permissions: [
        'view-analysis',
        'export-data',
        'bulk-actions',
        'compare-pages',
        'share-results'
      ],
      customization: {
        theme: 'dark',
        viewPreferences: {
          pageViewMode: 'cards',
          showPageThumbnails: false,
          groupByStatus: true,
          autoRefresh: false
        }
      }
    },
    
    domain: {
      dashboardType: 'domain',
      layout: {
        showSiteMap: true,
        showCrossPageInsights: true,
        showBulkActions: true,
        primaryMetrics: ['siteHealth', 'crawlCoverage', 'criticalPaths', 'architecture'],
        defaultView: 'sitemap',
        tabs: ['overview', 'sitemap', 'insights', 'pages', 'recommendations', 'reports']
      },
      features: [
        'site-architecture',
        'critical-paths',
        'domain-insights',
        'export-sitemap',
        'architecture-report',
        'bulk-recommendations',
        'cross-page-analysis',
        'content-gap-analysis',
        'duplicate-content-detection',
        'orphan-page-detection',
        'redirect-chain-analysis',
        'performance-overview'
      ],
      permissions: [
        'view-analysis',
        'export-data',
        'bulk-actions',
        'architecture-analysis',
        'advanced-insights',
        'share-results',
        'schedule-monitoring'
      ],
      customization: {
        theme: 'dark',
        viewPreferences: {
          siteMapDepth: 3,
          showTrafficData: true,
          highlightCriticalPaths: true,
          groupBySection: true
        }
      }
    }
  };
  
  return configs[dashboardType];
}

// POST endpoint for updating dashboard configuration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const analysisId = resolvedParams.id;
  
  try {
    const body = await request.json();
    const { customization } = body;
    
    // In a real implementation, you would:
    // 1. Validate the customization data
    // 2. Save to user preferences or analysis metadata
    // 3. Return updated config
    
    console.log('Updating dashboard config for analysis:', analysisId);
    console.log('New customization:', customization);
    
    return NextResponse.json({
      success: true,
      message: 'Dashboard configuration updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating dashboard config:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update dashboard configuration'
    }, { status: 500 });
  }
}