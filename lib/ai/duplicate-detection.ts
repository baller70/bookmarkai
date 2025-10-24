import { openai } from './openai-client';

// Types for duplicate detection
export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  content?: string;
  tags?: string[];
  category?: string;
  createdAt: string;
  ai_summary?: string;
}

export interface DuplicateMatch {
  id: string;
  targetBookmark: Bookmark;
  duplicateBookmark: Bookmark;
  similarityScore: number;
  matchType: 'exact' | 'fuzzy_url' | 'content_similar' | 'title_similar' | 'near_duplicate';
  confidence: number;
  reasons: string[];
  differences: string[];
  recommendedAction: 'merge' | 'keep_both' | 'review_manual';
}

export interface DuplicateAnalysis {
  totalBookmarks: number;
  duplicatesFound: number;
  nearDuplicatesFound: number;
  exactMatches: DuplicateMatch[];
  fuzzyMatches: DuplicateMatch[];
  contentMatches: DuplicateMatch[];
  titleMatches: DuplicateMatch[];
  processingTime: number;
  recommendations: {
    autoMergeCount: number;
    manualReviewCount: number;
    keepBothCount: number;
  };
}

export interface MergeOptions {
  keepTitle: 'first' | 'second' | 'longest' | 'custom';
  keepDescription: 'first' | 'second' | 'longest' | 'merge' | 'custom';
  keepTags: 'first' | 'second' | 'merge' | 'custom';
  keepCategory: 'first' | 'second' | 'custom';
  keepUrl: 'first' | 'second' | 'custom';
  customTitle?: string;
  customDescription?: string;
  customTags?: string[];
  customCategory?: string;
  customUrl?: string;
}

export interface MergeResult {
  success: boolean;
  mergedBookmark: Bookmark;
  removedBookmark: Bookmark;
  mergeDetails: {
    fieldsChanged: string[];
    conflictsResolved: string[];
    dataPreserved: string[];
  };
}

class DuplicateDetectionEngine {
  private similarityThreshold = 0.85; // Threshold for content similarity
  private fuzzyUrlThreshold = 0.9; // Threshold for URL similarity
  private titleSimilarityThreshold = 0.8; // Threshold for title similarity
  
  // Main duplicate detection method
  async detectDuplicates(bookmarks: Bookmark[]): Promise<DuplicateAnalysis> {
    const startTime = Date.now();
    console.log('Starting duplicate detection', { bookmarkCount: bookmarks.length });
    
    const exactMatches: DuplicateMatch[] = [];
    const fuzzyMatches: DuplicateMatch[] = [];
    const contentMatches: DuplicateMatch[] = [];
    const titleMatches: DuplicateMatch[] = [];
    
    // Compare each bookmark with every other bookmark
    for (let i = 0; i < bookmarks.length; i++) {
      for (let j = i + 1; j < bookmarks.length; j++) {
        const bookmark1 = bookmarks[i];
        const bookmark2 = bookmarks[j];
        
        // Check for exact URL matches
        const exactMatch = this.checkExactMatch(bookmark1, bookmark2);
        if (exactMatch) {
          exactMatches.push(exactMatch);
          continue;
        }
        
        // Check for fuzzy URL matches
        const fuzzyMatch = this.checkFuzzyUrlMatch(bookmark1, bookmark2);
        if (fuzzyMatch) {
          fuzzyMatches.push(fuzzyMatch);
          continue;
        }
        
        // Check for content similarity
        const contentMatch = await this.checkContentSimilarity(bookmark1, bookmark2);
        if (contentMatch) {
          contentMatches.push(contentMatch);
          continue;
        }
        
        // Check for title similarity
        const titleMatch = this.checkTitleSimilarity(bookmark1, bookmark2);
        if (titleMatch) {
          titleMatches.push(titleMatch);
        }
      }
    }
    
    const processingTime = Date.now() - startTime;
    const duplicatesFound = exactMatches.length + fuzzyMatches.length;
    const nearDuplicatesFound = contentMatches.length + titleMatches.length;
    
    // Calculate recommendations
    const autoMergeCount = exactMatches.filter(m => m.recommendedAction === 'merge').length;
    const manualReviewCount = [...fuzzyMatches, ...contentMatches, ...titleMatches]
      .filter(m => m.recommendedAction === 'review_manual').length;
    const keepBothCount = [...exactMatches, ...fuzzyMatches, ...contentMatches, ...titleMatches]
      .filter(m => m.recommendedAction === 'keep_both').length;
    
    console.log('Duplicate detection completed', {
      duplicatesFound,
      nearDuplicatesFound,
      processingTime
    });
    
    return {
      totalBookmarks: bookmarks.length,
      duplicatesFound,
      nearDuplicatesFound,
      exactMatches,
      fuzzyMatches,
      contentMatches,
      titleMatches,
      processingTime,
      recommendations: {
        autoMergeCount,
        manualReviewCount,
        keepBothCount
      }
    };
  }
  
