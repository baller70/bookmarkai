import { appLogger } from '../../lib/logger';
import { ExtractedContent } from './content-extractor';
import { QualityScore } from './quality-filter';
import { MultiLanguageContent, languageProcessor } from './language-processor';
import { performance } from 'perf_hooks';

const logger = appLogger;

export interface EnrichedContent extends ExtractedContent {
  enrichment: ContentEnrichment;
  processingHistory: ProcessingStep[];
  version: number;
  lastEnriched: Date;
}

export interface ContentEnrichment {
  aiGeneratedSummary: string;
  aiGeneratedTags: string[];
  aiGeneratedCategory: string;
  sentimentAnalysis: SentimentAnalysis;
  topicExtraction: TopicExtraction;
  entityRecognition: EntityRecognition;
  keywordDensity: KeywordDensity;
  relatedContent: RelatedContent[];
  contentThemes: string[];
  readabilityMetrics: ReadabilityMetrics;
  seoOptimization: SEOOptimization;
  socialMediaOptimization: SocialMediaOptimization;
}

export interface SentimentAnalysis {
  overall: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: Array<{
    emotion: string;
    intensity: number;
  }>;
  subjectivity: number; // 0-1 (objective to subjective)
}

export interface TopicExtraction {
  primaryTopics: Array<{
    topic: string;
    relevance: number;
    keywords: string[];
  }>;
  secondaryTopics: Array<{
    topic: string;
    relevance: number;
  }>;
  topicDistribution: Record<string, number>;
}

export interface EntityRecognition {
  people: Array<{
    name: string;
    confidence: number;
    context: string;
  }>;
  organizations: Array<{
    name: string;
    confidence: number;
    context: string;
  }>;
  locations: Array<{
    name: string;
    confidence: number;
    context: string;
  }>;
  dates: Array<{
    date: string;
    confidence: number;
    context: string;
  }>;
  technologies: Array<{
    name: string;
    confidence: number;
    context: string;
  }>;
}

export interface KeywordDensity {
  keywords: Array<{
    word: string;
    frequency: number;
    density: number;
    importance: number;
  }>;
  phrases: Array<{
    phrase: string;
    frequency: number;
    density: number;
    importance: number;
  }>;
  semanticKeywords: string[];
}

export interface RelatedContent {
  url: string;
  title: string;
  similarity: number;
  relationshipType: 'similar' | 'referenced' | 'topical' | 'contextual';
  source: string;
}

export interface ReadabilityMetrics {
  fleschKincaidGrade: number;
  fleschReadingEase: number;
  gunningFogIndex: number;
  smogIndex: number;
  averageWordsPerSentence: number;
  averageSyllablesPerWord: number;
  readingLevel: 'elementary' | 'middle' | 'high' | 'college' | 'graduate';
}

export interface SEOOptimization {
  titleOptimization: {
    currentLength: number;
    idealLength: number;
    suggestions: string[];
  };
  metaDescriptionOptimization: {
    currentLength: number;
    idealLength: number;
    suggestions: string[];
  };
  headingOptimization: {
    structure: Array<{ level: number; text: string; issues: string[] }>;
    suggestions: string[];
  };
  keywordOptimization: {
    primaryKeywords: string[];
    secondaryKeywords: string[];
    keywordDensity: Record<string, number>;
    suggestions: string[];
  };
  internalLinkingOpportunities: Array<{
    anchorText: string;
    targetUrl: string;
    relevance: number;
  }>;
}

export interface SocialMediaOptimization {
  twitterCard: {
    optimizedTitle: string;
    optimizedDescription: string;
    suggestedHashtags: string[];
  };
  openGraph: {
    optimizedTitle: string;
    optimizedDescription: string;
    suggestedImage: string;
  };
  linkedIn: {
    optimizedTitle: string;
    optimizedDescription: string;
    professionalTags: string[];
  };
  reddit: {
    suggestedSubreddits: string[];
    optimizedTitle: string;
  };
}

