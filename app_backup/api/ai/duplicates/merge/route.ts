import { NextRequest, NextResponse } from 'next/server';
import { duplicateDetection } from '../../../../../lib/ai/duplicate-detection';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { targetBookmark, duplicateBookmark, mergeOptions } = body;
    
    // Validate required fields
    if (!targetBookmark || !duplicateBookmark) {
      return NextResponse.json(
        { error: 'Both targetBookmark and duplicateBookmark are required' },
        { status: 400 }
      );
    }
    
    if (!mergeOptions) {
      return NextResponse.json(
        { error: 'Merge options are required' },
        { status: 400 }
      );
    }
    
    console.log('Bookmark merge request received', { 
      target: targetBookmark.id, 
      duplicate: duplicateBookmark.id 
    });
    
    // Perform bookmark merge
    const result = await duplicateDetection.mergeBookmarks(
      targetBookmark,
      duplicateBookmark,
      mergeOptions
    );
    
    // Track performance metrics
    const duration = Date.now() - startTime;
    
    console.log('Bookmark merge completed', {
      success: result.success,
      fieldsChanged: result.mergeDetails.fieldsChanged.length,
      duration
    });
    
    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        processingTime: duration,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Bookmark merge API error', { 
      error: error.message,
      duration
    });
    
    return NextResponse.json(
      { 
        error: 'Bookmark merge failed', 
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
    const action = searchParams.get('action') || 'options';
    
    console.log('Merge GET request', { action });
    
    switch (action) {
      case 'options':
        // Get available merge options
        const stats = duplicateDetection.getDetectionStats();
        return NextResponse.json({
          success: true,
          data: {
            mergeOptions: stats.mergeOptions,
            example: {
              keepTitle: 'longest',
              keepDescription: 'merge',
              keepTags: 'merge',
              keepCategory: 'first',
              keepUrl: 'first'
            },
            descriptions: {
              keepTitle: {
                first: 'Keep title from target bookmark',
                second: 'Keep title from duplicate bookmark',
                longest: 'Keep the longer title',
                custom: 'Use custom title (provide customTitle)'
              },
              keepDescription: {
                first: 'Keep description from target bookmark',
                second: 'Keep description from duplicate bookmark',
                longest: 'Keep the longer description',
                merge: 'Combine both descriptions',
                custom: 'Use custom description (provide customDescription)'
              },
              keepTags: {
                first: 'Keep tags from target bookmark',
                second: 'Keep tags from duplicate bookmark',
                merge: 'Combine all unique tags',
                custom: 'Use custom tags (provide customTags)'
              },
              keepCategory: {
                first: 'Keep category from target bookmark',
                second: 'Keep category from duplicate bookmark',
                custom: 'Use custom category (provide customCategory)'
              },
              keepUrl: {
                first: 'Keep URL from target bookmark',
                second: 'Keep URL from duplicate bookmark',
                custom: 'Use custom URL (provide customUrl)'
              }
            }
          }
        });
        
      case 'preview':
        // Preview merge result without actually merging
        const targetId = searchParams.get('targetId');
        const duplicateId = searchParams.get('duplicateId');
        
        if (!targetId || !duplicateId) {
          return NextResponse.json(
            { error: 'targetId and duplicateId parameters are required for preview' },
            { status: 400 }
          );
        }
        
        return NextResponse.json({
          success: true,
          data: {
            message: 'Preview functionality would show the result of merging without saving',
            targetId,
            duplicateId,
            note: 'Implement preview logic by calling mergeBookmarks without saving'
          }
        });
        
      case 'help':
        // Get merge API help
        return NextResponse.json({
          success: true,
          data: {
            endpoints: {
              'POST /api/ai/duplicates/merge': 'Merge two duplicate bookmarks',
              'GET /api/ai/duplicates/merge?action=options': 'Get merge options',
              'GET /api/ai/duplicates/merge?action=preview&targetId=X&duplicateId=Y': 'Preview merge result'
            },
            requiredFields: {
              targetBookmark: 'The bookmark to keep (with id, title, url, etc.)',
              duplicateBookmark: 'The bookmark to remove after merging',
              mergeOptions: 'Object specifying how to merge fields'
            },
            mergeOptionsExample: {
              keepTitle: 'longest',
              keepDescription: 'merge',
              keepTags: 'merge',
              keepCategory: 'first',
              keepUrl: 'first',
              customTitle: 'Optional custom title when keepTitle is "custom"',
              customDescription: 'Optional custom description when keepDescription is "custom"',
              customTags: ['tag1', 'tag2'],
              customCategory: 'Optional custom category when keepCategory is "custom"',
              customUrl: 'Optional custom URL when keepUrl is "custom"'
            }
          }
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: options, preview, or help' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Merge GET API error', { error: error.message });
    
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