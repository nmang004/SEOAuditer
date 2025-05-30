import { Router } from 'express';
import { CrawlController } from '../controllers/crawl.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

router.post('/start', CrawlController.startCrawl);
router.get('/status/:jobId', CrawlController.getStatus);
router.get('/results/:jobId', CrawlController.getResults);
router.post('/cancel/:jobId', CrawlController.cancelCrawl);
router.get('/screenshot/:jobId', CrawlController.getScreenshot);

export default router; 