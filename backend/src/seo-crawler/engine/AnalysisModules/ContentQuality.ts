import { PageAnalysis } from '../../types/PageAnalysis';

export class ContentQuality {
  async analyze(pageContext: any): Promise<Partial<PageAnalysis>> {
    const { $, response } = pageContext;
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = text.split(' ').filter(Boolean).length;
    const paragraphCount = $('p').length;
    // Basic keyword density (top 5 words, ignoring stopwords)
    const stopwords = new Set(['the','and','for','with','that','this','from','are','was','but','not','you','your','have','has','will','can','all','our','more','one','about','they','their','which','what','when','where','how','who','why','were','had','his','her','its','out','use','any','may','each','she','him','them','then','than','also','just','get','got','let','now','new','see','two','too','did','does','been','being','over','under','such','very','much','many','most','some','other','into','only','own','off','per','via','upon','yet','still','should','could','would','shall','might','must','like','so','as','at','by','to','of','in','on','an','or','if','is','it','be','do','up','no','yes','a']);
    const words = text.toLowerCase().split(/\W+/).filter((w: string) => w && !stopwords.has(w));
    const freq: Record<string, number> = {};
    for (const w of words) freq[w] = (freq[w] || 0) + 1;
    const sorted = Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0,5);
    const keywordDensity = Object.fromEntries(sorted);
    // Readability (Flesch-Kincaid, simple version)
    function fleschKincaid(text: string) {
      const sentences = text.split(/[.!?]/).length;
      const words = text.split(/\s+/).length;
      const syllables = text.split(/[aeiouy]+/i).length - 1;
      return 206.835 - 1.015 * (words / Math.max(sentences,1)) - 84.6 * (syllables / Math.max(words,1));
    }
    const readability = fleschKincaid(text);
    // Duplicate content (stub: just check for duplicate title/desc/headings)
    // const _title = $('title').text().trim();
    // const _metaDescription = $('meta[name="description"]').attr('content') || '';
    const h1 = $('h1').map((_: any, el: any) => $(el).text().trim()).get();
    const duplicateTitle = false; // TODO: Compare with other pages
    const duplicateDescription = false; // TODO: Compare with other pages
    const duplicateH1 = h1.length !== new Set(h1).size;
    // Thin content
    const isThinContent = wordCount < 100;
    // Freshness
    const lastModified = response?.headers?.['last-modified'] || $('time').attr('datetime') || null;
    // Media usage
    const imageCount = $('img').length;
    const videoCount = $('video').length;
    // Spelling/grammar placeholder
    const spellingErrors = null; // TODO: Integrate spellchecker
    return {
      content: {
        text,
        wordCount,
        paragraphCount,
        keywordDensity,
        readability,
        duplicateTitle,
        duplicateDescription,
        duplicateH1,
        isThinContent,
        lastModified,
        imageCount,
        videoCount,
        spellingErrors,
      },
    };
  }
} 