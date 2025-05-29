import { PageAnalysis } from '../../types/PageAnalysis';

export class Scoring {
  async analyze(pageContext: any): Promise<Partial<PageAnalysis>> {
    // Accept all module results as input
    const { technicalSEO = {}, headings = {}, content = {}, schema = {}, performance = {}, accessibility = {} } = pageContext.pageAnalysis || {};

    // --- 1. Compute normalized category scores (0-100) ---
    // Technical
    let technicalScore = 100;
    if (!technicalSEO.hasHttps) technicalScore -= 20;
    if (!technicalSEO.hasViewport) technicalScore -= 10;
    if (!technicalSEO.canonical) technicalScore -= 10;
    if (!technicalSEO.robotsMeta) technicalScore -= 10;
    if (technicalSEO.robotsTxtStatus === 'missing') technicalScore -= 10;
    if (technicalSEO.securityHeaders && technicalSEO.securityHeaders.length < 3) technicalScore -= 10;
    // On-Page
    let onpageScore = 100;
    if (!pageContext.title) onpageScore -= 20;
    if (!pageContext.meta?.description) onpageScore -= 10;
    if (headings.h1 && headings.h1.length === 0) onpageScore -= 10;
    if (headings.h1 && headings.h1.length > 1) onpageScore -= 10;
    if (pageContext.imagesMissingAlt && pageContext.imagesMissingAlt > 0) onpageScore -= 10;
    // Content
    let contentScore = 100;
    if (content.wordCount && content.wordCount < 100) contentScore -= 20;
    if (content.readability && content.readability < 60) contentScore -= 10;
    if (content.duplicateTitle) contentScore -= 10;
    if (content.duplicateDescription) contentScore -= 10;
    if (content.duplicateH1) contentScore -= 10;
    // Structured Data
    let structuredScore = 100;
    if (!schema || !schema.jsonLd || schema.jsonLd.length === 0) structuredScore -= 20;
    if (schema.errors && schema.errors.length > 0) structuredScore -= 10;
    if (schema.duplicateSchemas) structuredScore -= 10;
    // Performance (optional)
    let performanceScore = 100;
    if (performance && performance.performanceScore !== undefined) {
      performanceScore = Math.round((performance.performanceScore || 0) * 100);
    }
    // Accessibility (optional)
    let accessibilityScore = 100;
    if (accessibility && accessibility.accessibilityScore !== undefined) {
      accessibilityScore = Math.round((accessibility.accessibilityScore || 0) * 100);
    }

    // --- 2. Penalties/Bonuses ---
    let penalties = 0;
    let bonuses = 0;
    if (technicalSEO.isRedirect) penalties += 5;
    if (schema.richResultsEligible) bonuses += 5;
    if (technicalSEO.hasViewport) bonuses += 5;
    if (pageContext.favicon) bonuses += 2;

    // --- 3. Weighted Aggregation ---
    const weights = {
      technical: 0.3,
      onpage: 0.25,
      content: 0.2,
      structured: 0.15,
      performance: 0.05,
      accessibility: 0.05,
    };
    // Normalize weights if performance/accessibility not present
    let totalWeight = weights.technical + weights.onpage + weights.content + weights.structured;
    let weightedScore = technicalScore * weights.technical + onpageScore * weights.onpage + contentScore * weights.content + structuredScore * weights.structured;
    if (performance && performance.performanceScore !== undefined) {
      weightedScore += performanceScore * weights.performance;
      totalWeight += weights.performance;
    }
    if (accessibility && accessibility.accessibilityScore !== undefined) {
      weightedScore += accessibilityScore * weights.accessibility;
      totalWeight += weights.accessibility;
    }
    let overallScore = Math.max(0, Math.round(weightedScore / totalWeight + bonuses - penalties));
    if (overallScore > 100) overallScore = 100;

    // --- 4. Return detailed breakdown ---
    return {
      score: overallScore,
      technicalScore,
      onpageScore,
      contentScore,
      structuredScore,
      performanceScore,
      accessibilityScore,
      penalties,
      bonuses,
      weights,
    };
  }
} 