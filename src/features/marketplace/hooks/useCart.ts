'use client'

import { useState, useCallback, useEffect } from 'react';
import { ListingResponse } from '../models';

interface CartItem {
  listing: ListingResponse;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  count: number;
}

const CART_STORAGE_KEY = 'marketplace_cart';

export function useCart() {
  const [cart, setCart] = useState<CartState>({
    items: [],
    total: 0,
    count: 0
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    // Check if we're in the browser before accessing localStorage
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setCart(parsedCart);
        } catch (err) {
          console.error('Failed to parse saved cart:', err);
          localStorage.removeItem(CART_STORAGE_KEY);
        }
      }
      setIsLoaded(true);
    }
  }, []);

  // Save cart to localStorage whenever it changes (only after initial load)
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  const calculateTotals = useCallback((items: CartItem[]) => {
    const total = items.reduce((sum, item) => sum + (item.listing.priceCents * item.quantity), 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    return { total, count };
  }, []);

  const addToCart = useCallback((listing: ListingResponse, quantity: number = 1) => {
    setCart(prev => {
      const existingItemIndex = prev.items.findIndex(item => item.listing.id === listing.id);
      let newItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Update existing item
        newItems = [...prev.items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + quantity
        };
      } else {
        // Add new item
        newItems = [...prev.items, { listing, quantity }];
      }

      const { total, count } = calculateTotals(newItems);
      return { items: newItems, total, count };
    });
  }, [calculateTotals]);

  const removeFromCart = useCallback((listingId: string) => {
    setCart(prev => {
      const newItems = prev.items.filter(item => item.listing.id !== listingId);
      const { total, count } = calculateTotals(newItems);
      return { items: newItems, total, count };
    });
  }, [calculateTotals]);

  const updateQuantity = useCallback((listingId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(listingId);
      return;
    }

    setCart(prev => {
      const newItems = prev.items.map(item =>
        item.listing.id === listingId ? { ...item, quantity } : item
      );
      const { total, count } = calculateTotals(newItems);
      return { items: newItems, total, count };
    });
  }, [calculateTotals, removeFromCart]);

  const clearCart = useCallback(() => {
    setCart({ items: [], total: 0, count: 0 });
  }, []);

  const isInCart = useCallback((listingId: string) => {
    return cart.items.some(item => item.listing.id === listingId);
  }, [cart.items]);

  const getItemQuantity = useCallback((listingId: string) => {
    const item = cart.items.find(item => item.listing.id === listingId);
    return item?.quantity || 0;
  }, [cart.items]);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
    getItemQuantity,
    isEmpty: cart.items.length === 0,
    itemCount: cart.count,
    totalPrice: cart.total
  };
}