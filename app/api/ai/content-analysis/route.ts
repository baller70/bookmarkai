import { NextRequest, NextResponse } from 'next/server';
import { contentAnalysisService, ContentAnalysisRequest } from '@/lib/ai/content-analysis';
import { appLogger } from '@/lib/logger';
import { withRateLimit } from '@/lib/middleware/rate-limiter';

const logger = appLogger;

export async function POST(request: NextRequest) {
  // Apply rate limiting with memory storage (Redis not available in Vercel)
  const rateLimitMiddleware = withRateLimit({
    windowMs: 60000, // 1 minute
    maxRequests: 10, // 10 requests per minute
    keyGenerator: (req) => `content-analysis:${req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'}`,
    store: 'memory', // Use memory storage instead of Redis
  });

  return await rateLimitMiddleware(request, async () => {
    let url = '';
    let title = '';
    let description = '';
    try {
      const body = await request.json();
      ({ url, title, description } = body);
      const { content, html, userId, preferences } = body;

      // Validate required fields
      if (!url || !userId) {
        return NextResponse.json(
          { error: 'URL and userId are required' },
          { status: 400 }
        );
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }

      logger.info('Content analysis requested', {
        url: url.substring(0, 100),
        userId,
        hasContent: !!content,
        hasHtml: !!html,
        hasPreferences: !!preferences,
      });

      // Prepare analysis request
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

      // Perform content analysis
      const result = await contentAnalysisService.analyzeContent(analysisRequest);

      logger.info('Content analysis completed', {
        url: url.substring(0, 100),
        userId,
        processingTime: result.processingTime,
        confidence: result.confidence,
        category: result.aiCategory,
        tagsCount: result.aiTags.length,
      });

      return NextResponse.json({
        success: true,
        data: result,
      });

    } catch (error) {
      logger.error('Content analysis failed', error instanceof Error ? error : new Error(String(error)));

      // Check if this is an OpenAI API key error and provide fallback
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('OPENAI_API_KEY')) {
        // Return fallback analysis without AI
        return NextResponse.json({
          success: true,
          data: {
            title: title || 'Untitled',
            description: description || '',
            summary: description || 'No summary available',
            aiSummary: 'AI analysis unavailable - OpenAI not configured',
            aiCategory: 'General',
            aiTags: [],
            aiNotes: '',
            keywords: [],
            topics: [],
            sentiment: { score: 0, label: 'neutral' as const, confidence: 0 },
            language: 'en',
            readingTime: 1,
            confidence: 0,
            processingTime: 0,
            sourceInfo: {
              domain: new URL(url).hostname,
              url: url.substring(0, 100),
              title: title || 'Untitled'
            }
          }
        });
      }

      return NextResponse.json(
        { 
          error: 'Content analysis failed',
          message: errorMessage,
        },
        { status: 500 }
      );
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');

    if (operation === 'health') {
      return NextResponse.json({
        success: true,
        service: 'content-analysis',
        status: 'healthy',
        timestamp: Date.now(),
      });
    }

    return NextResponse.json(
      { error: 'Invalid operation' },
      { status: 400 }
    );

  } catch (error) {
    logger.error('Content analysis GET request failed', error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json(
      { error: 'Request failed' },
      { status: 500 }
    );
  }
}            