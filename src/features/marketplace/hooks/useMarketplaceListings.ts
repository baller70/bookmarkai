'use client'

import { useState, useEffect, useCallback } from 'react';
import { ListingResponse, ListingFilters, PaginatedResponse } from '../models';
import { MarketplaceService } from '../services/MarketplaceService';

const marketplaceService = new MarketplaceService();

export function useMarketplaceListings(
  initialFilters: ListingFilters = {},
  initialPage: number = 1,
  limit: number = 20
) {
  const [listings, setListings] = useState<ListingResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ListingFilters>(initialFilters);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response: PaginatedResponse<ListingResponse> = await marketplaceService.getListings(
        filters,
        page,
        limit
      );
      
      setListings(response.data);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const updateFilters = useCallback((newFilters: Partial<ListingFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page when filters change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  }, [page, totalPages]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  }, [page]);

  const goToPage = useCallback((pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setPage(pageNumber);
    }
  }, [totalPages]);

  const refresh = useCallback(() => {
    fetchListings();
  }, [fetchListings]);

  return {
    listings,
    loading,
    error,
    filters,
    page,
    totalPages,
    total,
    updateFilters,
    clearFilters,
    nextPage,
    prevPage,
    goToPage,
    refresh,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
}