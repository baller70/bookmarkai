'use client'

import { useState, useEffect, useCallback } from 'react';
import { ListingResponse, Review, PaginatedResponse } from '../models';
import { MarketplaceService } from '../services/MarketplaceService';
import { ReviewService } from '../services/ReviewService';

const marketplaceService = new MarketplaceService();
const reviewService = new ReviewService();

export function useListingDetail(listingId: string) {
  const [listing, setListing] = useState<ListingResponse | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);

  const fetchListing = useCallback(async () => {
    if (!listingId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const listingData = await marketplaceService.getListingById(listingId);
      setListing(listingData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch listing');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  const fetchReviews = useCallback(async (page: number = 1) => {
    if (!listingId) return;
    
    setReviewsLoading(true);
    
    try {
      const response: PaginatedResponse<Review> = await reviewService.getListingReviews(
        listingId,
        page,
        10
      );
      
      if (page === 1) {
        setReviews(response.data);
      } else {
        setReviews(prev => [...prev, ...response.data]);
      }
      
      setTotalReviews(response.total);
      setReviewsPage(page);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchListing();
    fetchReviews(1);
  }, [fetchListing, fetchReviews]);

  const loadMoreReviews = useCallback(() => {
    if (!reviewsLoading && reviews.length < totalReviews) {
      fetchReviews(reviewsPage + 1);
    }
  }, [reviewsLoading, reviews.length, totalReviews, reviewsPage, fetchReviews]);

  const refresh = useCallback(() => {
    fetchListing();
    fetchReviews(1);
  }, [fetchListing, fetchReviews]);

  return {
    listing,
    reviews,
    loading,
    reviewsLoading,
    error,
    totalReviews,
    hasMoreReviews: reviews.length < totalReviews,
    loadMoreReviews,
    refresh
  };
}