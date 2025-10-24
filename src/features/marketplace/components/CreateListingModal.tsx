'use client';

import React, { useState } from 'react';
import { X, Upload, Link as LinkIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CreateListingDTO, Listing, MARKETPLACE_CONFIG } from '../models';
import { MarketplaceService } from '../services/MarketplaceService';

const marketplaceService = new MarketplaceService();

interface CreateListingModalProps {
  onClose: () => void;
  onSuccess: (listing: Listing) => void;
}

export function CreateListingModal({ onClose, onSuccess }: CreateListingModalProps) {
  const [formData, setFormData] = useState<CreateListingDTO>({
    title: '',
    description: '',
    thumbnail: '',
    priceCents: 100,
    currency: 'USD',
    category: 'productivity' as any,
    tags: [],
    bookmarkData: {
      url: '',
      title: '',
      description: '',
      favicon: '',
      metadata: {}
    }
  });
  
  const [currentTag, setCurrentTag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleInputChange = (field: keyof CreateListingDTO, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBookmarkDataChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      bookmarkData: { ...prev.bookmarkData, [field]: value }
    }));
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim()) && formData.tags.length < MARKETPLACE_CONFIG.MAX_TAGS) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = marketplaceService.validateListing(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setErrors([]);

    try {
      const newListing = await marketplaceService.createListing(formData);
      onSuccess(newListing);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to create listing']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Create New Listing
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  maxLength={MARKETPLACE_CONFIG.MAX_TITLE_LENGTH}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.title.length}/{MARKETPLACE_CONFIG.MAX_TITLE_LENGTH}
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  maxLength={MARKETPLACE_CONFIG.MAX_DESCRIPTION_LENGTH}
                  className="min-h-[120px]"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/{MARKETPLACE_CONFIG.MAX_DESCRIPTION_LENGTH}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MARKETPLACE_CONFIG.CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category} className="capitalize">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="price">Price (USD) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min={MARKETPLACE_CONFIG.MIN_PRICE_CENTS / 100}
                    max={MARKETPLACE_CONFIG.MAX_PRICE_CENTS / 100}
                    step="0.01"
                    value={formData.priceCents / 100}
                    onChange={(e) => handleInputChange('priceCents', Math.round(parseFloat(e.target.value) * 100))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="thumbnail">Thumbnail URL *</Label>
                <div className="flex gap-2">
                  <Input
                    id="thumbnail"
                    type="url"
                    value={formData.thumbnail}
                    onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    required
                  />
                  <Button type="button" variant="outline">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                {formData.thumbnail && (
                  <div className="mt-2">
                    <img
                      src={formData.thumbnail}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded border"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.tags.length}/{MARKETPLACE_CONFIG.MAX_TAGS} tags
                </p>
              </div>
            </div>

            {/* Right Column - Bookmark Data */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Bookmark Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bookmark-url">URL *</Label>
                      <Input
                        id="bookmark-url"
                        type="url"
                        value={formData.bookmarkData.url}
                        onChange={(e) => handleBookmarkDataChange('url', e.target.value)}
                        placeholder="https://example.com"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="bookmark-title">Bookmark Title</Label>
                      <Input
                        id="bookmark-title"
                        value={formData.bookmarkData.title}
                        onChange={(e) => handleBookmarkDataChange('title', e.target.value)}
                        placeholder="Page title"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bookmark-description">Bookmark Description</Label>
                      <Textarea
                        id="bookmark-description"
                        value={formData.bookmarkData.description || ''}
                        onChange={(e) => handleBookmarkDataChange('description', e.target.value)}
                        placeholder="Brief description of the bookmark"
                        className="min-h-[80px]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="favicon">Favicon URL</Label>
                      <Input
                        id="favicon"
                        type="url"
                        value={formData.bookmarkData.favicon || ''}
                        onChange={(e) => handleBookmarkDataChange('favicon', e.target.value)}
                        placeholder="https://example.com/favicon.ico"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preview */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-4">Preview</h3>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium">{formData.title || 'Listing Title'}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {formData.description || 'Listing description...'}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <Badge variant="secondary" className="capitalize">
                        {formData.category}
                      </Badge>
                      <span className="font-semibold">
                        ${(formData.priceCents / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Please fix the following errors:</h4>
              <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? 'Creating...' : 'Create Listing'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}