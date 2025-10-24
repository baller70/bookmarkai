import { contentAnalysisService, ContentAnalysisResult } from './content-analysis';
// // import { performanceUtils } from '../monitoring/performance-enhanced';
import { logger } from '../logger';

export interface TagSuggestion {
  tag: string;
  confidence: number;
  source: 'ai' | 'content' | 'url' | 'manual' | 'category';
  category?: string;
  relatedTags?: string[];
}

export interface TagCluster {
  id: string;
  name: string;
  tags: string[];
  description: string;
  color: string;
  bookmarkCount: number;
  lastUsed: Date;
}

export interface TagAnalytics {
  tag: string;
  usage: number;
  trending: boolean;
  relatedTags: string[];
  categories: string[];
  avgQualityScore: number;
  bookmarkIds: string[];
}

export interface TaggingOptions {
  maxTags?: number;
  minConfidence?: number;
  includeAiTags?: boolean;
  includeContentTags?: boolean;
  includeUrlTags?: boolean;
  excludeCommonWords?: boolean;
  customStopWords?: string[];
  categoryWeighting?: boolean;
}

class IntelligentTaggingService {
  private readonly DEFAULT_OPTIONS: TaggingOptions = {
    maxTags: 10,
    minConfidence: 0.6,
    includeAiTags: true,
    includeContentTags: true,
    includeUrlTags: true,
    excludeCommonWords: true,
    customStopWords: [],
    categoryWeighting: true
  };

  private readonly COMMON_STOP_WORDS = [
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'among', 'this', 'that', 'these', 'those', 'is', 'are', 'was',
    'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'must', 'can', 'how', 'what', 'when',
    'where', 'why', 'who', 'which', 'article', 'guide', 'tutorial', 'introduction'
  ];

  private readonly CATEGORY_WEIGHTS: Record<string, number> = {
    'technology': 1.2,
    'programming': 1.2,
    'science': 1.1,
    'business': 1.0,
    'education': 1.1,
    'research': 1.2,
    'documentation': 1.1,
    'tutorial': 1.3,
    'news': 0.8,
    'entertainment': 0.7,
    'other': 0.9
  };

  /**
   * Generate intelligent tags for a bookmark
   */
  async generateTags(
    title: string,
    url: string,
    content?: string,
    description?: string,
    options: TaggingOptions = {}
  ): Promise<TagSuggestion[]> {
    const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
//     return await performanceUtils.trackFunction('intelligent_tagging', async () => {
      try {
        const suggestions: TagSuggestion[] = [];
        
        // Get AI analysis if content is available
        let analysis: ContentAnalysisResult | null = null;
        if (content || url) {
          try {
            analysis = await contentAnalysisService.analyzeContent({
              title,
              url,
              content: content || description || title,
              userId: 'system' // System-generated tags don't require a specific user
            });
          } catch (error) {
            logger.warn(`Failed to get AI analysis for tagging for URL: ${url}`);
          }
        }
        
        // Generate AI-based tags
        if (finalOptions.includeAiTags && analysis) {
          const aiTags = this.extractAiTags(analysis, finalOptions);
          suggestions.push(...aiTags);
        }
        
        // Generate content-based tags
        if (finalOptions.includeContentTags) {
          const contentTags = this.extractContentTags(
            title,
            content || description || '',
            finalOptions
          );
          suggestions.push(...contentTags);
        }
        
        // Generate URL-based tags
        if (finalOptions.includeUrlTags) {
          const urlTags = this.extractUrlTags(url, finalOptions);
          suggestions.push(...urlTags);
        }
        
        // Apply category weighting if analysis is available
        if (finalOptions.categoryWeighting && analysis) {
          this.applyCategoryWeighting(suggestions, analysis.aiCategory);
        }
        
        // Deduplicate and rank suggestions
        const rankedTags = this.rankAndDeduplicateTags(suggestions, finalOptions);
        
        logger.info(`Generated ${rankedTags.length} tags for URL: ${url}`);
        
        return rankedTags;
        
      } catch (error) {
        logger.error(`Tag generation failed for URL: ${url}`, error instanceof Error ? error : new Error('Unknown error'));
        
        // Return basic tags as fallback
        return this.generateFallbackTags(title, url, finalOptions);
      }
  }

