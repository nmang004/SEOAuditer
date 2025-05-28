import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Define environment variable schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  
  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters long'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  
  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'), // 15 minutes
  RATE_LIMIT_MAX: z.string().default('100'),
  
  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
});

// Validate environment variables
const envVars = envSchema.safeParse(process.env);

if (!envVars.success) {
  throw new Error(`Config validation error: ${envVars.error.message}`);
}

export const config = {
  env: envVars.data.NODE_ENV,
  port: parseInt(envVars.data.PORT, 10),
  
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
    url: envVars.data.REDIS_URL,
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(envVars.data.RATE_LIMIT_WINDOW_MS, 10),
    max: parseInt(envVars.data.RATE_LIMIT_MAX, 10),
  },
  
  // CORS
  cors: {
    origin: envVars.data.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),
  },
  
  // Logging
  logs: {
    level: envVars.data.LOG_LEVEL,
  },
} as const;

export type Config = typeof config;
