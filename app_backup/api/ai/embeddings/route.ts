import { NextRequest, NextResponse } from 'next/server';
import { embeddingService, bookmarkEmbeddingService } from '@/lib/ai/embeddings';
import { appLogger } from '@/lib/logger';
import { withRateLimit } from '@/lib/middleware/rate-limiter';

const logger = appLogger;

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitMiddleware = withRateLimit({
    windowMs: 60000, // 1 minute
    maxRequests: 20, // 20 requests per minute
    keyGenerator: (req) => `embeddings:${req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'}`,
  });

  return await rateLimitMiddleware(request, async () => {
    try {
      const body = await request.json();
      const { action, ...params } = body;

      logger.info('Embeddings API request', { action, hasParams: !!params });

      switch (action) {
        case 'create':
          return await handleCreateEmbedding(params);
        
        case 'search':
          return await handleSemanticSearch(params);
        
        case 'embed_bookmark':
          return await handleEmbedBookmark(params);
        
        case 'search_bookmarks':
          return await handleSearchBookmarks(params);
        
        case 'find_similar':
          return await handleFindSimilar(params);
        
        case 'get_recommendations':
          return await handleGetRecommendations(params);
        
        default:
          return NextResponse.json(
            { error: 'Invalid action. Supported actions: create, search, embed_bookmark, search_bookmarks, find_similar, get_recommendations' },
            { status: 400 }
          );
      }

    } catch (error) {
      logger.error('Embeddings API request failed', error instanceof Error ? error : new Error(String(error)));

      return NextResponse.json(
        { 
          error: 'Request failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  });
}

// Handle creating embeddings
async function handleCreateEmbedding(params: any) {
  const { text, metadata, userId } = params;

  if (!text) {
    return NextResponse.json(
      { error: 'Text is required' },
      { status: 400 }
    );
  }

  try {
    const result = await embeddingService.createEmbedding({
      text,
      metadata,
      userId,
    });

    logger.info('Embedding created', {
      textLength: text.length,
      userId,
      dimensions: result.embedding.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        embedding: result.embedding,
        metadata: result.metadata,
        timestamp: result.timestamp,
        model: result.model,
      },
    });

  } catch (error) {
    logger.error('Failed to create embedding', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

// Handle semantic search
async function handleSemanticSearch(params: any) {
  const { query, limit = 10, threshold = 0.5, filters } = params;

  if (!query) {
    return NextResponse.json(
      { error: 'Query is required' },
      { status: 400 }
    );
  }

  try {
    // Get all embeddings (in a real implementation, this would be more efficient)
    const allEmbeddings = await embeddingService.listEmbeddings(filters);

    const results = await embeddingService.semanticSearch({
      query,
      embeddings: allEmbeddings,
      limit,
      threshold,
      filters,
    });

    logger.info('Semantic search completed', {
      query: query.substring(0, 100),
      resultsCount: results.length,
      limit,
      threshold,
    });

    return NextResponse.json({
      success: true,
      data: {
        results,
        query,
        totalResults: results.length,
        limit,
        threshold,
      },
    });

  } catch (error) {
    logger.error('Semantic search failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

// Handle bookmark embedding
async function handleEmbedBookmark(params: any) {
  const { id, title, description, content, url, category, tags, userId } = params;

  if (!id || !title || !url || !userId) {
    return NextResponse.json(
      { error: 'id, title, url, and userId are required' },
      { status: 400 }
    );
  }

  try {
    await bookmarkEmbeddingService.embedBookmark({
      id,
      title,
      description,
      content,
      url,
      category,
      tags,
      userId,
    });

    logger.info('Bookmark embedded', {
      id,
      title: title.substring(0, 50),
      userId,
      hasContent: !!content,
    });

    return NextResponse.json({
      success: true,
      message: 'Bookmark embedded successfully',
      data: { id, title, url },
    });

  } catch (error) {
    logger.error('Failed to embed bookmark', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

// Handle bookmark search
async function handleSearchBookmarks(params: any) {
  const { query, userId, limit = 10, threshold = 0.5, category, tags } = params;

  if (!query || !userId) {
    return NextResponse.json(
      { error: 'Query and userId are required' },
      { status: 400 }
    );
  }

  try {
    const results = await bookmarkEmbeddingService.searchBookmarks(
      query,
      userId,
      { limit, threshold, category, tags }
    );

    logger.info('Bookmark search completed', {
      query: query.substring(0, 100),
      userId,
      resultsCount: results.length,
      category,
      tagsCount: tags?.length || 0,
    });

    return NextResponse.json({
      success: true,
      data: {
        results,
        query,
        userId,
        totalResults: results.length,
        filters: { category, tags },
      },
    });

  } catch (error) {
    logger.error('Bookmark search failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

// Handle finding similar content
async function handleFindSimilar(params: any) {
  const { text, bookmarkId, userId, limit = 5, threshold = 0.7, filters, excludeId } = params;

  if (bookmarkId) {
    // Find similar bookmarks
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required when finding similar bookmarks' },
        { status: 400 }
      );
    }

    try {
      const results = await bookmarkEmbeddingService.findSimilarBookmarks(
        bookmarkId,
        userId,
        limit
      );

      logger.info('Similar bookmarks found', {
        bookmarkId,
        userId,
        resultsCount: results.length,
      });

      return NextResponse.json({
        success: true,
        data: {
          results,
          bookmarkId,
          userId,
          totalResults: results.length,
        },
      });

    } catch (error) {
      logger.error('Failed to find similar bookmarks', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }

  } else if (text) {
    // Find similar text content
    try {
      const results = await embeddingService.findSimilar(text, {
        limit,
        threshold,
        filters,
        excludeId,
      });

      logger.info('Similar content found', {
        textLength: text.length,
        resultsCount: results.length,
        excludeId,
      });

      return NextResponse.json({
        success: true,
        data: {
          results,
          text: text.substring(0, 100),
          totalResults: results.length,
        },
      });

    } catch (error) {
      logger.error('Failed to find similar content', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }

  } else {
    return NextResponse.json(
      { error: 'Either text or bookmarkId is required' },
      { status: 400 }
    );
  }
}

// Handle getting recommendations
async function handleGetRecommendations(params: any) {
  const { userId, limit = 10, threshold = 0.6, basedOnRecent = true, recentCount = 10 } = params;

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    );
  }

  try {
    const results = await bookmarkEmbeddingService.getBookmarkRecommendations(
      userId,
      { limit, threshold, basedOnRecent, recentCount }
    );

    logger.info('Bookmark recommendations generated', {
      userId,
      resultsCount: results.length,
      basedOnRecent,
      recentCount,
    });

    return NextResponse.json({
      success: true,
      data: {
        results,
        userId,
        totalResults: results.length,
        basedOnRecent,
        recentCount,
      },
    });

  } catch (error) {
    logger.error('Failed to get bookmark recommendations', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');
    const userId = searchParams.get('userId');

    switch (operation) {
      case 'health':
        return NextResponse.json({
          success: true,
          service: 'embeddings',
          status: 'healthy',
          timestamp: Date.now(),
        });

      case 'stats':
        const stats = embeddingService.getStorageStats();
        return NextResponse.json({
          success: true,
          data: stats,
        });

      case 'list':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId is required for list operation' },
            { status: 400 }
          );
        }

        const embeddings = await embeddingService.listEmbeddings({
          userId,
          type: 'bookmark',
        });

        return NextResponse.json({
          success: true,
          data: {
            embeddings: embeddings.map(e => ({
              id: e.id,
              text: e.text.substring(0, 100),
              metadata: e.metadata,
              timestamp: e.timestamp,
            })),
            totalCount: embeddings.length,
          },
        });

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Supported operations: health, stats, list' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Embeddings GET request failed', error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json(
      { error: 'Request failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    if (action === 'clear' && userId) {
      // Clear all embeddings for a user
      const embeddings = await embeddingService.listEmbeddings({ userId });
      
      for (const embedding of embeddings) {
        await embeddingService.deleteEmbedding(embedding.id);
      }

      logger.info('Cleared user embeddings', {
        userId,
        clearedCount: embeddings.length,
      });

      return NextResponse.json({
        success: true,
        message: `Cleared ${embeddings.length} embeddings for user`,
        clearedCount: embeddings.length,
      });

    } else if (id) {
      // Delete specific embedding
      await embeddingService.deleteEmbedding(id);

      logger.info('Embedding deleted', { id });

      return NextResponse.json({
        success: true,
        message: 'Embedding deleted successfully',
        id,
      });

    } else {
      return NextResponse.json(
        { error: 'Either id or userId with action=clear is required' },
        { status: 400 }
      );
    }

  } catch (error) {
    logger.error('Embeddings DELETE request failed', error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json(
      { error: 'Delete operation failed' },
      { status: 500 }
    );
  }
}          