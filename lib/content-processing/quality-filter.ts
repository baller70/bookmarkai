import { appLogger } from '../../lib/logger';
import { ExtractedContent } from './content-extractor';
import { performance } from 'perf_hooks';

const logger = appLogger;

export interface QualityScore {
  overall: number; // 0-100
  categories: {
    content: number;
    structure: number;
    metadata: number;
    technical: number;
    engagement: number;
    trustworthiness: number;
  };
  factors: QualityFactor[];
  issues: QualityIssue[];
  recommendations: QualityRecommendation[];
  passesFilter: boolean;
}

export interface QualityFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface QualityIssue {
  type: 'critical' | 'warning' | 'minor';
  category: string;
  message: string;
  suggestion: string;
  affectedScore: number;
}

export interface QualityRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  action: string;
  expectedImprovement: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface FilterCriteria {
  minimumScore: number;
  requiredCategories: string[];
  blacklistedDomains: string[];
  whitelistedDomains: string[];
  contentFilters: ContentFilter[];
  structureRequirements: StructureRequirement[];
  metadataRequirements: MetadataRequirement[];
}

export interface ContentFilter {
  type: 'keyword' | 'pattern' | 'length' | 'language' | 'sentiment';
  rule: string | number;
  action: 'block' | 'flag' | 'score_penalty';
  severity: number;
}

export interface StructureRequirement {
  element: string;
  required: boolean;
  minimum?: number;
  maximum?: number;
  scoreImpact: number;
}

export interface MetadataRequirement {
  field: string;
  required: boolean;
  pattern?: string;
  scoreImpact: number;
}

export interface EnhancementSuggestion {
  type: 'content' | 'structure' | 'metadata' | 'technical';
  priority: 'high' | 'medium' | 'low';
  description: string;
  implementation: string;
  expectedImprovement: number;
  effort: 'low' | 'medium' | 'high';
}

export class QualityFilter {
  private defaultCriteria: FilterCriteria = {
    minimumScore: 60,
    requiredCategories: [],
    blacklistedDomains: [
      'spam-site.com',
      'low-quality-content.net',
      'click-bait-central.org'
    ],
    whitelistedDomains: [
      'wikipedia.org',
      'github.com',
      'stackoverflow.com',
      'medium.com',
      'dev.to'
    ],
    contentFilters: [
      {
        type: 'length',
        rule: 100, // Minimum word count
        action: 'score_penalty',
        severity: 20
      },
      {
        type: 'keyword',
        rule: 'spam|scam|fake|clickbait',
        action: 'flag',
        severity: 30
      }
    ],
    structureRequirements: [
      {
        element: 'title',
        required: true,
        scoreImpact: 20
      },
      {
        element: 'headings',
        required: false,
        minimum: 1,
        scoreImpact: 10
      }
    ],
    metadataRequirements: [
      {
        field: 'description',
        required: false,
        scoreImpact: 10
      },
      {
        field: 'author',
        required: false,
        scoreImpact: 5
      }
    ]
  };

