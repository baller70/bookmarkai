import { loadStripe, Stripe } from '@stripe/stripe-js';
import { PayoutRequestDTO, Payout } from '../models';

export class PaymentService {
  private stripe: Promise<Stripe | null>;
  private baseUrl: string;

  constructor(stripePublishableKey: string, baseUrl: string = '/api/marketplace') {
    this.stripe = loadStripe(stripePublishableKey);
    this.baseUrl = baseUrl;
  }

  async createPaymentIntent(orderId: string): Promise<{ clientSecret: string }> {
    const response = await fetch(`${this.baseUrl}/payments/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create payment intent');
    }
    
    const data = await response.json();
    return data.data;
  }

  async confirmPayment(clientSecret: string, paymentMethodId: string): Promise<any> {
    const stripe = await this.stripe;
    if (!stripe) throw new Error('Stripe not loaded');

    return stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethodId
    });
  }

  async createPaymentMethod(cardElement: any): Promise<any> {
    const stripe = await this.stripe;
    if (!stripe) throw new Error('Stripe not loaded');

    return stripe.createPaymentMethod({
      type: 'card',
      card: cardElement
    });
  }

  // Seller Payouts
  async requestPayout(payoutData: PayoutRequestDTO): Promise<Payout> {
    const response = await fetch(`${this.baseUrl}/payouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payoutData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to request payout');
    }
    
    const data = await response.json();
    return data.data;
  }

  async getPayouts(page: number = 1, limit: number = 20): Promise<{ data: Payout[]; total: number }> {
    const response = await fetch(`${this.baseUrl}/payouts?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch payouts');
    return response.json();
  }

  async getEarnings(): Promise<{ 
    totalEarnings: number; 
    availableBalance: number; 
    pendingBalance: number; 
  }> {
    const response = await fetch(`${this.baseUrl}/payouts/earnings`);
    if (!response.ok) throw new Error('Failed to fetch earnings');
    const data = await response.json();
    return data.data;
  }

  // Stripe Connect for sellers
  async createConnectAccount(): Promise<{ accountId: string; onboardingUrl: string }> {
    const response = await fetch(`${this.baseUrl}/payments/connect-account`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create connect account');
    }
    
    const data = await response.json();
    return data.data;
  }

  async getConnectAccountStatus(): Promise<{ 
    accountId: string; 
    chargesEnabled: boolean; 
    payoutsEnabled: boolean; 
  }> {
    const response = await fetch(`${this.baseUrl}/payments/connect-status`);
    if (!response.ok) throw new Error('Failed to fetch connect status');
    const data = await response.json();
    return data.data;
  }
}