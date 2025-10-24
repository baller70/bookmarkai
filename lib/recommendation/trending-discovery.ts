import { appLogger } from '../../lib/logger';
import { performance } from 'perf_hooks';

const logger = appLogger;

export interface TrendingItem {
  id: string;
  url: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  metrics: TrendingMetrics;
  score: TrendingScore;
  metadata: TrendingMetadata;
  firstSeen: Date;
  lastUpdated: Date;
}

export interface TrendingMetrics {
  views: number;
  bookmarks: number;
  shares: number;
  comments: number;
  favorites: number;
  uniqueUsers: number;
  timeSpent: number; // total time spent by all users
  clickThroughRate: number;
  engagementRate: number;
  viralityCoefficient: number;
}

export interface TrendingScore {
  overall: number; // 0-1
  popularity: number; // based on absolute metrics
  velocity: number; // rate of change
  acceleration: number; // rate of velocity change
  freshness: number; // recency factor
  quality: number; // content quality factor
  diversity: number; // how diverse the audience is
  sustainability: number; // how long the trend has lasted
}

export interface TrendingMetadata {
  source: string;
  domain: string;
  contentType: 'article' | 'video' | 'tutorial' | 'news' | 'research' | 'tool';
  language: string;
  readingTime: number;
  publishedAt?: Date;
  authorInfo?: {
    name: string;
    reputation: number;
  };
  topicClusters: string[];
  geographicReach: string[];
  deviceTypes: string[];
}

export interface TrendingTimeWindow {
  period: 'hour' | 'day' | 'week' | 'month';
  startTime: Date;
  endTime: Date;
  metrics: TrendingMetrics;
  rank: number;
  percentileRank: number;
}

export interface TrendingCategory {
  name: string;
  items: TrendingItem[];
  totalItems: number;
  averageScore: number;
  topTags: string[];
  growthRate: number;
  lastUpdated: Date;
}

export interface TrendingDiscoveryConfig {
  timeWindows: Array<'hour' | 'day' | 'week' | 'month'>;
  categories: string[];
  minMetricsThreshold: {
    views: number;
    bookmarks: number;
    uniqueUsers: number;
  };
  scoreWeights: {
    popularity: number;
    velocity: number;
    acceleration: number;
    freshness: number;
    quality: number;
    diversity: number;
    sustainability: number;
  };
  maxItemsPerCategory: number;
  updateFrequency: number; // minutes
  decayFactor: number;
}

export interface TrendingQuery {
  categories?: string[];
  tags?: string[];
  timeWindow: 'hour' | 'day' | 'week' | 'month';
  limit: number;
  minScore?: number;
  contentTypes?: string[];
  languages?: string[];
  excludeItems?: string[];
}

export interface TrendingAnalytics {
  totalTrendingItems: number;
  categoriesCount: number;
  averageLifespan: number; // hours
  topCategories: Array<{ category: string; count: number; growth: number }>;
  topTags: Array<{ tag: string; frequency: number; trend: number }>;
  peakHours: number[];
  geographicDistribution: Record<string, number>;
  contentTypeDistribution: Record<string, number>;
  qualityDistribution: {
    high: number; // >0.8
    medium: number; // 0.5-0.8
    low: number; // <0.5
  };
}

