-- CreateEnum
CREATE TYPE "CrawlType" AS ENUM ('single', 'subfolder', 'domain');
CREATE TYPE "CrawlStatus" AS ENUM ('pending', 'running', 'paused', 'completed', 'failed');
CREATE TYPE "PageStatus" AS ENUM ('success', 'error', 'skipped');

-- Update existing tables
ALTER TABLE "CrawlJob" ADD COLUMN "crawl_type" "CrawlType" DEFAULT 'single';
ALTER TABLE "CrawlJob" ADD COLUMN "crawl_config" JSONB;
ALTER TABLE "CrawlJob" ADD COLUMN "pages_crawled" INTEGER DEFAULT 1;
ALTER TABLE "CrawlJob" ADD COLUMN "pages_queued" INTEGER DEFAULT 0;
ALTER TABLE "CrawlJob" ADD COLUMN "start_url" TEXT;
ALTER TABLE "CrawlJob" ADD COLUMN "depth" INTEGER DEFAULT 0;

-- CreateTable for crawl sessions
CREATE TABLE "CrawlSession" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "crawl_type" "CrawlType" NOT NULL DEFAULT 'single',
    "status" "CrawlStatus" NOT NULL DEFAULT 'pending',
    "start_url" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "pages_crawled" INTEGER DEFAULT 0,
    "pages_queued" INTEGER DEFAULT 0,
    "max_depth" INTEGER DEFAULT 1,
    "total_pages" INTEGER DEFAULT 0,
    "successful_pages" INTEGER DEFAULT 0,
    "error_pages" INTEGER DEFAULT 0,
    "avg_score" DECIMAL(5,2) DEFAULT 0,
    "total_issues" INTEGER DEFAULT 0,
    "critical_issues" INTEGER DEFAULT 0,
    "duration" INTEGER DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "project_id" INTEGER,

    CONSTRAINT "CrawlSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable for individual crawled pages
CREATE TABLE "CrawlPage" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "status" "PageStatus" NOT NULL DEFAULT 'success',
    "error_message" TEXT,
    "response_time" INTEGER,
    "parent_url" TEXT,
    "priority" INTEGER DEFAULT 50,
    "source" TEXT DEFAULT 'link',
    "analysis_id" INTEGER,
    "crawled_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrawlPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable for crawl queue
CREATE TABLE "CrawlQueue" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER DEFAULT 50,
    "status" "CrawlStatus" DEFAULT 'pending',
    "parent_url" TEXT,
    "source" TEXT DEFAULT 'link',
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "CrawlQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable for cross-page insights
CREATE TABLE "CrossPageInsight" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "insight_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "affected_urls" TEXT[],
    "details" JSONB,
    "recommendation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrossPageInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable for duplicate content groups
CREATE TABLE "DuplicateContentGroup" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "content_hash" TEXT NOT NULL,
    "similarity" DECIMAL(5,2) NOT NULL,
    "urls" TEXT[],
    "canonical_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DuplicateContentGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable for broken links
CREATE TABLE "BrokenLink" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "found_on" TEXT[],
    "status_code" INTEGER,
    "error_message" TEXT,
    "link_text" TEXT,
    "link_type" TEXT DEFAULT 'internal',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrokenLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable for site structure analysis
CREATE TABLE "SiteStructureNode" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "depth" INTEGER NOT NULL,
    "parent_url" TEXT,
    "children_count" INTEGER DEFAULT 0,
    "internal_links_count" INTEGER DEFAULT 0,
    "external_links_count" INTEGER DEFAULT 0,
    "page_type" TEXT,
    "importance_score" INTEGER DEFAULT 50,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteStructureNode_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes for performance
CREATE UNIQUE INDEX "CrawlSession_session_id_key" ON "CrawlSession"("session_id");
CREATE INDEX "CrawlSession_user_id_idx" ON "CrawlSession"("user_id");
CREATE INDEX "CrawlSession_project_id_idx" ON "CrawlSession"("project_id");
CREATE INDEX "CrawlSession_status_idx" ON "CrawlSession"("status");
CREATE INDEX "CrawlSession_created_at_idx" ON "CrawlSession"("created_at");

CREATE INDEX "CrawlPage_session_id_idx" ON "CrawlPage"("session_id");
CREATE INDEX "CrawlPage_url_idx" ON "CrawlPage"("url");
CREATE INDEX "CrawlPage_status_idx" ON "CrawlPage"("status");
CREATE INDEX "CrawlPage_depth_idx" ON "CrawlPage"("depth");
CREATE INDEX "CrawlPage_session_url_idx" ON "CrawlPage"("session_id", "url");

CREATE INDEX "CrawlQueue_session_id_idx" ON "CrawlQueue"("session_id");
CREATE INDEX "CrawlQueue_status_idx" ON "CrawlQueue"("status");
CREATE INDEX "CrawlQueue_priority_idx" ON "CrawlQueue"("priority" DESC, "added_at" ASC);
CREATE INDEX "CrawlQueue_session_status_idx" ON "CrawlQueue"("session_id", "status");

CREATE INDEX "CrossPageInsight_session_id_idx" ON "CrossPageInsight"("session_id");
CREATE INDEX "CrossPageInsight_insight_type_idx" ON "CrossPageInsight"("insight_type");
CREATE INDEX "CrossPageInsight_severity_idx" ON "CrossPageInsight"("severity");

CREATE INDEX "DuplicateContentGroup_session_id_idx" ON "DuplicateContentGroup"("session_id");
CREATE INDEX "DuplicateContentGroup_content_hash_idx" ON "DuplicateContentGroup"("content_hash");

CREATE INDEX "BrokenLink_session_id_idx" ON "BrokenLink"("session_id");
CREATE INDEX "BrokenLink_url_idx" ON "BrokenLink"("url");
CREATE INDEX "BrokenLink_status_code_idx" ON "BrokenLink"("status_code");

CREATE INDEX "SiteStructureNode_session_id_idx" ON "SiteStructureNode"("session_id");
CREATE INDEX "SiteStructureNode_url_idx" ON "SiteStructureNode"("url");
CREATE INDEX "SiteStructureNode_depth_idx" ON "SiteStructureNode"("depth");
CREATE INDEX "SiteStructureNode_parent_url_idx" ON "SiteStructureNode"("parent_url");

-- AddForeignKey
ALTER TABLE "CrawlSession" ADD CONSTRAINT "CrawlSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrawlSession" ADD CONSTRAINT "CrawlSession_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CrawlPage" ADD CONSTRAINT "CrawlPage_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "CrawlSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrawlPage" ADD CONSTRAINT "CrawlPage_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "SEOAnalysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CrawlQueue" ADD CONSTRAINT "CrawlQueue_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "CrawlSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CrossPageInsight" ADD CONSTRAINT "CrossPageInsight_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "CrawlSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DuplicateContentGroup" ADD CONSTRAINT "DuplicateContentGroup_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "CrawlSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BrokenLink" ADD CONSTRAINT "BrokenLink_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "CrawlSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SiteStructureNode" ADD CONSTRAINT "SiteStructureNode_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "CrawlSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;