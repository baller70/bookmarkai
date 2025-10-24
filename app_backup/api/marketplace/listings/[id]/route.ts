import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Mock data for demonstration
const mockListings = [
  {
    id: '1',
    sellerId: 'seller1',
    title: 'Ultimate Web Development Resources',
    description: 'A comprehensive collection of web development tools, tutorials, and resources.',
    thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500',
    priceCents: 2999,
    currency: 'USD',
    category: 'development',
    tags: ['web-dev', 'coding', 'tutorials'],
    bookmarkData: {
      url: 'https://developer.mozilla.org',
      title: 'MDN Web Docs',
      description: 'The best place to learn web development',
      favicon: 'https://developer.mozilla.org/favicon.ico',
      collection: {
        name: 'Web Development Essentials',
        bookmarks: [
          {
            url: 'https://developer.mozilla.org',
            title: 'MDN Web Docs',
            description: 'The best place to learn web development'
          },
          {
            url: 'https://stackoverflow.com',
            title: 'Stack Overflow',
            description: 'Developer Q&A community'
          }
        ],
        totalCount: 25
      }
    },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    ratingAvg: 4.8,
    ratingCount: 24,
    isActive: true,
    seller: {
      id: 'seller1',
      name: 'John Developer',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'
    }
  }
];

const updateListingSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(1000).optional(),
  thumbnail: z.string().url().optional(),
  priceCents: z.number().min(100).max(100000).optional(),
  category: z.enum(['productivity', 'development', 'design', 'marketing', 'research', 'entertainment', 'education', 'other']).optional(),
  tags: z.array(z.string()).max(10).optional(),
  isActive: z.boolean().optional()
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await context.params;
  try {
    const listingId = resolvedParams.id;
    
    // Find listing by ID
    const listing = mockListings.find(l => l.id === listingId);
    
    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // TODO: Fetch reviews for this listing
    const mockReviews = [
      {
        id: '1',
        userId: 'user1',
        listingId: listingId,
        rating: 5,
        comment: 'Excellent collection of resources!',
        createdAt: new Date('2024-01-18'),
        user: {
          id: 'user1',
          name: 'Alice Smith',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5c4?w=100'
        }
      }
    ];

    const listingWithReviews = {
      ...listing,
      reviews: mockReviews,
      reviewsCount: mockReviews.length
    };

    return NextResponse.json({
      success: true,
      data: listingWithReviews
    });
  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await context.params;
  try {
    const listingId = resolvedParams.id;
    const body = await request.json();
    const validatedData = updateListingSchema.parse(body);

    // TODO: Get user ID from authentication and verify ownership
    const userId = 'current-user-id';

    // Find listing
    const listing = mockListings.find(l => l.id === listingId);
    
    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (listing.sellerId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update listing
    const updatedListing = {
      ...listing,
      ...validatedData,
      updatedAt: new Date()
    };

    // TODO: Save to database

    return NextResponse.json({
      success: true,
      data: updatedListing
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await context.params;
  try {
    const listingId = resolvedParams.id;
    
    // TODO: Get user ID from authentication and verify ownership
    const userId = 'current-user-id';

    // Find listing
    const listing = mockListings.find(l => l.id === listingId);
    
    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (listing.sellerId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // TODO: Delete from database (soft delete by setting isActive = false)
    
    return NextResponse.json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete listing' },
      { status: 500 }
    );
  }
} 