  async analyzeQuality(content: ExtractedContent, criteria?: FilterCriteria): Promise<QualityScore> {
    const startTime = performance.now();
    const filterCriteria = { ...this.defaultCriteria, ...criteria };

    try {
      logger.info('Starting quality analysis', { 
        url: content.url,
        wordCount: content.wordCount 
      });

      // Analyze different quality aspects
      const contentScore = this.analyzeContentQuality(content);
      const structureScore = this.analyzeStructureQuality(content);
      const metadataScore = this.analyzeMetadataQuality(content);
      const technicalScore = this.analyzeTechnicalQuality(content);
      const engagementScore = this.analyzeEngagementQuality(content);
      const trustworthinessScore = this.analyzeTrustworthiness(content);

      // Collect all factors
      const factors: QualityFactor[] = [
        ...contentScore.factors,
        ...structureScore.factors,
        ...metadataScore.factors,
        ...technicalScore.factors,
        ...engagementScore.factors,
        ...trustworthinessScore.factors
      ];

      // Collect all issues
      const issues: QualityIssue[] = [
        ...contentScore.issues,
        ...structureScore.issues,
        ...metadataScore.issues,
        ...technicalScore.issues,
        ...engagementScore.issues,
        ...trustworthinessScore.issues
      ];

      // Apply content filters
      const filterResults = this.applyContentFilters(content, filterCriteria);
      issues.push(...filterResults.issues);

      // Calculate category scores
      const categories = {
        content: contentScore.score,
        structure: structureScore.score,
        metadata: metadataScore.score,
        technical: technicalScore.score,
        engagement: engagementScore.score,
        trustworthiness: trustworthinessScore.score
      };

      // Calculate overall score (weighted average)
      const weights = {
        content: 0.3,
        structure: 0.2,
        metadata: 0.15,
        technical: 0.15,
        engagement: 0.1,
        trustworthiness: 0.1
      };

      const overall = Math.round(
        Object.entries(categories).reduce((sum, [category, score]) => {
          return sum + (score * weights[category as keyof typeof weights]);
        }, 0)
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(factors, issues, categories);

      // Determine if content passes filter
      const passesFilter = this.evaluateFilterCriteria(content, overall, filterCriteria);

      const qualityScore: QualityScore = {
        overall,
        categories,
        factors,
        issues,
        recommendations,
        passesFilter
      };

      const duration = performance.now() - startTime;
      logger.info('Quality analysis completed', { 
        url: content.url,
        overallScore: overall,
        passesFilter,
        duration: Math.round(duration)
      });

      return qualityScore;

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Quality analysis failed', error as Error, { 
        url: content.url,
        duration: Math.round(duration)
      });
      
      throw new Error(`Quality analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private analyzeContentQuality(content: ExtractedContent): {
    score: number;
    factors: QualityFactor[];
    issues: QualityIssue[];
  } {
    const factors: QualityFactor[] = [];
    const issues: QualityIssue[] = [];

    // Word count analysis
    const wordCount = content.wordCount;
    let wordCountScore = 0;
    if (wordCount < 100) {
      wordCountScore = 20;
      issues.push({
        type: 'warning',
        category: 'content',
        message: 'Very short content',
        suggestion: 'Add more detailed information',
        affectedScore: 20
      });
    } else if (wordCount < 300) {
      wordCountScore = 50;
      issues.push({
        type: 'minor',
        category: 'content',
        message: 'Short content',
        suggestion: 'Consider expanding the content',
        affectedScore: 10
      });
    } else if (wordCount < 1000) {
      wordCountScore = 80;
    } else {
      wordCountScore = 100;
    }

    factors.push({
      name: 'Word Count',
      score: wordCountScore,
      weight: 0.3,
      description: `Content has ${wordCount} words`,
      impact: wordCountScore > 60 ? 'positive' : 'negative'
    });

    // Reading time analysis
    const readingTime = content.readingTime;
    let readingTimeScore = 0;
    if (readingTime < 1) {
      readingTimeScore = 30;
    } else if (readingTime < 3) {
      readingTimeScore = 60;
    } else if (readingTime < 10) {
      readingTimeScore = 90;
    } else {
      readingTimeScore = 70; // Very long content might be overwhelming
    }

    factors.push({
      name: 'Reading Time',
      score: readingTimeScore,
      weight: 0.2,
      description: `Estimated reading time: ${readingTime} minutes`,
      impact: readingTimeScore > 60 ? 'positive' : 'negative'
    });

    // Content uniqueness (simplified)
    const uniquenessScore = this.analyzeContentUniqueness(content.plainText);
    factors.push({
      name: 'Content Uniqueness',
      score: uniquenessScore,
      weight: 0.25,
      description: 'Analysis of content originality',
      impact: uniquenessScore > 70 ? 'positive' : 'negative'
    });

    // Language quality
    const languageScore = this.analyzeLanguageQuality(content.plainText);
    factors.push({
      name: 'Language Quality',
      score: languageScore,
      weight: 0.25,
      description: 'Grammar and writing quality assessment',
      impact: languageScore > 70 ? 'positive' : 'negative'
    });

    // Calculate weighted score
    const score = Math.round(
      factors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0)
    );

    return { score, factors, issues };
  }

  private analyzeStructureQuality(content: ExtractedContent): {
    score: number;
    factors: QualityFactor[];
    issues: QualityIssue[];
  } {
    const factors: QualityFactor[] = [];
    const issues: QualityIssue[] = [];

    // Title quality
    const titleScore = this.analyzeTitleQuality(content.title);
    factors.push({
      name: 'Title Quality',
      score: titleScore,
      weight: 0.3,
      description: 'Title clarity and descriptiveness',
      impact: titleScore > 70 ? 'positive' : 'negative'
    });

    if (titleScore < 50) {
      issues.push({
        type: 'warning',
        category: 'structure',
        message: 'Poor title quality',
        suggestion: 'Improve title clarity and descriptiveness',
        affectedScore: 15
      });
    }

    // Heading structure
    const headingScore = this.analyzeHeadingStructure(content.content);
    factors.push({
      name: 'Heading Structure',
      score: headingScore,
      weight: 0.25,
      description: 'Proper use of headings for content organization',
      impact: headingScore > 60 ? 'positive' : 'negative'
    });

    // Paragraph structure
    const paragraphScore = this.analyzeParagraphStructure(content.plainText);
    factors.push({
      name: 'Paragraph Structure',
      score: paragraphScore,
      weight: 0.2,
      description: 'Content organization into readable paragraphs',
      impact: paragraphScore > 60 ? 'positive' : 'negative'
    });

    // List usage
    const listScore = this.analyzeListUsage(content.content);
    factors.push({
      name: 'List Usage',
      score: listScore,
      weight: 0.15,
      description: 'Use of lists for better readability',
      impact: listScore > 50 ? 'positive' : 'neutral'
    });

    // Link structure
    const linkScore = this.analyzeLinkStructure(content.links);
    factors.push({
      name: 'Link Structure',
      score: linkScore,
      weight: 0.1,
      description: 'Quality and relevance of internal/external links',
      impact: linkScore > 60 ? 'positive' : 'neutral'
    });

    const score = Math.round(
      factors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0)
    );

    return { score, factors, issues };
  }

  private analyzeMetadataQuality(content: ExtractedContent): {
    score: number;
    factors: QualityFactor[];
    issues: QualityIssue[];
  } {
    const factors: QualityFactor[] = [];
    const issues: QualityIssue[] = [];

    // Description quality
    const descriptionScore = content.description ? 
      Math.min(content.description.length / 160 * 100, 100) : 0;
    
    factors.push({
      name: 'Meta Description',
      score: descriptionScore,
      weight: 0.3,
      description: 'Presence and quality of meta description',
      impact: descriptionScore > 50 ? 'positive' : 'negative'
    });

    if (descriptionScore === 0) {
      issues.push({
        type: 'warning',
        category: 'metadata',
        message: 'Missing meta description',
        suggestion: 'Add a descriptive meta description',
        affectedScore: 15
      });
    }

    // Author information
    const authorScore = content.metadata.author ? 100 : 0;
    factors.push({
      name: 'Author Information',
      score: authorScore,
      weight: 0.2,
      description: 'Presence of author information',
      impact: authorScore > 0 ? 'positive' : 'neutral'
    });

    // Publication date
    const dateScore = content.metadata.publishDate ? 100 : 0;
    factors.push({
      name: 'Publication Date',
      score: dateScore,
      weight: 0.2,
      description: 'Presence of publication date',
      impact: dateScore > 0 ? 'positive' : 'neutral'
    });

    // Keywords
    const keywordScore = Math.min(content.metadata.keywords.length * 20, 100);
    factors.push({
      name: 'Keywords',
      score: keywordScore,
      weight: 0.15,
      description: 'Presence and quantity of keywords',
      impact: keywordScore > 40 ? 'positive' : 'neutral'
    });

    // Open Graph data
    const ogScore = this.analyzeOpenGraphData(content.metadata.openGraph);
    factors.push({
      name: 'Open Graph Data',
      score: ogScore,
      weight: 0.15,
      description: 'Social media sharing metadata',
      impact: ogScore > 50 ? 'positive' : 'neutral'
    });

    const score = Math.round(
      factors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0)
    );

    return { score, factors, issues };
  }

  private analyzeTechnicalQuality(content: ExtractedContent): {
    score: number;
    factors: QualityFactor[];
    issues: QualityIssue[];
  } {
    const factors: QualityFactor[] = [];
    const issues: QualityIssue[] = [];

    // Image optimization
    const imageScore = this.analyzeImageOptimization(content.images);
    factors.push({
      name: 'Image Optimization',
      score: imageScore,
      weight: 0.3,
      description: 'Image alt text and optimization',
      impact: imageScore > 60 ? 'positive' : 'neutral'
    });

    // URL structure
    const urlScore = this.analyzeUrlStructure(content.url);
    factors.push({
      name: 'URL Structure',
      score: urlScore,
      weight: 0.25,
      description: 'URL readability and structure',
      impact: urlScore > 70 ? 'positive' : 'neutral'
    });

    // Mobile friendliness (simulated)
    const mobileScore = 85; // Would require actual mobile testing
    factors.push({
      name: 'Mobile Friendliness',
      score: mobileScore,
      weight: 0.25,
      description: 'Mobile device compatibility',
      impact: 'positive'
    });

    // Loading performance (simulated)
    const performanceScore = 75; // Would require actual performance testing
    factors.push({
      name: 'Loading Performance',
      score: performanceScore,
      weight: 0.2,
      description: 'Page loading speed assessment',
      impact: 'positive'
    });

    const score = Math.round(
      factors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0)
    );

    return { score, factors, issues };
  }

  private analyzeEngagementQuality(content: ExtractedContent): {
    score: number;
    factors: QualityFactor[];
    issues: QualityIssue[];
  } {
    const factors: QualityFactor[] = [];
    const issues: QualityIssue[] = [];

    // Content freshness
    const freshnessScore = this.analyzeContentFreshness(content.metadata.publishDate);
    factors.push({
      name: 'Content Freshness',
      score: freshnessScore,
      weight: 0.3,
      description: 'How recent the content is',
      impact: freshnessScore > 60 ? 'positive' : 'neutral'
    });

    // Readability
    const readabilityScore = this.analyzeReadability(content.plainText);
    factors.push({
      name: 'Readability',
      score: readabilityScore,
      weight: 0.4,
      description: 'Content readability and accessibility',
      impact: readabilityScore > 70 ? 'positive' : 'negative'
    });

    // Visual appeal (image presence)
    const visualScore = Math.min(content.images.length * 20, 100);
    factors.push({
      name: 'Visual Appeal',
      score: visualScore,
      weight: 0.3,
      description: 'Presence of images and visual elements',
      impact: visualScore > 40 ? 'positive' : 'neutral'
    });

    const score = Math.round(
      factors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0)
    );

    return { score, factors, issues };
  }

  private analyzeTrustworthiness(content: ExtractedContent): {
    score: number;
    factors: QualityFactor[];
    issues: QualityIssue[];
  } {
    const factors: QualityFactor[] = [];
    const issues: QualityIssue[] = [];

    // Domain reputation
    const domainScore = this.analyzeDomainReputation(content.url);
    factors.push({
      name: 'Domain Reputation',
      score: domainScore,
      weight: 0.4,
      description: 'Trustworthiness of the source domain',
      impact: domainScore > 70 ? 'positive' : domainScore < 30 ? 'negative' : 'neutral'
    });

    // Author credibility
    const authorCredibilityScore = content.metadata.author ? 80 : 50;
    factors.push({
      name: 'Author Credibility',
      score: authorCredibilityScore,
      weight: 0.3,
      description: 'Presence and credibility of author information',
      impact: authorCredibilityScore > 60 ? 'positive' : 'neutral'
    });

    // External references
    const referenceScore = this.analyzeExternalReferences(content.links);
    factors.push({
      name: 'External References',
      score: referenceScore,
      weight: 0.3,
      description: 'Quality of external links and references',
      impact: referenceScore > 60 ? 'positive' : 'neutral'
    });

    const score = Math.round(
      factors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0)
    );

    return { score, factors, issues };
  }

  // Helper methods for specific quality analyses
  private analyzeContentUniqueness(text: string): number {
    // Simplified uniqueness analysis
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()));
    return Math.min((uniqueSentences.size / sentences.length) * 100, 100);
  }

  private analyzeLanguageQuality(text: string): number {
    // Simplified language quality analysis
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/);
    const avgWordsPerSentence = words.length / sentences.length;
    
    // Ideal range: 15-20 words per sentence
    if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 20) {
      return 90;
    } else if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 25) {
      return 75;
    } else {
      return 60;
    }
  }

  private analyzeTitleQuality(title: string): number {
    if (!title || title === 'Untitled') return 0;
    
    let score = 50; // Base score
    
    // Length check (ideal: 30-60 characters)
    if (title.length >= 30 && title.length <= 60) {
      score += 30;
    } else if (title.length >= 20 && title.length <= 80) {
      score += 15;
    }
    
    // Descriptiveness (contains meaningful words)
    const meaningfulWords = title.split(/\s+/).filter(word => 
      word.length > 3 && !['the', 'and', 'or', 'but', 'for', 'with'].includes(word.toLowerCase())
    );
    score += Math.min(meaningfulWords.length * 5, 20);
    
    return Math.min(score, 100);
  }

  private analyzeHeadingStructure(html: string): number {
    const headingMatches = html.match(/<h[1-6][^>]*>/gi) || [];
    const headingCount = headingMatches.length;
    
    if (headingCount === 0) return 20;
    if (headingCount >= 1 && headingCount <= 3) return 80;
    if (headingCount >= 4 && headingCount <= 8) return 100;
    return 70; // Too many headings
  }

  private analyzeParagraphStructure(text: string): number {
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const avgParagraphLength = text.length / paragraphs.length;
    
    // Ideal paragraph length: 100-300 characters
    if (avgParagraphLength >= 100 && avgParagraphLength <= 300) {
      return 90;
    } else if (avgParagraphLength >= 50 && avgParagraphLength <= 500) {
      return 70;
    }
    return 50;
  }

  private analyzeListUsage(html: string): number {
    const listMatches = html.match(/<[uo]l[^>]*>/gi) || [];
    return Math.min(listMatches.length * 25, 100);
  }

  private analyzeLinkStructure(links: any[]): number {
    if (links.length === 0) return 50;
    
    const externalLinks = links.filter(link => link.type === 'external').length;
    const internalLinks = links.filter(link => link.type === 'internal').length;
    
    // Good balance of internal and external links
    const ratio = externalLinks / (internalLinks + externalLinks);
    if (ratio >= 0.2 && ratio <= 0.8) {
      return 90;
    }
    return 60;
  }

  private analyzeOpenGraphData(og: any): number {
    let score = 0;
    if (og.title) score += 30;
    if (og.description) score += 30;
    if (og.image) score += 25;
    if (og.url) score += 15;
    return score;
  }

  private analyzeImageOptimization(images: any[]): number {
    if (images.length === 0) return 70; // Not having images isn't necessarily bad
    
    const imagesWithAlt = images.filter(img => img.alt && img.alt.trim().length > 0).length;
    return (imagesWithAlt / images.length) * 100;
  }

  private analyzeUrlStructure(url: string): number {
    try {
      const urlObj = new URL(url);
      let score = 50;
      
      // HTTPS
      if (urlObj.protocol === 'https:') score += 20;
      
      // Readable path
      const pathSegments = urlObj.pathname.split('/').filter(s => s.length > 0);
      if (pathSegments.length > 0 && pathSegments.length <= 5) score += 15;
      
      // No query parameters or minimal ones
      const paramCount = Array.from(urlObj.searchParams).length;
      if (paramCount === 0) score += 15;
      else if (paramCount <= 2) score += 10;
      
      return Math.min(score, 100);
    } catch {
      return 30;
    }
  }

  private analyzeContentFreshness(publishDate?: Date): number {
    if (!publishDate) return 50;
    
    const now = new Date();
    const ageInDays = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (ageInDays <= 30) return 100;
    if (ageInDays <= 90) return 80;
    if (ageInDays <= 365) return 60;
    if (ageInDays <= 730) return 40;
    return 20;
  }

  private analyzeReadability(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/);
    const syllables = this.countSyllables(text);
    
    // Flesch Reading Ease approximation
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    
    // Convert Flesch score to 0-100 scale
    return Math.max(0, Math.min(100, fleschScore));
  }

  private countSyllables(text: string): number {
    // Simplified syllable counting
    return text.toLowerCase().split(/\s+/).reduce((count, word) => {
      const syllableCount = word.match(/[aeiouy]+/g)?.length || 1;
      return count + Math.max(1, syllableCount);
    }, 0);
  }

  private analyzeDomainReputation(url: string): number {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      
      // Whitelist check
      if (this.defaultCriteria.whitelistedDomains.some(d => domain.includes(d))) {
        return 95;
      }
      
      // Blacklist check
      if (this.defaultCriteria.blacklistedDomains.some(d => domain.includes(d))) {
        return 10;
      }
      
      // Domain age and reputation indicators (simplified)
      if (domain.includes('edu') || domain.includes('gov')) return 90;
      if (domain.includes('org')) return 80;
      if (domain.includes('com')) return 70;
      
      return 60; // Default score
    } catch {
      return 30;
    }
  }

  private analyzeExternalReferences(links: any[]): number {
    const externalLinks = links.filter(link => link.type === 'external');
    if (externalLinks.length === 0) return 50;
    
    // Check for quality domains in external links
    const qualityDomains = ['wikipedia.org', 'github.com', 'stackoverflow.com', 'academic.edu'];
    const qualityLinks = externalLinks.filter(link => 
      qualityDomains.some(domain => link.href.includes(domain))
    );
    
    return Math.min((qualityLinks.length / externalLinks.length) * 100, 100);
  }

  private applyContentFilters(content: ExtractedContent, criteria: FilterCriteria): {
    issues: QualityIssue[];
  } {
    const issues: QualityIssue[] = [];
    
    criteria.contentFilters.forEach(filter => {
      switch (filter.type) {
        case 'length':
          if (content.wordCount < (filter.rule as number)) {
            issues.push({
              type: 'warning',
              category: 'content',
              message: `Content too short (${content.wordCount} words)`,
              suggestion: `Add more content to reach minimum ${filter.rule} words`,
              affectedScore: filter.severity
            });
          }
          break;
          
        case 'keyword':
          const regex = new RegExp(filter.rule as string, 'i');
          if (regex.test(content.plainText) || regex.test(content.title)) {
            issues.push({
              type: filter.action === 'block' ? 'critical' : 'warning',
              category: 'content',
              message: 'Content contains flagged keywords',
              suggestion: 'Review and remove inappropriate content',
              affectedScore: filter.severity
            });
          }
          break;
      }
    });
    
    return { issues };
  }

  private generateRecommendations(
    factors: QualityFactor[],
    issues: QualityIssue[],
    categories: any
  ): QualityRecommendation[] {
    const recommendations: QualityRecommendation[] = [];
    
    // Generate recommendations based on low-scoring factors
    factors.forEach(factor => {
      if (factor.score < 60) {
        recommendations.push({
          priority: factor.score < 30 ? 'high' : 'medium',
          category: this.getCategoryFromFactorName(factor.name),
          action: this.getRecommendationAction(factor.name, factor.score),
          expectedImprovement: Math.min(100 - factor.score, 30),
          difficulty: this.getImplementationDifficulty(factor.name)
        });
      }
    });
    
    // Generate recommendations based on issues
    issues.forEach(issue => {
      if (issue.type === 'critical' || issue.type === 'warning') {
        recommendations.push({
          priority: issue.type === 'critical' ? 'high' : 'medium',
          category: issue.category,
          action: issue.suggestion,
          expectedImprovement: issue.affectedScore,
          difficulty: 'medium'
        });
      }
    });
    
    return recommendations.slice(0, 10); // Limit to top 10 recommendations
  }

  private getCategoryFromFactorName(factorName: string): string {
    const categoryMap: Record<string, string> = {
      'Word Count': 'content',
      'Reading Time': 'content',
      'Content Uniqueness': 'content',
      'Language Quality': 'content',
      'Title Quality': 'structure',
      'Heading Structure': 'structure',
      'Meta Description': 'metadata',
      'Author Information': 'metadata',
      'Image Optimization': 'technical',
      'URL Structure': 'technical'
    };
    
    return categoryMap[factorName] || 'general';
  }

  private getRecommendationAction(factorName: string, score: number): string {
    const actionMap: Record<string, string> = {
      'Word Count': 'Add more detailed content and explanations',
      'Title Quality': 'Improve title clarity and descriptiveness',
      'Heading Structure': 'Add proper heading hierarchy (H1, H2, H3)',
      'Meta Description': 'Add a compelling meta description (150-160 characters)',
      'Image Optimization': 'Add alt text to all images',
      'Language Quality': 'Improve grammar and sentence structure'
    };
    
    return actionMap[factorName] || `Improve ${factorName.toLowerCase()}`;
  }

  private getImplementationDifficulty(factorName: string): 'easy' | 'medium' | 'hard' {
    const difficultyMap: Record<string, 'easy' | 'medium' | 'hard'> = {
      'Meta Description': 'easy',
      'Title Quality': 'easy',
      'Image Optimization': 'easy',
      'Word Count': 'medium',
      'Heading Structure': 'medium',
      'Language Quality': 'hard',
      'Content Uniqueness': 'hard'
    };
    
    return difficultyMap[factorName] || 'medium';
  }

  private evaluateFilterCriteria(
    content: ExtractedContent,
    overallScore: number,
    criteria: FilterCriteria
  ): boolean {
    // Check minimum score
    if (overallScore < criteria.minimumScore) {
      return false;
    }
    
    // Check domain blacklist
    const domain = new URL(content.url).hostname.toLowerCase();
    if (criteria.blacklistedDomains.some(d => domain.includes(d))) {
      return false;
    }
    
    // Check required categories (if any)
    if (criteria.requiredCategories.length > 0) {
      // Implementation would check if content belongs to required categories
    }
    
    return true;
  }

  // Public utility methods
  async batchAnalyze(contents: ExtractedContent[], criteria?: FilterCriteria): Promise<QualityScore[]> {
    const results = await Promise.allSettled(
      contents.map(content => this.analyzeQuality(content, criteria))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<QualityScore> => result.status === 'fulfilled')
      .map(result => result.value);
  }

  filterByQuality(contents: ExtractedContent[], minimumScore: number = 60): Promise<ExtractedContent[]> {
    return Promise.all(
      contents.map(async (content) => {
        const quality = await this.analyzeQuality(content);
        return quality.overall >= minimumScore ? content : null;
      })
    ).then(results => results.filter((content): content is ExtractedContent => content !== null));
  }

  generateEnhancementSuggestions(qualityScore: QualityScore): EnhancementSuggestion[] {
    const suggestions: EnhancementSuggestion[] = [];
    
    // Convert recommendations to enhancement suggestions
    qualityScore.recommendations.forEach(rec => {
      suggestions.push({
        type: rec.category as any,
        priority: rec.priority,
        description: rec.action,
        implementation: `To improve ${rec.category}: ${rec.action}`,
        expectedImprovement: rec.expectedImprovement,
        effort: rec.difficulty === 'easy' ? 'low' : rec.difficulty === 'hard' ? 'high' : 'medium'
      });
    });
    
    return suggestions;
  }
}

// Export singleton instance
export const qualityFilter = new QualityFilter();  