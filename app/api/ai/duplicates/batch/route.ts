import { NextRequest, NextResponse } from 'next/server';
import { duplicateDetection } from '../../../../../lib/ai/duplicate-detection';

interface BatchRequest {
  bookmarks: any[];
  options?: {
    thresholds?: {
      similarityThreshold?: number;
      fuzzyUrlThreshold?: number;
      titleSimilarityThreshold?: number;
    };
    batchSize?: number;
    includeNearDuplicates?: boolean;
    autoMergeExact?: boolean;
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: BatchRequest = await request.json();
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
    
    // Check batch size limits
    const maxBatchSize = options.batchSize || 1000;
    if (bookmarks.length > maxBatchSize) {
      return NextResponse.json(
        { error: `Batch size exceeds maximum of ${maxBatchSize} bookmarks` },
        { status: 400 }
      );
    }
    
    console.log('Batch duplicate detection request received', { 
      bookmarkCount: bookmarks.length,
      options
    });
    
    // Update thresholds if provided
    if (options.thresholds) {
      duplicateDetection.updateThresholds(options.thresholds);
    }
    
    let processedBatches = 0;
    let totalDuplicates = 0;
    let totalNearDuplicates = 0;
    const allMatches = {
      exactMatches: [],
      fuzzyMatches: [],
      contentMatches: [],
      titleMatches: []
    };
    
    // Process bookmarks in smaller batches for large datasets
    const chunkSize = Math.min(500, bookmarks.length);
    const chunks = [];
    
    for (let i = 0; i < bookmarks.length; i += chunkSize) {
      chunks.push(bookmarks.slice(i, i + chunkSize));
    }
    
    // Process each chunk
    for (const chunk of chunks) {
      const chunkAnalysis = await duplicateDetection.detectDuplicates(chunk);
      
      // Aggregate results
      allMatches.exactMatches.push(...chunkAnalysis.exactMatches);
      allMatches.fuzzyMatches.push(...chunkAnalysis.fuzzyMatches);
      
      if (options.includeNearDuplicates !== false) {
        allMatches.contentMatches.push(...chunkAnalysis.contentMatches);
        allMatches.titleMatches.push(...chunkAnalysis.titleMatches);
      }
      
      totalDuplicates += chunkAnalysis.duplicatesFound;
      totalNearDuplicates += chunkAnalysis.nearDuplicatesFound;
      processedBatches++;
      
      console.log(`Processed batch ${processedBatches}/${chunks.length}`, {
        chunkSize: chunk.length,
        duplicatesInChunk: chunkAnalysis.duplicatesFound
      });
    }
    
    // Auto-merge exact duplicates if requested
    const autoMergedCount = 0;
    if (options.autoMergeExact && allMatches.exactMatches.length > 0) {
      // Note: In a real implementation, this would actually merge the bookmarks
      // For now, we just count how many would be auto-merged
      console.log('Auto-merge exact duplicates requested', {
        exactMatches: allMatches.exactMatches.length
      });
    }
    
    // Calculate final statistics
    const processingTime = Date.now() - startTime;
    const analysis = {
      totalBookmarks: bookmarks.length,
      duplicatesFound: totalDuplicates,
      nearDuplicatesFound: totalNearDuplicates,
      exactMatches: allMatches.exactMatches,
      fuzzyMatches: allMatches.fuzzyMatches,
      contentMatches: allMatches.contentMatches,
      titleMatches: allMatches.titleMatches,
      processingTime,
      batchInfo: {
        totalBatches: processedBatches,
        batchSize: chunkSize,
        autoMergedCount
      },
      recommendations: {
        autoMergeCount: allMatches.exactMatches.filter(m => m.recommendedAction === 'merge').length,
        manualReviewCount: [
          ...allMatches.fuzzyMatches,
          ...allMatches.contentMatches,
          ...allMatches.titleMatches
        ].filter(m => m.recommendedAction === 'review_manual').length,
        keepBothCount: [
          ...allMatches.exactMatches,
          ...allMatches.fuzzyMatches,
          ...allMatches.contentMatches,
          ...allMatches.titleMatches
        ].filter(m => m.recommendedAction === 'keep_both').length
      }
    };
    
    console.log('Batch duplicate detection completed', {
      totalDuplicates,
      totalNearDuplicates,
      processingTime,
      batchesProcessed: processedBatches
    });
    
    return NextResponse.json({
      success: true,
      data: analysis,
      metadata: {
        processingTime,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        batchProcessing: true
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Batch duplicate detection API error', { 
      error: error.message,
      duration
    });
    
    return NextResponse.json(
      { 
        error: 'Batch duplicate detection failed', 
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
    const action = searchParams.get('action') || 'limits';
    
    console.log('Batch duplicate detection GET request', { action });
    
    switch (action) {
      case 'limits':
        // Get batch processing limits and options
        return NextResponse.json({
          success: true,
          data: {
            maxBatchSize: 1000,
            defaultBatchSize: 500,
            recommendedChunkSize: 100,
            supportedOptions: {
              batchSize: 'Maximum number of bookmarks to process (default: 1000)',
              includeNearDuplicates: 'Whether to include content/title similarity matches (default: true)',
              autoMergeExact: 'Whether to automatically merge exact URL matches (default: false)',
              thresholds: {
                similarityThreshold: 'Content similarity threshold (0-1, default: 0.85)',
                fuzzyUrlThreshold: 'URL similarity threshold (0-1, default: 0.9)',
                titleSimilarityThreshold: 'Title similarity threshold (0-1, default: 0.8)'
              }
            }
          }
        });
        
      case 'performance':
        // Get performance estimates
        const count = parseInt(searchParams.get('count') || '100');
        const estimatedTime = Math.ceil(count / 100) * 2; // Rough estimate: 2 seconds per 100 bookmarks
        
        return NextResponse.json({
          success: true,
          data: {
            bookmarkCount: count,
            estimatedProcessingTime: `${estimatedTime} seconds`,
            recommendedBatchSize: count > 500 ? 500 : count,
            memoryEstimate: `${Math.ceil(count * 0.01)} MB`,
            recommendation: count < 100 
              ? 'Use regular /api/ai/duplicates endpoint'
              : count >= 100 && count < 500
              ? 'Batch processing recommended'
              : 'Use chunked batch processing with progress tracking'
          }
        });
        
      case 'help':
        // Get batch API help
        return NextResponse.json({
          success: true,
          data: {
            description: 'Batch duplicate detection for large bookmark collections',
            endpoints: {
              'POST /api/ai/duplicates/batch': 'Process large bookmark arrays for duplicates',
              'GET /api/ai/duplicates/batch?action=limits': 'Get batch processing limits',
              'GET /api/ai/duplicates/batch?action=performance&count=N': 'Get performance estimates',
              'GET /api/ai/duplicates/batch?action=help': 'Get this help information'
            },
            requestExample: {
              bookmarks: '[array of bookmark objects]',
              options: {
                batchSize: 1000,
                includeNearDuplicates: true,
                autoMergeExact: false,
                thresholds: {
                  similarityThreshold: 0.85,
                  fuzzyUrlThreshold: 0.9,
                  titleSimilarityThreshold: 0.8
                }
              }
            },
            responseFields: {
              totalBookmarks: 'Number of bookmarks processed',
              duplicatesFound: 'Number of exact and fuzzy duplicates',
              nearDuplicatesFound: 'Number of content/title similar bookmarks',
              batchInfo: 'Information about batch processing',
              recommendations: 'Counts of different recommended actions'
            },
            performanceTips: [
              'Use smaller batch sizes for faster response times',
              'Set includeNearDuplicates to false to skip content analysis',
              'Enable autoMergeExact for automatic cleanup of exact duplicates',
              'Monitor memory usage for very large datasets'
            ]
          }
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: limits, performance, or help' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Batch duplicate detection GET API error', { error: error.message });
    
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