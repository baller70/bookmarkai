import { NextRequest, NextResponse } from 'next/server';
import { modelMonitoringService } from '@/lib/ai/model-monitoring';
import { appLogger } from '@/lib/logger';

const logger = appLogger;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    logger.info('Model monitoring API request', { action });

    switch (action) {
      case 'track_performance':
        return await handleTrackPerformance(params);
      
      case 'track_feedback':
        return await handleTrackFeedback(params);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: track_performance, track_feedback' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Model monitoring API request failed', error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json(
      { 
        error: 'Request failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Handle tracking performance metrics
async function handleTrackPerformance(params: any) {
  const { 
    model, 
    operation, 
    responseTime, 
    tokenUsage, 
    cost, 
    accuracy, 
    confidence, 
    relevance, 
    userRating, 
    userFeedback, 
    success, 
    error, 
    retryCount, 
    userId, 
    requestId, 
    metadata 
  } = params;

  // Validate required fields
  if (!model || !operation || responseTime === undefined || !tokenUsage || cost === undefined || success === undefined) {
    return NextResponse.json(
      { error: 'model, operation, responseTime, tokenUsage, cost, and success are required' },
      { status: 400 }
    );
  }

  // Validate tokenUsage structure
  if (!tokenUsage.prompt || !tokenUsage.completion || !tokenUsage.total) {
    return NextResponse.json(
      { error: 'tokenUsage must include prompt, completion, and total' },
      { status: 400 }
    );
  }

  try {
    modelMonitoringService.trackPerformance({
      model,
      operation,
      responseTime,
      tokenUsage,
      cost,
      accuracy,
      confidence,
      relevance,
      userRating,
      userFeedback,
      success,
      error,
      retryCount,
      userId,
      requestId,
      metadata,
    });

    logger.info('Performance metrics tracked', {
      model,
      operation,
      responseTime,
      tokens: tokenUsage.total,
      cost,
      success,
      requestId,
    });

    return NextResponse.json({
      success: true,
      message: 'Performance metrics tracked successfully',
    });

  } catch (error) {
    logger.error('Failed to track performance metrics', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

// Handle tracking user feedback
async function handleTrackFeedback(params: any) {
  const { requestId, rating, feedback, accuracy, relevance } = params;

  if (!requestId || rating === undefined) {
    return NextResponse.json(
      { error: 'requestId and rating are required' },
      { status: 400 }
    );
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: 'rating must be between 1 and 5' },
      { status: 400 }
    );
  }

  try {
    modelMonitoringService.trackUserFeedback(
      requestId,
      rating,
      feedback,
      accuracy,
      relevance
    );

    logger.info('User feedback tracked', {
      requestId,
      rating,
      hasFeedback: !!feedback,
      accuracy,
      relevance,
    });

    return NextResponse.json({
      success: true,
      message: 'User feedback tracked successfully',
    });

  } catch (error) {
    logger.error('Failed to track user feedback', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');
    const model = searchParams.get('model');
    const operationType = searchParams.get('operationType');
    const timeRange = searchParams.get('timeRange');

    const timeRangeMs = timeRange ? parseInt(timeRange) : 86400000; // Default 24 hours

    switch (operation) {
      case 'health':
        return NextResponse.json({
          success: true,
          service: 'model-monitoring',
          status: 'healthy',
          timestamp: Date.now(),
        });

      case 'accuracy':
        const accuracyMetrics = modelMonitoringService.getAccuracyMetrics(
          model || undefined,
          operationType || undefined,
          timeRangeMs
        );

        return NextResponse.json({
          success: true,
          data: accuracyMetrics,
          timeRange: timeRangeMs,
        });

      case 'optimization':
        const suggestions = modelMonitoringService.getOptimizationSuggestions(timeRangeMs);

        return NextResponse.json({
          success: true,
          data: suggestions,
          timeRange: timeRangeMs,
        });

      case 'analytics':
        const analytics = modelMonitoringService.getUsageAnalytics(timeRangeMs);

        return NextResponse.json({
          success: true,
          data: analytics,
        });

      case 'export':
        const metrics = modelMonitoringService.exportMetrics(timeRangeMs);

        // Remove sensitive information
        const sanitizedMetrics = metrics.map(metric => ({
          model: metric.model,
          operation: metric.operation,
          timestamp: metric.timestamp,
          responseTime: metric.responseTime,
          tokenUsage: metric.tokenUsage,
          cost: metric.cost,
          accuracy: metric.accuracy,
          confidence: metric.confidence,
          relevance: metric.relevance,
          userRating: metric.userRating,
          success: metric.success,
          error: metric.error,
          retryCount: metric.retryCount,
          // Exclude userId, requestId, userFeedback, metadata for privacy
        }));

        return NextResponse.json({
          success: true,
          data: sanitizedMetrics,
          totalCount: sanitizedMetrics.length,
          timeRange: timeRangeMs,
        });

      case 'sync':
        modelMonitoringService.syncWithOpenAIMetrics();

        return NextResponse.json({
          success: true,
          message: 'Synced with OpenAI metrics',
          timestamp: Date.now(),
        });

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Supported operations: health, accuracy, optimization, analytics, export, sync' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Model monitoring GET request failed', error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json(
      { error: 'Request failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const olderThan = searchParams.get('olderThan');

    if (action === 'clear_old') {
      const olderThanMs = olderThan ? parseInt(olderThan) : 604800000; // Default 7 days
      
      modelMonitoringService.clearOldMetrics(olderThanMs);

      logger.info('Cleared old metrics', { olderThanMs });

      return NextResponse.json({
        success: true,
        message: `Cleared metrics older than ${olderThanMs}ms`,
        olderThan: olderThanMs,
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Supported actions: clear_old' },
        { status: 400 }
      );
    }

  } catch (error) {
    logger.error('Model monitoring DELETE request failed', error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json(
      { error: 'Delete operation failed' },
      { status: 500 }
    );
  }
}  