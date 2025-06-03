import { EmailProvider, EmailData } from '../EmailService';
import { logger } from '../../../utils/logger';

export class MockProvider implements EmailProvider {
  private emailLog: Array<EmailData & { timestamp: Date }> = [];

  async send(email: EmailData): Promise<boolean> {
    try {
      // Log the email instead of sending it
      this.emailLog.push({
        ...email,
        timestamp: new Date()
      });

      // Simulate realistic email sending behavior
      const sendDelay = Math.random() * 100 + 50; // 50-150ms delay
      await new Promise(resolve => setTimeout(resolve, sendDelay));

      // Log in a formatted way for easy debugging
      logger.info('📧 MOCK EMAIL SENT:', {
        to: email.to,
        subject: email.subject,
        htmlLength: email.html.length,
        textLength: email.text?.length || 0,
        hasAttachments: !!(email.attachments && email.attachments.length > 0)
      });

      // In development, show the HTML content for easy debugging
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Email HTML Content Preview:', {
          to: email.to,
          subject: email.subject,
          htmlPreview: email.html.substring(0, 200) + (email.html.length > 200 ? '...' : ''),
          fullHtml: email.html // Full HTML for debugging
        });
      }

      // Simulate occasional failures in development for testing
      if (process.env.NODE_ENV === 'development' && Math.random() < 0.05) {
        logger.warn('Mock email provider simulated failure (5% chance)');
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Mock email provider error:', error);
      return false;
    }
  }

  validateConfig(): boolean {
    // Mock provider is always valid
    return true;
  }

  getProviderName(): string {
    return 'Mock (Development)';
  }

  /**
   * Get all sent emails (useful for testing)
   */
  getSentEmails(): Array<EmailData & { timestamp: Date }> {
    return [...this.emailLog];
  }

  /**
   * Get the last sent email
   */
  getLastSentEmail(): (EmailData & { timestamp: Date }) | null {
    return this.emailLog.length > 0 ? this.emailLog[this.emailLog.length - 1] : null;
  }

  /**
   * Clear the email log
   */
  clearEmailLog(): void {
    this.emailLog = [];
    logger.info('Mock email log cleared');
  }

  /**
   * Get emails sent to a specific recipient
   */
  getEmailsTo(recipient: string): Array<EmailData & { timestamp: Date }> {
    return this.emailLog.filter(email => email.to === recipient);
  }

  /**
   * Search emails by subject
   */
  getEmailsBySubject(subject: string): Array<EmailData & { timestamp: Date }> {
    return this.emailLog.filter(email => 
      email.subject.toLowerCase().includes(subject.toLowerCase())
    );
  }

  /**
   * Get email statistics
   */
  getStats(): {
    totalSent: number;
    lastSent?: Date;
    recipientCount: number;
    subjectBreakdown: Record<string, number>;
  } {
    const recipients = new Set(this.emailLog.map(email => email.to));
    const subjectBreakdown: Record<string, number> = {};
    
    this.emailLog.forEach(email => {
      subjectBreakdown[email.subject] = (subjectBreakdown[email.subject] || 0) + 1;
    });

    return {
      totalSent: this.emailLog.length,
      lastSent: this.emailLog.length > 0 ? this.emailLog[this.emailLog.length - 1].timestamp : undefined,
      recipientCount: recipients.size,
      subjectBreakdown
    };
  }

  /**
   * Generate a mock preview URL (like Ethereal email)
   */
  generatePreviewUrl(email: EmailData): string {
    const encodedSubject = encodeURIComponent(email.subject);
    const timestamp = Date.now();
    return `http://localhost:4000/api/email-preview/${timestamp}?subject=${encodedSubject}&to=${encodeURIComponent(email.to)}`;
  }
}