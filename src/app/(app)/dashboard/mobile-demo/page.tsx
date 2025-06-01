'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Smartphone, 
  Wifi, 
  Battery,
  Bell,
  Share,
  Heart,
  Star,
  MessageCircle,
  MoreHorizontal,
  ChevronRight,
  TrendingUp,
  Users,
  Globe,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MobileSheet, useMobileSheet } from '@/components/ui/mobile-sheet';
import { MobileTable } from '@/components/ui/mobile-table';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { useMobile, useNetworkStatus } from '@/hooks/use-mobile';
import { useGestures } from '@/hooks/use-gestures';
import { hapticFeedback, shareContent, supportsWebShare } from '@/lib/pwa';
import { cn } from '@/lib/utils';

// Mock data for demonstration
const mockAnalyses = [
  {
    id: 1,
    url: 'example.com',
    score: 85,
    status: 'completed',
    issues: 12,
    date: '2024-01-15',
    type: 'Full Audit',
  },
  {
    id: 2,
    url: 'test-site.com',
    score: 72,
    status: 'completed',
    issues: 18,
    date: '2024-01-14',
    type: 'Quick Scan',
  },
  {
    id: 3,
    url: 'demo-website.org',
    score: 91,
    status: 'in_progress',
    issues: 8,
    date: '2024-01-13',
    type: 'Full Audit',
  },
];

const mockStats = [
  { label: 'Total Analyses', value: '124', change: '+12%', icon: Globe },
  { label: 'Avg Score', value: '82', change: '+5%', icon: TrendingUp },
  { label: 'Active Projects', value: '8', change: '+2', icon: Users },
  { label: 'Issues Found', value: '247', change: '-8%', icon: Eye },
];

