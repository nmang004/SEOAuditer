/**
 * SendGrid Template Manager
 * 
 * Handles template discovery, validation, and mapping for different email types.
 * Provides automatic fallback mechanisms and template health checking.
 */

import { logger } from '../utils/logger';
import { config } from '../config/config';

interface TemplateInfo {
  id: string;
  name: string;
  type: string;
  active: boolean;
  created: string;
  updated: string;
}

interface TemplateMapping {
  verification: string | null;
  welcome: string | null;
  reset: string | null;
  resend?: string | null;
}

export class TemplateManager {
  private templateCache: TemplateInfo[] = [];
  private mappingCache: TemplateMapping | null = null;
  private lastFetch: number = 0;
  private cacheTimeout: number = 300000; // 5 minutes

  constructor() {
    // Initialize with environment variables if available
    this.initializeFromEnvironment();
  }

  /**
   * Initialize template mapping from environment variables
   */
  private initializeFromEnvironment(): void {
    this.mappingCache = {
      verification: this.getValidTemplateId(
        process.env.SENDGRID_VERIFICATION_TEMPLATE_ID || 
        process.env.SENDGRID_EMAIL_VERIFICATION_TEMPLATE_ID ||
        config.sendgrid?.templates?.emailVerification
      ),
      welcome: this.getValidTemplateId(process.env.SENDGRID_WELCOME_TEMPLATE_ID),
      reset: this.getValidTemplateId(process.env.SENDGRID_RESET_TEMPLATE_ID),
      resend: this.getValidTemplateId(process.env.SENDGRID_RESEND_TEMPLATE_ID)
    };

    logger.info('Template manager initialized', {
      verification: !!this.mappingCache.verification,
      welcome: !!this.mappingCache.welcome,
      reset: !!this.mappingCache.reset,
      fromEnvironment: true
    });
  }

  /**
   * Validate that a template ID is a proper GUID format
   */
  private getValidTemplateId(templateId: string | undefined): string | null {
    if (!templateId) return null;
    
    // SendGrid template IDs should be in format: d-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const guidPattern = /^d-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (guidPattern.test(templateId)) {
      return templateId;
    }
    
    logger.warn('Invalid template ID format detected', {
      templateId,
      expectedFormat: 'd-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
    });
    
