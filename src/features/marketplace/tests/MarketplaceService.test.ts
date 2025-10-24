// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarketplaceService } from '../services/MarketplaceService';
import { CreateListingDTO, MARKETPLACE_CONFIG } from '../models';

// Mock the global fetch function
beforeEach(() => {
  global.fetch = vi.fn() as any;
});

describe('MarketplaceService', () => {
  let service: MarketplaceService;

  beforeEach(() => {
    service = new MarketplaceService();
    vi.clearAllMocks();
  });

  describe('getListings', () => {
    it('should fetch listings with default parameters', async () => {
      const mockResponse = {
        success: true,
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.getListings();

      expect(fetch).toHaveBeenCalledWith('/api/marketplace/listings?page=1&limit=20');
      expect(result).toEqual(mockResponse);
    });

    it('should apply filters correctly', async () => {
      const filters = {
        search: 'web development',
        category: 'development' as const,
        minPrice: 1000,
        maxPrice: 5000
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] })
      });

      await service.getListings(filters, 2, 10);

      expect(fetch).toHaveBeenCalledWith(
        '/api/marketplace/listings?page=2&limit=10&search=web+development&category=development&minPrice=1000&maxPrice=5000'
      );
    });
  });

  describe('validateListing', () => {
    const validListing: CreateListingDTO = {
      title: 'Test Listing',
      description: 'A test listing description',
      thumbnail: 'https://example.com/image.jpg',
      priceCents: 2000,
      currency: 'USD',
      category: 'development',
      tags: ['test', 'example'],
      bookmarkData: {
        url: 'https://example.com',
        title: 'Example Site'
      }
    };

    it('should validate a correct listing', () => {
      const errors = service.validateListing(validListing);
      expect(errors).toHaveLength(0);
    });

    it('should reject listing with empty title', () => {
      const invalidListing = { ...validListing, title: '' };
      const errors = service.validateListing(invalidListing);
      expect(errors).toContain('Title must be between 1 and 100 characters');
    });

    it('should reject listing with title too long', () => {
      const invalidListing = { 
        ...validListing, 
        title: 'a'.repeat(MARKETPLACE_CONFIG.MAX_TITLE_LENGTH + 1) 
      };
      const errors = service.validateListing(invalidListing);
      expect(errors).toContain('Title must be between 1 and 100 characters');
    });

    it('should reject listing with price too low', () => {
      const invalidListing = { 
        ...validListing, 
        priceCents: MARKETPLACE_CONFIG.MIN_PRICE_CENTS - 1 
      };
      const errors = service.validateListing(invalidListing);
      expect(errors).toContain(expect.stringContaining('Price must be between'));
    });

    it('should reject listing with too many tags', () => {
      const invalidListing = { 
        ...validListing, 
        tags: Array(MARKETPLACE_CONFIG.MAX_TAGS + 1).fill('tag') 
      };
      const errors = service.validateListing(invalidListing);
      expect(errors).toContain('Maximum 10 tags allowed');
    });

    it('should reject listing without bookmark URL', () => {
      const invalidListing = { 
        ...validListing, 
        bookmarkData: { ...validListing.bookmarkData, url: '' } 
      };
      const errors = service.validateListing(invalidListing);
      expect(errors).toContain('Bookmark URL is required');
    });
  });

  describe('formatPrice', () => {
    it('should format price correctly', () => {
      expect(service.formatPrice(2500, 'USD')).toBe('$25.00');
      expect(service.formatPrice(999, 'USD')).toBe('$9.99');
      expect(service.formatPrice(100, 'USD')).toBe('$1.00');
    });
  });
});