/**
 * Startup Validation Service
 * 
 * Validates critical system components during server startup
 */

import { logger } from '../utils/logger';
import { TemplateManager } from './TemplateManager';
import { config } from '../config/config';

interface ValidationResult {
  service: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: any;
}

export class StartupValidator {
  private results: ValidationResult[] = [];

  async validateAll(): Promise<{ passed: boolean; results: ValidationResult[] }> {
    logger.info('Starting system validation checks...');

    await Promise.all([
      this.validateEmailTemplates(),
      this.validateSendGridConfiguration(),
      this.validateEnvironmentVariables()
    ]);

    const failed = this.results.filter(r => r.status === 'fail');
    const warnings = this.results.filter(r => r.status === 'warn');
    
    logger.info('System validation completed', {
      total: this.results.length,
      passed: this.results.filter(r => r.status === 'pass').length,
      warnings: warnings.length,
      failed: failed.length
    });

    if (failed.length > 0) {
      logger.error('Critical validation failures detected', {
        failures: failed.map(f => ({ service: f.service, message: f.message }))
      });
    }

    if (warnings.length > 0) {
      logger.warn('Validation warnings detected', {
        warnings: warnings.map(w => ({ service: w.service, message: w.message }))
      });
    }

    return {
      passed: failed.length === 0,
      results: this.results
    };
  }

  private async validateEmailTemplates(): Promise<void> {
    try {
      // Check if we're using server-side templates (no dynamic template ID configured)
      const hasDynamicTemplateId = !!(
        process.env.SENDGRID_VERIFICATION_TEMPLATE_ID || 
        process.env.SENDGRID_EMAIL_VERIFICATION_TEMPLATE_ID ||
        config.sendgrid?.templates?.emailVerification
      );
      
      if (!hasDynamicTemplateId) {
        // Using server-side templates - validate that the template files exist
        try {
          const { WelcomeTemplate } = require('./email/templates/WelcomeTemplate');
          const template = new WelcomeTemplate();
          
          // Test template rendering
          const testContent = template.render({
            name: 'Test User',
            verificationUrl: 'https://example.com/verify/test',
            appName: 'SEO Director',
            appUrl: 'https://example.com',
            email: 'test@example.com'
          });
          
          if (testContent.subject && testContent.html && testContent.text) {
            this.results.push({
              service: 'email-templates',
              status: 'pass',
              message: 'Server-side email templates are working correctly',
              details: {
                templateType: 'server-side',
                templateClass: 'WelcomeTemplate',
                hasSubject: !!testContent.subject,
                hasHtml: !!testContent.html,
                hasText: !!testContent.text
              }
            });
          } else {
            throw new Error('Template render returned incomplete content');
          }
        } catch (templateError) {
          this.results.push({
            service: 'email-templates',
            status: 'fail',
            message: 'Server-side email template validation failed',
            details: {
              templateType: 'server-side',
              error: templateError instanceof Error ? templateError.message : 'Unknown template error'
            }
          });
        }
      } else {
        // Using dynamic templates - validate SendGrid configuration
        const templateManager = new TemplateManager();
        const validation = await templateManager.validateRequiredTemplates();
        
        if (validation.valid) {
          this.results.push({
            service: 'email-templates',
            status: 'pass',
            message: 'Dynamic SendGrid templates are configured and valid',
            details: {
              templateType: 'dynamic',
              mapping: templateManager.getMappingSummary()
            }
          });
        } else {
          const severity = validation.missing.includes('verification') ? 'fail' : 'warn';
          this.results.push({
            service: 'email-templates',
            status: severity,
            message: `Dynamic template validation failed: ${validation.missing.join(', ')} templates missing`,
            details: {
              templateType: 'dynamic',
              missing: validation.missing,
              errors: validation.errors,
              current: templateManager.getMappingSummary()
            }
          });
        }
      }
    } catch (error) {
      this.results.push({
        service: 'email-templates',
        status: 'fail',
        message: 'Failed to validate email templates',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  private async validateSendGridConfiguration(): Promise<void> {
    try {
      const hasApiKey = !!config.sendgrid?.apiKey;
      const hasFromEmail = !!config.sendgrid?.fromEmail;
      
      if (hasApiKey && hasFromEmail) {
        this.results.push({
          service: 'sendgrid-config',
          status: 'pass',
          message: 'SendGrid configuration is complete',
          details: {
            apiKeyConfigured: hasApiKey,
            fromEmailConfigured: hasFromEmail,
            fromEmail: config.sendgrid.fromEmail
          }
        });
      } else {
        const missing = [];
        if (!hasApiKey) missing.push('SENDGRID_API_KEY');
        if (!hasFromEmail) missing.push('EMAIL_FROM_ADDRESS');
        
        this.results.push({
          service: 'sendgrid-config',
          status: 'fail',
          message: `SendGrid configuration incomplete: ${missing.join(', ')} missing`,
          details: {
            missing,
            apiKeyConfigured: hasApiKey,
            fromEmailConfigured: hasFromEmail
          }
        });
      }
    } catch (error) {
      this.results.push({
        service: 'sendgrid-config',
        status: 'fail',
        message: 'Failed to validate SendGrid configuration',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  private async validateEnvironmentVariables(): Promise<void> {
    try {
      const required = ['DATABASE_URL', 'JWT_SECRET'];
      const optional = ['SENDGRID_API_KEY', 'EMAIL_FROM_ADDRESS', 'REDIS_URL'];
      
      const missing = required.filter(key => !process.env[key]);
      const optionalMissing = optional.filter(key => !process.env[key]);
      
      if (missing.length === 0) {
        this.results.push({
          service: 'environment-variables',
          status: optionalMissing.length > 0 ? 'warn' : 'pass',
          message: optionalMissing.length > 0 
            ? `Core environment variables configured. Optional missing: ${optionalMissing.join(', ')}`
            : 'All environment variables configured',
          details: {
            required: required.map(key => ({ key, configured: !!process.env[key] })),
            optional: optional.map(key => ({ key, configured: !!process.env[key] }))
          }
        });
      } else {
        this.results.push({
          service: 'environment-variables',
          status: 'fail',
          message: `Required environment variables missing: ${missing.join(', ')}`,
          details: {
            missing,
            required: required.map(key => ({ key, configured: !!process.env[key] })),
            optional: optional.map(key => ({ key, configured: !!process.env[key] }))
          }
        });
      }
    } catch (error) {
      this.results.push({
        service: 'environment-variables',
        status: 'fail',
        message: 'Failed to validate environment variables',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  /**
   * Get validation results for admin interface
   */
  getResults(): ValidationResult[] {
    return this.results;
  }

  /**
   * Generate environment variable recommendations
   */
  async generateRecommendations(): Promise<Record<string, string>> {
    const recommendations: Record<string, string> = {};
    
    try {
      const templateManager = new TemplateManager();
      const envSuggestions = await templateManager.generateEnvironmentSuggestions();
      
      // Add template recommendations
      Object.assign(recommendations, envSuggestions);
      
      // Add other missing environment variables
      if (!process.env.EMAIL_FROM_ADDRESS) {
        recommendations.EMAIL_FROM_ADDRESS = 'admin@yourdomain.com';
      }
      
      if (!process.env.SENDGRID_API_KEY) {
        recommendations.SENDGRID_API_KEY = 'SG.your-sendgrid-api-key-here';
      }
      
    } catch (error) {
      logger.error('Failed to generate recommendations', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    return recommendations;
  }
}