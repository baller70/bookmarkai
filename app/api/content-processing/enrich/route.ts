import { NextRequest, NextResponse } from 'next/server';
import { enrichmentProcessor } from '../../../../lib/content-processing/enrichment-processor';
import { contentExtractor } from '../../../../lib/content-processing/content-extractor';
import { qualityFilter } from '../../../../lib/content-processing/quality-filter';
import { appLogger } from '../../../../lib/logger';
import { z } from 'zod';

const logger = appLogger;

// Request validation schema
const enrichRequestSchema = z.object({
  url: z.string().url('Invalid URL format').optional(),
  content: z.object({
    url: z.string().url(),
    title: z.string(),
    description: z.string(),
    content: z.string(),
    plainText: z.string(),
    metadata: z.any(),
    images: z.array(z.any()).optional(),
    links: z.array(z.any()).optional(),
    readingTime: z.number(),
    wordCount: z.number(),
    language: z.string(),
    quality: z.any(),
    extractedAt: z.string(),
  }).optional(),
  options: z.object({
    enableAISummary: z.boolean().optional(),
    enableTopicExtraction: z.boolean().optional(),
    enableSentimentAnalysis: z.boolean().optional(),
    enableEntityRecognition: z.boolean().optional(),
    enableSEOOptimization: z.boolean().optional(),
    enableSocialMediaOptimization: z.boolean().optional(),
    enableRelatedContentDiscovery: z.boolean().optional(),
    enableMultiLanguageProcessing: z.boolean().optional(),
    targetLanguages: z.array(z.string()).optional(),
    qualityThreshold: z.number().min(0).max(100).optional(),
    processingPriority: z.enum(['speed', 'quality', 'comprehensive']).optional(),
  }).optional(),
  userId: z.string().optional(),
});

