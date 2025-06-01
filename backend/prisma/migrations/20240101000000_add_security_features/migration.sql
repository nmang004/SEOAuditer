-- Add security fields to User table
ALTER TABLE "users" ADD COLUMN "twoFactorSecret" TEXT;
ALTER TABLE "users" ADD COLUMN "twoFactorEnabled" BOOLEAN DEFAULT false;
ALTER TABLE "users" ADD COLUMN "twoFactorBackupCodes" TEXT[];
ALTER TABLE "users" ADD COLUMN "failedLoginAttempts" INTEGER DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "lastFailedAttempt" TIMESTAMP;
ALTER TABLE "users" ADD COLUMN "passwordStrengthScore" INTEGER DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "securityQuestion" TEXT;
ALTER TABLE "users" ADD COLUMN "securityAnswerHash" TEXT;

-- Create password history table
CREATE TABLE "password_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "password_history_pkey" PRIMARY KEY ("id")
);

-- Create security events table for enhanced monitoring
CREATE TABLE "security_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'low',
    "description" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" JSONB,
    "resolved" BOOLEAN DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- Create login attempts table for detailed tracking
CREATE TABLE "login_attempts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL,
    "failureReason" TEXT,
    "deviceFingerprint" TEXT,
    "geoLocation" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- Create user sessions table for session management
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL UNIQUE,
    "deviceFingerprint" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- Create security settings table
CREATE TABLE "security_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL UNIQUE,
    "twoFactorRequired" BOOLEAN DEFAULT false,
    "sessionTimeout" INTEGER DEFAULT 1800, -- 30 minutes in seconds
    "allowedIPRanges" TEXT[],
    "blockedIPRanges" TEXT[],
    "loginNotifications" BOOLEAN DEFAULT true,
    "securityAlerts" BOOLEAN DEFAULT true,
    "allowConcurrentSessions" BOOLEAN DEFAULT true,
    "maxConcurrentSessions" INTEGER DEFAULT 5,
    "passwordExpiryDays" INTEGER,
    "requirePasswordChange" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "security_settings_pkey" PRIMARY KEY ("id")
);

-- Create API security logs table
CREATE TABLE "api_security_logs" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "userId" TEXT,
    "requestBody" JSONB,
    "responseStatus" INTEGER,
    "securityFlags" TEXT[],
    "blocked" BOOLEAN DEFAULT false,
    "blockReason" TEXT,
    "processingTime" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "api_security_logs_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "password_history" ADD CONSTRAINT "password_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "security_settings" ADD CONSTRAINT "security_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "api_security_logs" ADD CONSTRAINT "api_security_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX "idx_password_history_user_created" ON "password_history"("userId", "createdAt" DESC);
CREATE INDEX "idx_security_events_user_type" ON "security_events"("userId", "eventType");
CREATE INDEX "idx_security_events_severity_created" ON "security_events"("severity", "createdAt" DESC);
CREATE INDEX "idx_login_attempts_email_timestamp" ON "login_attempts"("email", "timestamp" DESC);
CREATE INDEX "idx_login_attempts_ip_timestamp" ON "login_attempts"("ipAddress", "timestamp" DESC);
CREATE INDEX "idx_user_sessions_user_active" ON "user_sessions"("userId", "isActive");
CREATE INDEX "idx_user_sessions_expires" ON "user_sessions"("expiresAt");
CREATE INDEX "idx_api_security_logs_endpoint_timestamp" ON "api_security_logs"("endpoint", "timestamp" DESC);
CREATE INDEX "idx_api_security_logs_ip_timestamp" ON "api_security_logs"("ipAddress", "timestamp" DESC);
CREATE INDEX "idx_api_security_logs_blocked" ON "api_security_logs"("blocked", "timestamp" DESC);

-- Add additional indexes for user table security fields
CREATE INDEX "idx_users_two_factor_enabled" ON "users"("twoFactorEnabled");
CREATE INDEX "idx_users_account_locked" ON "users"("accountLocked", "lockoutExpires");
CREATE INDEX "idx_users_failed_attempts" ON "users"("failedLoginAttempts", "lastFailedAttempt"); 