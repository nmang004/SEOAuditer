import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { logger } from '../utils/logger';
import DOMPurify from 'isomorphic-dompurify';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { config } from '../config/config';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// ============ ENHANCED SECURITY HEADERS ============

export const enhancedSecurityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: [
        "'self'",
        "'unsafe-eval'", // Required for development
        "'unsafe-inline'", // Required for Next.js
        "https://cdn.jsdelivr.net",
        "https://www.google.com",
        "https://www.gstatic.com"
      ],
      connectSrc: [
        "'self'",
        config.apiUrl,
        "https://api.github.com",
        "wss:",
        "ws:"
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: config.env === 'production' ? [] : null
    },
  },
  crossOriginEmbedderPolicy: { policy: 'credentialless' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: config.env === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
});

// ============ ADVANCED INPUT SANITIZATION ============

interface SanitizationOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  maxLength?: number;
  stripHtml?: boolean;
  preventXSS?: boolean;
  preventSQLInjection?: boolean;
}

const defaultSanitizationOptions: SanitizationOptions = {
  allowedTags: [],
  allowedAttributes: {},
  maxLength: 10000,
  stripHtml: true,
  preventXSS: true,
  preventSQLInjection: true
};

export class AdvancedSanitizer {
  private static readonly SQL_INJECTION_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(\b(OR|AND)\s+[\w\s]*\s*=\s*[\w\s]*)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /([\'\"]);\s*(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER)\b/gi,
    /\/\*[\s\S]*?\*\//gi, // SQL comments
    /--[\s\S]*$/gmi, // SQL line comments
    /(WAITFOR\s+DELAY|BENCHMARK|SLEEP)\s*\(/gi,
    /(UNION\s+(ALL\s+)?SELECT)/gi
  ];

  private static readonly XSS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^>]*>/gi,
    /<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi,
    /javascript\s*:/gi,
    /vbscript\s*:/gi,
    /data\s*:\s*text\/html/gi,
    /<meta\b[^>]*http-equiv\s*=\s*["']refresh["']/gi
  ];

  private static readonly MALICIOUS_FILENAME_PATTERNS = [
    /\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.com$/i, /\.pif$/i, /\.scr$/i,
    /\.vbs$/i, /\.vbe$/i, /\.js$/i, /\.jse$/i, /\.jar$/i, /\.class$/i,
    /\.sh$/i, /\.ps1$/i, /\.php$/i, /\.asp$/i, /\.jsp$/i, /\.htaccess$/i
  ];

  static sanitizeString(input: string, options: SanitizationOptions = {}): string {
    const opts = { ...defaultSanitizationOptions, ...options };
    
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input.trim();

    // Length check
    if (opts.maxLength && sanitized.length > opts.maxLength) {
      sanitized = sanitized.substring(0, opts.maxLength);
    }

    // SQL Injection prevention
    if (opts.preventSQLInjection) {
      this.SQL_INJECTION_PATTERNS.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '');
      });
    }

    // XSS prevention
    if (opts.preventXSS) {
      this.XSS_PATTERNS.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '');
      });
    }

    // HTML sanitization using DOMPurify
    if (opts.stripHtml) {
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: opts.allowedTags || [],
        ALLOWED_ATTR: Object.values(opts.allowedAttributes || {}).flat(),
        KEEP_CONTENT: true
      });
    }

    // HTML entity encoding for remaining special characters
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return sanitized;
  }

  static sanitizeObject(obj: any, options: SanitizationOptions = {}): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, options));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = this.sanitizeString(key, { ...options, maxLength: 100 });
      
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeString(value, options);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[sanitizedKey] = this.sanitizeObject(value, options);
      } else {
        sanitized[sanitizedKey] = value;
      }
    }
    return sanitized;
  }

  static validateFilename(filename: string): boolean {
    if (!filename || typeof filename !== 'string') {
      return false;
    }

    // Check for malicious file extensions
    if (this.MALICIOUS_FILENAME_PATTERNS.some(pattern => pattern.test(filename))) {
      return false;
    }

    // Check for path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return false;
    }

    // Check for null bytes
    if (filename.includes('\0')) {
      return false;
    }

    return true;
  }

  static async scanFileContent(filePath: string): Promise<{ safe: boolean; reason?: string }> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      // Check for malicious scripts in file content
      for (const pattern of this.XSS_PATTERNS) {
        if (pattern.test(content)) {
          return { safe: false, reason: 'Malicious script content detected' };
        }
      }

      // Check for SQL injection attempts in file content
      for (const pattern of this.SQL_INJECTION_PATTERNS) {
        if (pattern.test(content)) {
          return { safe: false, reason: 'SQL injection patterns detected' };
        }
      }

      // Check file size (10MB limit)
      const stats = await fs.stat(filePath);
      if (stats.size > 10 * 1024 * 1024) {
        return { safe: false, reason: 'File size exceeds limit' };
      }

      return { safe: true };
    } catch (error) {
      logger.error('File scanning error:', error);
      return { safe: false, reason: 'File scanning failed' };
    }
  }
}