export default function MobileDemoPage() {
  const { isMobile, screenSize, orientation } = useMobile();
  const { isOnline } = useNetworkStatus();
  const { openSheet } = useMobileSheet();
  const [refreshCount, setRefreshCount] = useState(0);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [likedItems, setLikedItems] = useState<Set<number>>(new Set());

  // Gesture handling for cards
  const cardGestureRef = useGestures<HTMLDivElement>({
    onSwipeLeft: () => {
      hapticFeedback('light');
      console.log('Swiped left on card');
    },
    onSwipeRight: () => {
      hapticFeedback('light');
      console.log('Swiped right on card');
    },
    onLongPress: () => {
      hapticFeedback('medium');
      console.log('Long pressed card');
    },
    onDoubleTap: () => {
      hapticFeedback('light');
      console.log('Double tapped card');
    },
  });

  const handleRefresh = async () => {
    hapticFeedback('medium');
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshCount(prev => prev + 1);
  };

  const handleShare = async () => {
    if (supportsWebShare()) {
      const shared = await shareContent({
        title: 'Rival Outranker Dashboard',
        text: 'Check out my SEO analysis results!',
        url: window.location.href,
      });
      if (shared) {
        hapticFeedback('light');
      }
    }
  };

  const handleLike = (id: number) => {
    hapticFeedback('light');
    setLikedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openAnalysisDetails = (analysis: any) => {
    openSheet(`analysis-${analysis.id}`, {
      title: `Analysis: ${analysis.url}`,
      height: 'half',
      children: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{analysis.score}</div>
              <div className="text-sm text-muted-foreground">SEO Score</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-warning-600">{analysis.issues}</div>
              <div className="text-sm text-muted-foreground">Issues Found</div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Analysis Details</h4>
            <p className="text-sm text-muted-foreground">
              This {analysis.type.toLowerCase()} was completed on {analysis.date} and found {analysis.issues} issues that need attention.
            </p>
          </div>
          <Button className="w-full">View Full Report</Button>
        </div>
      ),
    });
  };

  const tableColumns = [
    {
      key: 'url',
      header: 'Website',
      priority: 'high' as const,
      render: (item: any) => (
        <div>
          <div className="font-medium">{item.url}</div>
          <div className="text-sm text-muted-foreground">{item.type}</div>
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      priority: 'high' as const,
      render: (item: any) => (
        <Badge variant={item.score >= 80 ? 'default' : item.score >= 60 ? 'secondary' : 'destructive'}>
          {item.score}
        </Badge>
      ),
    },
    {
      key: 'issues',
      header: 'Issues',
      priority: 'medium' as const,
      mobileLabel: 'Issues',
    },
    {
      key: 'date',
      header: 'Date',
      priority: 'low' as const,
      mobileLabel: 'Analyzed',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Status Bar Simulation */}
      {isMobile && (
        <div className="bg-primary text-primary-foreground px-4 py-1 text-xs flex justify-between items-center">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <Wifi className="h-3 w-3" />
            <Battery className="h-3 w-3" />
          </div>
        </div>
      )}

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="safe-all">
          {/* Header */}
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
            <div className="flex items-center justify-between p-4">
              <div>
                <h1 className="text-xl font-bold">Mobile Demo</h1>
                <p className="text-sm text-muted-foreground">
                  Optimized for {screenSize} • {orientation} • {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" onClick={handleShare}>
                  <Share className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="ghost">
                  <Bell className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>

          {/* Tab Navigation */}
          <div className="sticky top-16 z-30 bg-background border-b">
            <div className="flex overflow-x-auto">
              {['overview', 'analyses', 'table'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setSelectedTab(tab);
                    hapticFeedback('light');
                  }}
                  className={cn(
                    'flex-none px-4 py-3 text-sm font-medium capitalize touch-target',
                    selectedTab === tab
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <main className="p-4 space-y-6">
            {selectedTab === 'overview' && (
              <>
                {/* Refresh Counter */}
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Pull to refresh counter</p>
                    <p className="text-2xl font-bold text-primary">{refreshCount}</p>
                  </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {mockStats.map((stat) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="touch-target active:scale-95 transition-transform">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <stat.icon className="h-5 w-5 text-primary" />
                            <span className="text-xs text-success-600">{stat.change}</span>
                          </div>
                          <div className="mt-2">
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <div className="text-xs text-muted-foreground">{stat.label}</div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Gesture Demo Card */}
                <Card ref={cardGestureRef} className="border-dashed border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      Gesture Demo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Try these gestures on this card:
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>• Swipe left/right</li>
                      <li>• Long press</li>
                      <li>• Double tap</li>
                    </ul>
                  </CardContent>
                </Card>
              </>
            )}

            {selectedTab === 'analyses' && (
              <div className="space-y-3">
                {mockAnalyses.map((analysis) => (
                  <Card
                    key={analysis.id}
                    className="active:scale-[0.98] transition-transform cursor-pointer"
                    onClick={() => openAnalysisDetails(analysis)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">{analysis.url}</h3>
                            <Badge 
                              variant={analysis.status === 'completed' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {analysis.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{analysis.type}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLike(analysis.id);
                            }}
                          >
                            <Heart
                              className={cn(
                                'h-4 w-4',
                                likedItems.has(analysis.id) && 'fill-red-500 text-red-500'
                              )}
                            />
                          </Button>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t">
                        <div className="text-center">
                          <div className="text-lg font-bold text-primary">{analysis.score}</div>
                          <div className="text-xs text-muted-foreground">Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-warning-600">{analysis.issues}</div>
                          <div className="text-xs text-muted-foreground">Issues</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{analysis.date.split('-')[2]}</div>
                          <div className="text-xs text-muted-foreground">Day</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {selectedTab === 'table' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Mobile-Optimized Table</h2>
                <MobileTable
                  data={mockAnalyses}
                  columns={tableColumns}
                  onRowClick={(item) => openAnalysisDetails(item)}
                  expandable
                  renderExpanded={(item) => (
                    <div className="p-4 space-y-2">
                      <h4 className="font-medium">Additional Details</h4>
                      <p className="text-sm text-muted-foreground">
                        Analysis ID: {item.id}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Last updated: {item.date}
                      </p>
                    </div>
                  )}
                />
              </div>
            )}

            {/* Feature List */}
            <Card>
              <CardHeader>
                <CardTitle>Mobile Features Implemented</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Pull to Refresh', enabled: isMobile },
                    { name: 'Haptic Feedback', enabled: 'vibrate' in navigator },
                    { name: 'Web Share API', enabled: supportsWebShare() },
                    { name: 'Touch Gestures', enabled: isMobile },
                    { name: 'Mobile Sheets', enabled: true },
                    { name: 'Responsive Tables', enabled: true },
                    { name: 'Safe Area Support', enabled: true },
                    { name: 'Offline Support', enabled: 'serviceWorker' in navigator },
                  ].map((feature) => (
                    <div key={feature.name} className="flex items-center justify-between">
                      <span className="text-sm">{feature.name}</span>
                      <Badge variant={feature.enabled ? 'default' : 'secondary'}>
                        {feature.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </main>

          {/* Bottom Safe Area */}
          <div className="h-safe-bottom" />
        </div>
      </PullToRefresh>
    </div>
  );
} 