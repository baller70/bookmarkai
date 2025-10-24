'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, TrendingUp, Grid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useMarketplaceListings } from '../hooks/useMarketplaceListings';
import { ListingCard } from './ListingCard';
import { FeaturedCarousel } from './FeaturedCarousel';
import { ListingFilters, ListingCategory, MARKETPLACE_CONFIG } from '../models';
import { MarketplaceService } from '../services/MarketplaceService';

const marketplaceService = new MarketplaceService();

export function MarketplaceHome() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  
  const {
    listings,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    page,
    totalPages,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage
  } = useMarketplaceListings();

  // Fetch categories on mount
  useEffect(() => {
    marketplaceService.getCategories().then(setCategories).catch(console.error);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== filters.search) {
        updateFilters({ search: searchQuery || undefined });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, filters.search, updateFilters]);

  const handleCategoryFilter = (category: string) => {
    const newCategory = filters.category === category ? undefined : category as ListingCategory;
    updateFilters({ category: newCategory });
  };

  const handlePriceRangeChange = (range: number[]) => {
    setPriceRange(range);
    updateFilters({
      minPrice: range[0] * 100, // Convert to cents
      maxPrice: range[1] * 100
    });
  };

  const handleRatingFilter = (minRating: number) => {
    const newRating = filters.minRating === minRating ? undefined : minRating;
    updateFilters({ minRating: newRating });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bookmark Marketplace</h1>
              <p className="text-gray-600 mt-1">Discover and purchase curated bookmark collections</p>
            </div>
            
            {/* Search and View Controls */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search bookmarks, collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              
              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Carousel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FeaturedCarousel />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <div className={`w-80 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Filters</h3>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Categories</h4>
                  <div className="space-y-2">
                    {categories.map(({ category, count }) => (
                      <Button
                        key={category}
                        variant={filters.category === category ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleCategoryFilter(category)}
                        className="w-full justify-between"
                      >
                        <span className="capitalize">{category}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Price Range */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
                  <div className="px-2">
                    <Slider
                      value={priceRange}
                      onValueChange={handlePriceRangeChange}
                      max={1000}
                      step={10}
                      className="mb-4"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Rating Filter */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Minimum Rating</h4>
                  <div className="space-y-2">
                    {[4, 3, 2, 1].map((rating) => (
                      <Button
                        key={rating}
                        variant={filters.minRating === rating ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleRatingFilter(rating)}
                        className="w-full justify-start"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span>& up</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {filters.search ? `Search results for "${filters.search}"` : 'All Listings'}
                </h2>
                <p className="text-gray-600">
                  {loading ? 'Loading...' : `${listings.length} listings found`}
                </p>
              </div>
              
              <Select defaultValue="newest">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Listings Grid/List */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 rounded-lg h-64"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className={
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-4"
                }>
                  {listings.map((listing) => (
                    <ListingCard 
                      key={listing.id} 
                      listing={listing} 
                      viewMode={viewMode}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8">
                    <Button
                      variant="outline"
                      onClick={prevPage}
                      disabled={!hasPrevPage}
                    >
                      Previous
                    </Button>
                    <span className="text-gray-600">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={nextPage}
                      disabled={!hasNextPage}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}