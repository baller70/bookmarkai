'use client';

/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Search, 
  Play, 
  Pause, 
  Square, 
  Download,
  RotateCcw,
  Globe,
  ExternalLink,
  Copy
} from 'lucide-react';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  category: string;
  status: 'unchecked' | 'checking' | 'valid' | 'invalid' | 'warning';
  statusCode?: number;
  responseTime?: number;
  error?: string;
  lastChecked?: Date;
}

interface URLCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock bookmarks data
const MOCK_BOOKMARKS: Bookmark[] = [
  {
    id: '1',
    title: 'GitHub',
    url: 'https://github.com',
    favicon: '/github.svg',
    category: 'Development',
    status: 'unchecked'
  },
  {
    id: '2',
    title: 'Stack Overflow',
    url: 'https://stackoverflow.com',
    category: 'Development',
    status: 'unchecked'
  },
  {
    id: '3',
    title: 'MDN Web Docs',
    url: 'https://developer.mozilla.org',
    category: 'Documentation',
    status: 'unchecked'
  },
  {
    id: '4',
    title: 'React Documentation',
    url: 'https://reactjs.org',
    category: 'Framework',
    status: 'unchecked'
  },
  {
    id: '5',
    title: 'Vercel',
    url: 'https://vercel.com',
    category: 'Hosting',
    status: 'unchecked'
  }
];

