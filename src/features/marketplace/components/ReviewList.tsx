'use client';

import React from 'react';
import { Star, ThumbsUp, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Review } from '../models';
import { formatDistanceToNow } from 'date-fns';

interface ReviewListProps {
  reviews: Review[];
  hasMore: boolean;
  onLoadMore: () => void;
}

export function ReviewList({ reviews, hasMore, onLoadMore }: ReviewListProps) {
  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-600">Be the first to review this bookmark collection!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src={review.user?.avatar} />
                <AvatarFallback>
                  {review.user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {review.user?.name || 'Anonymous'}
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {renderStars(review.rating)}
                      </div>
                      <span className="text-sm text-gray-600">
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                
                {review.comment && (
                  <p className="text-gray-700 mb-3">
                    {review.comment}
                  </p>
                )}
                
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Helpful
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {hasMore && (
        <div className="text-center">
          <Button variant="outline" onClick={onLoadMore}>
            Load More Reviews
          </Button>
        </div>
      )}
    </div>
  );
}