    return null;
  }

  /**
   * Get template ID for a specific email type
   */
  async getTemplateId(type: 'verification' | 'welcome' | 'reset' | 'resend'): Promise<string | null> {
    // Check cache first
    if (this.mappingCache && this.mappingCache[type]) {
      return this.mappingCache[type];
    }

    // Try to discover templates from SendGrid
    try {
      await this.discoverTemplates();
      return this.mappingCache?.[type] || null;
    } catch (error) {
      logger.error('Failed to discover templates for type', { type, error });
      return null;
    }
  }

  /**
   * Discover all available templates from SendGrid
   */
  async discoverTemplates(): Promise<TemplateInfo[]> {
    const now = Date.now();
    
    // Use cache if recent
    if (this.templateCache.length > 0 && (now - this.lastFetch) < this.cacheTimeout) {
      return this.templateCache;
    }

    const apiKey = config.sendgrid?.apiKey;
    if (!apiKey) {
      logger.warn('SendGrid API key not available for template discovery');
      return [];
    }

    try {
      const templates = await this.fetchTemplatesFromSendGrid(apiKey);
      this.templateCache = templates;
      this.lastFetch = now;
      
      // Update mapping based on discovered templates
      this.updateMappingFromDiscovery(templates);
      
      logger.info('Templates discovered and cached', {
        count: templates.length,
        types: this.getMappingSummary()
      });
      
      return templates;
      
    } catch (error) {
      logger.error('Template discovery failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Fetch templates directly from SendGrid API
   */
  private async fetchTemplatesFromSendGrid(apiKey: string): Promise<TemplateInfo[]> {
    const https = require('https');
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.sendgrid.com',
        port: 443,
        path: '/v3/templates?generations=dynamic',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res: any) => {
        let data = '';
        
        res.on('data', (chunk: any) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const templates = parsed.result || parsed.templates || [];
            
            const templateInfos: TemplateInfo[] = templates.map((template: any) => ({
              id: template.id,
              name: template.name,
              type: this.classifyTemplate(template.name),
              active: template.versions?.some((v: any) => v.active === 1) || true,
              created: template.created_at,
              updated: template.updated_at
            }));
            
            resolve(templateInfos);
            
          } catch (error) {
            reject(new Error(`Failed to parse SendGrid response: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
        });
      });

      req.on('error', (error: Error) => {
        reject(error);
      });

      req.end();
    });
  }

  /**
   * Classify template based on its name
   */
  private classifyTemplate(name: string): string {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('verification') || lowerName.includes('verify') || lowerName.includes('confirm')) {
      return 'verification';
    }
    if (lowerName.includes('welcome') || lowerName.includes('onboard')) {
      return 'welcome';
    }
    if (lowerName.includes('reset') || lowerName.includes('password') || lowerName.includes('forgot')) {
      return 'reset';
    }
    if (lowerName.includes('resend')) {
      return 'resend';
    }
    
    return 'unknown';
  }

  /**
   * Update template mapping based on discovered templates
   */
  private updateMappingFromDiscovery(templates: TemplateInfo[]): void {
    const newMapping: TemplateMapping = {
      verification: null,
      welcome: null,
      reset: null,
      resend: null
    };

    // Find best template for each type
    for (const template of templates) {
      if (template.active && this.getValidTemplateId(template.id)) {
        switch (template.type) {
          case 'verification':
            if (!newMapping.verification) {
              newMapping.verification = template.id;
            }
            break;
          case 'welcome':
            if (!newMapping.welcome) {
              newMapping.welcome = template.id;
            }
            break;
          case 'reset':
            if (!newMapping.reset) {
              newMapping.reset = template.id;
            }
            break;
          case 'resend':
            if (!newMapping.resend) {
              newMapping.resend = template.id;
            }
            break;
        }
      }
    }

    // Only update if we found templates, preserve environment config otherwise
    if (Object.values(newMapping).some(id => id !== null)) {
      this.mappingCache = {
        verification: newMapping.verification || this.mappingCache?.verification || null,
        welcome: newMapping.welcome || this.mappingCache?.welcome || null,
        reset: newMapping.reset || this.mappingCache?.reset || null,
        resend: newMapping.resend || this.mappingCache?.resend || null
      };
    }
  }

  /**
   * Get summary of current template mapping
   */
  getMappingSummary(): Record<string, boolean> {
    return {
      verification: !!this.mappingCache?.verification,
      welcome: !!this.mappingCache?.welcome,
      reset: !!this.mappingCache?.reset,
      resend: !!this.mappingCache?.resend
    };
  }

  /**
   * Get all available templates (for admin interface)
   */
  async getAllTemplates(): Promise<TemplateInfo[]> {
    await this.discoverTemplates();
    return this.templateCache;
  }

  /**
   * Get current template mapping (for admin interface)
   */
  getCurrentMapping(): TemplateMapping | null {
    return this.mappingCache;
  }

  /**
   * Generate environment variable suggestions
   */
  async generateEnvironmentSuggestions(): Promise<Record<string, string>> {
    await this.discoverTemplates();
    
    const suggestions: Record<string, string> = {};
    
    if (this.mappingCache?.verification) {
      suggestions.SENDGRID_VERIFICATION_TEMPLATE_ID = this.mappingCache.verification;
    }
    if (this.mappingCache?.welcome) {
      suggestions.SENDGRID_WELCOME_TEMPLATE_ID = this.mappingCache.welcome;
    }
    if (this.mappingCache?.reset) {
      suggestions.SENDGRID_RESET_TEMPLATE_ID = this.mappingCache.reset;
    }
    if (this.mappingCache?.resend) {
      suggestions.SENDGRID_RESEND_TEMPLATE_ID = this.mappingCache.resend;
    }
    
    return suggestions;
  }

  /**
   * Validate that required templates are available
   */
  async validateRequiredTemplates(): Promise<{ valid: boolean; missing: string[]; errors: string[] }> {
    const missing: string[] = [];
    const errors: string[] = [];
    
    try {
      await this.discoverTemplates();
      
      // Check for verification template (required)
      if (!this.mappingCache?.verification) {
        missing.push('verification');
      }
      
      return {
        valid: missing.length === 0,
        missing,
        errors
      };
      
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown validation error');
      return {
        valid: false,
        missing,
        errors
      };
    }
  }
}