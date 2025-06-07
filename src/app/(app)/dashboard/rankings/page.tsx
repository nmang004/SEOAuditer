'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, BarChart3, Target, Trophy } from "lucide-react";

export default function RankingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rankings</h1>
          <p className="text-muted-foreground">
            Monitor your search engine rankings and track progress over time
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Target className="mr-2 h-4 w-4" />
            Track New Keywords
          </Button>
          <Button size="sm">
            <BarChart3 className="mr-2 h-4 w-4" />
            Ranking Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Position</p>
              <p className="text-2xl font-bold">12.4</p>
            </div>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="text-green-600">-1.8</span> improved this week
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Top 3 Rankings</p>
              <p className="text-2xl font-bold">18</p>
            </div>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="text-green-600">+5</span> new top 3
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Top 10 Rankings</p>
              <p className="text-2xl font-bold">67</p>
            </div>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="text-green-600">+12</span> from last month
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Visibility Score</p>
              <p className="text-2xl font-bold">78.4%</p>
            </div>
            <Target className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="text-green-600">+4.2%</span> improved
          </p>
        </Card>
      </div>

      {/* Ranking Changes */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Ranking Changes</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">SEO best practices</p>
                  <p className="text-xs text-muted-foreground">Position 15 → 8</p>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600">+7</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">website optimization</p>
                  <p className="text-xs text-muted-foreground">Position 23 → 12</p>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600">+11</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium">content marketing</p>
                  <p className="text-xs text-muted-foreground">Position 6 → 9</p>
                </div>
              </div>
              <Badge variant="outline" className="text-red-600">-3</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">technical SEO</p>
                  <p className="text-xs text-muted-foreground">Position 18 → 11</p>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600">+7</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Position Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Position 1-3</span>
              </div>
              <span className="text-sm font-medium">18 keywords</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Position 4-10</span>
              </div>
              <span className="text-sm font-medium">49 keywords</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">Position 11-20</span>
              </div>
              <span className="text-sm font-medium">73 keywords</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm">Position 21-50</span>
              </div>
              <span className="text-sm font-medium">89 keywords</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">Position 50+</span>
              </div>
              <span className="text-sm font-medium">18 keywords</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Coming Soon Card */}
      <Card className="p-8 text-center">
        <div className="mx-auto max-w-md">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Advanced Ranking Tracking Coming Soon</h3>
          <p className="text-muted-foreground mb-6">
            Comprehensive ranking monitoring with historical data, SERP features tracking, local rankings, and competitor comparison.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <Badge variant="outline">Historical Tracking</Badge>
            <Badge variant="outline">SERP Features</Badge>
            <Badge variant="outline">Local Rankings</Badge>
            <Badge variant="outline">Competitor Tracking</Badge>
          </div>
          <Button variant="outline">
            Get Notified When Ready
          </Button>
        </div>
      </Card>
    </div>
  );
}