  // Check for exact URL matches
  private checkExactMatch(bookmark1: Bookmark, bookmark2: Bookmark): DuplicateMatch | null {
    const url1 = this.normalizeUrl(bookmark1.url);
    const url2 = this.normalizeUrl(bookmark2.url);
    
    if (url1 === url2) {
      const reasons = ['Identical URLs'];
      const differences = [];
      
      // Check for differences in other fields
      if (bookmark1.title !== bookmark2.title) {
        differences.push(`Different titles: "${bookmark1.title}" vs "${bookmark2.title}"`);
      }
      if (bookmark1.description !== bookmark2.description) {
        differences.push('Different descriptions');
      }
      if (JSON.stringify(bookmark1.tags) !== JSON.stringify(bookmark2.tags)) {
        differences.push('Different tags');
      }
      
      return {
        id: `exact_${bookmark1.id}_${bookmark2.id}`,
        targetBookmark: bookmark1,
        duplicateBookmark: bookmark2,
        similarityScore: 1.0,
        matchType: 'exact',
        confidence: 1.0,
        reasons,
        differences,
        recommendedAction: differences.length === 0 ? 'merge' : 'review_manual'
      };
    }
    
    return null;
  }
  
  // Check for fuzzy URL matches (similar URLs with different parameters)
  private checkFuzzyUrlMatch(bookmark1: Bookmark, bookmark2: Bookmark): DuplicateMatch | null {
    const similarity = this.calculateUrlSimilarity(bookmark1.url, bookmark2.url);
    
    if (similarity >= this.fuzzyUrlThreshold) {
      const reasons = [
        `Similar URLs (${Math.round(similarity * 100)}% match)`,
        'Likely same content with different parameters'
      ];
      
      const differences = this.identifyUrlDifferences(bookmark1.url, bookmark2.url);
      
      return {
        id: `fuzzy_${bookmark1.id}_${bookmark2.id}`,
        targetBookmark: bookmark1,
        duplicateBookmark: bookmark2,
        similarityScore: similarity,
        matchType: 'fuzzy_url',
        confidence: similarity,
        reasons,
        differences,
        recommendedAction: similarity > 0.95 ? 'merge' : 'review_manual'
      };
    }
    
    return null;
  }
  
