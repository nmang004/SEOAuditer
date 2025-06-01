"use client";

import React, { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import {
  Download,
  FileText,
  File,
  FileSpreadsheet,
  FileImage,
  Calendar,
  Clock,
  Settings,
  Mail,
  Palette,
  Layout,
  BarChart3,
  Filter,
  Share,
  Copy,
  Check,
  AlertCircle,
  Star,
  History,
  Plus,
  Edit,
  Trash,
  Send,
  Eye,
  Play,
  Pause,
  RefreshCw,
  X
} from 'lucide-react';

interface ReportConfig {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  template: string;
  sections: string[];
  includeTrends: boolean;
  includeCharts: boolean;
  includeImages: boolean;
  branding?: {
    logo?: string;
    primaryColor?: string;
    companyName?: string;
    whiteLabelMode?: boolean;
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
  customization?: {
    title?: string;
    subtitle?: string;
    description?: string;
    footer?: string;
  };
  delivery?: {
    email?: boolean;
    recipients?: string[];
    subject?: string;
    message?: string;
  };
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  format: string;
  isDefault: boolean;
  lastUsed?: Date;
  usageCount: number;
}

interface ScheduledReport {
  id: string;
  name: string;
  template: string;
  recipients: string[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  nextExecution: Date;
  isActive: boolean;
  lastStatus?: 'success' | 'failed';
}

interface ExportJob {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  format: string;
  createdAt: Date;
  downloadUrl?: string;
  error?: string;
}

interface ReportingHubProps {
  analysisId?: string;
  projectId: string;
  userId: string;
  onReportGenerated?: (reportUrl: string) => void;
}

const availableSections = [
  { id: 'overview', label: 'Executive Overview', description: 'High-level summary and key metrics' },
  { id: 'scores', label: 'Score Breakdown', description: 'Detailed score analysis by category' },
  { id: 'issues', label: 'Issues Analysis', description: 'Identified problems and priority levels' },
  { id: 'recommendations', label: 'Recommendations', description: 'Actionable improvement suggestions' },
  { id: 'technical', label: 'Technical Analysis', description: 'Technical SEO findings and metrics' },
  { id: 'content', label: 'Content Analysis', description: 'Content quality and optimization insights' },
  { id: 'performance', label: 'Performance Metrics', description: 'Page speed and Core Web Vitals' },
  { id: 'trends', label: 'Historical Trends', description: 'Performance trends over time' }
];

export function ReportingHub({ analysisId, projectId, userId, onReportGenerated }: ReportingHubProps) {
  const [activeTab, setActiveTab] = useState('generate');
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    format: 'pdf',
    template: 'executive',
    sections: ['overview', 'scores', 'issues', 'recommendations'],
    includeTrends: true,
    includeCharts: true,
    includeImages: false
  });

  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [bulkExportAnalyses, setBulkExportAnalyses] = useState<string[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isBulkExportDialogOpen, setIsBulkExportDialogOpen] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
    loadScheduledReports();
    loadExportHistory();
  }, [userId, projectId]);

  const loadTemplates = async () => {
    try {
      const response = await fetch(`/api/reports/templates?userId=${userId}&includeDefault=true`);
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadScheduledReports = async () => {
    try {
      const response = await fetch(`/api/reports/scheduled?userId=${userId}&projectId=${projectId}`);
      const data = await response.json();
      if (data.success) {
        setScheduledReports(data.data);
      }
    } catch (error) {
      console.error('Failed to load scheduled reports:', error);
    }
  };

  const loadExportHistory = async () => {
    // Load recent export jobs
    try {
      // This would be implemented to fetch recent export history
      setExportJobs([]);
    } catch (error) {
      console.error('Failed to load export history:', error);
    }
  };

  const handleGenerateReport = async () => {
    if (!analysisId) {
      toast({
        title: "Error",
        description: "No analysis selected for report generation",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          analysisId,
          projectId,
          userId,
          config: reportConfig
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Report Generated",
          description: "Your report has been generated successfully",
        });

        if (onReportGenerated) {
          onReportGenerated(data.data.downloadUrl);
        }

        // Add to export history
        setExportJobs(prev => [{
          id: data.data.reportId,
          name: `${reportConfig.format.toUpperCase()} Report`,
          status: 'completed',
          progress: 100,
          format: reportConfig.format,
          createdAt: new Date(),
          downloadUrl: data.data.downloadUrl
        }, ...prev]);

      } else {
        throw new Error(data.error || 'Report generation failed');
      }

    } catch (error) {
      console.error('Report generation failed:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate report",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBulkExport = async (format: 'excel' | 'csv' | 'json', options: any) => {
    try {
      const response = await fetch('/api/reports/bulk-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          projectId,
          analysisIds: bulkExportAnalyses,
          format,
          options,
          delivery: reportConfig.delivery
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Bulk Export Started",
          description: `Export job started for ${bulkExportAnalyses.length} analyses`,
        });

        setIsBulkExportDialogOpen(false);
        
        // Add to export jobs for tracking
        setExportJobs(prev => [{
          id: data.data.jobId,
          name: `Bulk Export (${format.toUpperCase()})`,
          status: 'processing',
          progress: 0,
          format,
          createdAt: new Date()
        }, ...prev]);

      } else {
        throw new Error(data.error || 'Bulk export failed');
      }

    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to start bulk export",
        variant: "destructive"
      });
    }
  };

  const formatOptions = [
    { value: 'pdf', label: 'PDF Report', icon: FileText, description: 'Professional formatted report' },
    { value: 'excel', label: 'Excel Spreadsheet', icon: FileSpreadsheet, description: 'Data analysis and charts' },
    { value: 'csv', label: 'CSV Data', icon: File, description: 'Raw data export' },
    { value: 'json', label: 'JSON Data', icon: File, description: 'API-friendly format' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Reporting Hub</h2>
          <p className="text-muted-foreground">Generate comprehensive SEO reports and manage exports</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating || !analysisId}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Export</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Format Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Report Format
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {formatOptions.map((format) => (
                      <div
                        key={format.value}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          reportConfig.format === format.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setReportConfig(prev => ({ ...prev, format: format.value as any }))}
                      >
                        <div className="flex items-center space-x-3">
                          <format.icon className="w-6 h-6 text-blue-600" />
                          <div>
                            <h3 className="font-medium">{format.label}</h3>
                            <p className="text-sm text-muted-foreground">{format.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Section Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="w-5 h-5" />
                    Report Sections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {availableSections.map((section) => (
                      <div key={section.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={section.id}
                          checked={reportConfig.sections.includes(section.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setReportConfig(prev => ({
                                ...prev,
                                sections: [...prev.sections, section.id]
                              }));
                            } else {
                              setReportConfig(prev => ({
                                ...prev,
                                sections: prev.sections.filter(s => s !== section.id)
                              }));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <Label htmlFor={section.id} className="text-sm font-medium">
                            {section.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">{section.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Report Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Include Charts</Label>
                      <p className="text-sm text-muted-foreground">Add visual charts and graphs</p>
                    </div>
                    <Switch
                      checked={reportConfig.includeCharts}
                      onCheckedChange={(checked) => 
                        setReportConfig(prev => ({ ...prev, includeCharts: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Include Trends</Label>
                      <p className="text-sm text-muted-foreground">Add historical trend data</p>
                    </div>
                    <Switch
                      checked={reportConfig.includeTrends}
                      onCheckedChange={(checked) => 
                        setReportConfig(prev => ({ ...prev, includeTrends: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Include Images</Label>
                      <p className="text-sm text-muted-foreground">Add screenshots and images</p>
                    </div>
                    <Switch
                      checked={reportConfig.includeImages}
                      onCheckedChange={(checked) => 
                        setReportConfig(prev => ({ ...prev, includeImages: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview & Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Report Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm">
                    <strong>Format:</strong> {reportConfig.format.toUpperCase()}
                  </div>
                  <div className="text-sm">
                    <strong>Sections:</strong> {reportConfig.sections.length}
                  </div>
                  <div className="text-sm">
                    <strong>Charts:</strong> {reportConfig.includeCharts ? 'Yes' : 'No'}
                  </div>
                  <div className="text-sm">
                    <strong>Trends:</strong> {reportConfig.includeTrends ? 'Yes' : 'No'}
                  </div>
                  
                  <div className="pt-4">
                    <Button
                      onClick={handleGenerateReport}
                      disabled={isGenerating || !analysisId}
                      className="w-full"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Generate Report
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Send via Email</Label>
                    <Switch
                      checked={reportConfig.delivery?.email || false}
                      onCheckedChange={(checked) => 
                        setReportConfig(prev => ({ 
                          ...prev, 
                          delivery: { ...prev.delivery, email: checked }
                        }))
                      }
                    />
                  </div>
                  
                  {reportConfig.delivery?.email && (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="recipients">Recipients</Label>
                        <Input
                          id="recipients"
                          placeholder="email@example.com"
                          value={reportConfig.delivery?.recipients?.join(', ') || ''}
                          onChange={(e) => 
                            setReportConfig(prev => ({
                              ...prev,
                              delivery: {
                                ...prev.delivery,
                                recipients: e.target.value.split(',').map(email => email.trim())
                              }
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          placeholder="SEO Analysis Report"
                          value={reportConfig.delivery?.subject || ''}
                          onChange={(e) => 
                            setReportConfig(prev => ({
                              ...prev,
                              delivery: {
                                ...prev.delivery,
                                subject: e.target.value
                              }
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Report Templates</h3>
              <p className="text-muted-foreground">Create and manage reusable report templates</p>
            </div>
            <Button onClick={() => setIsTemplateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <strong>Format:</strong> {template.format.toUpperCase()}
                  </div>
                  <div className="text-sm">
                    <strong>Sections:</strong> {template.sections.length}
                  </div>
                  <div className="text-sm">
                    <strong>Used:</strong> {template.usageCount} times
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReportConfig(prev => ({
                          ...prev,
                          template: template.id,
                          sections: template.sections,
                          format: template.format as any
                        }));
                        setActiveTab('generate');
                      }}
                    >
                      Use Template
                    </Button>
                    {!template.isDefault && (
                      <Button size="sm" variant="ghost">
                        <Edit className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Scheduled Reports</h3>
              <p className="text-muted-foreground">Automate report generation and delivery</p>
            </div>
            <Button onClick={() => setIsScheduleDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Report
            </Button>
          </div>

          <div className="space-y-4">
            {scheduledReports.map((schedule) => (
              <Card key={schedule.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="space-y-1">
                    <h4 className="font-medium">{schedule.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {schedule.frequency} • Next: {schedule.nextExecution.toLocaleDateString()}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge variant={schedule.isActive ? "default" : "secondary"}>
                        {schedule.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {schedule.lastStatus && (
                        <Badge variant={schedule.lastStatus === 'success' ? "default" : "destructive"}>
                          {schedule.lastStatus}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Play className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Trash className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Bulk Export</h3>
              <p className="text-muted-foreground">Export multiple analyses at once</p>
            </div>
            <Button 
              onClick={() => setIsBulkExportDialogOpen(true)}
              disabled={bulkExportAnalyses.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Start Bulk Export
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Selected Analyses</CardTitle>
              <p className="text-sm text-muted-foreground">
                {bulkExportAnalyses.length} analyses selected for export
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Analysis Selection</Label>
                <p className="text-sm text-muted-foreground">
                  Select analyses from your project dashboard to enable bulk export
                </p>
                <div className="text-sm font-medium">
                  Maximum: 500 analyses per export
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Export History</h3>
              <p className="text-muted-foreground">Recent report generations and downloads</p>
            </div>
            <Button variant="outline" onClick={loadExportHistory}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="space-y-4">
            {exportJobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="space-y-1">
                    <h4 className="font-medium">{job.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {job.format.toUpperCase()} • {job.createdAt.toLocaleDateString()}
                    </p>
                    <Badge variant={
                      job.status === 'completed' ? 'default' :
                      job.status === 'failed' ? 'destructive' :
                      job.status === 'processing' ? 'secondary' : 'outline'
                    }>
                      {job.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {job.status === 'processing' && (
                      <div className="flex items-center space-x-2">
                        <Progress value={job.progress} className="w-20" />
                        <span className="text-sm">{job.progress}%</span>
                      </div>
                    )}
                    
                    {job.status === 'completed' && job.downloadUrl && (
                      <Button size="sm" asChild>
                        <a href={job.downloadUrl} download>
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </a>
                      </Button>
                    )}
                    
                    {job.status === 'failed' && job.error && (
                      <div className="text-sm text-red-600">{job.error}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 