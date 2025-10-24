import { appLogger } from '../../lib/logger';
import { Recommendation } from './recommendation-engine';
import { performance } from 'perf_hooks';

const logger = appLogger;

export interface RecommendationPerformanceMetrics {
  recommendationId: string;
  userId: string;
  type: 'content-based' | 'collaborative' | 'trending' | 'hybrid';
  metrics: {
    presented: boolean;
    viewed: boolean;
    clicked: boolean;
    bookmarked: boolean;
    shared: boolean;
    rated?: number; // 1-5 if user provides explicit rating
    timeToClick?: number; // milliseconds
    timeSpent?: number; // milliseconds on recommended content
    position: number; // position in recommendation list
  };
  context: {
    page: string;
    device: string;
    timeOfDay: number;
    dayOfWeek: number;
    sessionDuration: number;
  };
  timestamp: Date;
  updatedAt: Date;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  config: Record<string, any>;
  trafficAllocation: number; // 0-1
  isActive: boolean;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

export interface ABTestExperiment {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  variants: ABTestVariant[];
  metrics: string[]; // metrics to track
  targetSampleSize: number;
  currentSampleSize: number;
  confidenceLevel: number; // 0.95, 0.99, etc.
  status: 'draft' | 'running' | 'completed' | 'paused';
  results?: ABTestResults;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

export interface ABTestResults {
  winningVariant?: string;
  statisticalSignificance: boolean;
  confidenceLevel: number;
  pValue: number;
  effectSize: number;
  variantPerformance: Record<string, {
    sampleSize: number;
    conversionRate: number;
    averageRating: number;
    clickThroughRate: number;
    engagementRate: number;
    confidenceInterval: [number, number];
  }>;
  recommendations: string[];
  generatedAt: Date;
}

export interface PerformanceReport {
  period: {
    start: Date;
    end: Date;
  };
  overall: {
    totalRecommendations: number;
    totalUsers: number;
    averageClickThroughRate: number;
    averageConversionRate: number;
    averageRating: number;
    averageTimeToClick: number;
    averageTimeSpent: number;
  };
  byType: Record<string, {
    count: number;
    clickThroughRate: number;
    conversionRate: number;
    averageRating: number;
    averagePosition: number;
  }>;
  byContext: {
    byPage: Record<string, any>;
    byDevice: Record<string, any>;
    byTimeOfDay: Record<string, any>;
    byDayOfWeek: Record<string, any>;
  };
  trends: {
    dailyMetrics: Array<{
      date: string;
      clickThroughRate: number;
      conversionRate: number;
      averageRating: number;
    }>;
    weeklyGrowth: number;
    monthlyGrowth: number;
  };
  topPerformers: {
    recommendations: Array<{
      id: string;
      type: string;
      score: number;
      clickThroughRate: number;
      conversionRate: number;
    }>;
    categories: Array<{
      category: string;
      performance: number;
    }>;
  };
  lowPerformers: {
    recommendations: Array<{
      id: string;
      type: string;
      issues: string[];
      suggestions: string[];
    }>;
  };
}

export interface OptimizationSuggestion {
  id: string;
  type: 'algorithm' | 'configuration' | 'content' | 'presentation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: number; // 0-1
  implementationEffort: 'low' | 'medium' | 'high';
  metrics: string[];
  evidence: {
    dataPoints: number;
    confidence: number;
    supportingMetrics: Record<string, number>;
  };
  recommendations: string[];
  createdAt: Date;
}

export interface RecommendationFeedback {
  recommendationId: string;
  userId: string;
  feedbackType: 'explicit' | 'implicit';
  rating?: number; // 1-5 for explicit feedback
  sentiment?: 'positive' | 'negative' | 'neutral';
  categories: string[]; // relevant, accurate, diverse, novel, etc.
  comments?: string;
  timestamp: Date;
}

export class RecommendationPerformanceTracker {
  private metrics: Map<string, RecommendationPerformanceMetrics> = new Map();
  private experiments: Map<string, ABTestExperiment> = new Map();
  private feedback: Map<string, RecommendationFeedback[]> = new Map();
  private optimizationSuggestions: OptimizationSuggestion[] = [];
  private reportCache: Map<string, PerformanceReport> = new Map();

