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
  template: string;
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

  constructor() {
    // Create test account if in development
    if (process.env.NODE_ENV === 'development' && !config.email.host) {
      this.setupTestAccount();
      return;
    }

    this.initialize();
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
      this.initialize();
    } catch (error) {
      logger.error('Failed to create test email account:', error);
      throw new Error('Failed to initialize email service');
    }
  }

  private initialize() {
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

    // Verify connection configuration
    this.transporter.verify((error) => {
      if (error) {
        logger.error('Error verifying email transporter:', error);
        throw new Error('Failed to initialize email service');
      }
      logger.info('Email service is ready to send emails');
      this.isInitialized = true;
      this.loadTemplates();
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
    if (!this.isInitialized) {
      throw new Error('Email service not initialized');
    }

    try {
      const { to, subject, template, context = {}, attachments = [] } = options;

      // Get template
      const templateFn = this.templates[template];
      if (!templateFn) {
        throw new Error(`Email template '${template}' not found`);
      }

      // Render template with context
      const templateContext = {
        ...context,
        appName: config.appName,
        appUrl: config.appUrl,
        currentYear: new Date().getFullYear(),
      };

      const html = templateFn(templateContext);

      // Create email options
      const mailOptions = {
        from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
        to,
        subject: subject || 'No Subject',
        html,
        text: html.replace(/<[^>]*>?/gm, ''), // Convert HTML to plain text
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
      throw new Error('Failed to send email');
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
