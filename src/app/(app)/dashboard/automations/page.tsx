'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, CheckCircle, AlertCircle, Play, Pause } from "lucide-react";

export default function AutomationsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automations</h1>
          <p className="text-muted-foreground">
            Automate your SEO monitoring and optimization workflows
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Zap className="mr-2 h-4 w-4" />
            Create Automation
          </Button>
          <Button size="sm">
            <Play className="mr-2 h-4 w-4" />
            Run All
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Automations</p>
              <p className="text-2xl font-bold">12</p>
            </div>
            <Zap className="h-4 w-4 text-yellow-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="text-green-600">3</span> running now
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed Today</p>
              <p className="text-2xl font-bold">24</p>
            </div>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="text-green-600">+6</span> from yesterday
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Time Saved</p>
              <p className="text-2xl font-bold">47h</p>
            </div>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            This month
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Failed Tasks</p>
              <p className="text-2xl font-bold">2</p>
            </div>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Needs attention
          </p>
        </Card>
      </div>

      {/* Active Automations */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Active Automations</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-sm font-medium">Daily Ranking Check</p>
                  <p className="text-xs text-muted-foreground">Runs every day at 6:00 AM</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600">Running</Badge>
                <Button variant="ghost" size="sm">
                  <Pause className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Site Audit</p>
                  <p className="text-xs text-muted-foreground">Weekly comprehensive audit</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Scheduled</Badge>
                <Button variant="ghost" size="sm">
                  <Play className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-sm font-medium">Competitor Monitoring</p>
                  <p className="text-xs text-muted-foreground">Track competitor changes</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-yellow-600">Running</Badge>
                <Button variant="ghost" size="sm">
                  <Pause className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Broken Link Check</p>
                  <p className="text-xs text-muted-foreground">Monitor site health</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-red-600">Failed</Badge>
                <Button variant="ghost" size="sm">
                  <Play className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Site Audit Completed</p>
                <p className="text-xs text-muted-foreground">Found 3 new issues to fix</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Rankings Updated</p>
                <p className="text-xs text-muted-foreground">247 keywords checked</p>
                <p className="text-xs text-muted-foreground">6 hours ago</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Broken Link Check Failed</p>
                <p className="text-xs text-muted-foreground">Connection timeout error</p>
                <p className="text-xs text-muted-foreground">8 hours ago</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Competitor Analysis</p>
                <p className="text-xs text-muted-foreground">2 new opportunities found</p>
                <p className="text-xs text-muted-foreground">12 hours ago</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Coming Soon Card */}
      <Card className="p-8 text-center">
        <div className="mx-auto max-w-md">
          <Zap className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Advanced Automation Engine Coming Soon</h3>
          <p className="text-muted-foreground mb-6">
            Create custom workflows, set up intelligent alerts, and automate complex SEO tasks with our powerful automation platform.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <Badge variant="outline">Custom Workflows</Badge>
            <Badge variant="outline">Smart Alerts</Badge>
            <Badge variant="outline">API Integrations</Badge>
            <Badge variant="outline">Scheduled Reports</Badge>
          </div>
          <Button variant="outline">
            Get Notified When Ready
          </Button>
        </div>
      </Card>
    </div>
  );
}