  constructor() {
    this.startPeriodicAnalysis();
  }

  async trackRecommendationPresented(
    recommendationId: string,
    userId: string,
    recommendation: Recommendation,
    context: {
      page: string;
      device: string;
      position: number;
      sessionDuration: number;
    }
  ): Promise<void> {
    try {
      const now = new Date();
      
      const metrics: RecommendationPerformanceMetrics = {
        recommendationId,
        userId,
        type: recommendation.type,
        metrics: {
          presented: true,
          viewed: false,
          clicked: false,
          bookmarked: false,
          shared: false,
          position: context.position
        },
        context: {
          page: context.page,
          device: context.device,
          timeOfDay: now.getHours(),
          dayOfWeek: now.getDay(),
          sessionDuration: context.sessionDuration
        },
        timestamp: now,
        updatedAt: now
      };

      this.metrics.set(recommendationId, metrics);

      logger.debug('Recommendation presented', {
        recommendationId,
        userId,
        type: recommendation.type,
        position: context.position
      });

    } catch (error) {
      logger.error('Failed to track recommendation presentation', error as Error, {
        recommendationId,
        userId
      });
    }
  }

  async trackRecommendationInteraction(
    recommendationId: string,
    interaction: {
      type: 'viewed' | 'clicked' | 'bookmarked' | 'shared';
      timestamp?: Date;
      duration?: number;
    }
  ): Promise<void> {
    try {
      const metrics = this.metrics.get(recommendationId);
      
      if (!metrics) {
        logger.warn('Attempted to track interaction for unknown recommendation', {
          recommendationId,
          interaction
        });
        return;
      }

      const now = interaction.timestamp || new Date();
      
      switch (interaction.type) {
        case 'viewed':
          metrics.metrics.viewed = true;
          break;
        case 'clicked':
          metrics.metrics.clicked = true;
          metrics.metrics.timeToClick = now.getTime() - metrics.timestamp.getTime();
          break;
        case 'bookmarked':
          metrics.metrics.bookmarked = true;
          break;
        case 'shared':
          metrics.metrics.shared = true;
          break;
      }

      if (interaction.duration) {
        metrics.metrics.timeSpent = interaction.duration;
      }

      metrics.updatedAt = now;

      logger.debug('Recommendation interaction tracked', {
        recommendationId,
        interaction: interaction.type,
        timeToClick: metrics.metrics.timeToClick
      });

    } catch (error) {
      logger.error('Failed to track recommendation interaction', error as Error, {
        recommendationId,
        interaction
      });
    }
  }

  async trackRecommendationRating(
    recommendationId: string,
    userId: string,
    rating: number,
    feedback?: string
  ): Promise<void> {
    try {
      const metrics = this.metrics.get(recommendationId);
      
      if (metrics) {
        metrics.metrics.rated = rating;
        metrics.updatedAt = new Date();
      }

      // Store detailed feedback
      const feedbackEntry: RecommendationFeedback = {
        recommendationId,
        userId,
        feedbackType: 'explicit',
        rating,
        sentiment: rating >= 4 ? 'positive' : rating <= 2 ? 'negative' : 'neutral',
        categories: this.inferFeedbackCategories(rating),
        comments: feedback,
        timestamp: new Date()
      };

      if (!this.feedback.has(recommendationId)) {
        this.feedback.set(recommendationId, []);
      }
      this.feedback.get(recommendationId)!.push(feedbackEntry);

      logger.info('Recommendation rating tracked', {
        recommendationId,
        userId,
        rating,
        sentiment: feedbackEntry.sentiment
      });

    } catch (error) {
      logger.error('Failed to track recommendation rating', error as Error, {
        recommendationId,
        userId,
        rating
      });
    }
  }

  async createABTest(experiment: Omit<ABTestExperiment, 'id' | 'currentSampleSize' | 'createdAt' | 'status'>): Promise<string> {
    try {
      const experimentId = this.generateExperimentId();
      
      const abTest: ABTestExperiment = {
        id: experimentId,
        currentSampleSize: 0,
        status: 'draft',
        createdAt: new Date(),
        ...experiment
      };

      // Validate traffic allocation
      const totalAllocation = abTest.variants.reduce((sum, variant) => sum + variant.trafficAllocation, 0);
      if (Math.abs(totalAllocation - 1.0) > 0.001) {
        throw new Error('Variant traffic allocation must sum to 1.0');
      }

      this.experiments.set(experimentId, abTest);

      logger.info('A/B test experiment created', {
        experimentId,
        name: experiment.name,
        variants: experiment.variants.length
      });

      return experimentId;

    } catch (error) {
      logger.error('Failed to create A/B test experiment', error as Error, { experiment });
      throw error;
    }
  }

