'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { 
  Folder as FolderIcon, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Plus,
  FileText
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './dropdown-menu';
import { Button } from './button';

// Import the Folder type from FolderFormDialog
import { type Folder } from './FolderFormDialog';

export interface BookmarkWithRelations {
  id: string;
  title: string;
  url: string;
  description?: string;
  tags: string[];
  category: string;
  isFavorite?: boolean;
  circularImage?: string;
  [key: string]: any;
}

interface FolderCardProps {
  folder: Folder;
  bookmarkCount: number;
  onEdit: (folder: Folder) => void;
  onDelete: (folderId: string) => void;
  onAddBookmark: (folderId: string) => void;
  onDrop: (folderId: string, bookmark: BookmarkWithRelations) => void;
  onDragOver: (event: React.DragEvent) => void;
  onClick?: () => void;
  disableLink?: boolean;
  onChangeColor?: (folderId: string, color: string) => void;
  colorOptions?: { value: string; label: string }[];
}

export function FolderCard({
  folder,
  bookmarkCount,
  onEdit,
  onDelete,
  onAddBookmark,
  onDrop,
  onDragOver,
  onClick,
  disableLink = false,
  onChangeColor,
  colorOptions,
}: FolderCardProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
    onDragOver(event);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    // Only set isDragOver to false if we're leaving the card entirely
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    if (
      x < rect.left ||
      x > rect.right ||
      y < rect.top ||
      y > rect.bottom
    ) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    try {
      const bookmarkData =
        event.dataTransfer.getData('application/json') ||
        event.dataTransfer.getData('text/plain');
      if (bookmarkData) {
        const bookmark = JSON.parse(bookmarkData) as BookmarkWithRelations;
        onDrop(folder.id, bookmark);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  const getFolderColor = () => {
    return folder.color || '#3b82f6'; // Default blue
  };

  const getContrastColor = (hexColor: string) => {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  const getFolderSlug = () => {
    // Convert folder name to URL slug
    return folder.name.toLowerCase().replace(/\s+/g, '-');
  };

  const folderColor = getFolderColor();
  const textColor = getContrastColor(folderColor);

  const handleCardClick = (e: React.MouseEvent) => {
    if (disableLink) {
      e.preventDefault();
      onClick?.();
    }
  };

  if (disableLink) {
    return (
      <Card
        className={`
          relative group cursor-pointer border-2 transition-all duration-200 hover:shadow-lg
          min-h-[200px] flex flex-col
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 scale-105' 
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleCardClick}
      >
        <CardContent className="p-6 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div 
              className="p-3 rounded-lg shadow-sm"
              style={{ backgroundColor: folderColor }}
            >
              <FolderIcon 
                className="h-8 w-8" 
                style={{ color: textColor }}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); onEdit(folder); }}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Folder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); onAddBookmark(folder.id); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bookmark
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.preventDefault(); onDelete(folder.id); }}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Folder
                </DropdownMenuItem>
                {onChangeColor && colorOptions && colorOptions.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1 text-xs text-gray-500">Folder Color</div>
                    <div className="grid grid-cols-5 gap-2 px-2 pb-2">
                      {colorOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={(e) => { e.preventDefault(); onChangeColor && onChangeColor(folder.id, opt.value) }}
                          className={`w-6 h-6 rounded-md border-2 transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 hover:scale-110 active:scale-95 ${String(folder.color || '').toUpperCase() === opt.value ? 'border-gray-900 ring-1 ring-gray-300' : 'border-gray-300 hover:border-gray-400'}`}
                          style={{ backgroundColor: opt.value }}
                          title={opt.label}
                        />
                      ))}
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {folder.name.toUpperCase()}
            </h3>
            
            {folder.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3 flex-1">
                {folder.description}
              </p>
            )}
            
            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-4">
              <div className="flex items-center text-gray-500 dark:text-gray-400">
                <FileText className="h-4 w-4 mr-1" />
                <span className="text-sm">
                  {bookmarkCount} {bookmarkCount === 1 ? 'bookmark' : 'bookmarks'}
                </span>
              </div>
              
              {isDragOver && (
                <Badge variant="secondary" className="text-xs">
                  Drop here
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <NextLink href={`/category/${getFolderSlug()}`}>
      <Card
        className={`
          relative group cursor-pointer border-2 transition-all duration-200 hover:shadow-lg
          min-h-[200px] flex flex-col
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 scale-105' 
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-6 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div 
              className="p-3 rounded-lg shadow-sm"
              style={{ backgroundColor: folderColor }}
            >
              <FolderIcon 
                className="h-8 w-8" 
                style={{ color: textColor }}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); onEdit(folder); }}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Folder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); onAddBookmark(folder.id); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bookmark
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.preventDefault(); onDelete(folder.id); }}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Folder
                </DropdownMenuItem>
                {onChangeColor && colorOptions && colorOptions.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1 text-xs text-gray-500">Folder Color</div>
                    <div className="grid grid-cols-5 gap-2 px-2 pb-2">
                      {colorOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={(e) => { e.preventDefault(); onChangeColor && onChangeColor(folder.id, opt.value) }}
                          className={`w-6 h-6 rounded-md border-2 transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 hover:scale-110 active:scale-95 ${String(folder.color || '').toUpperCase() === opt.value ? 'border-gray-900 ring-1 ring-gray-300' : 'border-gray-300 hover:border-gray-400'}`}
                          style={{ backgroundColor: opt.value }}
                          title={opt.label}
                        />
                      ))}
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {folder.name.toUpperCase()}
            </h3>
            
            {folder.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3 flex-1">
                {folder.description}
              </p>
            )}
            
            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-4">
              <div className="flex items-center text-gray-500 dark:text-gray-400">
                <FileText className="h-4 w-4 mr-1" />
                <span className="text-sm">
                  {bookmarkCount} {bookmarkCount === 1 ? 'bookmark' : 'bookmarks'}
                </span>
              </div>
              
              {isDragOver && (
                <Badge variant="secondary" className="text-xs">
                  Drop here
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </NextLink>
  );
} 