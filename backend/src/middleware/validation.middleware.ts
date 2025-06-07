import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { BadRequestError } from './error.middleware';

// Common validation schemas
const emailSchema = z.string().email('Invalid email address').toLowerCase().trim();
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Define all validation schemas
const schemas = {
  // Auth schemas
  register: z.object({
    body: z.object({
      name: z.string().min(2, 'Name must be at least 2 characters long').trim(),
      email: emailSchema,
      password: passwordSchema,
    }),
  }),

  login: z.object({
    body: z.object({
      email: emailSchema,
      password: z.string().min(1, 'Password is required'),
    }),
  }),

  refreshToken: z.object({
    cookies: z.object({
      refreshToken: z.string().min(1, 'Refresh token is required'),
    }),
  }),

  forgotPassword: z.object({
    body: z.object({
      email: emailSchema,
    }),
  }),

  resetPassword: z.object({
    body: z.object({
      token: z.string().min(1, 'Token is required'),
      password: passwordSchema,
    }),
  }),

  verifyEmail: z.object({
    params: z.object({
      token: z.string().min(1, 'Token is required'),
    }),
  }),

  updateProfile: z.object({
    body: z.object({
      name: z.string().min(2, 'Name must be at least 2 characters long').trim().optional(),
    }),
  }),

  changePassword: z.object({
    body: z.object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: passwordSchema.refine(
        (val) => !val.includes(' '),
        'Password cannot contain spaces'
      ),
    }),
  }),

  // Project schemas
  createProject: z.object({
    body: z.object({
      name: z.string().min(2, 'Name must be at least 2 characters long').trim(),
      url: z.string().url('Invalid URL').trim(),
      scanFrequency: z.enum(['manual', 'daily', 'weekly', 'monthly']).default('manual'),
    }),
  }),

  updateProject: z.object({
    params: z.object({
      id: z.string().uuid('Invalid project ID'),
    }),
    body: z.object({
      name: z.string().min(2, 'Name must be at least 2 characters long').trim().optional(),
      url: z.string().url('Invalid URL').trim().optional(),
      scanFrequency: z.enum(['manual', 'daily', 'weekly', 'monthly']).optional(),
      status: z.enum(['active', 'paused', 'archived']).optional(),
    }),
  }),

  // Analysis schemas
  createAnalysis: z.object({
    body: z.object({
      projectId: z.string().uuid('Invalid project ID'),
      url: z.string().url('Invalid URL').trim().optional(),
      options: z.record(z.any()).optional(),
    }),
  }),

  getAnalysis: z.object({
    params: z.object({
      id: z.string().uuid('Invalid analysis ID'),
    }),
  }),

  getProjectAnalyses: z.object({
    params: z.object({
      projectId: z.string().uuid('Invalid project ID'),
    }),
    query: z.object({
      status: z.string().optional(),
      limit: z.preprocess(Number, z.number().int().positive().max(100).default(10)).optional(),
      offset: z.preprocess(Number, z.number().int().nonnegative().default(0)).optional(),
    }),
  }),

  cancelAnalysis: z.object({
    params: z.object({
      analysisId: z.string().uuid('Invalid analysis ID'),
    }),
  }),

  getAnalysisIssues: z.object({
    params: z.object({
      analysisId: z.string().uuid('Invalid analysis ID'),
    }),
    query: z.object({
      severity: z.string().optional(),
      status: z.string().optional(),
      limit: z.preprocess(Number, z.number().int().positive().max(100).default(50)).optional(),
      offset: z.preprocess(Number, z.number().int().nonnegative().default(0)).optional(),
    }),
  }),

  updateIssueStatus: z.object({
    params: z.object({
      issueId: z.string().uuid('Invalid issue ID'),
    }),
    body: z.object({
      status: z.enum(['new', 'in_progress', 'fixed', 'wont_fix', 'ignored']),
    }),
  }),

  // Pagination and filtering
  pagination: z.object({
    query: z.object({
      page: z.preprocess(Number, z.number().int().positive().default(1)),
      limit: z.preprocess(Number, z.number().int().positive().max(100).default(10)),
      sortBy: z.string().default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
      search: z.string().optional(),
    }),
  }),
};

// Type for validation schema names
type SchemaName = keyof typeof schemas;

// Create a type that maps schema names to their types
type ValidationSchemas = {
  [K in SchemaName]: z.infer<typeof schemas[K]>;
};

// Middleware factory function
export const validate = (schemaName: SchemaName) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const schema = schemas[schemaName];
      
      // Validate request parts based on schema
      const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
        cookies: req.cookies,
        headers: req.headers,
      });

      if (!result.success) {
        const validationError = fromZodError(result.error);
        throw new BadRequestError(validationError.message, {
          details: result.error.issues,
        });
      }

      // Replace request properties with validated values (only if present)
      if ('body' in result.data && result.data.body) req.body = result.data.body;
      if ('query' in result.data && result.data.query) {
        // Mutate req.query in place to avoid Express getter-only error
        Object.assign(req.query, result.data.query);
      }
      if ('params' in result.data && result.data.params) req.params = result.data.params;
      if ('cookies' in result.data && result.data.cookies) req.cookies = result.data.cookies;

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Export schema types for use in controllers
export type { ValidationSchemas };

// Alternative validation function that accepts Zod schemas directly
export const validateRequest = (schema: z.ZodSchema<any>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Validate request parts based on schema
      const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
        cookies: req.cookies,
        headers: req.headers,
      });

      if (!result.success) {
        const validationError = fromZodError(result.error);
        throw new BadRequestError(validationError.message, {
          details: result.error.issues,
        });
      }

      // Replace request properties with validated values (only if present)
      if ('body' in result.data && result.data.body) req.body = result.data.body;
      if ('query' in result.data && result.data.query) {
        // Mutate req.query in place to avoid Express getter-only error
        Object.assign(req.query, result.data.query);
      }
      if ('params' in result.data && result.data.params) req.params = result.data.params;
      if ('cookies' in result.data && result.data.cookies) req.cookies = result.data.cookies;

      next();
    } catch (error) {
      next(error);
    }
  };
};
