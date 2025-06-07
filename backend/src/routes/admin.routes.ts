import { Router } from 'express';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { TemplateManager } from '../services/TemplateManager';
import { StartupValidator } from '../services/startup-validation';

const router = Router();

/**
 * GET /api/admin/sendgrid-templates
 * Discover and list all SendGrid templates
 */
router.get('/sendgrid-templates', async (req: Request, res: Response) => {
  try {
    const correlationId = Math.random().toString(36).substring(2, 15);
    
    logger.info('Admin: Discovering SendGrid templates via TemplateManager', { correlationId });

    const templateManager = new TemplateManager();
    
    // Get all templates and current mapping
    const [templates, mapping, envSuggestions, validation] = await Promise.all([
      templateManager.getAllTemplates(),
      templateManager.getCurrentMapping(),
      templateManager.generateEnvironmentSuggestions(),
      templateManager.validateRequiredTemplates()
    ]);

    logger.info('SendGrid templates discovered successfully', {
      correlationId,
      templateCount: templates.length,
      mappingSummary: templateManager.getMappingSummary(),
      validationPassed: validation.valid
    });

    res.json({
      success: true,
      templates: templates.map(template => ({
        id: template.id,
        name: template.name,
        type: template.type,
        active: template.active,
        created_at: template.created,
        updated_at: template.updated
      })),
      currentMapping: mapping,
      environmentVariables: envSuggestions,
      validation,
      summary: templateManager.getMappingSummary(),
      correlationId
    });

  } catch (error) {
    logger.error('Admin: Failed to discover SendGrid templates', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    res.status(500).json({
      success: false,
      error: 'TEMPLATE_DISCOVERY_FAILED',
      message: 'Failed to discover SendGrid templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/admin/system-validation
 * Run comprehensive system validation checks
 */
router.get('/system-validation', async (req: Request, res: Response) => {
  try {
    const correlationId = Math.random().toString(36).substring(2, 15);
    
    logger.info('Admin: Running system validation', { correlationId });

    const validator = new StartupValidator();
    const [validationResult, recommendations] = await Promise.all([
      validator.validateAll(),
      validator.generateRecommendations()
    ]);

    logger.info('System validation completed', {
      correlationId,
      passed: validationResult.passed,
      totalChecks: validationResult.results.length
    });

    res.json({
      success: true,
      validation: validationResult,
      recommendations,
      correlationId
    });

  } catch (error) {
    logger.error('Admin: System validation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    res.status(500).json({
      success: false,
      error: 'VALIDATION_FAILED',
      message: 'Failed to run system validation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;