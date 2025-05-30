import { Request, Response } from 'express';
import { CrawlManager } from '../seo-crawler/engine/CrawlManager';
import { QueueAdapter } from '../seo-crawler/queue/QueueAdapter';
import { WebSocketGateway } from '../seo-crawler/ws/WebSocketGateway';
import { StorageAdapter } from '../seo-crawler/storage/StorageAdapter';
import { PrismaClient } from '@prisma/client';

const queueAdapter = new QueueAdapter();
const crawlManager = new CrawlManager(queueAdapter);
const wsGateway = new WebSocketGateway();
const storage = new StorageAdapter();
const prisma = new PrismaClient();

// Helper function to save crawl results to database
async function saveCrawlToDatabase(jobId: string, projectId: string, userId: string) {
  try {
    const status = await crawlManager.getStatus(jobId);
    const results = await crawlManager.getResults(jobId);
    
    if (!status || !results || status.status !== 'completed') {
      return; // Don't save incomplete crawls
    }

    // Create crawl session
    const crawlSession = await prisma.crawlSession.create({
      data: {
        id: jobId,
        projectId: projectId,
        status: 'completed',
        startedAt: status.startedAt,
        completedAt: status.completedAt || new Date(),
        url: results.url
      }
    });

    // Create SEO analysis from results
    if (results.summary) {
      const analysis = await prisma.sEOAnalysis.create({
        data: {
          crawlSessionId: crawlSession.id,
          projectId: projectId,
          overallScore: results.summary.overallScore || 0,
          technicalScore: results.summary.technicalScore || 0,
          contentScore: results.summary.contentScore || 0,
          onpageScore: results.summary.onpageScore || 0,
          uxScore: results.summary.uxScore || 0
        }
      });

      // Create issues if any
      if (results.issues && results.issues.length > 0) {
        const issuesData = results.issues.map((issue: any) => ({
          analysisId: analysis.id,
          type: issue.type || 'unknown',
          severity: issue.severity === 'high' ? 'critical' : 
                   issue.severity === 'medium' ? 'high' : 'medium',
          title: issue.message || issue.title || 'SEO Issue',
          description: issue.description || issue.message || null,
          category: issue.type || 'general'
        }));

        await prisma.sEOIssue.createMany({
          data: issuesData
        });
      }
    }

    console.log(`Saved crawl ${jobId} to database`);
  } catch (error) {
    console.error(`Failed to save crawl ${jobId} to database:`, error);
  }
}

export const CrawlController = {
  async startCrawl(req: Request, res: Response) {
    try {
      const { projectId } = req.body;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Validate projectId
      const project = await prisma.project.findFirst({ 
        where: { id: projectId, userId: userId } 
      });
      if (!project) {
        return res.status(400).json({ error: 'Invalid project ID' });
      }

      // Add project URL to config
      const config = {
        ...req.body,
        url: project.url,
        userId: userId
      };
      
      const jobId = await crawlManager.startCrawl(config);
      
      // Start a background process to save to database when complete
      setTimeout(async () => {
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds max wait
        
        while (attempts < maxAttempts) {
          const status = await crawlManager.getStatus(jobId);
          if (status && (status.status === 'completed' || status.status === 'failed')) {
            if (status.status === 'completed') {
              await saveCrawlToDatabase(jobId, projectId, userId);
            }
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          attempts++;
        }
      }, 1000);
      
      // Optionally emit job started event
      wsGateway.emitProgress(jobId, { status: 'started' });
      return res.status(202).json({ jobId });
    } catch (err) {
      const error = err as Error;
      return res.status(500).json({ error: 'Failed to start crawl', details: error.message });
    }
  },

  async getStatus(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const status = await crawlManager.getStatus(jobId);
      return res.json({ jobId, status });
    } catch (err) {
      const error = err as Error;
      return res.status(500).json({ error: 'Failed to get status', details: error.message });
    }
  },

  async getResults(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      
      // First try to get from memory (CrawlManager)
      let results = await crawlManager.getResults(jobId);
      
      // If not in memory, try to get from database and reconstruct results
      if (!results) {
        const crawlSession = await prisma.crawlSession.findUnique({
          where: { id: jobId },
          include: {
            analysis: {
              include: {
                issues: true
              }
            }
          }
        });
        
        if (crawlSession && crawlSession.analysis) {
          // Reconstruct results format from database data
          const analysis = crawlSession.analysis;
          results = {
            url: crawlSession.url,
            crawledAt: crawlSession.completedAt?.toISOString() || crawlSession.startedAt?.toISOString(),
            pages: [{
              status: 200,
              title: 'Analysis Results',
              description: '',
              url: crawlSession.url,
              statusCode: 200,
              metadata: {
                title: 'Analysis Results',
                description: '',
                keywords: ''
              },
              scores: {
                overall: analysis.overallScore || 0,
                technical: analysis.technicalScore || 0,
                content: analysis.contentScore || 0,
                onpage: analysis.onpageScore || 0,
                ux: analysis.uxScore || 0
              },
              stats: {
                h1Count: 1,
                imgWithoutAlt: 0,
                internalLinks: 0,
                externalLinks: 0
              },
              issues: analysis.issues.map(issue => ({
                type: issue.type,
                severity: issue.severity,
                message: issue.title,
                description: issue.description
              })),
              recommendations: []
            }],
            summary: {
              totalPages: 1,
              crawlDuration: 0,
              overallScore: analysis.overallScore || 0,
              technicalScore: analysis.technicalScore || 0,
              contentScore: analysis.contentScore || 0,
              onpageScore: analysis.onpageScore || 0,
              uxScore: analysis.uxScore || 0
            },
            issues: analysis.issues.map(issue => ({
              type: issue.type,
              severity: issue.severity,
              message: issue.title,
              description: issue.description
            })),
            recommendations: []
          };
        }
      }
      
      return res.json({ jobId, results });
    } catch (err) {
      const error = err as Error;
      return res.status(500).json({ error: 'Failed to get results', details: error.message });
    }
  },

  async cancelCrawl(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      await crawlManager.cancelCrawl(jobId);
      wsGateway.emitProgress(jobId, { status: 'cancelled' });
      return res.json({ jobId, status: 'cancelled' });
    } catch (err) {
      const error = err as Error;
      return res.status(500).json({ error: 'Failed to cancel crawl', details: error.message });
    }
  },

  async getScreenshot(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const pageUrl = req.query.pageUrl as string;
      if (!pageUrl) return res.status(400).json({ error: 'Missing pageUrl query param' });
      const buffer = await storage.getScreenshot(jobId, pageUrl);
      if (!buffer) return res.status(404).json({ error: 'Screenshot not found' });
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'inline; filename="screenshot.png"');
      return res.send(buffer);
    } catch (err) {
      const error = err as Error;
      return res.status(500).json({ error: 'Failed to get screenshot', details: error.message });
    }
  },
}; 