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

export const CrawlController = {
  async startCrawl(req: Request, res: Response) {
    try {
      const { projectId } = req.body;
      // Validate projectId
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) {
        return res.status(400).json({ error: 'Invalid project ID' });
      }
      const config = req.body;
      const jobId = await crawlManager.startCrawl(config);
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
      const results = await crawlManager.getResults(jobId);
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