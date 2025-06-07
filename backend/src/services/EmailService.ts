export class EmailService {
  async sendEmail(request: any): Promise<any> {
    return {
      success: false,
      error: 'Email service temporarily disabled',
      message: 'This feature is under development'
    };
  }

  async getEmailTemplates(): Promise<any> {
    return {
      success: false,
      error: 'Email service temporarily disabled',
      templates: []
    };
  }

  async sendBulkEmail(request: any): Promise<any> {
    return {
      success: false,
      error: 'Email service temporarily disabled'
    };
  }
}