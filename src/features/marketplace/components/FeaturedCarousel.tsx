'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ListingResponse } from '../models';
import { MarketplaceService } from '../services/MarketplaceService';
import Link from 'next/link';

const marketplaceService = new MarketplaceService();

export function FeaturedCarousel() {
  const [featuredListings, setFeaturedListings] = useState<ListingResponse[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const listings = await marketplaceService.getFeaturedListings(6);
        setFeaturedListings(listings);
      } catch (error) {
        console.error('Failed to fetch featured listings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (featuredListings.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % featuredListings.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [featuredListings.length]);

  const nextSlide = () => {
    setCurrentIndex(prev => (prev + 1) % featuredListings.length);
  };

  const prevSlide = () => {
    setCurrentIndex(prev => (prev - 1 + featuredListings.length) % featuredListings.length);
  };

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Collections</h2>
        <div className="relative h-80 bg-gray-200 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  if (featuredListings.length === 0) {
    return null;
  }

  const currentListing = featuredListings[currentIndex];

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Collections</h2>
      
      <div className="relative">
        <Card className="overflow-hidden">
          <div className="relative h-80 bg-gradient-to-r from-blue-600 to-purple-600">
            {/* Background image */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-30"
              style={{ backgroundImage: `url(${currentListing.thumbnail})` }}
            />
            
            {/* Content overlay */}
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl mx-auto px-8 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  {/* Text content */}
                  <div className="text-white">
                    <Badge className="mb-4 bg-white/20 text-white border-white/30">
                      Featured Collection
                    </Badge>
                    
                    <h3 className="text-3xl font-bold mb-4 line-clamp-2">
                      {currentListing.title}
                    </h3>
                    
                    <p className="text-lg mb-6 line-clamp-3 text-white/90">
                      {currentListing.description}
                    </p>
                    
                    <div className="flex items-center gap-6 mb-6">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(currentListing.ratingAvg)
                                ? 'text-yellow-400 fill-current'
                                : 'text-white/40'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-white/90">
                          ({currentListing.ratingCount} reviews)
                        </span>
                      </div>
                      
                      <div className="text-2xl font-bold">
                        {marketplaceService.formatPrice(currentListing.priceCents, currentListing.currency)}
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <Link href={`/marketplace/listings/${currentListing.id}`}>
                        <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                          View Details
                        </Button>
                      </Link>
                      <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                  
                  {/* Preview image */}
                  <div className="hidden lg:block">
                    <div className="relative">
                      <img
                        src={currentListing.thumbnail}
                        alt={currentListing.title}
                        className="w-full h-64 object-cover rounded-lg shadow-2xl"
                      />
                      <Badge className="absolute top-4 right-4 bg-black/50 text-white">
                        {currentListing.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Navigation arrows */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
          onClick={prevSlide}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
          onClick={nextSlide}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Dots indicator */}
        <div className="flex justify-center mt-4 gap-2">
          {featuredListings.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}