import { appLogger } from '../../lib/logger';
import { ExtractedContent } from '../content-processing/content-extractor';
import { EnrichedContent } from '../content-processing/enrichment-processor';
import { performance } from 'perf_hooks';

const logger = appLogger;

export interface UserProfile {
  userId: string;
  preferences: UserPreferences;
  behavior: UserBehavior;
  demographics: UserDemographics;
  interests: UserInterest[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  categories: Array<{
    category: string;
    weight: number; // 0-1
    lastUpdated: Date;
  }>;
  tags: Array<{
    tag: string;
    weight: number;
    frequency: number;
    lastUsed: Date;
  }>;
  contentTypes: Array<{
    type: 'article' | 'video' | 'documentation' | 'tutorial' | 'news' | 'research';
    preference: number; // 0-1
  }>;
  languages: Array<{
    language: string;
    preference: number;
  }>;
  readingLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  contentLength: 'short' | 'medium' | 'long' | 'any';
  freshness: 'latest' | 'recent' | 'any';
}

export interface UserBehavior {
  bookmarkingPatterns: {
    averageBookmarksPerDay: number;
    peakHours: number[];
    commonDomains: string[];
    averageReadingTime: number;
  };
  interactionHistory: Array<{
    bookmarkId: string;
    action: 'view' | 'share' | 'edit' | 'delete' | 'favorite';
    timestamp: Date;
    duration?: number;
  }>;
  searchPatterns: Array<{
    query: string;
    timestamp: Date;
    resultsClicked: number;
  }>;
  categoryUsage: Record<string, {
    count: number;
    lastUsed: Date;
    averageRating: number;
  }>;
}

export interface UserDemographics {
  location?: string;
  timezone: string;
  deviceTypes: Array<'desktop' | 'mobile' | 'tablet'>;
  browserPreferences: string[];
  professionalField?: string;
  experienceLevel?: string;
}

export interface UserInterest {
  topic: string;
  score: number; // 0-1
  confidence: number; // 0-1
  sources: Array<'explicit' | 'implicit' | 'inferred'>;
  keywords: string[];
  relatedTopics: string[];
  lastUpdated: Date;
}

export interface Recommendation {
  id: string;
  userId: string;
  type: 'content-based' | 'collaborative' | 'trending' | 'hybrid';
  bookmarkId?: string;
  url?: string;
  title: string;
  description: string;
  score: number; // 0-1
  confidence: number; // 0-1
  reasoning: string[];
  metadata: RecommendationMetadata;
  createdAt: Date;
  expiresAt: Date;
}

export interface RecommendationMetadata {
  category: string;
  tags: string[];
  estimatedReadingTime: number;
  contentQuality: number;
  freshness: number;
  similarity: number;
  popularity: number;
  personalRelevance: number;
  source: string;
  relatedBookmarks: string[];
}

export interface RecommendationRequest {
  userId: string;
  count: number;
  types: Array<'content-based' | 'collaborative' | 'trending' | 'hybrid'>;
  filters: RecommendationFilters;
  context: RecommendationContext;
}

export interface RecommendationFilters {
  categories?: string[];
  tags?: string[];
  domains?: string[];
  languages?: string[];
  contentTypes?: string[];
  minQuality?: number;
  maxAge?: number; // days
  excludeBookmarks?: string[];
}

export interface RecommendationContext {
  currentPage?: string;
  currentBookmark?: string;
  sessionDuration?: number;
  recentActions?: string[];
  timeOfDay?: number;
  dayOfWeek?: number;
}

export interface ContentSimilarity {
  bookmarkId1: string;
  bookmarkId2: string;
  similarity: number;
  factors: {
    contentSimilarity: number;
    tagSimilarity: number;
    categorySimilarity: number;
    topicSimilarity: number;
    semanticSimilarity: number;
  };
  computedAt: Date;
}

export interface RecommendationMetrics {
  totalRecommendations: number;
  clickThroughRate: number;
  conversionRate: number;
  averageScore: number;
  typeDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  userSatisfaction: number;
  performanceMetrics: {
    averageGenerationTime: number;
    cacheHitRate: number;
    errorRate: number;
  };
}

export class RecommendationEngine {
  private userProfiles: Map<string, UserProfile> = new Map();
  private recommendations: Map<string, Recommendation[]> = new Map();
  private contentSimilarities: Map<string, ContentSimilarity[]> = new Map();
  private metrics: RecommendationMetrics;
  private cache: Map<string, any> = new Map();

