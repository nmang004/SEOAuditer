import { PageAnalysis } from '../../types/PageAnalysis';

export interface ContentAnalysis {
  depth: ContentDepthAnalysis;
  quality: ContentQualityAnalysis;
  readability: ReadabilityAnalysis;
  keywords: KeywordAnalysis;
  freshness: FreshnessAnalysis;
}

export interface ContentDepthAnalysis {
  wordCount: number;
  readingTime: number;
  paragraphCount: number;
  sentenceCount: number;
  averageSentenceLength: number;
  topicCoverage: number;
  contentStructure: {
    wellOrganized: boolean;
    logicalFlow: boolean;
    sectionBreakdown: string[];
  };
  score: number;
  recommendations: string[];
}

export interface ContentQualityAnalysis {
  duplicateContent: boolean;
  uniqueness: number;
  grammarErrors: number;
  spellingErrors: number;
  expertise: number;
  authority: number;
  trustworthiness: number;
  score: number;
  issues: string[];
}

export interface ReadabilityAnalysis {
  fleschKincaid: number;
  fleschReadingEase: number;
  smogIndex: number;
  automatedReadabilityIndex: number;
  colemanLiauIndex: number;
  gunningFog: number;
  overallScore: number;
  gradeLevel: string;
  readingDifficulty: string;
  suggestions: string[];
}

export interface KeywordAnalysis {
  primaryKeywords: string[];
  secondaryKeywords: string[];
  keywordDensity: { [keyword: string]: number };
  distribution: {
    inTitle: boolean;
    inH1: boolean;
    inMeta: boolean;
    inFirstParagraph: boolean;
    inLastParagraph: boolean;
  };
  stuffingRisk: boolean;
  lsiKeywords: string[];
  score: number;
  recommendations: string[];
}

export interface FreshnessAnalysis {
  publishDate?: Date;
  lastModified?: Date;
  contentAge?: number;
  lastUpdateAge?: number;
  score: number;
  needsUpdate: boolean;
  updateFrequency: string;
  recommendations: string[];
}

export class EnhancedContentAnalyzer {
  async analyze(pageContext: any): Promise<Partial<PageAnalysis> & { contentAnalysis: ContentAnalysis }> {
    const { $ /* , html */ } = pageContext; // html variable commented out as it's not used
    const text = this.extractMainContent($);
    
    const depth = await this.analyzeContentDepth(text, $);
    const quality = await this.analyzeContentQuality(text, $);
    const readability = await this.analyzeReadability(text);
    const keywords = await this.analyzeKeywords(text, pageContext);
    const freshness = await this.analyzeFreshness($);

    const contentAnalysis: ContentAnalysis = {
      depth,
      quality,
      readability,
      keywords,
      freshness
    };

    return {
      content: {
        ...contentAnalysis,
        overallScore: this.calculateOverallContentScore(contentAnalysis)
      },
      contentAnalysis
    };
  }

  private extractMainContent($: any): string {
    // Remove script, style, nav, header, footer, aside elements
    $('script, style, nav, header, footer, aside, .navigation, .sidebar').remove();
    
    // Try to find main content area
    const mainSelectors = [
      'main',
      'article',
      '.main-content',
      '.content',
      '#content',
      '.post-content',
      '.entry-content'
    ];

    for (const selector of mainSelectors) {
      const element = $(selector);
      if (element.length && element.text().trim().length > 100) {
        return element.text().trim();
      }
    }

    // Fallback to body content
    return $('body').text().trim();
  }

  private async analyzeContentDepth(content: string, $: any): Promise<ContentDepthAnalysis> {
    const words = this.tokenizeWords(content);
    const sentences = this.tokenizeSentences(content);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    const wordCount = words.length;
    const readingTime = Math.ceil(wordCount / 250); // Average reading speed
    const paragraphCount = paragraphs.length;
    const sentenceCount = sentences.length;
    const averageSentenceLength = wordCount / sentenceCount;

    const topicCoverage = this.calculateTopicCoverage(content, $);
    const contentStructure = this.analyzeContentStructure(content, $);

    const score = this.calculateContentDepthScore(
      wordCount,
      topicCoverage,
      contentStructure
    );

    const recommendations = this.generateDepthRecommendations(
      wordCount,
      topicCoverage,
      contentStructure
    );

    return {
      wordCount,
      readingTime,
      paragraphCount,
      sentenceCount,
      averageSentenceLength,
      topicCoverage,
      contentStructure,
      score,
      recommendations
    };
  }

