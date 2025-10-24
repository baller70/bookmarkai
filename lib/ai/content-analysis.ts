import { enhancedOpenAI, MODEL_CONFIGS } from './openai-client';
import { appLogger } from '../logger';
import { withCache } from '../cache/api-cache';

// Create logger for content analysis
const logger = appLogger;

// Content analysis interfaces
export interface ContentAnalysisRequest {
  url: string;
  title?: string;
  description?: string;
  content?: string;
  html?: string;
  userId: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  categories: string[];
  interests: string[];
  language: string;
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
  includeKeywords: boolean;
  includeSentiment: boolean;
  includeTopics: boolean;
  includeReadingTime: boolean;
}

export interface ContentAnalysisResult {
  // Basic information
  title: string;
  description: string;
  summary: string;
  
  // AI-generated insights
  aiSummary: string;
  aiCategory: string;
  aiTags: string[];
  aiNotes: string;
  
  // Advanced analysis
  keywords: string[];
  topics: string[];
  sentiment: {
    score: number; // -1 to 1
    label: 'negative' | 'neutral' | 'positive';
    confidence: number;
  };
  
  // Content metrics
  readingTime: number; // in minutes
  complexity: 'beginner' | 'intermediate' | 'advanced';
  contentType: 'article' | 'tutorial' | 'reference' | 'news' | 'blog' | 'documentation' | 'tool' | 'other';
  
  // Quality assessment
  quality: {
    score: number; // 0 to 100
    factors: string[];
    issues: string[];
  };
  
  // Recommendations
  recommendations: {
    relatedTopics: string[];
    suggestedActions: string[];
    learningPath: string[];
  };
  
  // Metadata
  language: string;
  processedAt: number;
  processingTime: number;
  confidence: number;
}

