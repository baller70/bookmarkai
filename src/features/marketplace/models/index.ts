// Database Models and Types for Bookmark Marketplace

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  thumbnail: string;
  priceCents: number;
  currency: string;
  category: string;
  tags: string[];
  bookmarkData: BookmarkData;
  createdAt: Date;
  updatedAt: Date;
  ratingAvg: number;
  ratingCount: number;
  isActive: boolean;
  seller?: User;
  reviews?: Review[];
}

export interface BookmarkData {
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  screenshot?: string;
  metadata?: Record<string, any>;
  collection?: BookmarkCollection;
}

export interface BookmarkCollection {
  name: string;
  bookmarks: BookmarkData[];
  totalCount: number;
}

export interface Order {
  id: string;
  buyerId: string;
  listingId: string;
  totalCents: number;
  currency: string;
  status: OrderStatus;
  paymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
  buyer?: User;
  listing?: Listing;
}

export interface Review {
  id: string;
  userId: string;
  listingId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  user?: User;
}

export interface Payout {
  id: string;
  sellerId: string;
  amountCents: number;
  currency: string;
  status: PayoutStatus;
  stripeTransferId?: string;
  createdAt: Date;
  updatedAt: Date;
  seller?: User;
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
export type PayoutStatus = 'requested' | 'processing' | 'paid' | 'failed';
export type ListingCategory = 'productivity' | 'development' | 'design' | 'marketing' | 'research' | 'entertainment' | 'education' | 'other';

// DTOs and Request/Response Types
export interface CreateListingDTO {
  title: string;
  description: string;
  thumbnail: string;
  priceCents: number;
  currency: string;
  category: ListingCategory;
  tags: string[];
  bookmarkData: BookmarkData;
}

export interface UpdateListingDTO {
  title?: string;
  description?: string;
  thumbnail?: string;
  priceCents?: number;
  category?: ListingCategory;
  tags?: string[];
  isActive?: boolean;
}

export interface ListingFilters {
  search?: string;
  category?: ListingCategory;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  tags?: string[];
  sellerId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateOrderDTO {
  listingId: string;
  paymentMethodId: string;
}

export interface CreateReviewDTO {
  listingId: string;
  rating: number;
  comment?: string;
}

export interface PayoutRequestDTO {
  amountCents: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ListingResponse {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  thumbnail: string;
  priceCents: number;
  currency: string;
  category: string;
  tags: string[];
  bookmarkData: BookmarkData;
  createdAt: Date;
  updatedAt: Date;
  ratingAvg: number;
  ratingCount: number;
  isActive: boolean;
  seller: Pick<User, 'id' | 'name' | 'avatar'>;
  reviewsCount: number;
  recentReviews: Review[];
}

export interface SellerStats {
  totalListings: number;
  activeListings: number;
  totalSales: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
}

// Marketplace Configuration
export const MARKETPLACE_CONFIG = {
  COMMISSION_RATE: 0.05, // 5% commission
  MIN_PRICE_CENTS: 100, // $1.00 minimum
  MAX_PRICE_CENTS: 100000, // $1000.00 maximum
  PAYOUT_THRESHOLD_CENTS: 2000, // $20.00 minimum payout
  SUPPORTED_CURRENCIES: ['USD', 'EUR', 'GBP'],
  CATEGORIES: [
    'productivity',
    'development',
    'design',
    'marketing',
    'research',
    'entertainment',
    'education',
    'other'
  ] as const,
  MAX_TAGS: 10,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
} as const;