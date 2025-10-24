import { NextRequest, NextResponse } from 'next/server';
import { contentAnalysisUtils } from '@/lib/ai/content-analysis';
// // import { performanceUtils } from '../../../../../../../frontend/lib/monitoring/performance-enhanced';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analysis, count = 5 } = body;

    // Validate input
    if (!analysis) {
      return NextResponse.json({
        error: 'Content analysis object is required'
      }, { status: 400 });
    }

    if (count < 1 || count > 20) {
      return NextResponse.json({
        error: 'Count must be between 1 and 20'
      }, { status: 400 });
    }

    const suggestions = await contentAnalysisUtils.getSimilarContentSuggestions(analysis, count);

    return NextResponse.json({
      success: true,
      suggestions,
      count: suggestions.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Content suggestions API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Content suggestions generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const summary = searchParams.get('summary');
    const tags = searchParams.get('tags');
    const category = searchParams.get('category');
    const topics = searchParams.get('topics');
    const count = parseInt(searchParams.get('count') || '5');

    // Validate input
    if (!summary && !tags && !category && !topics) {
      return NextResponse.json({
        error: 'At least one of summary, tags, category, or topics is required'
      }, { status: 400 });
    }

    if (count < 1 || count > 20) {
      return NextResponse.json({
        error: 'Count must be between 1 and 20'
      }, { status: 400 });
    }

    // Create analysis object from query parameters
    const analysis = {
      summary: summary || '',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      category: category || 'other',
      topics: topics ? topics.split(',').map(topic => topic.trim()) : [],
      sentiment: 'neutral' as const,
      readingTime: 5,
      complexity: 'intermediate' as const,
      language: 'en',
      qualityScore: 5,
      keyPoints: [],
      relatedKeywords: [],
      contentType: 'other' as const
    };

    const suggestions = await contentAnalysisUtils.getSimilarContentSuggestions(analysis, count);

    return NextResponse.json({
      success: true,
      suggestions,
      count: suggestions.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Content suggestions GET API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Content suggestions generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}  