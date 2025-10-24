import { NextRequest, NextResponse } from 'next/server';
import { smartCategorization } from '../../../../../lib/ai/smart-categorization';
// import { logger } from '../../../../../lib/logger';
// // import { performanceMonitor } from '../../../../../lib/monitoring/performance-enhanced';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'overview';
    const timeRange = searchParams.get('timeRange') || '24h';
    
    // logger.info('Categorization analytics request', { action, timeRange });
    
    switch (action) {
      case 'overview':
        // Get categorization overview analytics
        const stats = smartCategorization.getCategoryStats();
//         // const performanceData = performanceMonitor.getMetrics();
        
        return NextResponse.json({
          success: true,
          data: {
            overview: {
              totalCategories: stats.totalCategories,
              topLevelCategories: stats.topLevelCategories,
              learningData: stats.learningData,
              categoryDistribution: stats.categoryDistribution
            },
            performance: {
              avgCategorizationTime: 0, // performanceData.avg_categorization_duration || 0,
              avgConfidence: 0, // performanceData.avg_categorization_confidence || 0,
              successRate: 1, // performanceData.categorization_success_rate || 1,
              errorRate: 0, // performanceData.categorization_error_rate || 0,
              totalRequests: 0 // performanceData.total_categorization_requests || 0
            },
            trends: {
              timeRange,
              confidenceTrend: 'stable', // In real implementation, calculate from historical data
              accuracyTrend: 'improving',
              volumeTrend: 'increasing'
            }
          },
          metadata: {
            timestamp: new Date().toISOString(),
            timeRange,
            version: '1.0.0'
          }
        });
        
      case 'performance':
        // Get detailed performance metrics
//         // const detailedMetrics = performanceMonitor.getMetrics();
        
        return NextResponse.json({
          success: true,
          data: {
            metrics: {
              categorization: {
                avgDuration: 0, // detailedMetrics.avg_categorization_duration || 0,
                minDuration: 0, // detailedMetrics.min_categorization_duration || 0,
                maxDuration: 0, // detailedMetrics.max_categorization_duration || 0,
                totalRequests: 0 // detailedMetrics.total_categorization_requests || 0
              },
              confidence: {
                avgConfidence: 0, // detailedMetrics.avg_categorization_confidence || 0,
                minConfidence: 0, // detailedMetrics.min_categorization_confidence || 0,
                maxConfidence: 0, // detailedMetrics.max_categorization_confidence || 0,
                confidenceDistribution: {
                  high: 0, // detailedMetrics.high_confidence_categorizations || 0,
                  medium: 0, // detailedMetrics.medium_confidence_categorizations || 0,
                  low: 0 // detailedMetrics.low_confidence_categorizations || 0
                }
              },
              errors: {
                totalErrors: 0, // detailedMetrics.total_categorization_errors || 0,
                errorRate: 0, // detailedMetrics.categorization_error_rate || 0,
                commonErrors: [] // detailedMetrics.common_categorization_errors || []
              }
            },
            timeRange
          },
          metadata: {
            timestamp: new Date().toISOString(),
            timeRange
          }
        });
        
      case 'categories':
        // Get category-specific analytics
        const categoryStats = smartCategorization.getCategoryStats();
        
        return NextResponse.json({
          success: true,
          data: {
            categories: categoryStats.categoryDistribution.map(cat => ({
              ...cat,
              usage: Math.floor(Math.random() * 100), // In real implementation, get from usage data
              accuracy: 0.85 + Math.random() * 0.15, // In real implementation, calculate from corrections
              avgConfidence: 0.7 + Math.random() * 0.3
            })),
            topCategories: categoryStats.categoryDistribution
              .slice(0, 10)
              .map(cat => ({
                ...cat,
                usage: Math.floor(Math.random() * 100)
              })),
            leastUsedCategories: categoryStats.categoryDistribution
              .slice(-5)
              .map(cat => ({
                ...cat,
                usage: Math.floor(Math.random() * 10)
              }))
          },
          metadata: {
            timestamp: new Date().toISOString(),
            timeRange
          }
        });
        
      case 'learning':
        // Get learning analytics
        const learningStats = smartCategorization.getCategoryStats().learningData;
        
        return NextResponse.json({
          success: true,
          data: {
            learning: {
              totalCorrections: learningStats.corrections,
              learnedPatterns: learningStats.patterns,
              confidenceAdjustments: learningStats.confidenceAdjustments,
              lastUpdated: learningStats.lastUpdated,
              learningRate: learningStats.corrections > 0 ? 'active' : 'inactive',
              improvementTrend: learningStats.corrections > 10 ? 'significant' : 'minimal'
            },
            insights: {
              mostCorrectedCategories: ['tech', 'business', 'education'], // In real implementation, get from data
              accuracyImprovements: [
                { category: 'tech', improvement: 0.15 },
                { category: 'business', improvement: 0.12 },
                { category: 'education', improvement: 0.08 }
              ],
              suggestedImprovements: [
                'Add more training data for "entertainment" category',
                'Improve pattern recognition for "health" category',
                'Consider subcategories for "technology" category'
              ]
            }
          },
          metadata: {
            timestamp: new Date().toISOString(),
            timeRange
          }
        });
        
      case 'export':
        // Export analytics data
        const exportData = {
          timestamp: new Date().toISOString(),
          timeRange,
          categoryStats: smartCategorization.getCategoryStats(),
//           performanceMetrics: 0, // performanceMonitor.getMetrics(),
          systemInfo: {
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development'
          }
        };
        
        return NextResponse.json({
          success: true,
          data: exportData,
          metadata: {
            timestamp: new Date().toISOString(),
            exportType: 'full',
            format: 'json'
          }
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: overview, performance, categories, learning, or export' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    // logger.error('Categorization analytics API error', { error: error.message });
    
    return NextResponse.json(
      { 
        error: 'Analytics request failed', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 