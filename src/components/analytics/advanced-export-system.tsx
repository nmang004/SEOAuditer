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
  Eye
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';

interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json' | 'png' | 'svg';
  includeCharts: boolean;
  includeDetails: boolean;
  includeRecommendations: boolean;
  dateRange: {
    from: Date;
    to: Date;
  };
  sections: string[];
  template: string;
  branding: {
    includeLogo: boolean;
    companyName: string;
    customColors: boolean;
    primaryColor: string;
  };
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  format: string;
  isDefault: boolean;
  createdAt: Date;
  lastUsed: Date;
}

interface ScheduledReport {
  id: string;
  name: string;
  template: string;
  recipients: string[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  isActive: boolean;
  lastSent: Date;
  nextSend: Date;
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

export function AdvancedExportSystem() {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeCharts: true,
    includeDetails: true,
    includeRecommendations: true,
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date()
    },
    sections: ['overview', 'performance', 'issues', 'recommendations'],
    template: 'standard',
    branding: {
      includeLogo: false,
      companyName: '',
      customColors: false,
      primaryColor: '#3b82f6'
    }
  });

  const [templates, setTemplates] = useState<ReportTemplate[]>([
    {
      id: '1',
      name: 'Executive Summary',
      description: 'High-level overview for executives',
      sections: ['overview', 'key-metrics', 'recommendations'],
      format: 'pdf',
      isDefault: false,
      createdAt: new Date(),
      lastUsed: new Date()
    },
    {
      id: '2',
      name: 'Technical Report',
      description: 'Detailed technical analysis',
      sections: ['overview', 'performance', 'technical-issues', 'detailed-recommendations'],
      format: 'pdf',
      isDefault: true,
      createdAt: new Date(),
      lastUsed: new Date()
    },
    {
      id: '3',
      name: 'Content Analysis',
      description: 'Focus on content optimization',
      sections: ['content-metrics', 'content-issues', 'content-recommendations'],
      format: 'pdf',
      isDefault: false,
      createdAt: new Date(),
      lastUsed: new Date()
    }
  ]);

  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([
    {
      id: '1',
      name: 'Weekly Executive Summary',
      template: 'Executive Summary',
      recipients: ['ceo@company.com', 'cto@company.com'],
      frequency: 'weekly',
      dayOfWeek: 1,
      time: '09:00',
      isActive: true,
      lastSent: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      nextSend: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
    }
  ]);

  const [exportJobs, setExportJobs] = useState<ExportJob[]>([
    {
      id: '1',
      name: 'Monthly Performance Report',
      status: 'completed',
      progress: 100,
      format: 'pdf',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      downloadUrl: '/downloads/monthly-report.pdf'
    },
    {
      id: '2',
      name: 'Technical Analysis Export',
      status: 'processing',
      progress: 65,
      format: 'excel',
      createdAt: new Date(Date.now() - 10 * 60 * 1000)
    }
  ]);

  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const availableSections = [
    { id: 'overview', label: 'Executive Overview', description: 'High-level summary and key metrics' },
    { id: 'performance', label: 'Performance Analysis', description: 'Detailed performance metrics and trends' },
    { id: 'issues', label: 'Issues & Problems', description: 'Current issues and their severity' },
    { id: 'recommendations', label: 'Recommendations', description: 'Actionable recommendations for improvement' },
    { id: 'technical', label: 'Technical Details', description: 'Technical SEO analysis and findings' },
    { id: 'content', label: 'Content Analysis', description: 'Content quality and optimization opportunities' },
    { id: 'competitors', label: 'Competitor Analysis', description: 'Competitive landscape and benchmarking' },
    { id: 'trends', label: 'Historical Trends', description: 'Performance trends over time' }
  ];

  const handleExport = async () => {
    const newJob: ExportJob = {
      id: Date.now().toString(),
      name: `${exportOptions.format.toUpperCase()} Export`,
      status: 'pending',
      progress: 0,
      format: exportOptions.format,
      createdAt: new Date()
    };

    setExportJobs(prev => [newJob, ...prev]);

    // Simulate export process
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setExportJobs(prev => prev.map(job => 
          job.id === newJob.id 
            ? { ...job, status: 'completed', progress: 100, downloadUrl: `/downloads/report.${exportOptions.format}` }
            : job
        ));

        toast({
          title: "Export Complete",
          description: `Your ${exportOptions.format.toUpperCase()} report is ready for download.`,
        });
      } else {
        setExportJobs(prev => prev.map(job => 
          job.id === newJob.id 
            ? { ...job, status: 'processing', progress: Math.round(progress) }
            : job
        ));
      }
    }, 500);
  };

  const handleScheduleReport = (schedule: Partial<ScheduledReport>) => {
    const newSchedule: ScheduledReport = {
      id: Date.now().toString(),
      name: schedule.name || 'New Scheduled Report',
      template: schedule.template || 'standard',
      recipients: schedule.recipients || [],
      frequency: schedule.frequency || 'weekly',
      time: schedule.time || '09:00',
      isActive: true,
      lastSent: new Date(),
      nextSend: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ...schedule
    };

    setScheduledReports(prev => [...prev, newSchedule]);
    setShowScheduleDialog(false);
    
    toast({
      title: "Report Scheduled",
      description: `Your report has been scheduled for ${schedule.frequency} delivery.`,
    });
  };

  const copyShareableLink = () => {
    navigator.clipboard.writeText('https://app.seoanalyzer.com/reports/shared/abc123');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link Copied",
      description: "Shareable report link copied to clipboard.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Export & Reports</h2>
          <p className="text-gray-600">Generate reports, schedule delivery, and export data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyShareableLink}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Share className="h-4 w-4 mr-2" />}
            {copied ? 'Copied!' : 'Share Report'}
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Now
          </Button>
        </div>
      </div>

      <Tabs defaultValue="export" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="export">Quick Export</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="history">Export History</TabsTrigger>
        </TabsList>

        {/* Quick Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Export Configuration */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Export Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Format Selection */}
                  <div>
                    <Label className="text-sm font-medium">Export Format</Label>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      {[
                        { format: 'pdf', icon: FileText, label: 'PDF Report' },
                        { format: 'excel', icon: FileSpreadsheet, label: 'Excel Data' },
                        { format: 'csv', icon: File, label: 'CSV Data' },
                        { format: 'json', icon: File, label: 'JSON Data' },
                        { format: 'png', icon: FileImage, label: 'Chart Image' },
                        { format: 'svg', icon: FileImage, label: 'Vector Image' }
                      ].map(({ format, icon: Icon, label }) => (
                        <Button
                          key={format}
                          variant={exportOptions.format === format ? 'default' : 'outline'}
                          className="h-16 flex-col gap-1"
                          onClick={() => setExportOptions(prev => ({ ...prev, format: format as any }))}
                        >
                          <Icon className="h-6 w-6" />
                          <span className="text-xs">{label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Content Options */}
                  <div>
                    <Label className="text-sm font-medium">Include Content</Label>
                    <div className="space-y-2 mt-2">
                      {[
                        { key: 'includeCharts', label: 'Charts and Visualizations' },
                        { key: 'includeDetails', label: 'Detailed Analysis' },
                        { key: 'includeRecommendations', label: 'Recommendations' }
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={key}
                            checked={exportOptions[key as keyof ExportOptions] as boolean}
                            onCheckedChange={(checked) => 
                              setExportOptions(prev => ({ ...prev, [key]: checked }))
                            }
                          />
                          <Label htmlFor={key} className="text-sm">{label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section Selection */}
                  <div>
                    <Label className="text-sm font-medium">Report Sections</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {availableSections.map((section) => (
                        <div key={section.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={section.id}
                            checked={exportOptions.sections.includes(section.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setExportOptions(prev => ({
                                  ...prev,
                                  sections: [...prev.sections, section.id]
                                }));
                              } else {
                                setExportOptions(prev => ({
                                  ...prev,
                                  sections: prev.sections.filter(s => s !== section.id)
                                }));
                              }
                            }}
                          />
                          <div>
                            <Label htmlFor={section.id} className="text-sm font-medium">
                              {section.label}
                            </Label>
                            <p className="text-xs text-gray-500">{section.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Branding Options */}
                  {exportOptions.format === 'pdf' && (
                    <div>
                      <Label className="text-sm font-medium">Branding & Customization</Label>
                      <div className="space-y-3 mt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="includeLogo"
                            checked={exportOptions.branding.includeLogo}
                            onCheckedChange={(checked) =>
                              setExportOptions(prev => ({
                                ...prev,
                                branding: { ...prev.branding, includeLogo: checked as boolean }
                              }))
                            }
                          />
                          <Label htmlFor="includeLogo" className="text-sm">Include Company Logo</Label>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="companyName" className="text-sm">Company Name</Label>
                          <Input
                            id="companyName"
                            placeholder="Enter company name"
                            value={exportOptions.branding.companyName}
                            onChange={(e) =>
                              setExportOptions(prev => ({
                                ...prev,
                                branding: { ...prev.branding, companyName: e.target.value }
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="customColors"
                            checked={exportOptions.branding.customColors}
                            onCheckedChange={(checked) =>
                              setExportOptions(prev => ({
                                ...prev,
                                branding: { ...prev.branding, customColors: checked as boolean }
                              }))
                            }
                          />
                          <Label htmlFor="customColors" className="text-sm">Use Custom Brand Colors</Label>
                        </div>

                        {exportOptions.branding.customColors && (
                          <div className="space-y-2">
                            <Label htmlFor="primaryColor" className="text-sm">Primary Color</Label>
                            <div className="flex gap-2">
                              <Input
                                id="primaryColor"
                                type="color"
                                value={exportOptions.branding.primaryColor}
                                onChange={(e) =>
                                  setExportOptions(prev => ({
                                    ...prev,
                                    branding: { ...prev.branding, primaryColor: e.target.value }
                                  }))
                                }
                                className="w-16 h-8"
                              />
                              <Input
                                value={exportOptions.branding.primaryColor}
                                onChange={(e) =>
                                  setExportOptions(prev => ({
                                    ...prev,
                                    branding: { ...prev.branding, primaryColor: e.target.value }
                                  }))
                                }
                                placeholder="#3b82f6"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Preview Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Export Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Preview will appear here</p>
                      <p className="text-xs text-gray-500">
                        {exportOptions.sections.length} sections selected
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Estimated Size:</span>
                      <span>~2.5 MB</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Generation Time:</span>
                      <span>~30 seconds</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Format:</span>
                      <span className="uppercase">{exportOptions.format}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Report
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Star className="h-4 w-4 mr-2" />
                    Save as Template
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Report Templates</h3>
              <p className="text-sm text-gray-600">Create and manage reusable report templates</p>
            </div>
            <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Report Template</DialogTitle>
                  <DialogDescription>
                    Design a reusable template for your reports
                  </DialogDescription>
                </DialogHeader>
                {/* Template creation form would go here */}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setShowTemplateDialog(false)}>
                    Save Template
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </div>
                    {template.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Sections ({template.sections.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {template.sections.slice(0, 3).map((section) => (
                          <Badge key={section} variant="outline" className="text-xs">
                            {section}
                          </Badge>
                        ))}
                        {template.sections.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.sections.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Last used: {template.lastUsed.toLocaleDateString()}</span>
                      <span>{template.format.toUpperCase()}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setExportOptions(prev => ({
                            ...prev,
                            template: template.name,
                            sections: template.sections
                          }));
                          handleExport();
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Use
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Scheduled Reports Tab */}
        <TabsContent value="scheduled" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Scheduled Reports</h3>
              <p className="text-sm text-gray-600">Automate report delivery to stakeholders</p>
            </div>
            <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Report
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule New Report</DialogTitle>
                  <DialogDescription>
                    Set up automated report delivery
                  </DialogDescription>
                </DialogHeader>
                {/* Scheduling form would go here */}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleScheduleReport({})}>
                    Schedule Report
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {scheduledReports.map((report) => (
              <Card key={report.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h4 className="font-medium">{report.name}</h4>
                          <p className="text-sm text-gray-600">
                            {report.template} • {report.frequency} at {report.time}
                          </p>
                        </div>
                        <Switch checked={report.isActive} />
                      </div>
                      
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span>Recipients: {report.recipients.length}</span>
                        <span>Last sent: {report.lastSent.toLocaleDateString()}</span>
                        <span>Next: {report.nextSend.toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Send className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Export History Tab */}
        <TabsContent value="history" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Export History</h3>
            <p className="text-sm text-gray-600">View and download previous exports</p>
          </div>

          <div className="space-y-3">
            {exportJobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium">{job.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={
                                job.status === 'completed' ? 'default' :
                                job.status === 'processing' ? 'secondary' :
                                job.status === 'failed' ? 'destructive' : 'outline'
                              }
                            >
                              {job.status}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {job.format.toUpperCase()} • {job.createdAt.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        
                        {job.status === 'processing' && (
                          <div className="w-32">
                            <Progress value={job.progress} className="h-2" />
                            <p className="text-xs text-center mt-1">{job.progress}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {job.status === 'completed' && job.downloadUrl && (
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      )}
                      {job.status === 'failed' && (
                        <Button size="sm" variant="outline">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      )}
                    </div>
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