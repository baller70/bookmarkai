'use client';

import React from 'react';
import Link from 'next/link';
import { Star, ShoppingCart, Eye, Heart, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ListingResponse } from '../models';
import { MarketplaceService } from '../services/MarketplaceService';
import { useCart } from '../hooks/useCart';

const marketplaceService = new MarketplaceService();

interface ListingCardProps {
  listing: ListingResponse;
  viewMode?: 'grid' | 'list';
  showAddToCart?: boolean;
}

export function ListingCard({ 
  listing, 
  viewMode = 'grid', 
  showAddToCart = true 
}: ListingCardProps) {
  const { addToCart, isInCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(listing);
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (viewMode === 'list') {
    return (
      <Link href={`/marketplace/listings/${listing.id}`}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex gap-6">
              {/* Thumbnail */}
              <div className="w-32 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
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

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                      {listing.title}
                    </h3>
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {listing.description}
                    </p>
                    
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={listing.seller?.avatar} />
                          <AvatarFallback className="text-xs">
                            {listing.seller?.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-600">
                          {listing.seller?.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {renderStars(listing.ratingAvg)}
                        <span className="text-sm text-gray-600 ml-1">
                          ({listing.ratingCount})
                        </span>
                      </div>
                      
                      <Badge variant="secondary" className="capitalize">
                        {listing.category}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {listing.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {listing.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{listing.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex flex-col items-end gap-3 ml-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {marketplaceService.formatPrice(listing.priceCents, listing.currency)}
                      </div>
                    </div>
                    
                    {showAddToCart && (
                      <Button
                        onClick={handleAddToCart}
                        disabled={isInCart(listing.id)}
                        className="flex items-center gap-2"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {isInCart(listing.id) ? 'In Cart' : 'Add to Cart'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Grid view
  return (
    <Link href={`/marketplace/listings/${listing.id}`}>
      <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-100 overflow-hidden">
          <img
            src={listing.thumbnail}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-bookmark.png';
            }}
          />
          
          {/* Overlay actions */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
              <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                <Eye className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                <Heart className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Category badge */}
          <Badge 
            className="absolute top-3 left-3 capitalize"
            variant="secondary"
          >
            {listing.category}
          </Badge>

          {/* Price */}
          <div className="absolute top-3 right-3 bg-white rounded-full px-3 py-1 shadow-sm">
            <span className="font-semibold text-gray-900">
              {marketplaceService.formatPrice(listing.priceCents, listing.currency)}
            </span>
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {listing.title}
          </h3>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {listing.description}
          </p>

          {/* Seller info */}
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="w-6 h-6">
              <AvatarImage src={listing.seller?.avatar} />
              <AvatarFallback className="text-xs">
                {listing.seller?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600 truncate">
              {listing.seller?.name}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            {renderStars(listing.ratingAvg)}
            <span className="text-sm text-gray-600 ml-1">
              ({listing.ratingCount})
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {listing.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {listing.tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{listing.tags.length - 2}
              </Badge>
            )}
          </div>
        </CardContent>

        {showAddToCart && (
          <CardFooter className="p-4 pt-0">
            <Button
              onClick={handleAddToCart}
              disabled={isInCart(listing.id)}
              className="w-full flex items-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              {isInCart(listing.id) ? 'In Cart' : 'Add to Cart'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}