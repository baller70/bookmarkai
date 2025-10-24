import { Review, CreateReviewDTO, PaginatedResponse } from '../models';

export class ReviewService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/marketplace') {
    this.baseUrl = baseUrl;
  }

  async createReview(reviewData: CreateReviewDTO): Promise<Review> {
    const response = await fetch(`${this.baseUrl}/listings/${reviewData.listingId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create review');
    }
    
    const data = await response.json();
    return data.data;
  }

  async getListingReviews(
    listingId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResponse<Review>> {
    const response = await fetch(
      `${this.baseUrl}/listings/${listingId}/reviews?page=${page}&limit=${limit}`
    );
    if (!response.ok) throw new Error('Failed to fetch reviews');
    return response.json();
  }

  async getUserReviews(page: number = 1, limit: number = 20): Promise<PaginatedResponse<Review>> {
    const response = await fetch(`${this.baseUrl}/reviews?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch user reviews');
    return response.json();
  }

  async updateReview(reviewId: string, updates: Partial<CreateReviewDTO>): Promise<Review> {
    const response = await fetch(`${this.baseUrl}/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update review');
    const data = await response.json();
    return data.data;
  }

  async deleteReview(reviewId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/reviews/${reviewId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete review');
  }

  renderStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  calculateAverageRating(reviews: Review[]): number {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }

  getRatingDistribution(reviews: Review[]): Record<number, number> {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  }
}