import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

console.log('--- Loading config.ts ---');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Define environment variable schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000'),
  
  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  DATABASE_PROXY_URL: z.string().optional(), // Railway provides this
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters long'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  
  // Redis - Optional in production
  REDIS_URL: z.string().optional(),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'), // 15 minutes
  RATE_LIMIT_MAX: z.string().default('100'),
  
  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  
  // Email Configuration
  EMAIL_PROVIDER: z.enum(['sendgrid', 'mock']).default('mock'),
  SENDGRID_API_KEY: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().default('SEO Director'),
  APP_NAME: z.string().default('SEO Director'),
  APP_URL: z.string().url().optional(),
  SUPPORT_EMAIL: z.string().email().optional(),
});

let envVars;
try {
  console.log('--- Validating environment variables ---');
  
  // Check if we're in Railway deployment without required env vars
  const isRailwayDeployment = process.env.RAILWAY_ENVIRONMENT === 'production';
  const missingCriticalVars = !process.env.DATABASE_URL || !process.env.JWT_SECRET;
  
  if (isRailwayDeployment && missingCriticalVars) {
    console.error('=== RAILWAY DEPLOYMENT ERROR ===');
    console.error('Missing required environment variables!');
    console.error('Please configure these in Railway dashboard:');
    console.error('1. DATABASE_URL - Add PostgreSQL service to auto-generate');
    console.error('2. JWT_SECRET - Add manually with 32+ character string');
    console.error('See backend/RAILWAY_ENV_SETUP.md for instructions');
    console.error('================================');
    
    // Exit with clear error for Railway logs
    process.exit(1);
  }
  
  envVars = envSchema.safeParse(process.env);
  if (!envVars.success) {
    console.error('Config validation error:', JSON.stringify(envVars.error.issues, null, 2));
    throw new Error(`Config validation error: ${JSON.stringify(envVars.error.issues)}`);
  }
  console.log('--- Environment variables validated successfully ---');
} catch (err) {
  console.error('FATAL ERROR in config.ts:', err);
  throw err;
}

export const config = {
  env: envVars.data.NODE_ENV,
  port: parseInt(envVars.data.PORT, 10),
  
  // Server configuration
  server: {
    port: parseInt(envVars.data.PORT, 10),
  },
  
  // JWT
  jwt: {
    secret: envVars.data.JWT_SECRET,
    accessExpiration: envVars.data.JWT_ACCESS_EXPIRATION,
    refreshExpiration: envVars.data.JWT_REFRESH_EXPIRATION,
  },
  
  // Database
  db: {
    url: envVars.data.DATABASE_URL,
  },
  
  // Redis
  redis: {
    url: process.env.NODE_ENV === 'production' && !process.env.REDIS_URL 
      ? undefined 
      : (process.env.REDIS_URL || (process.env.NODE_ENV === 'production' ? undefined : 'redis://localhost:6379')),
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(envVars.data.RATE_LIMIT_WINDOW_MS, 10),
    max: parseInt(envVars.data.RATE_LIMIT_MAX, 10),
  },
  
  // CORS
  cors: {
    origin: envVars.data.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),
    credentials: true,
  },
  
  // Logging
  logs: {
    level: envVars.data.LOG_LEVEL,
  },
  // Add clientUrl for use in controllers
  clientUrl: process.env.CLIENT_URL || envVars.data.ALLOWED_ORIGINS.split(',')[0],
  // Email Configuration
  email: {
    provider: envVars.data.EMAIL_PROVIDER,
    sendgridApiKey: envVars.data.SENDGRID_API_KEY,
    fromAddress: envVars.data.EMAIL_FROM_ADDRESS || 'noreply@seoauditer.netlify.app',
    fromName: envVars.data.EMAIL_FROM_NAME,
    supportEmail: envVars.data.SUPPORT_EMAIL || 'support@seoauditer.netlify.app',
    // Legacy nodemailer config for backward compatibility
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || 'user@example.com',
    password: process.env.EMAIL_PASSWORD || 'password',
    fromEmail: envVars.data.EMAIL_FROM_ADDRESS || 'noreply@seoauditer.netlify.app',
  },
  appName: envVars.data.APP_NAME,
  appUrl: envVars.data.APP_URL || envVars.data.ALLOWED_ORIGINS.split(',')[0] || 'https://seoauditer.netlify.app',
  apiUrl: process.env.API_URL || 'http://localhost:3001',
} as const;

export type Config = typeof config;

// Example for Postgres:
export const postgresConfig = {
  url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@postgres:5432/rival_outranker?schema=public',
};

export const redisConfig = {
  url: (() => {
    // In production, completely skip Redis if not explicitly configured
    if (process.env.NODE_ENV === 'production') {
      // Skip Redis entirely in production unless explicitly set and not a Railway internal URL
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl || redisUrl.includes('railway.internal')) {
        return undefined;
      }
      return redisUrl;
    }
    // In development, use localhost Redis if available, otherwise undefined
    return process.env.REDIS_URL || (process.env.NODE_ENV === 'development' ? 'redis://localhost:6379' : undefined);
  })(),
  isOptional: process.env.NODE_ENV === 'production'
};