  constructor() {
    this.metrics = this.initializeMetrics();
    this.startMetricsCollection();
  }

  async generateRecommendations(request: RecommendationRequest): Promise<Recommendation[]> {
    const startTime = performance.now();

    try {
      logger.info('Generating recommendations', {
        userId: request.userId,
        count: request.count,
        types: request.types
      });

      // Get or create user profile
      const userProfile = await this.getUserProfile(request.userId);
      
      // Generate recommendations by type
      const recommendations: Recommendation[] = [];
      
      for (const type of request.types) {
        switch (type) {
          case 'content-based':
            const contentBased = await this.generateContentBasedRecommendations(
              userProfile,
              request
            );
            recommendations.push(...contentBased);
            break;
            
          case 'collaborative':
            const collaborative = await this.generateCollaborativeRecommendations(
              userProfile,
              request
            );
            recommendations.push(...collaborative);
            break;
            
          case 'trending':
            const trending = await this.generateTrendingRecommendations(
              userProfile,
              request
            );
            recommendations.push(...trending);
            break;
            
          case 'hybrid':
            const hybrid = await this.generateHybridRecommendations(
              userProfile,
              request
            );
            recommendations.push(...hybrid);
            break;
        }
      }

      // Sort by score and apply filters
      const filteredRecommendations = this.applyFilters(recommendations, request.filters);
      const sortedRecommendations = this.sortRecommendations(filteredRecommendations, request.context);
      const finalRecommendations = sortedRecommendations.slice(0, request.count);

      // Cache recommendations
      this.cacheRecommendations(request.userId, finalRecommendations);

      // Update metrics
      const duration = performance.now() - startTime;
      this.updateMetrics(finalRecommendations, duration);

      logger.info('Recommendations generated', {
        userId: request.userId,
        count: finalRecommendations.length,
        types: request.types,
        duration: Math.round(duration)
      });

      return finalRecommendations;

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Recommendation generation failed', error as Error, {
        userId: request.userId,
        duration: Math.round(duration)
      });
      