export interface ProcessingStep {
  stepName: string;
  timestamp: Date;
  duration: number;
  status: 'success' | 'failure' | 'warning';
  details: string;
  changes: string[];
}

export interface EnrichmentOptions {
  enableAISummary: boolean;
  enableTopicExtraction: boolean;
  enableSentimentAnalysis: boolean;
  enableEntityRecognition: boolean;
  enableSEOOptimization: boolean;
  enableSocialMediaOptimization: boolean;
  enableRelatedContentDiscovery: boolean;
  enableMultiLanguageProcessing: boolean;
  targetLanguages: string[];
  qualityThreshold: number;
  processingPriority: 'speed' | 'quality' | 'comprehensive';
}

export interface EnrichmentPipeline {
  name: string;
  steps: EnrichmentStep[];
  conditions: PipelineCondition[];
  priority: number;
  enabled: boolean;
}

export interface EnrichmentStep {
  name: string;
  processor: string;
  config: Record<string, any>;
  dependencies: string[];
  optional: boolean;
  timeout: number;
}

export interface PipelineCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export class EnrichmentProcessor {
  private pipelines: Map<string, EnrichmentPipeline> = new Map();
  private processingQueue: Array<{
    content: ExtractedContent;
    options: EnrichmentOptions;
    priority: number;
    timestamp: Date;
  }> = [];

  constructor() {
    this.initializeDefaultPipelines();
  }

  private initializeDefaultPipelines(): void {
    // Basic enrichment pipeline
    this.pipelines.set('basic', {
      name: 'Basic Content Enrichment',
      steps: [
        {
          name: 'AI Summary Generation',
          processor: 'aiSummary',
          config: { maxLength: 200 },
          dependencies: [],
          optional: false,
          timeout: 30000
        },
        {
          name: 'Tag Generation',
          processor: 'aiTags',
          config: { maxTags: 10 },
          dependencies: [],
          optional: false,
          timeout: 15000
        },
        {
          name: 'Category Classification',
          processor: 'aiCategory',
          config: {},
          dependencies: [],
          optional: false,
          timeout: 15000
        }
      ],
      conditions: [],
      priority: 1,
      enabled: true
    });

    // Comprehensive enrichment pipeline
    this.pipelines.set('comprehensive', {
      name: 'Comprehensive Content Enrichment',
      steps: [
        {
          name: 'AI Summary Generation',
          processor: 'aiSummary',
          config: { maxLength: 300 },
          dependencies: [],
          optional: false,
          timeout: 30000
        },
        {
          name: 'Topic Extraction',
          processor: 'topicExtraction',
          config: { maxTopics: 5 },
          dependencies: [],
          optional: false,
          timeout: 20000
        },
        {
          name: 'Sentiment Analysis',
          processor: 'sentimentAnalysis',
          config: {},
          dependencies: [],
          optional: false,
          timeout: 15000
        },
        {
          name: 'Entity Recognition',
          processor: 'entityRecognition',
          config: {},
          dependencies: [],
          optional: false,
          timeout: 25000
        },
        {
          name: 'SEO Optimization',
          processor: 'seoOptimization',
          config: {},
          dependencies: ['aiSummary', 'topicExtraction'],
          optional: true,
          timeout: 20000
        },
        {
          name: 'Social Media Optimization',
          processor: 'socialMediaOptimization',
          config: {},
          dependencies: ['aiSummary', 'topicExtraction'],
          optional: true,
          timeout: 15000
        }
      ],
      conditions: [
        {
          field: 'wordCount',
          operator: 'greater_than',
          value: 200
        }
      ],
      priority: 2,
      enabled: true
    });

    // SEO-focused pipeline
    this.pipelines.set('seo-focused', {
      name: 'SEO-Focused Enrichment',
      steps: [
        {
          name: 'Keyword Analysis',
          processor: 'keywordDensity',
          config: { minDensity: 0.01, maxDensity: 0.03 },
          dependencies: [],
          optional: false,
          timeout: 20000
        },
        {
          name: 'SEO Optimization',
          processor: 'seoOptimization',
          config: { comprehensive: true },
          dependencies: ['keywordDensity'],
          optional: false,
          timeout: 25000
        },
        {
          name: 'Readability Analysis',
          processor: 'readabilityMetrics',
          config: {},
          dependencies: [],
          optional: false,
          timeout: 15000
        }
      ],
      conditions: [],
      priority: 3,
      enabled: true
    });
  }