  /**
   * Generate tags for multiple bookmarks in batch
   */
  async generateTagsBatch(
    bookmarks: Array<{
      id: string;
      title: string;
      url: string;
      content?: string;
      description?: string;
    }>,
    options: TaggingOptions = {}
  ): Promise<Array<{ bookmarkId: string; tags: TagSuggestion[] }>> {
    const results: Array<{ bookmarkId: string; tags: TagSuggestion[] }> = [];
    
    // Process in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < bookmarks.length; i += batchSize) {
      const batch = bookmarks.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (bookmark) => {
        try {
          const tags = await this.generateTags(
            bookmark.title,
            bookmark.url,
            bookmark.content,
            bookmark.description,
            options
          );
          
          return { bookmarkId: bookmark.id, tags };
        } catch (error) {
          logger.error(`Batch tag generation failed for bookmark ${bookmark.id}`, error instanceof Error ? error : new Error('Unknown error'));
          
          return {
            bookmarkId: bookmark.id,
            tags: this.generateFallbackTags(bookmark.title, bookmark.url, options)
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add small delay between batches
      if (i + batchSize < bookmarks.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return results;
  }

  /**
   * Analyze existing tags and suggest improvements
   */
  async analyzeTagUsage(
    bookmarks: Array<{
      id: string;
      tags: string[];
      category?: string;
      qualityScore?: number;
    }>
  ): Promise<TagAnalytics[]> {
    const tagMap = new Map<string, {
      usage: number;
      categories: Set<string>;
      qualityScores: number[];
      bookmarkIds: string[];
      lastUsed: Date;
    }>();
    
    // Collect tag statistics
    bookmarks.forEach(bookmark => {
      bookmark.tags.forEach(tag => {
        const normalizedTag = tag.toLowerCase().trim();
        
        if (!tagMap.has(normalizedTag)) {
          tagMap.set(normalizedTag, {
            usage: 0,
            categories: new Set(),
            qualityScores: [],
            bookmarkIds: [],
            lastUsed: new Date()
          });
        }
        
        const tagData = tagMap.get(normalizedTag)!;
        tagData.usage++;
        tagData.bookmarkIds.push(bookmark.id);
        
        if (bookmark.category) {
          tagData.categories.add(bookmark.category);
        }
        
        if (bookmark.qualityScore) {
          tagData.qualityScores.push(bookmark.qualityScore);
        }
      });
    });
    
    // Calculate analytics
    const analytics: TagAnalytics[] = [];
    const totalBookmarks = bookmarks.length;
    
    tagMap.forEach((data, tag) => {
      const avgQualityScore = data.qualityScores.length > 0
        ? data.qualityScores.reduce((sum, score) => sum + score, 0) / data.qualityScores.length
        : 5;
      
      // Determine if tag is trending (used in more than 10% of bookmarks)
      const trending = data.usage / totalBookmarks > 0.1;
      
      // Find related tags (tags that appear together frequently)
      const relatedTags = this.findRelatedTags(tag, bookmarks);
      
      analytics.push({
        tag,
        usage: data.usage,
        trending,
        relatedTags,
        categories: Array.from(data.categories),
        avgQualityScore,
        bookmarkIds: data.bookmarkIds
      });
    });
    
    // Sort by usage
    analytics.sort((a, b) => b.usage - a.usage);
    
    return analytics;
  }

  /**
   * Create tag clusters based on similarity and usage patterns
   */
  async createTagClusters(tags: TagAnalytics[]): Promise<TagCluster[]> {
    const clusters: TagCluster[] = [];
    const processedTags = new Set<string>();
    
    // Group tags by category first
    const categoryGroups = new Map<string, TagAnalytics[]>();
    tags.forEach(tag => {
      tag.categories.forEach(category => {
        if (!categoryGroups.has(category)) {
          categoryGroups.set(category, []);
        }
        categoryGroups.get(category)!.push(tag);
      });
    });
    
    // Create clusters for each category
    categoryGroups.forEach((categoryTags, category) => {
      if (categoryTags.length >= 3) { // Only create clusters with 3+ tags
        const clusterTags = categoryTags
          .filter(t => !processedTags.has(t.tag))
          .slice(0, 10); // Limit cluster size
        
        if (clusterTags.length >= 3) {
          const cluster: TagCluster = {
            id: `cluster-${category}-${Date.now()}`,
            name: this.generateClusterName(category, clusterTags),
            tags: clusterTags.map(t => t.tag),
            description: `Tags related to ${category}`,
            color: this.generateClusterColor(category),
            bookmarkCount: clusterTags.reduce((sum, t) => sum + t.usage, 0),
            lastUsed: new Date()
          };
          
          clusters.push(cluster);
          clusterTags.forEach(t => processedTags.add(t.tag));
        }
      }
    });
    
    // Create similarity-based clusters for remaining tags
    const remainingTags = tags.filter(t => !processedTags.has(t.tag));
    const similarityClusters = this.createSimilarityClusters(remainingTags);
    clusters.push(...similarityClusters);
    
    return clusters.sort((a, b) => b.bookmarkCount - a.bookmarkCount);
  }

  /**
   * Suggest tag improvements for existing bookmarks
   */
  async suggestTagImprovements(
    bookmark: {
      id: string;
      title: string;
      url: string;
      tags: string[];
      content?: string;
      description?: string;
    },
    options: TaggingOptions = {}
  ): Promise<{
    suggestedTags: TagSuggestion[];
    tagsToRemove: string[];
    tagsToAdd: string[];
    confidence: number;
  }> {
    // Generate new tags for the bookmark
    const newTags = await this.generateTags(
      bookmark.title,
      bookmark.url,
      bookmark.content,
      bookmark.description,
      options
    );
    
    const existingTags = new Set(bookmark.tags.map(t => t.toLowerCase()));
    const newTagNames = new Set(newTags.map(t => t.tag.toLowerCase()));
    
    // Find tags to add (high confidence new tags not in existing)
    const tagsToAdd = newTags
      .filter(t => !existingTags.has(t.tag.toLowerCase()) && t.confidence > 0.7)
      .map(t => t.tag);
    
    // Find tags to remove (existing tags with low relevance)
    const tagsToRemove = bookmark.tags.filter(existingTag => {
      const relevanceScore = this.calculateTagRelevance(
        existingTag,
        bookmark.title,
        bookmark.content || bookmark.description || ''
      );
      return relevanceScore < 0.3;
    });
    
    // Calculate overall confidence
    const avgConfidence = newTags.length > 0
      ? newTags.reduce((sum, t) => sum + t.confidence, 0) / newTags.length
      : 0;
    
    return {
      suggestedTags: newTags,
      tagsToRemove,
      tagsToAdd,
      confidence: avgConfidence
    };
  }

  /**
   * Extract AI-based tags from content analysis
   */
  private extractAiTags(analysis: ContentAnalysisResult, options: TaggingOptions): TagSuggestion[] {
    const suggestions: TagSuggestion[] = [];
    
    // Add AI-generated tags
    analysis.aiTags.forEach(tag => {
      if (this.isValidTag(tag, options)) {
        suggestions.push({
          tag: tag.toLowerCase(),
          confidence: 0.9,
          source: 'ai',
          category: analysis.aiCategory,
          relatedTags: analysis.keywords.slice(0, 3)
        });
      }
    });
    
    // Add topic-based tags
    analysis.topics.forEach(topic => {
      if (this.isValidTag(topic, options)) {
        suggestions.push({
          tag: topic.toLowerCase(),
          confidence: 0.8,
          source: 'ai',
          category: analysis.aiCategory
        });
      }
    });
    
    // Add category as a tag
    if (analysis.aiCategory && analysis.aiCategory !== 'other') {
      suggestions.push({
        tag: analysis.aiCategory.toLowerCase(),
        confidence: 0.95,
        source: 'ai',
        category: analysis.aiCategory
      });
    }
    
    // Add complexity level as tag
    if (analysis.complexity) {
      suggestions.push({
        tag: analysis.complexity,
        confidence: 0.7,
        source: 'ai',
        category: 'difficulty'
      });
    }
    
    return suggestions;
  }

  /**
   * Extract content-based tags using keyword analysis
   */
  private extractContentTags(title: string, content: string, options: TaggingOptions): TagSuggestion[] {
    const suggestions: TagSuggestion[] = [];
    const text = `${title} ${content}`.toLowerCase();
    
    // Extract keywords from title and content
    const words = text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    // Count word frequency
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      if (this.isValidTag(word, options)) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    });
    
    // Convert to suggestions with confidence based on frequency
    const totalWords = words.length;
    wordCount.forEach((count, word) => {
      const frequency = count / totalWords;
      const confidence = Math.min(0.9, frequency * 10); // Scale frequency to confidence
      
      if (confidence > (options.minConfidence || 0.6)) {
        suggestions.push({
          tag: word,
          confidence,
          source: 'content'
        });
      }
    });
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Extract URL-based tags from domain and path
   */
  private extractUrlTags(url: string, options: TaggingOptions): TagSuggestion[] {
    const suggestions: TagSuggestion[] = [];
    
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      const pathSegments = urlObj.pathname.split('/').filter(s => s.length > 0);
      
      // Add domain as tag
      const domainParts = domain.split('.');
      if (domainParts.length > 1) {
        const mainDomain = domainParts[domainParts.length - 2];
        if (this.isValidTag(mainDomain, options)) {
          suggestions.push({
            tag: mainDomain,
            confidence: 0.8,
            source: 'url',
            category: 'source'
          });
        }
      }
      
      // Add path segments as tags
      pathSegments.forEach(segment => {
        const cleanSegment = segment.replace(/[-_]/g, ' ').toLowerCase();
        if (this.isValidTag(cleanSegment, options)) {
          suggestions.push({
            tag: cleanSegment,
            confidence: 0.6,
            source: 'url'
          });
        }
      });
      
    } catch (error) {
      // Invalid URL, skip URL-based tags
    }
    
    return suggestions;
  }

  /**
   * Apply category weighting to boost relevant tags
   */
  private applyCategoryWeighting(suggestions: TagSuggestion[], category: string): void {
    const weight = this.CATEGORY_WEIGHTS[category] || 1.0;
    
    suggestions.forEach(suggestion => {
      if (suggestion.category === category || suggestion.source === 'ai') {
        suggestion.confidence = Math.min(1.0, suggestion.confidence * weight);
      }
    });
  }

  /**
   * Rank and deduplicate tag suggestions
   */
  private rankAndDeduplicateTags(
    suggestions: TagSuggestion[],
    options: TaggingOptions
  ): TagSuggestion[] {
    const tagMap = new Map<string, TagSuggestion>();
    
    // Deduplicate by keeping highest confidence for each tag
    suggestions.forEach(suggestion => {
      const normalizedTag = suggestion.tag.toLowerCase().trim();
      
      if (!tagMap.has(normalizedTag) || 
          tagMap.get(normalizedTag)!.confidence < suggestion.confidence) {
        tagMap.set(normalizedTag, {
          ...suggestion,
          tag: normalizedTag
        });
      }
    });
    
    // Convert back to array and sort by confidence
    const deduplicatedTags = Array.from(tagMap.values())
      .filter(tag => tag.confidence >= (options.minConfidence || 0.6))
      .sort((a, b) => b.confidence - a.confidence);
    
    // Limit to max tags
    return deduplicatedTags.slice(0, options.maxTags || 10);
  }

  /**
   * Check if a tag is valid based on options
   */
  private isValidTag(tag: string, options: TaggingOptions): boolean {
    const normalizedTag = tag.toLowerCase().trim();
    
    // Check length
    if (normalizedTag.length < 2 || normalizedTag.length > 30) {
      return false;
    }
    
    // Check against stop words
    if (options.excludeCommonWords && this.COMMON_STOP_WORDS.includes(normalizedTag)) {
      return false;
    }
    
    // Check against custom stop words
    if (options.customStopWords && options.customStopWords.includes(normalizedTag)) {
      return false;
    }
    
    // Check if it's a valid word (contains at least one letter)
    if (!/[a-zA-Z]/.test(normalizedTag)) {
      return false;
    }
    
    return true;
  }

  /**
   * Generate fallback tags when AI analysis fails
   */
  private generateFallbackTags(title: string, url: string, options: TaggingOptions): TagSuggestion[] {
    const suggestions: TagSuggestion[] = [];
    
    // Extract basic tags from title
    const titleWords = title.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => this.isValidTag(word, options));
    
    titleWords.slice(0, 5).forEach(word => {
      suggestions.push({
        tag: word,
        confidence: 0.5,
        source: 'content'
      });
    });
    
    // Add URL-based tags
    const urlTags = this.extractUrlTags(url, options);
    suggestions.push(...urlTags);
    
    return this.rankAndDeduplicateTags(suggestions, options);
  }

  /**
   * Calculate tag relevance to content
   */
  private calculateTagRelevance(tag: string, title: string, content: string): number {
    const text = `${title} ${content}`.toLowerCase();
    const tagLower = tag.toLowerCase();
    
    // Count occurrences
    const occurrences = (text.match(new RegExp(tagLower, 'g')) || []).length;
    const totalWords = text.split(/\s+/).length;
    
    return Math.min(1.0, occurrences / totalWords * 100);
  }

  /**
   * Find tags that frequently appear together
   */
  private findRelatedTags(targetTag: string, bookmarks: Array<{ tags: string[] }>): string[] {
    const coOccurrence = new Map<string, number>();
    
    bookmarks.forEach(bookmark => {
      if (bookmark.tags.some(tag => tag.toLowerCase() === targetTag.toLowerCase())) {
        bookmark.tags.forEach(tag => {
          const normalizedTag = tag.toLowerCase();
          if (normalizedTag !== targetTag.toLowerCase()) {
            coOccurrence.set(normalizedTag, (coOccurrence.get(normalizedTag) || 0) + 1);
          }
        });
      }
    });
    
    return Array.from(coOccurrence.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
  }

  /**
   * Generate cluster name based on category and tags
   */
  private generateClusterName(category: string, tags: TagAnalytics[]): string {
    const topTags = tags.slice(0, 3).map(t => t.tag);
    return `${category.charAt(0).toUpperCase() + category.slice(1)} (${topTags.join(', ')})`;
  }

  /**
   * Generate cluster color based on category
   */
  private generateClusterColor(category: string): string {
    const colors: Record<string, string> = {
      'technology': '#3B82F6',
      'programming': '#8B5CF6',
      'science': '#10B981',
      'business': '#F59E0B',
      'education': '#EF4444',
      'research': '#6366F1',
      'documentation': '#84CC16',
      'tutorial': '#F97316',
      'news': '#06B6D4',
      'entertainment': '#EC4899'
    };
    
    return colors[category] || '#6B7280';
  }

  /**
   * Create similarity-based clusters for remaining tags
   */
  private createSimilarityClusters(tags: TagAnalytics[]): TagCluster[] {
    const clusters: TagCluster[] = [];
    const processed = new Set<string>();
    
    // Simple similarity clustering based on string similarity
    tags.forEach(tag => {
      if (processed.has(tag.tag)) return;
      
      const similarTags = tags.filter(otherTag => 
        !processed.has(otherTag.tag) && 
        this.calculateStringSimilarity(tag.tag, otherTag.tag) > 0.6
      );
      
      if (similarTags.length >= 3) {
        const cluster: TagCluster = {
          id: `similarity-cluster-${Date.now()}-${Math.random()}`,
          name: `Similar to "${tag.tag}"`,
          tags: similarTags.map(t => t.tag),
          description: 'Tags with similar characteristics',
          color: '#6B7280',
          bookmarkCount: similarTags.reduce((sum, t) => sum + t.usage, 0),
          lastUsed: new Date()
        };
        
        clusters.push(cluster);
        similarTags.forEach(t => processed.add(t.tag));
      }
    });
    
    return clusters;
  }

  /**
   * Calculate string similarity between two tags
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.calculateEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate edit distance between two strings
   */
  private calculateEditDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

// Export singleton instance
export const intelligentTaggingService = new IntelligentTaggingService();

// Export utility functions
export const taggingUtils = {
  /**
   * Quick tag generation for a single bookmark
   */
  generateQuickTags: async (
    title: string,
    url: string,
    description?: string
  ): Promise<string[]> => {
    const suggestions = await intelligentTaggingService.generateTags(
      title,
      url,
      undefined,
      description,
      { maxTags: 5, minConfidence: 0.7 }
    );
    
    return suggestions.map(s => s.tag);
  },

  /**
   * Validate and clean tag input
   */
  validateTag: (tag: string): { valid: boolean; cleaned?: string; reason?: string } => {
    const cleaned = tag.trim().toLowerCase();
    
    if (cleaned.length < 2) {
      return { valid: false, reason: 'Tag too short' };
    }
    
    if (cleaned.length > 30) {
      return { valid: false, reason: 'Tag too long' };
    }
    
    if (!/[a-zA-Z]/.test(cleaned)) {
      return { valid: false, reason: 'Tag must contain letters' };
    }
    
    return { valid: true, cleaned };
  },

  /**
   * Merge similar tags
   */
  mergeSimilarTags: (tags: string[]): string[] => {
    const merged = new Map<string, string>();
    const processed = new Set<string>();
    
    tags.forEach(tag => {
      if (processed.has(tag)) return;
      
      const similar = tags.filter(otherTag => {
        if (processed.has(otherTag) || tag === otherTag) return false;
        return tag.includes(otherTag) || otherTag.includes(tag);
      });
      
      if (similar.length > 0) {
        // Use the longest tag as the canonical form
        const canonical = [tag, ...similar].sort((a, b) => b.length - a.length)[0];
        merged.set(canonical, canonical);
        [tag, ...similar].forEach(t => processed.add(t));
      } else {
        merged.set(tag, tag);
        processed.add(tag);
      }
    });
    
    return Array.from(merged.values());
  }
};            