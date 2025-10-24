import { appLogger } from '../logger';
import { openaiMetrics, OpenAIUsage } from './openai-client';

// Create logger for model monitoring
const logger = appLogger;

// Model performance interfaces
export interface ModelPerformanceMetrics {
  model: string;
  operation: string;
  timestamp: number;
  
  // Performance metrics
  responseTime: number;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost: number;
  
  // Quality metrics
  accuracy?: number;
  confidence?: number;
  relevance?: number;
  
  // User feedback
  userRating?: number; // 1-5 scale
  userFeedback?: string;
  
  // Error information
  success: boolean;
  error?: string;
  retryCount?: number;
  
  // Context information
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export interface ModelAccuracyMetrics {
  model: string;
  operation: string;
  totalRequests: number;
  successfulRequests: number;
  successRate: number;
  averageAccuracy: number;
  averageConfidence: number;
  averageUserRating: number;
  commonErrors: Array<{ error: string; count: number; percentage: number }>;
  timestamp: number;
}

export interface ModelOptimizationSuggestion {
  model: string;
  operation: string;
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion: string;
  expectedImprovement: string;
  implementationEffort: 'low' | 'medium' | 'high';
  priority: number;
  timestamp: number;
}

export interface ModelUsageAnalytics {
  timeRange: {
    start: number;
    end: number;
  };
  totalRequests: number;
  totalCost: number;
  totalTokens: number;
  averageResponseTime: number;
  successRate: number;
  
  // Model breakdown
  modelUsage: Record<string, {
    requests: number;
    cost: number;
    tokens: number;
    averageResponseTime: number;
    successRate: number;
  }>;
  
  // Operation breakdown
  operationUsage: Record<string, {
    requests: number;
    cost: number;
    tokens: number;
    averageResponseTime: number;
    successRate: number;
  }>;
  
  // Trends
  hourlyUsage: Array<{
    hour: number;
    requests: number;
    cost: number;
    averageResponseTime: number;
  }>;
  
  // Quality metrics
  qualityMetrics: {
    averageAccuracy: number;
    averageConfidence: number;
    averageUserRating: number;
    totalFeedback: number;
  };
}

// Model performance monitoring service
export class ModelMonitoringService {
  private metrics: ModelPerformanceMetrics[] = [];
  private readonly MAX_METRICS_HISTORY = 10000;
  private readonly ACCURACY_THRESHOLD = 0.8;
  private readonly RESPONSE_TIME_THRESHOLD = 5000; // 5 seconds
  private readonly COST_THRESHOLD = 1.0; // $1 per request