  async enrichContent(
    content: ExtractedContent,
    options?: Partial<EnrichmentOptions>
  ): Promise<EnrichedContent> {
    const startTime = performance.now();
    const enrichmentOptions: EnrichmentOptions = {
      enableAISummary: true,
      enableTopicExtraction: true,
      enableSentimentAnalysis: true,
      enableEntityRecognition: true,
      enableSEOOptimization: true,
      enableSocialMediaOptimization: true,
      enableRelatedContentDiscovery: false,
      enableMultiLanguageProcessing: false,
      targetLanguages: ['en'],
      qualityThreshold: 60,
      processingPriority: 'quality',
      ...options
    };

    try {
      logger.info('Starting content enrichment', { 
        url: content.url,
        wordCount: content.wordCount,
        options: enrichmentOptions
      });

      const processingHistory: ProcessingStep[] = [];

      // Select appropriate pipeline
      const pipeline = this.selectPipeline(content, enrichmentOptions);
      
      // Initialize enrichment object
      const enrichment: ContentEnrichment = {
        aiGeneratedSummary: '',
        aiGeneratedTags: [],
        aiGeneratedCategory: '',
        sentimentAnalysis: this.getDefaultSentiment(),
        topicExtraction: this.getDefaultTopics(),
        entityRecognition: this.getDefaultEntities(),
        keywordDensity: this.getDefaultKeywordDensity(),
        relatedContent: [],
        contentThemes: [],
        readabilityMetrics: this.getDefaultReadability(),
        seoOptimization: this.getDefaultSEO(),
        socialMediaOptimization: this.getDefaultSocialMedia()
      };

      // Process each step in the pipeline
      for (const step of pipeline.steps) {
        const stepStartTime = performance.now();
        
        try {
          // Check dependencies
          if (!this.checkStepDependencies(step, processingHistory)) {
            if (!step.optional) {
              throw new Error(`Dependencies not met for step: ${step.name}`);
            }
            continue;
          }

          // Execute processing step
          await this.executeProcessingStep(step, content, enrichment, enrichmentOptions);

          const stepDuration = performance.now() - stepStartTime;
          processingHistory.push({
            stepName: step.name,
            timestamp: new Date(),
            duration: Math.round(stepDuration),
            status: 'success',
            details: `Successfully completed ${step.name}`,
            changes: [`Updated ${step.processor}`]
          });

          logger.info(`Enrichment step completed`, { 
            step: step.name,
            duration: Math.round(stepDuration)
          });

        } catch (error) {
          const stepDuration = performance.now() - stepStartTime;
          processingHistory.push({
            stepName: step.name,
            timestamp: new Date(),
            duration: Math.round(stepDuration),
            status: step.optional ? 'warning' : 'failure',
            details: error instanceof Error ? error.message : 'Unknown error',
            changes: []
          });

          if (!step.optional) {
            throw error;
          }

          logger.warn(`Optional enrichment step failed`, { 
            step: step.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Multi-language processing if enabled
      let multiLanguageContent: MultiLanguageContent | undefined;
      if (enrichmentOptions.enableMultiLanguageProcessing) {
        try {
          multiLanguageContent = await languageProcessor.processMultiLanguageContent(
            content.plainText,
            enrichmentOptions.targetLanguages
          );
        } catch (error) {
          logger.warn('Multi-language processing failed', { 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      const enrichedContent: EnrichedContent = {
        ...content,
        enrichment,
        processingHistory,
        version: 1,
        lastEnriched: new Date()
      };

      const duration = performance.now() - startTime;
      logger.info('Content enrichment completed', { 
        url: content.url,
        pipeline: pipeline.name,
        stepsCompleted: processingHistory.filter(s => s.status === 'success').length,
        duration: Math.round(duration)
      });

      return enrichedContent;

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Content enrichment failed', error as Error, { 
        url: content.url,
        duration: Math.round(duration)
      });
      
      throw new Error(`Content enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private selectPipeline(content: ExtractedContent, options: EnrichmentOptions): EnrichmentPipeline {
    // Select pipeline based on processing priority and content characteristics
    switch (options.processingPriority) {
      case 'speed':
        return this.pipelines.get('basic')!;
      case 'comprehensive':
        return this.pipelines.get('comprehensive')!;
      case 'quality':
      default:
        // Choose based on content characteristics
        if (content.wordCount > 1000) {
          return this.pipelines.get('comprehensive')!;
        } else if (options.enableSEOOptimization) {
          return this.pipelines.get('seo-focused')!;
        } else {
          return this.pipelines.get('basic')!;
        }
    }
  }

  private checkStepDependencies(step: EnrichmentStep, history: ProcessingStep[]): boolean {
    if (step.dependencies.length === 0) return true;
    
    const completedSteps = history
      .filter(h => h.status === 'success')
      .map(h => h.stepName);
    
    return step.dependencies.every(dep => 
      completedSteps.some(completed => completed.includes(dep))
    );
  }

  private async executeProcessingStep(
    step: EnrichmentStep,
    content: ExtractedContent,
    enrichment: ContentEnrichment,
    options: EnrichmentOptions
  ): Promise<void> {
    switch (step.processor) {
      case 'aiSummary':
        enrichment.aiGeneratedSummary = await this.generateAISummary(content, step.config);
        break;
      case 'aiTags':
        enrichment.aiGeneratedTags = await this.generateAITags(content, step.config);
        break;
      case 'aiCategory':
        enrichment.aiGeneratedCategory = await this.generateAICategory(content, step.config);
        break;
      case 'topicExtraction':
        enrichment.topicExtraction = await this.extractTopics(content, step.config);
        break;
      case 'sentimentAnalysis':
        enrichment.sentimentAnalysis = await this.analyzeSentiment(content, step.config);
        break;
      case 'entityRecognition':
        enrichment.entityRecognition = await this.recognizeEntities(content, step.config);
        break;
      case 'keywordDensity':
        enrichment.keywordDensity = await this.analyzeKeywordDensity(content, step.config);
        break;
      case 'readabilityMetrics':
        enrichment.readabilityMetrics = await this.calculateReadabilityMetrics(content, step.config);
        break;
      case 'seoOptimization':
        enrichment.seoOptimization = await this.optimizeForSEO(content, enrichment, step.config);
        break;
      case 'socialMediaOptimization':
        enrichment.socialMediaOptimization = await this.optimizeForSocialMedia(content, enrichment, step.config);
        break;
      default:
        throw new Error(`Unknown processor: ${step.processor}`);
    }
  }

  // AI Processing Methods (simplified implementations)
  private async generateAISummary(content: ExtractedContent, config: any): Promise<string> {
    // In a real implementation, this would call OpenAI or another AI service
    const maxLength = config.maxLength || 200;
    const sentences = content.plainText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Simple extractive summarization (take first few sentences)
    let summary = '';
    let currentLength = 0;
    
    for (const sentence of sentences.slice(0, 3)) {
      const trimmedSentence = sentence.trim();
      if (currentLength + trimmedSentence.length <= maxLength) {
        summary += trimmedSentence + '. ';
        currentLength += trimmedSentence.length + 2;
      } else {
        break;
      }
    }
    
    return summary.trim() || 'No summary available';
  }

  private async generateAITags(content: ExtractedContent, config: any): Promise<string[]> {
    const maxTags = config.maxTags || 10;
    
    // Simple keyword extraction for tags
    const words = content.plainText.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });
    
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTags)
      .map(([word]) => word);
  }

  private async generateAICategory(content: ExtractedContent, config: any): Promise<string> {
    // Simple category classification based on keywords
    const categories = {
      'Technology': ['software', 'programming', 'tech', 'computer', 'digital', 'code', 'development'],
      'Business': ['business', 'company', 'market', 'finance', 'economy', 'startup', 'entrepreneur'],
      'Science': ['research', 'study', 'science', 'scientific', 'experiment', 'discovery'],
      'Health': ['health', 'medical', 'medicine', 'doctor', 'treatment', 'disease'],
      'Education': ['education', 'learning', 'school', 'university', 'student', 'teaching'],
      'Entertainment': ['entertainment', 'movie', 'music', 'game', 'fun', 'comedy'],
      'News': ['news', 'breaking', 'report', 'journalist', 'media', 'press']
    };
    
    const text = content.plainText.toLowerCase();
    let bestCategory = 'General';
    let bestScore = 0;
    
    for (const [category, keywords] of Object.entries(categories)) {
      const score = keywords.reduce((sum, keyword) => {
        const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
        return sum + matches;
      }, 0);
      
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }
    
    return bestCategory;
  }

  private async extractTopics(content: ExtractedContent, config: any): Promise<TopicExtraction> {
    const maxTopics = config.maxTopics || 5;
    
    // Simple topic extraction using TF-IDF-like approach
    const words = content.plainText.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4);
    
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });
    
    const topWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTopics);
    
    const primaryTopics = topWords.map(([word, freq]) => ({
      topic: word,
      relevance: freq / words.length,
      keywords: [word]
    }));
    
    return {
      primaryTopics,
      secondaryTopics: [],
      topicDistribution: Object.fromEntries(topWords)
    };
  }

  private async analyzeSentiment(content: ExtractedContent, config: any): Promise<SentimentAnalysis> {
    // Simple sentiment analysis based on positive/negative word lists
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'best'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'poor', 'disappointing'];
    
    const text = content.plainText.toLowerCase();
    const words = text.split(/\s+/);
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });
    
    const total = positiveCount + negativeCount;
    let overall: 'positive' | 'negative' | 'neutral' = 'neutral';
    let confidence = 0.5;
    
    if (total > 0) {
      const positiveRatio = positiveCount / total;
      if (positiveRatio > 0.6) {
        overall = 'positive';
        confidence = positiveRatio;
      } else if (positiveRatio < 0.4) {
        overall = 'negative';
        confidence = 1 - positiveRatio;
      }
    }
    
    return {
      overall,
      confidence,
      emotions: [
        { emotion: 'joy', intensity: positiveCount / words.length },
        { emotion: 'sadness', intensity: negativeCount / words.length }
      ],
      subjectivity: Math.min((positiveCount + negativeCount) / words.length * 2, 1)
    };
  }

  private async recognizeEntities(content: ExtractedContent, config: any): Promise<EntityRecognition> {
    // Simple named entity recognition using patterns
    const text = content.plainText;
    
    // Simple patterns for different entity types
    const peoplePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    const orgPattern = /\b[A-Z][a-z]+ (?:Inc|Corp|LLC|Ltd|Company|Corporation)\b/g;
    const datePattern = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2},? \d{4}\b/g;
    
    const people = (text.match(peoplePattern) || []).map(name => ({
      name,
      confidence: 0.7,
      context: 'Detected person name'
    }));
    
    const organizations = (text.match(orgPattern) || []).map(name => ({
      name,
      confidence: 0.8,
      context: 'Detected organization'
    }));
    
    const dates = (text.match(datePattern) || []).map(date => ({
      date,
      confidence: 0.9,
      context: 'Detected date'
    }));
    
    return {
      people: people.slice(0, 10),
      organizations: organizations.slice(0, 10),
      locations: [],
      dates: dates.slice(0, 10),
      technologies: []
    };
  }

  private async analyzeKeywordDensity(content: ExtractedContent, config: any): Promise<KeywordDensity> {
    const text = content.plainText.toLowerCase();
    const words = text.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(word => word.length > 2);
    const totalWords = words.length;
    
    // Calculate word frequency
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });
    
    // Convert to keyword density format
    const keywords = Array.from(wordFreq.entries())
      .map(([word, frequency]) => ({
        word,
        frequency,
        density: frequency / totalWords,
        importance: frequency * (word.length / 10) // Simple importance calculation
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 20);
    
    return {
      keywords,
      phrases: [], // Would require n-gram analysis
      semanticKeywords: keywords.slice(0, 10).map(k => k.word)
    };
  }

  private async calculateReadabilityMetrics(content: ExtractedContent, config: any): Promise<ReadabilityMetrics> {
    const text = content.plainText;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = this.countSyllables(text);
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    // Flesch Reading Ease
    const fleschReadingEase = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    
    // Flesch-Kincaid Grade Level
    const fleschKincaidGrade = (0.39 * avgWordsPerSentence) + (11.8 * avgSyllablesPerWord) - 15.59;
    
    // Determine reading level
    let readingLevel: 'elementary' | 'middle' | 'high' | 'college' | 'graduate' = 'middle';
    if (fleschKincaidGrade <= 6) readingLevel = 'elementary';
    else if (fleschKincaidGrade <= 9) readingLevel = 'middle';
    else if (fleschKincaidGrade <= 13) readingLevel = 'high';
    else if (fleschKincaidGrade <= 16) readingLevel = 'college';
    else readingLevel = 'graduate';
    
    return {
      fleschKincaidGrade: Math.round(fleschKincaidGrade * 10) / 10,
      fleschReadingEase: Math.round(fleschReadingEase * 10) / 10,
      gunningFogIndex: 0, // Would require complex word counting
      smogIndex: 0, // Would require polysyllabic word counting
      averageWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      averageSyllablesPerWord: Math.round(avgSyllablesPerWord * 10) / 10,
      readingLevel
    };
  }

  private async optimizeForSEO(
    content: ExtractedContent,
    enrichment: ContentEnrichment,
    config: any
  ): Promise<SEOOptimization> {
    const title = content.title;
    const description = content.description;
    
    return {
      titleOptimization: {
        currentLength: title.length,
        idealLength: 60,
        suggestions: title.length > 60 ? ['Shorten title to under 60 characters'] : 
                    title.length < 30 ? ['Expand title to 30-60 characters'] : []
      },
      metaDescriptionOptimization: {
        currentLength: description.length,
        idealLength: 160,
        suggestions: description.length === 0 ? ['Add meta description'] :
                    description.length > 160 ? ['Shorten description to under 160 characters'] : []
      },
      headingOptimization: {
        structure: [],
        suggestions: ['Add proper heading hierarchy', 'Include keywords in headings']
      },
      keywordOptimization: {
        primaryKeywords: enrichment.aiGeneratedTags.slice(0, 3),
        secondaryKeywords: enrichment.aiGeneratedTags.slice(3, 8),
        keywordDensity: {},
        suggestions: ['Optimize keyword density', 'Add semantic keywords']
      },
      internalLinkingOpportunities: []
    };
  }

  private async optimizeForSocialMedia(
    content: ExtractedContent,
    enrichment: ContentEnrichment,
    config: any
  ): Promise<SocialMediaOptimization> {
    const title = content.title;
    const summary = enrichment.aiGeneratedSummary;
    const tags = enrichment.aiGeneratedTags;
    
    return {
      twitterCard: {
        optimizedTitle: title.length > 70 ? title.substring(0, 67) + '...' : title,
        optimizedDescription: summary.length > 200 ? summary.substring(0, 197) + '...' : summary,
        suggestedHashtags: tags.slice(0, 3).map(tag => `#${tag}`)
      },
      openGraph: {
        optimizedTitle: title,
        optimizedDescription: summary,
        suggestedImage: content.images[0]?.src || ''
      },
      linkedIn: {
        optimizedTitle: title,
        optimizedDescription: summary,
        professionalTags: tags.filter(tag => 
          ['business', 'technology', 'professional', 'career'].some(prof => 
            tag.toLowerCase().includes(prof)
          )
        )
      },
      reddit: {
        suggestedSubreddits: this.suggestSubreddits(enrichment.aiGeneratedCategory, tags),
        optimizedTitle: title
      }
    };
  }

  private suggestSubreddits(category: string, tags: string[]): string[] {
    const subredditMap: Record<string, string[]> = {
      'Technology': ['r/technology', 'r/programming', 'r/webdev'],
      'Business': ['r/business', 'r/entrepreneur', 'r/startups'],
      'Science': ['r/science', 'r/askscience', 'r/todayilearned'],
      'Health': ['r/health', 'r/fitness', 'r/nutrition'],
      'Education': ['r/education', 'r/learning', 'r/studytips']
    };
    
    return subredditMap[category] || ['r/general'];
  }

  private countSyllables(text: string): number {
    return text.toLowerCase().split(/\s+/).reduce((count, word) => {
      const syllableCount = word.match(/[aeiouy]+/g)?.length || 1;
      return count + Math.max(1, syllableCount);
    }, 0);
  }

  // Default value getters
  private getDefaultSentiment(): SentimentAnalysis {
    return {
      overall: 'neutral',
      confidence: 0.5,
      emotions: [],
      subjectivity: 0.5
    };
  }

  private getDefaultTopics(): TopicExtraction {
    return {
      primaryTopics: [],
      secondaryTopics: [],
      topicDistribution: {}
    };
  }

  private getDefaultEntities(): EntityRecognition {
    return {
      people: [],
      organizations: [],
      locations: [],
      dates: [],
      technologies: []
    };
  }

  private getDefaultKeywordDensity(): KeywordDensity {
    return {
      keywords: [],
      phrases: [],
      semanticKeywords: []
    };
  }

  private getDefaultReadability(): ReadabilityMetrics {
    return {
      fleschKincaidGrade: 0,
      fleschReadingEase: 0,
      gunningFogIndex: 0,
      smogIndex: 0,
      averageWordsPerSentence: 0,
      averageSyllablesPerWord: 0,
      readingLevel: 'middle'
    };
  }

  private getDefaultSEO(): SEOOptimization {
    return {
      titleOptimization: { currentLength: 0, idealLength: 60, suggestions: [] },
      metaDescriptionOptimization: { currentLength: 0, idealLength: 160, suggestions: [] },
      headingOptimization: { structure: [], suggestions: [] },
      keywordOptimization: { primaryKeywords: [], secondaryKeywords: [], keywordDensity: {}, suggestions: [] },
      internalLinkingOpportunities: []
    };
  }

  private getDefaultSocialMedia(): SocialMediaOptimization {
    return {
      twitterCard: { optimizedTitle: '', optimizedDescription: '', suggestedHashtags: [] },
      openGraph: { optimizedTitle: '', optimizedDescription: '', suggestedImage: '' },
      linkedIn: { optimizedTitle: '', optimizedDescription: '', professionalTags: [] },
      reddit: { suggestedSubreddits: [], optimizedTitle: '' }
    };
  }

  // Public utility methods
  async batchEnrich(
    contents: ExtractedContent[],
    options?: Partial<EnrichmentOptions>
  ): Promise<EnrichedContent[]> {
    const results = await Promise.allSettled(
      contents.map(content => this.enrichContent(content, options))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<EnrichedContent> => result.status === 'fulfilled')
      .map(result => result.value);
  }

  addPipeline(pipeline: EnrichmentPipeline): void {
    this.pipelines.set(pipeline.name, pipeline);
    logger.info('Pipeline added', { name: pipeline.name });
  }

  removePipeline(name: string): void {
    this.pipelines.delete(name);
    logger.info('Pipeline removed', { name });
  }

  getPipelines(): EnrichmentPipeline[] {
    return Array.from(this.pipelines.values());
  }

  async processQueue(): Promise<void> {
    while (this.processingQueue.length > 0) {
      const item = this.processingQueue.shift()!;
      try {
        await this.enrichContent(item.content, item.options);
      } catch (error) {
        logger.error('Queue processing failed', error as Error, { url: item.content.url });
      }
    }
  }
}

// Export singleton instance
export const enrichmentProcessor = new EnrichmentProcessor();  