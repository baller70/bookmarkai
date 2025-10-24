import { NextRequest, NextResponse } from 'next/server';
import { intelligentTaggingService, taggingUtils } from '@/lib/ai/intelligent-tagging';
// // import { performanceUtils } from '../../../../../../frontend/lib/monitoring/performance-enhanced';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      url, 
      content, 
      description, 
      options = {},
      action = 'generate'
    } = body;

    let result;

    switch (action) {
      case 'generate':
        // Validate required fields for generation
        if (!title || !url) {
          return NextResponse.json({
            error: 'Title and URL are required for tag generation'
          }, { status: 400 });
        }

        result = await intelligentTaggingService.generateTags(
          title,
          url,
          content,
          description,
          options
        );
        break;

      case 'quick':
        // Validate required fields for quick generation
        if (!title || !url) {
          return NextResponse.json({
            error: 'Title and URL are required for quick tag generation'
          }, { status: 400 });
        }

        result = await taggingUtils.generateQuickTags(title, url, description);
        break;

      case 'validate':
        // Validate tags
        const { tags } = body;
        if (!Array.isArray(tags)) {
          return NextResponse.json({
            error: 'Tags array is required for validation'
          }, { status: 400 });
        }

        result = tags.map(tag => ({
          tag,
          ...taggingUtils.validateTag(tag)
        }));
        break;

      case 'merge':
        // Merge similar tags
        const { tagsToMerge } = body;
        if (!Array.isArray(tagsToMerge)) {
          return NextResponse.json({
            error: 'Tags array is required for merging'
          }, { status: 400 });
        }

        result = taggingUtils.mergeSimilarTags(tagsToMerge);
        break;

      default:
        return NextResponse.json({
          error: 'Invalid action. Supported actions: generate, quick, validate, merge'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Intelligent tagging API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Intelligent tagging failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const url = searchParams.get('url');
    const description = searchParams.get('description');
    const maxTags = parseInt(searchParams.get('maxTags') || '5');
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0.7');

    if (!title || !url) {
      return NextResponse.json({
        error: 'Title and URL parameters are required'
      }, { status: 400 });
    }

    const result = await intelligentTaggingService.generateTags(
      title,
      url,
      undefined,
      description || undefined,
      {
        maxTags,
        minConfidence,
        includeAiTags: true,
        includeContentTags: true,
        includeUrlTags: true
      }
    );

    return NextResponse.json({
      success: true,
      tags: result,
      count: result.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Intelligent tagging GET API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Tag generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}  