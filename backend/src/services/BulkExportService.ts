import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import { EmailService } from './EmailService';

export interface BulkExportJob {
  id: string;
  userId: string;
  projectId?: string;
  analysisIds: string[];
  format: 'excel' | 'csv' | 'json';
  options: BulkExportOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  totalRecords: number;
  processedRecords: number;
  estimatedTimeRemaining?: number;
  downloadUrl?: string;
  filePath?: string;
  fileSize?: number;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  delivery?: {
    email?: boolean;
    recipients?: string[];
    subject?: string;
    message?: string;
  };
}

export interface BulkExportOptions {
  includeCharts: boolean;
  includeTrends: boolean;
  includeImages: boolean;
  consolidateData: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  sections: string[];
  groupBy?: 'project' | 'date' | 'score' | 'none';
}

export interface StartBulkExportData {
  userId: string;
  projectId?: string;
  analysisIds: string[];
  format: 'excel' | 'csv' | 'json';
  options: BulkExportOptions;
  delivery?: {
    email?: boolean;
    recipients?: string[];
    subject?: string;
    message?: string;
  };
}

export class BulkExportService {
  private prisma: PrismaClient;
  private emailService: EmailService;
  private exportJobs: Map<string, BulkExportJob> = new Map();
  private exportDir: string;

  constructor() {
    this.prisma = new PrismaClient();
    this.emailService = new EmailService();
    this.exportDir = path.join(process.cwd(), 'exports');
    this.ensureExportDirectory();
  }

  private async ensureExportDirectory(): Promise<void> {
    try {
      await fs.access(this.exportDir);
    } catch {
      await fs.mkdir(this.exportDir, { recursive: true });
    }
  }

  /**
   * Start a bulk export job
   */
  async startBulkExport(data: StartBulkExportData): Promise<BulkExportJob> {
    const jobId = this.generateJobId();
    
    const job: BulkExportJob = {
      id: jobId,
      userId: data.userId,
      projectId: data.projectId,
      analysisIds: data.analysisIds,
      format: data.format,
      options: data.options,
      status: 'pending',
      progress: 0,
      totalRecords: data.analysisIds.length,
      processedRecords: 0,
      createdAt: new Date(),
      delivery: data.delivery
    };

    // Store job in memory and database
    this.exportJobs.set(jobId, job);
    await this.saveJobToDatabase(job);

    // Start processing asynchronously
    this.processBulkExport(jobId).catch(error => {
      console.error(`Bulk export job ${jobId} failed:`, error);
    });

    return job;
  }

  /**
   * Get export job status
   */
  async getExportStatus(jobId: string, userId: string): Promise<BulkExportJob | null> {
    // Try memory first
    const memoryJob = this.exportJobs.get(jobId);
    if (memoryJob && memoryJob.userId === userId) {
      return memoryJob;
    }

    // Fall back to database
    const dbJob = await this.prisma.exportJob.findFirst({
      where: {
        id: jobId,
        userId: userId
      }
    });

    return dbJob ? this.mapJobFromDb(dbJob) : null;
  }

  /**
   * Cancel an export job
   */
  async cancelExport(jobId: string, userId: string): Promise<boolean> {
    const job = await this.getExportStatus(jobId, userId);
    
    if (!job || job.status === 'completed' || job.status === 'failed') {
      return false;
    }

    job.status = 'cancelled';
    this.exportJobs.set(jobId, job);
    await this.updateJobInDatabase(job);

    return true;
  }

  /**
   * Process bulk export job
   */
  private async processBulkExport(jobId: string): Promise<void> {
    const job = this.exportJobs.get(jobId);
    if (!job) return;

    try {
      // Update job status
      job.status = 'processing';
      job.startedAt = new Date();
      job.estimatedTimeRemaining = this.estimateTimeRemaining(job.totalRecords);
      
      await this.updateJobInDatabase(job);

      // Fetch all analysis data in batches
      const analysisData = await this.fetchAnalysisData(job);
      
      // Check if job was cancelled during processing
      const currentJob = this.exportJobs.get(jobId);
      if (currentJob?.status === 'cancelled') return;

      // Generate export file
      const filePath = await this.generateExportFile(job, analysisData);
      
      // Check again if job was cancelled
      const updatedJob = this.exportJobs.get(jobId);
      if (updatedJob?.status === 'cancelled') return;

      // Update job with completion details
      job.status = 'completed';
      job.progress = 100;
      job.completedAt = new Date();
      job.filePath = filePath;
      job.downloadUrl = `/api/reports/download/${path.basename(filePath)}`;
      
      const stats = await fs.stat(filePath);
      job.fileSize = stats.size;

      await this.updateJobInDatabase(job);

      // Send email notification if requested
      if (job.delivery?.email && job.delivery.recipients && job.delivery.recipients.length > 0) {
        await this.emailService.sendBulkExportNotification(
          job.delivery.recipients,
          job.id,
          job.downloadUrl,
          job.fileSize,
          job.totalRecords
        );
      }

      console.log(`Bulk export job ${jobId} completed successfully`);

    } catch (error) {
      console.error(`Bulk export job ${jobId} failed:`, error);
      
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();
      
      await this.updateJobInDatabase(job);
    }
  }

