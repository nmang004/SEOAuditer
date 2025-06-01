import nodemailer from 'nodemailer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailAttachment {
  filename: string;
  path: string;
  contentType?: string;
}

export interface ReportEmailData {
  recipients: string[];
  subject: string;
  message: string;
  attachmentPath: string;
  attachmentName: string;
  template?: 'report' | 'scheduled-report' | 'bulk-export';
  templateData?: any;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private transporter!: nodemailer.Transporter;
  private prisma: PrismaClient;
  private isConfigured: boolean = false;

  constructor() {
    this.prisma = new PrismaClient();
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  private async initializeTransporter(): Promise<void> {
    try {
      const emailConfig = await this.getEmailConfig();
      
      if (emailConfig) {
        if (process.env.NODE_ENV === 'production') {
          this.transporter = nodemailer.createTransport(emailConfig);
        } else {
          // Use a test configuration for development
          this.transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
              user: process.env.ETHEREAL_USER || 'test@example.com',
              pass: process.env.ETHEREAL_PASS || 'password123'
            }
          });
        }
        this.isConfigured = true;

        // Verify connection
        await this.transporter.verify();
        console.log('Email service configured successfully');
      } else {
        console.warn('Email service not configured - reports will not be sent via email');
      }
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Get email configuration from environment or database
   */
  private async getEmailConfig(): Promise<EmailConfig | null> {
    // Try environment variables first
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      return {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      };
    }

    // Fall back to database configuration
    try {
      const config = await this.prisma.systemConfig.findFirst({
        where: { key: 'email_config' }
      });

      if (config && config.value) {
        return JSON.parse(config.value as string);
      }
    } catch (error) {
      console.error('Failed to load email config from database:', error);
    }