export class TrendingDiscovery {
  private trendingItems: Map<string, TrendingItem> = new Map();
  private trendingCategories: Map<string, TrendingCategory> = new Map();
  private timeWindowData: Map<string, Map<string, TrendingTimeWindow>> = new Map();
  private config: TrendingDiscoveryConfig;
  private analytics: TrendingAnalytics;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<TrendingDiscoveryConfig>) {
    this.config = {
      timeWindows: ['hour', 'day', 'week', 'month'],
      categories: ['technology', 'business', 'science', 'entertainment', 'education', 'health', 'lifestyle'],
      minMetricsThreshold: {
        views: 10,
        bookmarks: 3,
        uniqueUsers: 5
      },
      scoreWeights: {
        popularity: 0.25,
        velocity: 0.20,
        acceleration: 0.15,
        freshness: 0.15,
        quality: 0.10,
        diversity: 0.10,
        sustainability: 0.05
      },
      maxItemsPerCategory: 50,
      updateFrequency: 15, // 15 minutes
      decayFactor: 0.1,
      ...config
    };

    this.analytics = this.initializeAnalytics();
    this.startPeriodicUpdates();
  }

  async discoverTrending(query: TrendingQuery): Promise<TrendingItem[]> {
    const startTime = performance.now();

    try {
      logger.info('Discovering trending content', {
        timeWindow: query.timeWindow,
        categories: query.categories,
        limit: query.limit
      });

      // Get trending items for the specified time window
      let candidates = await this.getTrendingCandidates(query);

      // Apply filters
      candidates = this.applyFilters(candidates, query);

      // Sort by trending score
      candidates = this.sortByTrendingScore(candidates, query.timeWindow);

      // Apply diversity and limit
      const results = this.applyDiversityAndLimit(candidates, query.limit);

      const duration = performance.now() - startTime;
      logger.info('Trending discovery completed', {
        timeWindow: query.timeWindow,
        candidates: candidates.length,
        results: results.length,
        duration: Math.round(duration)
      });

      return results;

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Trending discovery failed', error as Error, {
        query,
        duration: Math.round(duration)
      });
      
      throw new Error(`Failed to discover trending content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateItemMetrics(itemId: string, interaction: {
    type: 'view' | 'bookmark' | 'share' | 'comment' | 'favorite';
    userId: string;
    duration?: number;
    timestamp?: Date;
  }): Promise<void> {
    try {
      let item = this.trendingItems.get(itemId);
      
      if (!item) {
        // Create new trending item if it doesn't exist
        item = await this.createTrendingItem(itemId);
        this.trendingItems.set(itemId, item);
      }

      // Update metrics based on interaction
      this.updateMetrics(item, interaction);

      // Recalculate trending score
      item.score = this.calculateTrendingScore(item);
      item.lastUpdated = new Date();

      // Update time window data
      this.updateTimeWindowData(item, interaction);

      // Update category data
      this.updateCategoryData(item);

      logger.debug('Item metrics updated', {
        itemId,
        interactionType: interaction.type,
        newScore: item.score.overall,
        category: item.category
      });

    } catch (error) {
      logger.error('Failed to update item metrics', error as Error, {
        itemId,
        interaction
      });
    }
  }

  async getTrendingByCategory(category: string, timeWindow: 'hour' | 'day' | 'week' | 'month' = 'day', limit: number = 20): Promise<TrendingItem[]> {
    const categoryData = this.trendingCategories.get(category);
    
    if (!categoryData) {
      return [];
    }

    return categoryData.items
      .filter(item => this.hasRecentActivity(item, timeWindow))
      .sort((a, b) => b.score.overall - a.score.overall)
      .slice(0, limit);
  }

  async getTrendingTags(timeWindow: 'hour' | 'day' | 'week' | 'month' = 'day', limit: number = 20): Promise<Array<{ tag: string; frequency: number; trend: number }>> {
    const tagFrequency = new Map<string, { count: number; items: TrendingItem[] }>();
    const cutoffTime = this.getTimeWindowCutoff(timeWindow);

    // Collect tags from recent trending items
    for (const item of this.trendingItems.values()) {
      if (item.lastUpdated >= cutoffTime) {
        item.tags.forEach(tag => {
          if (!tagFrequency.has(tag)) {
            tagFrequency.set(tag, { count: 0, items: [] });
          }
          const tagData = tagFrequency.get(tag)!;
          tagData.count++;
          tagData.items.push(item);
        });
      }
    }

    // Calculate trend scores
    const trendingTags = Array.from(tagFrequency.entries()).map(([tag, data]) => {
      const avgScore = data.items.reduce((sum, item) => sum + item.score.overall, 0) / data.items.length;
      const velocityScore = data.items.reduce((sum, item) => sum + item.score.velocity, 0) / data.items.length;
      
      return {
        tag,
        frequency: data.count,
        trend: (avgScore + velocityScore) / 2
      };
    });

    return trendingTags
      .sort((a, b) => b.trend - a.trend)
      .slice(0, limit);
  }

  async getEmergingTrends(timeWindow: 'hour' | 'day' = 'hour', limit: number = 10): Promise<TrendingItem[]> {
    const cutoffTime = this.getTimeWindowCutoff(timeWindow);
    
    // Find items with high acceleration and freshness
    const emergingItems = Array.from(this.trendingItems.values())
      .filter(item => {
        return item.firstSeen >= cutoffTime && 
               item.score.acceleration > 0.7 && 
               item.score.freshness > 0.8;
      })
      .sort((a, b) => {
        const scoreA = a.score.acceleration * 0.6 + a.score.velocity * 0.4;
        const scoreB = b.score.acceleration * 0.6 + b.score.velocity * 0.4;
        return scoreB - scoreA;
      });

    return emergingItems.slice(0, limit);
  }

  async getViralContent(timeWindow: 'hour' | 'day' | 'week' = 'day', limit: number = 10): Promise<TrendingItem[]> {
    const cutoffTime = this.getTimeWindowCutoff(timeWindow);
    
    // Find items with high virality coefficient and sharing
    const viralItems = Array.from(this.trendingItems.values())
      .filter(item => {
        return item.lastUpdated >= cutoffTime && 
               item.metrics.viralityCoefficient > 1.5 && 
               item.metrics.shares > 0;
      })
      .sort((a, b) => b.metrics.viralityCoefficient - a.metrics.viralityCoefficient);

    return viralItems.slice(0, limit);
  }

  private async getTrendingCandidates(query: TrendingQuery): Promise<TrendingItem[]> {
    const cutoffTime = this.getTimeWindowCutoff(query.timeWindow);
    const candidates: TrendingItem[] = [];

    for (const item of this.trendingItems.values()) {
      // Check if item has recent activity
      if (item.lastUpdated >= cutoffTime) {
        // Check minimum thresholds
        if (this.meetsMinimumThreshold(item)) {
          candidates.push(item);
        }
      }
    }

    return candidates;
  }

  private applyFilters(items: TrendingItem[], query: TrendingQuery): TrendingItem[] {
    return items.filter(item => {
      // Category filter
      if (query.categories && query.categories.length > 0) {
        if (!query.categories.includes(item.category)) {
          return false;
        }
      }

      // Tags filter
      if (query.tags && query.tags.length > 0) {
        const hasMatchingTag = query.tags.some(tag => item.tags.includes(tag));
        if (!hasMatchingTag) {
          return false;
        }
      }

      // Content type filter
      if (query.contentTypes && query.contentTypes.length > 0) {
        if (!query.contentTypes.includes(item.metadata.contentType)) {
          return false;
        }
      }

      // Language filter
      if (query.languages && query.languages.length > 0) {
        if (!query.languages.includes(item.metadata.language)) {
          return false;
        }
      }

      // Score filter
      if (query.minScore && item.score.overall < query.minScore) {
        return false;
      }

      // Exclude items
      if (query.excludeItems && query.excludeItems.includes(item.id)) {
        return false;
      }

      return true;
    });
  }

  private sortByTrendingScore(items: TrendingItem[], timeWindow: string): TrendingItem[] {
    return items.sort((a, b) => {
      // Adjust score based on time window
      let scoreA = a.score.overall;
      let scoreB = b.score.overall;

      // For shorter time windows, emphasize velocity and acceleration
      if (timeWindow === 'hour') {
        scoreA = scoreA * 0.5 + a.score.velocity * 0.3 + a.score.acceleration * 0.2;
        scoreB = scoreB * 0.5 + b.score.velocity * 0.3 + b.score.acceleration * 0.2;
      } else if (timeWindow === 'day') {
        scoreA = scoreA * 0.7 + a.score.velocity * 0.3;
        scoreB = scoreB * 0.7 + b.score.velocity * 0.3;
      }

      return scoreB - scoreA;
    });
  }

  private applyDiversityAndLimit(items: TrendingItem[], limit: number): TrendingItem[] {
    const results: TrendingItem[] = [];
    const categoryCount = new Map<string, number>();
    const maxPerCategory = Math.ceil(limit / this.config.categories.length);

    for (const item of items) {
      const currentCount = categoryCount.get(item.category) || 0;
      
      if (currentCount < maxPerCategory && results.length < limit) {
        results.push(item);
        categoryCount.set(item.category, currentCount + 1);
      }
    }

    // Fill remaining slots if any category hasn't reached the limit
    for (const item of items) {
      if (results.length >= limit) break;
      if (!results.includes(item)) {
        results.push(item);
      }
    }

    return results.slice(0, limit);
  }

  private async createTrendingItem(itemId: string): Promise<TrendingItem> {
    // This would typically fetch item details from a database
    // For now, creating a mock item
    return {
      id: itemId,
      url: `https://example.com/item/${itemId}`,
      title: `Trending Item ${itemId}`,
      description: 'A trending item description',
      category: this.config.categories[Math.floor(Math.random() * this.config.categories.length)],
      tags: ['trending', 'popular'],
      metrics: this.getInitialMetrics(),
      score: this.getInitialScore(),
      metadata: this.getInitialMetadata(),
      firstSeen: new Date(),
      lastUpdated: new Date()
    };
  }

  private updateMetrics(item: TrendingItem, interaction: any): void {
    const metrics = item.metrics;

    switch (interaction.type) {
      case 'view':
        metrics.views++;
        if (interaction.duration) {
          metrics.timeSpent += interaction.duration;
        }
        break;
      case 'bookmark':
        metrics.bookmarks++;
        break;
      case 'share':
        metrics.shares++;
        metrics.viralityCoefficient = this.calculateViralityCoefficient(metrics);
        break;
      case 'comment':
        metrics.comments++;
        break;
      case 'favorite':
        metrics.favorites++;
        break;
    }

    // Update derived metrics
    metrics.engagementRate = this.calculateEngagementRate(metrics);
    metrics.clickThroughRate = this.calculateClickThroughRate(metrics);
  }

  private calculateTrendingScore(item: TrendingItem): TrendingScore {
    const weights = this.config.scoreWeights;
    
    const popularity = this.calculatePopularityScore(item.metrics);
    const velocity = this.calculateVelocityScore(item);
    const acceleration = this.calculateAccelerationScore(item);
    const freshness = this.calculateFreshnessScore(item);
    const quality = this.calculateQualityScore(item);
    const diversity = this.calculateDiversityScore(item);
    const sustainability = this.calculateSustainabilityScore(item);

    const overall = (
      popularity * weights.popularity +
      velocity * weights.velocity +
      acceleration * weights.acceleration +
      freshness * weights.freshness +
      quality * weights.quality +
      diversity * weights.diversity +
      sustainability * weights.sustainability
    );

    return {
      overall,
      popularity,
      velocity,
      acceleration,
      freshness,
      quality,
      diversity,
      sustainability
    };
  }

  private calculatePopularityScore(metrics: TrendingMetrics): number {
    // Normalize metrics to 0-1 scale
    const viewsScore = Math.min(metrics.views / 1000, 1);
    const bookmarksScore = Math.min(metrics.bookmarks / 100, 1);
    const sharesScore = Math.min(metrics.shares / 50, 1);
    const engagementScore = Math.min(metrics.engagementRate, 1);

    return (viewsScore * 0.4 + bookmarksScore * 0.3 + sharesScore * 0.2 + engagementScore * 0.1);
  }

  private calculateVelocityScore(item: TrendingItem): number {
    // Calculate rate of change in metrics over time
    const ageInHours = (Date.now() - item.firstSeen.getTime()) / (1000 * 60 * 60);
    if (ageInHours === 0) return 1;

    const viewsPerHour = item.metrics.views / ageInHours;
    const bookmarksPerHour = item.metrics.bookmarks / ageInHours;
    
    // Normalize to expected maximum rates
    const velocityScore = Math.min((viewsPerHour / 50) + (bookmarksPerHour / 5), 1);
    
    return velocityScore;
  }

  private calculateAccelerationScore(item: TrendingItem): number {
    // This would require historical data to calculate properly
    // For now, using a simplified calculation based on recent activity
    const recentActivityScore = this.getRecentActivityScore(item);
    return Math.min(recentActivityScore * 2, 1);
  }

  private calculateFreshnessScore(item: TrendingItem): number {
    const ageInHours = (Date.now() - item.firstSeen.getTime()) / (1000 * 60 * 60);
    
    // Freshness decreases exponentially with age
    return Math.exp(-ageInHours * this.config.decayFactor);
  }

  private calculateQualityScore(item: TrendingItem): number {
    // Quality based on engagement metrics
    const engagementQuality = item.metrics.engagementRate;
    const viralityQuality = Math.min(item.metrics.viralityCoefficient / 3, 1);
    const timeSpentQuality = Math.min(item.metrics.timeSpent / (item.metrics.views * 60), 1); // Average time per view
    
    return (engagementQuality * 0.5 + viralityQuality * 0.3 + timeSpentQuality * 0.2);
  }

  private calculateDiversityScore(item: TrendingItem): number {
    // Diversity based on user variety (simplified)
    const uniqueUsersRatio = item.metrics.uniqueUsers / Math.max(item.metrics.views, 1);
    return Math.min(uniqueUsersRatio * 2, 1);
  }

  private calculateSustainabilityScore(item: TrendingItem): number {
    const ageInHours = (Date.now() - item.firstSeen.getTime()) / (1000 * 60 * 60);
    
    // Items that maintain engagement over time score higher
    if (ageInHours < 1) return 0.5; // Too early to tell
    
    const sustainabilityFactor = Math.min(ageInHours / 24, 1); // Up to 24 hours
    const recentActivity = this.getRecentActivityScore(item);
    
    return sustainabilityFactor * recentActivity;
  }

  private getRecentActivityScore(item: TrendingItem): number {
    const lastHourCutoff = new Date(Date.now() - 60 * 60 * 1000);
    
    // This would require tracking interactions by time
    // For now, using a simplified calculation
    const timeSinceLastUpdate = Date.now() - item.lastUpdated.getTime();
    const recentnessScore = Math.max(0, 1 - (timeSinceLastUpdate / (60 * 60 * 1000))); // 1 hour decay
    
    return recentnessScore;
  }

  private calculateViralityCoefficient(metrics: TrendingMetrics): number {
    if (metrics.views === 0) return 0;
    
    // Virality = (shares + comments) / views
    return (metrics.shares + metrics.comments) / metrics.views;
  }

  private calculateEngagementRate(metrics: TrendingMetrics): number {
    if (metrics.views === 0) return 0;
    
    // Engagement = (bookmarks + shares + comments + favorites) / views
    return (metrics.bookmarks + metrics.shares + metrics.comments + metrics.favorites) / metrics.views;
  }

  private calculateClickThroughRate(metrics: TrendingMetrics): number {
    // This would require impression data
    // For now, using a simplified calculation
    return Math.min(metrics.views / 100, 1);
  }

  private updateTimeWindowData(item: TrendingItem, interaction: any): void {
    this.config.timeWindows.forEach(window => {
      const windowKey = `${item.id}:${window}`;
      
      if (!this.timeWindowData.has(window)) {
        this.timeWindowData.set(window, new Map());
      }
      
      const windowData = this.timeWindowData.get(window)!;
      
      if (!windowData.has(windowKey)) {
        windowData.set(windowKey, this.createTimeWindow(window));
      }
      
      const timeWindow = windowData.get(windowKey)!;
      this.updateTimeWindowMetrics(timeWindow, interaction);
    });
  }

  private updateCategoryData(item: TrendingItem): void {
    let categoryData = this.trendingCategories.get(item.category);
    
    if (!categoryData) {
      categoryData = {
        name: item.category,
        items: [],
        totalItems: 0,
        averageScore: 0,
        topTags: [],
        growthRate: 0,
        lastUpdated: new Date()
      };
      this.trendingCategories.set(item.category, categoryData);
    }

    // Update or add item to category
    const existingIndex = categoryData.items.findIndex(i => i.id === item.id);
    if (existingIndex >= 0) {
      categoryData.items[existingIndex] = item;
    } else {
      categoryData.items.push(item);
    }

    // Update category metrics
    categoryData.totalItems = categoryData.items.length;
    categoryData.averageScore = categoryData.items.reduce((sum, i) => sum + i.score.overall, 0) / categoryData.totalItems;
    categoryData.lastUpdated = new Date();

    // Update top tags
    this.updateCategoryTopTags(categoryData);
  }

  private updateCategoryTopTags(categoryData: TrendingCategory): void {
    const tagFrequency = new Map<string, number>();
    
    categoryData.items.forEach(item => {
      item.tags.forEach(tag => {
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
      });
    });

    categoryData.topTags = Array.from(tagFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  }

  private meetsMinimumThreshold(item: TrendingItem): boolean {
    const threshold = this.config.minMetricsThreshold;
    
    return (
      item.metrics.views >= threshold.views &&
      item.metrics.bookmarks >= threshold.bookmarks &&
      item.metrics.uniqueUsers >= threshold.uniqueUsers
    );
  }

  private hasRecentActivity(item: TrendingItem, timeWindow: string): boolean {
    const cutoffTime = this.getTimeWindowCutoff(timeWindow);
    return item.lastUpdated >= cutoffTime;
  }

  private getTimeWindowCutoff(timeWindow: string): Date {
    const now = Date.now();
    
    switch (timeWindow) {
      case 'hour':
        return new Date(now - 60 * 60 * 1000);
      case 'day':
        return new Date(now - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now - 24 * 60 * 60 * 1000);
    }
  }

  private createTimeWindow(period: string): TrendingTimeWindow {
    const now = new Date();
    let startTime: Date;
    
    switch (period) {
      case 'hour':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    return {
      period: period as any,
      startTime,
      endTime: now,
      metrics: this.getInitialMetrics(),
      rank: 0,
      percentileRank: 0
    };
  }

  private updateTimeWindowMetrics(timeWindow: TrendingTimeWindow, interaction: any): void {
    // Update time window metrics based on interaction
    switch (interaction.type) {
      case 'view':
        timeWindow.metrics.views++;
        break;
      case 'bookmark':
        timeWindow.metrics.bookmarks++;
        break;
      case 'share':
        timeWindow.metrics.shares++;
        break;
      case 'comment':
        timeWindow.metrics.comments++;
        break;
      case 'favorite':
        timeWindow.metrics.favorites++;
        break;
    }
  }

  private startPeriodicUpdates(): void {
    this.updateInterval = setInterval(() => {
      this.performPeriodicMaintenance();
    }, this.config.updateFrequency * 60 * 1000);
  }

  private performPeriodicMaintenance(): void {
    // Clean up old items
    this.cleanupOldItems();
    
    // Update analytics
    this.updateAnalytics();
    
    // Log statistics
    logger.info('Trending discovery maintenance completed', {
      totalItems: this.trendingItems.size,
      categories: this.trendingCategories.size,
      analytics: this.analytics
    });
  }

  private cleanupOldItems(): void {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    for (const [itemId, item] of this.trendingItems) {
      if (item.lastUpdated < monthAgo) {
        this.trendingItems.delete(itemId);
      }
    }
  }

  private updateAnalytics(): void {
    this.analytics = {
      totalTrendingItems: this.trendingItems.size,
      categoriesCount: this.trendingCategories.size,
      averageLifespan: this.calculateAverageLifespan(),
      topCategories: this.getTopCategories(),
      topTags: this.getTopTags(),
      peakHours: this.calculatePeakHours(),
      geographicDistribution: {},
      contentTypeDistribution: this.getContentTypeDistribution(),
      qualityDistribution: this.getQualityDistribution()
    };
  }

  private calculateAverageLifespan(): number {
    if (this.trendingItems.size === 0) return 0;
    
    const totalLifespan = Array.from(this.trendingItems.values())
      .reduce((sum, item) => {
        const lifespan = (item.lastUpdated.getTime() - item.firstSeen.getTime()) / (1000 * 60 * 60);
        return sum + lifespan;
      }, 0);
    
    return totalLifespan / this.trendingItems.size;
  }

  private getTopCategories(): Array<{ category: string; count: number; growth: number }> {
    return Array.from(this.trendingCategories.values())
      .map(cat => ({
        category: cat.name,
        count: cat.totalItems,
        growth: cat.growthRate
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getTopTags(): Array<{ tag: string; frequency: number; trend: number }> {
    const tagFrequency = new Map<string, number>();
    
    for (const item of this.trendingItems.values()) {
      item.tags.forEach(tag => {
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
      });
    }

    return Array.from(tagFrequency.entries())
      .map(([tag, frequency]) => ({
        tag,
        frequency,
        trend: frequency // Simplified trend calculation
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20);
  }

  private calculatePeakHours(): number[] {
    // This would require historical data
    // For now, returning mock peak hours
    return [9, 10, 11, 14, 15, 16, 20, 21];
  }

  private getContentTypeDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const item of this.trendingItems.values()) {
      const type = item.metadata.contentType;
      distribution[type] = (distribution[type] || 0) + 1;
    }
    
    return distribution;
  }

  private getQualityDistribution(): { high: number; medium: number; low: number } {
    let high = 0, medium = 0, low = 0;
    
    for (const item of this.trendingItems.values()) {
      if (item.score.quality > 0.8) high++;
      else if (item.score.quality > 0.5) medium++;
      else low++;
    }
    
    return { high, medium, low };
  }

  private getInitialMetrics(): TrendingMetrics {
    return {
      views: 0,
      bookmarks: 0,
      shares: 0,
      comments: 0,
      favorites: 0,
      uniqueUsers: 0,
      timeSpent: 0,
      clickThroughRate: 0,
      engagementRate: 0,
      viralityCoefficient: 0
    };
  }

  private getInitialScore(): TrendingScore {
    return {
      overall: 0,
      popularity: 0,
      velocity: 0,
      acceleration: 0,
      freshness: 1,
      quality: 0.5,
      diversity: 0,
      sustainability: 0
    };
  }

  private getInitialMetadata(): TrendingMetadata {
    return {
      source: 'unknown',
      domain: 'unknown',
      contentType: 'article',
      language: 'en',
      readingTime: 5,
      topicClusters: [],
      geographicReach: [],
      deviceTypes: []
    };
  }

  private initializeAnalytics(): TrendingAnalytics {
    return {
      totalTrendingItems: 0,
      categoriesCount: 0,
      averageLifespan: 0,
      topCategories: [],
      topTags: [],
      peakHours: [],
      geographicDistribution: {},
      contentTypeDistribution: {},
      qualityDistribution: { high: 0, medium: 0, low: 0 }
    };
  }

  // Public utility methods
  getAnalytics(): TrendingAnalytics {
    return { ...this.analytics };
  }

  getConfig(): TrendingDiscoveryConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<TrendingDiscoveryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart periodic updates if frequency changed
    if (newConfig.updateFrequency && this.updateInterval) {
      clearInterval(this.updateInterval);
      this.startPeriodicUpdates();
    }
    
    logger.info('Trending discovery config updated', newConfig);
  }

  getTrendingItem(itemId: string): TrendingItem | undefined {
    return this.trendingItems.get(itemId);
  }

  getAllCategories(): TrendingCategory[] {
    return Array.from(this.trendingCategories.values());
  }

  getStats(): {
    totalItems: number;
    totalCategories: number;
    totalTimeWindows: number;
    cacheSize: number;
  } {
    const totalTimeWindows = Array.from(this.timeWindowData.values())
      .reduce((sum, windowMap) => sum + windowMap.size, 0);

    return {
      totalItems: this.trendingItems.size,
      totalCategories: this.trendingCategories.size,
      totalTimeWindows,
      cacheSize: 0 // No explicit cache in this implementation
    };
  }

  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

// Export singleton instance
export const trendingDiscovery = new TrendingDiscovery();  