// ============ INPUT VALIDATION MIDDLEWARE ============

export const sanitizeInput = (options: SanitizationOptions = {}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        req.body = AdvancedSanitizer.sanitizeObject(req.body, options);
      }

      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        req.query = AdvancedSanitizer.sanitizeObject(req.query, options);
      }

      // Sanitize URL parameters
      if (req.params && typeof req.params === 'object') {
        req.params = AdvancedSanitizer.sanitizeObject(req.params, options);
      }

      next();
    } catch (error) {
      logger.error('Input sanitization error:', error);
      res.status(400).json({
        success: false,
        error: 'Invalid input data',
        message: 'Request contains invalid or potentially malicious content'
      });
    }
  };
};

// ============ FILE UPLOAD SECURITY ============

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const sanitizedName = AdvancedSanitizer.sanitizeString(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${sanitizedName}`;
    cb(null, uniqueName);
  }
});

export const secureFileUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Maximum 5 files
    fields: 10, // Maximum 10 form fields
    fieldSize: 1024 * 1024, // 1MB per field
    headerPairs: 2000 // Maximum header pairs
  },
  fileFilter: (req, file, cb) => {
    // Validate MIME type
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('File type not allowed'));
    }

    // Validate filename
    if (!AdvancedSanitizer.validateFilename(file.originalname)) {
      return cb(new Error('Invalid filename'));
    }

    cb(null, true);
  }
});

export const scanUploadedFiles = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    if (req.files) {
      const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      
      for (const file of files as Express.Multer.File[]) {
        const scanResult = await AdvancedSanitizer.scanFileContent(file.path);
        
        if (!scanResult.safe) {
          // Delete the unsafe file
          await fs.unlink(file.path).catch(() => {});
          
          logger.warn('Unsafe file upload detected', {
            filename: file.originalname,
            reason: scanResult.reason,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });
          
          return res.status(400).json({
            success: false,
            error: 'File security check failed',
            message: `File rejected: ${scanResult.reason}`
          });
        }
      }
    }
    
    next();
  } catch (error) {
    logger.error('File scanning error:', error);
    return res.status(500).json({
      success: false,
      error: 'File processing failed',
      message: 'Unable to process uploaded files'
    });
  }
};

// ============ ENHANCED RATE LIMITING ============

const rateLimiters = {
  api: new RateLimiterMemory({
    points: 100, // Requests
    duration: 900, // Per 15 minutes
  }),
  
  auth: new RateLimiterMemory({
    points: 5, // Attempts
    duration: 900, // Per 15 minutes
  }),
  
  upload: new RateLimiterMemory({
    points: 10, // Uploads
    duration: 3600, // Per hour
  }),
  
  expensive: new RateLimiterMemory({
    points: 5, // Operations
    duration: 3600, // Per hour
  })
};

export const createAdvancedRateLimit = (limiterType: keyof typeof rateLimiters) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const key = req.ip || 'unknown';
      const limiter = rateLimiters[limiterType];
      
      const result = await limiter.consume(key);
      
      // Add rate limit headers with proper typing
      res.set({
        'X-RateLimit-Limit': '100', // Default limit since we can't access points property
        'X-RateLimit-Remaining': (result as any).remainingPoints?.toString() || '0',
        'X-RateLimit-Reset': new Date(Date.now() + ((result as any).msBeforeNext || 0)).toISOString()
      });
      
      next();
    } catch (rejRes: any) {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      
      // Log rate limit violation
      logger.warn('Rate limit exceeded', {
        limiterType,
        ip: req.ip,
        endpoint: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        retryAfter: secs
      });
      
      res.set('Retry-After', String(secs));
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${secs} seconds.`,
        retryAfter: secs
      });
    }
  };
};

// ============ SECURITY MONITORING ============

interface SecurityEvent {
  type: 'suspicious_activity' | 'rate_limit_exceeded' | 'invalid_input' | 'file_upload_blocked' | 'authentication_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  ip: string;
  userAgent?: string;
  userId?: string;
  timestamp: Date;
}

