import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface Bookmark {
  id?: string;
  title: string;
  url: string;
  description?: string;
  category?: string;
  tags?: string[];
  notes?: string;
  enableAI?: boolean;
  folderId?: string;
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async (options?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options?.category) params.append('category', options.category);
      if (options?.search) params.append('search', options.search);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());

      const response = await fetch(`/api/bookmarks?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bookmarks');
      }

      setBookmarks(data.bookmarks || []);
      return data.bookmarks;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch bookmarks';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addBookmark = useCallback(async (bookmark: Bookmark) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookmark),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add bookmark');
      }

      // Add the new bookmark to the list
      setBookmarks(prev => [data.bookmark, ...prev]);
      
      return data.bookmark;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to add bookmark';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateBookmark = useCallback(async (id: string, updates: Partial<Bookmark>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/bookmarks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update bookmark');
      }

      // Update the bookmark in the list
      setBookmarks(prev =>
        prev.map(b => (b.id === id ? { ...b, ...updates } : b))
      );

      toast.success('Bookmark updated successfully');
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update bookmark';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteBookmark = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookmarks?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete bookmark');
      }

      // Remove the bookmark from the list
      setBookmarks(prev => prev.filter(b => b.id !== id));

      toast.success('Bookmark deleted successfully');
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete bookmark';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    bookmarks,
    isLoading,
    error,
    fetchBookmarks,
    addBookmark,
    updateBookmark,
    deleteBookmark,
  };
}
