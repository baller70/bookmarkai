'use client';

import React, { useState } from 'react';
import { X, DollarSign, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaymentService } from '../services/PaymentService';
import { MARKETPLACE_CONFIG } from '../models';

const paymentService = new PaymentService(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface PayoutModalProps {
  availableBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function PayoutModal({ availableBalance, onClose, onSuccess }: PayoutModalProps) {
  const [amount, setAmount] = useState(availableBalance);
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxAmount = availableBalance;
  const minAmount = MARKETPLACE_CONFIG.PAYOUT_THRESHOLD_CENTS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (amount < minAmount) {
      setError(`Minimum payout amount is $${(minAmount / 100).toFixed(2)}`);
      return;
    }

    if (amount > maxAmount) {
      setError(`Maximum payout amount is $${(maxAmount / 100).toFixed(2)}`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await paymentService.requestPayout({
        amountCents: amount
      });
      
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request payout');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Request Payout
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Available Balance */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Available Balance</p>
                  <p className="text-2xl font-bold text-green-900">
                    ${(availableBalance / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payout Amount */}
          <div>
            <Label htmlFor="amount">Payout Amount</Label>
            <div className="mt-1 relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </div>
              <Input
                id="amount"
                type="number"
                min={minAmount / 100}
                max={maxAmount / 100}
                step="0.01"
                value={amount / 100}
                onChange={(e) => setAmount(Math.round(parseFloat(e.target.value) * 100))}
                className="pl-8"
                required
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Min: ${(minAmount / 100).toFixed(2)}</span>
              <span>Max: ${(maxAmount / 100).toFixed(2)}</span>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAmount(Math.min(2000, maxAmount))} // $20
            >
              $20
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAmount(Math.min(5000, maxAmount))} // $50
            >
              $50
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAmount(maxAmount)}
            >
              All
            </Button>
          </div>

          {/* Payout Method */}
          <div>
            <Label htmlFor="payout-method">Payout Method</Label>
            <Select value={payoutMethod} onValueChange={setPayoutMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Bank Transfer
                  </div>
                </SelectItem>
                <SelectItem value="paypal" disabled>
                  PayPal (Coming Soon)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Processing Info */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Processing Information</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Payouts are processed within 2-3 business days</li>
              <li>• You'll receive an email confirmation once processed</li>
              <li>• A 2.9% processing fee will be deducted</li>
            </ul>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Summary */}
          <div className="border-t pt-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Payout Amount:</span>
                <span>${(amount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Processing Fee (2.9%):</span>
                <span>-${((amount * 0.029) / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>You'll Receive:</span>
                <span>${((amount * 0.971) / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || amount < minAmount || amount > maxAmount}
              className="flex-1"
            >
              {submitting ? 'Processing...' : 'Request Payout'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}