  async startABTest(experimentId: string): Promise<void> {
    try {
      const experiment = this.experiments.get(experimentId);
      
      if (!experiment) {
        throw new Error(`Experiment ${experimentId} not found`);
      }

      if (experiment.status !== 'draft') {
        throw new Error(`Cannot start experiment in ${experiment.status} status`);
      }

      experiment.status = 'running';
      experiment.startedAt = new Date();

      logger.info('A/B test experiment started', {
        experimentId,
        name: experiment.name
      });

    } catch (error) {
      logger.error('Failed to start A/B test experiment', error as Error, { experimentId });
      throw error;
    }
  }

  async assignUserToVariant(experimentId: string, userId: string): Promise<string | null> {
    try {
      const experiment = this.experiments.get(experimentId);
      
      if (!experiment || experiment.status !== 'running') {
        return null;
      }

      // Use consistent hashing to assign user to variant
      const hash = this.hashUserId(userId);
      let cumulativeAllocation = 0;
      
      for (const variant of experiment.variants) {
        cumulativeAllocation += variant.trafficAllocation;
        if (hash <= cumulativeAllocation) {
          return variant.id;
        }
      }

      return experiment.variants[experiment.variants.length - 1].id;

    } catch (error) {
      logger.error('Failed to assign user to variant', error as Error, {
        experimentId,
        userId
      });
      return null;
    }
  }

  async analyzeABTestResults(experimentId: string): Promise<ABTestResults | null> {
    try {
      const experiment = this.experiments.get(experimentId);
      
      if (!experiment) {
        throw new Error(`Experiment ${experimentId} not found`);
      }

      // Collect metrics for each variant
      const variantMetrics = new Map<string, Array<RecommendationPerformanceMetrics>>();
      
      for (const metrics of this.metrics.values()) {
        // This would require tracking which variant was used for each recommendation
        // For now, using a simplified approach
        const variantId = experiment.variants[0].id; // Simplified
        
        if (!variantMetrics.has(variantId)) {
          variantMetrics.set(variantId, []);
        }
        variantMetrics.get(variantId)!.push(metrics);
      }

      // Calculate performance for each variant
      const variantPerformance: Record<string, any> = {};
      
      for (const [variantId, metrics] of variantMetrics) {
        const performance = this.calculateVariantPerformance(metrics);
        variantPerformance[variantId] = performance;
      }

      // Determine statistical significance
      const { winningVariant, statisticalSignificance, pValue, effectSize } = 
        this.calculateStatisticalSignificance(variantPerformance);

      const results: ABTestResults = {
        winningVariant,
        statisticalSignificance,
        confidenceLevel: experiment.confidenceLevel,
        pValue,
        effectSize,
        variantPerformance,
        recommendations: this.generateABTestRecommendations(variantPerformance),
        generatedAt: new Date()
      };

      experiment.results = results;

      logger.info('A/B test results analyzed', {
        experimentId,
        winningVariant,
        statisticalSignificance,
        pValue
      });

      return results;

    } catch (error) {
      logger.error('Failed to analyze A/B test results', error as Error, { experimentId });
      return null;
    }
  }

