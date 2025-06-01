import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';
import { createObjectCsvWriter } from 'csv-writer';

interface ReportConfig {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  template: 'executive' | 'detailed' | 'technical' | 'custom';
  sections: string[];
  includeTrends: boolean;
  includeCharts: boolean;
  branding?: {
    logo?: string;
    primaryColor?: string;
    companyName?: string;
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface ReportData {
  analysis: any;
  project: any;
  trends: any[];
  issues: any[];
  recommendations: any[];
  metadata: {
    generatedAt: Date;
    generatedBy: string;
    version: string;
  };
}

interface ExportResult {
  success: boolean;
  filePath?: string;
  fileSize?: number;
  downloadUrl?: string;
  error?: string;
  reportId?: string;
}

export class ReportGenerationService {
  private prisma: PrismaClient;
  private reportsDir: string;

  constructor() {
    this.prisma = new PrismaClient();
    this.reportsDir = path.join(process.cwd(), 'reports');
    this.ensureReportsDirectory();
  }

  private async ensureReportsDirectory(): Promise<void> {
    try {
      await fs.access(this.reportsDir);
    } catch {
      await fs.mkdir(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Generate a comprehensive report
   */
  async generateReport(
    analysisId: string,
    projectId: string,
    config: ReportConfig,
    userId: string
  ): Promise<ExportResult> {
    try {
      // Gather report data
      const reportData = await this.gatherReportData(analysisId, projectId, config);
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `seo-report-${projectId}-${timestamp}.${this.getFileExtension(config.format)}`;
      const filePath = path.join(this.reportsDir, filename);
      const reportId = this.generateReportId();

      // Generate report based on format
      let result: ExportResult;
      switch (config.format) {
        case 'pdf':
          result = await this.generatePDFReport(reportData, config, filePath);
          break;
        case 'excel':
          result = await this.generateExcelReport(reportData, config, filePath);
          break;
        case 'csv':
          result = await this.generateCSVReport(reportData, config, filePath);
          break;
        case 'json':
          result = await this.generateJSONReport(reportData, config, filePath);
          break;
        default:
          throw new Error(`Unsupported format: ${config.format}`);
      }

      // Add reportId to result
      if (result.success) {
        result.reportId = reportId;
      }

      // Store export record
      if (result.success) {
        await this.storeExportRecord(analysisId, projectId, userId, config, result);
      }

      return result;

    } catch (error) {
      console.error('Report generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Gather all data needed for the report
   */
  private async gatherReportData(
    analysisId: string, 
    projectId: string, 
    config: ReportConfig
  ): Promise<ReportData> {
    const [analysis, project, trends, issues, recommendations] = await Promise.all([
      this.getAnalysisData(analysisId),
      this.getProjectData(projectId),
      config.includeTrends ? this.getTrendsData(projectId, config.dateRange) : [],
      this.getIssuesData(analysisId),
      this.getRecommendationsData(analysisId)
    ]);

    return {
      analysis,
      project,
      trends,
      issues,
      recommendations,
      metadata: {
        generatedAt: new Date(),
        generatedBy: 'SEO Analysis System',
        version: '2.0'
      }
    };
  }

  /**
   * Generate PDF report
   */
  private async generatePDFReport(
    data: ReportData,
    config: ReportConfig,
    filePath: string
  ): Promise<ExportResult> {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = doc.pipe(require('fs').createWriteStream(filePath));

      // Header
      await this.addPDFHeader(doc, data, config);
      
      // Executive Summary
      if (config.sections.includes('summary')) {
        this.addPDFExecutiveSummary(doc, data);
      }

      // Score Overview
      if (config.sections.includes('scores')) {
        this.addPDFScoreOverview(doc, data);
      }

      // Issues Analysis
      if (config.sections.includes('issues')) {
        this.addPDFIssuesAnalysis(doc, data);
      }

      // Recommendations
      if (config.sections.includes('recommendations')) {
        this.addPDFRecommendations(doc, data);
      }

      // Trends (if included)
      if (config.sections.includes('trends') && data.trends.length > 0) {
        this.addPDFTrends(doc, data);
      }

      // Technical Details
      if (config.sections.includes('technical')) {
        this.addPDFTechnicalDetails(doc, data);
      }

      // Footer
      this.addPDFFooter(doc, data);

      doc.end();

      return new Promise((resolve) => {
        stream.on('finish', async () => {
          const stats = await fs.stat(filePath);
          resolve({
            success: true,
            filePath,
            fileSize: stats.size,
            downloadUrl: `/api/reports/download/${path.basename(filePath)}`
          });
        });
      });

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF generation failed'
      };
    }
  }

  /**
   * Generate Excel report
   */
  private async generateExcelReport(
    data: ReportData,
    config: ReportConfig,
    filePath: string
  ): Promise<ExportResult> {
    try {
      const workbook = XLSX.utils.book_new();

      // Summary sheet
      if (config.sections.includes('summary')) {
        const summaryData = this.prepareSummaryData(data);
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      }

      // Scores sheet
      if (config.sections.includes('scores')) {
        const scoresData = this.prepareScoresData(data);
        const scoresSheet = XLSX.utils.json_to_sheet(scoresData);
        XLSX.utils.book_append_sheet(workbook, scoresSheet, 'Scores');
      }

      // Issues sheet
      if (config.sections.includes('issues')) {
        const issuesData = this.prepareIssuesData(data);
        const issuesSheet = XLSX.utils.json_to_sheet(issuesData);
        XLSX.utils.book_append_sheet(workbook, issuesSheet, 'Issues');
      }

      // Recommendations sheet
      if (config.sections.includes('recommendations')) {
        const recommendationsData = this.prepareRecommendationsData(data);
        const recommendationsSheet = XLSX.utils.json_to_sheet(recommendationsData);
        XLSX.utils.book_append_sheet(workbook, recommendationsSheet, 'Recommendations');
      }

      // Trends sheet
      if (config.sections.includes('trends') && data.trends.length > 0) {
        const trendsData = this.prepareTrendsData(data);
        const trendsSheet = XLSX.utils.json_to_sheet(trendsData);
        XLSX.utils.book_append_sheet(workbook, trendsSheet, 'Trends');
      }

      // Write file
      XLSX.writeFile(workbook, filePath);

      const stats = await fs.stat(filePath);
      return {
        success: true,
        filePath,
        fileSize: stats.size,
        downloadUrl: `/api/reports/download/${path.basename(filePath)}`
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Excel generation failed'
      };
    }
  }

  /**
   * Generate CSV report
   */
  private async generateCSVReport(
    data: ReportData,
    config: ReportConfig,
    filePath: string
  ): Promise<ExportResult> {
    try {
      let csvData: any[] = [];

      if (config.sections.includes('issues')) {
        csvData = data.issues.map(issue => ({
          Category: issue.category,
          Severity: issue.severity,
          Title: issue.title,
          Description: issue.description,
          'Fix Complexity': issue.fixComplexity,
          'Estimated Time': issue.estimatedTime,
          'Business Impact': issue.businessImpact,
          Status: issue.status
        }));
      } else if (config.sections.includes('recommendations')) {
        csvData = data.recommendations.map(rec => ({
          Priority: rec.priority,
          Category: rec.category,
          Title: rec.title,
          Description: rec.description,
          'Quick Win': rec.quickWin ? 'Yes' : 'No',
          'Estimated Impact': rec.estimatedImpact
        }));
      } else {
        // Default to summary data
        csvData = this.prepareSummaryData(data);
      }

      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: Object.keys(csvData[0] || {}).map(key => ({ id: key, title: key }))
      });

      await csvWriter.writeRecords(csvData);

      const stats = await fs.stat(filePath);
      return {
        success: true,
        filePath,
        fileSize: stats.size,
        downloadUrl: `/api/reports/download/${path.basename(filePath)}`
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'CSV generation failed'
      };
    }
  }

  /**
   * Generate JSON report
   */
  private async generateJSONReport(
    data: ReportData,
    config: ReportConfig,
    filePath: string
  ): Promise<ExportResult> {
    try {
      const reportJson = {
        metadata: data.metadata,
        project: data.project,
        analysis: data.analysis,
        summary: {
          overallScore: data.analysis.overallScore,
          totalIssues: data.issues.length,
          criticalIssues: data.issues.filter((i: any) => i.severity === 'critical').length,
          totalRecommendations: data.recommendations.length,
          quickWins: data.recommendations.filter((r: any) => r.quickWin).length
        },
        sections: {}
      };

      // Add requested sections
      if (config.sections.includes('issues')) {
        reportJson.sections = { ...reportJson.sections, issues: data.issues };
      }
      if (config.sections.includes('recommendations')) {
        reportJson.sections = { ...reportJson.sections, recommendations: data.recommendations };
      }
      if (config.sections.includes('trends')) {
        reportJson.sections = { ...reportJson.sections, trends: data.trends };
      }

      await fs.writeFile(filePath, JSON.stringify(reportJson, null, 2));

      const stats = await fs.stat(filePath);
      return {
        success: true,
        filePath,
        fileSize: stats.size,
        downloadUrl: `/api/reports/download/${path.basename(filePath)}`
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'JSON generation failed'
      };
    }
  }

  // PDF Helper Methods
  private async addPDFHeader(doc: PDFKit.PDFDocument, data: ReportData, config: ReportConfig): Promise<void> {
    // Add logo if provided
    if (config.branding?.logo) {
      try {
        doc.image(config.branding.logo, 50, 50, { width: 100 });
      } catch (error) {
        console.warn('Failed to add logo to PDF:', error);
      }
    }

    // Title
    doc.fontSize(24)
       .fillColor(config.branding?.primaryColor || '#2563eb')
       .text('SEO Analysis Report', 50, config.branding?.logo ? 170 : 50);

    // Project info
    doc.fontSize(14)
       .fillColor('#374151')
       .text(`Project: ${data.project.name}`, 50, config.branding?.logo ? 200 : 80)
       .text(`URL: ${data.project.url}`, 50, config.branding?.logo ? 220 : 100)
       .text(`Generated: ${data.metadata.generatedAt.toLocaleDateString()}`, 50, config.branding?.logo ? 240 : 120);

    doc.moveDown(2);
  }

  private addPDFExecutiveSummary(doc: PDFKit.PDFDocument, data: ReportData): void {
    doc.addPage()
       .fontSize(18)
       .fillColor('#1f2937')
       .text('Executive Summary', 50, 50);

    const summary = {
      overallScore: data.analysis.overallScore || 0,
      totalIssues: data.issues.length,
      criticalIssues: data.issues.filter((i: any) => i.severity === 'critical').length,
      recommendations: data.recommendations.length,
      quickWins: data.recommendations.filter((r: any) => r.quickWin).length
    };

    doc.fontSize(12)
       .fillColor('#374151')
       .text(`Overall SEO Score: ${summary.overallScore}/100`, 50, 90)
       .text(`Total Issues Found: ${summary.totalIssues}`, 50, 110)
       .text(`Critical Issues: ${summary.criticalIssues}`, 50, 130)
       .text(`Total Recommendations: ${summary.recommendations}`, 50, 150)
       .text(`Quick Wins Available: ${summary.quickWins}`, 50, 170);

    doc.moveDown(2);
  }

  private addPDFScoreOverview(doc: PDFKit.PDFDocument, data: ReportData): void {
    doc.addPage()
       .fontSize(18)
       .fillColor('#1f2937')
       .text('Score Breakdown', 50, 50);

    const scores = {
      technical: data.analysis.technicalScore || 0,
      content: data.analysis.contentScore || 0,
      onPage: data.analysis.onpageScore || 0,
      ux: data.analysis.uxScore || 0
    };

    let yPosition = 90;
    Object.entries(scores).forEach(([category, score]) => {
      doc.fontSize(12)
         .fillColor('#374151')
         .text(`${category.charAt(0).toUpperCase() + category.slice(1)}: ${score}/100`, 50, yPosition);
      yPosition += 20;
    });
  }

  private addPDFIssuesAnalysis(doc: PDFKit.PDFDocument, data: ReportData): void {
    doc.addPage()
       .fontSize(18)
       .fillColor('#1f2937')
       .text('Issues Analysis', 50, 50);

    let yPosition = 90;
    data.issues.slice(0, 10).forEach((issue: any) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      doc.fontSize(14)
         .fillColor(this.getSeverityColor(issue.severity))
         .text(`${issue.severity.toUpperCase()}: ${issue.title}`, 50, yPosition);
      
      doc.fontSize(10)
         .fillColor('#374151')
         .text(issue.description, 50, yPosition + 20, { width: 500 });

      yPosition += 60;
    });
  }

  private addPDFRecommendations(doc: PDFKit.PDFDocument, data: ReportData): void {
    doc.addPage()
       .fontSize(18)
       .fillColor('#1f2937')
       .text('Recommendations', 50, 50);

    let yPosition = 90;
    data.recommendations.slice(0, 10).forEach((rec: any) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      doc.fontSize(14)
         .fillColor(this.getPriorityColor(rec.priority))
         .text(`${rec.priority.toUpperCase()}: ${rec.title}`, 50, yPosition);
      
      doc.fontSize(10)
         .fillColor('#374151')
         .text(rec.description, 50, yPosition + 20, { width: 500 });

      if (rec.quickWin) {
        doc.fontSize(8)
           .fillColor('#059669')
           .text('⚡ Quick Win', 50, yPosition + 45);
      }

      yPosition += 70;
    });
  }

  private addPDFTrends(doc: PDFKit.PDFDocument, data: ReportData): void {
    doc.addPage()
       .fontSize(18)
       .fillColor('#1f2937')
       .text('Performance Trends', 50, 50);

    // Add trend summary
    if (data.trends.length > 1) {
      const latest = data.trends[data.trends.length - 1];
      const previous = data.trends[data.trends.length - 2];
      const change = latest.overallScore - previous.overallScore;

      doc.fontSize(12)
         .fillColor('#374151')
         .text(`Score Change: ${change > 0 ? '+' : ''}${change.toFixed(1)} points`, 50, 90)
         .text(`Latest Score: ${latest.overallScore}/100`, 50, 110)
         .text(`Previous Score: ${previous.overallScore}/100`, 50, 130);
    }
  }

  private addPDFTechnicalDetails(doc: PDFKit.PDFDocument, data: ReportData): void {
    doc.addPage()
       .fontSize(18)
       .fillColor('#1f2937')
       .text('Technical Details', 50, 50);

    doc.fontSize(10)
       .fillColor('#374151')
       .text(`Analysis ID: ${data.analysis.id}`, 50, 90)
       .text(`Generated: ${data.metadata.generatedAt.toISOString()}`, 50, 110)
       .text(`Version: ${data.metadata.version}`, 50, 130)
       .text(`Generated By: ${data.metadata.generatedBy}`, 50, 150);
  }

  private addPDFFooter(doc: PDFKit.PDFDocument, data: ReportData): void {
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8)
         .fillColor('#6b7280')
         .text(`Page ${i + 1} of ${pages.count}`, 50, doc.page.height - 50, { align: 'center' });
    }
  }

