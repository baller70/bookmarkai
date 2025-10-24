import { NextRequest, NextResponse } from 'next/server';
import { trendingDiscovery, TrendingQuery } from '../../../../lib/recommendation/trending-discovery';
import { appLogger } from '../../../../lib/logger';

const logger = appLogger;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const timeWindow = (searchParams.get('timeWindow') || 'day') as 'hour' | 'day' | 'week' | 'month';
    const limit = parseInt(searchParams.get('limit') || '20');
    const categories = searchParams.get('categories')?.split(',') || [];
    const tags = searchParams.get('tags')?.split(',') || [];
    const contentTypes = searchParams.get('contentTypes')?.split(',') || [];
    const languages = searchParams.get('languages')?.split(',') || [];
    const minScore = searchParams.get('minScore') ? parseFloat(searchParams.get('minScore')!) : undefined;
    const excludeItems = searchParams.get('excludeItems')?.split(',') || [];

    logger.info('Discovering trending content', {
      timeWindow,
      limit,
      categories: categories.length,
      tags: tags.length,
      contentTypes: contentTypes.length
    });

    const query: TrendingQuery = {
      timeWindow,
      limit,
      categories: categories.length > 0 ? categories : undefined,
      tags: tags.length > 0 ? tags : undefined,
      contentTypes: contentTypes.length > 0 ? contentTypes : undefined,
      languages: languages.length > 0 ? languages : undefined,
      minScore,
      excludeItems: excludeItems.length > 0 ? excludeItems : undefined
    };

    const trendingItems = await trendingDiscovery.discoverTrending(query);

    logger.info('Trending content discovered', {
      timeWindow,
      itemsFound: trendingItems.length,
      topScore: trendingItems[0]?.score.overall || 0
    });

    return NextResponse.json({
      success: true,
      data: {
        trending: trendingItems,
        metadata: {
          timeWindow,
          totalCount: trendingItems.length,
          categories: [...new Set(trendingItems.map(item => item.category))],
          averageScore: trendingItems.reduce((sum, item) => sum + item.score.overall, 0) / trendingItems.length,
          topTags: [...new Set(trendingItems.flatMap(item => item.tags))].slice(0, 10),
          generatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    logger.error('Failed to discover trending content', error as Error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Failed to discover trending content',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, interaction } = body;

    if (!itemId || !interaction) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Missing required fields',
          details: 'itemId and interaction are required'
        }
      }, { status: 400 });
    }

    logger.info('Updating trending item metrics', {
      itemId,
      interactionType: interaction.type,
      userId: interaction.userId
    });

    // Update trending metrics
    await trendingDiscovery.updateItemMetrics(itemId, {
      type: interaction.type,
      userId: interaction.userId,
      duration: interaction.duration,
      timestamp: interaction.timestamp ? new Date(interaction.timestamp) : new Date()
    });

    logger.info('Trending item metrics updated successfully', {
      itemId,
      interactionType: interaction.type
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Trending metrics updated successfully',
        itemId,
        interactionType: interaction.type,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to update trending metrics', error as Error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Failed to update trending metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}  