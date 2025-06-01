import { PrismaClient } from '@prisma/client';
import { ReportGenerationService } from './ReportGenerationService';
import { EmailService } from './EmailService';
import { ReportTemplateService } from './ReportTemplateService';

export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number; // 1-31
  time: string; // HH:MM format
  timezone: string;
}

export interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  userId: string;
  projectId: string;
  templateId: string;
  schedule: ScheduleConfig;
  recipients: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastExecuted?: Date;
  nextExecution: Date;
  executionCount: number;
  lastStatus?: 'success' | 'failed';
  lastError?: string;
}

export interface CreateScheduledReportData {
  name: string;
  description: string;
  userId: string;
  projectId: string;
  templateId: string;
  schedule: ScheduleConfig;
  recipients: string[];
  isActive: boolean;
}

export interface UpdateScheduledReportData {
  name?: string;
  description?: string;
  templateId?: string;
  schedule?: ScheduleConfig;
  recipients?: string[];
  isActive?: boolean;
}

export class ScheduledReportService {
  private prisma: PrismaClient;
  private reportService: ReportGenerationService;
  private emailService: EmailService;
  private templateService: ReportTemplateService;
  private executionInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.prisma = new PrismaClient();
    this.reportService = new ReportGenerationService();
    this.emailService = new EmailService();
    this.templateService = new ReportTemplateService();
    this.startScheduler();
  }

  /**
   * Start the report scheduler
   */
  private startScheduler(): void {
    // Check for scheduled reports every minute
    this.executionInterval = setInterval(async () => {
      await this.processScheduledReports();
    }, 60 * 1000);

    console.log('Scheduled report service started');
  }

  /**
   * Stop the report scheduler
   */
  public stopScheduler(): void {
    if (this.executionInterval) {
      clearInterval(this.executionInterval);
      this.executionInterval = null;
    }
    console.log('Scheduled report service stopped');
  }

  /**
   * Get scheduled reports for a user
   */
  async getScheduledReports(userId: string, projectId?: string): Promise<ScheduledReport[]> {
    const whereClause: any = { userId };
    if (projectId) {
      whereClause.projectId = projectId;
    }

    const scheduledReports = await this.prisma.scheduledReport.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    return scheduledReports.map(this.mapScheduledReportFromDb);
  }

  /**
   * Get a specific scheduled report
   */
  async getScheduledReport(scheduleId: string, userId: string): Promise<ScheduledReport | null> {
    const scheduledReport = await this.prisma.scheduledReport.findFirst({
      where: {
        id: scheduleId,
        userId: userId
      }
    });

    return scheduledReport ? this.mapScheduledReportFromDb(scheduledReport) : null;
  }

  /**
   * Create a new scheduled report
   */
  async createScheduledReport(data: CreateScheduledReportData): Promise<ScheduledReport> {
    // Validate template exists and user has access
    const template = await this.templateService.getTemplate(data.templateId, data.userId);
    if (!template) {
      throw new Error('Template not found or access denied');
    }

    // Validate project exists and user has access
    const project = await this.prisma.project.findFirst({
      where: {
        id: data.projectId,
        userId: data.userId
      }
    });

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    // Calculate next execution time
    const nextExecution = this.calculateNextExecution(data.schedule);

    const scheduledReport = await this.prisma.scheduledReport.create({
      data: {
        name: data.name,
        description: data.description,
        userId: data.userId,
        projectId: data.projectId,
        templateId: data.templateId,
        schedule: data.schedule as any,
        recipients: data.recipients,
        isActive: data.isActive,
        nextExecution: nextExecution,
        executionCount: 0
      }
    });

    return this.mapScheduledReportFromDb(scheduledReport);
  }

  /**
   * Update a scheduled report
   */
  async updateScheduledReport(
    scheduleId: string, 
    userId: string, 
    data: UpdateScheduledReportData
  ): Promise<ScheduledReport> {
    const existingReport = await this.prisma.scheduledReport.findFirst({
      where: {
        id: scheduleId,
        userId: userId
      }
    });

    if (!existingReport) {
      throw new Error('Scheduled report not found or access denied');
    }

    // Validate template if provided
    if (data.templateId) {
      const template = await this.templateService.getTemplate(data.templateId, userId);
      if (!template) {
        throw new Error('Template not found or access denied');
      }
    }

    // Calculate new next execution time if schedule changed
    let nextExecution = existingReport.nextExecution;
    if (data.schedule) {
      nextExecution = this.calculateNextExecution(data.schedule);
    }

    const updatedReport = await this.prisma.scheduledReport.update({
      where: { id: scheduleId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description && { description: data.description }),
        ...(data.templateId && { templateId: data.templateId }),
        ...(data.schedule && { schedule: data.schedule as any }),
        ...(data.recipients && { recipients: data.recipients }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        nextExecution: nextExecution,
        updatedAt: new Date()
      }
    });

    return this.mapScheduledReportFromDb(updatedReport);
  }

  /**
   * Delete a scheduled report
   */
  async deleteScheduledReport(scheduleId: string, userId: string): Promise<void> {
    const scheduledReport = await this.prisma.scheduledReport.findFirst({
      where: {
        id: scheduleId,
        userId: userId
      }
    });

    if (!scheduledReport) {
      throw new Error('Scheduled report not found or access denied');
    }

    await this.prisma.scheduledReport.delete({
      where: { id: scheduleId }
    });
  }

  /**
   * Execute a scheduled report immediately
   */
  async executeScheduledReportNow(scheduleId: string, userId: string): Promise<boolean> {
    const scheduledReport = await this.getScheduledReport(scheduleId, userId);
    
    if (!scheduledReport) {
      throw new Error('Scheduled report not found');
    }

    return await this.executeScheduledReport(scheduledReport);
  }

  /**
   * Process all due scheduled reports
   */
  private async processScheduledReports(): Promise<void> {
    try {
      const dueReports = await this.prisma.scheduledReport.findMany({
        where: {
          isActive: true,
          nextExecution: {
            lte: new Date()
          }
        }
      });

      for (const report of dueReports) {
        const scheduledReport = this.mapScheduledReportFromDb(report);
        await this.executeScheduledReport(scheduledReport);
      }

    } catch (error) {
      console.error('Error processing scheduled reports:', error);
    }
  }

  /**
   * Execute a single scheduled report
   */
  private async executeScheduledReport(scheduledReport: ScheduledReport): Promise<boolean> {
    try {
      console.log(`Executing scheduled report: ${scheduledReport.name}`);

      // Get the latest analysis for the project
      const latestAnalysis = await this.prisma.sEOAnalysis.findFirst({
        where: { projectId: scheduledReport.projectId },
        orderBy: { createdAt: 'desc' }
      });

      if (!latestAnalysis) {
        throw new Error('No analysis found for project');
      }

      // Get template
      const template = await this.templateService.getTemplate(
        scheduledReport.templateId, 
        scheduledReport.userId
      );

      if (!template) {
        throw new Error('Template not found');
      }

      // Generate report
      const reportConfig = {
        format: template.format,
        template: 'custom' as const,
        sections: template.sections,
        includeTrends: template.settings.includeTrends || false,
        includeCharts: template.settings.includeCharts || false,
        branding: template.branding
      };

      const reportResult = await this.reportService.generateReport(
        latestAnalysis.id,
        scheduledReport.projectId,
        reportConfig,
        scheduledReport.userId
      );

      if (!reportResult.success) {
        throw new Error(reportResult.error || 'Report generation failed');
      }

      // Send email if recipients are configured
      if (scheduledReport.recipients.length > 0 && reportResult.filePath) {
        await this.emailService.sendReportEmail({
          recipients: scheduledReport.recipients,
          subject: `Scheduled Report: ${scheduledReport.name}`,
          message: `Your scheduled SEO analysis report for project "${scheduledReport.projectId}" is attached.`,
          attachmentPath: reportResult.filePath,
          attachmentName: `seo-report.${template.format}`,
          template: 'scheduled-report',
          templateData: {
            projectName: scheduledReport.projectId,
            reportName: scheduledReport.name,
            format: template.format
          }
        });
      }

      // Update scheduled report record
      await this.updateScheduledReportExecution(scheduledReport.id, true);

      console.log(`Scheduled report executed successfully: ${scheduledReport.name}`);
      return true;

    } catch (error) {
      console.error(`Failed to execute scheduled report ${scheduledReport.name}:`, error);
      
      // Update scheduled report record with error
      await this.updateScheduledReportExecution(
        scheduledReport.id, 
        false, 
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      return false;
    }
  }

  /**
   * Update scheduled report execution record
   */
  private async updateScheduledReportExecution(
    scheduleId: string, 
    success: boolean, 
    error?: string
  ): Promise<void> {
    try {
      const scheduledReport = await this.prisma.scheduledReport.findUnique({
        where: { id: scheduleId }
      });

      if (!scheduledReport) return;

      const scheduleConfig = this.validateScheduleConfig(scheduledReport.schedule);
      const nextExecution = this.calculateNextExecution(scheduleConfig);

      await this.prisma.scheduledReport.update({
        where: { id: scheduleId },
        data: {
          lastExecuted: new Date(),
          nextExecution: nextExecution,
          executionCount: { increment: 1 },
          lastStatus: success ? 'success' : 'failed',
          lastError: error || null
        }
      });

    } catch (updateError) {
      console.error('Failed to update scheduled report execution:', updateError);
    }
  }

  /**
   * Validate and parse schedule config from JSON
   */
  private validateScheduleConfig(schedule: any): ScheduleConfig {
    if (!schedule || typeof schedule !== 'object') {
      throw new Error('Invalid schedule configuration');
    }

    const config = schedule as ScheduleConfig;
    
    if (!config.frequency || !config.time || !config.timezone) {
      throw new Error('Missing required schedule configuration fields');
    }

    return {
      frequency: config.frequency,
      dayOfWeek: config.dayOfWeek,
      dayOfMonth: config.dayOfMonth,
      time: config.time,
      timezone: config.timezone
    };
  }

  /**
   * Calculate next execution time based on schedule
   */
  private calculateNextExecution(schedule: ScheduleConfig): Date {
    const now = new Date();
    const [hour, minute] = schedule.time.split(':').map(Number);

    let nextExecution = new Date(now);
    nextExecution.setHours(hour, minute, 0, 0);

    // If the time has already passed today, start from tomorrow
    if (nextExecution <= now) {
      nextExecution.setDate(nextExecution.getDate() + 1);
    }

    switch (schedule.frequency) {
      case 'daily':
        // Already set to next day if needed
        break;

      case 'weekly':
        if (schedule.dayOfWeek !== undefined) {
          // Set to next occurrence of the specified day
          const dayDiff = (schedule.dayOfWeek - nextExecution.getDay() + 7) % 7;
          if (dayDiff === 0 && nextExecution <= now) {
            nextExecution.setDate(nextExecution.getDate() + 7);
          } else {
            nextExecution.setDate(nextExecution.getDate() + dayDiff);
          }
        }
        break;

      case 'monthly':
        if (schedule.dayOfMonth !== undefined) {
          nextExecution.setDate(schedule.dayOfMonth);
          // If the day has passed this month, move to next month
          if (nextExecution <= now) {
            nextExecution.setMonth(nextExecution.getMonth() + 1);
            nextExecution.setDate(schedule.dayOfMonth);
          }
        }
        break;

      case 'quarterly':
        // Set to first day of next quarter
        const currentQuarter = Math.floor(nextExecution.getMonth() / 3);
        const nextQuarterMonth = (currentQuarter + 1) * 3;
        nextExecution.setMonth(nextQuarterMonth % 12);
        nextExecution.setDate(1);
        if (nextQuarterMonth >= 12) {
          nextExecution.setFullYear(nextExecution.getFullYear() + 1);
        }
        break;
    }

    return nextExecution;
  }

  /**
   * Get execution history for a scheduled report
   */
  async getExecutionHistory(scheduleId: string, userId: string, limit: number = 50): Promise<any[]> {
    const scheduledReport = await this.prisma.scheduledReport.findFirst({
      where: {
        id: scheduleId,
        userId: userId
      }
    });

    if (!scheduledReport) {
      throw new Error('Scheduled report not found');
    }

    // In a real implementation, you might have a separate execution log table
    // For now, we'll return basic execution information
    return [{
      id: scheduleId,
      executedAt: scheduledReport.lastExecuted,
      status: scheduledReport.lastStatus,
      error: scheduledReport.lastError
    }];
  }

  /**
   * Map database record to scheduled report interface
   */
  private mapScheduledReportFromDb(dbReport: any): ScheduledReport {
    return {
      id: dbReport.id,
      name: dbReport.name,
      description: dbReport.description,
      userId: dbReport.userId,
      projectId: dbReport.projectId,
      templateId: dbReport.templateId,
      schedule: dbReport.schedule as ScheduleConfig,
      recipients: Array.isArray(dbReport.recipients) ? dbReport.recipients : [],
      isActive: dbReport.isActive,
      createdAt: dbReport.createdAt,
      updatedAt: dbReport.updatedAt,
      lastExecuted: dbReport.lastExecuted,
      nextExecution: dbReport.nextExecution,
      executionCount: dbReport.executionCount || 0,
      lastStatus: dbReport.lastStatus,
      lastError: dbReport.lastError
    };
  }
} 