// Content extraction utilities
export class ContentExtractor {
  // Extract text content from HTML
  static extractTextFromHTML(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Extract metadata from HTML
  static extractMetadata(html: string): {
    title?: string;
    description?: string;
    keywords?: string;
    author?: string;
    publishDate?: string;
    ogImage?: string;
  } {
    const metadata: any = {};

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=['"](description|og:description)['"'][^>]*content=['"']([^'"]*)['"']/i);
    if (descMatch) {
      metadata.description = descMatch[2].trim();
    }

    // Extract keywords
    const keywordsMatch = html.match(/<meta[^>]*name=['"]keywords['"'][^>]*content=['"']([^'"]*)['"']/i);
    if (keywordsMatch) {
      metadata.keywords = keywordsMatch[1].trim();
    }

    // Extract author
    const authorMatch = html.match(/<meta[^>]*name=['"](author|article:author)['"'][^>]*content=['"']([^'"]*)['"']/i);
    if (authorMatch) {
      metadata.author = authorMatch[2].trim();
    }

    // Extract publish date
    const dateMatch = html.match(/<meta[^>]*property=['"]article:published_time['"'][^>]*content=['"']([^'"]*)['"']/i);
    if (dateMatch) {
      metadata.publishDate = dateMatch[1].trim();
    }

    // Extract OG image
    const imageMatch = html.match(/<meta[^>]*property=['"]og:image['"'][^>]*content=['"']([^'"]*)['"']/i);
    if (imageMatch) {
      metadata.ogImage = imageMatch[1].trim();
    }

    return metadata;
  }

  // Calculate reading time
  static calculateReadingTime(text: string): number {
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  // Detect content type based on URL and content
  static detectContentType(url: string, content: string): ContentAnalysisResult['contentType'] {
    const urlLower = url.toLowerCase();
    const contentLower = content.toLowerCase();

    // Check URL patterns
    if (urlLower.includes('github.com') || urlLower.includes('docs.') || urlLower.includes('/docs/')) {
      return 'documentation';
    }
    if (urlLower.includes('tutorial') || contentLower.includes('tutorial') || contentLower.includes('step by step')) {
      return 'tutorial';
    }
    if (urlLower.includes('news.') || urlLower.includes('blog.') || contentLower.includes('published on')) {
      return 'news';
    }
    if (urlLower.includes('tool') || urlLower.includes('app.') || contentLower.includes('download')) {
      return 'tool';
    }
    if (contentLower.includes('reference') || contentLower.includes('api documentation')) {
      return 'reference';
    }

    // Default to article
    return 'article';
  }
}

// Main content analysis service
export class ContentAnalysisService {
  // Analyze content with caching
  async analyzeContent(request: ContentAnalysisRequest): Promise<ContentAnalysisResult> {
    return this.performAnalysis(request);
  }

  // Perform the actual analysis
  private async performAnalysis(request: ContentAnalysisRequest): Promise<ContentAnalysisResult> {
    const startTime = Date.now();
    logger.info('Starting content analysis', { url: request.url, userId: request.userId });

    try {
      // Extract content if HTML is provided
      let content = request.content || '';
      let metadata: any = {};
      
      if (request.html) {
        content = ContentExtractor.extractTextFromHTML(request.html);
        metadata = ContentExtractor.extractMetadata(request.html);
      }

      // Limit content length to avoid token limits
      const maxContentLength = 8000;
      if (content.length > maxContentLength) {
        content = content.substring(0, maxContentLength) + '...';
      }

      // Prepare analysis prompt based on user preferences
      const analysisPrompt = this.createAnalysisPrompt(request, content, metadata);

      // Call OpenAI for analysis (with graceful fallback)
      let completion: any;
      try {
        completion = await enhancedOpenAI.chatCompletion(
          [
            {
              role: 'system',
              content: 'You are an expert content analyst specializing in bookmark categorization and content understanding. Always return valid JSON responses.'
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          {
            ...MODEL_CONFIGS.CONTENT_ANALYSIS,
            temperature: 0.3, // Lower temperature for more consistent analysis
          },
          'content-analysis'
        );
      } catch (e) {
        logger.warn('OpenAI unavailable, using heuristic fallback');
        const tagsGuess = this.heuristicTags(request.url, content, metadata);
        const categoryGuess = this.heuristicCategory(request.url, content, metadata);
        completion = {
          choices: [{ message: { content: JSON.stringify({
            title: request.title || metadata.title || 'Untitled',
            description: request.description || metadata.description || 'Auto description unavailable',
            summary: 'Heuristic summary',
            aiSummary: 'Heuristic AI summary',
            category: categoryGuess,
            tags: tagsGuess,
            notes: 'Generated by heuristic fallback',
            keywords: tagsGuess,
            topics: tagsGuess.slice(0, 3),
            sentiment: { score: 0, label: 'neutral', confidence: 0.5 },
            complexity: 'intermediate',
            quality: { score: 50, factors: [], issues: [] },
            recommendations: { relatedTopics: [], suggestedActions: [], learningPath: [] },
            language: 'en',
            confidence: 0.5
          }) } }]
        };
      }

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse AI response
      const aiAnalysis = this.parseAIResponse(response);

      // Calculate additional metrics
      const readingTime = ContentExtractor.calculateReadingTime(content);
      const contentType = ContentExtractor.detectContentType(request.url, content);
      
      // Build final result
      const result: ContentAnalysisResult = {
        // Basic information
        title: request.title || metadata.title || aiAnalysis.title || 'Untitled',
        description: request.description || metadata.description || aiAnalysis.description || '',
        summary: aiAnalysis.summary,
        
        // AI-generated insights
        aiSummary: aiAnalysis.aiSummary,
        aiCategory: aiAnalysis.category,
        aiTags: aiAnalysis.tags,
        aiNotes: aiAnalysis.notes,
        
        // Advanced analysis
        keywords: aiAnalysis.keywords,
        topics: aiAnalysis.topics,
        sentiment: aiAnalysis.sentiment,
        
        // Content metrics
        readingTime,
        complexity: aiAnalysis.complexity,
        contentType,
        
        // Quality assessment
        quality: aiAnalysis.quality,
        
        // Recommendations
        recommendations: aiAnalysis.recommendations,
        
        // Metadata
        language: aiAnalysis.language || 'en',
        processedAt: Date.now(),
        processingTime: Date.now() - startTime,
        confidence: aiAnalysis.confidence,
      };

      logger.info('Content analysis completed', {
        url: request.url,
        userId: request.userId,
        processingTime: result.processingTime,
        confidence: result.confidence,
        category: result.aiCategory,
        tagsCount: result.aiTags.length,
      });

      return result;
    } catch (error) {
      logger.error('Content analysis failed', error instanceof Error ? error : new Error(String(error)), {
        url: request.url,
        userId: request.userId,
        processingTime: Date.now() - startTime,
      });
      throw error;
    }
  }

  // Create analysis prompt based on user preferences
  private createAnalysisPrompt(request: ContentAnalysisRequest, content: string, metadata: any): string {
    const preferences = request.preferences || {} as any;
    const analysisDepth = (preferences as any).analysisDepth || 'detailed';
    
    return `Analyze the following web content and provide a comprehensive analysis.

URL: ${request.url}
Title: ${request.title || metadata.title || 'Not provided'}
Meta Description: ${request.description || metadata.description || 'Not provided'}

Content:
${content}

User Preferences:
- Categories of interest: ${(preferences as any).categories?.join(', ') || 'General'}
- User interests: ${(preferences as any).interests?.join(', ') || 'General'}
- Language: ${(preferences as any).language || 'English'}
- Analysis depth: ${analysisDepth}

Please provide a ${analysisDepth} analysis and return ONLY valid JSON with this structure:
{
  "title": "Extracted or improved title",
  "description": "Brief description (1-2 sentences)",
  "summary": "Concise summary (2-3 sentences)",
  "aiSummary": "Detailed AI-generated summary (3-4 sentences)",
  "category": "Most appropriate category",
  "tags": ["relevant", "tags", "for", "categorization"],
  "notes": "Key insights and why this content is valuable",
  "keywords": ["important", "keywords", "from", "content"],
  "topics": ["main", "topics", "covered"],
  "sentiment": {
    "score": 0.5,
    "label": "neutral",
    "confidence": 0.8
  },
  "complexity": "intermediate",
  "quality": {
    "score": 85,
    "factors": ["well-written", "informative", "up-to-date"],
    "issues": ["minor formatting issues"]
  },
  "recommendations": {
    "relatedTopics": ["related", "topics", "to", "explore"],
    "suggestedActions": ["bookmark for reference", "share with team"],
    "learningPath": ["next", "steps", "for", "learning"]
  },
  "language": "en",
  "confidence": 0.9
}

Guidelines:
- Categories should be broad and useful (e.g., "Development", "Design", "Business", "Research")
- Tags should be specific and searchable
- Sentiment score: -1 (negative) to 1 (positive)
- Complexity: "beginner", "intermediate", or "advanced"
- Quality score: 0-100 based on content quality, accuracy, and usefulness
- Confidence: 0-1 indicating how confident the analysis is
- Consider user's interests when suggesting categories and tags`;
  }

  // Heuristic tag/category fallback when OpenAI is unavailable
  private heuristicTags(url: string, content: string, metadata: any): string[] {
    const base: string[] = [];
    const lower = (content || '').toLowerCase();
    const pushIf = (cond: boolean, tag: string) => { if (cond) base.push(tag); };
    pushIf(/react|next\.js|javascript|typescript/.test(lower), 'development');
    pushIf(/design|ui|ux|css|tailwind/.test(lower), 'design');
    pushIf(/ai|openai|machine learning|model/.test(lower), 'ai');
    pushIf(/api|backend|database|supabase|prisma/.test(lower), 'backend');
    const host = (() => { try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }})();
    if (host.includes('github')) base.push('github');
    return Array.from(new Set(base)).slice(0, 6);
  }

  private heuristicCategory(url: string, content: string, metadata: any): string {
    const lower = (content || '').toLowerCase();
    if (/design|ui|ux|css|tailwind/.test(lower)) return 'Design';
    if (/react|next\.js|javascript|typescript/.test(lower)) return 'Development';
    if (/ai|openai|machine learning|model/.test(lower)) return 'AI';
    if (/business|marketing|strategy|product/.test(lower)) return 'Business';
    return 'General';
  }

  // Parse AI response with error handling
  private parseAIResponse(response: string): any {
    try {
      // Clean up response (remove any markdown formatting)
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      
      const parsed = JSON.parse(cleanResponse);
      
      // Validate required fields - be flexible with AI response format
      if (!parsed.category && !parsed.aiCategory) {
        console.warn('No category found in AI response, using fallback');
        parsed.category = 'General';
      }
      
      if (!parsed.tags && !parsed.aiTags) {
        console.warn('No tags found in AI response, using empty array');
        parsed.tags = [];
      }
      
      // Ensure we have some form of summary/description
      if (!parsed.summary && !parsed.aiSummary && !parsed.description) {
        console.warn('No summary found in AI response, using fallback');
        parsed.summary = 'AI analysis summary not available';
      }

      // Ensure arrays are arrays
      parsed.tags = Array.isArray(parsed.tags) ? parsed.tags : [];
      parsed.keywords = Array.isArray(parsed.keywords) ? parsed.keywords : [];
      parsed.topics = Array.isArray(parsed.topics) ? parsed.topics : [];

      // Ensure sentiment has proper structure
      if (!parsed.sentiment) {
        parsed.sentiment = { score: 0, label: 'neutral', confidence: 0.5 };
      }

      // Ensure quality has proper structure
      if (!parsed.quality) {
        parsed.quality = { score: 50, factors: [], issues: [] };
      }

      // Ensure recommendations has proper structure
      if (!parsed.recommendations) {
        parsed.recommendations = { relatedTopics: [], suggestedActions: [], learningPath: [] };
      }

      // Set defaults for missing fields
      parsed.confidence = parsed.confidence || 0.7;
      parsed.language = parsed.language || 'en';
      parsed.complexity = parsed.complexity || 'intermediate';

      return parsed;
    } catch (error) {
      logger.error('Failed to parse AI response', error instanceof Error ? error : new Error(String(error)), {
        response: response.substring(0, 500),
      });
      
      // Return fallback analysis
      return {
        title: 'Content Analysis',
        description: 'Unable to analyze content',
        summary: 'Content analysis failed',
        aiSummary: 'Failed to generate AI summary',
        category: 'General',
        tags: ['unanalyzed'],
        notes: 'Content could not be analyzed',
        keywords: [],
        topics: [],
        sentiment: { score: 0, label: 'neutral', confidence: 0 },
        complexity: 'intermediate',
        quality: { score: 0, factors: [], issues: ['Analysis failed'] },
        recommendations: { relatedTopics: [], suggestedActions: [], learningPath: [] },
        language: 'en',
        confidence: 0,
      };
    }
  }

  // Batch analyze multiple URLs
  async batchAnalyze(requests: ContentAnalysisRequest[]): Promise<ContentAnalysisResult[]> {
    logger.info('Starting batch content analysis', { count: requests.length });

    const results = await Promise.allSettled(
      requests.map(request => this.analyzeContent(request))
    );

    const successful = results
      .filter((result): result is PromiseFulfilledResult<ContentAnalysisResult> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);

    const failed = results.filter(result => result.status === 'rejected').length;

    logger.info('Batch content analysis completed', {
      total: requests.length,
      successful: successful.length,
      failed,
    });

    return successful;
  }

  // Alias for batch analyze
  async analyzeContentBatch(requests: ContentAnalysisRequest[]): Promise<ContentAnalysisResult[]> {
    return this.batchAnalyze(requests);
  }

  // Extract content from URL
  async extractContentFromUrl(url: string): Promise<{ content: string; html?: string; metadata?: any }> {
    logger.info('Extracting content from URL', { url });
    
    try {
      // Fetch the URL content
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BookmarkHub/1.0;)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status}`);
      }
      
      const html = await response.text();
      const content = ContentExtractor.extractTextFromHTML(html);
      const metadata = ContentExtractor.extractMetadata(html);
      
      return { content, html, metadata };
    } catch (error) {
      logger.error('Failed to extract content from URL', error instanceof Error ? error : new Error(String(error)), { url });
      throw error;
    }
  }

  // Get similar content suggestions based on analysis
  async getSimilarContentSuggestions(
    analysis: ContentAnalysisResult,
    count: number = 5
  ): Promise<any[]> {
    logger.info('Getting similar content suggestions', {
      category: analysis.aiCategory,
      tags: analysis.aiTags,
      count
    });
    
    // This would typically query a database or recommendation engine
    // For now, return empty array as placeholder
    return [];
  }

  // Update analysis based on user feedback
  async updateAnalysisWithFeedback(
    url: string,
    userId: string,
    feedback: {
      correctCategory?: string;
      correctTags?: string[];
      quality?: number;
      notes?: string;
    }
  ): Promise<void> {
    logger.info('Updating content analysis with user feedback', {
      url,
      userId,
      feedback,
    });

    // Here you would typically store the feedback to improve future analyses
    // This could involve fine-tuning or updating prompts based on user corrections
    
    // For now, we'll just log the feedback for monitoring
    logger.info('Content analysis feedback recorded', {
      url,
      userId,
      feedback,
    });
  }
}

// Export singleton instance
export const contentAnalysisService = new ContentAnalysisService();

// Export utility functions
export const contentAnalysisUtils = {
  generateSuggestions: async (analysis: any, count: number = 5) => {
    // Implementation for generating suggestions based on analysis
    return [];
  },
  getSimilarContentSuggestions: async (analysis: any, count: number = 5) => {
    // Alias for generating suggestions
    return contentAnalysisService.getSimilarContentSuggestions(analysis, count);
  },
  validateAnalysis: (analysis: any) => {
    // Implementation for validating analysis
    return true;
  }
};

// ContentExtractor is already exported above as a class declaration       