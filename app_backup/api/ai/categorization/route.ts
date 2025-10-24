import { NextRequest, NextResponse } from 'next/server';
import { smartCategorization } from '../../../../lib/ai/smart-categorization';
// import { logger } from '../../../../lib/logger';
// // import { performanceMonitor } from '../../../../lib/monitoring/performance-enhanced';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { title, url, content, description, tags } = body;
    
    // Validate required fields
    if (!title || !url) {
      return NextResponse.json(
        { error: 'Title and URL are required' },
        { status: 400 }
      );
    }
    
    // logger.info('Categorization request received', { title, url });
    console.log('Categorization request received', { title, url });
    
    // Perform smart categorization
    const analysis = await smartCategorization.categorizeContent(
      title,
      url,
      content,
      description,
      tags
    );
    
    // Track performance metrics
    const duration = Date.now() - startTime;
//     // performanceMonitor.recordMetric('categorization_api_duration', duration);
//     // performanceMonitor.recordMetric('categorization_api_confidence', analysis.confidence);
    
    console.log('Categorization completed', {
      title,
      primaryCategory: analysis.primaryCategory.category,
      confidence: analysis.confidence,
      duration
    });
    
    return NextResponse.json({
      success: true,
      data: analysis,
      metadata: {
        processingTime: duration,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Categorization API error', { 
      error: error.message, 
      duration,
      stack: error.stack 
    });
    
//     // performanceMonitor.recordMetric('categorization_api_error', 1);
    
    return NextResponse.json(
      { 
        error: 'Categorization failed', 
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
      case 'hierarchy':
        // Get category hierarchy
        const hierarchy = smartCategorization.getCategoryHierarchyTree();
        return NextResponse.json({
          success: true,
          data: hierarchy,
          metadata: {
            timestamp: new Date().toISOString(),
            totalCategories: hierarchy.length
          }
        });
        
      case 'stats':
        // Get categorization statistics
        const stats = smartCategorization.getCategoryStats();
        return NextResponse.json({
          success: true,
          data: stats,
          metadata: {
            timestamp: new Date().toISOString()
          }
        });
        
      case 'suggestions':
        // Get category suggestions for text
        const text = searchParams.get('text');
        const limit = parseInt(searchParams.get('limit') || '5');
        
        if (!text) {
          return NextResponse.json(
            { error: 'Text parameter is required for suggestions' },
            { status: 400 }
          );
        }
        
        const suggestions = await smartCategorization.getCategorySuggestions(text, limit);
        return NextResponse.json({
          success: true,
          data: suggestions,
          metadata: {
            timestamp: new Date().toISOString(),
            suggestionCount: suggestions.length
          }
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: hierarchy, stats, or suggestions' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Categorization GET API error', { error: error.message });
    
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