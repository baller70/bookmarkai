import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    console.log('🔍 DEBUG EXTRACT: Testing content extraction for:', url);
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Import the content extractor
    const { contentExtractor } = await import('@/lib/content-processing/content-extractor');
    
    console.log('🔍 DEBUG EXTRACT: Content extractor imported');

    // Test extraction with minimal options
    const extractedContent = await contentExtractor.extractContent(url, {
      timeout: 10000,
      includeImages: false,
      includeLinks: false
    });

    console.log('🔍 DEBUG EXTRACT: Extraction successful');
    console.log('🔍 DEBUG EXTRACT: Title:', extractedContent.title);
    console.log('🔍 DEBUG EXTRACT: Description:', extractedContent.description);

    return NextResponse.json({
      success: true,
      data: {
        title: extractedContent.title,
        description: extractedContent.description,
        wordCount: extractedContent.wordCount,
        url: extractedContent.url
      },
      debug: {
        timestamp: new Date().toISOString(),
        extractionWorking: true
      }
    });

  } catch (error) {
    console.error('❌ DEBUG EXTRACT: Extraction failed:', error);
    
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
