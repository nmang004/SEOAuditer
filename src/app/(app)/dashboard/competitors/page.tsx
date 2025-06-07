'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, TrendingDown, Eye, Plus, ExternalLink } from "lucide-react";

export default function CompetitorsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Competitors</h1>
          <p className="text-muted-foreground">
            Analyze competitor performance and identify opportunities
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Competitor
          </Button>
          <Button size="sm">
            <Eye className="mr-2 h-4 w-4" />
            Competitive Analysis
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tracked Competitors</p>
              <p className="text-2xl font-bold">8</p>
            </div>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="text-green-600">+2</span> added this month
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Competitive Gap</p>
              <p className="text-2xl font-bold">12.4%</p>
            </div>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Behind top competitor
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Shared Keywords</p>
              <p className="text-2xl font-bold">247</p>
            </div>
            <Eye className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Overlap opportunities
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Visibility Score</p>
              <p className="text-2xl font-bold">67.8%</p>
            </div>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="text-green-600">+3.2%</span> vs competitors
          </p>
        </Card>
      </div>

      {/* Competitor Comparison */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Competitors</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">AC</span>
                </div>
                <div>
                  <p className="text-sm font-medium">ahrefs.com</p>
                  <p className="text-xs text-muted-foreground">SEO Tools</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="text-red-600">Leader</Badge>
                <p className="text-xs text-muted-foreground mt-1">Score: 92.4</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-green-600">SM</span>
                </div>
                <div>
                  <p className="text-sm font-medium">semrush.com</p>
                  <p className="text-xs text-muted-foreground">SEO Platform</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="text-orange-600">Strong</Badge>
                <p className="text-xs text-muted-foreground mt-1">Score: 89.1</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-purple-600">MZ</span>
                </div>
                <div>
                  <p className="text-sm font-medium">moz.com</p>
                  <p className="text-xs text-muted-foreground">SEO Software</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="text-blue-600">Moderate</Badge>
                <p className="text-xs text-muted-foreground mt-1">Score: 78.6</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Competitive Opportunities</h3>
          <div className="space-y-4">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Content Gaps</p>
                <Badge variant="outline">High</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                47 keywords where competitors rank but you don't
              </p>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Technical Advantages</p>
                <Badge variant="outline">Medium</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Better Core Web Vitals than 6 out of 8 competitors
              </p>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Backlink Opportunities</p>
                <Badge variant="outline">High</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                234 potential link prospects from competitor analysis
              </p>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">SERP Features</p>
                <Badge variant="outline">Low</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Missing featured snippets in 12 target keywords
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Coming Soon Card */}
      <Card className="p-8 text-center">
        <div className="mx-auto max-w-md">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Advanced Competitor Analysis Coming Soon</h3>
          <p className="text-muted-foreground mb-6">
            Deep competitive intelligence including content gap analysis, backlink comparison, SERP overlap, and market share tracking.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <Badge variant="outline">Content Gaps</Badge>
            <Badge variant="outline">Backlink Analysis</Badge>
            <Badge variant="outline">SERP Overlap</Badge>
            <Badge variant="outline">Market Share</Badge>
          </div>
          <Button variant="outline">
            Get Notified When Ready
          </Button>
        </div>
      </Card>
    </div>
  );
}