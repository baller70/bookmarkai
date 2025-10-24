import { NextRequest, NextResponse } from 'next/server';
import { performanceTracker } from '../../../../lib/recommendation/performance-tracker';
import { appLogger } from '../../../../lib/logger';

const logger = appLogger;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const action = searchParams.get('action') || 'report';
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date();
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const page = searchParams.get('page');
    const device = searchParams.get('device');

    logger.info('Performance request', {
      action,
      startDate,
      endDate,
      filters: { userId, type, page, device }
    });

    switch (action) {
      case 'report':
        const filters = {
          ...(userId && { userId }),
          ...(type && { type }),
          ...(page && { page }),
          ...(device && { device })
        };

        const report = await performanceTracker.generatePerformanceReport(
          startDate,
          endDate,
          Object.keys(filters).length > 0 ? filters : undefined
        );

        return NextResponse.json({
          success: true,
          data: {
            report,
            metadata: {
              period: {
                start: startDate.toISOString(),
                end: endDate.toISOString()
              },
              filters,
              generatedAt: new Date().toISOString()
            }
          }
        });

      case 'experiments':
        const experiments = performanceTracker.getAllExperiments();
        
        return NextResponse.json({
          success: true,
          data: {
            experiments,
            metadata: {
              totalExperiments: experiments.length,
              activeExperiments: experiments.filter(exp => exp.status === 'running').length,
              completedExperiments: experiments.filter(exp => exp.status === 'completed').length
            }
          }
        });

      case 'suggestions':
        const suggestions = await performanceTracker.generateOptimizationSuggestions();
        
        return NextResponse.json({
          success: true,
          data: {
            suggestions,
            metadata: {
              totalSuggestions: suggestions.length,
              highPriority: suggestions.filter(s => s.priority === 'high').length,
              mediumPriority: suggestions.filter(s => s.priority === 'medium').length,
              lowPriority: suggestions.filter(s => s.priority === 'low').length
            }
          }
        });

      case 'stats':
        const stats = performanceTracker.getStats();
        
        return NextResponse.json({
          success: true,
          data: {
            stats,
            metadata: {
              generatedAt: new Date().toISOString()
            }
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: {
            message: 'Invalid action',
            details: 'Supported actions: report, experiments, suggestions, stats'
          }
        }, { status: 400 });
    }

  } catch (error) {
    logger.error('Failed to process performance request', error as Error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Failed to process performance request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    logger.info('Performance action request', { action });

    switch (action) {
      case 'createExperiment':
        const { experiment } = body;
        
        if (!experiment || !experiment.name || !experiment.variants) {
          return NextResponse.json({
            success: false,
            error: {
              message: 'Invalid experiment data',
              details: 'name and variants are required'
            }
          }, { status: 400 });
        }

        const experimentId = await performanceTracker.createABTest(experiment);
        
        return NextResponse.json({
          success: true,
          data: {
            experimentId,
            message: 'A/B test experiment created successfully'
          }
        });

      case 'startExperiment':
        const { experimentId: startExpId } = body;
        
        if (!startExpId) {
          return NextResponse.json({
            success: false,
            error: {
              message: 'Missing experimentId',
              details: 'experimentId is required'
            }
          }, { status: 400 });
        }

        await performanceTracker.startABTest(startExpId);
        
        return NextResponse.json({
          success: true,
          data: {
            experimentId: startExpId,
            message: 'A/B test experiment started successfully'
          }
        });

      case 'analyzeExperiment':
        const { experimentId: analyzeExpId } = body;
        
        if (!analyzeExpId) {
          return NextResponse.json({
            success: false,
            error: {
              message: 'Missing experimentId',
              details: 'experimentId is required'
            }
          }, { status: 400 });
        }

        const results = await performanceTracker.analyzeABTestResults(analyzeExpId);
        
        if (!results) {
          return NextResponse.json({
            success: false,
            error: {
              message: 'Failed to analyze experiment',
              details: 'Experiment not found or insufficient data'
            }
          }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: {
            results,
            experimentId: analyzeExpId
          }
        });

      case 'trackFeedback':
        const { recommendationId, userId, feedback } = body;
        
        if (!recommendationId || !userId || !feedback) {
          return NextResponse.json({
            success: false,
            error: {
              message: 'Missing required fields',
              details: 'recommendationId, userId, and feedback are required'
            }
          }, { status: 400 });
        }

        await performanceTracker.trackRecommendationRating(
          recommendationId,
          userId,
          feedback.rating,
          feedback.comments
        );
        
        return NextResponse.json({
          success: true,
          data: {
            message: 'Feedback tracked successfully',
            recommendationId,
            userId
          }
        });

      case 'clearCache':
        performanceTracker.clearCache();
        
        return NextResponse.json({
          success: true,
          data: {
            message: 'Performance tracker cache cleared successfully'
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: {
            message: 'Invalid action',
            details: 'Supported actions: createExperiment, startExperiment, analyzeExperiment, trackFeedback, clearCache'
          }
        }, { status: 400 });
    }

  } catch (error) {
    logger.error('Failed to process performance action', error as Error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Failed to process performance action',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}  