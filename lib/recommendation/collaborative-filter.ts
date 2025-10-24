import { appLogger } from '../../lib/logger';
import { UserProfile, Recommendation } from './recommendation-engine';
import { performance } from 'perf_hooks';

const logger = appLogger;

export interface UserSimilarity {
  userId1: string;
  userId2: string;
  similarity: number;
  factors: {
    categoryOverlap: number;
    tagSimilarity: number;
    behaviorSimilarity: number;
    interestAlignment: number;
    temporalPatterns: number;
  };
  confidence: number;
  computedAt: Date;
  lastUpdated: Date;
}

export interface UserItemMatrix {
  userId: string;
  items: Map<string, UserItemInteraction>;
  lastUpdated: Date;
}

export interface UserItemInteraction {
  itemId: string;
  rating: number; // 0-1 (implicit rating based on interactions)
  interactions: Array<{
    type: 'view' | 'bookmark' | 'share' | 'favorite' | 'comment';
    timestamp: Date;
    duration?: number;
    weight: number;
  }>;
  lastInteraction: Date;
  totalScore: number;
}

export interface CollaborativeRecommendation {
  itemId: string;
  predictedRating: number;
  confidence: number;
  supportingUsers: Array<{
    userId: string;
    similarity: number;
    rating: number;
  }>;
  explanation: string;
  diversity: number;
  novelty: number;
}

export interface RecommendationMatrix {
  userId: string;
  recommendations: Map<string, CollaborativeRecommendation>;
  generatedAt: Date;
  expiresAt: Date;
  version: number;
}

export interface CollaborativeFilterConfig {
  minSimilarityThreshold: number;
  maxSimilarUsers: number;
  minSupportingUsers: number;
  decayFactor: number; // For time-based decay
  diversityWeight: number;
  noveltyWeight: number;
  confidenceThreshold: number;
}

export interface SimilarityMetrics {
  pearsonCorrelation: number;
  cosineSimilarity: number;
  jaccardIndex: number;
  euclideanDistance: number;
  manhattanDistance: number;
}

export class CollaborativeFilter {
  private userSimilarities: Map<string, Map<string, UserSimilarity>> = new Map();
  private userItemMatrices: Map<string, UserItemMatrix> = new Map();
  private recommendationMatrices: Map<string, RecommendationMatrix> = new Map();
  private config: CollaborativeFilterConfig;
  private cache: Map<string, any> = new Map();

  constructor(config?: Partial<CollaborativeFilterConfig>) {
    this.config = {
      minSimilarityThreshold: 0.3,
      maxSimilarUsers: 50,
      minSupportingUsers: 3,
      decayFactor: 0.1,
      diversityWeight: 0.2,
      noveltyWeight: 0.1,
      confidenceThreshold: 0.5,
      ...config
    };
  }

  async generateCollaborativeRecommendations(
    userId: string,
    count: number = 20,
    excludeItems: string[] = []
  ): Promise<CollaborativeRecommendation[]> {
    const startTime = performance.now();

    try {
      logger.info('Generating collaborative recommendations', {
        userId,
        count,
        excludeCount: excludeItems.length
      });

      // Get or compute user similarities
      const similarUsers = await this.findSimilarUsers(userId);
      
      if (similarUsers.length < this.config.minSupportingUsers) {
        logger.warn('Insufficient similar users for collaborative filtering', {
          userId,
          similarUsersCount: similarUsers.length,
          required: this.config.minSupportingUsers
        });
        return [];
      }

      // Get user-item matrix
      const userMatrix = await this.getUserItemMatrix(userId);
      
      // Generate recommendations using collaborative filtering
      const recommendations = await this.computeCollaborativeRecommendations(
        userId,
        similarUsers,
        userMatrix,
        excludeItems
      );

      // Apply post-processing filters
      const filteredRecommendations = this.applyPostProcessingFilters(recommendations, count);

      const duration = performance.now() - startTime;
      logger.info('Collaborative recommendations generated', {
        userId,
        count: filteredRecommendations.length,
        similarUsers: similarUsers.length,
        duration: Math.round(duration)
      });

      return filteredRecommendations;

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Collaborative recommendation generation failed', error as Error, {
        userId,
        duration: Math.round(duration)
      });
      
