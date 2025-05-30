import fs from 'fs';
import path from 'path';
import { prisma } from '@/index';

export class StorageAdapter {
  async saveResult(jobId: string, result: any) {
    // Save crawl result to DB using Prisma models
    // jobId = CrawlSession.id
    const { projectId, userId: _userId, startedAt, completedAt, pages, issues, recommendations: _recommendations, score } = result;
    // Upsert CrawlSession
    await prisma.crawlSession.upsert({
      where: { id: jobId },
      update: {
        status: 'completed',
        completedAt: completedAt ? new Date(completedAt) : new Date(),
        errorMessage: null,
      },
      create: {
        id: jobId,
        projectId,
        url: pages?.[0]?.url || '',
        status: 'completed',
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        completedAt: completedAt ? new Date(completedAt) : new Date(),
      },
    });
    // Upsert SEOAnalysis (one per crawl session)
    const analysis = await prisma.sEOAnalysis.upsert({
      where: { crawlSessionId: jobId },
      update: {
        overallScore: score || 0,
        projectId,
      },
      create: {
        crawlSessionId: jobId,
        projectId,
        overallScore: score || 0,
      },
    });
    // Delete old issues/metatags for this analysis
    await prisma.sEOIssue.deleteMany({ where: { analysisId: analysis.id } });
    await prisma.metaTags.deleteMany({ where: { analysisId: analysis.id } });
    // Insert issues
    if (issues && Array.isArray(issues)) {
      for (const issue of issues) {
        await prisma.sEOIssue.create({
          data: {
            analysisId: analysis.id,
            type: issue.type || 'unknown',
            severity: issue.severity || 'low',
            title: issue.title || issue.error || 'Issue',
            description: issue.description || '',
            recommendation: issue.recommendation || '',
            affectedElements: issue.affectedElements || undefined,
            status: 'new',
            category: issue.category || 'technical',
            affectedPages: issue.affectedPages || 1,
          },
        });
      }
    }
    // Insert meta tags for the first page (if present)
    if (pages && pages[0] && pages[0].meta) {
      await prisma.metaTags.create({
        data: {
          analysisId: analysis.id,
          ...pages[0].meta,
        },
      });
    }
  }

  async getResult(jobId: string): Promise<any> {
    // Retrieve crawl result from DB using Prisma models
    const crawlSession = await prisma.crawlSession.findUnique({
      where: { id: jobId },
      include: {
        analysis: {
          include: {
            issues: true,
            metaTags: true,
          },
        },
      },
    });
    if (!crawlSession) return null;
    return crawlSession;
  }

  async saveScreenshot(jobId: string, pageUrl: string, buffer: Buffer) {
    const dir = path.resolve(__dirname, '../../../screenshots', jobId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const fileName = this.screenshotFileName(pageUrl);
    const filePath = path.join(dir, fileName);
    await fs.promises.writeFile(filePath, buffer);
    return filePath;
  }

  async getScreenshot(jobId: string, pageUrl: string): Promise<Buffer | null> {
    const dir = path.resolve(__dirname, '../../../screenshots', jobId);
    const fileName = this.screenshotFileName(pageUrl);
    const filePath = path.join(dir, fileName);
    if (!fs.existsSync(filePath)) return null;
    return await fs.promises.readFile(filePath);
  }

  private screenshotFileName(pageUrl: string): string {
    // Use a hash of the URL for filename
    const hash = Buffer.from(pageUrl).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
    return `${hash}.png`;
  }
} 