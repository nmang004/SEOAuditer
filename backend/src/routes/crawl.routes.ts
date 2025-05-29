import { Router } from 'express';
import { CrawlController } from '../controllers/crawl.controller';

const router = Router();

router.post('/start', CrawlController.startCrawl);
router.get('/status/:jobId', CrawlController.getStatus);
router.get('/results/:jobId', CrawlController.getResults);
router.post('/cancel/:jobId', CrawlController.cancelCrawl);
router.get('/screenshot/:jobId', CrawlController.getScreenshot);

export default router; 