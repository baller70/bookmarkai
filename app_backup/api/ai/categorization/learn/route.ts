import { NextRequest, NextResponse } from 'next/server';
import { smartCategorization } from '../../../../../lib/ai/smart-categorization';
// import { logger } from '../../../../../lib/logger';
// // import { performanceMonitor } from '../../../../../lib/monitoring/performance-enhanced';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { 
      originalCategory, 
      correctedCategory, 
      content, 
      url, 
      title, 
      description,
      userFeedback,
      confidence 
    } = body;
    
    // Validate required fields
    if (!originalCategory || !correctedCategory) {
      return NextResponse.json(
        { error: 'Original category and corrected category are required' },
        { status: 400 }
      );
    }
    
    if (!content && !url && !title) {
      return NextResponse.json(
        { error: 'At least one of content, url, or title is required for learning' },
        { status: 400 }
      );
    }
    
    // logger.info('Learning request received', { 
    //   originalCategory, 
    //   correctedCategory,
    //   url,
    //   title 
    // });
    
    // Combine content for learning
    const learningContent = [title, description, content].filter(Boolean).join(' ');
    
    // Apply learning from user correction
    smartCategorization.learnFromCorrection(
      originalCategory,
      correctedCategory,
      learningContent,
      url || ''
    );
    
    // Track performance metrics
    const duration = Date.now() - startTime;
//     // performanceMonitor.recordMetric('categorization_learning_duration', duration);
//     // performanceMonitor.recordMetric('categorization_correction', 1);
    
    // logger.info('Learning completed', {
    //   originalCategory,
    //   correctedCategory,
    //   duration
    // });
    
    return NextResponse.json({
      success: true,
      data: {
        learned: true,
        originalCategory,
        correctedCategory,
        improvementApplied: true
      },
      metadata: {
        processingTime: duration,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    // logger.error('Categorization learning API error', { 
    //   error: error.message, 
    //   duration,
    //   stack: error.stack 
    // });
    
//     // performanceMonitor.recordMetric('categorization_learning_error', 1);
    
    return NextResponse.json(
      { 
        error: 'Learning failed', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    switch (action) {
      case 'stats':
        // Get learning statistics
        const stats = smartCategorization.getCategoryStats();
        return NextResponse.json({
          success: true,
          data: {
            learningStats: stats.learningData,
            totalCorrections: stats.learningData.corrections,
            learnedPatterns: stats.learningData.patterns,
            confidenceAdjustments: stats.learningData.confidenceAdjustments,
            lastUpdated: stats.learningData.lastUpdated
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        });
        
      case 'patterns':
        // Get learned patterns (in a real implementation, this would return actual patterns)
        return NextResponse.json({
          success: true,
          data: {
            message: 'Learned patterns are internal to the categorization engine',
            availableActions: ['stats', 'reset'],
            note: 'Use stats action to see learning statistics'
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        });
        
      case 'reset':
        // Reset learning data (in a real implementation, this would clear learned data)
        // logger.info('Learning data reset requested');
        return NextResponse.json({
          success: true,
          data: {
            message: 'Learning data reset (simulated)',
            note: 'In a real implementation, this would clear all learned patterns and corrections'
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: stats, patterns, or reset' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    // logger.error('Categorization learning GET API error', { error: error.message });
    
    return NextResponse.json(
      { 
        error: 'Request failed', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 