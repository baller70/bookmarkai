import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Mock data for demonstration - replace with actual database calls
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
      favicon: 'https://developer.mozilla.org/favicon.ico'
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
  },
  {
    id: '2',
    sellerId: 'seller2',
    title: 'Design Inspiration Collection',
    description: 'Curated design galleries, inspiration sites, and creative resources.',
    thumbnail: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=500',
    priceCents: 1999,
    currency: 'USD',
    category: 'design',
    tags: ['design', 'inspiration', 'ui-ux'],
    bookmarkData: {
      url: 'https://dribbble.com',
      title: 'Dribbble',
      description: 'Design inspiration and portfolios',
      favicon: 'https://dribbble.com/favicon.ico'
    },
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    ratingAvg: 4.6,
    ratingCount: 18,
    isActive: true,
    seller: {
      id: 'seller2',
      name: 'Sarah Designer',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5c4?w=100'
    }
  }
];

const createListingSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  thumbnail: z.string().url(),
  priceCents: z.number().min(100).max(100000),
  currency: z.string().default('USD'),
  category: z.enum(['productivity', 'development', 'design', 'marketing', 'research', 'entertainment', 'education', 'other']),
  tags: z.array(z.string()).max(10),
  bookmarkData: z.object({
    url: z.string().url(),
    title: z.string(),
    description: z.string().optional(),
    favicon: z.string().optional(),
    metadata: z.record(z.any()).optional()
  })
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined;
    const minRating = searchParams.get('minRating') ? parseInt(searchParams.get('minRating')!) : undefined;

    // Filter listings based on query parameters
    let filteredListings = [...mockListings];

    if (search) {
      filteredListings = filteredListings.filter(listing =>
        listing.title.toLowerCase().includes(search.toLowerCase()) ||
        listing.description.toLowerCase().includes(search.toLowerCase()) ||
        listing.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      );
    }

    if (category) {
      filteredListings = filteredListings.filter(listing => listing.category === category);
    }

    if (minPrice !== undefined) {
      filteredListings = filteredListings.filter(listing => listing.priceCents >= minPrice);
    }

    if (maxPrice !== undefined) {
      filteredListings = filteredListings.filter(listing => listing.priceCents <= maxPrice);
    }

    if (minRating !== undefined) {
      filteredListings = filteredListings.filter(listing => listing.ratingAvg >= minRating);
    }

    // Pagination
    const total = filteredListings.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedListings = filteredListings.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedListings,
      total,
      page,
      limit,
      totalPages
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createListingSchema.parse(body);

    // TODO: Get user ID from authentication
    const userId = 'current-user-id';

    // Create new listing
    const newListing = {
      id: Date.now().toString(),
      sellerId: userId,
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date(),
      ratingAvg: 0,
      ratingCount: 0,
      isActive: true
    };

    // TODO: Save to database
    console.log('Creating new listing:', newListing);

    return NextResponse.json({
      success: true,
      data: newListing
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}