      throw new Error(`Failed to generate recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateContentBasedRecommendations(
    userProfile: UserProfile,
    request: RecommendationRequest
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    
    // Get user's bookmark history for content analysis
    const userBookmarks = await this.getUserBookmarks(userProfile.userId);
    
    // Analyze user preferences from bookmarks
    const preferenceVector = this.buildUserPreferenceVector(userProfile, userBookmarks);
    
    // Find similar content
    const candidateBookmarks = await this.findSimilarContent(userBookmarks, request.filters);
    
    for (const bookmark of candidateBookmarks) {
      const similarity = this.calculateContentSimilarity(preferenceVector, bookmark);
      
      if (similarity > 0.3) { // Threshold for relevance
        const recommendation: Recommendation = {
          id: this.generateRecommendationId(),
          userId: userProfile.userId,
          type: 'content-based',
          bookmarkId: bookmark.id,
          url: bookmark.url,
          title: bookmark.title,
          description: bookmark.description,
          score: similarity,
          confidence: this.calculateConfidence(similarity, userProfile),
          reasoning: this.generateReasoning('content-based', similarity, bookmark, userProfile),
          metadata: this.buildRecommendationMetadata(bookmark, userProfile),
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };
        
        recommendations.push(recommendation);
      }
    }
    
    return recommendations.slice(0, Math.ceil(request.count * 0.4)); // 40% content-based
  }

  private async generateCollaborativeRecommendations(
    userProfile: UserProfile,
    request: RecommendationRequest
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    
    // Find similar users
    const similarUsers = await this.findSimilarUsers(userProfile);
    
    // Get bookmarks from similar users
    const candidateBookmarks = await this.getBookmarksFromSimilarUsers(similarUsers, userProfile.userId);
    
    for (const bookmark of candidateBookmarks) {
      const collaborativeScore = this.calculateCollaborativeScore(bookmark, similarUsers, userProfile);
      
      if (collaborativeScore > 0.2) {
        const recommendation: Recommendation = {
          id: this.generateRecommendationId(),
          userId: userProfile.userId,
          type: 'collaborative',
          bookmarkId: bookmark.id,
          url: bookmark.url,
          title: bookmark.title,
          description: bookmark.description,
          score: collaborativeScore,
          confidence: this.calculateConfidence(collaborativeScore, userProfile),
          reasoning: this.generateReasoning('collaborative', collaborativeScore, bookmark, userProfile),
          metadata: this.buildRecommendationMetadata(bookmark, userProfile),
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours
        };
        
        recommendations.push(recommendation);
      }
    }
    
    return recommendations.slice(0, Math.ceil(request.count * 0.3)); // 30% collaborative
  }

  private async generateTrendingRecommendations(
    userProfile: UserProfile,
    request: RecommendationRequest
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    
    // Get trending content
    const trendingBookmarks = await this.getTrendingContent(request.filters);
    
    for (const bookmark of trendingBookmarks) {
      const personalRelevance = this.calculatePersonalRelevance(bookmark, userProfile);
      const trendingScore = bookmark.trendingScore * personalRelevance;
      
      if (trendingScore > 0.3) {
        const recommendation: Recommendation = {
          id: this.generateRecommendationId(),
          userId: userProfile.userId,
          type: 'trending',
          bookmarkId: bookmark.id,
          url: bookmark.url,
          title: bookmark.title,
          description: bookmark.description,
          score: trendingScore,
          confidence: this.calculateConfidence(trendingScore, userProfile),
          reasoning: this.generateReasoning('trending', trendingScore, bookmark, userProfile),
          metadata: this.buildRecommendationMetadata(bookmark, userProfile),
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 hours
        };
        
        recommendations.push(recommendation);
      }
    }
    
    return recommendations.slice(0, Math.ceil(request.count * 0.2)); // 20% trending
  }

  private async generateHybridRecommendations(
    userProfile: UserProfile,
    request: RecommendationRequest
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    
    // Combine multiple recommendation strategies
    const contentBasedWeight = 0.4;
    const collaborativeWeight = 0.3;
    const trendingWeight = 0.2;
    const diversityWeight = 0.1;
    
    // Get candidates from all methods
    const contentCandidates = await this.generateContentBasedRecommendations(userProfile, request);
    const collaborativeCandidates = await this.generateCollaborativeRecommendations(userProfile, request);
    const trendingCandidates = await this.generateTrendingRecommendations(userProfile, request);
    
    // Create hybrid scores
    const allCandidates = new Map<string, Recommendation>();
    
    // Add content-based candidates
    contentCandidates.forEach(rec => {
      rec.score = rec.score * contentBasedWeight;
      rec.type = 'hybrid';
      allCandidates.set(rec.url || rec.bookmarkId!, rec);
    });
    
    // Merge collaborative candidates
    collaborativeCandidates.forEach(rec => {
      const existing = allCandidates.get(rec.url || rec.bookmarkId!);
      if (existing) {
        existing.score += rec.score * collaborativeWeight;
        existing.reasoning.push(...rec.reasoning);
      } else {
        rec.score = rec.score * collaborativeWeight;
        rec.type = 'hybrid';
        allCandidates.set(rec.url || rec.bookmarkId!, rec);
      }
    });
    
    // Merge trending candidates
    trendingCandidates.forEach(rec => {
      const existing = allCandidates.get(rec.url || rec.bookmarkId!);
      if (existing) {
        existing.score += rec.score * trendingWeight;
        existing.reasoning.push(...rec.reasoning);
      } else {
        rec.score = rec.score * trendingWeight;
        rec.type = 'hybrid';
        allCandidates.set(rec.url || rec.bookmarkId!, rec);
      }
    });
    
    // Apply diversity bonus
    const finalRecommendations = Array.from(allCandidates.values());
    this.applyDiversityBonus(finalRecommendations, diversityWeight);
    
    return finalRecommendations.slice(0, Math.ceil(request.count * 0.1)); // 10% hybrid
  }

  // User profile management
  async getUserProfile(userId: string): Promise<UserProfile> {
    if (this.userProfiles.has(userId)) {
      return this.userProfiles.get(userId)!;
    }
    
    // Create new user profile
    const profile: UserProfile = {
      userId,
      preferences: this.getDefaultPreferences(),
      behavior: this.getDefaultBehavior(),
      demographics: this.getDefaultDemographics(),
      interests: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.userProfiles.set(userId, profile);
    return profile;
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const profile = await this.getUserProfile(userId);
    Object.assign(profile, updates);
    profile.updatedAt = new Date();
    
    this.userProfiles.set(userId, profile);
    
    logger.info('User profile updated', { userId, updates: Object.keys(updates) });
  }

  async trackUserInteraction(userId: string, interaction: {
    bookmarkId: string;
    action: 'view' | 'share' | 'edit' | 'delete' | 'favorite';
    duration?: number;
  }): Promise<void> {
    const profile = await this.getUserProfile(userId);
    
    profile.behavior.interactionHistory.push({
      ...interaction,
      timestamp: new Date()
    });
    
    // Keep only last 1000 interactions
    if (profile.behavior.interactionHistory.length > 1000) {
      profile.behavior.interactionHistory = profile.behavior.interactionHistory.slice(-1000);
    }
    
    // Update preferences based on interaction
    await this.updatePreferencesFromInteraction(profile, interaction);
    
    this.userProfiles.set(userId, profile);
  }

  // Utility methods
  private buildUserPreferenceVector(userProfile: UserProfile, bookmarks: any[]): Record<string, number> {
    const vector: Record<string, number> = {};
    
    // Add category preferences
    userProfile.preferences.categories.forEach(cat => {
      vector[`category:${cat.category}`] = cat.weight;
    });
    
    // Add tag preferences
    userProfile.preferences.tags.forEach(tag => {
      vector[`tag:${tag.tag}`] = tag.weight;
    });
    
    // Add content type preferences
    userProfile.preferences.contentTypes.forEach(type => {
      vector[`type:${type.type}`] = type.preference;
    });
    
    return vector;
  }

  private calculateContentSimilarity(preferenceVector: Record<string, number>, bookmark: any): number {
    let similarity = 0;
    let totalWeight = 0;
    
    // Calculate similarity based on categories
    if (bookmark.category && preferenceVector[`category:${bookmark.category}`]) {
      similarity += preferenceVector[`category:${bookmark.category}`] * 0.4;
      totalWeight += 0.4;
    }
    
    // Calculate similarity based on tags
    if (bookmark.tags) {
      bookmark.tags.forEach((tag: string) => {
        if (preferenceVector[`tag:${tag}`]) {
          similarity += preferenceVector[`tag:${tag}`] * 0.3;
          totalWeight += 0.3;
        }
      });
    }
    
    // Calculate similarity based on content type
    if (bookmark.contentType && preferenceVector[`type:${bookmark.contentType}`]) {
      similarity += preferenceVector[`type:${bookmark.contentType}`] * 0.3;
      totalWeight += 0.3;
    }
    
    return totalWeight > 0 ? similarity / totalWeight : 0;
  }

  private async findSimilarUsers(userProfile: UserProfile): Promise<UserProfile[]> {
    const similarUsers: UserProfile[] = [];
    
    // Simple similarity calculation based on preferences
    for (const [userId, profile] of this.userProfiles) {
      if (userId !== userProfile.userId) {
        const similarity = this.calculateUserSimilarity(userProfile, profile);
        if (similarity > 0.3) {
          similarUsers.push(profile);
        }
      }
    }
    
    return similarUsers.sort((a, b) => 
      this.calculateUserSimilarity(userProfile, b) - 
      this.calculateUserSimilarity(userProfile, a)
    ).slice(0, 10); // Top 10 similar users
  }

  private calculateUserSimilarity(user1: UserProfile, user2: UserProfile): number {
    let similarity = 0;
    let factors = 0;
    
    // Category similarity
    const categorySimilarity = this.calculateCategorySimilarity(
      user1.preferences.categories,
      user2.preferences.categories
    );
    similarity += categorySimilarity * 0.4;
    factors += 0.4;
    
    // Tag similarity
    const tagSimilarity = this.calculateTagSimilarity(
      user1.preferences.tags,
      user2.preferences.tags
    );
    similarity += tagSimilarity * 0.3;
    factors += 0.3;
    
    // Interest similarity
    const interestSimilarity = this.calculateInterestSimilarity(
      user1.interests,
      user2.interests
    );
    similarity += interestSimilarity * 0.3;
    factors += 0.3;
    
    return factors > 0 ? similarity / factors : 0;
  }

  private calculateCategorySimilarity(cats1: any[], cats2: any[]): number {
    const categories1 = new Map(cats1.map(c => [c.category, c.weight]));
    const categories2 = new Map(cats2.map(c => [c.category, c.weight]));
    
    let similarity = 0;
    let totalCategories = new Set([...categories1.keys(), ...categories2.keys()]).size;
    
    for (const category of categories1.keys()) {
      if (categories2.has(category)) {
        const weight1 = categories1.get(category)!;
        const weight2 = categories2.get(category)!;
        similarity += 1 - Math.abs(weight1 - weight2);
      }
    }
    
    return totalCategories > 0 ? similarity / totalCategories : 0;
  }

  private calculateTagSimilarity(tags1: any[], tags2: any[]): number {
    const tagSet1 = new Set(tags1.map(t => t.tag));
    const tagSet2 = new Set(tags2.map(t => t.tag));
    
    const intersection = new Set([...tagSet1].filter(tag => tagSet2.has(tag)));
    const union = new Set([...tagSet1, ...tagSet2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private calculateInterestSimilarity(interests1: UserInterest[], interests2: UserInterest[]): number {
    const interestMap1 = new Map(interests1.map(i => [i.topic, i.score]));
    const interestMap2 = new Map(interests2.map(i => [i.topic, i.score]));
    
    let similarity = 0;
    let totalInterests = new Set([...interestMap1.keys(), ...interestMap2.keys()]).size;
    
    for (const topic of interestMap1.keys()) {
      if (interestMap2.has(topic)) {
        const score1 = interestMap1.get(topic)!;
        const score2 = interestMap2.get(topic)!;
        similarity += 1 - Math.abs(score1 - score2);
      }
    }
    
    return totalInterests > 0 ? similarity / totalInterests : 0;
  }

  private applyFilters(recommendations: Recommendation[], filters: RecommendationFilters): Recommendation[] {
    return recommendations.filter(rec => {
      // Category filter
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(rec.metadata.category)) {
          return false;
        }
      }
      
      // Tag filter
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => 
          rec.metadata.tags.includes(tag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }
      
      // Quality filter
      if (filters.minQuality && rec.metadata.contentQuality < filters.minQuality) {
        return false;
      }
      
      // Age filter
      if (filters.maxAge) {
        const ageInDays = (Date.now() - rec.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (ageInDays > filters.maxAge) {
          return false;
        }
      }
      
      // Exclude bookmarks
      if (filters.excludeBookmarks && rec.bookmarkId) {
        if (filters.excludeBookmarks.includes(rec.bookmarkId)) {
          return false;
        }
      }
      
      return true;
    });
  }

  private sortRecommendations(recommendations: Recommendation[], context: RecommendationContext): Recommendation[] {
    return recommendations.sort((a, b) => {
      // Primary sort by score
      let scoreA = a.score;
      let scoreB = b.score;
      
      // Apply context-based adjustments
      if (context.timeOfDay !== undefined) {
        scoreA *= this.getTimeOfDayMultiplier(a, context.timeOfDay);
        scoreB *= this.getTimeOfDayMultiplier(b, context.timeOfDay);
      }
      
      if (context.currentBookmark) {
        scoreA *= this.getContextualRelevanceMultiplier(a, context.currentBookmark);
        scoreB *= this.getContextualRelevanceMultiplier(b, context.currentBookmark);
      }
      
      // Secondary sort by confidence
      if (Math.abs(scoreB - scoreA) < 0.01) {
        return b.confidence - a.confidence;
      }
      
      return scoreB - scoreA;
    });
  }

  private getTimeOfDayMultiplier(recommendation: Recommendation, timeOfDay: number): number {
    // Adjust recommendations based on time of day
    // Morning (6-12): boost productivity content
    // Afternoon (12-18): boost learning content
    // Evening (18-24): boost entertainment content
    
    if (timeOfDay >= 6 && timeOfDay < 12) {
      if (recommendation.metadata.category === 'productivity') return 1.2;
      if (recommendation.metadata.category === 'news') return 1.1;
    } else if (timeOfDay >= 12 && timeOfDay < 18) {
      if (recommendation.metadata.category === 'education') return 1.2;
      if (recommendation.metadata.category === 'technology') return 1.1;
    } else if (timeOfDay >= 18 && timeOfDay < 24) {
      if (recommendation.metadata.category === 'entertainment') return 1.2;
      if (recommendation.metadata.category === 'lifestyle') return 1.1;
    }
    
    return 1.0;
  }

  private getContextualRelevanceMultiplier(recommendation: Recommendation, currentBookmark: string): number {
    // Boost recommendations related to current bookmark
    if (recommendation.metadata.relatedBookmarks.includes(currentBookmark)) {
      return 1.3;
    }
    
    return 1.0;
  }

  private applyDiversityBonus(recommendations: Recommendation[], diversityWeight: number): void {
    const categories = new Set<string>();
    const categoryCount = new Map<string, number>();
    
    recommendations.forEach(rec => {
      categories.add(rec.metadata.category);
      categoryCount.set(rec.metadata.category, (categoryCount.get(rec.metadata.category) || 0) + 1);
    });
    
    recommendations.forEach(rec => {
      const categoryFreq = categoryCount.get(rec.metadata.category) || 1;
      const diversityBonus = (1 / categoryFreq) * diversityWeight;
      rec.score += diversityBonus;
    });
  }

  // Helper methods for data simulation
  private async getUserBookmarks(userId: string): Promise<any[]> {
    // Simulate getting user bookmarks
    return [];
  }

  private async findSimilarContent(userBookmarks: any[], filters: RecommendationFilters): Promise<any[]> {
    // Simulate finding similar content
    return [];
  }

  private async getBookmarksFromSimilarUsers(similarUsers: UserProfile[], excludeUserId: string): Promise<any[]> {
    // Simulate getting bookmarks from similar users
    return [];
  }

  private async getTrendingContent(filters: RecommendationFilters): Promise<any[]> {
    // Simulate getting trending content
    return [];
  }

  private calculateCollaborativeScore(bookmark: any, similarUsers: UserProfile[], userProfile: UserProfile): number {
    // Simulate collaborative filtering score calculation
    return Math.random() * 0.8 + 0.2;
  }

  private calculatePersonalRelevance(bookmark: any, userProfile: UserProfile): number {
    // Simulate personal relevance calculation
    return Math.random() * 0.8 + 0.2;
  }

  private calculateConfidence(score: number, userProfile: UserProfile): number {
    // Calculate confidence based on score and user profile completeness
    const profileCompleteness = this.calculateProfileCompleteness(userProfile);
    return Math.min(score * profileCompleteness, 1.0);
  }

  private calculateProfileCompleteness(userProfile: UserProfile): number {
    let completeness = 0;
    let factors = 0;
    
    // Check preferences completeness
    if (userProfile.preferences.categories.length > 0) {
      completeness += 0.3;
    }
    factors += 0.3;
    
    if (userProfile.preferences.tags.length > 0) {
      completeness += 0.2;
    }
    factors += 0.2;
    
    if (userProfile.behavior.interactionHistory.length > 0) {
      completeness += 0.3;
    }
    factors += 0.3;
    
    if (userProfile.interests.length > 0) {
      completeness += 0.2;
    }
    factors += 0.2;
    
    return factors > 0 ? completeness / factors : 0.5;
  }

  private generateReasoning(type: string, score: number, bookmark: any, userProfile: UserProfile): string[] {
    const reasoning: string[] = [];
    
    switch (type) {
      case 'content-based':
        reasoning.push(`Based on your interest in ${bookmark.category || 'similar content'}`);
        if (bookmark.tags && bookmark.tags.length > 0) {
          reasoning.push(`Matches your preferences for tags: ${bookmark.tags.slice(0, 3).join(', ')}`);
        }
        break;
        
      case 'collaborative':
        reasoning.push('Users with similar interests also bookmarked this');
        reasoning.push(`${Math.round(score * 100)}% similarity with your preferences`);
        break;
        
      case 'trending':
        reasoning.push('Currently trending in your areas of interest');
        reasoning.push('High engagement from the community');
        break;
        
      case 'hybrid':
        reasoning.push('Combines multiple recommendation factors');
        reasoning.push('Balanced relevance and popularity');
        break;
    }
    
    return reasoning;
  }

  private buildRecommendationMetadata(bookmark: any, userProfile: UserProfile): RecommendationMetadata {
    return {
      category: bookmark.category || 'general',
      tags: bookmark.tags || [],
      estimatedReadingTime: bookmark.readingTime || 5,
      contentQuality: bookmark.quality || 0.7,
      freshness: this.calculateFreshness(bookmark.createdAt),
      similarity: 0.8,
      popularity: 0.6,
      personalRelevance: 0.7,
      source: bookmark.domain || 'unknown',
      relatedBookmarks: []
    };
  }

  private calculateFreshness(createdAt: Date): number {
    const ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - (ageInDays / 30)); // Freshness decreases over 30 days
  }

  private cacheRecommendations(userId: string, recommendations: Recommendation[]): void {
    this.recommendations.set(userId, recommendations);
    
    // Set cache expiry
    setTimeout(() => {
      this.recommendations.delete(userId);
    }, 30 * 60 * 1000); // 30 minutes
  }

  private async updatePreferencesFromInteraction(profile: UserProfile, interaction: any): Promise<void> {
    // Update user preferences based on interaction
    // This is a simplified implementation
    if (interaction.action === 'favorite' || interaction.action === 'share') {
      // Boost preference for the bookmark's category and tags
      // Implementation would update weights in profile.preferences
    }
  }

  private generateRecommendationId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      categories: [],
      tags: [],
      contentTypes: [
        { type: 'article', preference: 0.8 },
        { type: 'video', preference: 0.6 },
        { type: 'documentation', preference: 0.7 },
        { type: 'tutorial', preference: 0.9 },
        { type: 'news', preference: 0.5 },
        { type: 'research', preference: 0.4 }
      ],
      languages: [{ language: 'en', preference: 1.0 }],
      readingLevel: 'intermediate',
      contentLength: 'medium',
      freshness: 'recent'
    };
  }

  private getDefaultBehavior(): UserBehavior {
    return {
      bookmarkingPatterns: {
        averageBookmarksPerDay: 0,
        peakHours: [],
        commonDomains: [],
        averageReadingTime: 0
      },
      interactionHistory: [],
      searchPatterns: [],
      categoryUsage: {}
    };
  }

  private getDefaultDemographics(): UserDemographics {
    return {
      timezone: 'UTC',
      deviceTypes: ['desktop'],
      browserPreferences: []
    };
  }

  private initializeMetrics(): RecommendationMetrics {
    return {
      totalRecommendations: 0,
      clickThroughRate: 0,
      conversionRate: 0,
      averageScore: 0,
      typeDistribution: {},
      categoryDistribution: {},
      userSatisfaction: 0,
      performanceMetrics: {
        averageGenerationTime: 0,
        cacheHitRate: 0,
        errorRate: 0
      }
    };
  }

  private updateMetrics(recommendations: Recommendation[], duration: number): void {
    this.metrics.totalRecommendations += recommendations.length;
    
    // Update type distribution
    recommendations.forEach(rec => {
      this.metrics.typeDistribution[rec.type] = (this.metrics.typeDistribution[rec.type] || 0) + 1;
      this.metrics.categoryDistribution[rec.metadata.category] = (this.metrics.categoryDistribution[rec.metadata.category] || 0) + 1;
    });
    
    // Update performance metrics
    const currentAvg = this.metrics.performanceMetrics.averageGenerationTime;
    const count = this.metrics.totalRecommendations;
    this.metrics.performanceMetrics.averageGenerationTime = 
      (currentAvg * (count - recommendations.length) + duration) / count;
  }

  private startMetricsCollection(): void {
    // Collect metrics every hour
    setInterval(() => {
      logger.info('Recommendation metrics', { metrics: this.metrics });
    }, 60 * 60 * 1000);
  }

  // Public utility methods
  getMetrics(): RecommendationMetrics {
    return { ...this.metrics };
  }

  getCachedRecommendations(userId: string): Recommendation[] | undefined {
    return this.recommendations.get(userId);
  }

  clearUserCache(userId: string): void {
    this.recommendations.delete(userId);
    this.cache.delete(userId);
  }

  async exportUserProfile(userId: string): Promise<UserProfile | undefined> {
    return this.userProfiles.get(userId);
  }
}

// Export singleton instance
export const recommendationEngine = new RecommendationEngine();    