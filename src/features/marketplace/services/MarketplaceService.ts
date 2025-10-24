import { 
  Listing, 
  ListingFilters, 
  PaginatedResponse, 
  CreateListingDTO, 
  UpdateListingDTO,
  ListingResponse,
  SellerStats,
  MARKETPLACE_CONFIG
} from '../models';

export class MarketplaceService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/marketplace') {
    this.baseUrl = baseUrl;
  }

  // Listings Management
  async getListings(
    filters: ListingFilters = {}, 
    page: number = 1, 
    limit: number = 20
  ): Promise<PaginatedResponse<ListingResponse>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      )
    });

    const response = await fetch(`${this.baseUrl}/listings?${params}`);
    if (!response.ok) throw new Error('Failed to fetch listings');
    return response.json();
  }

  async getFeaturedListings(limit: number = 10): Promise<ListingResponse[]> {
    const response = await fetch(`${this.baseUrl}/listings/featured?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch featured listings');
    const data = await response.json();
    return data.data;
  }

  async getListingById(id: string): Promise<ListingResponse> {
    const response = await fetch(`${this.baseUrl}/listings/${id}`);
    if (!response.ok) throw new Error('Failed to fetch listing');
    const data = await response.json();
    return data.data;
  }

  async createListing(listing: CreateListingDTO): Promise<Listing> {
    const response = await fetch(`${this.baseUrl}/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listing)
    });
    if (!response.ok) throw new Error('Failed to create listing');
    const data = await response.json();
    return data.data;
  }

  async updateListing(id: string, updates: UpdateListingDTO): Promise<Listing> {
    const response = await fetch(`${this.baseUrl}/listings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update listing');
    const data = await response.json();
    return data.data;
  }

  async deleteListing(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/listings/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete listing');
  }

  // Search functionality
  async searchListings(query: string, filters: ListingFilters = {}): Promise<ListingResponse[]> {
    const searchFilters = { ...filters, search: query };
    const result = await this.getListings(searchFilters, 1, 50);
    return result.data;
  }

  // Categories and filters
  async getCategories(): Promise<{ category: string; count: number }[]> {
    const response = await fetch(`${this.baseUrl}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    const data = await response.json();
    return data.data;
  }

  async getTags(limit: number = 100): Promise<{ tag: string; count: number }[]> {
    const response = await fetch(`${this.baseUrl}/tags?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch tags');
    const data = await response.json();
    return data.data;
  }

  // Seller functionality
  async getSellerListings(sellerId: string, page: number = 1): Promise<PaginatedResponse<ListingResponse>> {
    return this.getListings({ sellerId }, page);
  }

  async getSellerStats(sellerId: string): Promise<SellerStats> {
    const response = await fetch(`${this.baseUrl}/sellers/${sellerId}/stats`);
    if (!response.ok) throw new Error('Failed to fetch seller stats');
    const data = await response.json();
    return data.data;
  }

  // Utility methods
  formatPrice(priceCents: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(priceCents / 100);
  }

  validateListing(listing: CreateListingDTO): string[] {
    const errors: string[] = [];

    if (!listing.title || listing.title.length > MARKETPLACE_CONFIG.MAX_TITLE_LENGTH) {
      errors.push(`Title must be between 1 and ${MARKETPLACE_CONFIG.MAX_TITLE_LENGTH} characters`);
    }

    if (!listing.description || listing.description.length > MARKETPLACE_CONFIG.MAX_DESCRIPTION_LENGTH) {
      errors.push(`Description must be between 1 and ${MARKETPLACE_CONFIG.MAX_DESCRIPTION_LENGTH} characters`);
    }

    if (listing.priceCents < MARKETPLACE_CONFIG.MIN_PRICE_CENTS || 
        listing.priceCents > MARKETPLACE_CONFIG.MAX_PRICE_CENTS) {
      errors.push(`Price must be between ${this.formatPrice(MARKETPLACE_CONFIG.MIN_PRICE_CENTS)} and ${this.formatPrice(MARKETPLACE_CONFIG.MAX_PRICE_CENTS)}`);
    }

    if (!MARKETPLACE_CONFIG.CATEGORIES.includes(listing.category as any)) {
      errors.push('Invalid category');
    }

    if (listing.tags.length > MARKETPLACE_CONFIG.MAX_TAGS) {
      errors.push(`Maximum ${MARKETPLACE_CONFIG.MAX_TAGS} tags allowed`);
    }

    if (!listing.bookmarkData?.url) {
      errors.push('Bookmark URL is required');
    }

    return errors;
  }
}