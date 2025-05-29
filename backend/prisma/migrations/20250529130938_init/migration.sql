-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationExpires" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "faviconUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "scanFrequency" TEXT NOT NULL DEFAULT 'manual',
    "currentScore" INTEGER DEFAULT 0,
    "issueCount" INTEGER NOT NULL DEFAULT 0,
    "lastScanDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrawlSession" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrawlSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOAnalysis" (
    "id" TEXT NOT NULL,
    "crawlSessionId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "overallScore" INTEGER DEFAULT 0,
    "technicalScore" INTEGER DEFAULT 0,
    "contentScore" INTEGER DEFAULT 0,
    "onpageScore" INTEGER DEFAULT 0,
    "uxScore" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SEOAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOIssue" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "recommendation" TEXT,
    "affectedElements" JSONB,
    "status" TEXT NOT NULL DEFAULT 'new',
    "category" TEXT NOT NULL,
    "affectedPages" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SEOIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaTags" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "keywords" TEXT,
    "titleLength" INTEGER,
    "descriptionLength" INTEGER,
    "canonicalUrl" TEXT,
    "robots" TEXT,
    "openGraph" JSONB,
    "twitterCard" JSONB,

    CONSTRAINT "MetaTags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notifications" JSONB,
    "theme" TEXT DEFAULT 'system',
    "language" TEXT DEFAULT 'en',
    "timezone" TEXT DEFAULT 'UTC',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "metadata" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "CrawlSession_projectId_idx" ON "CrawlSession"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "SEOAnalysis_crawlSessionId_key" ON "SEOAnalysis"("crawlSessionId");

-- CreateIndex
CREATE INDEX "SEOAnalysis_crawlSessionId_idx" ON "SEOAnalysis"("crawlSessionId");

-- CreateIndex
CREATE INDEX "SEOAnalysis_projectId_idx" ON "SEOAnalysis"("projectId");

-- CreateIndex
CREATE INDEX "SEOIssue_analysisId_idx" ON "SEOIssue"("analysisId");

-- CreateIndex
CREATE INDEX "SEOIssue_severity_idx" ON "SEOIssue"("severity");

-- CreateIndex
CREATE INDEX "SEOIssue_status_idx" ON "SEOIssue"("status");

-- CreateIndex
CREATE INDEX "SEOIssue_category_idx" ON "SEOIssue"("category");

-- CreateIndex
CREATE UNIQUE INDEX "MetaTags_analysisId_key" ON "MetaTags"("analysisId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_readAt_idx" ON "Notification"("readAt");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlSession" ADD CONSTRAINT "CrawlSession_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SEOAnalysis" ADD CONSTRAINT "SEOAnalysis_crawlSessionId_fkey" FOREIGN KEY ("crawlSessionId") REFERENCES "CrawlSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SEOAnalysis" ADD CONSTRAINT "SEOAnalysis_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SEOIssue" ADD CONSTRAINT "SEOIssue_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "SEOAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaTags" ADD CONSTRAINT "MetaTags_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "SEOAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