  private async analyzeContentQuality(content: string, $: any): Promise<ContentQualityAnalysis> {
    const duplicateContent = this.detectDuplicateContent(content);
    const uniqueness = this.calculateUniqueness(content);
    const grammarErrors = this.detectGrammarErrors(content);
    const spellingErrors = this.detectSpellingErrors(content);
    
    // E-A-T analysis (Expertise, Authority, Trustworthiness)
    const expertise = this.analyzeExpertise(content, $);
    const authority = this.analyzeAuthority(content, $);
    const trustworthiness = this.analyzeTrustworthiness(content, $);

    const score = this.calculateQualityScore({
      duplicateContent,
      uniqueness,
      grammarErrors,
      spellingErrors,
      expertise,
      authority,
      trustworthiness
    });

    const issues = this.identifyQualityIssues({
      duplicateContent,
      grammarErrors,
      spellingErrors,
      uniqueness
    });

    return {
      duplicateContent,
      uniqueness,
      grammarErrors,
      spellingErrors,
      expertise,
      authority,
      trustworthiness,
      score,
      issues
    };
  }

  private async analyzeReadability(content: string): Promise<ReadabilityAnalysis> {
    const words = this.tokenizeWords(content);
    const sentences = this.tokenizeSentences(content);
    const syllables = this.countSyllables(words);
    const complexWords = this.countComplexWords(words);

    const fleschKincaid = this.calculateFleschKincaid(words.length, sentences.length, syllables);
    const fleschReadingEase = this.calculateFleschReadingEase(words.length, sentences.length, syllables);
    const smogIndex = this.calculateSMOGIndex(sentences.length, complexWords);
    const automatedReadabilityIndex = this.calculateARI(words.length, sentences.length, content.length);
    const colemanLiauIndex = this.calculateColemanLiau(words.length, sentences.length, content.length);
    const gunningFog = this.calculateGunningFog(words.length, sentences.length, complexWords);

    const overallScore = this.calculateOverallReadability({
      fleschKincaid,
      fleschReadingEase,
      smogIndex,
      automatedReadabilityIndex,
      colemanLiauIndex,
      gunningFog
    });

    const gradeLevel = this.determineGradeLevel(overallScore);
    const readingDifficulty = this.categorizeReadingDifficulty(fleschReadingEase);
    const suggestions = this.generateReadabilitySuggestions(overallScore, {
      averageSentenceLength: words.length / sentences.length,
      complexWordRatio: complexWords / words.length
    });

    return {
      fleschKincaid,
      fleschReadingEase,
      smogIndex,
      automatedReadabilityIndex,
      colemanLiauIndex,
      gunningFog,
      overallScore,
      gradeLevel,
      readingDifficulty,
      suggestions
    };
  }

  private async analyzeKeywords(content: string, pageContext: any): Promise<KeywordAnalysis> {
    const { $, title, meta } = pageContext;
    
    const extractedKeywords = this.extractKeywords(content, title, meta?.description);
    const keywordDensity = this.calculateKeywordDensity(content, extractedKeywords.all);
    const distribution = this.analyzeKeywordDistribution(extractedKeywords.primary, $);
    const stuffingRisk = this.detectKeywordStuffing(keywordDensity);
    const lsiKeywords = this.generateLSIKeywords(extractedKeywords.primary, content);

    const score = this.calculateKeywordOptimizationScore(
      keywordDensity,
      distribution,
      stuffingRisk
    );

    const recommendations = this.generateKeywordRecommendations(
      keywordDensity,
      distribution,
      stuffingRisk
    );

    return {
      primaryKeywords: extractedKeywords.primary,
      secondaryKeywords: extractedKeywords.secondary,
      keywordDensity,
      distribution,
      stuffingRisk,
      lsiKeywords,
      score,
      recommendations
    };
  }

  private async analyzeFreshness($: any): Promise<FreshnessAnalysis> {
    const publishDate = this.extractPublishDate($);
    const lastModified = this.extractLastModified($);
    
    const contentAge = lastModified ? Math.floor((Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24)) : undefined;
    const lastUpdateAge = publishDate ? Math.floor((Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24)) : undefined;

    const score = this.calculateFreshnessScore(contentAge, lastUpdateAge);
    const needsUpdate = this.determineUpdateNeed(contentAge, lastUpdateAge);
    const updateFrequency = this.estimateUpdateFrequency(publishDate, lastModified);
    const recommendations = this.generateFreshnessRecommendations(score, needsUpdate);

    return {
      publishDate,
      lastModified,
      contentAge,
      lastUpdateAge,
      score,
      needsUpdate,
      updateFrequency,
      recommendations
    };
  }

