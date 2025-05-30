"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data - replace with actual data fetching
const mockAnalysis = {
  id: "1",
  projectId: "1",
  projectName: "Example Website",
  url: "https://example.com",
  date: "2024-03-20T10:00:00Z",
  scores: {
    overall: 85,
    technical: 90,
    content: 82,
    onpage: 88,
    ux: 85,
  },
  metaTags: {
    title: "Example Website - Home",
    description: "Welcome to our example website. We provide the best services in the industry.",
    keywords: "example, website, services",
    titleLength: 35,
    descriptionLength: 95,
    canonicalUrl: "https://example.com",
    robots: "index, follow",
  },
  issues: [
    {
      id: "1",
      type: "critical",
      category: "technical",
      title: "Missing Meta Description",
      description: "The page is missing a meta description tag.",
      recommendation: "Add a unique meta description between 120-155 characters.",
      affectedElements: ["<head>"],
    },
    {
      id: "2",
      type: "warning",
      category: "content",
      title: "Low Content Length",
      description: "The page content is too short for optimal SEO.",
      recommendation: "Add more relevant content to improve search rankings.",
      affectedElements: ["<main>"],
    },
  ],
  performance: {
    loadTime: 2.5,
    firstContentfulPaint: 1.2,
    timeToInteractive: 3.1,
    speedIndex: 2.8,
  },
};

export function AnalysisClient({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="container mx-auto py-8">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analysis Results</h1>
            <p className="text-muted-foreground">
              {mockAnalysis.projectName} - {new Date(mockAnalysis.date).toLocaleDateString()}
            </p>
          </div>
          <Button>Export Report</Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="p-6">
                <h3 className="text-sm font-medium mb-2">Overall Score</h3>
                <div className="text-3xl font-bold mb-2">{mockAnalysis.scores.overall}</div>
                <Progress value={mockAnalysis.scores.overall} className="h-2" />
              </Card>
              <Card className="p-6">
                <h3 className="text-sm font-medium mb-2">Technical</h3>
                <div className="text-3xl font-bold mb-2">{mockAnalysis.scores.technical}</div>
                <Progress value={mockAnalysis.scores.technical} className="h-2" />
              </Card>
              <Card className="p-6">
                <h3 className="text-sm font-medium mb-2">Content</h3>
                <div className="text-3xl font-bold mb-2">{mockAnalysis.scores.content}</div>
                <Progress value={mockAnalysis.scores.content} className="h-2" />
              </Card>
              <Card className="p-6">
                <h3 className="text-sm font-medium mb-2">On-Page</h3>
                <div className="text-3xl font-bold mb-2">{mockAnalysis.scores.onpage}</div>
                <Progress value={mockAnalysis.scores.onpage} className="h-2" />
              </Card>
              <Card className="p-6">
                <h3 className="text-sm font-medium mb-2">UX</h3>
                <div className="text-3xl font-bold mb-2">{mockAnalysis.scores.ux}</div>
                <Progress value={mockAnalysis.scores.ux} className="h-2" />
              </Card>
            </div>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Meta Tags Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Title</h3>
                  <p className="text-muted-foreground mb-4">{mockAnalysis.metaTags.title}</p>
                  <div className="flex items-center space-x-2">
                    <Badge variant={mockAnalysis.metaTags.titleLength < 30 ? "destructive" : "success"}>
                      {mockAnalysis.metaTags.titleLength} characters
                    </Badge>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-muted-foreground mb-4">{mockAnalysis.metaTags.description}</p>
                  <div className="flex items-center space-x-2">
                    <Badge variant={mockAnalysis.metaTags.descriptionLength < 120 ? "destructive" : "success"}>
                      {mockAnalysis.metaTags.descriptionLength} characters
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Critical Issues</h2>
              <div className="space-y-4">
                {mockAnalysis.issues.map((issue) => (
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

          <TabsContent value="technical">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Technical SEO Analysis</h2>
              {/* Add technical SEO details here */}
            </Card>
          </TabsContent>

          <TabsContent value="content">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Content Analysis</h2>
              {/* Add content analysis details here */}
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Performance Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Load Time</h3>
                  <div className="text-2xl font-bold">{mockAnalysis.performance.loadTime}s</div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">First Contentful Paint</h3>
                  <div className="text-2xl font-bold">{mockAnalysis.performance.firstContentfulPaint}s</div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Time to Interactive</h3>
                  <div className="text-2xl font-bold">{mockAnalysis.performance.timeToInteractive}s</div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Speed Index</h3>
                  <div className="text-2xl font-bold">{mockAnalysis.performance.speedIndex}s</div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </m.div>
    </div>
  );
} 