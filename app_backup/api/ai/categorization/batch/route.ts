import { NextRequest, NextResponse } from 'next/server';
import { smartCategorization } from '../../../../../lib/ai/smart-categorization';
// import { logger } from '../../../../../lib/logger';
// // import { performanceMonitor } from '../../../../../lib/monitoring/performance-enhanced';

interface BatchItem {
  id: string;
  title: string;
  url: string;
  content?: string;
  description?: string;
  tags?: string[];
}

interface BatchResult {
  id: string;
  success: boolean;
  analysis?: any;
  error?: string;
  processingTime: number;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { items, options = {} } = body;
    
    // Validate input
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required and cannot be empty' },
        { status: 400 }
      );
    }
    
    // Limit batch size
    const maxBatchSize = options.maxBatchSize || 50;
    if (items.length > maxBatchSize) {
      return NextResponse.json(
        { error: `Batch size cannot exceed ${maxBatchSize} items` },
        { status: 400 }
      );
    }
    
    // Validate each item
    for (const item of items) {
      if (!item.id || !item.title || !item.url) {
        return NextResponse.json(
          { error: 'Each item must have id, title, and url' },
          { status: 400 }
        );
      }
    }
    
    // logger.info('Batch categorization request received', { 
    //   itemCount: items.length,
    //   maxBatchSize 
    // });
    
    const results: BatchResult[] = [];
    const batchSize = options.concurrency || 5; // Process in smaller batches
    const delay = options.delay || 100; // Delay between batches in ms
    
    // Process items in batches to avoid overwhelming the system
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (item: BatchItem) => {
        const itemStartTime = Date.now();
        
        try {
          const analysis = await smartCategorization.categorizeContent(
            item.title,
            item.url,
            item.content,
            item.description,
            item.tags
          );
          
          const processingTime = Date.now() - itemStartTime;
          
          return {
            id: item.id,
            success: true,
            analysis,
            processingTime
          };
          
        } catch (error) {
          const processingTime = Date.now() - itemStartTime;
          
          // logger.error('Batch item categorization failed', {
          //   itemId: item.id,
          //   error: error.message
          // });
          
          return {
            id: item.id,
            success: false,
            error: error.message,
            processingTime
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches if not the last batch
      if (i + batchSize < items.length && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Calculate statistics
    const totalDuration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
    const avgConfidence = results
      .filter(r => r.success && r.analysis)
      .reduce((sum, r) => sum + r.analysis.confidence, 0) / successCount;
    
    // Track performance metrics
//     // performanceMonitor.recordMetric('batch_categorization_duration', totalDuration);
//     // performanceMonitor.recordMetric('batch_categorization_success_rate', successCount / items.length);
//     // performanceMonitor.recordMetric('batch_categorization_avg_confidence', avgConfidence || 0);
    
    // logger.info('Batch categorization completed', {
    //   totalItems: items.length,
    //   successCount,
    //   errorCount,
    //   totalDuration,
    //   avgProcessingTime,
    //   avgConfidence
    // });
    
    return NextResponse.json({
      success: true,
      data: {
        results,
        statistics: {
          totalItems: items.length,
          successCount,
          errorCount,
          successRate: successCount / items.length,
          totalDuration,
          avgProcessingTime,
          avgConfidence: avgConfidence || 0
        }
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        batchSize: items.length,
        processingOptions: options
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    // logger.error('Batch categorization API error', { 
    //   error: error.message, 
    //   duration,
    //   stack: error.stack 
    // });
    
//     // performanceMonitor.recordMetric('batch_categorization_api_error', 1);
    
    return NextResponse.json(
      { 
        error: 'Batch categorization failed', 
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
      case 'limits':
        // Get batch processing limits and configuration
        return NextResponse.json({
          success: true,
          data: {
            maxBatchSize: 50,
            defaultConcurrency: 5,
            defaultDelay: 100,
            recommendedBatchSize: 10,
            maxConcurrency: 10,
            minDelay: 50
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        });
        
      case 'status':
        // Get batch processing status (in a real implementation, this would check active batches)
        return NextResponse.json({
          success: true,
          data: {
            activeBatches: 0,
            queuedItems: 0,
            processingCapacity: 'available',
            estimatedWaitTime: 0
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: limits or status' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    // logger.error('Batch categorization GET API error', { error: error.message });
    
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