  /**
   * Fetch analysis data in batches
   */
  private async fetchAnalysisData(job: BulkExportJob): Promise<any[]> {
    const batchSize = 50; // Process 50 analyses at a time
    const allData: any[] = [];
    let processed = 0;

    for (let i = 0; i < job.analysisIds.length; i += batchSize) {
      // Check if job was cancelled
      const currentJob = this.exportJobs.get(job.id);
      if (currentJob?.status === 'cancelled') break;

      const batch = job.analysisIds.slice(i, i + batchSize);
      const batchData = await this.fetchAnalysisBatch(batch, job.options);
      
      allData.push(...batchData);
      processed += batch.length;
      
      // Update progress
      job.progress = Math.round((processed / job.totalRecords) * 80); // 80% for data fetching
      job.processedRecords = processed;
      job.estimatedTimeRemaining = this.estimateTimeRemaining(job.totalRecords - processed);
      
      this.exportJobs.set(job.id, job);
      
      // Update database every 10 batches
      if (i % (batchSize * 10) === 0) {
        await this.updateJobInDatabase(job);
      }
    }

    return allData;
  }

  /**
   * Fetch a batch of analysis data
   */
  private async fetchAnalysisBatch(analysisIds: string[], options: BulkExportOptions): Promise<any[]> {
    const analyses = await this.prisma.sEOAnalysis.findMany({
      where: {
        id: { in: analysisIds }
      },
      include: {
        project: {
          select: { name: true, url: true }
        },
        scoreBreakdown: options.sections.includes('scores'),
        contentAnalysis: options.sections.includes('content'),
        performanceMetrics: options.sections.includes('performance'),
        ...(options.includeTrends ? {
          trends: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        } : {})
      }
    });

    return analyses.map(analysis => this.formatAnalysisForExport(analysis, options));
  }

  /**
   * Format analysis data for export
   */
  private formatAnalysisForExport(analysis: any, options: BulkExportOptions): any {
    const formatted: any = {
      id: analysis.id,
      projectId: analysis.projectId,
      projectName: analysis.project?.name || 'Unknown',
      projectUrl: analysis.project?.url || '',
      analysisDate: analysis.createdAt,
      overallScore: analysis.overallScore,
      technicalScore: analysis.technicalScore,
      contentScore: analysis.contentScore,
      onpageScore: analysis.onpageScore,
      uxScore: analysis.uxScore
    };

    // Add detailed scores if requested
    if (options.sections.includes('scores') && analysis.scoreBreakdown) {
      formatted.scoreBreakdown = analysis.scoreBreakdown;
    }

    // Add content analysis if requested
    if (options.sections.includes('content') && analysis.contentAnalysis) {
      formatted.contentAnalysis = {
        wordCount: analysis.contentAnalysis.wordCount,
        readingTime: analysis.contentAnalysis.readingTime,
        overallScore: analysis.contentAnalysis.overallScore,
        recommendations: analysis.contentAnalysis.recommendations
      };
    }

    // Add technical analysis if requested
    if (options.sections.includes('technical') && analysis.technicalAnalysis) {
      formatted.technicalAnalysis = analysis.technicalAnalysis;
    }

    // Add performance metrics if requested
    if (options.sections.includes('performance') && analysis.performanceMetrics) {
      formatted.performanceMetrics = analysis.performanceMetrics;
    }

    // Add trends if requested
    if (options.includeTrends && analysis.trends) {
      formatted.trends = analysis.trends;
    }

    return formatted;
  }

  /**
   * Generate export file
   */
  private async generateExportFile(job: BulkExportJob, data: any[]): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `bulk-export-${job.id}-${timestamp}.${this.getFileExtension(job.format)}`;
    const filePath = path.join(this.exportDir, filename);