  // Track model performance
  trackPerformance(metrics: Omit<ModelPerformanceMetrics, 'timestamp'>): void {
    const performanceMetrics: ModelPerformanceMetrics = {
      ...metrics,
      timestamp: Date.now(),
    };

    this.metrics.push(performanceMetrics);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS_HISTORY) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS_HISTORY);
    }

    // Log performance
    logger.info('Model performance tracked', {
      model: metrics.model,
      operation: metrics.operation,
      responseTime: metrics.responseTime,
      tokens: metrics.tokenUsage.total,
      cost: metrics.cost,
      success: metrics.success,
      accuracy: metrics.accuracy,
      userRating: metrics.userRating,
    });

    // Check for performance issues
    this.checkPerformanceAlerts(performanceMetrics);
  }

  // Track user feedback
  trackUserFeedback(
    requestId: string,
    rating: number,
    feedback?: string,
    accuracy?: number,
    relevance?: number
  ): void {
    // Find the corresponding metrics entry
    const metricsIndex = this.metrics.findIndex(m => m.requestId === requestId);
    
    if (metricsIndex !== -1) {
      this.metrics[metricsIndex] = {
        ...this.metrics[metricsIndex],
        userRating: rating,
        userFeedback: feedback,
        accuracy: accuracy || this.metrics[metricsIndex].accuracy,
        relevance: relevance || this.metrics[metricsIndex].relevance,
      };

      logger.info('User feedback recorded', {
        requestId,
        rating,
        accuracy,
        relevance,
        feedback: feedback ? 'provided' : 'none',
      });
    } else {
      logger.warn('No metrics found for request ID', { requestId });
    }
  }

  // Get model accuracy metrics
  getAccuracyMetrics(
    model?: string,
    operation?: string,
    timeRange: number = 86400000 // 24 hours
  ): ModelAccuracyMetrics[] {
    const now = Date.now();
    const filteredMetrics = this.metrics.filter(m => {
      const withinTimeRange = now - m.timestamp < timeRange;
      const matchesModel = !model || m.model === model;
      const matchesOperation = !operation || m.operation === operation;
      return withinTimeRange && matchesModel && matchesOperation;
    });

    // Group by model and operation
    const grouped = new Map<string, ModelPerformanceMetrics[]>();
    
    filteredMetrics.forEach(metric => {
      const key = `${metric.model}:${metric.operation}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(metric);
    });

    // Calculate accuracy metrics for each group
    return Array.from(grouped.entries()).map(([key, metrics]) => {
      const [modelName, operationName] = key.split(':');
      const totalRequests = metrics.length;
      const successfulRequests = metrics.filter(m => m.success).length;
      const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 0;
      
      const accuracyValues = metrics.filter(m => m.accuracy !== undefined).map(m => m.accuracy!);
      const averageAccuracy = accuracyValues.length > 0 
        ? accuracyValues.reduce((sum, acc) => sum + acc, 0) / accuracyValues.length 
        : 0;

      const confidenceValues = metrics.filter(m => m.confidence !== undefined).map(m => m.confidence!);
      const averageConfidence = confidenceValues.length > 0 
        ? confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length 
        : 0;

      const ratingValues = metrics.filter(m => m.userRating !== undefined).map(m => m.userRating!);
      const averageUserRating = ratingValues.length > 0 
        ? ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length 
        : 0;

      // Analyze common errors
      const errorCounts = new Map<string, number>();
      metrics.filter(m => !m.success && m.error).forEach(m => {
        const error = m.error!;
        errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
      });

      const commonErrors = Array.from(errorCounts.entries())
        .map(([error, count]) => ({
          error,
          count,
          percentage: (count / totalRequests) * 100,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        model: modelName,
        operation: operationName,
        totalRequests,
        successfulRequests,
        successRate,
        averageAccuracy,
        averageConfidence,
        averageUserRating,
        commonErrors,
        timestamp: now,
      };
    });
  }

  // Get optimization suggestions
  getOptimizationSuggestions(
    timeRange: number = 86400000 // 24 hours
  ): ModelOptimizationSuggestion[] {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < timeRange);
    const suggestions: ModelOptimizationSuggestion[] = [];

    // Group by model and operation
    const grouped = new Map<string, ModelPerformanceMetrics[]>();
    recentMetrics.forEach(metric => {
      const key = `${metric.model}:${metric.operation}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(metric);
    });

    // Analyze each group for optimization opportunities
    grouped.forEach((metrics, key) => {
      const [model, operation] = key.split(':');
      
      // Check response time issues
      const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
      if (avgResponseTime > this.RESPONSE_TIME_THRESHOLD) {
        suggestions.push({
          model,
          operation,
          issue: 'High response time',
          severity: avgResponseTime > this.RESPONSE_TIME_THRESHOLD * 2 ? 'high' : 'medium',
          suggestion: 'Consider using a faster model variant or optimizing prompts to reduce token usage',
          expectedImprovement: `Reduce response time by 20-40%`,
          implementationEffort: 'medium',
          priority: 8,
          timestamp: now,
        });
      }

      // Check cost issues
      const avgCost = metrics.reduce((sum, m) => sum + m.cost, 0) / metrics.length;
      if (avgCost > this.COST_THRESHOLD) {
        suggestions.push({
          model,
          operation,
          issue: 'High cost per request',
          severity: avgCost > this.COST_THRESHOLD * 2 ? 'high' : 'medium',
          suggestion: 'Consider using a more cost-effective model or reducing prompt length',
          expectedImprovement: `Reduce cost by 30-50%`,
          implementationEffort: 'low',
          priority: 7,
          timestamp: now,
        });
      }

      // Check accuracy issues
      const accuracyValues = metrics.filter(m => m.accuracy !== undefined).map(m => m.accuracy!);
      if (accuracyValues.length > 0) {
        const avgAccuracy = accuracyValues.reduce((sum, acc) => sum + acc, 0) / accuracyValues.length;
        if (avgAccuracy < this.ACCURACY_THRESHOLD) {
          suggestions.push({
            model,
            operation,
            issue: 'Low accuracy',
            severity: avgAccuracy < 0.6 ? 'critical' : 'high',
            suggestion: 'Consider fine-tuning the model or improving prompt engineering',
            expectedImprovement: `Improve accuracy by 15-25%`,
            implementationEffort: 'high',
            priority: 10,
            timestamp: now,
          });
        }
      }

      // Check error rate issues
      const errorRate = metrics.filter(m => !m.success).length / metrics.length;
      if (errorRate > 0.1) { // More than 10% error rate
        suggestions.push({
          model,
          operation,
          issue: 'High error rate',
          severity: errorRate > 0.2 ? 'critical' : 'high',
          suggestion: 'Investigate common error patterns and implement better error handling',
          expectedImprovement: `Reduce error rate by 50-70%`,
          implementationEffort: 'medium',
          priority: 9,
          timestamp: now,
        });
      }

      // Check user satisfaction
      const ratingValues = metrics.filter(m => m.userRating !== undefined).map(m => m.userRating!);
      if (ratingValues.length > 5) { // Only if we have enough ratings
        const avgRating = ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length;
        if (avgRating < 3.5) { // Below average satisfaction
          suggestions.push({
            model,
            operation,
            issue: 'Low user satisfaction',
            severity: avgRating < 2.5 ? 'high' : 'medium',
            suggestion: 'Analyze user feedback to identify specific areas for improvement',
            expectedImprovement: `Improve user satisfaction by 20-30%`,
            implementationEffort: 'medium',
            priority: 6,
            timestamp: now,
          });
        }
      }
    });

    // Sort by priority (highest first)
    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  // Get comprehensive usage analytics
  getUsageAnalytics(timeRange: number = 86400000): ModelUsageAnalytics {
    const now = Date.now();
    const start = now - timeRange;
    const filteredMetrics = this.metrics.filter(m => m.timestamp >= start && m.timestamp <= now);

    if (filteredMetrics.length === 0) {
      return {
        timeRange: { start, end: now },
        totalRequests: 0,
        totalCost: 0,
        totalTokens: 0,
        averageResponseTime: 0,
        successRate: 0,
        modelUsage: {},
        operationUsage: {},
        hourlyUsage: [],
        qualityMetrics: {
          averageAccuracy: 0,
          averageConfidence: 0,
          averageUserRating: 0,
          totalFeedback: 0,
        },
      };
    }

    // Calculate totals
    const totalRequests = filteredMetrics.length;
    const totalCost = filteredMetrics.reduce((sum, m) => sum + m.cost, 0);
    const totalTokens = filteredMetrics.reduce((sum, m) => sum + m.tokenUsage.total, 0);
    const averageResponseTime = filteredMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    const successfulRequests = filteredMetrics.filter(m => m.success).length;
    const successRate = successfulRequests / totalRequests;

    // Model usage breakdown
    const modelUsage: Record<string, any> = {};
    const modelGroups = new Map<string, ModelPerformanceMetrics[]>();
    
    filteredMetrics.forEach(metric => {
      if (!modelGroups.has(metric.model)) {
        modelGroups.set(metric.model, []);
      }
      modelGroups.get(metric.model)!.push(metric);
    });

    modelGroups.forEach((metrics, model) => {
      const requests = metrics.length;
      const cost = metrics.reduce((sum, m) => sum + m.cost, 0);
      const tokens = metrics.reduce((sum, m) => sum + m.tokenUsage.total, 0);
      const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / requests;
      const successful = metrics.filter(m => m.success).length;
      const successRate = successful / requests;

      modelUsage[model] = {
        requests,
        cost,
        tokens,
        averageResponseTime: avgResponseTime,
        successRate,
      };
    });

    // Operation usage breakdown
    const operationUsage: Record<string, any> = {};
    const operationGroups = new Map<string, ModelPerformanceMetrics[]>();
    
    filteredMetrics.forEach(metric => {
      if (!operationGroups.has(metric.operation)) {
        operationGroups.set(metric.operation, []);
      }
      operationGroups.get(metric.operation)!.push(metric);
    });

    operationGroups.forEach((metrics, operation) => {
      const requests = metrics.length;
      const cost = metrics.reduce((sum, m) => sum + m.cost, 0);
      const tokens = metrics.reduce((sum, m) => sum + m.tokenUsage.total, 0);
      const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / requests;
      const successful = metrics.filter(m => m.success).length;
      const successRate = successful / requests;

      operationUsage[operation] = {
        requests,
        cost,
        tokens,
        averageResponseTime: avgResponseTime,
        successRate,
      };
    });

    // Hourly usage trends
    const hourlyUsage: Array<{ hour: number; requests: number; cost: number; averageResponseTime: number }> = [];
    const hours = Math.ceil(timeRange / (1000 * 60 * 60)); // Number of hours in time range
    
    for (let i = 0; i < hours; i++) {
      const hourStart = start + (i * 1000 * 60 * 60);
      const hourEnd = hourStart + (1000 * 60 * 60);
      const hourMetrics = filteredMetrics.filter(m => m.timestamp >= hourStart && m.timestamp < hourEnd);
      
      if (hourMetrics.length > 0) {
        hourlyUsage.push({
          hour: i,
          requests: hourMetrics.length,
          cost: hourMetrics.reduce((sum, m) => sum + m.cost, 0),
          averageResponseTime: hourMetrics.reduce((sum, m) => sum + m.responseTime, 0) / hourMetrics.length,
        });
      } else {
        hourlyUsage.push({
          hour: i,
          requests: 0,
          cost: 0,
          averageResponseTime: 0,
        });
      }
    }

    // Quality metrics
    const accuracyValues = filteredMetrics.filter(m => m.accuracy !== undefined).map(m => m.accuracy!);
    const confidenceValues = filteredMetrics.filter(m => m.confidence !== undefined).map(m => m.confidence!);
    const ratingValues = filteredMetrics.filter(m => m.userRating !== undefined).map(m => m.userRating!);

    const qualityMetrics = {
      averageAccuracy: accuracyValues.length > 0 
        ? accuracyValues.reduce((sum, acc) => sum + acc, 0) / accuracyValues.length 
        : 0,
      averageConfidence: confidenceValues.length > 0 
        ? confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length 
        : 0,
      averageUserRating: ratingValues.length > 0 
        ? ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length 
        : 0,
      totalFeedback: ratingValues.length,
    };

    return {
      timeRange: { start, end: now },
      totalRequests,
      totalCost,
      totalTokens,
      averageResponseTime,
      successRate,
      modelUsage,
      operationUsage,
      hourlyUsage,
      qualityMetrics,
    };
  }

  // Check for performance alerts
  private checkPerformanceAlerts(metrics: ModelPerformanceMetrics): void {
    const alerts: string[] = [];

    // Response time alert
    if (metrics.responseTime > this.RESPONSE_TIME_THRESHOLD) {
      alerts.push(`High response time: ${metrics.responseTime}ms for ${metrics.model} ${metrics.operation}`);
    }

    // Cost alert
    if (metrics.cost > this.COST_THRESHOLD) {
      alerts.push(`High cost: $${metrics.cost.toFixed(4)} for ${metrics.model} ${metrics.operation}`);
    }

    // Accuracy alert
    if (metrics.accuracy !== undefined && metrics.accuracy < this.ACCURACY_THRESHOLD) {
      alerts.push(`Low accuracy: ${(metrics.accuracy * 100).toFixed(1)}% for ${metrics.model} ${metrics.operation}`);
    }

    // Error alert
    if (!metrics.success) {
      alerts.push(`Request failed: ${metrics.error || 'Unknown error'} for ${metrics.model} ${metrics.operation}`);
    }

    // Log alerts
    if (alerts.length > 0) {
      logger.warn('Performance alerts detected', {
        model: metrics.model,
        operation: metrics.operation,
        alerts,
        requestId: metrics.requestId,
      });
    }
  }

  // Export metrics data
  exportMetrics(timeRange?: number): ModelPerformanceMetrics[] {
    if (!timeRange) {
      return [...this.metrics];
    }

    const now = Date.now();
    return this.metrics.filter(m => now - m.timestamp < timeRange);
  }

  // Clear old metrics
  clearOldMetrics(olderThan: number = 604800000): void { // Default 7 days
    const cutoff = Date.now() - olderThan;
    const originalLength = this.metrics.length;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    
    logger.info('Cleared old metrics', {
      originalCount: originalLength,
      remainingCount: this.metrics.length,
      clearedCount: originalLength - this.metrics.length,
    });
  }

  // Integrate with OpenAI metrics
  syncWithOpenAIMetrics(): void {
    const openaiStats = openaiMetrics.getUsageStats();
    const openaiErrors = openaiMetrics.getRecentErrors();

    logger.info('Synced with OpenAI metrics', {
      totalRequests: openaiStats.totalRequests,
      totalTokens: openaiStats.totalTokens,
      totalCost: openaiStats.totalCost,
      successRate: openaiStats.successRate,
      recentErrors: openaiErrors.length,
    });
  }
}

// Export singleton instance
export const modelMonitoringService = new ModelMonitoringService();

// Helper function to track model performance from OpenAI usage
export function trackModelPerformanceFromUsage(
  usage: OpenAIUsage,
  additionalMetrics?: {
    accuracy?: number;
    confidence?: number;
    relevance?: number;
    userRating?: number;
    userFeedback?: string;
    requestId?: string;
    userId?: string;
    metadata?: Record<string, any>;
  }
): void {
  modelMonitoringService.trackPerformance({
    model: usage.model,
    operation: usage.operation,
    responseTime: usage.duration,
    tokenUsage: {
      prompt: usage.prompt_tokens,
      completion: usage.completion_tokens,
      total: usage.total_tokens,
    },
    cost: usage.cost_estimate,
    success: usage.success,
    error: usage.error,
    ...additionalMetrics,
  });
}

// Export types
export type {
  ModelPerformanceMetrics as ModelPerformanceMetricsType,
  ModelAccuracyMetrics as ModelAccuracyMetricsType,
  ModelOptimizationSuggestion as ModelOptimizationSuggestionType,
  ModelUsageAnalytics as ModelUsageAnalyticsType,
};     