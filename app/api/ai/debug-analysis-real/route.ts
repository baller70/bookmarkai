import { NextRequest, NextResponse } from 'next/server';
import { contentAnalysisService } from '@/lib/ai/content-analysis';
import type { ContentAnalysisRequest } from '@/lib/ai/content-analysis';

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    
    console.log('🔍 DEBUG REAL ANALYSIS: Starting with exact real payload...');
    console.log('🔍 DEBUG REAL ANALYSIS: Request keys:', Object.keys(requestBody));
    console.log('🔍 DEBUG REAL ANALYSIS: Content length:', requestBody.content?.length || 0);
    console.log('🔍 DEBUG REAL ANALYSIS: HTML length:', requestBody.html?.length || 0);
    
    const { url, title, description, content, html, userId, preferences } = requestBody;
    
    // Validate required fields (same as real endpoint)
    if (!url || !userId) {
      return NextResponse.json(
        { error: 'URL and userId are required' },
        { status: 400 }
      );
    }

    // Validate URL format (same as real endpoint)
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Prepare analysis request (EXACTLY like real endpoint)
    const analysisRequest: ContentAnalysisRequest = {
      url,
      title,
      description,
      content,
      html,
      userId,
      preferences: preferences ? {
        categories: preferences.categories || [],
        interests: preferences.interests || [],
        language: preferences.language || 'en',
        analysisDepth: preferences.analysisDepth || 'detailed',
        includeKeywords: preferences.includeKeywords !== false,
        includeSentiment: preferences.includeSentiment !== false,
        includeTopics: preferences.includeTopics !== false,
        includeReadingTime: preferences.includeReadingTime !== false,
      } : undefined,
    };

    console.log('🔍 DEBUG REAL ANALYSIS: Analysis request prepared');
    console.log('🔍 DEBUG REAL ANALYSIS: About to call contentAnalysisService.analyzeContent...');

    const result = await contentAnalysisService.analyzeContent(analysisRequest);

    console.log('🔍 DEBUG REAL ANALYSIS: Analysis successful!');

    return NextResponse.json({
      success: true,
      result: result,
      debug: {
        requestProcessed: {
          hasContent: !!content,
          hasHtml: !!html,
          hasPreferences: !!preferences,
          contentLength: content?.length || 0,
          htmlLength: html?.length || 0
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ DEBUG REAL ANALYSIS: Error occurred:', error);
    console.error('❌ DEBUG REAL ANALYSIS: Error name:', error?.constructor?.name);
    console.error('❌ DEBUG REAL ANALYSIS: Error message:', error instanceof Error ? error.message : String(error));
    console.error('❌ DEBUG REAL ANALYSIS: Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error?.constructor?.name,
      stack: error instanceof Error ? error.stack : undefined,
      debug: {
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