  // Data preparation methods
  private prepareSummaryData(data: ReportData): any[] {
    return [{
      'Project Name': data.project.name,
      'URL': data.project.url,
      'Overall Score': data.analysis.overallScore,
      'Technical Score': data.analysis.technicalScore,
      'Content Score': data.analysis.contentScore,
      'On-Page Score': data.analysis.onpageScore,
      'UX Score': data.analysis.uxScore,
      'Total Issues': data.issues.length,
      'Critical Issues': data.issues.filter((i: any) => i.severity === 'critical').length,
      'Total Recommendations': data.recommendations.length,
      'Quick Wins': data.recommendations.filter((r: any) => r.quickWin).length,
      'Generated': data.metadata.generatedAt.toLocaleDateString()
    }];
  }

  private prepareScoresData(data: ReportData): any[] {
    return [{
      'Category': 'Overall',
      'Score': data.analysis.overallScore,
      'Max Score': 100
    }, {
      'Category': 'Technical',
      'Score': data.analysis.technicalScore,
      'Max Score': 100
    }, {
      'Category': 'Content',
      'Score': data.analysis.contentScore,
      'Max Score': 100
    }, {
      'Category': 'On-Page',
      'Score': data.analysis.onpageScore,
      'Max Score': 100
    }, {
      'Category': 'User Experience',
      'Score': data.analysis.uxScore,
      'Max Score': 100
    }];
  }