const qualityAnalysisSchema = z.object({
  content: z.object({
    url: z.string().url(),
    title: z.string(),
    description: z.string(),
    content: z.string(),
    plainText: z.string(),
    metadata: z.any(),
    images: z.array(z.any()).optional(),
    links: z.array(z.any()).optional(),
    readingTime: z.number(),
    wordCount: z.number(),
    language: z.string(),
    quality: z.any(),
    extractedAt: z.string(),
  }),
  criteria: z.object({
    minimumScore: z.number().min(0).max(100).optional(),
    requiredCategories: z.array(z.string()).optional(),
    blacklistedDomains: z.array(z.string()).optional(),
    whitelistedDomains: z.array(z.string()).optional(),
    contentFilters: z.array(z.any()).optional(),
    structureRequirements: z.array(z.any()).optional(),
    metadataRequirements: z.array(z.any()).optional(),
  }).optional(),
  userId: z.string().optional(),
});

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute (lower for enrichment)
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
          message: `Maximum ${RATE_LIMIT} enrichment requests per minute allowed`,
          retryAfter: 60
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validatedData = enrichRequestSchema.parse(body);

    logger.info('Content enrichment request', {
      hasUrl: !!validatedData.url,
      hasContent: !!validatedData.content,
      clientIp,
      options: validatedData.options
    });

    let extractedContent;

    // Extract content if URL is provided, otherwise use provided content
    if (validatedData.url) {
      extractedContent = await contentExtractor.extractContent(validatedData.url);
    } else if (validatedData.content) {
      extractedContent = {
        ...validatedData.content,
        extractedAt: new Date(validatedData.content.extractedAt)
      };
    } else {
      return NextResponse.json(
        {
          error: 'Missing content',
          message: 'Either URL or content object must be provided'
        },
        { status: 400 }
      );
    }

    // Enrich the content
    const enrichedContent = await enrichmentProcessor.enrichContent(
      extractedContent,
      validatedData.options
    );

    logger.info('Content enrichment successful', {
      url: extractedContent.url,
      processingSteps: enrichedContent.processingHistory.length,
      successfulSteps: enrichedContent.processingHistory.filter(s => s.status === 'success').length
    });

    return NextResponse.json({
      success: true,
      data: enrichedContent,
      metadata: {
        enrichedAt: new Date().toISOString(),
        processingSteps: enrichedContent.processingHistory.length,
        version: enrichedContent.version
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Content enrichment validation error', {
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

    logger.error('Content enrichment failed', error as Error);

    return NextResponse.json(
      {
        error: 'Enrichment failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// Quality analysis endpoint
export async function PUT(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Rate limiting
    if (!checkRateLimit(`quality-${clientIp}`)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'Quality analysis rate limit exceeded',
          retryAfter: 60
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validatedData = qualityAnalysisSchema.parse(body);

    logger.info('Quality analysis request', {
      url: validatedData.content.url,
      clientIp,
      criteria: validatedData.criteria
    });

    // Analyze content quality
    const defaultCriteria = {
      minimumScore: 0,
      requiredCategories: [],
      blacklistedDomains: [],
      whitelistedDomains: [],
      contentFilters: [],
      structureRequirements: [],
      metadataRequirements: []
    };
    const qualityScore = await qualityFilter.analyzeQuality(
      validatedData.content as any,
      defaultCriteria
    );

    // Generate enhancement suggestions
    const enhancementSuggestions = qualityFilter.generateEnhancementSuggestions(qualityScore);

    logger.info('Quality analysis completed', {
      url: validatedData.content.url,
      overallScore: qualityScore.overall,
      passesFilter: qualityScore.passesFilter,
      issueCount: qualityScore.issues.length
    });

    return NextResponse.json({
      success: true,
      data: {
        qualityScore,
        enhancementSuggestions,
        analysis: {
          overallScore: qualityScore.overall,
          passesFilter: qualityScore.passesFilter,
          categoryBreakdown: qualityScore.categories,
          issueCount: qualityScore.issues.length,
          recommendationCount: qualityScore.recommendations.length
        }
      },
      metadata: {
        analyzedAt: new Date().toISOString(),
        version: '1.0'
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Quality analysis validation error', {
        errors: error.errors
      });
      
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'Invalid quality analysis request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    logger.error('Quality analysis failed', error as Error);

    return NextResponse.json(
      {
        error: 'Quality analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// Pipeline management endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'pipelines':
        const pipelines = enrichmentProcessor.getPipelines();
        return NextResponse.json({
          success: true,
          data: pipelines,
          metadata: {
            count: pipelines.length,
            retrievedAt: new Date().toISOString()
          }
        });

      case 'health':
        return NextResponse.json({
          success: true,
          data: {
            status: 'healthy',
            services: {
              contentExtractor: 'operational',
              enrichmentProcessor: 'operational',
              qualityFilter: 'operational'
            },
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
          }
        });

      case 'stats':
        // Return processing statistics
        return NextResponse.json({
          success: true,
          data: {
            rateLimits: {
              enrichment: RATE_LIMIT,
              window: RATE_LIMIT_WINDOW / 1000
            },
            supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ar'],
            maxContentLength: 50000,
            maxBatchSize: 10
          }
        });

      default:
        return NextResponse.json(
          {
            error: 'Invalid action',
            message: 'Supported actions: pipelines, health, stats'
          },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Pipeline management request failed', error as Error);

    return NextResponse.json(
      {
        error: 'Request failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// Batch enrichment endpoint
export async function PATCH(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Higher rate limit for batch operations
    if (!checkRateLimit(`batch-enrich-${clientIp}`)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'Batch enrichment rate limit exceeded',
          retryAfter: 60
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Validate batch request
    const batchSchema = z.object({
      contents: z.array(z.object({
        url: z.string().url(),
        title: z.string(),
        description: z.string(),
        content: z.string(),
        plainText: z.string(),
        metadata: z.any(),
        images: z.array(z.any()).optional(),
        links: z.array(z.any()).optional(),
        readingTime: z.number(),
        wordCount: z.number(),
        language: z.string(),
        quality: z.any(),
        extractedAt: z.string(),
      })).min(1).max(5), // Limit batch size for enrichment
      options: z.object({
        enableAISummary: z.boolean().optional(),
        enableTopicExtraction: z.boolean().optional(),
        enableSentimentAnalysis: z.boolean().optional(),
        enableEntityRecognition: z.boolean().optional(),
        enableSEOOptimization: z.boolean().optional(),
        enableSocialMediaOptimization: z.boolean().optional(),
        enableRelatedContentDiscovery: z.boolean().optional(),
        enableMultiLanguageProcessing: z.boolean().optional(),
        targetLanguages: z.array(z.string()).optional(),
        qualityThreshold: z.number().min(0).max(100).optional(),
        processingPriority: z.enum(['speed', 'quality', 'comprehensive']).optional(),
      }).optional(),
      userId: z.string().optional(),
    });

    const validatedData = batchSchema.parse(body);

    logger.info('Batch enrichment request', {
      contentCount: validatedData.contents.length,
      clientIp,
      options: validatedData.options
    });

    // Convert string dates back to Date objects
    const contents = validatedData.contents.map(content => ({
      ...content,
      extractedAt: new Date(content.extractedAt)
    }));

    // Enrich all contents
    const enrichedContents = await enrichmentProcessor.batchEnrich(
      contents as any,
      validatedData.options
    );

    logger.info('Batch enrichment completed', {
      requested: validatedData.contents.length,
      successful: enrichedContents.length,
      failed: validatedData.contents.length - enrichedContents.length
    });

    return NextResponse.json({
      success: true,
      data: enrichedContents,
      metadata: {
        enrichedAt: new Date().toISOString(),
        totalRequested: validatedData.contents.length,
        totalSuccessful: enrichedContents.length,
        totalFailed: validatedData.contents.length - enrichedContents.length,
        version: '1.0'
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Batch enrichment validation error', {
        errors: error.errors
      });
      
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'Invalid batch enrichment request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    logger.error('Batch enrichment failed', error as Error);

    return NextResponse.json(
      {
        error: 'Batch enrichment failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}            