  async generatePerformanceReport(
    startDate: Date,
    endDate: Date,
    filters?: {
      userId?: string;
      type?: string;
      page?: string;
      device?: string;
    }
  ): Promise<PerformanceReport> {
    const startTime = performance.now();

    try {
      logger.info('Generating performance report', {
        startDate,
        endDate,
        filters
      });

      // Filter metrics by date range and filters
      const filteredMetrics = Array.from(this.metrics.values()).filter(metric => {
        if (metric.timestamp < startDate || metric.timestamp > endDate) {
          return false;
        }
        
        if (filters?.userId && metric.userId !== filters.userId) {
          return false;
        }
        
        if (filters?.type && metric.type !== filters.type) {
          return false;
        }
        
        if (filters?.page && metric.context.page !== filters.page) {
          return false;
        }
        
        if (filters?.device && metric.context.device !== filters.device) {
          return false;
        }
        
        return true;
      });

      // Calculate overall metrics
      const overall = this.calculateOverallMetrics(filteredMetrics);
      
      // Calculate metrics by type
      const byType = this.calculateMetricsByType(filteredMetrics);
      
      // Calculate metrics by context
      const byContext = this.calculateMetricsByContext(filteredMetrics);
      
      // Calculate trends
      const trends = this.calculateTrends(filteredMetrics, startDate, endDate);
      
      // Identify top and low performers
      const topPerformers = this.identifyTopPerformers(filteredMetrics);
      const lowPerformers = this.identifyLowPerformers(filteredMetrics);

      const report: PerformanceReport = {
        period: { start: startDate, end: endDate },
        overall,
        byType,
        byContext,
        trends,
        topPerformers,
        lowPerformers
      };

      const duration = performance.now() - startTime;
      logger.info('Performance report generated', {
        duration: Math.round(duration),
        totalMetrics: filteredMetrics.length,
        overallCTR: overall.averageClickThroughRate
      });

      return report;

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Failed to generate performance report', error as Error, {
        startDate,
        endDate,
        filters,
        duration: Math.round(duration)
      });
      throw error;
    }
  }

  async generateOptimizationSuggestions(): Promise<OptimizationSuggestion[]> {
    try {
      logger.info('Generating optimization suggestions');

      const suggestions: OptimizationSuggestion[] = [];
      
      // Analyze recent performance data
      const recentMetrics = Array.from(this.metrics.values())
        .filter(metric => {
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return metric.timestamp >= dayAgo;
        });

      // Algorithm optimization suggestions
      suggestions.push(...this.generateAlgorithmSuggestions(recentMetrics));
      
      // Configuration optimization suggestions
      suggestions.push(...this.generateConfigurationSuggestions(recentMetrics));
      
      // Content optimization suggestions
      suggestions.push(...this.generateContentSuggestions(recentMetrics));
      
      // Presentation optimization suggestions
      suggestions.push(...this.generatePresentationSuggestions(recentMetrics));

      // Sort by priority and expected impact
      suggestions.sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
        
        if (priorityDiff !== 0) return priorityDiff;
        return b.expectedImpact - a.expectedImpact;
      });

      this.optimizationSuggestions = suggestions;

      logger.info('Optimization suggestions generated', {
        totalSuggestions: suggestions.length,
        highPriority: suggestions.filter(s => s.priority === 'high').length
      });

