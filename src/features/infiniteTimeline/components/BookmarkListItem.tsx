// Bookmark List Item - Individual draggable bookmark item
'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  GripVertical, 
  Edit3, 
  Trash2, 
  ExternalLink,
  Bookmark,
  Globe
} from 'lucide-react';
import { BookmarkData } from '../models/timeline.models';
import { useTimelineData } from '../hooks/useTimelineData';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BookmarkListItemProps {
  bookmark: BookmarkData;
  isConnectorMode: boolean;
}

export const BookmarkListItem: React.FC<BookmarkListItemProps> = ({
  bookmark,
  isConnectorMode
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [tempTitle, setTempTitle] = useState(bookmark.title);
  const [tempUrl, setTempUrl] = useState(bookmark.url || '');

  const { updateBookmark, deleteBookmark } = useTimelineData();

  // Use @dnd-kit sortable for consistency with rest of the site
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: bookmark.id,
    disabled: isConnectorMode || isEditingTitle || isEditingUrl
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  // Handle title editing
  const handleTitleSubmit = useCallback(async () => {
    if (tempTitle.trim() && tempTitle !== bookmark.title) {
      try {
        await updateBookmark(bookmark.id, { title: tempTitle.trim() });
      } catch (error) {
        console.error('Failed to update bookmark title:', error);
        setTempTitle(bookmark.title);
      }
    }
    setIsEditingTitle(false);
  }, [tempTitle, bookmark.title, bookmark.id, updateBookmark]);

  const handleTitleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleTitleSubmit();
    } else if (event.key === 'Escape') {
      setTempTitle(bookmark.title);
      setIsEditingTitle(false);
    }
  }, [handleTitleSubmit, bookmark.title]);

  // Handle URL editing
  const handleUrlSubmit = useCallback(async () => {
    if (tempUrl !== bookmark.url) {
      try {
        await updateBookmark(bookmark.id, { url: tempUrl.trim() || undefined });
      } catch (error) {
        console.error('Failed to update bookmark URL:', error);
        setTempUrl(bookmark.url || '');
      }
    }
    setIsEditingUrl(false);
  }, [tempUrl, bookmark.url, bookmark.id, updateBookmark]);

  const handleUrlKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleUrlSubmit();
    } else if (event.key === 'Escape') {
      setTempUrl(bookmark.url || '');
      setIsEditingUrl(false);
    }
  }, [handleUrlSubmit, bookmark.url]);

  // Handle bookmark deletion
  const handleDeleteBookmark = useCallback(async (event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (window.confirm(`Are you sure you want to delete "${bookmark.title}"?`)) {
      try {
        await deleteBookmark(bookmark.id);
      } catch (error) {
        console.error('Failed to delete bookmark:', error);
      }
    }
  }, [bookmark.id, bookmark.title, deleteBookmark]);

  // Handle URL opening
  const handleOpenUrl = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    if (bookmark.url) {
      window.open(bookmark.url, '_blank');
    }
  }, [bookmark.url]);

  const getIconForUrl = (url?: string) => {
    if (!url) return <Bookmark className="h-4 w-4" />;
    
    try {
      const domain = new URL(url).hostname.toLowerCase();
      
      if (domain.includes('github')) return '🐙';
      if (domain.includes('google')) return '🔍';
      if (domain.includes('youtube')) return '📺';
      if (domain.includes('twitter') || domain.includes('x.com')) return '🐦';
      if (domain.includes('linkedin')) return '💼';
      if (domain.includes('stackoverflow')) return '📚';
      if (domain.includes('medium')) return '📝';
      if (domain.includes('dev.to')) return '👨‍💻';
      
      return <Globe className="h-4 w-4" />;
    } catch {
      return <Bookmark className="h-4 w-4" />;
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`
        p-3 cursor-pointer transition-all duration-200 group
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
        ${isConnectorMode ? 'cursor-default' : 'hover:shadow-md'}
        border border-gray-200 hover:border-gray-300
      `}
    >
      <div className="flex items-start space-x-3">
        {/* Drag Handle */}
        {!isConnectorMode && (
          <div 
            {...listeners}
            className="cursor-grab active:cursor-grabbing mt-1 p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all duration-200"
          >
            <GripVertical className="h-3 w-3 text-gray-400" />
          </div>
        )}

        {/* Bookmark Icon */}
        <div className="flex-shrink-0 mt-1">
          {typeof getIconForUrl(bookmark.url) === 'string' ? (
            <span className="text-lg">{getIconForUrl(bookmark.url)}</span>
          ) : (
            <div className="text-gray-400">{getIconForUrl(bookmark.url)}</div>
          )}
        </div>

        {/* Bookmark Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          {isEditingTitle ? (
            <Input
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleTitleKeyDown}
              className="text-sm font-medium mb-1"
              autoFocus
            />
          ) : (
            <h4 
              className="text-sm font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600"
              onClick={() => setIsEditingTitle(true)}
              title={bookmark.title}
            >
              {bookmark.title}
            </h4>
          )}

          {/* URL */}
          {isEditingUrl ? (
            <Input
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              onBlur={handleUrlSubmit}
              onKeyDown={handleUrlKeyDown}
              className="text-xs"
              placeholder="https://example.com"
              autoFocus
            />
          ) : bookmark.url ? (
            <p 
              className="text-xs text-blue-600 truncate cursor-pointer hover:underline"
              onClick={handleOpenUrl}
              title={bookmark.url}
            >
              {bookmark.url}
            </p>
          ) : (
            <p 
              className="text-xs text-gray-400 cursor-pointer hover:text-blue-600"
              onClick={() => setIsEditingUrl(true)}
            >
              Add URL...
            </p>
          )}

          {/* Description */}
          {bookmark.description && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {bookmark.description}
            </p>
          )}
        </div>

        {/* Actions */}
        {!isConnectorMode && (
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {bookmark.url && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleOpenUrl}
                title="Open URL"
                className="h-6 w-6 p-0"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditingTitle(true)}
              title="Edit bookmark"
              className="h-6 w-6 p-0"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDeleteBookmark}
              title="Delete bookmark"
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}; 