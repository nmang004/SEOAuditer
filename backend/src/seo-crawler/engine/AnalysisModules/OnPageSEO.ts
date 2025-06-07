import { PageAnalysis } from '../../types/PageAnalysis';

export class OnPageSEO {
  async analyze(pageContext: any): Promise<Partial<PageAnalysis>> {
    const { $, url } = pageContext;
    const title = $('title').text().trim();
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const headings = {
      h1: $('h1').map((_: any, el: any) => $(el).text().trim()).get(),
      h2: $('h2').map((_: any, el: any) => $(el).text().trim()).get(),
      h3: $('h3').map((_: any, el: any) => $(el).text().trim()).get(),
    };
    // Heading structure
    const h1Count = headings.h1.length;
    const hasMultipleH1 = h1Count > 1;
    const hasNoH1 = h1Count === 0;
    // Alt text for images
    const images = $('img').map((_: any, el: any) => ({
      src: $(el).attr('src'),
      alt: $(el).attr('alt') || '',
    })).get();
    const imagesMissingAlt = images.filter((img: any) => !img.alt).length;
    // Open Graph & Twitter Cards
    const openGraph = {
      title: $('meta[property="og:title"]').attr('content') || '',
      description: $('meta[property="og:description"]').attr('content') || '',
      image: $('meta[property="og:image"]').attr('content') || '',
    };
    const twitterCard = {
      card: $('meta[name="twitter:card"]').attr('content') || '',
      title: $('meta[name="twitter:title"]').attr('content') || '',
      description: $('meta[name="twitter:description"]').attr('content') || '',
      image: $('meta[name="twitter:image"]').attr('content') || '',
    };
    // Canonical consistency
    const canonical = $('link[rel="canonical"]').attr('href') || '';
    const canonicalMatches = canonical ? canonical === url : true;
    // Broken links (stub)
    const links = {
      internal: [] as string[],
      external: [] as string[],
      broken: [] as string[], // TODO: Implement real check
    };
    $('a[href]').each((_: any, el: any) => {
      const href = $(el).attr('href');
      if (!href) return;
      try {
        const absUrl = new URL(href, url).toString();
        if (absUrl.includes(new URL(url).hostname)) {
          links.internal.push(absUrl);
        } else {
          links.external.push(absUrl);
        }
      } catch {}
    });
    // Noindex/Nofollow
    const robotsMeta = $('meta[name="robots"]').attr('content') || '';
    const hasNoindex = robotsMeta.includes('noindex');
    const hasNofollow = robotsMeta.includes('nofollow');
    // Favicon
    const favicon = $('link[rel="icon"]').attr('href') || '';
    // HTML lang
    const htmlLang = $('html').attr('lang') || '';
    return {
      title,
      meta: { description: metaDescription },
      headings,
      links,
      images,
      openGraph,
      twitterCard,
      canonical,
      canonicalMatches,
      hasMultipleH1,
      hasNoH1,
      imagesMissingAlt,
      hasNoindex,
      hasNofollow,
      favicon,
      htmlLang,
    };
  }
} 