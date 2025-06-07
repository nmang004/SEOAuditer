import { Router } from 'express';
import { CrawlController } from '../controllers/crawl.controller';
import { authenticateToken } from '../middleware/auth-rs256.middleware';

const router = Router();

// Apply authentication middleware to all routes (SECURITY: RS256 PROTECTION)
router.use(authenticateToken);

router.post('/start', CrawlController.startCrawl);
router.get('/status/:jobId', CrawlController.getStatus);
router.get('/results/:jobId', CrawlController.getResults);
router.post('/cancel/:jobId', CrawlController.cancelCrawl);
router.get('/screenshot/:jobId', CrawlController.getScreenshot);

export default router; 