  private prepareIssuesData(data: ReportData): any[] {
    return data.issues.map((issue: any) => ({
      'Category': issue.category,
      'Severity': issue.severity,
      'Title': issue.title,
      'Description': issue.description,
      'Fix Complexity': issue.fixComplexity,
      'Estimated Time': issue.estimatedTime,
      'Business Impact': issue.businessImpact,
      'Status': issue.status
    }));
  }

  private prepareRecommendationsData(data: ReportData): any[] {
    return data.recommendations.map((rec: any) => ({
      'Priority': rec.priority,
      'Category': rec.category,
      'Title': rec.title,
      'Description': rec.description,
      'Quick Win': rec.quickWin ? 'Yes' : 'No',
      'Estimated Impact': rec.estimatedImpact,
      'Implementation Steps': rec.implementationSteps.join('; ')
    }));
  }

  private prepareTrendsData(data: ReportData): any[] {
    return data.trends.map((trend: any) => ({
      'Date': new Date(trend.date).toLocaleDateString(),
      'Overall Score': trend.overallScore,
      'Technical Score': trend.technicalScore,
      'Content Score': trend.contentScore,
      'On-Page Score': trend.onPageScore,
      'UX Score': trend.uxScore,
      'Total Issues': trend.totalIssues,
      'Critical Issues': trend.criticalIssues
    }));
  }

