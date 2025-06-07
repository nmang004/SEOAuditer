'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, AlertCircle, Clock, Edit3 } from "lucide-react";

export default function ContentPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Analysis</h1>
          <p className="text-muted-foreground">
            Analyze and optimize your content for better SEO performance
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Edit3 className="mr-2 h-4 w-4" />
            Analyze Content
          </Button>
          <Button size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Content Audit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Pages</p>
              <p className="text-2xl font-bold">1,247</p>
            </div>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="text-green-600">+23</span> new pages
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Optimized Content</p>
              <p className="text-2xl font-bold">892</p>
            </div>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            71% of total content
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Content Issues</p>
              <p className="text-2xl font-bold">184</p>
            </div>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="text-red-600">15%</span> need attention
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg. Word Count</p>
              <p className="text-2xl font-bold">1,842</p>
            </div>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="text-green-600">+127</span> words avg
          </p>
        </Card>
      </div>

      {/* Content Categories */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Content Quality Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Excellent</span>
              </div>
              <span className="text-sm font-medium">412 pages</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Good</span>
              </div>
              <span className="text-sm font-medium">480 pages</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">Needs Work</span>
              </div>
              <span className="text-sm font-medium">271 pages</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">Poor</span>
              </div>
              <span className="text-sm font-medium">84 pages</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Content Types</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Blog Posts</span>
              <span className="text-sm font-medium">687 pages</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Product Pages</span>
              <span className="text-sm font-medium">342 pages</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Landing Pages</span>
              <span className="text-sm font-medium">128 pages</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Other</span>
              <span className="text-sm font-medium">90 pages</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Coming Soon Card */}
      <Card className="p-8 text-center">
        <div className="mx-auto max-w-md">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Advanced Content Analysis Coming Soon</h3>
          <p className="text-muted-foreground mb-6">
            Comprehensive content analysis including readability, keyword density, semantic analysis, and content gap identification.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <Badge variant="outline">Readability Analysis</Badge>
            <Badge variant="outline">Keyword Density</Badge>
            <Badge variant="outline">Content Gaps</Badge>
            <Badge variant="outline">Semantic SEO</Badge>
          </div>
          <Button variant="outline">
            Get Notified When Ready
          </Button>
        </div>
      </Card>
    </div>
  );
}