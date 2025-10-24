import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createPaymentIntentSchema = z.object({
  listingId: z.string().uuid(),
  paymentMethodId: z.string().optional()
});

const createConnectAccountSchema = z.object({
  email: z.string().email(),
  country: z.string().length(2)
});

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'create-intent') {
      return await createPaymentIntent(request);
    } else if (action === 'create-connect-account') {
      return await createConnectAccount(request);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in payments API:', error);
    return NextResponse.json(
      { success: false, error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}

async function createPaymentIntent(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createPaymentIntentSchema.parse(body);

    // TODO: Get listing details from database
    const mockListing = {
      id: validatedData.listingId,
      priceCents: 2999,
      currency: 'USD',
      sellerId: 'seller1'
    };

    // TODO: Initialize Stripe and create payment intent
    const paymentIntent = {
      id: 'pi_' + Date.now(),
      client_secret: 'pi_' + Date.now() + '_secret_' + Math.random().toString(36).substr(2, 9),
      amount: mockListing.priceCents,
      currency: mockListing.currency.toLowerCase()
    };

    return NextResponse.json({
      success: true,
      data: {
        paymentIntent,
        listing: mockListing
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    throw error;
  }
}

async function createConnectAccount(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createConnectAccountSchema.parse(body);

    // TODO: Create Stripe Connect account
    const connectAccount = {
      id: 'acct_' + Date.now(),
      email: validatedData.email,
      country: validatedData.country,
      details_submitted: false,
      charges_enabled: false,
      payouts_enabled: false
    };

    return NextResponse.json({
      success: true,
      data: connectAccount
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    throw error;
  }
} 