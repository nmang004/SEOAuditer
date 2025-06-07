import { logger } from '../../utils/logger';
import { config } from '../../config/config';

// Core email interfaces
export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType: string;
  }>;
}

export interface EmailProvider {
  send(email: EmailData): Promise<boolean>;
  validateConfig(): boolean;
  getProviderName(): string;
}

export interface EmailTemplate {
  render(data: Record<string, any>): {
    subject: string;
    html: string;
    text: string;
  };
}

export interface EmailServiceStats {
  sent: number;
  failed: number;
  lastSent?: Date;
  lastError?: string;
}

/**
 * Enhanced Email Service with multiple provider support
 * Supports SendGrid, Mock, and future providers
 */
export class EmailService {
  private provider: EmailProvider;
  private stats: EmailServiceStats = { sent: 0, failed: 0 };
  private isInitialized = false;

  constructor() {
    this.provider = this.createProvider();
    this.initialize();
  }

  private createProvider(): EmailProvider {
    const providerType = process.env.EMAIL_PROVIDER || 'sendgrid';
    
    switch (providerType.toLowerCase()) {
      case 'sendgrid':
        return this.createSendGridProvider();
      case 'mock':
        return this.createMockProvider();
      default:
        logger.warn(`Unknown email provider: ${providerType}, falling back to mock`);
        return this.createMockProvider();
    }
  }

  private createSendGridProvider(): EmailProvider {
    try {
      const { SendGridProvider } = require('./providers/SendGridProvider');
      return new SendGridProvider();
    } catch (error) {
      logger.error('Failed to create SendGrid provider:', error);
      logger.warn('Falling back to mock email provider');
      return this.createMockProvider();
    }
  }

  private createMockProvider(): EmailProvider {
    const { MockProvider } = require('./providers/MockProvider');
    return new MockProvider();
  }

  private async initialize(): Promise<void> {
    try {
      const isValid = this.provider.validateConfig();
      if (!isValid) {
        logger.warn(`Email provider ${this.provider.getProviderName()} configuration is invalid`);
        // Don't fail initialization, just warn
      }
      
      this.isInitialized = true;
      logger.info(`Email service initialized with ${this.provider.getProviderName()} provider`);
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Send email using the configured provider
   */
  async sendEmail(emailData: EmailData): Promise<boolean> {
    logger.info('sendEmail called', { 
      to: emailData.to, 
      subject: emailData.subject,
      initialized: this.isInitialized,
      providerName: this.provider.getProviderName()
    });

    if (!this.isInitialized) {
      logger.error('Email service not initialized, skipping email send');
      this.stats.failed++;
      return false;
    }

    try {
      logger.info(`Attempting to send email via ${this.provider.getProviderName()} to ${emailData.to}`);
      
      const result = await this.provider.send(emailData);
      
      logger.info('Provider send result', { result, to: emailData.to });
      
      if (result) {
        this.stats.sent++;
        this.stats.lastSent = new Date();
        logger.info(`Email sent successfully to ${emailData.to} via ${this.provider.getProviderName()}`);
      } else {
        this.stats.failed++;
        this.stats.lastError = 'Email send returned false';
        logger.error(`Failed to send email to ${emailData.to} - provider returned false`);
      }
      
      return result;
    } catch (error: any) {
      this.stats.failed++;
      this.stats.lastError = error.message;
      logger.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send welcome/verification email
   */
  async sendWelcomeEmail(to: string, name: string, verificationToken: string): Promise<boolean> {
    try {
      logger.info('sendWelcomeEmail called', { to, name, verificationToken: verificationToken.substring(0, 8) + '...' });
      
      const { WelcomeTemplate } = require('./templates/WelcomeTemplate');
      const template = new WelcomeTemplate();
      
      const verificationUrl = `${config.appUrl}/verify-email/${verificationToken}`;
      logger.info('Generated verification URL', { verificationUrl });
      
      const emailContent = template.render({
        name,
        verificationUrl,
        appName: config.appName,
        appUrl: config.appUrl
      });

      logger.info('Email template rendered successfully', { 
        subject: emailContent.subject,
        htmlLength: emailContent.html.length,
        textLength: emailContent.text.length
      });

      const result = await this.sendEmail({
        to,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      });

      logger.info('sendWelcomeEmail result', { result, to });
      return result;
    } catch (error) {
      logger.error('Error sending welcome email:', error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, name: string, resetToken: string): Promise<boolean> {
    try {
      const { PasswordResetTemplate } = require('./templates/PasswordResetTemplate');
      const template = new PasswordResetTemplate();
      
      const emailContent = template.render({
        name,
        resetUrl: `${config.appUrl}/reset-password/${resetToken}`,
        appName: config.appName,
        appUrl: config.appUrl
      });

      return this.sendEmail({
        to,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      });
    } catch (error) {
      logger.error('Error sending password reset email:', error);
      return false;
    }
  }

  /**
   * Send password changed notification
   */
  async sendPasswordChangedEmail(to: string, name: string): Promise<boolean> {
    try {
      const { PasswordChangedTemplate } = require('./templates/PasswordChangedTemplate');
      const template = new PasswordChangedTemplate();
      
      const emailContent = template.render({
        name,
        appName: config.appName,
        appUrl: config.appUrl,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@yourdomain.com'
      });

      return this.sendEmail({
        to,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      });
    } catch (error) {
      logger.error('Error sending password changed email:', error);
      return false;
    }
  }

  /**
   * Send email change verification
   */
  async sendEmailChangeVerification(to: string, name: string, verificationToken: string): Promise<boolean> {
    try {
      const { EmailChangeTemplate } = require('./templates/EmailChangeTemplate');
      const template = new EmailChangeTemplate();
      
      const emailContent = template.render({
        name,
        verificationUrl: `${config.appUrl}/verify-email-change/${verificationToken}`,
        appName: config.appName,
        appUrl: config.appUrl
      });

      return this.sendEmail({
        to,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      });
    } catch (error) {
      logger.error('Error sending email change verification:', error);
      return false;
    }
  }

  /**
   * Get email service statistics
   */
  getStats(): EmailServiceStats {
    return { ...this.stats };
  }

  /**
   * Get provider information
   */
  getProviderInfo(): { name: string; isValid: boolean } {
    return {
      name: this.provider.getProviderName(),
      isValid: this.provider.validateConfig()
    };
  }

  /**
   * Health check for email service
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const providerInfo = this.getProviderInfo();
      const stats = this.getStats();
      
      const isHealthy = this.isInitialized && providerInfo.isValid;
      
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: {
          initialized: this.isInitialized,
          provider: providerInfo,
          stats,
          environment: process.env.NODE_ENV
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}

// Create and export singleton instance
export const emailService = new EmailService();

// Backward compatibility export
export const sendEmail = async (options: {
  to: string;
  subject?: string;
  html?: string;
  template?: string;
  context?: Record<string, any>;
}): Promise<boolean> => {
  if (!options.html && !options.template) {
    logger.error('Email must have either html content or template');
    return false;
  }

  return emailService.sendEmail({
    to: options.to,
    subject: options.subject || 'No Subject',
    html: options.html || '<p>No content</p>',
    text: options.html?.replace(/<[^>]*>?/gm, '') || 'No content'
  });
};