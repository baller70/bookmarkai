'use client';

/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileText, 
  Link2, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Globe,
  Clipboard,
  FileUp
} from 'lucide-react';

interface ParsedBookmark {
  id: string;
  title: string;
  url: string;
  category?: string;
  description?: string;
  tags?: string[];
  status: 'pending' | 'valid' | 'invalid' | 'duplicate';
  error?: string;
}

interface BulkURLCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BulkURLCreatorModal({ isOpen, onClose }: BulkURLCreatorModalProps) {
  const [activeTab, setActiveTab] = useState('paste');
  const [textInput, setTextInput] = useState('');
  const [parsedBookmarks, setParsedBookmarks] = useState<ParsedBookmark[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [defaultCategory, setDefaultCategory] = useState('General');
  const [defaultTags, setDefaultTags] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleFileUpload = useCallback(async (files: FileList) => {
    setIsProcessing(true);
    setProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress(((i + 1) / files.length) * 100);

      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        await parseCSVFile(file);
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        await parsePDFFile(file);
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        await parseTextFile(file);
      }
    }

    setIsProcessing(false);
  }, []);

  // Parse CSV file
  const parseCSVFile = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    const bookmarks: ParsedBookmark[] = [];

    lines.forEach((line, index) => {
      const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
      
      if (columns.length >= 2) {
        const [title, url, category, description] = columns;
        if (isValidURL(url)) {
          bookmarks.push({
            id: `csv-${index}-${Date.now()}`,
            title: title || extractTitleFromURL(url),
            url: url,
            category: category || defaultCategory,
            description: description || '',
            tags: defaultTags ? defaultTags.split(',').map(t => t.trim()) : [],
            status: 'pending'
          });
        }
      }
    });

    setParsedBookmarks(prev => [...prev, ...bookmarks]);
  };

  // Parse PDF file (mock implementation)
  const parsePDFFile = async (file: File) => {
    // In a real implementation, you'd use a PDF parsing library
    // For now, we'll simulate finding URLs in a PDF
    const mockURLs = [
      'https://example.com/pdf-link-1',
      'https://example.com/pdf-link-2',
      'https://example.com/pdf-link-3'
    ];

    const bookmarks: ParsedBookmark[] = mockURLs.map((url, index) => ({
      id: `pdf-${index}-${Date.now()}`,
      title: extractTitleFromURL(url),
      url: url,
      category: defaultCategory,
      description: `Extracted from ${file.name}`,
      tags: defaultTags ? defaultTags.split(',').map(t => t.trim()) : [],
      status: 'pending'
    }));

    setParsedBookmarks(prev => [...prev, ...bookmarks]);
  };

  // Parse text file
  const parseTextFile = async (file: File) => {
    const text = await file.text();
    const urls = extractURLsFromText(text);
    
    const bookmarks: ParsedBookmark[] = urls.map((url, index) => ({
      id: `txt-${index}-${Date.now()}`,
      title: extractTitleFromURL(url),
      url: url,
      category: defaultCategory,
      description: `Extracted from ${file.name}`,
      tags: defaultTags ? defaultTags.split(',').map(t => t.trim()) : [],
      status: 'pending'
    }));

    setParsedBookmarks(prev => [...prev, ...bookmarks]);
  };

  // Handle text input parsing
  const handleTextInputParse = () => {
    if (!textInput.trim()) return;

    const urls = extractURLsFromText(textInput);
    const bookmarks: ParsedBookmark[] = urls.map((url, index) => ({
      id: `paste-${index}-${Date.now()}`,
      title: extractTitleFromURL(url),
      url: url,
      category: defaultCategory,
      description: '',
      tags: defaultTags ? defaultTags.split(',').map(t => t.trim()) : [],
      status: 'pending'
    }));

    setParsedBookmarks(prev => [...prev, ...bookmarks]);
    setTextInput('');
  };

  // Extract URLs from text
  const extractURLsFromText = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex) || [];
    return [...new Set(matches)]; // Remove duplicates
  };

  // Validate URL
  const isValidURL = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Extract title from URL
  const extractTitleFromURL = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      const path = urlObj.pathname.split('/').filter(p => p);
      
      if (path.length > 0) {
        return `${domain} - ${path[path.length - 1]}`;
      }
      return domain;
    } catch {
      return url;
    }
  };

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  // Validate bookmarks
  const validateBookmarks = async () => {
    setIsProcessing(true);
    setProgress(0);

    const updatedBookmarks = [...parsedBookmarks];
    
    for (let i = 0; i < updatedBookmarks.length; i++) {
      const bookmark = updatedBookmarks[i];
      setProgress(((i + 1) / updatedBookmarks.length) * 100);

      // Simulate validation
      await new Promise(resolve => setTimeout(resolve, 200));

      if (!isValidURL(bookmark.url)) {
        bookmark.status = 'invalid';
        bookmark.error = 'Invalid URL format';
      } else {
        // Check for duplicates
        const isDuplicate = updatedBookmarks.some((b, index) => 
          index < i && b.url === bookmark.url
        );
        
        if (isDuplicate) {
          bookmark.status = 'duplicate';
          bookmark.error = 'Duplicate URL';
        } else {
          bookmark.status = 'valid';
        }
      }
    }

    setParsedBookmarks(updatedBookmarks);
    setIsProcessing(false);
  };

  // Remove bookmark
  const removeBookmark = (id: string) => {
    setParsedBookmarks(prev => prev.filter(b => b.id !== id));
  };

  // Update bookmark
  const updateBookmark = (id: string, updates: Partial<ParsedBookmark>) => {
    setParsedBookmarks(prev => prev.map(b => 
      b.id === id ? { ...b, ...updates } : b
    ));
  };

  // Create bookmarks
  const createBookmarks = async () => {
    const validBookmarks = parsedBookmarks.filter(b => b.status === 'valid');
    
    if (validBookmarks.length === 0) {
      alert('No valid bookmarks to create');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    // Simulate creating bookmarks
    for (let i = 0; i < validBookmarks.length; i++) {
      setProgress(((i + 1) / validBookmarks.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setIsProcessing(false);
    alert(`Successfully created ${validBookmarks.length} bookmarks!`);
    
    // Clear the list
    setParsedBookmarks([]);
    onClose();
  };

  // Export template
  const exportTemplate = () => {
    const csvContent = [
      ['Title', 'URL', 'Category', 'Description'].join(','),
      ['Example Site', 'https://example.com', 'General', 'Example description'].join(','),
      ['GitHub', 'https://github.com', 'Development', 'Code repository hosting'].join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookmark-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Paste from clipboard
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setTextInput(prev => prev + (prev ? '\n' : '') + text);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  // Statistics
  const stats = {
    total: parsedBookmarks.length,
    valid: parsedBookmarks.filter(b => b.status === 'valid').length,
    invalid: parsedBookmarks.filter(b => b.status === 'invalid').length,
    duplicates: parsedBookmarks.filter(b => b.status === 'duplicate').length,
    pending: parsedBookmarks.filter(b => b.status === 'pending').length
  };

  // Get status icon
  const getStatusIcon = (status: ParsedBookmark['status']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'duplicate':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Globe className="h-4 w-4 text-gray-400" />;
    }
  };

  // Get status color
  const getStatusColor = (status: ParsedBookmark['status']) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'invalid':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'duplicate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-500" />
            Bulk URL Creator - Create Multiple Bookmarks
          </DialogTitle>
          <DialogDescription>
            Import URLs from various sources to create multiple bookmarks quickly.
          </DialogDescription>
        </DialogHeader>

        {/* Statistics */}
        {parsedBookmarks.length > 0 && (
          <div className="grid grid-cols-5 gap-4 py-4 border-b">
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
              <div className="text-2xl font-bold text-yellow-600">{stats.duplicates}</div>
              <div className="text-xs text-gray-500">Duplicates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
              <div className="text-xs text-gray-500">Pending</div>
            </div>
          </div>
        )}

        {/* Input Methods */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="paste" className="flex items-center gap-2">
                                      <Clipboard className="h-4 w-4" />
                Paste URLs
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <FileUp className="h-4 w-4" />
                Upload Files
              </TabsTrigger>
              <TabsTrigger value="review" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Review & Create
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 flex flex-col">
              <TabsContent value="paste" className="flex-1 flex flex-col space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Default Category</Label>
                    <Input
                      id="category"
                      value={defaultCategory}
                      onChange={(e) => setDefaultCategory(e.target.value)}
                      placeholder="Enter category..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">Default Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={defaultTags}
                      onChange={(e) => setDefaultTags(e.target.value)}
                      placeholder="tag1, tag2, tag3..."
                    />
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="textInput">Paste URLs (one per line or mixed with text)</Label>
                    <Button variant="outline" size="sm" onClick={pasteFromClipboard}>
                      <Clipboard className="h-4 w-4 mr-2" />
                      Paste from Clipboard
                    </Button>
                  </div>
                  <Textarea
                    id="textInput"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste URLs here... URLs will be automatically detected from any text."
                    className="flex-1 min-h-32"
                  />
                  <Button 
                    onClick={handleTextInputParse}
                    disabled={!textInput.trim()}
                    className="mt-2 self-start"
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Extract URLs
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="upload" className="flex-1 flex flex-col space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Default Category</Label>
                    <Input
                      id="category"
                      value={defaultCategory}
                      onChange={(e) => setDefaultCategory(e.target.value)}
                      placeholder="Enter category..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">Default Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={defaultTags}
                      onChange={(e) => setDefaultTags(e.target.value)}
                      placeholder="tag1, tag2, tag3..."
                    />
                  </div>
                </div>

                <div
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Drop files here or click to upload
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Supports CSV, PDF, and TXT files. URLs will be automatically extracted.
                  </p>
                  
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <FileText className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".csv,.pdf,.txt"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="hidden"
                  />

                  <div className="mt-4 text-sm text-gray-500">
                    <Button variant="link" onClick={exportTemplate} className="p-0 h-auto">
                      Download CSV template
                    </Button>
                  </div>
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing files...</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="review" className="flex-1 flex flex-col space-y-4">
                {parsedBookmarks.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-center">
                    <div>
                      <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No URLs to review
                      </h3>
                      <p className="text-gray-500">
                        Use the Paste URLs or Upload Files tabs to add URLs first.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={validateBookmarks}
                        disabled={isProcessing}
                        variant="outline"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Validate All URLs
                      </Button>
                      
                      <Button 
                        onClick={createBookmarks}
                        disabled={stats.valid === 0 || isProcessing}
                        className="ml-auto"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create {stats.valid} Bookmarks
                      </Button>
                    </div>

                    {isProcessing && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Processing...</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="w-full" />
                      </div>
                    )}

                    <ScrollArea className="flex-1 max-h-96">
                      <div className="space-y-2">
                        {parsedBookmarks.map((bookmark) => (
                          <div
                            key={bookmark.id}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              
                              <div className="min-w-0 flex-1">
                                <Input
                                  value={bookmark.title}
                                  onChange={(e) => updateBookmark(bookmark.id, { title: e.target.value })}
                                  className="font-medium text-sm mb-1"
                                  placeholder="Bookmark title..."
                                />
                                <div className="text-xs text-gray-500 truncate">{bookmark.url}</div>
                              </div>
                            </div>

                            <Input
                              value={bookmark.category || ''}
                              onChange={(e) => updateBookmark(bookmark.id, { category: e.target.value })}
                              placeholder="Category"
                              className="w-24 text-xs"
                            />

                            <div className="flex items-center gap-2">
                              {getStatusIcon(bookmark.status)}
                              <Badge className={`text-xs ${getStatusColor(bookmark.status)}`}>
                                {bookmark.status}
                              </Badge>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBookmark(bookmark.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>

                            {bookmark.error && (
                              <div className="text-xs text-red-500 max-w-20 truncate" title={bookmark.error}>
                                {bookmark.error}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
} 