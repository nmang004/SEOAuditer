"use client";

import React, { useState } from 'react';
import { m } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  BarChart3,
  Search,
  Download,
  Settings,
  Brain,
  TrendingUp,
  Users,
  Globe,
  Zap,
  Filter,
  Activity,
  Calendar,
  Star,
  ArrowLeft
} from 'lucide-react';
import { AdvancedAnalyticsHub } from '@/components/analytics/advanced-analytics-hub';
import { AdvancedSearchFilters } from '@/components/analytics/advanced-search-filters';
import { AdvancedExportSystem } from '@/components/analytics/advanced-export-system';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import Link from 'next/link';

export default function AdvancedAnalyticsPage() {
  const [searchFilters, setSearchFilters] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (filters: any[], query: string) => {
    setSearchFilters(filters);
    setSearchQuery(query);
    console.log('Advanced search:', { filters, query });
  };

  const handleSaveSearch = (name: string, filters: any[]) => {
    console.log('Save search:', { name, filters });
  };

  return (
    <m.div
      variants={staggerContainer()}
      initial="hidden"
      animate="visible"
      className="container mx-auto px-6 py-8 space-y-8"
    >
      {/* Header */}
      <m.div variants={fadeInUp} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Advanced Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive SEO analysis, competitive intelligence, and data insights
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1">
            <Activity className="h-3 w-3" />
            Real-time Data
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Brain className="h-3 w-3" />
            AI-Powered Insights
          </Badge>
        </div>
      </m.div>

      {/* Quick Stats Overview */}
      <m.div variants={fadeInUp}>
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Total Projects</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">12</div>
                <div className="text-xs text-blue-600">+2 this month</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Analyses Run</span>
                </div>
                <div className="text-2xl font-bold text-green-900">156</div>
                <div className="text-xs text-green-600">23 this week</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Avg Score</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">82</div>
                <div className="text-xs text-purple-600">+7% improvement</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">Active Users</span>
                </div>
                <div className="text-2xl font-bold text-orange-900">8</div>
                <div className="text-xs text-orange-600">Monitoring</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Issues Resolved</span>
                </div>
                <div className="text-2xl font-bold text-yellow-900">34</div>
                <div className="text-xs text-yellow-600">This month</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </m.div>

      {/* Main Analytics Tabs */}
      <m.div variants={fadeInUp}>
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics Hub
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-2">
              <Search className="h-4 w-4" />
              Advanced Search
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2">
              <Download className="h-4 w-4" />
              Export & Reports
            </TabsTrigger>
          </TabsList>

          {/* Analytics Hub Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <AdvancedAnalyticsHub
              timeRange="30d"
              autoRefresh={true}
              showComparison={true}
            />
          </TabsContent>

          {/* Advanced Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <div className="space-y-6">
              {/* Search Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Advanced Search & Discovery</h2>
                  <p className="text-gray-600">
                    Powerful filtering and search capabilities across all your SEO data
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Save View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Star className="h-4 w-4 mr-2" />
                    Bookmark
                  </Button>
                </div>
              </div>

              {/* Advanced Search Component */}
              <AdvancedSearchFilters
                onSearch={handleSearch}
                onSaveSearch={handleSaveSearch}
                showSuggestions={true}
              />

              {/* Search Results Preview */}
              {(searchFilters.length > 0 || searchQuery) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Search Results
                      <Badge variant="secondary">
                        {Math.floor(Math.random() * 50) + 10} results
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div
                          key={index}
                          className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">
                                Sample Search Result #{index + 1}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Matching your search criteria with relevance score
                              </p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {['project', 'analysis', 'issue', 'insight'][index % 4]}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {new Date().toLocaleDateString()}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {Math.floor(Math.random() * 30) + 70}%
                              </div>
                              <div className="text-xs text-gray-500">Relevance</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Export & Reports Tab */}
          <TabsContent value="export" className="space-y-6">
            <AdvancedExportSystem />
          </TabsContent>
        </Tabs>
      </m.div>

      {/* Action Items and Insights */}
      <m.div variants={fadeInUp}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Action Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Action Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  title: 'Export Monthly Report',
                  description: 'Generate executive summary for stakeholders',
                  action: 'Generate',
                  priority: 'high'
                },
                {
                  title: 'Review Critical Issues',
                  description: '3 critical issues need immediate attention',
                  action: 'Review',
                  priority: 'high'
                },
                {
                  title: 'Update Competitor Analysis',
                  description: 'Refresh competitive benchmarking data',
                  action: 'Update',
                  priority: 'medium'
                },
                {
                  title: 'Schedule Performance Review',
                  description: 'Set up automated weekly reports',
                  action: 'Schedule',
                  priority: 'low'
                }
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        item.priority === 'high' ? 'destructive' :
                        item.priority === 'medium' ? 'default' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {item.priority}
                    </Badge>
                    <Button size="sm" variant="outline">
                      {item.action}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  action: 'Completed analysis',
                  target: 'Main Website',
                  time: '2 minutes ago',
                  type: 'analysis'
                },
                {
                  action: 'Generated report',
                  target: 'Monthly Performance Summary',
                  time: '15 minutes ago',
                  type: 'export'
                },
                {
                  action: 'Detected new issues',
                  target: 'E-commerce Store',
                  time: '1 hour ago',
                  type: 'issue'
                },
                {
                  action: 'Updated competitor data',
                  target: 'Competitor Analysis',
                  time: '3 hours ago',
                  type: 'update'
                },
                {
                  action: 'Scheduled report',
                  target: 'Weekly Executive Summary',
                  time: '1 day ago',
                  type: 'schedule'
                }
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.action}</span>
                      {' '}
                      <span className="text-gray-600">{activity.target}</span>
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </m.div>
    </m.div>
  );
} 