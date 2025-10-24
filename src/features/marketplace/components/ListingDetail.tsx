'use client';

import React, { useState } from 'react';
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  Share2, 
  ExternalLink, 
  User, 
  Calendar,
  Tag,
  Shield,
  MessageCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useListingDetail } from '../hooks/useListingDetail';
import { useCart } from '../hooks/useCart';
import { MarketplaceService } from '../services/MarketplaceService';
import { ReviewService } from '../services/ReviewService';
import { PurchaseModal } from './PurchaseModal';
import { ReviewForm } from './ReviewForm';
import { ReviewList } from './ReviewList';

const marketplaceService = new MarketplaceService();
const reviewService = new ReviewService();

interface ListingDetailProps {
  listingId: string;
}

export function ListingDetail({ listingId }: ListingDetailProps) {
  const { listing, reviews, loading, error, totalReviews, hasMoreReviews, loadMoreReviews } = useListingDetail(listingId);
  const { addToCart, isInCart } = useCart();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-200 rounded-lg h-96"></div>
            <div className="space-y-4">
              <div className="bg-gray-200 rounded h-8 w-3/4"></div>
              <div className="bg-gray-200 rounded h-4 w-full"></div>
              <div className="bg-gray-200 rounded h-4 w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600">{error || 'Listing not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(listing);
  };

  const handleBuyNow = () => {
    setShowPurchaseModal(true);
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Image and Gallery */}
        <div className="lg:col-span-2">
          <div className="sticky top-4">
            <Card className="overflow-hidden">
              <div className="aspect-video bg-gray-100">
                <img
                  src={listing.thumbnail}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-bookmark.png';
                  }}
                />
              </div>
              
              {/* Quick Actions */}
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Heart className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                  
                  {listing.bookmarkData?.url && (
                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href={listing.bookmarkData.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit Site
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - Details and Purchase */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <Badge className="capitalize" variant="secondary">
                  {listing.category}
                </Badge>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    {marketplaceService.formatPrice(listing.priceCents, listing.currency)}
                  </div>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {listing.title}
              </h1>

              <div className="flex items-center gap-2 mb-4">
                {renderStars(listing.ratingAvg)}
                <span className="text-sm text-gray-600">
                  {listing.ratingAvg.toFixed(1)} ({listing.ratingCount} reviews)
                </span>
              </div>

              <p className="text-gray-600 mb-6">
                {listing.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {listing.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Purchase Actions */}
              <div className="space-y-3">
                <Button 
                  onClick={handleBuyNow}
                  size="lg" 
                  className="w-full"
                >
                  Buy Now
                </Button>
                
                <Button 
                  onClick={handleAddToCart}
                  disabled={isInCart(listing.id)}
                  variant="outline" 
                  size="lg" 
                  className="w-full"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {isInCart(listing.id) ? 'In Cart' : 'Add to Cart'}
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">Secure Purchase</span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Protected by our buyer guarantee
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Seller Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Seller Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={listing.seller?.avatar} />
                  <AvatarFallback>
                    {listing.seller?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{listing.seller?.name}</h3>
                  <p className="text-sm text-gray-600">Verified Seller</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Member since:</span>
                  <p className="font-medium">Jan 2024</p>
                </div>
                <div>
                  <span className="text-gray-600">Total sales:</span>
                  <p className="font-medium">156</p>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-4">
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Seller
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-12">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({totalReviews})</TabsTrigger>
            <TabsTrigger value="similar">Similar Items</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Bookmark Collection Details</h3>
                
                {listing.bookmarkData?.collection ? (
                  <div>
                    <p className="text-gray-600 mb-4">
                      This collection contains {listing.bookmarkData.collection.totalCount} carefully curated bookmarks.
                    </p>
                    
                    <div className="space-y-3">
                      {listing.bookmarkData.collection.bookmarks.slice(0, 5).map((bookmark, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          {bookmark.favicon && (
                            <img 
                              src={bookmark.favicon} 
                              alt="" 
                              className="w-4 h-4"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{bookmark.title}</h4>
                            <p className="text-sm text-gray-600 truncate">{bookmark.url}</p>
                          </div>
                        </div>
                      ))}
                      
                      {listing.bookmarkData.collection.totalCount > 5 && (
                        <p className="text-sm text-gray-600 text-center py-2">
                          +{listing.bookmarkData.collection.totalCount - 5} more bookmarks
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    {listing.bookmarkData?.favicon && (
                      <img 
                        src={listing.bookmarkData.favicon} 
                        alt="" 
                        className="w-6 h-6"
                      />
                    )}
                    <div>
                      <h4 className="font-medium">{listing.bookmarkData?.title}</h4>
                      <p className="text-sm text-gray-600">{listing.bookmarkData?.url}</p>
                      {listing.bookmarkData?.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {listing.bookmarkData.description}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Customer Reviews</h3>
                <Button onClick={() => setShowReviewForm(true)}>
                  Write a Review
                </Button>
              </div>
              
              <ReviewList 
                reviews={reviews}
                hasMore={hasMoreReviews}
                onLoadMore={loadMoreReviews}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="similar" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Similar Items</h3>
                <p className="text-gray-600">Similar listings will be shown here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {showPurchaseModal && (
        <PurchaseModal
          listing={listing}
          onClose={() => setShowPurchaseModal(false)}
        />
      )}

      {showReviewForm && (
        <ReviewForm
          listingId={listing.id}
          onClose={() => setShowReviewForm(false)}
          onSuccess={() => {
            setShowReviewForm(false);
            // Refresh reviews
          }}
        />
      )}
    </div>
  );
}