export class SecurityMonitor {
  private static readonly SUSPICIOUS_PATTERNS = [
    // Path traversal attempts
    /\.\.[\/\\]/,
    // Common attack patterns
    /%2e%2e/i,
    /%252e%252e/i,
    // SQL injection indicators
    /union.*select/i,
    /'.*or.*'.*=/i,
    // XSS indicators
    /<script/i,
    /javascript:/i,
    // Command injection
    /;.*cat/i,
    /\|.*ls/i,
    /`.*whoami/i
  ];

  static async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Log to application logs
      logger.warn('Security event detected', event);
      
      // Store in database for analysis
      await prisma.activityLog.create({
        data: {
          userId: event.userId || 'unknown',
          action: `security_${event.type}`,
          details: event.details,
          ipAddress: event.ip,
          userAgent: event.userAgent
        }
      });
      
      // Alert on critical events
      if (event.severity === 'critical') {
        await this.alertCriticalEvent(event);
      }
    } catch (error) {
      logger.error('Failed to log security event:', error);
    }
  }

  private static async alertCriticalEvent(event: SecurityEvent): Promise<void> {
    // In production, this would send alerts to administrators
    logger.error('CRITICAL SECURITY EVENT', event);
    
    // Could integrate with services like:
    // - Slack notifications
    // - Email alerts
    // - PagerDuty
    // - Security incident management systems
  }

  static detectSuspiciousActivity = (req: Request, res: Response, next: NextFunction): Response | void => {
    try {
      const suspiciousIndicators: string[] = [];
      
      // Check URL for suspicious patterns
      const fullUrl = req.originalUrl || req.url;
      this.SUSPICIOUS_PATTERNS.forEach((pattern, index) => {
        if (pattern.test(fullUrl)) {
          suspiciousIndicators.push(`URL pattern ${index + 1}`);
        }
      });
      
      // Check headers for suspicious content
      const userAgent = req.get('User-Agent') || '';
      if (userAgent.length > 500 || this.SUSPICIOUS_PATTERNS.some(p => p.test(userAgent))) {
        suspiciousIndicators.push('Suspicious User-Agent');
      }
      
      // Check for unusual request patterns
      const requestBody = JSON.stringify(req.body || {});
      if (requestBody.length > 50000) {
        suspiciousIndicators.push('Oversized request body');
      }
      
      // Log suspicious activity
      if (suspiciousIndicators.length > 0) {
        this.logSecurityEvent({
          type: 'suspicious_activity',
          severity: suspiciousIndicators.length > 2 ? 'high' : 'medium',
          details: {
            indicators: suspiciousIndicators,
            url: fullUrl,
            method: req.method,
            bodySize: requestBody.length
          },
          ip: req.ip || 'unknown',
          userAgent,
          timestamp: new Date()
        });
        
        // Block highly suspicious requests
        if (suspiciousIndicators.length > 3) {
          return res.status(403).json({
            success: false,
            error: 'Request blocked',
            message: 'Suspicious activity detected'
          });
        }
      }
      
      next();
    } catch (error) {
      logger.error('Security monitoring error:', error);
      next(); // Don't block requests on monitoring errors
    }
  };
}

// ============ URL VALIDATION ============

export const validateAndSanitizeUrls = (req: Request, res: Response, next: NextFunction): Response | void => {
  try {
    const urlFields = ['url', 'targetUrl', 'redirectUrl', 'callbackUrl'];
    
    for (const field of urlFields) {
      if (req.body[field]) {
        const url = req.body[field];
        
        // Basic URL validation
        try {
          const parsedUrl = new URL(url);
          
          // Block dangerous protocols
          if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return res.status(400).json({
              success: false,
              error: 'Invalid URL protocol',
              message: 'Only HTTP and HTTPS URLs are allowed'
            });
          }
          
          // Block internal network access in production
          if (config.env === 'production') {
            const hostname = parsedUrl.hostname.toLowerCase();
            const blockedHosts = [
              'localhost', '127.0.0.1', '0.0.0.0',
              '10.', '172.16.', '172.17.', '172.18.', '172.19.',
              '172.20.', '172.21.', '172.22.', '172.23.',
              '172.24.', '172.25.', '172.26.', '172.27.',
              '172.28.', '172.29.', '172.30.', '172.31.',
              '192.168.'
            ];
            
            if (blockedHosts.some(blocked => hostname.includes(blocked))) {
              return res.status(400).json({
                success: false,
                error: 'URL not allowed',
                message: 'Internal network URLs are not permitted'
              });
            }
          }
          
          // Sanitize the URL
          req.body[field] = parsedUrl.toString();
          
        } catch (urlError) {
          return res.status(400).json({
            success: false,
            error: 'Invalid URL format',
            message: `The ${field} field contains an invalid URL`
          });
        }
      }
    }
    
    next();
  } catch (error) {
    logger.error('URL validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'URL validation failed',
      message: 'Unable to validate URLs in request'
    });
  }
};

// ============ EXPORTS ============

export const securityMiddleware = {
  headers: enhancedSecurityHeaders,
  sanitizeInput,
  fileUpload: secureFileUpload,
  scanFiles: scanUploadedFiles,
  rateLimit: createAdvancedRateLimit,
  monitor: SecurityMonitor.detectSuspiciousActivity,
  validateUrls: validateAndSanitizeUrls
};

export default securityMiddleware; 