      throw new Error(`Failed to generate collaborative recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async computeUserSimilarity(userId1: string, userId2: string): Promise<UserSimilarity> {
    const cacheKey = `similarity:${userId1}:${userId2}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const matrix1 = await this.getUserItemMatrix(userId1);
      const matrix2 = await this.getUserItemMatrix(userId2);

      // Calculate various similarity metrics
      const metrics = this.calculateSimilarityMetrics(matrix1, matrix2);
      
      // Calculate factor-based similarities
      const factors = await this.calculateSimilarityFactors(userId1, userId2);
      
      // Combine metrics with weighted average
      const similarity = this.combineSimilarityMetrics(metrics, factors);
      
      const userSimilarity: UserSimilarity = {
        userId1,
        userId2,
        similarity,
        factors,
        confidence: this.calculateSimilarityConfidence(metrics, matrix1, matrix2),
        computedAt: new Date(),
        lastUpdated: new Date()
      };

      // Cache the result
      this.cache.set(cacheKey, userSimilarity);
      
      // Store in similarity matrix
      this.storeSimilarity(userSimilarity);

      return userSimilarity;

    } catch (error) {
      logger.error('User similarity computation failed', error as Error, {
        userId1,
        userId2
      });
      
      // Return default similarity
      return {
        userId1,
        userId2,
        similarity: 0,
        factors: {
          categoryOverlap: 0,
          tagSimilarity: 0,
          behaviorSimilarity: 0,
          interestAlignment: 0,
          temporalPatterns: 0
        },
        confidence: 0,
        computedAt: new Date(),
        lastUpdated: new Date()
      };
    }
  }

  async updateUserItemMatrix(userId: string, itemId: string, interaction: {
    type: 'view' | 'bookmark' | 'share' | 'favorite' | 'comment';
    duration?: number;
    timestamp?: Date;
  }): Promise<void> {
    try {
      let matrix = this.userItemMatrices.get(userId);
      
      if (!matrix) {
        matrix = {
          userId,
          items: new Map(),
          lastUpdated: new Date()
        };
        this.userItemMatrices.set(userId, matrix);
      }

      let itemInteraction = matrix.items.get(itemId);
      
      if (!itemInteraction) {
        itemInteraction = {
          itemId,
          rating: 0,
          interactions: [],
          lastInteraction: new Date(),
          totalScore: 0
        };
        matrix.items.set(itemId, itemInteraction);
      }

      // Calculate interaction weight
      const weight = this.calculateInteractionWeight(interaction.type, interaction.duration);
      
      // Add new interaction
      itemInteraction.interactions.push({
        type: interaction.type,
        timestamp: interaction.timestamp || new Date(),
        duration: interaction.duration,
        weight
      });

      // Update scores
      itemInteraction.totalScore += weight;
      itemInteraction.rating = this.calculateImplicitRating(itemInteraction);
      itemInteraction.lastInteraction = interaction.timestamp || new Date();
      
      // Apply time decay to older interactions
      this.applyTimeDecay(itemInteraction);
      
      matrix.lastUpdated = new Date();

      logger.debug('User-item matrix updated', {
        userId,
        itemId,
        interactionType: interaction.type,
        newRating: itemInteraction.rating,
        totalScore: itemInteraction.totalScore
      });

    } catch (error) {
      logger.error('Failed to update user-item matrix', error as Error, {
        userId,
        itemId,
        interaction
      });
    }
  }

  private async findSimilarUsers(userId: string): Promise<Array<{ userId: string; similarity: number }>> {
    const similarUsers: Array<{ userId: string; similarity: number }> = [];
    
    // Get similarities for this user
    const userSimilarities = this.userSimilarities.get(userId);
    
    if (userSimilarities) {
      for (const [otherUserId, similarity] of userSimilarities) {
        if (similarity.similarity >= this.config.minSimilarityThreshold) {
          similarUsers.push({
            userId: otherUserId,
            similarity: similarity.similarity
          });
        }
      }
    } else {
      // Compute similarities with all other users
      for (const [otherUserId] of this.userItemMatrices) {
        if (otherUserId !== userId) {
          const similarity = await this.computeUserSimilarity(userId, otherUserId);
          if (similarity.similarity >= this.config.minSimilarityThreshold) {
            similarUsers.push({
              userId: otherUserId,
              similarity: similarity.similarity
            });
          }
        }
      }
    }

    // Sort by similarity and limit
    return similarUsers
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, this.config.maxSimilarUsers);
  }

  private async getUserItemMatrix(userId: string): Promise<UserItemMatrix> {
    let matrix = this.userItemMatrices.get(userId);
    
    if (!matrix) {
      matrix = {
        userId,
        items: new Map(),
        lastUpdated: new Date()
      };
      this.userItemMatrices.set(userId, matrix);
    }
    
    return matrix;
  }

  private async computeCollaborativeRecommendations(
    userId: string,
    similarUsers: Array<{ userId: string; similarity: number }>,
    userMatrix: UserItemMatrix,
    excludeItems: string[]
  ): Promise<CollaborativeRecommendation[]> {
    const recommendations: CollaborativeRecommendation[] = [];
    const candidateItems = new Map<string, Array<{ userId: string; rating: number; similarity: number }>>();

    // Collect candidate items from similar users
    for (const { userId: similarUserId, similarity } of similarUsers) {
      const similarUserMatrix = await this.getUserItemMatrix(similarUserId);
      
      for (const [itemId, interaction] of similarUserMatrix.items) {
        // Skip items already interacted with by the target user
        if (userMatrix.items.has(itemId) || excludeItems.includes(itemId)) {
          continue;
        }

        if (!candidateItems.has(itemId)) {
          candidateItems.set(itemId, []);
        }
        
        candidateItems.get(itemId)!.push({
          userId: similarUserId,
          rating: interaction.rating,
          similarity
        });
      }
    }

    // Generate recommendations for each candidate item
    for (const [itemId, supportingUsers] of candidateItems) {
      if (supportingUsers.length >= this.config.minSupportingUsers) {
        const recommendation = this.computeItemRecommendation(itemId, supportingUsers);
        
        if (recommendation.confidence >= this.config.confidenceThreshold) {
          recommendations.push(recommendation);
        }
      }
    }

    return recommendations;
  }

  private computeItemRecommendation(
    itemId: string,
    supportingUsers: Array<{ userId: string; rating: number; similarity: number }>
  ): CollaborativeRecommendation {
    // Calculate predicted rating using weighted average
    let weightedSum = 0;
    let weightSum = 0;
    
    supportingUsers.forEach(({ rating, similarity }) => {
      weightedSum += rating * similarity;
      weightSum += similarity;
    });
    
    const predictedRating = weightSum > 0 ? weightedSum / weightSum : 0;
    
    // Calculate confidence based on number of supporting users and their similarities
    const avgSimilarity = supportingUsers.reduce((sum, user) => sum + user.similarity, 0) / supportingUsers.length;
    const confidence = Math.min(
      (supportingUsers.length / this.config.maxSimilarUsers) * avgSimilarity,
      1.0
    );
    
    // Calculate diversity and novelty
    const diversity = this.calculateItemDiversity(itemId, supportingUsers);
    const novelty = this.calculateItemNovelty(itemId, supportingUsers);
    
    // Generate explanation
    const explanation = this.generateCollaborativeExplanation(supportingUsers);

    return {
      itemId,
      predictedRating,
      confidence,
      supportingUsers: supportingUsers.map(user => ({
        userId: user.userId,
        similarity: user.similarity,
        rating: user.rating
      })),
      explanation,
      diversity,
      novelty
    };
  }

  private calculateSimilarityMetrics(matrix1: UserItemMatrix, matrix2: UserItemMatrix): SimilarityMetrics {
    const commonItems = new Set<string>();
    const ratings1: number[] = [];
    const ratings2: number[] = [];

    // Find common items and collect ratings
    for (const [itemId, interaction1] of matrix1.items) {
      if (matrix2.items.has(itemId)) {
        commonItems.add(itemId);
        ratings1.push(interaction1.rating);
        ratings2.push(matrix2.items.get(itemId)!.rating);
      }
    }

    if (commonItems.size === 0) {
      return {
        pearsonCorrelation: 0,
        cosineSimilarity: 0,
        jaccardIndex: 0,
        euclideanDistance: 1,
        manhattanDistance: 1
      };
    }

    return {
      pearsonCorrelation: this.calculatePearsonCorrelation(ratings1, ratings2),
      cosineSimilarity: this.calculateCosineSimilarity(ratings1, ratings2),
      jaccardIndex: this.calculateJaccardIndex(matrix1, matrix2),
      euclideanDistance: this.calculateEuclideanDistance(ratings1, ratings2),
      manhattanDistance: this.calculateManhattanDistance(ratings1, ratings2)
    };
  }

  private async calculateSimilarityFactors(userId1: string, userId2: string): Promise<{
    categoryOverlap: number;
    tagSimilarity: number;
    behaviorSimilarity: number;
    interestAlignment: number;
    temporalPatterns: number;
  }> {
    // This would integrate with user profiles to calculate factor-based similarities
    // For now, returning simulated values
    return {
      categoryOverlap: Math.random() * 0.8 + 0.1,
      tagSimilarity: Math.random() * 0.8 + 0.1,
      behaviorSimilarity: Math.random() * 0.8 + 0.1,
      interestAlignment: Math.random() * 0.8 + 0.1,
      temporalPatterns: Math.random() * 0.8 + 0.1
    };
  }

  private combineSimilarityMetrics(metrics: SimilarityMetrics, factors: any): number {
    // Weighted combination of different similarity measures
    const weights = {
      pearsonCorrelation: 0.25,
      cosineSimilarity: 0.25,
      jaccardIndex: 0.15,
      categoryOverlap: 0.15,
      tagSimilarity: 0.10,
      behaviorSimilarity: 0.10
    };

    return (
      metrics.pearsonCorrelation * weights.pearsonCorrelation +
      metrics.cosineSimilarity * weights.cosineSimilarity +
      metrics.jaccardIndex * weights.jaccardIndex +
      factors.categoryOverlap * weights.categoryOverlap +
      factors.tagSimilarity * weights.tagSimilarity +
      factors.behaviorSimilarity * weights.behaviorSimilarity
    );
  }

  private calculateSimilarityConfidence(
    metrics: SimilarityMetrics,
    matrix1: UserItemMatrix,
    matrix2: UserItemMatrix
  ): number {
    const commonItems = this.getCommonItemsCount(matrix1, matrix2);
    const totalItems = Math.max(matrix1.items.size, matrix2.items.size);
    
    if (totalItems === 0) return 0;
    
    const overlap = commonItems / totalItems;
    const dataQuality = Math.min(matrix1.items.size, matrix2.items.size) / 10; // Normalize by expected minimum items
    
    return Math.min(overlap * dataQuality, 1.0);
  }

  private calculateInteractionWeight(type: string, duration?: number): number {
    const baseWeights = {
      'view': 0.1,
      'bookmark': 0.5,
      'share': 0.7,
      'favorite': 0.8,
      'comment': 0.6
    };

    let weight = baseWeights[type as keyof typeof baseWeights] || 0.1;

    // Adjust weight based on duration for view interactions
    if (type === 'view' && duration) {
      const durationMultiplier = Math.min(duration / 60, 3); // Cap at 3 minutes
      weight *= (1 + durationMultiplier);
    }

    return Math.min(weight, 1.0);
  }

  private calculateImplicitRating(interaction: UserItemInteraction): number {
    const totalWeight = interaction.interactions.reduce((sum, int) => sum + int.weight, 0);
    const normalizedRating = Math.min(totalWeight / 5, 1.0); // Normalize to 0-1 scale
    
    // Apply recency boost
    const daysSinceLastInteraction = (Date.now() - interaction.lastInteraction.getTime()) / (1000 * 60 * 60 * 24);
    const recencyBoost = Math.exp(-daysSinceLastInteraction * this.config.decayFactor);
    
    return normalizedRating * recencyBoost;
  }

  private applyTimeDecay(interaction: UserItemInteraction): void {
    const now = Date.now();
    
    interaction.interactions.forEach(int => {
      const ageInDays = (now - int.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      int.weight *= Math.exp(-ageInDays * this.config.decayFactor);
    });

    // Remove interactions with very low weights
    interaction.interactions = interaction.interactions.filter(int => int.weight > 0.01);
  }

  private calculateItemDiversity(itemId: string, supportingUsers: any[]): number {
    // Calculate how diverse the supporting users are
    // This is a simplified implementation
    const uniqueUserTypes = new Set(supportingUsers.map(user => user.userId.slice(0, 3))); // Simple user type approximation
    return uniqueUserTypes.size / supportingUsers.length;
  }

  private calculateItemNovelty(itemId: string, supportingUsers: any[]): number {
    // Calculate how novel/surprising this recommendation is
    // This is a simplified implementation
    const avgSimilarity = supportingUsers.reduce((sum, user) => sum + user.similarity, 0) / supportingUsers.length;
    return 1 - avgSimilarity; // More novel if supporting users are less similar
  }

  private generateCollaborativeExplanation(supportingUsers: any[]): string {
    const topUsers = supportingUsers
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);
    
    return `Recommended based on ${supportingUsers.length} similar users who rated this highly (avg similarity: ${Math.round(supportingUsers.reduce((sum, user) => sum + user.similarity, 0) / supportingUsers.length * 100)}%)`;
  }

  private applyPostProcessingFilters(
    recommendations: CollaborativeRecommendation[],
    count: number
  ): CollaborativeRecommendation[] {
    // Sort by predicted rating with diversity and novelty adjustments
    const scoredRecommendations = recommendations.map(rec => ({
      ...rec,
      finalScore: rec.predictedRating + 
                 (rec.diversity * this.config.diversityWeight) + 
                 (rec.novelty * this.config.noveltyWeight)
    }));

    return scoredRecommendations
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, count);
  }

  // Similarity calculation methods
  private calculatePearsonCorrelation(ratings1: number[], ratings2: number[]): number {
    if (ratings1.length !== ratings2.length || ratings1.length === 0) return 0;

    const n = ratings1.length;
    const sum1 = ratings1.reduce((a, b) => a + b, 0);
    const sum2 = ratings2.reduce((a, b) => a + b, 0);
    const sum1Sq = ratings1.reduce((a, b) => a + b * b, 0);
    const sum2Sq = ratings2.reduce((a, b) => a + b * b, 0);
    const sumProducts = ratings1.reduce((sum, rating1, i) => sum + rating1 * ratings2[i], 0);

    const numerator = sumProducts - (sum1 * sum2 / n);
    const denominator = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateCosineSimilarity(ratings1: number[], ratings2: number[]): number {
    if (ratings1.length !== ratings2.length || ratings1.length === 0) return 0;

    const dotProduct = ratings1.reduce((sum, rating1, i) => sum + rating1 * ratings2[i], 0);
    const magnitude1 = Math.sqrt(ratings1.reduce((sum, rating) => sum + rating * rating, 0));
    const magnitude2 = Math.sqrt(ratings2.reduce((sum, rating) => sum + rating * rating, 0));

    return (magnitude1 === 0 || magnitude2 === 0) ? 0 : dotProduct / (magnitude1 * magnitude2);
  }

  private calculateJaccardIndex(matrix1: UserItemMatrix, matrix2: UserItemMatrix): number {
    const items1 = new Set(matrix1.items.keys());
    const items2 = new Set(matrix2.items.keys());
    
    const intersection = new Set([...items1].filter(item => items2.has(item)));
    const union = new Set([...items1, ...items2]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  private calculateEuclideanDistance(ratings1: number[], ratings2: number[]): number {
    if (ratings1.length !== ratings2.length || ratings1.length === 0) return 1;

    const sumSquaredDiffs = ratings1.reduce((sum, rating1, i) => {
      const diff = rating1 - ratings2[i];
      return sum + diff * diff;
    }, 0);

    return Math.sqrt(sumSquaredDiffs);
  }

  private calculateManhattanDistance(ratings1: number[], ratings2: number[]): number {
    if (ratings1.length !== ratings2.length || ratings1.length === 0) return 1;

    return ratings1.reduce((sum, rating1, i) => sum + Math.abs(rating1 - ratings2[i]), 0);
  }

  private getCommonItemsCount(matrix1: UserItemMatrix, matrix2: UserItemMatrix): number {
    let count = 0;
    for (const itemId of matrix1.items.keys()) {
      if (matrix2.items.has(itemId)) {
        count++;
      }
    }
    return count;
  }

  private storeSimilarity(similarity: UserSimilarity): void {
    // Store similarity in both directions
    if (!this.userSimilarities.has(similarity.userId1)) {
      this.userSimilarities.set(similarity.userId1, new Map());
    }
    if (!this.userSimilarities.has(similarity.userId2)) {
      this.userSimilarities.set(similarity.userId2, new Map());
    }

    this.userSimilarities.get(similarity.userId1)!.set(similarity.userId2, similarity);
    this.userSimilarities.get(similarity.userId2)!.set(similarity.userId1, {
      ...similarity,
      userId1: similarity.userId2,
      userId2: similarity.userId1
    });
  }

  // Public utility methods
  async batchUpdateUserItemMatrix(updates: Array<{
    userId: string;
    itemId: string;
    interaction: {
      type: 'view' | 'bookmark' | 'share' | 'favorite' | 'comment';
      duration?: number;
      timestamp?: Date;
    };
  }>): Promise<void> {
    for (const update of updates) {
      await this.updateUserItemMatrix(update.userId, update.itemId, update.interaction);
    }
  }

  getUserSimilarities(userId: string): Map<string, UserSimilarity> | undefined {
    return this.userSimilarities.get(userId);
  }

  getConfig(): CollaborativeFilterConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<CollaborativeFilterConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Collaborative filter config updated', newConfig);
  }

  clearCache(): void {
    this.cache.clear();
    logger.info('Collaborative filter cache cleared');
  }

  getStats(): {
    totalUsers: number;
    totalSimilarities: number;
    averageMatrixSize: number;
    cacheSize: number;
  } {
    const totalSimilarities = Array.from(this.userSimilarities.values())
      .reduce((sum, similarities) => sum + similarities.size, 0);
    
    const averageMatrixSize = this.userItemMatrices.size > 0 
      ? Array.from(this.userItemMatrices.values())
          .reduce((sum, matrix) => sum + matrix.items.size, 0) / this.userItemMatrices.size
      : 0;

    return {
      totalUsers: this.userItemMatrices.size,
      totalSimilarities,
      averageMatrixSize,
      cacheSize: this.cache.size
    };
  }
}

// Export singleton instance
export const collaborativeFilter = new CollaborativeFilter();  