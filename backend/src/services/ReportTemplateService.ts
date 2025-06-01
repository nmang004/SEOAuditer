import { PrismaClient } from '@prisma/client';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  userId: string;
  sections: string[];
  format: 'pdf' | 'excel' | 'csv' | 'json';
  settings: {
    pageSize?: 'A4' | 'letter';
    orientation?: 'portrait' | 'landscape';
    margins?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    includeCharts?: boolean;
    chartTypes?: string[];
    includeTrends?: boolean;
    includeImages?: boolean;
  };
  branding: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    companyName?: string;
    footer?: string;
    whiteLabelMode?: boolean;
  };
  isPublic: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
  usageCount: number;
}

export interface CreateTemplateData {
  name: string;
  description: string;
  userId: string;
  sections: string[];
  format: 'pdf' | 'excel' | 'csv' | 'json';
  settings: any;
  branding: any;
  isPublic: boolean;
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
  sections?: string[];
  format?: 'pdf' | 'excel' | 'csv' | 'json';
  settings?: any;
  branding?: any;
  isPublic?: boolean;
}

export class ReportTemplateService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get all templates for a user
   */
  async getTemplates(userId: string, includeDefault: boolean = true): Promise<ReportTemplate[]> {
    const whereClause: any = {
      OR: [
        { userId: userId },
        ...(includeDefault ? [{ isDefault: true }, { isPublic: true }] : [])
      ]
    };

    const templates = await this.prisma.reportTemplate.findMany({
      where: whereClause,
      orderBy: [
        { isDefault: 'desc' },
        { lastUsed: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return templates.map(this.mapTemplateFromDb);
  }

  /**
   * Get a specific template
   */
  async getTemplate(templateId: string, userId: string): Promise<ReportTemplate | null> {
    const template = await this.prisma.reportTemplate.findFirst({
      where: {
        id: templateId,
        OR: [
          { userId: userId },
          { isDefault: true },
          { isPublic: true }
        ]
      }
    });

    return template ? this.mapTemplateFromDb(template) : null;
  }

  /**
   * Create a new template
   */
  async createTemplate(data: CreateTemplateData): Promise<ReportTemplate> {
    // Check if name already exists for this user
    const existingTemplate = await this.prisma.reportTemplate.findFirst({
      where: {
        name: data.name,
        userId: data.userId
      }
    });

    if (existingTemplate) {
      throw new Error('Template with this name already exists');
    }

    const template = await this.prisma.reportTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        userId: data.userId,
        sections: data.sections,
        format: data.format,
        settings: data.settings,
        branding: data.branding,
        isPublic: data.isPublic,
        isDefault: false,
        usageCount: 0
      }
    });

    return this.mapTemplateFromDb(template);
  }

  /**
   * Update an existing template
   */
  async updateTemplate(templateId: string, userId: string, data: UpdateTemplateData): Promise<ReportTemplate> {
    // Check if template exists and user has permission
    const existingTemplate = await this.prisma.reportTemplate.findFirst({
      where: {
        id: templateId,
        userId: userId // Only user can update their own templates
      }
    });

    if (!existingTemplate) {
      throw new Error('Template not found or access denied');
    }

    // Check if new name conflicts (if name is being changed)
    if (data.name && data.name !== existingTemplate.name) {
      const nameConflict = await this.prisma.reportTemplate.findFirst({
        where: {
          name: data.name,
          userId: userId,
          id: { not: templateId }
        }
      });

      if (nameConflict) {
        throw new Error('Template with this name already exists');
      }
    }

    const updatedTemplate = await this.prisma.reportTemplate.update({
      where: { id: templateId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    return this.mapTemplateFromDb(updatedTemplate);
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string, userId: string): Promise<void> {
    const template = await this.prisma.reportTemplate.findFirst({
      where: {
        id: templateId,
        userId: userId // Only user can delete their own templates
      }
    });

    if (!template) {
      throw new Error('Template not found or access denied');
    }

    if (template.isDefault) {
      throw new Error('Cannot delete default templates');
    }

    await this.prisma.reportTemplate.delete({
      where: { id: templateId }
    });
  }

  /**
   * Duplicate a template
   */
  async duplicateTemplate(templateId: string, userId: string, newName?: string): Promise<ReportTemplate> {
    const sourceTemplate = await this.getTemplate(templateId, userId);
    
    if (!sourceTemplate) {
      throw new Error('Template not found');
    }

    const name = newName || `${sourceTemplate.name} (Copy)`;

    const duplicatedTemplate = await this.createTemplate({
      name,
      description: sourceTemplate.description,
      userId: userId,
      sections: sourceTemplate.sections,
      format: sourceTemplate.format,
      settings: sourceTemplate.settings,
      branding: sourceTemplate.branding,
      isPublic: false
    });

    return duplicatedTemplate;
  }

  /**
   * Update template usage statistics
   */
  async recordTemplateUsage(templateId: string): Promise<void> {
    await this.prisma.reportTemplate.update({
      where: { id: templateId },
      data: {
        usageCount: { increment: 1 },
        lastUsed: new Date()
      }
    });
  }

  /**
   * Get default templates
   */
  async getDefaultTemplates(): Promise<ReportTemplate[]> {
    const templates = await this.prisma.reportTemplate.findMany({
      where: { isDefault: true },
      orderBy: { name: 'asc' }
    });

    return templates.map(this.mapTemplateFromDb);
  }

  /**
   * Initialize default templates
   */
  async initializeDefaultTemplates(): Promise<void> {
    const defaultTemplates = [
      {
        name: 'Executive Summary',
        description: 'High-level overview perfect for executives and stakeholders',
        sections: ['overview', 'key-metrics', 'priority-issues', 'recommendations'],
        format: 'pdf' as const,
        settings: {
          pageSize: 'A4',
          orientation: 'portrait',
          includeCharts: true,
          chartTypes: ['score-overview', 'trends'],
          includeTrends: true,
          includeImages: false
        },
        branding: {
          primaryColor: '#3b82f6',
          secondaryColor: '#64748b'
        }
      },
      {
        name: 'Technical Analysis',
        description: 'Detailed technical report for developers and SEO specialists',
        sections: ['overview', 'technical-issues', 'performance-metrics', 'crawl-analysis', 'detailed-recommendations'],
        format: 'pdf' as const,
        settings: {
          pageSize: 'A4',
          orientation: 'portrait',
          includeCharts: true,
          chartTypes: ['all'],
          includeTrends: true,
          includeImages: true
        },
        branding: {
          primaryColor: '#059669',
          secondaryColor: '#64748b'
        }
      },
      {
        name: 'Content Analysis',
        description: 'Focus on content optimization and quality metrics',
        sections: ['content-overview', 'content-issues', 'keyword-analysis', 'content-recommendations'],
        format: 'pdf' as const,
        settings: {
          pageSize: 'A4',
          orientation: 'portrait',
          includeCharts: true,
          chartTypes: ['content-metrics', 'keyword-distribution'],
          includeTrends: false,
          includeImages: false
        },
        branding: {
          primaryColor: '#dc2626',
          secondaryColor: '#64748b'
        }
      },
      {
        name: 'Complete Data Export',
        description: 'Full data export for external analysis and archival',
        sections: ['all'],
        format: 'excel' as const,
        settings: {
          includeCharts: false,
          includeTrends: true,
          includeImages: false
        },
        branding: {}
      }
    ];

    for (const template of defaultTemplates) {
      const exists = await this.prisma.reportTemplate.findFirst({
        where: {
          name: template.name,
          isDefault: true
        }
      });

      if (!exists) {
        await this.prisma.reportTemplate.create({
          data: {
            ...template,
            userId: 'system',
            isPublic: true,
            isDefault: true,
            usageCount: 0
          }
        });
      }
    }
  }

  /**
   * Map database record to template interface
   */
  private mapTemplateFromDb(dbTemplate: any): ReportTemplate {
    return {
      id: dbTemplate.id,
      name: dbTemplate.name,
      description: dbTemplate.description,
      userId: dbTemplate.userId,
      sections: Array.isArray(dbTemplate.sections) ? dbTemplate.sections : [],
      format: dbTemplate.format,
      settings: dbTemplate.settings || {},
      branding: dbTemplate.branding || {},
      isPublic: dbTemplate.isPublic,
      isDefault: dbTemplate.isDefault,
      createdAt: dbTemplate.createdAt,
      updatedAt: dbTemplate.updatedAt,
      lastUsed: dbTemplate.lastUsed,
      usageCount: dbTemplate.usageCount || 0
    };
  }
} 