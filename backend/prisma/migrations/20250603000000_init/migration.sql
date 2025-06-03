-- CreateTable
CREATE TABLE "users" (
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
    "accountLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockoutExpires" TIMESTAMP(3),
    "lastLogin" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastFailedAttempt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
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

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crawl_sessions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crawl_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_analyses" (
    "id" TEXT NOT NULL,
    "crawlSessionId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "overallScore" INTEGER DEFAULT 0,
    "technicalScore" INTEGER DEFAULT 0,
    "contentScore" INTEGER DEFAULT 0,
    "onpageScore" INTEGER DEFAULT 0,
    "uxScore" INTEGER DEFAULT 0,
    "previousScore" INTEGER,
    "scoreChange" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seo_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_score_breakdowns" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "technicalBreakdown" JSONB NOT NULL,
    "contentBreakdown" JSONB NOT NULL,
    "onPageBreakdown" JSONB NOT NULL,
    "uxBreakdown" JSONB NOT NULL,
    "weights" JSONB NOT NULL,
    "trends" JSONB,
    "benchmarks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seo_score_breakdowns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_analyses" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "readingTime" INTEGER NOT NULL,
    "paragraphCount" INTEGER NOT NULL,
    "sentenceCount" INTEGER NOT NULL,
    "averageSentenceLength" DOUBLE PRECISION NOT NULL,
    "topicCoverage" DOUBLE PRECISION NOT NULL,
    "contentStructure" JSONB NOT NULL,
    "readabilityMetrics" JSONB NOT NULL,
    "keywordAnalysis" JSONB NOT NULL,
    "freshnessData" JSONB NOT NULL,
    "qualityMetrics" JSONB NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "recommendations" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_metrics" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "coreWebVitals" JSONB NOT NULL,
    "loadTime" INTEGER,
    "pageSize" INTEGER,
    "requestCount" INTEGER,
    "performanceScore" INTEGER NOT NULL,
    "mobilePerfScore" INTEGER,
    "optimizationOpportunities" JSONB NOT NULL,
    "lighthouseData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_issues" (
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
    "fixComplexity" TEXT,
    "estimatedTime" TEXT,
    "businessImpact" TEXT,
    "implementationSteps" TEXT[],
    "validationCriteria" TEXT[],
    "blockingIndexing" BOOLEAN DEFAULT false,
    "securityConcern" BOOLEAN DEFAULT false,
    "rankingImpact" TEXT,
    "enhancementType" TEXT,
    "compoundIssue" BOOLEAN DEFAULT false,
    "affectedCategories" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_recommendations" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "issueId" TEXT,
    "priority" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "implementationSteps" JSONB NOT NULL,
    "codeExamples" JSONB,
    "tools" TEXT[],
    "resources" TEXT[],
    "expectedResults" JSONB NOT NULL,
    "validation" JSONB NOT NULL,
    "effortLevel" TEXT NOT NULL,
    "timeEstimate" TEXT NOT NULL,
    "businessValue" TEXT NOT NULL,
    "quickWin" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meta_tags" (
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
    "structuredData" JSONB,
    "socialOptimization" JSONB,

    CONSTRAINT "meta_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technical_analyses" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "securityData" JSONB NOT NULL,
    "crawlabilityData" JSONB NOT NULL,
    "mobileData" JSONB NOT NULL,
    "structureData" JSONB NOT NULL,
    "indexabilityData" JSONB NOT NULL,
    "performanceData" JSONB NOT NULL,
    "serverData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "technical_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_trends" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "technicalScore" INTEGER NOT NULL,
    "contentScore" INTEGER NOT NULL,
    "onPageScore" INTEGER NOT NULL,
    "uxScore" INTEGER NOT NULL,
    "totalIssues" INTEGER NOT NULL,
    "criticalIssues" INTEGER NOT NULL,
    "highIssues" INTEGER NOT NULL,
    "mediumIssues" INTEGER NOT NULL,
    "lowIssues" INTEGER NOT NULL,
    "performanceScore" INTEGER,
    "accessibilityScore" INTEGER,
    "crawlabilityScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_trends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue_trends" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "issueSeverity" TEXT NOT NULL,
    "issueCategory" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issue_trends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitor_analyses" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "competitorUrl" TEXT NOT NULL,
    "competitorName" TEXT,
    "overallScore" INTEGER NOT NULL,
    "technicalScore" INTEGER NOT NULL,
    "contentScore" INTEGER NOT NULL,
    "onPageScore" INTEGER NOT NULL,
    "uxScore" INTEGER NOT NULL,
    "keyStrengths" TEXT[],
    "opportunities" TEXT[],
    "analysisDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competitor_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notifications" JSONB,
    "theme" TEXT DEFAULT 'system',
    "language" TEXT DEFAULT 'en',
    "timezone" TEXT DEFAULT 'UTC',
    "emailAlerts" BOOLEAN NOT NULL DEFAULT true,
    "weeklyReports" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
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

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_cache" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "urlHash" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "analysisData" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "size" INTEGER NOT NULL DEFAULT 0,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" TEXT NOT NULL DEFAULT '1.0',

    CONSTRAINT "analysis_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_exports" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "analysisId" TEXT,
    "exportType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "downloadUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "requestedBy" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "report_exports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_subscription_verified" ON "users"("subscriptionTier", "emailVerified");

-- CreateIndex
CREATE INDEX "idx_users_created_at" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "idx_users_last_login" ON "users"("lastLogin");

-- CreateIndex
CREATE INDEX "idx_users_verification_token" ON "users"("verificationToken");

-- CreateIndex
CREATE INDEX "idx_users_reset_token" ON "users"("resetToken");

-- CreateIndex
CREATE INDEX "idx_users_account_locked" ON "users"("accountLocked");

-- CreateIndex
CREATE INDEX "idx_password_history_user_id" ON "password_history"("userId");

-- CreateIndex
CREATE INDEX "idx_password_history_created_at" ON "password_history"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_expires_at" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_token" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_user_expires" ON "refresh_tokens"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_created_at" ON "refresh_tokens"("createdAt");

-- CreateIndex
CREATE INDEX "idx_projects_user_id" ON "projects"("userId");

-- CreateIndex
CREATE INDEX "idx_projects_status" ON "projects"("status");

-- CreateIndex
CREATE INDEX "idx_projects_last_scan" ON "projects"("lastScanDate");

-- CreateIndex
CREATE INDEX "idx_projects_current_score" ON "projects"("currentScore");

-- CreateIndex
CREATE INDEX "idx_projects_created_at" ON "projects"("createdAt");

-- CreateIndex
CREATE INDEX "idx_projects_user_status" ON "projects"("userId", "status");

-- CreateIndex
CREATE INDEX "idx_projects_user_last_scan" ON "projects"("userId", "lastScanDate");

-- CreateIndex
CREATE INDEX "idx_projects_user_score" ON "projects"("userId", "currentScore");

-- CreateIndex
CREATE INDEX "idx_projects_user_created" ON "projects"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_projects_url" ON "projects"("url");

-- CreateIndex
CREATE INDEX "idx_projects_url_hash" ON "projects" USING HASH ("url");

-- CreateIndex
CREATE UNIQUE INDEX "projects_userId_url_key" ON "projects"("userId", "url");

-- CreateIndex
CREATE INDEX "idx_crawl_sessions_project_id" ON "crawl_sessions"("projectId");

-- CreateIndex
CREATE INDEX "idx_crawl_sessions_status" ON "crawl_sessions"("status");

-- CreateIndex
CREATE INDEX "idx_crawl_sessions_created_at" ON "crawl_sessions"("createdAt");

-- CreateIndex
CREATE INDEX "idx_crawl_sessions_project_status" ON "crawl_sessions"("projectId", "status");

-- CreateIndex
CREATE INDEX "idx_crawl_sessions_project_history" ON "crawl_sessions"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_crawl_sessions_status_started" ON "crawl_sessions"("status", "startedAt");

-- CreateIndex
CREATE INDEX "idx_crawl_sessions_queue_order" ON "crawl_sessions"("status", "createdAt");

-- CreateIndex
CREATE INDEX "idx_crawl_sessions_completed" ON "crawl_sessions"("completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "seo_analyses_crawlSessionId_key" ON "seo_analyses"("crawlSessionId");

-- CreateIndex
CREATE INDEX "idx_seo_analyses_crawl_session" ON "seo_analyses"("crawlSessionId");

-- CreateIndex
CREATE INDEX "idx_seo_analyses_project_id" ON "seo_analyses"("projectId");

-- CreateIndex
CREATE INDEX "idx_seo_analyses_overall_score" ON "seo_analyses"("overallScore");

-- CreateIndex
CREATE INDEX "idx_seo_analyses_created_at" ON "seo_analyses"("createdAt");

-- CreateIndex
CREATE INDEX "idx_seo_analyses_project_history" ON "seo_analyses"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_seo_analyses_project_score" ON "seo_analyses"("projectId", "overallScore");

-- CreateIndex
CREATE INDEX "idx_seo_analyses_score_time" ON "seo_analyses"("overallScore", "createdAt");

-- CreateIndex
CREATE INDEX "idx_seo_analyses_project_trend" ON "seo_analyses"("projectId", "overallScore", "createdAt");

-- CreateIndex
CREATE INDEX "idx_seo_analyses_all_scores" ON "seo_analyses"("technicalScore", "contentScore", "onpageScore", "uxScore");

-- CreateIndex
CREATE UNIQUE INDEX "seo_score_breakdowns_analysisId_key" ON "seo_score_breakdowns"("analysisId");

-- CreateIndex
CREATE INDEX "idx_score_breakdown_analysis" ON "seo_score_breakdowns"("analysisId");

-- CreateIndex
CREATE INDEX "idx_score_breakdown_created_at" ON "seo_score_breakdowns"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "content_analyses_analysisId_key" ON "content_analyses"("analysisId");

-- CreateIndex
CREATE INDEX "idx_content_analysis_analysis" ON "content_analyses"("analysisId");

-- CreateIndex
CREATE INDEX "idx_content_analysis_score" ON "content_analyses"("overallScore");

-- CreateIndex
CREATE INDEX "idx_content_analysis_word_count" ON "content_analyses"("wordCount");

-- CreateIndex
CREATE INDEX "idx_content_analysis_reading_time" ON "content_analyses"("readingTime");

-- CreateIndex
CREATE INDEX "idx_content_analysis_created_at" ON "content_analyses"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "performance_metrics_analysisId_key" ON "performance_metrics"("analysisId");

-- CreateIndex
CREATE INDEX "idx_performance_metrics_analysis" ON "performance_metrics"("analysisId");

-- CreateIndex
CREATE INDEX "idx_performance_metrics_score" ON "performance_metrics"("performanceScore");

-- CreateIndex
CREATE INDEX "idx_performance_metrics_load_time" ON "performance_metrics"("loadTime");

-- CreateIndex
CREATE INDEX "idx_performance_metrics_page_size" ON "performance_metrics"("pageSize");

-- CreateIndex
CREATE INDEX "idx_performance_metrics_created_at" ON "performance_metrics"("createdAt");

-- CreateIndex
CREATE INDEX "idx_seo_issues_analysis" ON "seo_issues"("analysisId");

-- CreateIndex
CREATE INDEX "idx_seo_issues_severity" ON "seo_issues"("severity");

-- CreateIndex
CREATE INDEX "idx_seo_issues_status" ON "seo_issues"("status");

-- CreateIndex
CREATE INDEX "idx_seo_issues_category" ON "seo_issues"("category");

-- CreateIndex
CREATE INDEX "idx_seo_issues_complexity" ON "seo_issues"("fixComplexity");

-- CreateIndex
CREATE INDEX "idx_seo_issues_type" ON "seo_issues"("type");

-- CreateIndex
CREATE INDEX "idx_seo_issues_business_impact" ON "seo_issues"("businessImpact");

-- CreateIndex
CREATE INDEX "idx_seo_issues_analysis_severity" ON "seo_issues"("analysisId", "severity");

-- CreateIndex
CREATE INDEX "idx_seo_issues_analysis_status" ON "seo_issues"("analysisId", "status");

-- CreateIndex
CREATE INDEX "idx_seo_issues_analysis_category" ON "seo_issues"("analysisId", "category");

-- CreateIndex
CREATE INDEX "idx_seo_issues_severity_status" ON "seo_issues"("severity", "status");

-- CreateIndex
CREATE INDEX "idx_seo_issues_created_at" ON "seo_issues"("createdAt");

-- CreateIndex
CREATE INDEX "idx_seo_issues_blocking" ON "seo_issues"("blockingIndexing");

-- CreateIndex
CREATE INDEX "idx_seo_issues_security" ON "seo_issues"("securityConcern");

-- CreateIndex
CREATE INDEX "idx_seo_issues_priority" ON "seo_issues"("analysisId", "severity", "businessImpact");

-- CreateIndex
CREATE INDEX "idx_seo_recommendations_analysis" ON "seo_recommendations"("analysisId");

-- CreateIndex
CREATE INDEX "idx_seo_recommendations_priority" ON "seo_recommendations"("priority");

-- CreateIndex
CREATE INDEX "idx_seo_recommendations_category" ON "seo_recommendations"("category");

-- CreateIndex
CREATE INDEX "idx_seo_recommendations_status" ON "seo_recommendations"("status");

-- CreateIndex
CREATE INDEX "idx_seo_recommendations_quick_win" ON "seo_recommendations"("quickWin");

-- CreateIndex
CREATE INDEX "idx_seo_recommendations_business_value" ON "seo_recommendations"("businessValue");

-- CreateIndex
CREATE INDEX "idx_seo_recommendations_analysis_priority" ON "seo_recommendations"("analysisId", "priority");

-- CreateIndex
CREATE INDEX "idx_seo_recommendations_analysis_status" ON "seo_recommendations"("analysisId", "status");

-- CreateIndex
CREATE INDEX "idx_seo_recommendations_priority_status" ON "seo_recommendations"("priority", "status");

-- CreateIndex
CREATE INDEX "idx_seo_recommendations_created_at" ON "seo_recommendations"("createdAt");

-- CreateIndex
CREATE INDEX "idx_seo_recommendations_effort_value" ON "seo_recommendations"("effortLevel", "businessValue");

-- CreateIndex
CREATE INDEX "idx_seo_recommendations_optimization" ON "seo_recommendations"("quickWin", "businessValue", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "meta_tags_analysisId_key" ON "meta_tags"("analysisId");

-- CreateIndex
CREATE INDEX "idx_meta_tags_analysis" ON "meta_tags"("analysisId");

-- CreateIndex
CREATE INDEX "idx_meta_tags_title_length" ON "meta_tags"("titleLength");

-- CreateIndex
CREATE INDEX "idx_meta_tags_desc_length" ON "meta_tags"("descriptionLength");

-- CreateIndex
CREATE UNIQUE INDEX "technical_analyses_analysisId_key" ON "technical_analyses"("analysisId");

-- CreateIndex
CREATE INDEX "idx_technical_analysis_analysis" ON "technical_analyses"("analysisId");

-- CreateIndex
CREATE INDEX "idx_technical_analysis_created_at" ON "technical_analyses"("createdAt");

-- CreateIndex
CREATE INDEX "idx_project_trends_project_id" ON "project_trends"("projectId");

-- CreateIndex
CREATE INDEX "idx_project_trends_date" ON "project_trends"("date");

-- CreateIndex
CREATE INDEX "idx_project_trends_project_date" ON "project_trends"("projectId", "date");

-- CreateIndex
CREATE INDEX "idx_project_trends_overall_score" ON "project_trends"("overallScore");

-- CreateIndex
CREATE INDEX "idx_project_trends_date_score" ON "project_trends"("date", "overallScore");

-- CreateIndex
CREATE INDEX "idx_project_trends_project_score_time" ON "project_trends"("projectId", "overallScore", "date");

-- CreateIndex
CREATE INDEX "idx_project_trends_critical_issues" ON "project_trends"("projectId", "criticalIssues", "date");

-- CreateIndex
CREATE INDEX "idx_project_trends_performance" ON "project_trends"("performanceScore", "date");

-- CreateIndex
CREATE UNIQUE INDEX "project_trends_projectId_date_key" ON "project_trends"("projectId", "date");

-- CreateIndex
CREATE INDEX "idx_issue_trends_project_id" ON "issue_trends"("projectId");

-- CreateIndex
CREATE INDEX "idx_issue_trends_date" ON "issue_trends"("date");

-- CreateIndex
CREATE INDEX "idx_issue_trends_issue_type" ON "issue_trends"("issueType");

-- CreateIndex
CREATE INDEX "idx_issue_trends_severity" ON "issue_trends"("issueSeverity");

-- CreateIndex
CREATE INDEX "idx_issue_trends_project_date" ON "issue_trends"("projectId", "date");

-- CreateIndex
CREATE INDEX "idx_issue_trends_project_type" ON "issue_trends"("projectId", "issueType");

-- CreateIndex
CREATE INDEX "idx_issue_trends_date_severity" ON "issue_trends"("date", "issueSeverity");

-- CreateIndex
CREATE INDEX "idx_issue_trends_project_severity_time" ON "issue_trends"("projectId", "issueSeverity", "date");

-- CreateIndex
CREATE UNIQUE INDEX "issue_trends_projectId_issueType_date_key" ON "issue_trends"("projectId", "issueType", "date");

-- CreateIndex
CREATE INDEX "idx_competitor_analysis_project" ON "competitor_analyses"("projectId");

-- CreateIndex
CREATE INDEX "idx_competitor_analysis_date" ON "competitor_analyses"("analysisDate");

-- CreateIndex
CREATE INDEX "idx_competitor_analysis_score" ON "competitor_analyses"("overallScore");

-- CreateIndex
CREATE INDEX "idx_competitor_analysis_project_date" ON "competitor_analyses"("projectId", "analysisDate");

-- CreateIndex
CREATE INDEX "idx_competitor_analysis_url" ON "competitor_analyses"("competitorUrl");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

-- CreateIndex
CREATE INDEX "idx_user_settings_user_id" ON "user_settings"("userId");

-- CreateIndex
CREATE INDEX "idx_activity_logs_user_id" ON "activity_logs"("userId");

-- CreateIndex
CREATE INDEX "idx_activity_logs_action" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "idx_activity_logs_created_at" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE INDEX "idx_activity_logs_user_time" ON "activity_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_activity_logs_action_time" ON "activity_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "idx_activity_logs_entity" ON "activity_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "idx_activity_logs_user_action_time" ON "activity_logs"("userId", "action", "createdAt");

-- CreateIndex
CREATE INDEX "idx_notifications_user_id" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "idx_notifications_type" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "idx_notifications_read_at" ON "notifications"("readAt");

-- CreateIndex
CREATE INDEX "idx_notifications_created_at" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "idx_notifications_user_read" ON "notifications"("userId", "readAt");

-- CreateIndex
CREATE INDEX "idx_notifications_user_type" ON "notifications"("userId", "type");

-- CreateIndex
CREATE INDEX "idx_notifications_user_time" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_notifications_entity" ON "notifications"("relatedEntityType", "relatedEntityId");

-- CreateIndex
CREATE INDEX "idx_notifications_user_status_time" ON "notifications"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "analysis_cache_key_key" ON "analysis_cache"("key");

-- CreateIndex
CREATE UNIQUE INDEX "analysis_cache_urlHash_key" ON "analysis_cache"("urlHash");

-- CreateIndex
CREATE INDEX "idx_analysis_cache_key" ON "analysis_cache"("key");

-- CreateIndex
CREATE INDEX "idx_analysis_cache_url_hash" ON "analysis_cache"("urlHash");

-- CreateIndex
CREATE INDEX "idx_analysis_cache_expires" ON "analysis_cache"("expiresAt");

-- CreateIndex
CREATE INDEX "idx_analysis_cache_tags" ON "analysis_cache"("tags");

-- CreateIndex
CREATE INDEX "idx_analysis_cache_last_accessed" ON "analysis_cache"("lastAccessed");

-- CreateIndex
CREATE INDEX "idx_analysis_cache_size" ON "analysis_cache"("size");

-- CreateIndex
CREATE INDEX "idx_analysis_cache_created_at" ON "analysis_cache"("createdAt");

-- CreateIndex
CREATE INDEX "idx_analysis_cache_usage" ON "analysis_cache"("accessCount", "lastAccessed");

-- CreateIndex
CREATE INDEX "idx_analysis_cache_version_expires" ON "analysis_cache"("version", "expiresAt");

-- CreateIndex
CREATE INDEX "idx_analysis_cache_url_expires" ON "analysis_cache"("url", "expiresAt");

-- CreateIndex
CREATE INDEX "idx_report_exports_project" ON "report_exports"("projectId");

-- CreateIndex
CREATE INDEX "idx_report_exports_status" ON "report_exports"("status");

-- CreateIndex
CREATE INDEX "idx_report_exports_created_at" ON "report_exports"("createdAt");

-- CreateIndex
CREATE INDEX "idx_report_exports_requested_by" ON "report_exports"("requestedBy");

-- CreateIndex
CREATE INDEX "idx_report_exports_type" ON "report_exports"("exportType");

-- CreateIndex
CREATE INDEX "idx_report_exports_project_status" ON "report_exports"("projectId", "status");

-- CreateIndex
CREATE INDEX "idx_report_exports_user_time" ON "report_exports"("requestedBy", "createdAt");

-- CreateIndex
CREATE INDEX "idx_report_exports_status_time" ON "report_exports"("status", "createdAt");

-- CreateIndex
CREATE INDEX "idx_report_exports_completed" ON "report_exports"("completedAt");

-- AddForeignKey
ALTER TABLE "password_history" ADD CONSTRAINT "password_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crawl_sessions" ADD CONSTRAINT "crawl_sessions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_analyses" ADD CONSTRAINT "seo_analyses_crawlSessionId_fkey" FOREIGN KEY ("crawlSessionId") REFERENCES "crawl_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_analyses" ADD CONSTRAINT "seo_analyses_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_score_breakdowns" ADD CONSTRAINT "seo_score_breakdowns_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "seo_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_analyses" ADD CONSTRAINT "content_analyses_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "seo_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_metrics" ADD CONSTRAINT "performance_metrics_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "seo_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_issues" ADD CONSTRAINT "seo_issues_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "seo_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_recommendations" ADD CONSTRAINT "seo_recommendations_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "seo_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_recommendations" ADD CONSTRAINT "seo_recommendations_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "seo_issues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_tags" ADD CONSTRAINT "meta_tags_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "seo_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

