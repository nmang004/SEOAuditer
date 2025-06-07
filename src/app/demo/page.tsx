'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, BarChart3, Search, Users, Zap, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Interactive Demo
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Experience Rival Outranker in Action
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore our powerful SEO analysis platform with interactive demos and sample data
          </p>
        </div>

        {/* Demo Categories */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
          {/* Dashboard Demo */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <h3 className="text-xl font-semibold">Dashboard Overview</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              See how our comprehensive dashboard provides real-time insights into your SEO performance with interactive charts and metrics.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Real-time analytics</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Performance trends</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Issue tracking</span>
              </div>
            </div>
            <Link href="/dashboard">
              <Button className="w-full">
                <PlayCircle className="mr-2 h-4 w-4" />
                Try Dashboard Demo
              </Button>
            </Link>
          </Card>

          {/* Analysis Demo */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <Search className="h-8 w-8 text-green-600" />
              <h3 className="text-xl font-semibold">Site Analysis</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Experience our comprehensive SEO audit tool that analyzes technical issues, content quality, and optimization opportunities.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Technical SEO audit</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Content analysis</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Performance insights</span>
              </div>
            </div>
            <Link href="/analysis">
              <Button className="w-full">
                <PlayCircle className="mr-2 h-4 w-4" />
                Try Analysis Demo
              </Button>
            </Link>
          </Card>

          {/* Interactive Features */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="h-8 w-8 text-yellow-600" />
              <h3 className="text-xl font-semibold">Interactive Features</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Test our advanced features including keyword tracking, competitor analysis, and automation workflows.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Keyword tracking</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Competitor monitoring</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Automated workflows</span>
              </div>
            </div>
            <Link href="/interactive-demo">
              <Button className="w-full">
                <PlayCircle className="mr-2 h-4 w-4" />
                Try Interactive Demo
              </Button>
            </Link>
          </Card>
        </div>

        {/* Sample Data Showcase */}
        <Card className="p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">Sample Data Showcase</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              All demos use realistic sample data to show you exactly how Rival Outranker works with real websites
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Real Metrics</h3>
              <p className="text-sm text-muted-foreground">
                Based on actual website performance data and industry benchmarks
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Industry Examples</h3>
              <p className="text-sm text-muted-foreground">
                Sample data from various industries to demonstrate versatility
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Live Features</h3>
              <p className="text-sm text-muted-foreground">
                Fully functional interface with interactive elements and workflows
              </p>
            </div>
          </div>
        </Card>

        {/* CTA Section */}
        <Card className="p-8 text-center bg-gradient-to-r from-primary/10 to-primary/5">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Sign up for a free account to start analyzing your website with Rival Outranker's powerful SEO tools
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Pricing
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}