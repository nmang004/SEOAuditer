'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown, Target, BarChart3 } from "lucide-react";

export default function KeywordsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Keywords</h1>
          <p className="text-muted-foreground">
            Track and optimize your keyword rankings and performance
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Search className="mr-2 h-4 w-4" />
            Add Keywords
          </Button>
          <Button size="sm">
            <Target className="mr-2 h-4 w-4" />
            Track Rankings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Keywords</p>
              <p className="text-2xl font-bold">247</p>
            </div>
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="text-green-600">+12</span> from last month
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Top 10 Rankings</p>
              <p className="text-2xl font-bold">34</p>
            </div>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="text-green-600">+8</span> from last week
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Position</p>
              <p className="text-2xl font-bold">15.2</p>
            </div>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="text-green-600">-2.3</span> improved
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Click-Through Rate</p>
              <p className="text-2xl font-bold">3.4%</p>
            </div>
            <Target className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="text-green-600">+0.7%</span> from last month
          </p>
        </Card>
      </div>

      {/* Coming Soon Card */}
      <Card className="p-8 text-center">
        <div className="mx-auto max-w-md">
          <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Keyword Tracking Coming Soon</h3>
          <p className="text-muted-foreground mb-6">
            Advanced keyword tracking, ranking monitoring, and SERP analysis features are currently in development.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <Badge variant="outline">Rank Tracking</Badge>
            <Badge variant="outline">SERP Features</Badge>
            <Badge variant="outline">Keyword Research</Badge>
            <Badge variant="outline">Competition Analysis</Badge>
          </div>
          <Button variant="outline">
            Get Notified When Ready
          </Button>
        </div>
      </Card>
    </div>
  );
}