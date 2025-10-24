import { NextRequest, NextResponse } from 'next/server';
import { duplicateDetection } from '../../../../lib/ai/duplicate-detection';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { bookmarks, options = {} } = body;
    
    // Validate required fields
    if (!bookmarks || !Array.isArray(bookmarks)) {
      return NextResponse.json(
        { error: 'Bookmarks array is required' },
        { status: 400 }
      );
    }
    
    if (bookmarks.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 bookmarks are required for duplicate detection' },
        { status: 400 }
      );
    }
    
    console.log('Duplicate detection request received', { 
      bookmarkCount: bookmarks.length 
    });
    
    // Update thresholds if provided
    if (options.thresholds) {
      duplicateDetection.updateThresholds(options.thresholds);
    }
    
    // Perform duplicate detection
    const analysis = await duplicateDetection.detectDuplicates(bookmarks);
    
    // Track performance metrics
    const duration = Date.now() - startTime;
    
    console.log('Duplicate detection completed', {
      duplicatesFound: analysis.duplicatesFound,
      nearDuplicatesFound: analysis.nearDuplicatesFound,
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
    console.error('Duplicate detection API error', { 
      error: error.message,
      duration
    });
    
    return NextResponse.json(
      { 
        error: 'Duplicate detection failed', 
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
    const action = searchParams.get('action') || 'stats';
    
    console.log('Duplicate detection GET request', { action });
    
    switch (action) {
      case 'stats':
        // Get detection statistics
        const stats = duplicateDetection.getDetectionStats();
        return NextResponse.json({
          success: true,
          data: stats
        });
        
      case 'thresholds':
        // Get current thresholds
        const thresholds = duplicateDetection.getDetectionStats();
        return NextResponse.json({
          success: true,
          data: {
            similarityThreshold: thresholds.similarityThreshold,
            fuzzyUrlThreshold: thresholds.fuzzyUrlThreshold,
            titleSimilarityThreshold: thresholds.titleSimilarityThreshold
          }
        });
        
      case 'help':
        // Get API help information
        return NextResponse.json({
          success: true,
          data: {
            endpoints: {
              'POST /api/ai/duplicates': 'Detect duplicates in bookmark array',
              'GET /api/ai/duplicates?action=stats': 'Get detection statistics',
              'GET /api/ai/duplicates?action=thresholds': 'Get current thresholds',
              'POST /api/ai/duplicates/merge': 'Merge duplicate bookmarks',
              'GET /api/ai/duplicates/merge?action=options': 'Get merge options'
            },
            parameters: {
              bookmarks: 'Array of bookmark objects with id, title, url, etc.',
              options: {
                thresholds: {
                  similarityThreshold: 'Content similarity threshold (0-1)',
                  fuzzyUrlThreshold: 'URL similarity threshold (0-1)',
                  titleSimilarityThreshold: 'Title similarity threshold (0-1)'
                }
              }
            },
            matchTypes: ['exact', 'fuzzy_url', 'content_similar', 'title_similar'],
            recommendedActions: ['merge', 'keep_both', 'review_manual']
          }
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: stats, thresholds, or help' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Duplicate detection GET API error', { error: error.message });
    
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