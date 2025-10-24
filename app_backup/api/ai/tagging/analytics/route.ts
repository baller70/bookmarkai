import { NextRequest, NextResponse } from 'next/server';
import { intelligentTaggingService } from '@/lib/ai/intelligent-tagging';
// // import { performanceUtils } from '../../../../../../../frontend/lib/monitoring/performance-enhanced';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookmarks, action = 'analyze' } = body;

    // Validate input
    if (!Array.isArray(bookmarks) || bookmarks.length === 0) {
      return NextResponse.json({
        error: 'Bookmarks array is required and must not be empty'
      }, { status: 400 });
    }

    // Validate bookmark structure for analytics
    for (const bookmark of bookmarks) {
      if (!bookmark.id || !Array.isArray(bookmark.tags)) {
        return NextResponse.json({
          error: 'Each bookmark must have id and tags array'
        }, { status: 400 });
      }
    }

    let result;

    switch (action) {
      case 'analyze':
        result = await intelligentTaggingService.analyzeTagUsage(bookmarks);
        break;

      case 'cluster':
        const analytics = await intelligentTaggingService.analyzeTagUsage(bookmarks);
        result = await intelligentTaggingService.createTagClusters(analytics);
        break;

      case 'improve':
        // Suggest tag improvements for a specific bookmark
        const { targetBookmark } = body;
        if (!targetBookmark) {
          return NextResponse.json({
            error: 'Target bookmark is required for improvement suggestions'
          }, { status: 400 });
        }

        result = await intelligentTaggingService.suggestTagImprovements(targetBookmark);
        break;

      default:
        return NextResponse.json({
          error: 'Invalid action. Supported actions: analyze, cluster, improve'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      totalBookmarks: bookmarks.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Tag analytics API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Tag analytics failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'stats';

    // For GET requests, we'll provide general tag statistics
    // In a real implementation, you'd load bookmarks from your database
    
    switch (action) {
      case 'stats':
        // Return general tag statistics
        return NextResponse.json({
          success: true,
          stats: {
            message: 'Tag analytics requires bookmark data via POST request',
            supportedActions: ['analyze', 'cluster', 'improve'],
            limits: {
              maxBookmarks: 1000,
              maxTagsPerBookmark: 20
            }
          },
          timestamp: new Date().toISOString()
        });

      case 'common-tags':
        // Return common tag patterns (this would normally come from a database)
        return NextResponse.json({
          success: true,
          commonTags: [
            { tag: 'javascript', usage: 45, category: 'programming' },
            { tag: 'react', usage: 38, category: 'programming' },
            { tag: 'tutorial', usage: 32, category: 'education' },
            { tag: 'api', usage: 28, category: 'technology' },
            { tag: 'documentation', usage: 25, category: 'reference' }
          ],
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          error: 'Invalid action for GET request. Supported: stats, common-tags'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Tag analytics GET API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Tag analytics failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}  