  // Helper methods
  private getSeverityColor(severity: string): string {
    const colors = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#ca8a04',
      low: '#2563eb'
    };
    return colors[severity as keyof typeof colors] || '#374151';
  }

  private getPriorityColor(priority: string): string {
    const colors = {
      immediate: '#dc2626',
      high: '#ea580c',
      medium: '#ca8a04',
      low: '#2563eb'
    };
    return colors[priority as keyof typeof colors] || '#374151';
  }

  private getFileExtension(format: string): string {
    const extensions = {
      pdf: 'pdf',
      excel: 'xlsx',
      csv: 'csv',
      json: 'json'
    };
    return extensions[format as keyof typeof extensions] || 'txt';
  }

  // Database methods
  private async getAnalysisData(analysisId: string): Promise<any> {
    return await this.prisma.crawlSession.findUnique({
      where: { id: analysisId },
      include: {
        analysis: {
          include: {
            metaTags: true,
            scoreBreakdown: true,
            contentAnalysis: true
          }
        }
      }
    });
  }

  private async getProjectData(projectId: string): Promise<any> {
    return await this.prisma.project.findUnique({
      where: { id: projectId }
    });
  }

  private async getTrendsData(projectId: string, dateRange?: { start: Date; end: Date }): Promise<any[]> {
    const where: any = { projectId };
    if (dateRange) {
      where.date = {
        gte: dateRange.start,
        lte: dateRange.end
      };
    }

    return await this.prisma.projectTrends.findMany({
      where,
      orderBy: { date: 'asc' }
    });
  }

  private async getIssuesData(analysisId: string): Promise<any[]> {
    const analysis = await this.prisma.crawlSession.findUnique({
      where: { id: analysisId },
      include: {
        analysis: {
          include: {
            issues: true
          }
        }
      }
    });

    return analysis?.analysis?.issues || [];
  }

  private async getRecommendationsData(analysisId: string): Promise<any[]> {
    const analysis = await this.prisma.crawlSession.findUnique({
      where: { id: analysisId },
      include: {
        analysis: {
          include: {
            recommendations: true
          }
        }
      }
    });

    return analysis?.analysis?.recommendations || [];
  }

  private async storeExportRecord(
    analysisId: string,
    projectId: string,
    userId: string,
    config: ReportConfig,
    result: ExportResult
  ): Promise<void> {
    try {
      await this.prisma.reportExport.create({
        data: {
          analysisId,
          projectId,
          requestedBy: userId,
          exportType: config.format,
          fileName: result.filePath ? path.basename(result.filePath) : 'report',
          fileSize: result.fileSize || 0,
          downloadUrl: result.downloadUrl || '',
          status: 'completed',
          metadata: {
            template: config.template,
            sections: config.sections,
            format: config.format
          }
        }
      });
    } catch (error) {
      console.error('Failed to store export record:', error);
    }
  }

  /**
   * Get export history for a project
   */
  async getExportHistory(projectId: string, userId: string): Promise<any[]> {
    return await this.prisma.reportExport.findMany({
      where: { projectId, requestedBy: userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  }

  /**
   * Clean up old report files
   */
  async cleanupOldReports(olderThanDays: number = 30): Promise<{ deletedCount: number; freedSize: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const oldReports = await this.prisma.reportExport.findMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      });

      let deletedCount = 0;
      let freedSize = 0;

      for (const report of oldReports) {
        try {
          // Since there's no filePath field, we'll construct it from fileName
          const reportPath = path.join(this.reportsDir, report.fileName);
          await fs.unlink(reportPath);
          freedSize += report.fileSize || 0;
          deletedCount++;
        } catch (error) {
          console.warn(`Failed to delete report file: ${report.fileName}`, error);
        }
      }

      // Remove records from database
      await this.prisma.reportExport.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      });

      return { deletedCount, freedSize };

    } catch (error) {
      console.error('Report cleanup error:', error);
      return { deletedCount: 0, freedSize: 0 };
    }
  }

  /**
   * Get report generation status
   */
  async getReportStatus(reportId: string, userId: string): Promise<any> {
    try {
      const record = await this.prisma.exportRecord.findFirst({
        where: {
          reportId: reportId,
          userId: userId
        }
      });

      if (!record) {
        return {
          status: 'not_found',
          error: 'Report not found'
        };
      }

      // Check if file still exists
      if (record.filePath) {
        try {
          await fs.access(record.filePath);
          return {
            status: 'completed',
            reportId: record.reportId,
            downloadUrl: record.downloadUrl,
            fileSize: record.fileSize,
            format: record.format,
            generatedAt: record.createdAt,
            expiresAt: new Date(record.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
          };
        } catch {
          return {
            status: 'expired',
            error: 'Report file has expired or been deleted'
          };
        }
      }

      return {
        status: 'failed',
        error: 'Report generation failed'
      };

    } catch (error) {
      console.error('Error getting report status:', error);
      return {
        status: 'error',
        error: 'Unable to check report status'
      };
    }
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const reportGenerationService = new ReportGenerationService(); 