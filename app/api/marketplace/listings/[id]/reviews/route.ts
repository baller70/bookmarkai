import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Mock data for demonstration
const mockReviews = [
  {
    id: '1',
    userId: 'user1',
    listingId: '1',
    rating: 5,
    comment: 'Excellent collection of resources! Very well organized and comprehensive.',
    createdAt: new Date('2024-01-18'),
    user: {
      id: 'user1',
      name: 'Alice Smith',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5c4?w=100'
    }
  },
  {
    id: '2',
    userId: 'user2',
    listingId: '1',
    rating: 4,
    comment: 'Great bookmarks, saved me a lot of research time.',
    createdAt: new Date('2024-01-16'),
    user: {
      id: 'user2',
      name: 'Bob Johnson',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'
    }
  }
];

const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1).max(500).optional()
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const listingId = params.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Filter reviews for this listing
    const listingReviews = mockReviews.filter(review => review.listingId === listingId);

    // Pagination
    const total = listingReviews.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedReviews = listingReviews.slice(offset, offset + limit);

    // Calculate rating statistics
    const ratingStats = {
      average: listingReviews.length > 0 ? 
        listingReviews.reduce((sum, review) => sum + review.rating, 0) / listingReviews.length : 0,
      total: listingReviews.length,
      distribution: {
        5: listingReviews.filter(r => r.rating === 5).length,
        4: listingReviews.filter(r => r.rating === 4).length,
        3: listingReviews.filter(r => r.rating === 3).length,
        2: listingReviews.filter(r => r.rating === 2).length,
        1: listingReviews.filter(r => r.rating === 1).length,
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        reviews: paginatedReviews,
        stats: ratingStats,
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const listingId = params.id;
    const body = await request.json();
    const validatedData = createReviewSchema.parse(body);

    // TODO: Get user ID from authentication
    const userId = 'current-user-id';

    // Check if user has already reviewed this listing
    const existingReview = mockReviews.find(
      review => review.listingId === listingId && review.userId === userId
    );

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'You have already reviewed this listing' },
        { status: 400 }
      );
    }

    // TODO: Verify user has purchased this listing

    // Create new review
    const newReview = {
      id: Date.now().toString(),
      userId,
      listingId,
      ...validatedData,
      createdAt: new Date(),
      user: {
        id: userId,
        name: 'Current User',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'
      }
    };

    // TODO: Save to database
    // TODO: Update listing rating average

    return NextResponse.json({
      success: true,
      data: newReview
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create review' },
      { status: 500 }
    );
  }
} 