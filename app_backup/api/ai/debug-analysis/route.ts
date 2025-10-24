import { NextRequest, NextResponse } from 'next/server';
import { contentAnalysisService } from '@/lib/ai/content-analysis';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    console.log('🔍 DEBUG: Starting AI analysis for URL:', url);
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Test the content analysis service directly
    const analysisRequest = {
      url: url,
      title: 'Debug Test Title',
      description: 'Debug test description',
      content: 'This is debug test content for AI analysis.',
      userId: 'debug-user'
    };

    console.log('🔍 DEBUG: Analysis request:', analysisRequest);

    const result = await contentAnalysisService.analyzeContent(analysisRequest);

    console.log('🔍 DEBUG: Analysis result:', result);

    return NextResponse.json({
      success: true,
      result: result,
      debug: {
        requestSent: analysisRequest,
        openaiWorking: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ DEBUG: Analysis failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      debug: {
        errorType: error?.constructor?.name,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
