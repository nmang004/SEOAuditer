import sgMail from '@sendgrid/mail';
import { EmailProvider, EmailData } from '../EmailService';
import { logger } from '../../../utils/logger';

export class SendGridProvider implements EmailProvider {
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      const apiKey = process.env.SENDGRID_API_KEY;
      
      if (!apiKey) {
        logger.warn('SendGrid API key not found in environment variables');
        return;
      }

      if (apiKey.length < 20) {
        logger.warn('SendGrid API key appears to be invalid (too short)');
        return;
      }

      sgMail.setApiKey(apiKey);
      this.isConfigured = true;
      logger.info('SendGrid provider configured successfully');
    } catch (error) {
      logger.error('Failed to initialize SendGrid provider:', error);
      this.isConfigured = false;
    }
  }

  async send(email: EmailData): Promise<boolean> {
    logger.info('SendGrid send method called', { 
      to: email.to, 
      subject: email.subject,
      configured: this.isConfigured,
      apiKeyLength: process.env.SENDGRID_API_KEY?.length || 0,
      apiKeyPrefix: process.env.SENDGRID_API_KEY?.substring(0, 10) || 'not-set'
    });

    if (!this.isConfigured) {
      logger.error('SendGrid provider not configured - check initialization');
      return false;
    }

    try {
      const fromEmail = process.env.EMAIL_FROM_ADDRESS || 'noreply@yourdomain.com';
      const fromName = process.env.EMAIL_FROM_NAME || 'SEO Director';
      
      logger.info('SendGrid send details', { 
        fromEmail, 
        fromName, 
        to: email.to,
        environment: process.env.NODE_ENV
      });

      const msg: any = {
        to: email.to,
        from: {
          email: fromEmail,
          name: fromName
        },
        subject: email.subject,
        html: email.html,
        text: email.text || this.htmlToText(email.html),
        // Add tracking settings
        trackingSettings: {
          clickTracking: {
            enable: true,
            enableText: false
          },
          openTracking: {
            enable: true
          }
        },
        // Add custom headers for better deliverability
        headers: {
          'X-Entity-Ref-ID': this.generateMessageId()
        }
      };

      // Add attachments if provided
      if (email.attachments && email.attachments.length > 0) {
        msg.attachments = email.attachments.map(attachment => ({
          filename: attachment.filename,
          content: attachment.content,
          type: attachment.contentType,
          disposition: 'attachment'
        }));
      }

      logger.info('About to call SendGrid API', {
        to: email.to,
        subject: email.subject,
        from: `${fromName} <${fromEmail}>`,
        msgStructure: Object.keys(msg)
      });

      const response = await sgMail.send(msg);
      
      logger.info('SendGrid API call completed', { 
        statusCode: response[0]?.statusCode,
        messageId: response[0]?.headers?.['x-message-id'],
        responseHeaders: response[0]?.headers,
        responseBody: response[0]?.body
      });
      
      if (response && response[0] && response[0].statusCode >= 200 && response[0].statusCode < 300) {
        logger.info(`Email sent successfully via SendGrid to ${email.to}`, {
          messageId: response[0].headers['x-message-id'],
          statusCode: response[0].statusCode
        });
        return true;
      } else {
        logger.error('SendGrid returned non-success status:', {
          statusCode: response[0]?.statusCode,
          headers: response[0]?.headers,
          body: response[0]?.body,
          fullResponse: JSON.stringify(response)
        });
        return false;
      }
    } catch (error: any) {
      logger.error('SendGrid send error:', {
        error: error.message,
        code: error.code,
        response: error.response?.body,
        stack: error.stack,
        fullError: JSON.stringify(error, null, 2)
      });

      // Handle specific SendGrid errors
      if (error.code === 401) {
        logger.error('SendGrid authentication failed - check API key', {
          apiKeyLength: process.env.SENDGRID_API_KEY?.length,
          apiKeyPrefix: process.env.SENDGRID_API_KEY?.substring(0, 10)
        });
      } else if (error.code === 403) {
        logger.error('SendGrid forbidden - check sender verification for:', {
          fromEmail: process.env.EMAIL_FROM_ADDRESS
        });
      } else if (error.code === 413) {
        logger.error('SendGrid payload too large');
      } else if (error.response?.body?.errors) {
        logger.error('SendGrid API errors:', error.response.body.errors);
      }

      return false;
    }
  }

  validateConfig(): boolean {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.EMAIL_FROM_ADDRESS;

    if (!apiKey) {
      logger.warn('SendGrid validation failed: SENDGRID_API_KEY not set');
      return false;
    }

    if (!fromEmail) {
      logger.warn('SendGrid validation failed: EMAIL_FROM_ADDRESS not set');
      return false;
    }

    if (!this.isValidEmail(fromEmail)) {
      logger.warn('SendGrid validation failed: EMAIL_FROM_ADDRESS is not a valid email');
      return false;
    }

    if (apiKey.length < 20) {
      logger.warn('SendGrid validation failed: API key appears invalid');
      return false;
    }

    return this.isConfigured;
  }

  getProviderName(): string {
    return 'SendGrid';
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Generate unique message ID for tracking
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate email address format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Test SendGrid connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured) {
      return { success: false, error: 'Provider not configured' };
    }

    try {
      // SendGrid doesn't have a direct test endpoint, but we can validate the API key
      const testEmail = process.env.EMAIL_FROM_ADDRESS || 'test@example.com';
      
      // This will validate the API key without actually sending an email
      const msg = {
        to: testEmail,
        from: testEmail,
        subject: 'Test Connection',
        html: '<p>Test</p>',
        sendAt: Math.floor(Date.now() / 1000) + 3600, // Schedule 1 hour in future
        mailSettings: {
          sandboxMode: {
            enable: true // This prevents actual sending
          }
        }
      };

      await sgMail.send(msg);
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Connection test failed' 
      };
    }
  }
}