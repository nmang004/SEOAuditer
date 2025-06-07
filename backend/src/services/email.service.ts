import nodemailer from 'nodemailer';
import { createTransport, Transporter } from 'nodemailer';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';

// Email options interface
interface SendEmailOptions {
  to: string;
  subject?: string;
  template?: string;
  html?: string;
  context?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType: string;
  }>;
}

class EmailService {
  private transporter!: Transporter;
  private templates: Record<string, handlebars.TemplateDelegate> = {};
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Don't initialize during construction - use lazy initialization
  }

  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    this.initializationPromise = this.initializeAsync();
    return this.initializationPromise;
  }

  private async initializeAsync(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      // In test, skip SMTP setup and mark as initialized
      this.isInitialized = true;
      return;
    }
    
    try {
      // Create test account if in development
      if (process.env.NODE_ENV === 'development' && !config.email.host) {
        await this.setupTestAccount();
        return;
      }

      await this.initialize();
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      // Don't throw error during initialization - handle gracefully
      logger.warn('Email service will be disabled');
    }
  }

  private async setupTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      logger.info(`Ethereal test account created: ${testAccount.user}`);
      await this.initialize();
    } catch (error) {
      logger.error('Failed to create test email account:', error);
      throw new Error('Failed to initialize email service');
    }
  }

  private async initialize(): Promise<void> {
    if (this.transporter) {
      this.isInitialized = true;
      this.loadTemplates();
      return;
    }

    // Configure production transporter
    this.transporter = createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });

    // Verify connection configuration asynchronously
    return new Promise((resolve, reject) => {
      this.transporter.verify((error) => {
        if (error) {
          logger.error('Error verifying email transporter:', error);
          reject(new Error('Failed to initialize email service'));
        } else {
          logger.info('Email service is ready to send emails');
          this.isInitialized = true;
          this.loadTemplates();
          resolve();
        }
      });
    });
  }

  private loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, '../../templates/emails');
      
      if (!fs.existsSync(templatesDir)) {
        logger.warn('Email templates directory not found');
        return;
      }

      // Register partials
      const partialsDir = path.join(templatesDir, 'partials');
      if (fs.existsSync(partialsDir)) {
        const partials = fs.readdirSync(partialsDir);
        partials.forEach((partial) => {
          const partialName = path.basename(partial, '.hbs');
          const partialContent = fs.readFileSync(
            path.join(partialsDir, partial),
            'utf8'
          );
          handlebars.registerPartial(partialName, partialContent);
        });
      }

      // Register helpers
      handlebars.registerHelper('eq', (a, b) => a === b);
      handlebars.registerHelper('neq', (a, b) => a !== b);
      handlebars.registerHelper('formatDate', (date: Date) => {
        return new Date(date).toLocaleDateString();
      });

      // Compile templates
      const templateFiles = fs.readdirSync(templatesDir).filter(
        (file) => file.endsWith('.hbs') && !file.startsWith('_')
      );

      templateFiles.forEach((file) => {
        const templateName = path.basename(file, '.hbs');
        const templatePath = path.join(templatesDir, file);
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        this.templates[templateName] = handlebars.compile(templateContent);
      });

      logger.info(`Loaded ${templateFiles.length} email templates`);
    } catch (error) {
      logger.error('Error loading email templates:', error);
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    if (process.env.NODE_ENV === 'test') {
      // In test, do not send real emails
      return true;
    }
    
    try {
      // Ensure service is initialized before sending
      await this.ensureInitialized();
    } catch (error) {
      logger.warn('Email service initialization failed, continuing without email:', error);
      return false;
    }
    
    if (!this.isInitialized) {
      logger.warn('Email service is not available, skipping email send');
      return false;
    }

    try {
      const { to, subject, template, html, context = {}, attachments = [] } = options;

      let htmlContent: string;

      if (html) {
        // Use provided HTML directly
        htmlContent = html;
      } else if (template) {
        // Get template
        const templateFn = this.templates[template];
        if (!templateFn) {
          // If template not found, use a fallback HTML
          logger.warn(`Email template '${template}' not found, using fallback`);
          htmlContent = `<p>${context.message || 'Email content not available'}</p>`;
        } else {
          // Render template with context
          const templateContext = {
            ...context,
            appName: config.appName,
            appUrl: config.appUrl,
            currentYear: new Date().getFullYear(),
          };

          htmlContent = templateFn(templateContext);
        }
      } else {
        throw new Error('Either template or html must be provided');
      }

      // Create email options
      const mailOptions = {
        from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
        to,
        subject: subject || 'No Subject',
        html: htmlContent,
        text: htmlContent.replace(/<[^>]*>?/gm, ''), // Convert HTML to plain text
        attachments,
      };

      // Send email
      const info = await this.transporter.sendMail(mailOptions);

      if (process.env.NODE_ENV === 'development') {
        logger.info('Email sent:', nodemailer.getTestMessageUrl(info) || info.messageId);
      } else {
        logger.info(`Email sent to ${to} with subject "${mailOptions.subject}"`);
      }

      return true;
    } catch (error) {
      logger.error('Error sending email:', error);
      // Don't throw - return false to indicate failure
      return false;
    }
  }

  // Common email methods
  async sendVerificationEmail(to: string, name: string, token: string) {
    const verificationUrl = `${config.appUrl}/verify-email/${token}`;
    
    return this.sendEmail({
      to,
      template: 'verify-email',
      context: {
        name,
        verificationUrl,
      },
    });
  }

  async sendPasswordResetEmail(to: string, name: string, token: string) {
    const resetUrl = `${config.appUrl}/reset-password/${token}`;
    
    return this.sendEmail({
      to,
      template: 'reset-password',
      context: {
        name,
        resetUrl,
      },
    });
  }

  async sendPasswordChangedEmail(to: string, name: string) {
    return this.sendEmail({
      to,
      template: 'password-changed',
      context: { name },
    });
  }

  async sendWelcomeEmail(to: string, name: string) {
    return this.sendEmail({
      to,
      template: 'welcome',
      context: { name },
    });
  }
}

// Create and export a singleton instance
export const emailService = new EmailService();

// Export a simple sendEmail function for convenience
export const sendEmail = async (options: SendEmailOptions) => {
  return emailService.sendEmail(options);
};