      return suggestions;

    } catch (error) {
      logger.error('Failed to generate optimization suggestions', error as Error);
      return [];
    }
  }

  // Private helper methods
  private calculateOverallMetrics(metrics: RecommendationPerformanceMetrics[]): any {
    if (metrics.length === 0) {
      return {
        totalRecommendations: 0,
        totalUsers: 0,
        averageClickThroughRate: 0,
        averageConversionRate: 0,
        averageRating: 0,
        averageTimeToClick: 0,
        averageTimeSpent: 0
      };
    }

    const uniqueUsers = new Set(metrics.map(m => m.userId)).size;
    const clickedCount = metrics.filter(m => m.metrics.clicked).length;
    const bookmarkedCount = metrics.filter(m => m.metrics.bookmarked).length;
    const ratedMetrics = metrics.filter(m => m.metrics.rated !== undefined);
    const clickTimes = metrics.filter(m => m.metrics.timeToClick).map(m => m.metrics.timeToClick!);
    const timeSpent = metrics.filter(m => m.metrics.timeSpent).map(m => m.metrics.timeSpent!);

    return {
      totalRecommendations: metrics.length,
      totalUsers: uniqueUsers,
      averageClickThroughRate: clickedCount / metrics.length,
      averageConversionRate: bookmarkedCount / metrics.length,
      averageRating: ratedMetrics.length > 0 
        ? ratedMetrics.reduce((sum, m) => sum + m.metrics.rated!, 0) / ratedMetrics.length 
        : 0,
      averageTimeToClick: clickTimes.length > 0 
        ? clickTimes.reduce((sum, time) => sum + time, 0) / clickTimes.length 
        : 0,
      averageTimeSpent: timeSpent.length > 0 
        ? timeSpent.reduce((sum, time) => sum + time, 0) / timeSpent.length 
        : 0
    };
  }

  private calculateMetricsByType(metrics: RecommendationPerformanceMetrics[]): Record<string, any> {
    const byType: Record<string, any> = {};
    
    const typeGroups = this.groupBy(metrics, m => m.type);
    
    for (const [type, typeMetrics] of typeGroups) {
      const clicked = typeMetrics.filter(m => m.metrics.clicked).length;
      const bookmarked = typeMetrics.filter(m => m.metrics.bookmarked).length;
      const rated = typeMetrics.filter(m => m.metrics.rated !== undefined);
      const positions = typeMetrics.map(m => m.metrics.position);

      byType[type] = {
        count: typeMetrics.length,
        clickThroughRate: clicked / typeMetrics.length,
        conversionRate: bookmarked / typeMetrics.length,
        averageRating: rated.length > 0 
          ? rated.reduce((sum, m) => sum + m.metrics.rated!, 0) / rated.length 
          : 0,
        averagePosition: positions.reduce((sum, pos) => sum + pos, 0) / positions.length
      };
    }
    
    return byType;
  }

  private calculateMetricsByContext(metrics: RecommendationPerformanceMetrics[]): any {
    return {
      byPage: this.calculateContextMetrics(metrics, m => m.context.page),
      byDevice: this.calculateContextMetrics(metrics, m => m.context.device),
      byTimeOfDay: this.calculateContextMetrics(metrics, m => m.context.timeOfDay.toString()),
      byDayOfWeek: this.calculateContextMetrics(metrics, m => m.context.dayOfWeek.toString())
    };
  }

  private calculateContextMetrics(metrics: RecommendationPerformanceMetrics[], keyFn: (m: RecommendationPerformanceMetrics) => string): Record<string, any> {
    const contextGroups = this.groupBy(metrics, keyFn);
    const result: Record<string, any> = {};
    
    for (const [context, contextMetrics] of contextGroups) {
      const clicked = contextMetrics.filter(m => m.metrics.clicked).length;
      const bookmarked = contextMetrics.filter(m => m.metrics.bookmarked).length;
      
      result[context] = {
        count: contextMetrics.length,
        clickThroughRate: clicked / contextMetrics.length,
        conversionRate: bookmarked / contextMetrics.length
      };
    }
    
    return result;
  }

  private calculateTrends(metrics: RecommendationPerformanceMetrics[], startDate: Date, endDate: Date): any {
    // Group metrics by day
    const dailyGroups = this.groupBy(metrics, m => m.timestamp.toDateString());
    
    const dailyMetrics = Array.from(dailyGroups.entries()).map(([date, dayMetrics]) => {
      const clicked = dayMetrics.filter(m => m.metrics.clicked).length;
      const bookmarked = dayMetrics.filter(m => m.metrics.bookmarked).length;
      const rated = dayMetrics.filter(m => m.metrics.rated !== undefined);
      
      return {
        date,
        clickThroughRate: clicked / dayMetrics.length,
        conversionRate: bookmarked / dayMetrics.length,
        averageRating: rated.length > 0 
          ? rated.reduce((sum, m) => sum + m.metrics.rated!, 0) / rated.length 
          : 0
      };
    });

    // Calculate growth rates (simplified)
    const weeklyGrowth = this.calculateGrowthRate(dailyMetrics, 7);
    const monthlyGrowth = this.calculateGrowthRate(dailyMetrics, 30);

    return {
      dailyMetrics: dailyMetrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      weeklyGrowth,
      monthlyGrowth
    };
  }

  private identifyTopPerformers(metrics: RecommendationPerformanceMetrics[]): any {
    // Group by recommendation ID and calculate performance
    const recommendationGroups = this.groupBy(metrics, m => m.recommendationId);
    
    const recommendations = Array.from(recommendationGroups.entries()).map(([id, recMetrics]) => {
      const clicked = recMetrics.filter(m => m.metrics.clicked).length;
      const bookmarked = recMetrics.filter(m => m.metrics.bookmarked).length;
      const score = (clicked * 0.3 + bookmarked * 0.7) / recMetrics.length; // Weighted score
      
      return {
        id,
        type: recMetrics[0].type,
        score,
        clickThroughRate: clicked / recMetrics.length,
        conversionRate: bookmarked / recMetrics.length
      };
    }).sort((a, b) => b.score - a.score).slice(0, 10);

    // Calculate category performance
    const categoryGroups = this.groupBy(metrics, m => m.type);
    const categories = Array.from(categoryGroups.entries()).map(([category, catMetrics]) => {
      const clicked = catMetrics.filter(m => m.metrics.clicked).length;
      const bookmarked = catMetrics.filter(m => m.metrics.bookmarked).length;
      const performance = (clicked * 0.3 + bookmarked * 0.7) / catMetrics.length;
      
      return { category, performance };
    }).sort((a, b) => b.performance - a.performance);

    return { recommendations, categories };
  }

  private identifyLowPerformers(metrics: RecommendationPerformanceMetrics[]): any {
    const recommendationGroups = this.groupBy(metrics, m => m.recommendationId);
    
    const lowPerformers = Array.from(recommendationGroups.entries())
      .filter(([id, recMetrics]) => {
        const clicked = recMetrics.filter(m => m.metrics.clicked).length;
        const clickRate = clicked / recMetrics.length;
        return clickRate < 0.05; // Less than 5% click rate
      })
      .map(([id, recMetrics]) => {
        const issues = this.identifyPerformanceIssues(recMetrics);
        const suggestions = this.generateImprovementSuggestions(issues);
        
        return {
          id,
          type: recMetrics[0].type,
          issues,
          suggestions
        };
      })
      .slice(0, 10);

    return { recommendations: lowPerformers };
  }

  private generateAlgorithmSuggestions(metrics: RecommendationPerformanceMetrics[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Analyze type performance
    const typePerformance = this.calculateMetricsByType(metrics);
    const lowPerformingTypes = Object.entries(typePerformance)
      .filter(([type, perf]: [string, any]) => perf.clickThroughRate < 0.1)
      .map(([type]) => type);

    if (lowPerformingTypes.length > 0) {
      suggestions.push({
        id: this.generateSuggestionId(),
        type: 'algorithm',
        priority: 'high',
        title: 'Improve Low-Performing Recommendation Types',
        description: `${lowPerformingTypes.join(', ')} recommendation types are underperforming`,
        expectedImpact: 0.3,
        implementationEffort: 'medium',
        metrics: ['clickThroughRate', 'conversionRate'],
        evidence: {
          dataPoints: metrics.length,
          confidence: 0.8,
          supportingMetrics: typePerformance
        },
        recommendations: [
          'Adjust algorithm weights',
          'Improve content similarity calculations',
          'Enhance user profiling'
        ],
        createdAt: new Date()
      });
    }

    return suggestions;
  }

  private generateConfigurationSuggestions(metrics: RecommendationPerformanceMetrics[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Analyze position performance
    const positionGroups = this.groupBy(metrics, m => m.metrics.position.toString());
    const positionPerformance = new Map<number, number>();
    
    for (const [pos, posMetrics] of positionGroups) {
      const clicked = posMetrics.filter(m => m.metrics.clicked).length;
      const clickRate = clicked / posMetrics.length;
      positionPerformance.set(parseInt(pos), clickRate);
    }

    // Check if lower positions have surprisingly high performance
    const sortedPositions = Array.from(positionPerformance.entries()).sort((a, b) => a[0] - b[0]);
    if (sortedPositions.length > 3) {
      const topPosition = sortedPositions[0][1];
      const lowerPositions = sortedPositions.slice(3);
      const highPerformingLower = lowerPositions.filter(([pos, perf]) => perf > topPosition * 0.8);
      
      if (highPerformingLower.length > 0) {
        suggestions.push({
          id: this.generateSuggestionId(),
          type: 'configuration',
          priority: 'medium',
          title: 'Optimize Recommendation Ranking',
          description: 'Some lower-positioned recommendations are performing better than expected',
          expectedImpact: 0.2,
          implementationEffort: 'low',
          metrics: ['clickThroughRate', 'position'],
          evidence: {
            dataPoints: metrics.length,
            confidence: 0.7,
            supportingMetrics: Object.fromEntries(positionPerformance)
          },
          recommendations: [
            'Review ranking algorithm',
            'Adjust scoring weights',
            'Consider position bias correction'
          ],
          createdAt: new Date()
        });
      }
    }

    return suggestions;
  }

  private generateContentSuggestions(metrics: RecommendationPerformanceMetrics[]): OptimizationSuggestion[] {
    // This would analyze content quality, diversity, etc.
    return [];
  }

  private generatePresentationSuggestions(metrics: RecommendationPerformanceMetrics[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Analyze device performance
    const devicePerformance = this.calculateContextMetrics(metrics, m => m.context.device);
    const mobilePerformance = devicePerformance['mobile'];
    const desktopPerformance = devicePerformance['desktop'];
    
    if (mobilePerformance && desktopPerformance && 
        mobilePerformance.clickThroughRate < desktopPerformance.clickThroughRate * 0.7) {
      suggestions.push({
        id: this.generateSuggestionId(),
        type: 'presentation',
        priority: 'high',
        title: 'Optimize Mobile Presentation',
        description: 'Mobile click-through rates are significantly lower than desktop',
        expectedImpact: 0.25,
        implementationEffort: 'medium',
        metrics: ['clickThroughRate', 'device'],
        evidence: {
          dataPoints: metrics.filter(m => m.context.device === 'mobile').length,
          confidence: 0.8,
          supportingMetrics: devicePerformance
        },
        recommendations: [
          'Improve mobile UI/UX',
          'Optimize for touch interactions',
          'Reduce cognitive load on mobile'
        ],
        createdAt: new Date()
      });
    }

    return suggestions;
  }

  // Utility methods
  private groupBy<T, K>(array: T[], keyFn: (item: T) => K): Map<K, T[]> {
    const groups = new Map<K, T[]>();
    
    for (const item of array) {
      const key = keyFn(item);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    }
    
    return groups;
  }

  private calculateGrowthRate(dailyMetrics: any[], days: number): number {
    if (dailyMetrics.length < days) return 0;
    
    const recent = dailyMetrics.slice(-days);
    const previous = dailyMetrics.slice(-days * 2, -days);
    
    if (previous.length === 0) return 0;
    
    const recentAvg = recent.reduce((sum, day) => sum + day.clickThroughRate, 0) / recent.length;
    const previousAvg = previous.reduce((sum, day) => sum + day.clickThroughRate, 0) / previous.length;
    
    return previousAvg === 0 ? 0 : (recentAvg - previousAvg) / previousAvg;
  }

  private calculateVariantPerformance(metrics: RecommendationPerformanceMetrics[]): any {
    const clicked = metrics.filter(m => m.metrics.clicked).length;
    const bookmarked = metrics.filter(m => m.metrics.bookmarked).length;
    const rated = metrics.filter(m => m.metrics.rated !== undefined);
    
    const conversionRate = bookmarked / metrics.length;
    const clickThroughRate = clicked / metrics.length;
    const averageRating = rated.length > 0 
      ? rated.reduce((sum, m) => sum + m.metrics.rated!, 0) / rated.length 
      : 0;
    const engagementRate = (clicked + bookmarked) / metrics.length;

    return {
      sampleSize: metrics.length,
      conversionRate,
      clickThroughRate,
      averageRating,
      engagementRate,
      confidenceInterval: this.calculateConfidenceInterval(conversionRate, metrics.length)
    };
  }

  private calculateStatisticalSignificance(variantPerformance: Record<string, any>): any {
    // Simplified statistical significance calculation
    const variants = Object.entries(variantPerformance);
    if (variants.length < 2) {
      return {
        winningVariant: variants[0]?.[0],
        statisticalSignificance: false,
        pValue: 1,
        effectSize: 0
      };
    }

    const [controlId, controlPerf] = variants[0];
    const [testId, testPerf] = variants[1];
    
    // Simple z-test for proportions
    const p1 = controlPerf.conversionRate;
    const p2 = testPerf.conversionRate;
    const n1 = controlPerf.sampleSize;
    const n2 = testPerf.sampleSize;
    
    const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2);
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
    const zScore = Math.abs(p2 - p1) / se;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    
    return {
      winningVariant: p2 > p1 ? testId : controlId,
      statisticalSignificance: pValue < 0.05,
      pValue,
      effectSize: Math.abs(p2 - p1)
    };
  }

  private calculateConfidenceInterval(proportion: number, sampleSize: number): [number, number] {
    const z = 1.96; // 95% confidence
    const se = Math.sqrt((proportion * (1 - proportion)) / sampleSize);
    return [proportion - z * se, proportion + z * se];
  }

  private normalCDF(x: number): number {
    // Approximation of normal CDF
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximation of error function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private generateABTestRecommendations(variantPerformance: Record<string, any>): string[] {
    const recommendations: string[] = [];
    
    const variants = Object.entries(variantPerformance);
    if (variants.length >= 2) {
      const [controlId, controlPerf] = variants[0];
      const [testId, testPerf] = variants[1];
      
      if (testPerf.conversionRate > controlPerf.conversionRate) {
        recommendations.push(`Implement variant ${testId} as it shows ${((testPerf.conversionRate - controlPerf.conversionRate) * 100).toFixed(1)}% improvement`);
      } else {
        recommendations.push(`Keep control variant ${controlId} as test variant did not show improvement`);
      }
      
      if (testPerf.sampleSize < 1000) {
        recommendations.push('Consider running the test longer to increase sample size');
      }
    }
    
    return recommendations;
  }

  private inferFeedbackCategories(rating: number): string[] {
    const categories: string[] = [];
    
    if (rating >= 4) {
      categories.push('relevant', 'accurate');
    } else if (rating <= 2) {
      categories.push('irrelevant', 'inaccurate');
    }
    
    return categories;
  }

  private identifyPerformanceIssues(metrics: RecommendationPerformanceMetrics[]): string[] {
    const issues: string[] = [];
    
    const clickRate = metrics.filter(m => m.metrics.clicked).length / metrics.length;
    const avgPosition = metrics.reduce((sum, m) => sum + m.metrics.position, 0) / metrics.length;
    
    if (clickRate < 0.05) {
      issues.push('Very low click-through rate');
    }
    
    if (avgPosition > 5) {
      issues.push('Consistently low ranking position');
    }
    
    return issues;
  }

  private generateImprovementSuggestions(issues: string[]): string[] {
    const suggestions: string[] = [];
    
    if (issues.includes('Very low click-through rate')) {
      suggestions.push('Improve content relevance', 'Enhance presentation');
    }
    
    if (issues.includes('Consistently low ranking position')) {
      suggestions.push('Review ranking algorithm', 'Improve content quality score');
    }
    
    return suggestions;
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  }

  private generateExperimentId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSuggestionId(): string {
    return `sug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startPeriodicAnalysis(): void {
    // Run analysis every hour
    setInterval(() => {
      this.generateOptimizationSuggestions().catch(error => {
        logger.error('Periodic optimization analysis failed', error as Error);
      });
    }, 60 * 60 * 1000);
  }

  // Public utility methods
  getMetrics(recommendationId: string): RecommendationPerformanceMetrics | undefined {
    return this.metrics.get(recommendationId);
  }

  getExperiment(experimentId: string): ABTestExperiment | undefined {
    return this.experiments.get(experimentId);
  }

  getAllExperiments(): ABTestExperiment[] {
    return Array.from(this.experiments.values());
  }

  getOptimizationSuggestions(): OptimizationSuggestion[] {
    return [...this.optimizationSuggestions];
  }

  getFeedback(recommendationId: string): RecommendationFeedback[] {
    return this.feedback.get(recommendationId) || [];
  }

  getStats(): {
    totalMetrics: number;
    totalExperiments: number;
    totalFeedback: number;
    activeSuggestions: number;
  } {
    const totalFeedback = Array.from(this.feedback.values())
      .reduce((sum, feedbackList) => sum + feedbackList.length, 0);

    return {
      totalMetrics: this.metrics.size,
      totalExperiments: this.experiments.size,
      totalFeedback,
      activeSuggestions: this.optimizationSuggestions.length
    };
  }

  clearCache(): void {
    this.reportCache.clear();
    logger.info('Performance tracker cache cleared');
  }
}

// Export singleton instance
export const performanceTracker = new RecommendationPerformanceTracker();  