  // Check for content similarity using AI
  private async checkContentSimilarity(bookmark1: Bookmark, bookmark2: Bookmark): Promise<DuplicateMatch | null> {
    const content1 = this.getCombinedContent(bookmark1);
    const content2 = this.getCombinedContent(bookmark2);
    
    if (!content1 || !content2 || content1.length < 50 || content2.length < 50) {
      return null; // Skip if content is too short
    }
    
    try {
      // Use AI to compare content similarity
      const similarity = await this.calculateContentSimilarityAI(content1, content2);
      
      if (similarity >= this.similarityThreshold) {
        const reasons = [
          `High content similarity (${Math.round(similarity * 100)}%)`,
          'Similar topics and themes detected'
        ];
        
        const differences = [
          `Different URLs: ${bookmark1.url} vs ${bookmark2.url}`
        ];
        
        if (bookmark1.title !== bookmark2.title) {
          differences.push(`Different titles: "${bookmark1.title}" vs "${bookmark2.title}"`);
        }
        
        return {
          id: `content_${bookmark1.id}_${bookmark2.id}`,
          targetBookmark: bookmark1,
          duplicateBookmark: bookmark2,
          similarityScore: similarity,
          matchType: 'content_similar',
          confidence: similarity,
          reasons,
          differences,
          recommendedAction: similarity > 0.9 ? 'review_manual' : 'keep_both'
        };
      }
    } catch (error) {
      console.error('Error calculating content similarity:', error);
    }
    
    return null;
  }
  
  // Check for title similarity
  private checkTitleSimilarity(bookmark1: Bookmark, bookmark2: Bookmark): DuplicateMatch | null {
    const similarity = this.calculateStringSimilarity(bookmark1.title, bookmark2.title);
    
    if (similarity >= this.titleSimilarityThreshold) {
      const reasons = [
        `Similar titles (${Math.round(similarity * 100)}% match)`,
        'Potentially same content with different sources'
      ];
      
      const differences = [
        `Different URLs: ${bookmark1.url} vs ${bookmark2.url}`
      ];
      
      return {
        id: `title_${bookmark1.id}_${bookmark2.id}`,
        targetBookmark: bookmark1,
        duplicateBookmark: bookmark2,
        similarityScore: similarity,
        matchType: 'title_similar',
        confidence: similarity * 0.8, // Lower confidence for title-only matches
        reasons,
        differences,
        recommendedAction: 'review_manual'
      };
    }
    
    return null;
  }
  