    // Sort and group data if requested
    const processedData = this.processDataForExport(data, job.options);

    switch (job.format) {
      case 'excel':
        await this.generateExcelFile(processedData, filePath, job.options);
        break;
      case 'csv':
        await this.generateCSVFile(processedData, filePath, job.options);
        break;
      case 'json':
        await this.generateJSONFile(processedData, filePath, job.options);
        break;
      default:
        throw new Error(`Unsupported format: ${job.format}`);
    }

    // Update progress to 100%
    job.progress = 100;
    this.exportJobs.set(job.id, job);

    return filePath;
  }

  /**
   * Process data for export (sorting, grouping)
   */
  private processDataForExport(data: any[], options: BulkExportOptions): any[] {
    let processedData = [...data];

    // Apply date range filter if specified
    if (options.dateRange) {
      processedData = processedData.filter(item => {
        const itemDate = new Date(item.analysisDate);
        return itemDate >= options.dateRange!.start && itemDate <= options.dateRange!.end;
      });
    }

    // Group data if requested
    if (options.groupBy && options.groupBy !== 'none') {
      switch (options.groupBy) {
        case 'project':
          processedData.sort((a, b) => a.projectName.localeCompare(b.projectName));
          break;
        case 'date':
          processedData.sort((a, b) => new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime());
          break;
        case 'score':
          processedData.sort((a, b) => b.overallScore - a.overallScore);
          break;
      }
    }

    return processedData;
  }

  /**
   * Generate Excel file
   */
  private async generateExcelFile(data: any[], filePath: string, options: BulkExportOptions): Promise<void> {
    const workbook = XLSX.utils.book_new();

    // Main data sheet
    const mainSheet = XLSX.utils.json_to_sheet(this.flattenDataForSheet(data, 'main'));
    XLSX.utils.book_append_sheet(workbook, mainSheet, 'Analysis Results');

    // Additional sheets for different data types
    if (options.sections.includes('scores')) {
      const scoresData = data.filter(item => item.scoreBreakdown);
      if (scoresData.length > 0) {
        const scoresSheet = XLSX.utils.json_to_sheet(this.flattenDataForSheet(scoresData, 'scores'));
        XLSX.utils.book_append_sheet(workbook, scoresSheet, 'Score Breakdown');
      }
    }

    if (options.sections.includes('content')) {
      const contentData = data.filter(item => item.contentAnalysis);
      if (contentData.length > 0) {
        const contentSheet = XLSX.utils.json_to_sheet(this.flattenDataForSheet(contentData, 'content'));
        XLSX.utils.book_append_sheet(workbook, contentSheet, 'Content Analysis');
      }
    }

    if (options.sections.includes('technical')) {
      const techData = data.filter(item => item.technicalAnalysis);
      if (techData.length > 0) {
        const techSheet = XLSX.utils.json_to_sheet(this.flattenDataForSheet(techData, 'technical'));
        XLSX.utils.book_append_sheet(workbook, techSheet, 'Technical Analysis');
      }
    }

    if (options.includeTrends) {
      const trendsData = data.filter(item => item.trends && item.trends.length > 0);
      if (trendsData.length > 0) {
        const flatTrends = this.flattenTrendsData(trendsData);
        const trendsSheet = XLSX.utils.json_to_sheet(flatTrends);
        XLSX.utils.book_append_sheet(workbook, trendsSheet, 'Trends');
      }
    }

    // Write file
    XLSX.writeFile(workbook, filePath);
  }

  /**
   * Generate CSV file
   */
  private async generateCSVFile(data: any[], filePath: string, options: BulkExportOptions): Promise<void> {
    const flatData = this.flattenDataForSheet(data, 'main');
    
    if (flatData.length === 0) {
      throw new Error('No data to export');
    }

    const headers = Object.keys(flatData[0]).map(key => ({ id: key, title: key }));
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: headers
    });

    await csvWriter.writeRecords(flatData);
  }

  /**
   * Generate JSON file
   */
  private async generateJSONFile(data: any[], filePath: string, options: BulkExportOptions): Promise<void> {
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalRecords: data.length,
        format: 'json',
        options: options
      },
      data: data
    };

    await fs.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf8');
  }

  /**
   * Flatten data for spreadsheet format
   */
  private flattenDataForSheet(data: any[], sheetType: string): any[] {
    return data.map(item => {
      const flattened: any = {
        id: item.id,
        projectName: item.projectName,
        projectUrl: item.projectUrl,
        analysisDate: item.analysisDate,
        overallScore: item.overallScore,
        technicalScore: item.technicalScore,
        contentScore: item.contentScore,
        onpageScore: item.onpageScore,
        uxScore: item.uxScore
      };

      // Add specific data based on sheet type
      switch (sheetType) {
        case 'scores':
          if (item.scoreBreakdown) {
            Object.keys(item.scoreBreakdown).forEach(key => {
              flattened[`score_${key}`] = item.scoreBreakdown[key];
            });
          }
          break;
        case 'content':
          if (item.contentAnalysis) {
            flattened.wordCount = item.contentAnalysis.wordCount;
            flattened.readingTime = item.contentAnalysis.readingTime;
            flattened.contentScore = item.contentAnalysis.overallScore;
            flattened.contentRecommendations = item.contentAnalysis.recommendations?.join('; ');
          }
          break;
        case 'technical':
          if (item.technicalAnalysis) {
            Object.keys(item.technicalAnalysis).forEach(key => {
              flattened[`tech_${key}`] = JSON.stringify(item.technicalAnalysis[key]);
            });
          }
          break;
      }

      return flattened;
    });
  }

  /**
   * Flatten trends data
   */
  private flattenTrendsData(data: any[]): any[] {
    const flattened: any[] = [];
    
    data.forEach(item => {
      if (item.trends && Array.isArray(item.trends)) {
        item.trends.forEach((trend: any, index: number) => {
          flattened.push({
            analysisId: item.id,
            projectName: item.projectName,
            trendIndex: index,
            trendDate: trend.date,
            trendScore: trend.score,
            ...trend
          });
        });
      }
    });

    return flattened;
  }

  /**
   * Get file extension for format
   */
  private getFileExtension(format: string): string {
    switch (format) {
      case 'excel': return 'xlsx';
      case 'csv': return 'csv';
      case 'json': return 'json';
      default: return 'txt';
    }
  }

  /**
   * Estimate time remaining in seconds
   */
  private estimateTimeRemaining(remainingRecords: number): number {
    // Rough estimate: 1 record per second
    return Math.max(remainingRecords, 10);
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save job to database
   */
  private async saveJobToDatabase(job: BulkExportJob): Promise<void> {
    try {
      await this.prisma.exportJob.create({
        data: {
          id: job.id,
          userId: job.userId,
          projectId: job.projectId,
          analysisIds: job.analysisIds,
          format: job.format,
          options: job.options as any,
          status: job.status,
          progress: job.progress,
          totalRecords: job.totalRecords,
          processedRecords: job.processedRecords,
          createdAt: job.createdAt,
          delivery: job.delivery
        }
      });
    } catch (error) {
      console.error('Failed to save job to database:', error);
    }
  }

  /**
   * Update job in database
   */
  private async updateJobInDatabase(job: BulkExportJob): Promise<void> {
    try {
      await this.prisma.exportJob.update({
        where: { id: job.id },
        data: {
          status: job.status,
          progress: job.progress,
          processedRecords: job.processedRecords,
          estimatedTimeRemaining: job.estimatedTimeRemaining,
          downloadUrl: job.downloadUrl,
          filePath: job.filePath,
          fileSize: job.fileSize,
          error: job.error,
          startedAt: job.startedAt,
          completedAt: job.completedAt
        }
      });
    } catch (error) {
      console.error('Failed to update job in database:', error);
    }
  }

  /**
   * Map database job to interface
   */
  private mapJobFromDb(dbJob: any): BulkExportJob {
    return {
      id: dbJob.id,
      userId: dbJob.userId,
      projectId: dbJob.projectId,
      analysisIds: Array.isArray(dbJob.analysisIds) ? dbJob.analysisIds : [],
      format: dbJob.format,
      options: dbJob.options as BulkExportOptions,
      status: dbJob.status,
      progress: dbJob.progress || 0,
      totalRecords: dbJob.totalRecords || 0,
      processedRecords: dbJob.processedRecords || 0,
      estimatedTimeRemaining: dbJob.estimatedTimeRemaining,
      downloadUrl: dbJob.downloadUrl,
      filePath: dbJob.filePath,
      fileSize: dbJob.fileSize,
      error: dbJob.error,
      createdAt: dbJob.createdAt,
      startedAt: dbJob.startedAt,
      completedAt: dbJob.completedAt,
      delivery: dbJob.delivery
    };
  }
} 