// @ts-nocheck
'use client'

import { useState, useCallback } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Order, CreateOrderDTO } from '../models';
import { OrderService } from '../services/OrderService';
import { PaymentService } from '../services/PaymentService';

const orderService = new OrderService();

interface PaymentState {
  processing: boolean;
  succeeded: boolean;
  error: string | null;
  clientSecret: string | null;
  order: Order | null;
}

export function usePayment() {
  const stripe = useStripe();
  const elements = useElements();
  
  const [paymentState, setPaymentState] = useState<PaymentState>({
    processing: false,
    succeeded: false,
    error: null,
    clientSecret: null,
    order: null
  });

  const createOrder = useCallback(async (orderData: CreateOrderDTO) => {
    setPaymentState(prev => ({ ...prev, processing: true, error: null }));
    
    try {
      const result = await orderService.createOrder(orderData);
      
      setPaymentState(prev => ({
        ...prev,
        order: result.order,
        clientSecret: result.clientSecret,
        processing: false
      }));
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create order';
      setPaymentState(prev => ({ ...prev, error, processing: false }));
      throw err;
    }
  }, []);

  const confirmPayment = useCallback(async (billingDetails: any = {}) => {
    if (!stripe || !elements || !paymentState.clientSecret) {
      throw new Error('Stripe not ready or no payment intent');
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      throw new Error('Card element not found');
    }

    setPaymentState(prev => ({ ...prev, processing: true, error: null }));

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        paymentState.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: billingDetails
          }
        }
      );

      if (error) {
        setPaymentState(prev => ({
          ...prev,
          error: error.message || 'Payment failed',
          processing: false
        }));
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        setPaymentState(prev => ({
          ...prev,
          succeeded: true,
          processing: false
        }));
        return paymentIntent;
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Payment failed';
      setPaymentState(prev => ({ ...prev, error, processing: false }));
      throw err;
    }
  }, [stripe, elements, paymentState.clientSecret]);

  const reset = useCallback(() => {
    setPaymentState({
      processing: false,
      succeeded: false,
      error: null,
      clientSecret: null,
      order: null
    });
  }, []);

  return {
    ...paymentState,
    createOrder,
    confirmPayment,
    reset,
    canPay: !!stripe && !!elements && !!paymentState.clientSecret && !paymentState.processing
  };
}