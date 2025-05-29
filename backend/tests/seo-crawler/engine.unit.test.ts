import { CrawlerEngine } from '../../src/seo-crawler/engine/CrawlerEngine';
import { StorageAdapter } from '../../src/seo-crawler/storage/StorageAdapter';
import { PageAnalyzer } from '../../src/seo-crawler/engine/PageAnalyzer';

jest.mock('../../src/seo-crawler/storage/StorageAdapter');
jest.mock('../../src/seo-crawler/engine/PageAnalyzer');

describe('CrawlerEngine', () => {
  let engine: CrawlerEngine;
  let storage: StorageAdapter;
  let config: any;

  beforeEach(() => {
    storage = new StorageAdapter() as any;
    config = {
      url: 'https://example.com',
      projectId: 'test-project',
      userId: 'test-user',
      crawlOptions: { maxPages: 1, crawlDepth: 1, extractOptions: {} },
    };
    engine = new CrawlerEngine(config, storage);
  });

  it('should crawl pages and save results (happy path)', async () => {
    // TODO: Mock PageAnalyzer to return a fake analysis
    // TODO: Assert storage.saveResult is called
    // TODO: Assert crawl result structure
  });

  it('should handle errors during page analysis', async () => {
    // TODO: Mock PageAnalyzer to throw
    // TODO: Assert errors are logged and included in issues
  });

  it('should respect isAllowed logic', () => {
    // TODO: Test isAllowed with allowedDomains and excludePatterns
  });
}); 