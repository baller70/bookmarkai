import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Mock data for demonstration - replace with actual database calls
const mockOrders = [
  {
    id: '1',
    buyerId: 'buyer1',
    listingId: '1',
    totalCents: 2999,
    currency: 'USD',
    status: 'completed',
    paymentIntentId: 'pi_1234567890',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    listing: {
      id: '1',
      title: 'Ultimate Web Development Resources',
      thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500'
    }
  }
];

const createOrderSchema = z.object({
  listingId: z.string().uuid(),
  paymentMethodId: z.string()
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    
    // TODO: Get user ID from authentication
    const userId = 'current-user-id';

    // Filter orders for current user
    let filteredOrders = mockOrders.filter(order => order.buyerId === userId);

    if (status) {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }

    // Pagination
    const total = filteredOrders.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedOrders = filteredOrders.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedOrders,
      total,
      page,
      limit,
      totalPages
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    // TODO: Get user ID from authentication
    const userId = 'current-user-id';

    // Create new order
    const newOrder = {
      id: Date.now().toString(),
      buyerId: userId,
      ...validatedData,
      totalCents: 2999, // TODO: Get from listing
      currency: 'USD',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // TODO: Process payment with Stripe
    // TODO: Save to database

    console.log('Creating new order:', newOrder);

    return NextResponse.json({
      success: true,
      data: newOrder
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
} 