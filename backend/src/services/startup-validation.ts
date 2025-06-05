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
      const templateManager = new TemplateManager();
      const validation = await templateManager.validateRequiredTemplates();
      
      if (validation.valid) {
        this.results.push({
          service: 'email-templates',
          status: 'pass',
          message: 'All required email templates are configured and valid',
          details: {
            mapping: templateManager.getMappingSummary()
          }
        });
      } else {
        const severity = validation.missing.includes('verification') ? 'fail' : 'warn';
        this.results.push({
          service: 'email-templates',
          status: severity,
          message: `Email template validation failed: ${validation.missing.join(', ')} templates missing`,
          details: {
            missing: validation.missing,
            errors: validation.errors,
            current: templateManager.getMappingSummary()
          }
        });
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