    return null;
  }

  /**
   * Send report via email
   */
  async sendReportEmail(data: ReportEmailData): Promise<boolean> {
    if (!this.isConfigured) {
      console.warn('Email service not configured - cannot send report');
      return false;
    }

    try {
      // Validate attachment exists
      await fs.access(data.attachmentPath);
      const stats = await fs.stat(data.attachmentPath);

      // Check file size (max 10MB)
      if (stats.size > 10 * 1024 * 1024) {
        throw new Error('Attachment too large (max 10MB)');
      }

      // Get email template
      const template = await this.getEmailTemplate(data.template || 'report', data.templateData);

      // Prepare email options
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: data.recipients.join(', '),
        subject: template.subject || data.subject,
        text: template.text || data.message,
        html: template.html || this.generateDefaultHtml(data.message),
        attachments: [
          {
            filename: data.attachmentName,
            path: data.attachmentPath,
            contentType: this.getContentType(data.attachmentName)
          }
        ]
      };

      // Send email
      const result = await this.transporter.sendMail(mailOptions);
      
      // Log email sent
      await this.logEmailSent(data.recipients, data.subject, result.messageId);

      console.log('Report email sent successfully:', result.messageId);
      return true;

    } catch (error) {
      console.error('Failed to send report email:', error);
      await this.logEmailError(data.recipients, data.subject, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Send bulk export notification
   */
  async sendBulkExportNotification(
    recipients: string[], 
    jobId: string, 
    downloadUrl: string, 
    fileSize: number,
    totalRecords: number
  ): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      const template = await this.getEmailTemplate('bulk-export', {
        jobId,
        downloadUrl,
        fileSize: this.formatFileSize(fileSize),
        totalRecords,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: recipients.join(', '),
        subject: template.subject,
        text: template.text,
        html: template.html
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      await this.logEmailSent(recipients, template.subject, result.messageId);
      return true;

    } catch (error) {
      console.error('Failed to send bulk export notification:', error);
      return false;
    }
  }

  /**
   * Get email template
   */
  private async getEmailTemplate(templateType: string, data?: any): Promise<EmailTemplate> {
    try {
      const template = await this.prisma.emailTemplate.findFirst({
        where: { 
          type: templateType,
          isActive: true 
        }
      });

      if (template) {
        return {
          subject: this.processTemplate(template.subject, data),
          html: this.processTemplate(template.html, data),
          text: this.processTemplate(template.text, data)
        };
      }
    } catch (error) {
      console.error('Failed to load email template:', error);
    }

    // Fall back to default templates
    return this.getDefaultTemplate(templateType, data);
  }

  /**
   * Get default email template
   */
  private getDefaultTemplate(templateType: string, data?: any): EmailTemplate {
    switch (templateType) {
      case 'report':
        return {
          subject: 'SEO Analysis Report',
          html: this.generateDefaultReportHtml(data),
          text: 'Please find your SEO analysis report attached.'
        };
      
      case 'scheduled-report':
        return {
          subject: 'Scheduled SEO Report - {{projectName}}',
          html: this.generateScheduledReportHtml(data),
          text: 'Your scheduled SEO analysis report is attached.'
        };
      
      case 'bulk-export':
        return {
          subject: 'Bulk Export Complete - {{totalRecords}} records',
          html: this.generateBulkExportHtml(data),
          text: `Your bulk export is complete. Download: {{downloadUrl}}`
        };
      
      default:
        return {
          subject: 'SEO Analysis Report',
          html: '<p>Please find your report attached.</p>',
          text: 'Please find your report attached.'
        };
    }
  }

  /**
   * Generate default report HTML
   */
  private generateDefaultReportHtml(data?: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>SEO Analysis Report</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background: #f3f4f6; padding: 10px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SEO Analysis Report</h1>
        </div>
        <div class="content">
          <p>Your SEO analysis report has been generated and is attached to this email.</p>
          <p>The report contains comprehensive insights about your website's SEO performance, including:</p>
          <ul>
            <li>Overall SEO score and category breakdowns</li>
            <li>Identified issues and their priority levels</li>
            <li>Actionable recommendations for improvement</li>
            <li>Performance trends and historical data</li>
          </ul>
          <p>If you have any questions about the report, please don't hesitate to contact our support team.</p>
        </div>
        <div class="footer">
          <p>This report was generated automatically by the SEO Analysis System.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate scheduled report HTML
   */
  private generateScheduledReportHtml(data?: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Scheduled SEO Report</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .stats { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { background: #f3f4f6; padding: 10px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Scheduled SEO Report</h1>
          <p>Project: ${data?.projectName || 'Unknown'}</p>
        </div>
        <div class="content">
          <p>Your scheduled SEO analysis report is ready!</p>
          <div class="stats">
            <h3>Report Summary:</h3>
            <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Period:</strong> ${data?.period || 'Latest analysis'}</p>
            <p><strong>Format:</strong> ${data?.format || 'PDF'}</p>
          </div>
          <p>This automated report provides the latest insights into your website's SEO performance.</p>
        </div>
        <div class="footer">
          <p>To modify or cancel scheduled reports, please visit your dashboard.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate bulk export HTML
   */
  private generateBulkExportHtml(data?: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bulk Export Complete</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .download-box { background: #fef2f2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .button { background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
          .footer { background: #f3f4f6; padding: 10px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Bulk Export Complete</h1>
        </div>
        <div class="content">
          <p>Your bulk export has been completed successfully!</p>
          <div class="download-box">
            <h3>Export Details</h3>
            <p><strong>Records Exported:</strong> ${data?.totalRecords || 0}</p>
            <p><strong>File Size:</strong> ${data?.fileSize || 'Unknown'}</p>
            <p><strong>Expires:</strong> ${data?.expiresAt || '7 days'}</p>
            <br>
            <a href="${data?.downloadUrl || '#'}" class="button">Download Export</a>
          </div>
          <p><strong>Note:</strong> This download link will expire in 7 days for security purposes.</p>
        </div>
        <div class="footer">
          <p>Export Job ID: ${data?.jobId || 'N/A'}</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate default HTML from text
   */
  private generateDefaultHtml(text: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        </style>
      </head>
      <body>
        <p>${text.replace(/\n/g, '<br>')}</p>
      </body>
      </html>
    `;
  }

  /**
   * Process template with variables
   */
  private processTemplate(template: string, data?: any): string {
    if (!data || !template) return template;

    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  /**
   * Get content type for attachment
   */
  private getContentType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
      case '.pdf': return 'application/pdf';
      case '.xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case '.csv': return 'text/csv';
      case '.json': return 'application/json';
      default: return 'application/octet-stream';
    }
  }

  /**
   * Format file size
   */
  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Log email sent
   */
  private async logEmailSent(recipients: string[], subject: string, messageId: string): Promise<void> {
    try {
      await this.prisma.emailLog.create({
        data: {
          recipients: recipients.join(', '),
          subject,
          messageId,
          status: 'sent',
          sentAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log email sent:', error);
    }
  }

  /**
   * Log email error
   */
  private async logEmailError(recipients: string[], subject: string, error: string): Promise<void> {
    try {
      await this.prisma.emailLog.create({
        data: {
          recipients: recipients.join(', '),
          subject,
          status: 'failed',
          error,
          sentAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log email error:', error);
    }
  }
} 