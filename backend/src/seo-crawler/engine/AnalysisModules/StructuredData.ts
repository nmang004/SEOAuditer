import { PageAnalysis } from '../../types/PageAnalysis';

export class StructuredData {
  async analyze(pageContext: any): Promise<Partial<PageAnalysis>> {
    const { $ } = pageContext;
    const jsonLd: any[] = [];
    const schemaTypes: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let hasBreadcrumb = false, hasArticle = false, hasProduct = false, hasFAQ = false;
    let richResultsEligible = false;
    $('script[type="application/ld+json"]').each((_: any, el: any) => {
      try {
        const json = $(el).html();
        if (json) {
          const parsed = JSON.parse(json);
          jsonLd.push(parsed);
          // Detect type(s)
          if (parsed['@type']) {
            const types = Array.isArray(parsed['@type']) ? parsed['@type'] : [parsed['@type']];
            schemaTypes.push(...types);
            if (types.includes('BreadcrumbList')) hasBreadcrumb = true;
            if (types.includes('Article')) hasArticle = true;
            if (types.includes('Product')) hasProduct = true;
            if (types.includes('FAQPage')) hasFAQ = true;
          }
        }
      } catch (e: any) {
        errors.push('Invalid JSON-LD: ' + e.message);
      }
    });
    // Microdata types
    const microdataTypes: string[] = [];
    $('[itemscope][itemtype]').each((_: any, el: any) => {
      const type = $(el).attr('itemtype');
      if (type) microdataTypes.push(type);
    });
    // Duplicate schemas
    const duplicateSchemas = schemaTypes.length !== new Set(schemaTypes).size;
    // Rich results eligibility (simple: has at least one common type)
    richResultsEligible = hasBreadcrumb || hasArticle || hasProduct || hasFAQ;
    return {
      schema: {
        jsonLd,
        microdataTypes,
        schemaTypes,
        errors,
        warnings,
        hasBreadcrumb,
        hasArticle,
        hasProduct,
        hasFAQ,
        duplicateSchemas,
        richResultsEligible,
      },
    };
  }
} 