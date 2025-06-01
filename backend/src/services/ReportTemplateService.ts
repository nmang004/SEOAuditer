export class ReportTemplateService {
  async getTemplates(): Promise<any> {
    return {
      success: false,
      error: 'Report template service temporarily disabled',
      templates: []
    };
  }

  async getTemplate(templateId: string): Promise<any> {
    return {
      success: false,
      error: 'Report template service temporarily disabled'
    };
  }

  async createTemplate(template: any): Promise<any> {
    return {
      success: false,
      error: 'Report template service temporarily disabled'
    };
  }

  async updateTemplate(templateId: string, updates: any): Promise<any> {
    return {
      success: false,
      error: 'Report template service temporarily disabled'
    };
  }

  async deleteTemplate(templateId: string): Promise<any> {
    return {
      success: false,
      error: 'Report template service temporarily disabled'
    };
  }
}