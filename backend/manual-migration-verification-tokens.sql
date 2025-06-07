-- Manual Migration: Add Verification Tokens Table
-- This creates the verification_tokens table for the secure token system

CREATE TABLE IF NOT EXISTS "verification_tokens" (
    "id" TEXT NOT NULL,
    "hashedToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),
    "invalidatedAt" TIMESTAMP(3),
    "invalidationReason" TEXT,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for hashed token
CREATE UNIQUE INDEX IF NOT EXISTS "verification_tokens_hashedToken_key" ON "verification_tokens"("hashedToken");

-- Create unique constraint for user+purpose+sequence
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_purpose_sequence" ON "verification_tokens"("userId", "purpose", "sequence");

-- Create optimized indexes for queries
CREATE INDEX IF NOT EXISTS "idx_verification_tokens_hashed_token" ON "verification_tokens"("hashedToken");
CREATE INDEX IF NOT EXISTS "idx_verification_tokens_user_id" ON "verification_tokens"("userId");
CREATE INDEX IF NOT EXISTS "idx_verification_tokens_purpose" ON "verification_tokens"("purpose");
CREATE INDEX IF NOT EXISTS "idx_verification_tokens_is_valid" ON "verification_tokens"("isValid");
CREATE INDEX IF NOT EXISTS "idx_verification_tokens_expires_at" ON "verification_tokens"("expiresAt");
CREATE INDEX IF NOT EXISTS "idx_verification_tokens_created_at" ON "verification_tokens"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_verification_tokens_user_purpose" ON "verification_tokens"("userId", "purpose");
CREATE INDEX IF NOT EXISTS "idx_verification_tokens_user_purpose_valid" ON "verification_tokens"("userId", "purpose", "isValid");
CREATE INDEX IF NOT EXISTS "idx_verification_tokens_active" ON "verification_tokens"("purpose", "isValid", "expiresAt");
CREATE INDEX IF NOT EXISTS "idx_verification_tokens_sequence" ON "verification_tokens"("sequence");
CREATE INDEX IF NOT EXISTS "idx_verification_tokens_email_purpose" ON "verification_tokens"("email", "purpose");

-- Add foreign key constraint to users table
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Verify table was created successfully
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'verification_tokens') THEN
        RAISE NOTICE 'SUCCESS: verification_tokens table created successfully';
    ELSE
        RAISE EXCEPTION 'FAILED: verification_tokens table was not created';
    END IF;
END $$;