"use client";

import React, { useState } from 'react';
import { ReportingHub } from '@/components/reports/ReportingHub';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  FileSpreadsheet, 
  File, 
  Calendar, 
  Download, 
  Mail,
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function ReportsDemo() {
  const [selectedAnalysis, setSelectedAnalysis] = useState("analysis_123");
  
  const mockAnalyses = [
    {
      id: "analysis_123",
      url: "https://example.com",
      score: 85,
      date: "2024-01-15",
      status: "completed"
    },
    {
      id: "analysis_124", 
      url: "https://example.com/about",
      score: 78,
      date: "2024-01-14",
      status: "completed"
    },
    {
      id: "analysis_125",
      url: "https://example.com/products",
      score: 92,
      date: "2024-01-13", 
      status: "completed"
    }
  ];

  const features = [
    {
      title: "Professional PDF Reports",
      description: "Generate branded PDF reports with executive summaries, detailed findings, and recommendations",
      icon: FileText,
      color: "bg-blue-50 text-blue-600"
    },
    {
      title: "Excel Data Exports", 
      description: "Export analysis data to Excel with multiple worksheets, charts, and pivot tables",
      icon: FileSpreadsheet,
      color: "bg-green-50 text-green-600"
    },
    {
      title: "Automated Scheduling",
      description: "Schedule reports to be generated and delivered automatically via email",
      icon: Calendar,
      color: "bg-purple-50 text-purple-600"
    },
    {
      title: "Bulk Export",
      description: "Export multiple analyses at once with progress tracking and email notifications",
      icon: Download,
      color: "bg-orange-50 text-orange-600"
    },
    {
      title: "Custom Templates",
      description: "Create and manage reusable report templates for different use cases",
      icon: File,
      color: "bg-indigo-50 text-indigo-600"
    },
    {
      title: "Email Delivery",
      description: "Send reports directly to stakeholders with custom messages and branding",
      icon: Mail,
      color: "bg-pink-50 text-pink-600"
    }
  ];

  const capabilities = [
    {
      category: "Report Formats",
      items: [
        "Professional PDF reports with branding",
        "Excel spreadsheets with multiple worksheets", 
        "CSV exports for data analysis",
        "JSON exports for API integration"
      ]
    },
    {
      category: "Content Options",
      items: [
        "Executive summary and key metrics",
        "Detailed score breakdowns by category",
        "Issue analysis with priority levels", 
        "Actionable recommendations",
        "Historical trends and comparisons",
        "Performance metrics and Core Web Vitals"
      ]
    },
    {
      category: "Customization",
      items: [
        "Custom branding and logos",
        "White-label options for agencies",
        "Selectable report sections",
        "Date range filtering",
        "Custom titles and descriptions"
      ]
    },
    {
      category: "Automation",
      items: [
        "Scheduled report generation",
        "Email delivery automation",
        "Bulk export processing",
        "Progress tracking and notifications"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Comprehensive Reporting System
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Professional PDF generation, Excel exports, customizable templates, automated scheduling, 
            and bulk export capabilities for comprehensive SEO analysis reporting.
          </p>
          <div className="flex items-center justify-center space-x-2">
            <Badge variant="secondary" className="bg-green-50 text-green-700">
              <CheckCircle className="w-3 h-3 mr-1" />
              Production Ready
            </Badge>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              <Clock className="w-3 h-3 mr-1" />
              Real-time Processing
            </Badge>
            <Badge variant="secondary" className="bg-purple-50 text-purple-700">
              <Users className="w-3 h-3 mr-1" />
              Multi-user Support
            </Badge>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-3`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Analysis Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Select Analysis for Demo
            </CardTitle>
            <p className="text-muted-foreground">
              Choose an analysis to demonstrate the reporting capabilities
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedAnalysis === analysis.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedAnalysis(analysis.id)}
                >
                  <div className="space-y-2">
                    <div className="font-medium truncate">{analysis.url}</div>
                    <div className="flex items-center justify-between">
                      <Badge variant={analysis.score >= 80 ? "default" : "secondary"}>
                        Score: {analysis.score}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{analysis.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Reporting Hub */}
        <Card>
          <CardContent className="p-6">
            <ReportingHub 
              analysisId={selectedAnalysis}
              projectId="demo_project_123"
              userId="demo_user_123"
              onReportGenerated={(url) => {
                console.log('Report generated:', url);
              }}
            />
          </CardContent>
        </Card>

        {/* Capabilities Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {capabilities.map((capability, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{capability.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {capability.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Technical Implementation Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Technical Implementation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Backend Services</h4>
                <ul className="space-y-2 text-sm">
                  <li>• ReportGenerationService - PDF, Excel, CSV, JSON generation</li>
                  <li>• ReportTemplateService - Template management and customization</li>
                  <li>• ScheduledReportService - Automated report scheduling</li>
                  <li>• BulkExportService - Large dataset handling with progress tracking</li>
                  <li>• EmailService - Report delivery with professional templates</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Key Features</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Server-side PDF generation with charts and images</li>
                  <li>• Multi-worksheet Excel exports with formulas</li>
                  <li>• Real-time progress tracking for bulk operations</li>
                  <li>• Email templates with custom branding</li>
                  <li>• Secure file downloads with expiration</li>
                </ul>
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="font-semibold mb-3">Performance Characteristics</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">&lt;5s</div>
                  <div className="text-sm text-green-700">PDF Generation</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">500+</div>
                  <div className="text-sm text-blue-700">Records per Export</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">&lt;10MB</div>
                  <div className="text-sm text-purple-700">File Size Limit</div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-amber-800">Production Considerations</h5>
                  <p className="text-sm text-amber-700 mt-1">
                    This demo uses mock data. In production, ensure proper authentication, 
                    rate limiting, and file cleanup policies are implemented. Email configuration 
                    requires valid SMTP settings.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 