  // Helper methods for tokenization and analysis
  private tokenizeWords(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private tokenizeSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
  }

  private countSyllables(words: string[]): number {
    return words.reduce((total, word) => total + this.countWordSyllables(word), 0);
  }

  private countWordSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    let count = 0;
    const vowels = 'aeiouy';
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    if (word.endsWith('e')) count--;
    if (word.endsWith('le') && word.length > 2) count++;
    
    return Math.max(1, count);
  }

  private countComplexWords(words: string[]): number {
    return words.filter(word => this.countWordSyllables(word) >= 3).length;
  }

  private calculateTopicCoverage(content: string, $: any): number {
    const headings = $('h1, h2, h3, h4, h5, h6').map((_: number, el: any) => $(el).text()).get();
    const topicKeywords = this.extractTopicKeywords(content, headings);
    
    // Simple topic coverage based on semantic diversity
    const uniqueTopics = new Set(topicKeywords.map(keyword => 
      keyword.toLowerCase().split(' ')[0]
    ));
    
    // Score based on topic diversity and depth
    return Math.min(1, uniqueTopics.size / 10);
  }

  private analyzeContentStructure(content: string, $: any) {
    const headings = $('h1, h2, h3, h4, h5, h6').map((_: number, el: any) => ({
      level: parseInt(el.tagName.slice(1)),
      text: $(el).text(),
      length: $(el).text().length
    })).get();

    const wellOrganized = this.checkOrganization(headings);
    const logicalFlow = this.checkLogicalFlow(content, headings);
    const sectionBreakdown = this.analyzeSections(headings);

    return {
      wellOrganized,
      logicalFlow,
      sectionBreakdown
    };
  }

  private calculateContentDepthScore(wordCount: number, topicCoverage: number, structure: any): number {
    let score = 0;
    
    // Word count scoring
    if (wordCount >= 2000) score += 40;
    else if (wordCount >= 1500) score += 35;
    else if (wordCount >= 1000) score += 30;
    else if (wordCount >= 500) score += 20;
    else score += 10;
    
    // Topic coverage scoring
    score += topicCoverage * 30;
    
    // Structure scoring
    if (structure.wellOrganized) score += 15;
    if (structure.logicalFlow) score += 15;
    
    return Math.min(100, score);
  }

  private generateDepthRecommendations(wordCount: number, topicCoverage: number, structure: any): string[] {
    const recommendations: string[] = [];
    
    if (wordCount < 500) {
      recommendations.push('Increase content length to at least 500 words for better SEO value');
    }
    
    if (topicCoverage < 0.5) {
      recommendations.push('Expand topic coverage by addressing more related subtopics');
    }
    
    if (!structure.wellOrganized) {
      recommendations.push('Improve content organization with clear headings and structure');
    }
    
    return recommendations;
  }

  // Readability calculation methods
  private calculateFleschKincaid(words: number, sentences: number, syllables: number): number {
    return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  }

  private calculateFleschReadingEase(words: number, sentences: number, syllables: number): number {
    return 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  }

  private calculateSMOGIndex(sentences: number, complexWords: number): number {
    return 1.0430 * Math.sqrt(complexWords * (30 / sentences)) + 3.1291;
  }

  private calculateARI(words: number, sentences: number, characters: number): number {
    return 4.71 * (characters / words) + 0.5 * (words / sentences) - 21.43;
  }

  private calculateColemanLiau(words: number, sentences: number, characters: number): number {
    const L = (characters / words) * 100;
    const S = (sentences / words) * 100;
    return 0.0588 * L - 0.296 * S - 15.8;
  }

  private calculateGunningFog(words: number, sentences: number, complexWords: number): number {
    return 0.4 * ((words / sentences) + 100 * (complexWords / words));
  }

  private calculateOverallReadability(metrics: any): number {
    // Convert all metrics to a 0-100 scale and average them
    const normalizedScores = [
      Math.max(0, 100 - metrics.fleschKincaid * 5),
      metrics.fleschReadingEase,
      Math.max(0, 100 - metrics.smogIndex * 5),
      Math.max(0, 100 - metrics.automatedReadabilityIndex * 5),
      Math.max(0, 100 - metrics.colemanLiauIndex * 5),
      Math.max(0, 100 - metrics.gunningFog * 5)
    ];
    
    return normalizedScores.reduce((sum, score) => sum + score, 0) / normalizedScores.length;
  }

  private determineGradeLevel(score: number): string {
    if (score >= 90) return 'Elementary (5th-6th grade)';
    if (score >= 80) return 'Middle School (7th-8th grade)';
    if (score >= 70) return 'High School (9th-12th grade)';
    if (score >= 60) return 'College (13th-16th grade)';
    return 'Graduate (17th+ grade)';
  }

  private categorizeReadingDifficulty(fleschScore: number): string {
    if (fleschScore >= 90) return 'Very Easy';
    if (fleschScore >= 80) return 'Easy';
    if (fleschScore >= 70) return 'Fairly Easy';
    if (fleschScore >= 60) return 'Standard';
    if (fleschScore >= 50) return 'Fairly Difficult';
    if (fleschScore >= 30) return 'Difficult';
    return 'Very Difficult';
  }

  private generateReadabilitySuggestions(score: number, metrics: any): string[] {
    const suggestions: string[] = [];
    
    if (score < 60) {
      suggestions.push('Use shorter sentences to improve readability');
      suggestions.push('Replace complex words with simpler alternatives');
    }
    
    if (metrics.averageSentenceLength > 20) {
      suggestions.push('Break up long sentences (average length should be under 20 words)');
    }
    
    if (metrics.complexWordRatio > 0.15) {
      suggestions.push('Reduce the use of complex words (aim for less than 15% complex words)');
    }
    
    return suggestions;
  }

  // Additional helper methods would be implemented here...
  private detectDuplicateContent(content: string): boolean {
    // Implement duplicate content detection logic
    return false;
  }

  private calculateUniqueness(content: string): number {
    // Implement uniqueness calculation
    return 0.8;
  }

  private detectGrammarErrors(content: string): number {
    // Implement grammar error detection
    return 0;
  }

  private detectSpellingErrors(content: string): number {
    // Implement spelling error detection
    return 0;
  }

  private analyzeExpertise(content: string, $: any): number {
    // Implement expertise analysis
    return 0.7;
  }

  private analyzeAuthority(content: string, $: any): number {
    // Implement authority analysis
    return 0.7;
  }

  private analyzeTrustworthiness(content: string, $: any): number {
    // Implement trustworthiness analysis
    return 0.7;
  }

  private calculateQualityScore(metrics: any): number {
    let score = 80; // Base score
    
    if (metrics.duplicateContent) score -= 30;
    if (metrics.grammarErrors > 5) score -= 10;
    if (metrics.spellingErrors > 3) score -= 10;
    if (metrics.uniqueness < 0.8) score -= 15;
    if (metrics.expertise < 0.7) score -= 10;
    
    return Math.max(0, score);
  }

  private identifyQualityIssues(metrics: any): string[] {
    const issues: string[] = [];
    
    if (metrics.duplicateContent) {
      issues.push('Duplicate content detected');
    }
    
    if (metrics.grammarErrors > 5) {
      issues.push('Multiple grammar errors found');
    }
    
    return issues;
  }

  private extractKeywords(content: string, title: string, description?: string): any {
    // Implement keyword extraction logic
    return {
      primary: ['example', 'keyword'],
      secondary: ['related', 'terms'],
      all: ['example', 'keyword', 'related', 'terms']
    };
  }

  private calculateKeywordDensity(content: string, keywords: string[]): { [keyword: string]: number } {
    const wordCount = this.tokenizeWords(content).length;
    const density: { [keyword: string]: number } = {};
    
    keywords.forEach(keyword => {
      const occurrences = (content.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
      density[keyword] = occurrences / wordCount;
    });
    
    return density;
  }

  private analyzeKeywordDistribution(keywords: string[], $: any): any {
    const title = $('title').text().toLowerCase();
    const h1 = $('h1').text().toLowerCase();
    const meta = $('meta[name="description"]').attr('content')?.toLowerCase() || '';
    const firstParagraph = $('p').first().text().toLowerCase();
    const lastParagraph = $('p').last().text().toLowerCase();
    
    const primaryKeyword = keywords[0]?.toLowerCase() || '';
    
    return {
      inTitle: title.includes(primaryKeyword),
      inH1: h1.includes(primaryKeyword),
      inMeta: meta.includes(primaryKeyword),
      inFirstParagraph: firstParagraph.includes(primaryKeyword),
      inLastParagraph: lastParagraph.includes(primaryKeyword)
    };
  }

  private detectKeywordStuffing(density: { [keyword: string]: number }): boolean {
    return Object.values(density).some(d => d > 0.03); // 3% threshold
  }

  private generateLSIKeywords(keywords: string[], content: string): string[] {
    // Implement LSI keyword generation
    return ['related', 'semantic', 'keywords'];
  }

  private calculateKeywordOptimizationScore(density: any, distribution: any, stuffing: boolean): number {
    let score = 70; // Base score
    
    if (stuffing) score -= 20;
    if (!distribution.inTitle) score -= 15;
    if (!distribution.inH1) score -= 10;
    if (!distribution.inMeta) score -= 10;
    
    return Math.max(0, score);
  }

  private generateKeywordRecommendations(density: any, distribution: any, stuffing: boolean): string[] {
    const recommendations: string[] = [];
    
    if (stuffing) {
      recommendations.push('Reduce keyword density to avoid keyword stuffing');
    }
    
    if (!distribution.inTitle) {
      recommendations.push('Include primary keyword in the title tag');
    }
    
    return recommendations;
  }

  private extractPublishDate($: any): Date | undefined {
    // Try various selectors for publish date
    const dateSelectors = [
      'time[datetime]',
      '.published',
      '.date',
      '[property="article:published_time"]'
    ];
    
    for (const selector of dateSelectors) {
      const element = $(selector);
      if (element.length) {
        const dateStr = element.attr('datetime') || element.text();
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    return undefined;
  }

  private extractLastModified($: any): Date | undefined {
    const modifiedSelectors = [
      '[property="article:modified_time"]',
      '.modified',
      '.updated'
    ];
    
    for (const selector of modifiedSelectors) {
      const element = $(selector);
      if (element.length) {
        const dateStr = element.attr('datetime') || element.text();
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    return undefined;
  }

  private calculateAge(date: Date, now: Date): number {
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateFreshnessScore(contentAge: number | undefined, lastUpdateAge: number | undefined): number {
    const relevantAge = lastUpdateAge || contentAge;
    
    if (!relevantAge) return 70; // Default if no date info
    
    if (relevantAge <= 30) return 100;
    if (relevantAge <= 90) return 80;
    if (relevantAge <= 180) return 60;
    if (relevantAge <= 365) return 40;
    return 20;
  }

  private determineUpdateNeed(contentAge: number | undefined, lastUpdateAge: number | undefined): boolean {
    const relevantAge = lastUpdateAge || contentAge;
    return relevantAge ? relevantAge > 180 : false; // Needs update if older than 6 months
  }

  private estimateUpdateFrequency(publishDate?: Date, lastModified?: Date): string {
    if (!publishDate) return 'Unknown';
    
    const now = new Date();
    const ageInDays = this.calculateAge(publishDate, now);
    
    if (ageInDays < 30) return 'Weekly';
    if (ageInDays < 90) return 'Monthly';
    if (ageInDays < 365) return 'Quarterly';
    return 'Annually';
  }

  private generateFreshnessRecommendations(score: number, needsUpdate: boolean): string[] {
    const recommendations: string[] = [];
    
    if (needsUpdate) {
      recommendations.push('Consider updating content to maintain freshness');
    }
    
    if (score < 60) {
      recommendations.push('Add publication and last modified dates to show content freshness');
    }
    
    return recommendations;
  }

  private extractTopicKeywords(content: string, headings: string[]): string[] {
    // Simplified topic keyword extraction
    const words = this.tokenizeWords(content + ' ' + headings.join(' '));
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    return words
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 20); // Top 20 keywords
  }

  private checkOrganization(headings: any[]): boolean {
    // Check if headings follow a logical hierarchy
    for (let i = 1; i < headings.length; i++) {
      if (headings[i].level - headings[i-1].level > 1) {
        return false; // Skipped heading levels
      }
    }
    return true;
  }

  private checkLogicalFlow(content: string, headings: any[]): boolean {
    // Simplified logical flow check
    return headings.length > 0 && content.length > headings.length * 100;
  }

  private analyzeSections(headings: any[]): string[] {
    return headings.map(h => `H${h.level}: ${h.text}`);
  }

  private calculateOverallContentScore(analysis: ContentAnalysis): number {
    const weights = {
      depth: 0.3,
      quality: 0.25,
      readability: 0.2,
      keywords: 0.15,
      freshness: 0.1
    };

    return Math.round(
      analysis.depth.score * weights.depth +
      analysis.quality.score * weights.quality +
      analysis.readability.overallScore * weights.readability +
      analysis.keywords.score * weights.keywords +
      analysis.freshness.score * weights.freshness
    );
  }
} 