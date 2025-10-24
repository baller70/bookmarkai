// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { X, CreditCard, Shield, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ListingResponse } from '../models';
import { usePayment } from '../hooks/usePayment';
import { MarketplaceService } from '../services/MarketplaceService';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
const marketplaceService = new MarketplaceService();

interface PurchaseModalProps {
  listing: ListingResponse;
  onClose: () => void;
}

function PurchaseForm({ listing, onClose }: PurchaseModalProps) {
  const { createOrder, confirmPayment, processing, succeeded, error, canPay } = usePayment();
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US'
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canPay) return;

    try {
      // Create order first
      await createOrder({
        listingId: listing.id,
        paymentMethodId: 'temp' // Will be replaced by Stripe
      });

      // Confirm payment
      await confirmPayment(billingDetails);
    } catch (err) {
      console.error('Payment failed:', err);
    }
  };

  if (succeeded) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Purchase Successful!
        </h3>
        <p className="text-gray-600 mb-6">
          You'll receive an email with your bookmark collection shortly.
        </p>
        <Button onClick={onClose}>Close</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <img
              src={listing.thumbnail}
              alt={listing.title}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h4 className="font-medium">{listing.title}</h4>
              <p className="text-sm text-gray-600 line-clamp-2">
                {listing.description}
              </p>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                {marketplaceService.formatPrice(listing.priceCents, listing.currency)}
              </div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{marketplaceService.formatPrice(listing.priceCents, listing.currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Processing Fee</span>
              <span>$0.00</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{marketplaceService.formatPrice(listing.priceCents, listing.currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={billingDetails.name}
                onChange={(e) => setBillingDetails(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={billingDetails.email}
                onChange={(e) => setBillingDetails(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={billingDetails.address.line1}
              onChange={(e) => setBillingDetails(prev => ({
                ...prev,
                address: { ...prev.address, line1: e.target.value }
              }))}
              required
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={billingDetails.address.city}
                onChange={(e) => setBillingDetails(prev => ({
                  ...prev,
                  address: { ...prev.address, city: e.target.value }
                }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={billingDetails.address.state}
                onChange={(e) => setBillingDetails(prev => ({
                  ...prev,
                  address: { ...prev.address, state: e.target.value }
                }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                value={billingDetails.address.postal_code}
                onChange={(e) => setBillingDetails(prev => ({
                  ...prev,
                  address: { ...prev.address, postal_code: e.target.value }
                }))}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
        <Shield className="h-5 w-5 text-green-600" />
        <div className="text-sm">
          <p className="font-medium text-green-800">Secure Payment</p>
          <p className="text-green-600">Your payment information is encrypted and secure</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!canPay || processing}
          className="flex-1"
        >
          {processing ? 'Processing...' : `Pay ${marketplaceService.formatPrice(listing.priceCents, listing.currency)}`}
        </Button>
      </div>
    </form>
  );
}

export function PurchaseModal({ listing, onClose }: PurchaseModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Complete Your Purchase
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <Elements stripe={stripePromise}>
          <PurchaseForm listing={listing} onClose={onClose} />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}