  // Merge two bookmarks based on user preferences
  async mergeBookmarks(
    targetBookmark: Bookmark,
    duplicateBookmark: Bookmark,
    options: MergeOptions
  ): Promise<MergeResult> {
    console.log('Merging bookmarks', { 
      target: targetBookmark.id, 
      duplicate: duplicateBookmark.id 
    });
    
    const mergedBookmark: Bookmark = { ...targetBookmark };
    const fieldsChanged: string[] = [];
    const conflictsResolved: string[] = [];
    const dataPreserved: string[] = [];
    
    // Merge title
    const originalTitle = mergedBookmark.title;
    switch (options.keepTitle) {
      case 'second':
        mergedBookmark.title = duplicateBookmark.title;
        break;
      case 'longest':
        mergedBookmark.title = targetBookmark.title.length >= duplicateBookmark.title.length
          ? targetBookmark.title : duplicateBookmark.title;
        break;
      case 'custom':
        if (options.customTitle) {
          mergedBookmark.title = options.customTitle;
        }
        break;
      // 'first' is default (no change needed)
    }
    if (mergedBookmark.title !== originalTitle) {
      fieldsChanged.push('title');
    }
    
    // Merge description
    const originalDescription = mergedBookmark.description;
    switch (options.keepDescription) {
      case 'second':
        mergedBookmark.description = duplicateBookmark.description;
        break;
      case 'longest':
        const desc1 = targetBookmark.description || '';
        const desc2 = duplicateBookmark.description || '';
        mergedBookmark.description = desc1.length >= desc2.length ? desc1 : desc2;
        break;
      case 'merge':
        const descriptions = [targetBookmark.description, duplicateBookmark.description]
          .filter(Boolean);
        mergedBookmark.description = descriptions.join(' | ');
        break;
      case 'custom':
        if (options.customDescription) {
          mergedBookmark.description = options.customDescription;
        }
        break;
    }
    if (mergedBookmark.description !== originalDescription) {
      fieldsChanged.push('description');
    }
    
    // Merge tags
    const originalTags = mergedBookmark.tags;
    switch (options.keepTags) {
      case 'second':
        mergedBookmark.tags = duplicateBookmark.tags;
        break;
      case 'merge':
        const allTags = [
          ...(targetBookmark.tags || []),
          ...(duplicateBookmark.tags || [])
        ];
        mergedBookmark.tags = [...new Set(allTags)]; // Remove duplicates
        break;
      case 'custom':
        if (options.customTags) {
          mergedBookmark.tags = options.customTags;
        }
        break;
    }
    if (JSON.stringify(mergedBookmark.tags) !== JSON.stringify(originalTags)) {
      fieldsChanged.push('tags');
    }
    
    // Merge category
    const originalCategory = mergedBookmark.category;
    switch (options.keepCategory) {
      case 'second':
        mergedBookmark.category = duplicateBookmark.category;
        break;
      case 'custom':
        if (options.customCategory) {
          mergedBookmark.category = options.customCategory;
        }
        break;
    }
    if (mergedBookmark.category !== originalCategory) {
      fieldsChanged.push('category');
    }
    
    // Merge URL
    const originalUrl = mergedBookmark.url;
    switch (options.keepUrl) {
      case 'second':
        mergedBookmark.url = duplicateBookmark.url;
        break;
      case 'custom':
        if (options.customUrl) {
          mergedBookmark.url = options.customUrl;
        }
        break;
    }
    if (mergedBookmark.url !== originalUrl) {
      fieldsChanged.push('url');
    }
    
    // Track preserved data
    if (targetBookmark.ai_summary && duplicateBookmark.ai_summary) {
      dataPreserved.push('AI summaries from both bookmarks');
    }
    if (targetBookmark.content && duplicateBookmark.content) {
      dataPreserved.push('Content from both bookmarks');
    }
    
    return {
      success: true,
      mergedBookmark,
      removedBookmark: duplicateBookmark,
      mergeDetails: {
        fieldsChanged,
        conflictsResolved,
        dataPreserved
      }
    };
  }
  
