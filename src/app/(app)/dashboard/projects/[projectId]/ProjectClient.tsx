"use client";

import { useState } from "react";
import { m } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

// Mock data - replace with actual data fetching
const mockProject = {
  id: "1",
  name: "Example Website",
  url: "https://example.com",
  lastScanDate: "2024-03-20T10:00:00Z",
  currentScore: 85,
  issueCount: 12,
  metrics: {
    performance: 92,
    accessibility: 88,
    bestPractices: 95,
    seo: 85,
  },
  recentIssues: [
    {
      id: "1",
      type: "critical",
      title: "Missing Meta Description",
      description: "The page is missing a meta description tag.",
      recommendation: "Add a unique meta description between 120-155 characters.",
    },
    {
      id: "2",
      type: "warning",
      title: "Slow Loading Images",
      description: "Some images are not optimized for web.",
      recommendation: "Compress and resize images to improve loading speed.",
    },
  ],
};

export function ProjectClient({ params }: { params: { projectId: string } }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="container mx-auto py-8 px-4 md:px-8 max-w-7xl">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-2">{mockProject.name}</h1>
            <p className="text-muted-foreground">{mockProject.url}</p>
          </div>
          <div className="flex gap-2">
            <Button>Run New Analysis</Button>
            <Link href={`/analysis/trends/${params.projectId}`} passHref legacyBehavior>
              <Button variant="outline" asChild>
                <a>View Trend Analysis</a>
              </Button>
            </Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 mt-2">
                <h3 className="text-sm font-medium mb-2">Overall Score</h3>
                <div className="text-3xl font-bold mb-2">{mockProject.currentScore}</div>
                <Progress value={mockProject.currentScore} className="h-2" />
              </Card>
              <Card className="p-6 mt-2">
                <h3 className="text-sm font-medium mb-2">Performance</h3>
                <div className="text-3xl font-bold mb-2">{mockProject.metrics.performance}</div>
                <Progress value={mockProject.metrics.performance} className="h-2" />
              </Card>
              <Card className="p-6 mt-2">
                <h3 className="text-sm font-medium mb-2">Accessibility</h3>
                <div className="text-3xl font-bold mb-2">{mockProject.metrics.accessibility}</div>
                <Progress value={mockProject.metrics.accessibility} className="h-2" />
              </Card>
              <Card className="p-6 mt-2">
                <h3 className="text-sm font-medium mb-2">Best Practices</h3>
                <div className="text-3xl font-bold mb-2">{mockProject.metrics.bestPractices}</div>
                <Progress value={mockProject.metrics.bestPractices} className="h-2" />
              </Card>
            </div>

            <Card className="p-6 mt-2">
              <h2 className="text-xl font-bold mb-4">Recent Issues</h2>
              <div className="space-y-4">
                {mockProject.recentIssues.map((issue) => (
                  <div key={issue.id} className="border-b pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{issue.title}</h3>
                      <Badge variant={issue.type === "critical" ? "destructive" : "warning"}>
                        {issue.type}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-2">{issue.description}</p>
                    <p className="text-sm">
                      <span className="font-medium">Recommendation:</span> {issue.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="issues" className="space-y-6">
            <Card className="p-6 mt-2">
              <h2 className="text-xl font-bold mb-4">All Issues</h2>
              {/* Add issues list component here */}
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="p-6 mt-2">
              <h2 className="text-xl font-bold mb-4">Analysis History</h2>
              {/* Add history timeline component here */}
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6 mt-2">
              <h2 className="text-xl font-bold mb-4">Project Settings</h2>
              {/* Add settings form component here */}
            </Card>
          </TabsContent>
        </Tabs>
      </m.div>
    </div>
  );
} 