export function URLCheckerModal({ isOpen, onClose }: URLCheckerModalProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(MOCK_BOOKMARKS);
  const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [validationProgress, setValidationProgress] = useState(0);

  // Filter bookmarks based on search term
  const filteredBookmarks = bookmarks.filter(bookmark =>
    bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bookmark.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bookmark.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistics
  const stats = {
    total: bookmarks.length,
    valid: bookmarks.filter(b => b.status === 'valid').length,
    invalid: bookmarks.filter(b => b.status === 'invalid').length,
    warnings: bookmarks.filter(b => b.status === 'warning').length,
    checking: bookmarks.filter(b => b.status === 'checking').length,
    unchecked: bookmarks.filter(b => b.status === 'unchecked').length
  };

  // Handle bookmark selection
  const handleBookmarkToggle = (bookmarkId: string) => {
    setSelectedBookmarks(prev => 
      prev.includes(bookmarkId)
        ? prev.filter(id => id !== bookmarkId)
        : [...prev, bookmarkId]
    );
  };

  // Select all filtered bookmarks
  const handleSelectAll = () => {
    const allFilteredIds = filteredBookmarks.map(b => b.id);
    setSelectedBookmarks(allFilteredIds);
  };

  // Clear all selections
  const handleClearAll = () => {
    setSelectedBookmarks([]);
  };

  // Simulate URL validation
  const validateURL = async (bookmark: Bookmark): Promise<Bookmark> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simulate different outcomes
    const outcomes = ['valid', 'invalid', 'warning'] as const;
    const randomOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
    
    const updatedBookmark: Bookmark = {
      ...bookmark,
      status: randomOutcome,
      lastChecked: new Date(),
      responseTime: Math.floor(Math.random() * 1000) + 100
    };

    if (randomOutcome === 'valid') {
      updatedBookmark.statusCode = 200;
    } else if (randomOutcome === 'invalid') {
      updatedBookmark.statusCode = Math.random() > 0.5 ? 404 : 500;
      updatedBookmark.error = updatedBookmark.statusCode === 404 ? 'Page not found' : 'Server error';
    } else {
      updatedBookmark.statusCode = 301;
      updatedBookmark.error = 'Redirect detected';
    }

    return updatedBookmark;
  };

  // Start validation process
  const startValidation = async (bookmarkIds?: string[]) => {
    const idsToValidate = bookmarkIds || selectedBookmarks;
    if (idsToValidate.length === 0) return;

    setIsValidating(true);
    setIsPaused(false);
    setCurrentIndex(0);
    setValidationProgress(0);

    for (let i = 0; i < idsToValidate.length; i++) {
      if (isPaused) break;

      const bookmarkId = idsToValidate[i];
      setCurrentIndex(i);
      
      // Update status to checking
      setBookmarks(prev => prev.map(b => 
        b.id === bookmarkId ? { ...b, status: 'checking' } : b
      ));

      // Validate the bookmark
      const bookmark = bookmarks.find(b => b.id === bookmarkId);
      if (bookmark) {
        const validatedBookmark = await validateURL(bookmark);
        
        setBookmarks(prev => prev.map(b => 
          b.id === bookmarkId ? validatedBookmark : b
        ));
      }

      // Update progress
      setValidationProgress(((i + 1) / idsToValidate.length) * 100);
    }

    setIsValidating(false);
    setCurrentIndex(0);
  };

  // Validate all bookmarks
  const validateAllBookmarks = () => {
    const allIds = bookmarks.map(b => b.id);
    setSelectedBookmarks(allIds);
    startValidation(allIds);
  };

  // Pause validation
  const pauseValidation = () => {
    setIsPaused(true);
    setIsValidating(false);
  };

  // Resume validation
  const resumeValidation = () => {
    setIsPaused(false);
    startValidation();
  };

  // Stop validation
  const stopValidation = () => {
    setIsValidating(false);
    setIsPaused(false);
    setCurrentIndex(0);
    setValidationProgress(0);
    
    // Reset checking status to unchecked
    setBookmarks(prev => prev.map(b => 
      b.status === 'checking' ? { ...b, status: 'unchecked' } : b
    ));
  };

  // Reset all results
  const resetResults = () => {
    setBookmarks(prev => prev.map(b => ({ 
      ...b, 
      status: 'unchecked',
      statusCode: undefined,
      responseTime: undefined,
      error: undefined,
      lastChecked: undefined
    })));
    setValidationProgress(0);
    setCurrentIndex(0);
  };

  // Export results
  const exportResults = () => {
    const csvContent = [
      ['Title', 'URL', 'Category', 'Status', 'Status Code', 'Response Time', 'Error', 'Last Checked'].join(','),
      ...bookmarks.map(b => [
        b.title,
        b.url,
        b.category,
        b.status,
        b.statusCode || '',
        b.responseTime ? `${b.responseTime}ms` : '',
        b.error || '',
        b.lastChecked ? b.lastChecked.toISOString() : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookmark-validation-results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy valid URLs
  const copyValidURLs = () => {
    const validURLs = bookmarks
      .filter(b => b.status === 'valid')
      .map(b => b.url)
      .join('\n');
    
    navigator.clipboard.writeText(validURLs);
    // TODO: Show toast notification
  };

  // Get status icon
  const getStatusIcon = (status: Bookmark['status']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'checking':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Globe className="h-4 w-4 text-gray-400" />;
    }
  };

  // Get status color
  const getStatusColor = (status: Bookmark['status']) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'invalid':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'checking':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-500" />
            URL Checker - Validate Bookmarks
          </DialogTitle>
          <DialogDescription>
            Validate your bookmarks to ensure they&apos;re still accessible and working properly.
          </DialogDescription>
        </DialogHeader>

        {/* Statistics */}
        <div className="grid grid-cols-6 gap-4 py-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
            <div className="text-xs text-gray-500">Valid</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.invalid}</div>
            <div className="text-xs text-gray-500">Invalid</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.warnings}</div>
            <div className="text-xs text-gray-500">Warnings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.checking}</div>
            <div className="text-xs text-gray-500">Checking</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.unchecked}</div>
            <div className="text-xs text-gray-500">Unchecked</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 border-t border-b py-4">
          {/* Search and Selection */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search bookmarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All ({filteredBookmarks.length})
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              Clear All
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button 
              onClick={validateAllBookmarks}
              disabled={isValidating}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Validate All Bookmarks
            </Button>
            
            <Button 
              onClick={() => startValidation()}
              disabled={selectedBookmarks.length === 0 || isValidating}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Validate Selected ({selectedBookmarks.length})
            </Button>

            {isValidating && (
              <Button onClick={pauseValidation} variant="outline" size="sm">
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            )}

            {isPaused && (
              <Button onClick={resumeValidation} variant="outline" size="sm">
                <Play className="h-4 w-4" />
                Resume
              </Button>
            )}

            {(isValidating || isPaused) && (
              <Button onClick={stopValidation} variant="outline" size="sm">
                <Square className="h-4 w-4" />
                Stop
              </Button>
            )}

            <Button onClick={resetResults} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>

            <Button onClick={exportResults} variant="outline" size="sm">
              <Download className="h-4 w-4" />
              Export
            </Button>

            <Button onClick={copyValidURLs} variant="outline" size="sm">
              <Copy className="h-4 w-4" />
              Copy Valid URLs
            </Button>
          </div>

          {/* Progress */}
          {(isValidating || isPaused) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress: {Math.round(validationProgress)}%</span>
                <span>Checking: {currentIndex + 1} of {selectedBookmarks.length}</span>
              </div>
              <Progress value={validationProgress} className="w-full" />
            </div>
          )}
        </div>

        {/* Bookmarks List */}
        <ScrollArea className="flex-1 max-h-96">
          <div className="space-y-2">
            {filteredBookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  selectedBookmarks.includes(bookmark.id)
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-gray-200'
                } hover:bg-gray-50 transition-colors`}
              >
                <Checkbox
                  checked={selectedBookmarks.includes(bookmark.id)}
                  onCheckedChange={() => handleBookmarkToggle(bookmark.id)}
                />
                
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {bookmark.favicon ? (
                    <img src={bookmark.favicon} alt="" className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  )}
                  
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{bookmark.title}</div>
                    <div className="text-xs text-gray-500 truncate">{bookmark.url}</div>
                  </div>
                </div>

                <Badge variant="outline" className="text-xs">
                  {bookmark.category}
                </Badge>

                <div className="flex items-center gap-2">
                  {getStatusIcon(bookmark.status)}
                  <Badge className={`text-xs ${getStatusColor(bookmark.status)}`}>
                    {bookmark.status}
                  </Badge>
                </div>

                {bookmark.responseTime && (
                  <div className="text-xs text-gray-500">
                    {bookmark.responseTime}ms
                  </div>
                )}

                {bookmark.status === 'valid' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(bookmark.url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}

                {bookmark.error && (
                  <div className="text-xs text-red-500 max-w-20 truncate" title={bookmark.error}>
                    {bookmark.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 