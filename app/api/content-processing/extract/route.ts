import { NextRequest, NextResponse } from 'next/server';
import { contentExtractor } from '../../../../lib/content-processing/content-extractor';
import { appLogger } from '../../../../lib/logger';
import { z } from 'zod';

const logger = appLogger;

// Request validation schema
const extractRequestSchema = z.object({
  url: z.string().url('Invalid URL format'),
  options: z.object({
    timeout: z.number().min(1000).max(60000).optional(),
    userAgent: z.string().optional(),
    includeImages: z.boolean().optional(),
    includeLinks: z.boolean().optional(),
    maxContentLength: z.number().min(100).max(100000).optional(),
    followRedirects: z.boolean().optional(),
    extractSchema: z.boolean().optional(),
    qualityAnalysis: z.boolean().optional(),
  }).optional(),
  userId: z.string().optional(),
});

const batchExtractRequestSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(10),
  options: z.object({
    timeout: z.number().min(1000).max(60000).optional(),
    userAgent: z.string().optional(),
    includeImages: z.boolean().optional(),
    includeLinks: z.boolean().optional(),
    maxContentLength: z.number().min(100).max(100000).optional(),
    followRedirects: z.boolean().optional(),
    extractSchema: z.boolean().optional(),
    qualityAnalysis: z.boolean().optional(),
  }).optional(),
  userId: z.string().optional(),
});

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(identifier);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Rate limiting
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: `Maximum ${RATE_LIMIT} requests per minute allowed`,
          retryAfter: 60
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validatedData = extractRequestSchema.parse(body);

    logger.info('Content extraction request', {
      url: validatedData.url,
      clientIp,
      options: validatedData.options
    });

    // Extract content
    const extractedContent = await contentExtractor.extractContent(
      validatedData.url,
      validatedData.options
    );

    logger.info('Content extraction successful', {
      url: validatedData.url,
      wordCount: extractedContent.wordCount,
      qualityScore: extractedContent.quality.score
    });

    return NextResponse.json({
      success: true,
      data: extractedContent,
      metadata: {
        extractedAt: new Date().toISOString(),
        processingTime: 'included in data',
        version: '1.0'
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Content extraction validation error', {
        errors: error.errors
      });
      
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    logger.error('Content extraction failed', error as Error);

    return NextResponse.json(
      {
        error: 'Extraction failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      {
        error: 'Missing URL parameter',
        message: 'URL parameter is required'
      },
      { status: 400 }
    );
  }

  try {
    // Validate URL
    new URL(url);

    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Rate limiting
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: `Maximum ${RATE_LIMIT} requests per minute allowed`,
          retryAfter: 60
        },
        { status: 429 }
      );
    }

    logger.info('Content summary request', { url, clientIp });

    // Extract summary
    const summary = await contentExtractor.extractSummary(url);

    return NextResponse.json({
      success: true,
      data: summary,
      metadata: {
        extractedAt: new Date().toISOString(),
        type: 'summary',
        version: '1.0'
      }
    });

  } catch (error) {
    logger.error('Content summary extraction failed', error as Error, { url });

    return NextResponse.json(
      {
        error: 'Summary extraction failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// Batch extraction endpoint
export async function PUT(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Higher rate limit for batch operations
    if (!checkRateLimit(`batch-${clientIp}`)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'Batch processing rate limit exceeded',
          retryAfter: 60
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validatedData = batchExtractRequestSchema.parse(body);

    logger.info('Batch content extraction request', {
      urlCount: validatedData.urls.length,
      clientIp,
      options: validatedData.options
    });

    // Extract content for all URLs
    const extractedContents = await contentExtractor.extractMultiple(
      validatedData.urls,
      validatedData.options
    );

    logger.info('Batch content extraction completed', {
      requested: validatedData.urls.length,
      successful: extractedContents.length,
      failed: validatedData.urls.length - extractedContents.length
    });

    return NextResponse.json({
      success: true,
      data: extractedContents,
      metadata: {
        extractedAt: new Date().toISOString(),
        totalRequested: validatedData.urls.length,
        totalSuccessful: extractedContents.length,
        totalFailed: validatedData.urls.length - extractedContents.length,
        version: '1.0'
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Batch extraction validation error', {
        errors: error.errors
      });
      
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'Invalid batch request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    logger.error('Batch content extraction failed', error as Error);

    return NextResponse.json(
      {
        error: 'Batch extraction failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}    