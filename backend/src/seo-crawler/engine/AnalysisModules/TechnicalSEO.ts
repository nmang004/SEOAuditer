import { PageAnalysis } from '../../types/PageAnalysis';
import axios from 'axios';

export class TechnicalSEO {
  async analyze(pageContext: any): Promise<Partial<PageAnalysis>> {
    const { url, response, $, html } = pageContext;
    const headers = response?.headers || {};
    const contentType = headers['content-type'] || '';
    const hasHttps = url.startsWith('https://');
    const canonical = $('link[rel="canonical"]').attr('href') || null;
    const robotsMeta = $('meta[name="robots"]').attr('content') || null;
    const securityHeaders = [
      'content-security-policy',
      'x-content-type-options',
      'x-frame-options',
      'strict-transport-security',
      'x-xss-protection',
      'referrer-policy',
      'permissions-policy',
    ].filter((h) => headers[h]);
    // robots.txt check
    let robotsTxtStatus = 'not checked';
    try {
      const robotsUrl = new URL('/robots.txt', url).toString();
      const robotsResp = await axios.get(robotsUrl, { timeout: 5000 });
      robotsTxtStatus = robotsResp.status === 200 ? 'present' : 'missing';
    } catch {
      robotsTxtStatus = 'missing';
    }
    // XML sitemap detection
    let sitemapUrl: string | null = null;
    try {
      const robotsUrl = new URL('/robots.txt', url).toString();
      const robotsResp = await axios.get(robotsUrl, { timeout: 5000 });
      const match = robotsResp.data.match(/Sitemap:\s*(.+)/i);
      if (match) sitemapUrl = match[1].trim();
    } catch {}
    if (!sitemapUrl) {
      const linkSitemap = $('link[rel="sitemap"]').attr('href');
      if (linkSitemap) sitemapUrl = linkSitemap;
    }
    // hreflang tags
    const hreflangs = $('link[rel="alternate"][hreflang]').map((_, el) => ({
      hreflang: $(el).attr('hreflang'),
      href: $(el).attr('href'),
    })).get();
    // HTTP/2 detection (stub)
    const usesHttp2 = false; // TODO: Implement with network info if available
    // Mobile-friendliness
    const hasViewport = $('meta[name="viewport"]').length > 0;
    // AMP
    const ampHtml = $('link[rel="amphtml"]').attr('href') || null;
    // Redirects
    const isRedirect = response?.status && response.status >= 300 && response.status < 400;
    // Page speed placeholder
    const pageSpeed = null; // TODO: Integrate with Lighthouse/performance metrics
    return {
      statusCode: response?.status,
      technicalSEO: {
        contentType,
        hasHttps,
        canonical,
        robotsMeta,
        securityHeaders,
        robotsTxtStatus,
        sitemapUrl,
        hreflangs,
        usesHttp2,
        hasViewport,
        ampHtml,
        isRedirect,
        pageSpeed,
      },
    };
  }
} 