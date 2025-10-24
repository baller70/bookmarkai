"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import {
  Heart,
  Search,
  ArrowLeft,
  Folder as FolderIcon,
  Star,
  Bookmark,
  Globe,
  Tag,
  Calendar,
  Plus,
  X,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Settings
} from 'lucide-react';
import type { BookmarkWithRelations } from './FolderCard';
import type { Folder as FolderType } from './FolderFormDialog';
import { getFaviconUrl, handleFaviconError, getDomainFromUrl } from '@/lib/favicon-utils';
import { getProfilePicture } from '@/lib/profile-utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  useDroppable
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { enhanceOnLoad } from '@/lib/image/enhanceOnLoad'

import { CSS } from '@dnd-kit/utilities';

interface KanbanViewProps {
  bookmarks: BookmarkWithRelations[];
  onBookmarkClick?: (bookmark: BookmarkWithRelations) => void;
  onFavorite?: (bookmark: BookmarkWithRelations) => void;
  loading?: boolean;
  selectedCategory?: string;
  selectedFolder?: FolderType;
  onCategoryChange?: (category: string) => void;
}

interface KanbanBoard {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  bookmarkIds: string[];
}

interface CreateBoardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBoard: (board: Omit<KanbanBoard, 'id' | 'bookmarkIds'>) => void;
}

interface BookmarkAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: BookmarkWithRelations[];
  boards: KanbanBoard[];
  onAssignBookmark: (bookmarkId: string, boardId: string) => void;
  onRemoveBookmark: (bookmarkId: string, boardId: string) => void;
}

const boardIcons = [
  { icon: Target, name: 'Target' },
  { icon: Clock, name: 'Clock' },
  { icon: CheckCircle, name: 'Check' },
  { icon: AlertCircle, name: 'Alert' },
  { icon: Zap, name: 'Zap' },
  { icon: Star, name: 'Star' },
  { icon: Bookmark, name: 'Bookmark' },
  { icon: Globe, name: 'Globe' },
  { icon: Tag, name: 'Tag' },
  { icon: Calendar, name: 'Calendar' }
];

