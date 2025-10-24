import { NextRequest, NextResponse } from 'next/server';
import { recommendationEngine, RecommendationRequest } from '../../../lib/recommendation/recommendation-engine';
import { performanceTracker } from '../../../lib/recommendation/performance-tracker';
import { appLogger } from '../../../lib/logger';

const logger = appLogger;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get('userId') || 'anonymous';
    const count = parseInt(searchParams.get('count') || '10');
    const types = searchParams.get('types')?.split(',') || ['content-based', 'collaborative', 'trending'];
    const categories = searchParams.get('categories')?.split(',') || [];
    const tags = searchParams.get('tags')?.split(',') || [];
    const minQuality = searchParams.get('minQuality') ? parseFloat(searchParams.get('minQuality')!) : undefined;
    const excludeBookmarks = searchParams.get('excludeBookmarks')?.split(',') || [];
    const page = searchParams.get('page') || 'dashboard';
    const device = searchParams.get('device') || 'desktop';

    logger.info('Generating recommendations', {
      userId,
      count,
      types,
      categories: categories.length,
      tags: tags.length
    });

    const recommendationRequest: RecommendationRequest = {
      userId,
      count,
      types: types as any[],
      filters: {
        categories: categories.length > 0 ? categories : undefined,
        tags: tags.length > 0 ? tags : undefined,
        minQuality,
        excludeBookmarks: excludeBookmarks.length > 0 ? excludeBookmarks : undefined
      },
      context: {
        currentPage: page,
        timeOfDay: new Date().getHours(),
        dayOfWeek: new Date().getDay()
      }
    };

    const recommendations = await recommendationEngine.generateRecommendations(recommendationRequest);

    // Track presentation of recommendations
    for (let i = 0; i < recommendations.length; i++) {
      await performanceTracker.trackRecommendationPresented(
        recommendations[i].id,
        userId,
        recommendations[i],
        {
          page,
          device,
          position: i + 1,
          sessionDuration: 0 // Would be tracked from frontend
        }
      );
    }

    logger.info('Recommendations generated successfully', {
      userId,
      count: recommendations.length,
      types: [...new Set(recommendations.map(r => r.type))]
    });

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        metadata: {
          totalCount: recommendations.length,
          types: [...new Set(recommendations.map(r => r.type))],
          categories: [...new Set(recommendations.map(r => r.metadata.category))],
          averageScore: recommendations.reduce((sum, r) => sum + r.score, 0) / recommendations.length,
          generatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    logger.error('Failed to generate recommendations', error as Error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Failed to generate recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, interaction, recommendationId } = body;

    if (!userId || !interaction || !recommendationId) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Missing required fields',
          details: 'userId, interaction, and recommendationId are required'
        }
      }, { status: 400 });
    }

    logger.info('Tracking recommendation interaction', {
      userId,
      recommendationId,
      interactionType: interaction.type
    });

    // Track the interaction
    await performanceTracker.trackRecommendationInteraction(recommendationId, {
      type: interaction.type,
      timestamp: interaction.timestamp ? new Date(interaction.timestamp) : new Date(),
      duration: interaction.duration
    });

    // If this is a rating, track it separately
    if (interaction.type === 'rated' && interaction.rating) {
      await performanceTracker.trackRecommendationRating(
        recommendationId,
        userId,
        interaction.rating,
        interaction.feedback
      );
    }

    // Update user profile based on interaction
    if (interaction.type === 'bookmarked' || interaction.type === 'shared' || interaction.type === 'clicked') {
      await recommendationEngine.trackUserInteraction(userId, {
        bookmarkId: recommendationId,
        action: interaction.type === 'bookmarked' ? 'favorite' : 
                interaction.type === 'shared' ? 'share' : 'view',
        duration: interaction.duration
      });
    }

    logger.info('Recommendation interaction tracked successfully', {
      userId,
      recommendationId,
      interactionType: interaction.type
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Interaction tracked successfully',
        recommendationId,
        interactionType: interaction.type,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to track recommendation interaction', error as Error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Failed to track interaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}  