  // Helper method to normalize URLs for comparison
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove common tracking parameters
      const trackingParams = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'fbclid', 'gclid', 'ref', 'source', 'campaign'
      ];
      
      trackingParams.forEach(param => {
        urlObj.searchParams.delete(param);
      });
      
      // Remove trailing slash and fragment
      let normalized = urlObj.toString();
      if (normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
      }
      if (normalized.includes('#')) {
        normalized = normalized.split('#')[0];
      }
      
      return normalized.toLowerCase();
    } catch (error) {
      return url.toLowerCase();
    }
  }
  
  // Calculate URL similarity using string similarity
  private calculateUrlSimilarity(url1: string, url2: string): number {
    const normalized1 = this.normalizeUrl(url1);
    const normalized2 = this.normalizeUrl(url2);
    
    // Extract domain and path components
    try {
      const urlObj1 = new URL(normalized1);
      const urlObj2 = new URL(normalized2);
      
      // If domains are different, similarity is low
      if (urlObj1.hostname !== urlObj2.hostname) {
        return this.calculateStringSimilarity(normalized1, normalized2) * 0.3;
      }
      
      // If domains are same, compare paths
      const pathSimilarity = this.calculateStringSimilarity(urlObj1.pathname, urlObj2.pathname);
      const paramSimilarity = this.calculateStringSimilarity(
        urlObj1.searchParams.toString(),
        urlObj2.searchParams.toString()
      );
      
      return (pathSimilarity * 0.7) + (paramSimilarity * 0.3);
    } catch (error) {
      return this.calculateStringSimilarity(normalized1, normalized2);
    }
  }
  
  // Identify specific differences between URLs
  private identifyUrlDifferences(url1: string, url2: string): string[] {
    const differences: string[] = [];
    
    try {
      const urlObj1 = new URL(url1);
      const urlObj2 = new URL(url2);
      
      if (urlObj1.hostname !== urlObj2.hostname) {
        differences.push(`Different domains: ${urlObj1.hostname} vs ${urlObj2.hostname}`);
      }
      
      if (urlObj1.pathname !== urlObj2.pathname) {
        differences.push(`Different paths: ${urlObj1.pathname} vs ${urlObj2.pathname}`);
      }
      
      const params1 = new Set(urlObj1.searchParams.keys());
      const params2 = new Set(urlObj2.searchParams.keys());
      
      const uniqueParams1 = [...params1].filter(p => !params2.has(p));
      const uniqueParams2 = [...params2].filter(p => !params1.has(p));
      
      if (uniqueParams1.length > 0) {
        differences.push(`Additional parameters in first URL: ${uniqueParams1.join(', ')}`);
      }
      if (uniqueParams2.length > 0) {
        differences.push(`Additional parameters in second URL: ${uniqueParams2.join(', ')}`);
      }
      
    } catch (error) {
      differences.push('URLs have different formats');
    }
    
    return differences;
  }
  
  // Get combined content for similarity analysis
  private getCombinedContent(bookmark: Bookmark): string {
    return [
      bookmark.title,
      bookmark.description,
      bookmark.ai_summary,
      bookmark.content,
      bookmark.tags?.join(' ')
    ].filter(Boolean).join(' ');
  }
  
  // Calculate content similarity using AI
  private async calculateContentSimilarityAI(content1: string, content2: string): Promise<number> {
    try {
      const prompt = `Compare the similarity of these two pieces of content and return a similarity score between 0 and 1, where 1 means identical content and 0 means completely different content. Only return the numeric score.

Content 1: "${content1.substring(0, 1000)}"

Content 2: "${content2.substring(0, 1000)}"

Similarity score:`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 10,
        temperature: 0
      });

      const scoreText = response.choices[0]?.message?.content?.trim();
      const score = parseFloat(scoreText || '0');
      
      return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1);
    } catch (error) {
      console.error('Error calculating AI content similarity:', error);
      // Fallback to string similarity
      return this.calculateStringSimilarity(content1, content2);
    }
  }
  
  // Calculate string similarity using Levenshtein distance
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }
  
  // Calculate Levenshtein distance
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  // Get duplicate detection statistics
  getDetectionStats(): any {
    return {
      similarityThreshold: this.similarityThreshold,
      fuzzyUrlThreshold: this.fuzzyUrlThreshold,
      titleSimilarityThreshold: this.titleSimilarityThreshold,
      supportedMatchTypes: ['exact', 'fuzzy_url', 'content_similar', 'title_similar'],
      mergeOptions: {
        titleOptions: ['first', 'second', 'longest', 'custom'],
        descriptionOptions: ['first', 'second', 'longest', 'merge', 'custom'],
        tagOptions: ['first', 'second', 'merge', 'custom'],
        categoryOptions: ['first', 'second', 'custom'],
        urlOptions: ['first', 'second', 'custom']
      }
    };
  }
  
  // Update detection thresholds
  updateThresholds(options: {
    similarityThreshold?: number;
    fuzzyUrlThreshold?: number;
    titleSimilarityThreshold?: number;
  }): void {
    if (options.similarityThreshold !== undefined) {
      this.similarityThreshold = Math.max(0, Math.min(1, options.similarityThreshold));
    }
    if (options.fuzzyUrlThreshold !== undefined) {
      this.fuzzyUrlThreshold = Math.max(0, Math.min(1, options.fuzzyUrlThreshold));
    }
    if (options.titleSimilarityThreshold !== undefined) {
      this.titleSimilarityThreshold = Math.max(0, Math.min(1, options.titleSimilarityThreshold));
    }
  }
}

// Export singleton instance
export const duplicateDetection = new DuplicateDetectionEngine(); 