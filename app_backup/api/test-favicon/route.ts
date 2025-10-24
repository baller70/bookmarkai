import { NextRequest, NextResponse } from 'next/server';
import { FaviconExtractor } from '@/lib/favicon-extractor';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testUrl = searchParams.get('url') || 'https://github.com';
  
  console.log(`🧪 Testing favicon extraction for: ${testUrl}`);
  
  try {
    // Test favicon extraction
    const result = await FaviconExtractor.extractFavicon(testUrl);
    
    // Test fallback generation
    const fallback = FaviconExtractor.generateFallbackFavicon(testUrl);
    
    return NextResponse.json({
      success: true,
      testUrl,
      extraction: {
        success: result.success,
        source: result.source,
        faviconUrl: result.faviconUrl,
        error: result.error
      },
      fallback,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Favicon extraction test failed:', error);
    
    return NextResponse.json({
      success: false,
      testUrl,
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
