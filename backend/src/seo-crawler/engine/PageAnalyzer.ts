import axios from 'axios';
import * as cheerio from 'cheerio';
import { CrawlerConfig } from '../types/CrawlerConfig';
import { PageAnalysis } from '../types/PageAnalysis';
import { TechnicalSEO } from './AnalysisModules/TechnicalSEO';
import { OnPageSEO } from './AnalysisModules/OnPageSEO';
import { ContentQuality } from './AnalysisModules/ContentQuality';
import { StructuredData } from './AnalysisModules/StructuredData';
import { Scoring } from './AnalysisModules/Scoring';
import { Recommendations } from './AnalysisModules/Recommendations';
import { StorageAdapter } from '../storage/StorageAdapter';

let puppeteer: typeof import('puppeteer') | undefined;
let lighthouse: typeof import('lighthouse') | undefined;
try {
  puppeteer = require('puppeteer');
  lighthouse = require('lighthouse');
} catch {}

export class PageAnalyzer {
  constructor(private config: CrawlerConfig) {}

  async analyzePage(url: string): Promise<PageAnalysis> {
    const usePuppeteer =
      (this.config.crawlOptions.extractOptions.screenshots ||
        this.config.crawlOptions.extractOptions.performanceMetrics) &&
      puppeteer;
    let html = '';
    let response: any = undefined;
    let screenshot: Buffer | undefined = undefined;
    let screenshotPath: string | undefined = undefined;
    let browser: any = undefined;
    let page: any = undefined;
    let lighthouseMetrics: any = undefined;
    const storage = new StorageAdapter();
    try {
      if (usePuppeteer) {
        browser = await puppeteer!.launch({ headless: 'new', args: ['--remote-debugging-port=9222'] });
        page = await browser.newPage();
        await page.setUserAgent(this.config.crawlOptions.userAgent || 'SEO-Analyzer/1.0');
        await page.setViewport(this.config.crawlOptions.viewport || { width: 1200, height: 800 });
        const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: this.config.crawlOptions.timeout || 30000 });
        html = await page.content();
        response = { status: resp?.status(), headers: resp?.headers() };
        if (this.config.crawlOptions.extractOptions.screenshots) {
          screenshot = await page.screenshot({ fullPage: true });
          screenshotPath = await storage.saveScreenshot(this.config['jobId'] || 'default', url, screenshot);
        }
        // Run Lighthouse for Core Web Vitals/performance, accessibility, best-practices if requested
        if (this.config.crawlOptions.extractOptions.performanceMetrics && lighthouse) {
          const { lhr } = await lighthouse(url, {
            port: 9222,
            output: 'json',
            onlyCategories: ['performance', 'accessibility', 'best-practices'],
            disableStorageReset: true,
            logLevel: 'error',
          });
          lighthouseMetrics = {
            performanceScore: lhr.categories.performance?.score,
            accessibilityScore: lhr.categories.accessibility?.score,
            bestPracticesScore: lhr.categories['best-practices']?.score,
            firstContentfulPaint: lhr.audits['first-contentful-paint']?.numericValue,
            largestContentfulPaint: lhr.audits['largest-contentful-paint']?.numericValue,
            cumulativeLayoutShift: lhr.audits['cumulative-layout-shift']?.numericValue,
            speedIndex: lhr.audits['speed-index']?.numericValue,
            totalBlockingTime: lhr.audits['total-blocking-time']?.numericValue,
            timeToInteractive: lhr.audits['interactive']?.numericValue,
          };
        }
      } else {
        // Fallback to axios
        const resp = await axios.get(url, {
          headers: {
            'User-Agent': this.config.crawlOptions.userAgent || 'SEO-Analyzer/1.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml',
          },
          timeout: this.config.crawlOptions.timeout || 30000,
          maxRedirects: 5,
          validateStatus: (status) => status < 500,
        });
        html = resp.data;
        response = resp;
      }
      const $ = cheerio.load(html);
      const pageContext = { url, html, $, response, config: this.config, browser, page, screenshot, lighthouseMetrics };
      // Run analysis modules
      const technicalSEO = await new TechnicalSEO().analyze(pageContext);
      const onPageSEO = await new OnPageSEO().analyze(pageContext);
      const contentQuality = await new ContentQuality().analyze(pageContext);
      const structuredData = await new StructuredData().analyze(pageContext);
      const scoring = await new Scoring().analyze(pageContext);
      const recommendations = await new Recommendations().analyze(pageContext);
      // Aggregate results
      const result: PageAnalysis = {
        url,
        statusCode: response.status,
        ...technicalSEO,
        ...onPageSEO,
        ...contentQuality,
        ...structuredData,
        ...scoring,
        recommendations: recommendations.recommendations || [],
        rawHtml: html,
        screenshotPath,
        lighthouseMetrics,
      };
      if (browser) await browser.close();
      return result;
    } catch (error: any) {
      if (browser) await browser.close();
      // Fallback to axios if Puppeteer fails
      if (usePuppeteer && !html) {
        try {
          const resp = await axios.get(url, {
            headers: {
              'User-Agent': this.config.crawlOptions.userAgent || 'SEO-Analyzer/1.0',
              'Accept': 'text/html,application/xhtml+xml,application/xml',
            },
            timeout: this.config.crawlOptions.timeout || 30000,
            maxRedirects: 5,
            validateStatus: (status) => status < 500,
          });
          html = resp.data;
          response = resp;
          const $ = cheerio.load(html);
          const pageContext = { url, html, $, response, config: this.config };
          const technicalSEO = await new TechnicalSEO().analyze(pageContext);
          const onPageSEO = await new OnPageSEO().analyze(pageContext);
          const contentQuality = await new ContentQuality().analyze(pageContext);
          const structuredData = await new StructuredData().analyze(pageContext);
          const scoring = await new Scoring().analyze(pageContext);
          const recommendations = await new Recommendations().analyze(pageContext);
          const result: PageAnalysis = {
            url,
            statusCode: response.status,
            ...technicalSEO,
            ...onPageSEO,
            ...contentQuality,
            ...structuredData,
            ...scoring,
            recommendations: recommendations.recommendations || [],
            rawHtml: html,
          };
          return result;
        } catch (err: any) {
          return {
            url,
            statusCode: err?.response?.status || 0,
            error: err?.message || 'Unknown error',
          } as PageAnalysis;
        }
      }
      return {
        url,
        statusCode: error?.response?.status || 0,
        error: error?.message || 'Unknown error',
      } as PageAnalysis;
    }
  }
} 