const boardColors = [
  { value: 'blue', class: 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10', name: 'Blue' },
  { value: 'green', class: 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10', name: 'Green' },
  { value: 'purple', class: 'border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-900/10', name: 'Purple' },
  { value: 'orange', class: 'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-900/10', name: 'Orange' },
  { value: 'pink', class: 'border-pink-200 bg-pink-50/50 dark:border-pink-800 dark:bg-pink-900/10', name: 'Pink' },
  { value: 'yellow', class: 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-900/10', name: 'Yellow' }
];

function CreateBoardDialog({ isOpen, onClose, onCreateBoard }: CreateBoardDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);

  const handleSubmit = () => {
    if (!name.trim()) return;

    onCreateBoard({
      name: name.trim(),
      description: description.trim(),
      color: boardColors[selectedColor].class,
      icon: boardIcons[selectedIcon].icon
    });

    setName('');
    setDescription('');
    setSelectedIcon(0);
    setSelectedColor(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Board</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Board Name</label>
            <Input
              placeholder="Enter board name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description (Optional)</label>
            <Input
              placeholder="Enter board description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Icon</label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {boardIcons.map((iconItem, index) => {
                const IconComponent = iconItem.icon;
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedIcon(index)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedIcon === index
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className={`h-5 w-5 ${
                      selectedIcon === index ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {boardColors.map((colorItem, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedColor(index)}
                  className={`p-3 rounded-lg border-2 transition-all ${colorItem.class} ${
                    selectedColor === index
                      ? 'ring-2 ring-blue-500 ring-offset-2'
                      : 'hover:ring-1 hover:ring-gray-300'
                  }`}
                >
                  <span className="text-sm font-medium">{colorItem.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!name.trim()}>
              Create Board
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BookmarkAssignmentDialog({
  isOpen,
  onClose,
  bookmarks,
  boards,
  onAssignBookmark,
  onRemoveBookmark
}: BookmarkAssignmentDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBookmarks = bookmarks.filter(bookmark =>
    bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bookmark.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBookmarkBoard = (bookmarkId: string) => {
    return boards.find(board => board.bookmarkIds.includes(bookmarkId));
  };

  // Utility functions are now imported from favicon-utils

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Bookmark Assignments</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search bookmarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredBookmarks.map((bookmark) => {
              const currentBoard = getBookmarkBoard(bookmark.id);
              const IconComponent = currentBoard?.icon || Globe;

              return (
                <div key={bookmark.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                      <img
                        src={getFaviconUrl(bookmark, 32)}
                        alt=""
                        className="w-5 h-5"
                        onLoad={enhanceOnLoad(64)}
                        onError={(e) => handleFaviconError(e, bookmark, e.currentTarget.nextElementSibling as HTMLElement)}
                      />
                      <Globe className="w-4 h-4 text-gray-500 hidden" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{bookmark.title}</h4>
                      <p className="text-xs text-gray-500 truncate">{getDomainFromUrl(bookmark.url)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {currentBoard && (
                      <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                        <IconComponent className="h-3 w-3" />
                        <span>{currentBoard.name}</span>
                      </div>
                    )}

                    <select
                      value={currentBoard?.id || ''}
                      onChange={(e) => {
                        if (currentBoard) {
                          onRemoveBookmark(bookmark.id, currentBoard.id);
                        }
                        if (e.target.value) {
                          onAssignBookmark(bookmark.id, e.target.value);
                        }
                      }}
                      className="text-xs border rounded px-2 py-1 bg-white dark:bg-gray-800"
                    >
                      <option value="">No Board</option>
                      {boards.map((board) => (
                        <option key={board.id} value={board.id}>
                          {board.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Sortable Board Component
function SortableKanbanBoard({
  board,
  bookmarks,
  onBookmarkClick,
  onDeleteBoard,
  formatDate
}: {
  board: KanbanBoard;
  bookmarks: BookmarkWithRelations[];
  onBookmarkClick?: (bookmark: BookmarkWithRelations) => void;
  onDeleteBoard: (boardId: string) => void;
  formatDate: (date: string | null) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: board.id });

  const { setNodeRef: droppableRef } = useDroppable({
    id: board.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const boardBookmarks = bookmarks.filter(bookmark =>
    board.bookmarkIds.includes(bookmark.id)
  );

  const IconComponent = board.icon;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className={`rounded-lg border-2 p-4 min-h-[400px] ${board.color}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-white/50 transition-colors"
            >
              <div className="flex flex-col space-y-0.5">
                <div className="flex space-x-0.5">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                </div>
                <div className="flex space-x-0.5">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                </div>
              </div>
            </div>
            <IconComponent className="h-5 w-5 text-gray-600" />
            <div>
              <h3 className="font-semibold text-gray-900">{board.name}</h3>
              <p className="text-xs text-gray-500">{board.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Badge variant="secondary" className="text-xs">
              {boardBookmarks.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteBoard(board.id)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div ref={droppableRef} className="space-y-2 min-h-[300px]">
          <SortableContext items={boardBookmarks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            {boardBookmarks.map((bookmark) => (
              <SortableKanbanBookmark
                key={bookmark.id}
                bookmark={bookmark}
                onBookmarkClick={onBookmarkClick}
                formatDate={formatDate}
              />
            ))}
          </SortableContext>
        </div>
      </div>
    </div>
  );
}

// Sortable Bookmark Component
function SortableKanbanBookmark({
  bookmark,
  onBookmarkClick,
  formatDate
}: {
  bookmark: BookmarkWithRelations;
  onBookmarkClick?: (bookmark: BookmarkWithRelations) => void;
  formatDate: (date: string | null) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bookmark.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Compute visuals without referencing outer component state
  const customLogo = (bookmark as any)?.custom_logo ?? (bookmark as any)?.customLogo ?? null;
  const extractedFavicon = (bookmark as any)?.favicon ?? null;
  const customBg = (bookmark as any)?.custom_background ?? (bookmark as any)?.customBackground ?? null;
  const bgUrl = customBg || customLogo || extractedFavicon || getFaviconUrl(bookmark, 64);
  const logoCircleUrl = customLogo || extractedFavicon || getFaviconUrl(bookmark, 64);


  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow group">
        {/* Subtle background image using extracted favicon/custom logo */}
        {bgUrl && (
          <div
            aria-hidden
            className="absolute inset-0 bg-no-repeat pointer-events-none opacity-10"
            style={{
              backgroundImage: `url(${bgUrl})`,
              backgroundSize: '120px 120px',
              backgroundPosition: 'right -12px bottom -12px'
            }}
          />
        )}

        {/* Large circular logo (decorative) */}
        {logoCircleUrl && (
          <img
            src={logoCircleUrl}
            alt=""
            className="absolute -right-2 -top-2 w-14 h-14 rounded-full ring-1 ring-black/10 shadow-sm opacity-80 pointer-events-none"
            onLoad={enhanceOnLoad(256)}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        )}

        <CardContent className="p-3 relative">
          <div className="flex items-start space-x-3">
            <div
              {...listeners}
              className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity mt-1"
            >
              <div className="flex flex-col space-y-0.5">
                <div className="flex space-x-0.5">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                </div>
                <div className="flex space-x-0.5">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                </div>
              </div>
            </div>
            {/* Keep the small favicon (already working) */}
            <img
              src={getFaviconUrl(bookmark, 16)}
              alt=""
              className="w-4 h-4 mt-0.5 flex-shrink-0"
              onLoad={enhanceOnLoad(64)}
              onError={(e) => handleFaviconError(e, bookmark)}
            />
            <div className="flex-1 min-w-0" onClick={() => onBookmarkClick?.(bookmark)}>
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {bookmark.title}
              </h4>
              {bookmark.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {bookmark.description}
                </p>
              )}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  {bookmark.tags && bookmark.tags.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {bookmark.tags[0]}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-400">
                  {bookmark.created_at && (
                    <span>{formatDate(bookmark.created_at)}</span>
                  )}
                  {bookmark.isFavorite && (
                    <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function KanbanView({
  bookmarks,
  onBookmarkClick,
  onFavorite,
  loading,
  selectedCategory,
  selectedFolder,
  onCategoryChange
}: KanbanViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [userDefaultLogo, setUserDefaultLogo] = useState<string>('');

  useEffect(() => {
    try {
      setUserDefaultLogo(getProfilePicture());
    } catch {}
  }, []);


  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize with default boards
  useEffect(() => {
    const defaultBoards: KanbanBoard[] = [
      {
        id: 'todo',
        name: 'To Review',
        description: 'Bookmarks to review and organize',
        color: boardColors[0].class,
        icon: Clock,
        bookmarkIds: []
      },
      {
        id: 'in-progress',
        name: 'Priority',
        description: 'High priority bookmarks',
        color: boardColors[2].class,
        icon: Target,
        bookmarkIds: []
      },
      {
        id: 'completed',
        name: 'Favorites',
        description: 'Your favorite bookmarks',
        color: boardColors[1].class,
        icon: Star,
        bookmarkIds: []
      },
      {
        id: 'archived',
        name: 'Research',
        description: 'Research and reference materials',
        color: boardColors[3].class,
        icon: Globe,
        bookmarkIds: []
      }
    ];
    setBoards(defaultBoards);
  }, []);

  const handleCreateBoard = (boardData: Omit<KanbanBoard, 'id' | 'bookmarkIds'>) => {
    const newBoard: KanbanBoard = {
      ...boardData,
      id: `board-${Date.now()}`,
      bookmarkIds: []
    };
    setBoards(prev => [...prev, newBoard]);
  };

  const handleDeleteBoard = (boardId: string) => {
    setBoards(prev => prev.filter(board => board.id !== boardId));
  };

  const handleAssignBookmark = (bookmarkId: string, boardId: string) => {
    setBoards(prev => prev.map(board => {
      if (board.id === boardId) {
        return {
          ...board,
          bookmarkIds: [...board.bookmarkIds.filter(id => id !== bookmarkId), bookmarkId]
        };
      }
      return {
        ...board,
        bookmarkIds: board.bookmarkIds.filter(id => id !== bookmarkId)
      };
    }));
  };

  const handleRemoveBookmark = (bookmarkId: string, boardId: string) => {
    setBoards(prev => prev.map(board =>
      board.id === boardId
        ? { ...board, bookmarkIds: board.bookmarkIds.filter(id => id !== bookmarkId) }
        : board
    ));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the boards that contain the active and over items
    const activeBoard = boards.find(board => board.bookmarkIds.includes(activeId));
    const overBoard = boards.find(board => board.id === overId || board.bookmarkIds.includes(overId));

    if (!activeBoard || !overBoard) return;

    // If moving between different boards
    if (activeBoard.id !== overBoard.id) {
      setBoards(prev => prev.map(board => {
        if (board.id === activeBoard.id) {
          return {
            ...board,
            bookmarkIds: board.bookmarkIds.filter(id => id !== activeId)
          };
        }
        if (board.id === overBoard.id) {
          return {
            ...board,
            bookmarkIds: [...board.bookmarkIds, activeId]
          };
        }
        return board;
      }));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) {
      setActiveId(null);
      return;
    }

    // Handle board reordering
    const activeBoardIndex = boards.findIndex(board => board.id === activeId);
    const overBoardIndex = boards.findIndex(board => board.id === overId);

    if (activeBoardIndex !== -1 && overBoardIndex !== -1) {
      setBoards(prev => arrayMove(prev, activeBoardIndex, overBoardIndex));
    } else {
      // Handle bookmark reordering within the same board
      const activeBoard = boards.find(board => board.bookmarkIds.includes(activeId));
      const overBoard = boards.find(board => board.id === overId || board.bookmarkIds.includes(overId));

      if (activeBoard && overBoard && activeBoard.id === overBoard.id) {
        const activeIndex = activeBoard.bookmarkIds.indexOf(activeId);
        const overIndex = activeBoard.bookmarkIds.indexOf(overId);

        if (activeIndex !== -1 && overIndex !== -1) {
          setBoards(prev => prev.map(board =>
            board.id === activeBoard.id
              ? { ...board, bookmarkIds: arrayMove(board.bookmarkIds, activeIndex, overIndex) }
              : board
          ));
        }
      }
    }

    setActiveId(null);
  };

  const filteredBookmarks = useMemo(() => {
    let filtered = bookmarks;

    if (selectedFolder) {
      filtered = filtered.filter(bookmark => bookmark.folder_id === selectedFolder.id);
    } else if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(bookmark => {
        const tags = bookmark.tags || [];
        return tags.some(tag => tag.toLowerCase() === selectedCategory.toLowerCase());
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(bookmark =>
        bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bookmark.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bookmark.url.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [bookmarks, searchTerm, selectedCategory, selectedFolder]);

  const getViewTitle = () => {
    if (selectedFolder) {
      return `KANBAN VIEW - ${selectedFolder.name.toUpperCase()}`;
    }
    if (selectedCategory && selectedCategory !== 'all') {
      return `KANBAN VIEW - ${selectedCategory.toUpperCase()}`;
    }
    return 'KANBAN VIEW - CUSTOM BOARDS';
  };

  const getViewDescription = () => {
    if (selectedFolder) {
      return `Organize bookmarks from ${selectedFolder.name} folder across your custom boards`;
    }
    if (selectedCategory && selectedCategory !== 'all') {
      return `Organize bookmarks tagged with "${selectedCategory}" across your custom boards`;
    }
    return 'Organize your bookmarks across custom boards for better workflow management';
  };

  // Use the utility functions from favicon-utils
  // getDomainFromUrl and getFaviconUrl are now imported

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  };

  const unassignedBookmarks = filteredBookmarks.filter(bookmark =>
    !boards.some(board => board.bookmarkIds.includes(bookmark.id))
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
        </div>

        {/* Loading Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with uniform pattern */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-4">
          {(selectedCategory || selectedFolder) && onCategoryChange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCategoryChange('all')}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {getViewTitle()}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {getViewDescription()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {selectedFolder && (
            <Badge variant="secondary" className="px-3 py-1">
              <FolderIcon className="h-3 w-3 mr-1" />
              {selectedFolder.name} ({filteredBookmarks.length})
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAssignmentOpen(true)}
            className="flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>Manage Assignments</span>
          </Button>
        </div>
      </div>

      {/* Kanban Boards */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={boards.map(board => board.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {boards.map((board) => {
              const boardBookmarks = filteredBookmarks.filter(bookmark =>
                board.bookmarkIds.includes(bookmark.id)
              );
              const IconComponent = board.icon;

              return (
                <SortableKanbanBoard
                  key={board.id}
                  board={board}
                  bookmarks={boardBookmarks}
                  onBookmarkClick={onBookmarkClick}
                  onDeleteBoard={handleDeleteBoard}
                  formatDate={formatDate}
                />
              );
            })}

            {/* Add Board Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: boards.length * 0.1 }}
              className="flex flex-col h-[600px]"
            >
              <Card
                className="h-full flex flex-col border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 cursor-pointer bg-gray-50/50 dark:bg-gray-800/30 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                onClick={() => setIsCreateBoardOpen(true)}
              >
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 transition-colors">
                      <Plus className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Add New Board</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Create a custom board to organize your bookmarks
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </SortableContext>
      </DndContext>

      {/* Unassigned Bookmarks Section */}
      {unassignedBookmarks.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <span>Unassigned Bookmarks ({unassignedBookmarks.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {unassignedBookmarks.slice(0, 8).map((bookmark) => (
              <Card key={bookmark.id} className="relative overflow-hidden p-3 bg-orange-50/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800">
                {/* Background image using favicon/custom logo or global override */}
                {(userDefaultLogo || (bookmark as any)?.custom_background || (bookmark as any)?.customBackground || (bookmark as any)?.custom_logo || (bookmark as any)?.customLogo || (bookmark as any)?.favicon) && (
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-no-repeat pointer-events-none opacity-10"
                    style={{
                      backgroundImage: `url(${userDefaultLogo || (bookmark as any).custom_background || (bookmark as any).customBackground || (bookmark as any).custom_logo || (bookmark as any).customLogo || (bookmark as any).favicon})`,
                      backgroundSize: '120px 120px',
                      backgroundPosition: 'right -12px bottom -12px'
                    }}
                  />
                )}

                {/* Large circular logo */}
                {((bookmark as any)?.custom_logo || (bookmark as any)?.customLogo || userDefaultLogo || (bookmark as any)?.favicon) && (
                  <img
                    src={(bookmark as any).custom_logo || (bookmark as any).customLogo || userDefaultLogo || (bookmark as any).favicon}
                    alt=""
                    className="absolute -right-2 -top-2 w-14 h-14 rounded-full ring-1 ring-black/10 shadow-sm opacity-80 pointer-events-none"
                    onLoad={enhanceOnLoad(256)}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                )}

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                    <img
                      src={getFaviconUrl(bookmark, 32)}
                      alt=""
                      className="w-5 h-5"
                      onLoad={enhanceOnLoad(64)}
                      onError={(e) => handleFaviconError(e, bookmark, e.currentTarget.nextElementSibling as HTMLElement)}
                    />
                    <Globe className="w-4 h-4 text-gray-500 hidden" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {bookmark.title}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">
                      {getDomainFromUrl(bookmark.url)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
            {unassignedBookmarks.length > 8 && (
              <Card className="p-3 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex items-center justify-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  +{unassignedBookmarks.length - 8} more
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <CreateBoardDialog
        isOpen={isCreateBoardOpen}
        onClose={() => setIsCreateBoardOpen(false)}
        onCreateBoard={handleCreateBoard}
      />

      <BookmarkAssignmentDialog
        isOpen={isAssignmentOpen}
        onClose={() => setIsAssignmentOpen(false)}
        bookmarks={filteredBookmarks}
        boards={boards}
        onAssignBookmark={handleAssignBookmark}
        onRemoveBookmark={handleRemoveBookmark}
      />
    </div>
  );
}