'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Calendar,
  Clock,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  BookmarkIcon,
  ExternalLink,
  Star,
  Heart,
  Share2,
  MoreHorizontal,
  Zap,
  TrendingUp,
  Globe,
  Tag,
  User,
  Folder,
  Eye,
  MessageSquare,
  ThumbsUp,
  Plus,
  CalendarDays,
  Timer,
  Archive,
  Edit2,
  Trash2,
  Copy,
  Download,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  Target,
  BarChart3
} from 'lucide-react'
import { getFaviconUrl, getDomainFromUrl } from '@/lib/favicon-utils'

interface BookmarkTimelineProps {
  bookmarks: any[]
  userDefaultLogo?: string
  onBookmarkClick?: (bookmark: any) => void
  onBookmarkUpdate?: (bookmark: any) => void
  onBookmarkDelete?: (bookmarkId: string) => void
}

interface TimelineGroup {
  id: string
  period: string
  date: Date
  bookmarks: any[]
  count: number
  isCustom?: boolean
  isEditable?: boolean
}

interface CustomCategory {
  id: string
  title: string
  bookmarks: string[]
  created_at: Date
}

// Time period utilities
const getTimePeriod = (date: Date, groupBy: 'day' | 'week' | 'month' | 'year') => {
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))

  if (groupBy === 'day') {
    // More detailed recent time periods
    if (diffHours <= 1) return 'JUST NOW'
    if (diffHours <= 6) return 'LAST FEW HOURS'
    if (diffHours <= 24) return 'TODAY'
    if (diffDays === 1) return 'YESTERDAY'
    if (diffDays <= 3) return 'THIS WEEK START'
    if (diffDays <= 7) return 'THIS WEEK'
    if (diffDays <= 14) return 'LAST WEEK'
    if (diffDays <= 30) return 'THIS MONTH'
    if (diffDays <= 60) return 'LAST MONTH'
    if (diffDays <= 90) return 'PAST FEW MONTHS'
    if (diffDays <= 180) return 'EARLIER THIS YEAR'
    if (diffDays <= 365) return 'MONTHS AGO'
    return 'OVER A YEAR AGO'
  }

  if (groupBy === 'week') {
    const weeksDiff = Math.floor(diffDays / 7)
    if (weeksDiff === 0) return 'THIS WEEK'
    if (weeksDiff === 1) return 'LAST WEEK'
    if (weeksDiff <= 4) return 'THIS MONTH'
    if (weeksDiff <= 8) return 'PAST MONTH'
    if (weeksDiff <= 12) return 'PAST FEW MONTHS'
    return 'MONTHS AGO'
  }

  if (groupBy === 'month') {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
  }

  return date.getFullYear().toString()
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Helper function to extract domain from URL
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

// Timeline Bookmark Card Component
function TimelineBookmarkCard({ bookmark, userDefaultLogo, onBookmarkClick, index }: {
  bookmark: any
  userDefaultLogo?: string
  onBookmarkClick?: (bookmark: any) => void
  index: number
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const createdDate = new Date(bookmark.created_at || Date.now())
  const domain = bookmark.url ? new URL(bookmark.url).hostname : ''

  // Theme color for hover effects (can be customized)
  const themeColor = '#3b82f6' // blue-500

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-pink-200"></div>
      
      {/* Timeline Node */}
      <div className="absolute left-4 top-6 w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 border-4 border-white shadow-lg z-10"></div>
      
      {/* Content */}
      <div className="ml-12 mb-8">
        <Card 
          className="group hover:shadow-2xl transition-all duration-500 cursor-pointer bg-white border border-gray-300 backdrop-blur-sm relative overflow-hidden border-l-4 border-l-blue-500"
          style={{
            borderColor: 'rgb(209 213 219)', // gray-300
            transition: 'all 0.5s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = themeColor;
            e.currentTarget.style.boxShadow = `0 25px 50px -12px ${themeColor}20`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgb(209 213 219)';
            e.currentTarget.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)';
          }}
          onClick={() => onBookmarkClick?.(bookmark)}
        >
          {/* Background Website Logo with 5% opacity - Custom logo takes priority */}
          {(() => {
            const bgSrc = (bookmark as any).custom_logo || bookmark.customBackground || (bookmark as any).custom_background || userDefaultLogo;
            if (bgSrc) {
              return (
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
                  style={{
                    backgroundImage: `url(${bgSrc})`,
                    backgroundSize: (bgSrc && /logo\.clearbit\.com|faviconkit\.com|s2\/favicons/.test(String(bgSrc))) ? '140% 140%' : 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    opacity: 0.10
                  }}
                />
              );
            } else {
              // Priority: global DNA logo > custom_background > custom_logo > extracted favicon > Google service
              const bg = (userDefaultLogo || (bookmark as any).custom_background || bookmark.customBackground || (bookmark as any).custom_logo || bookmark.favicon || getFaviconUrl(bookmark, 64));
              return (
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
                  style={{
                    backgroundImage: `url(${bg})`,
                    backgroundSize: (bg && /logo\.clearbit\.com|faviconkit\.com|s2\/favicons/.test(bg)) ? '140% 140%' : 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    opacity: 0.10
                  }}
                />
              );
            }
          })()}
          
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-transparent to-purple-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <CardHeader className="pb-3 relative z-20">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3 flex-1">
                {/* Favicon (64x64, full circle fill) */}
                <Avatar
                  className="h-16 w-16 rounded-full overflow-hidden ring-0"
                  data-testid="timeline-avatar"
                >
                  <AvatarImage
                    src={getFaviconUrl(bookmark, 64)}
                    alt={bookmark.title}
                    className="!object-cover object-center origin-center scale-[1.8]"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold">
                    {bookmark.title?.slice(0, 2).toUpperCase() || 'BM'}
                  </AvatarFallback>
                </Avatar>

                {/* Bookmark Info */}
                <div className="flex-1 min-w-0">
                  <h3 
                    className="font-bold text-gray-900 text-lg cursor-pointer hover:text-blue-600 transition-colors truncate"
                    onClick={() => onBookmarkClick?.(bookmark)}
                  >
                    {bookmark.title}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {bookmark.category || 'Uncategorized'}
                    </Badge>
                    {bookmark.isFavorite && (
                      <Heart className="h-4 w-4 text-red-500 fill-current" />
                    )}
                    <span className="text-xs text-gray-500">
                      {formatDate(createdDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(bookmark.url, '_blank')}
                  className="h-8 w-8 p-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy URL
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0 relative z-20">
            {/* Description */}
            {bookmark.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {bookmark.description}
              </p>
            )}

            {/* URL */}
            <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
              <Globe className="h-3 w-3" />
              <span className="truncate">{domain}</span>
            </div>

            {/* Tags */}
            {(bookmark.tags || bookmark.ai_tags) && (
              <div className="flex flex-wrap gap-1 mb-3">
                {[...(bookmark.tags || []), ...(bookmark.ai_tags || [])].slice(0, 5).map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                {bookmark.visit_count && (
                  <div className="flex items-center space-x-1">
                    <Eye className="h-3 w-3" />
                    <span>{bookmark.visit_count} views</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Added {createdDate.toLocaleDateString()}</span>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 px-2 text-xs"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    More
                  </>
                )}
              </Button>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <p className="text-gray-600">{bookmark.category || 'None'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Priority:</span>
                    <p className="text-gray-600">{bookmark.priority || 'Normal'}</p>
                  </div>
                  {bookmark.ai_summary && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">AI Summary:</span>
                      <p className="text-gray-600 mt-1">{bookmark.ai_summary}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Timeline Group Header
function TimelineGroupHeader({ group, isExpanded, onToggle, onEdit, onDelete }: {
  group: TimelineGroup
  isExpanded: boolean
  onToggle: () => void
  onEdit?: (groupId: string, newTitle: string) => void
  onDelete?: (groupId: string) => void
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editingTitle, setEditingTitle] = useState(group.period)

  const handleTitleEdit = () => {
    if (onEdit && editingTitle.trim() && editingTitle !== group.period) {
      onEdit(group.id, editingTitle.trim().toUpperCase())
    }
    setIsEditingTitle(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleEdit()
    } else if (e.key === 'Escape') {
      setEditingTitle(group.period)
      setIsEditingTitle(false)
    }
  }

  return (
    <div className="relative mb-6 group/header">
      {/* Timeline Line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 to-purple-300"></div>
      
      {/* Timeline Node */}
      <div className="absolute left-2 top-4 w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-700 border-4 border-white shadow-lg flex items-center justify-center z-10">
        <CalendarDays className="h-4 w-4 text-white" />
      </div>
      
      {/* Header Content */}
      <div className="ml-14">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <Button
              variant="ghost"
              onClick={onToggle}
              className="p-0 h-auto hover:bg-transparent group"
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
              )}
            </Button>
            
            <div className="flex-1">
              {isEditingTitle ? (
                <Input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value.toUpperCase())}
                  onBlur={handleTitleEdit}
                  onKeyDown={handleKeyPress}
                  className="text-xl font-bold h-8 px-2 w-auto min-w-[200px]"
                  autoFocus
                />
              ) : (
                <h2 
                  className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer"
                  onClick={(e) => {
                    if (group.isEditable !== false) {
                      e.stopPropagation()
                      setIsEditingTitle(true)
                    }
                  }}
                >
                  {group.period}
                </h2>
              )}
              <p className="text-sm text-gray-500">
                {group.count} bookmark{group.count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Edit/Delete Actions */}
          {(group.isCustom || group.isEditable !== false) && (
            <div className="flex items-center space-x-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
              {!isEditingTitle && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingTitle(true)}
                    className="h-8 w-8 p-0 hover:bg-blue-100"
                  >
                    <Edit2 className="h-4 w-4 text-gray-600" />
                  </Button>
                  {group.isCustom && onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(group.id)}
                      className="h-8 w-8 p-0 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Custom Category Creation Dialog
function CreateCategoryDialog({ bookmarks, onCreateCategory, open, onOpenChange }: {
  bookmarks: any[]
  onCreateCategory: (title: string, selectedBookmarks: string[]) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [categoryTitle, setCategoryTitle] = useState('')
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set())
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set())
  const [selectionMode, setSelectionMode] = useState<'bookmarks' | 'folders' | 'both'>('bookmarks')

  // Get unique folders/categories from bookmarks
  const folders = useMemo(() => {
    const folderMap = new Map()
    bookmarks.forEach(bookmark => {
      if (bookmark.category && bookmark.category.trim()) {
        const categoryKey = bookmark.category.toLowerCase()
        if (!folderMap.has(categoryKey)) {
          folderMap.set(categoryKey, {
            id: categoryKey,
            name: bookmark.category,
            bookmarkCount: 0,
            bookmarks: []
          })
        }
        folderMap.get(categoryKey).bookmarkCount++
        folderMap.get(categoryKey).bookmarks.push(bookmark)
      }
    })
    return Array.from(folderMap.values())
  }, [bookmarks])

  const handleCreate = () => {
    if (categoryTitle.trim()) {
      // Collect all selected bookmarks (individual + from folders)
      const allSelectedBookmarks = new Set(selectedBookmarks)
      
      // Add bookmarks from selected folders
      selectedFolders.forEach(folderId => {
        const folder = folders.find(f => f.id === folderId)
        if (folder) {
          folder.bookmarks.forEach((bookmark: any) => {
            allSelectedBookmarks.add(bookmark.id.toString())
          })
        }
      })
      
      onCreateCategory(categoryTitle.trim().toUpperCase(), Array.from(allSelectedBookmarks))
      setCategoryTitle('')
      setSelectedBookmarks(new Set())
      setSelectedFolders(new Set())
      setSelectionMode('bookmarks')
      onOpenChange(false)
    }
  }

  const toggleBookmark = (bookmarkId: string) => {
    const newSelected = new Set(selectedBookmarks)
    if (newSelected.has(bookmarkId)) {
      newSelected.delete(bookmarkId)
    } else {
      newSelected.add(bookmarkId)
    }
    setSelectedBookmarks(newSelected)
  }

  const toggleFolder = (folderId: string) => {
    const newSelected = new Set(selectedFolders)
    if (newSelected.has(folderId)) {
      newSelected.delete(folderId)
    } else {
      newSelected.add(folderId)
    }
    setSelectedFolders(newSelected)
  }

  const getTotalSelectedBookmarks = () => {
    let total = selectedBookmarks.size
    selectedFolders.forEach(folderId => {
      const folder = folders.find(f => f.id === folderId)
      if (folder) {
        total += folder.bookmarkCount
      }
    })
    return total
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Create Custom Timeline Category</DialogTitle>
          <DialogDescription>
            Create a custom category and assign bookmarks or entire folders to it
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Category Title</label>
            <Input
              placeholder="Enter category title..."
              value={categoryTitle}
              onChange={(e) => setCategoryTitle(e.target.value.toUpperCase())}
              className="font-bold"
            />
          </div>

          {/* Selection Mode Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setSelectionMode('bookmarks')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                selectionMode === 'bookmarks'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Individual Bookmarks
            </button>
            <button
              onClick={() => setSelectionMode('folders')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                selectionMode === 'folders'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Entire Folders
            </button>
            <button
              onClick={() => setSelectionMode('both')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                selectionMode === 'both'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Both
            </button>
          </div>

          {/* Selection Summary */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{getTotalSelectedBookmarks()} bookmarks</strong> will be added to this category
              {selectedFolders.size > 0 && (
                <span className="ml-2">
                  ({selectedFolders.size} folder{selectedFolders.size !== 1 ? 's' : ''} + {selectedBookmarks.size} individual bookmark{selectedBookmarks.size !== 1 ? 's' : ''})
                </span>
              )}
            </p>
          </div>

          {/* Folder Selection */}
          {(selectionMode === 'folders' || selectionMode === 'both') && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Select Folders ({selectedFolders.size} selected)
              </label>
              <ScrollArea className="h-48 border rounded-md p-3">
                <div className="space-y-2">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className={`flex items-center space-x-3 p-3 rounded-md cursor-pointer transition-colors border ${
                        selectedFolders.has(folder.id) 
                          ? 'bg-blue-100 border-blue-300' 
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}
                      onClick={() => toggleFolder(folder.id)}
                    >
                      <div className={`w-4 h-4 border-2 rounded ${
                        selectedFolders.has(folder.id)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedFolders.has(folder.id) && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <Folder className="h-5 w-5 text-blue-500" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{folder.name}</p>
                        <p className="text-xs text-gray-500">
                          {folder.bookmarkCount} bookmark{folder.bookmarkCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Individual Bookmark Selection */}
          {(selectionMode === 'bookmarks' || selectionMode === 'both') && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Select Individual Bookmarks ({selectedBookmarks.size} selected)
              </label>
              <ScrollArea className="h-64 border rounded-md p-3">
                <div className="space-y-2">
                  {bookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors ${
                        selectedBookmarks.has(bookmark.id.toString()) 
                          ? 'bg-blue-100 border-blue-300' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => toggleBookmark(bookmark.id.toString())}
                    >
                      <div className={`w-4 h-4 border-2 rounded ${
                        selectedBookmarks.has(bookmark.id.toString())
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedBookmarks.has(bookmark.id.toString()) && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={getFaviconUrl(bookmark, 32)}
                          alt={bookmark.title}
                        />
                        <AvatarFallback className="text-xs">
                          {bookmark.title?.slice(0, 2).toUpperCase() || 'BM'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{bookmark.title}</p>
                        <p className="text-xs text-gray-500 truncate">{bookmark.url}</p>
                        <p className="text-xs text-blue-600">{bookmark.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!categoryTitle.trim() || getTotalSelectedBookmarks() === 0}
          >
            Create Category ({getTotalSelectedBookmarks()} bookmarks)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Main Timeline Component
export function BookmarkTimeline({
  bookmarks,
  userDefaultLogo,
  onBookmarkClick,
  onBookmarkUpdate,
  onBookmarkDelete
}: BookmarkTimelineProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'year'>('day')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([])
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false)
  const [customTitles, setCustomTitles] = useState<Map<string, string>>(new Map())
  const hasInitializedExpanded = useRef(false)

  // Process and group bookmarks
  const timelineGroups = useMemo(() => {
    let filtered = bookmarks.filter(bookmark => {
      const matchesSearch = !searchTerm || 
        bookmark.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bookmark.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bookmark.url?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = filterCategory === 'all' || bookmark.category === filterCategory
      
      return matchesSearch && matchesCategory
    })

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || 0)
      const dateB = new Date(b.created_at || 0)
      return sortOrder === 'desc' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime()
    })

    // Group by time period
    const groups = new Map<string, TimelineGroup>()
    
    // Add custom categories first
    customCategories.forEach(customCategory => {
      const categoryBookmarks = filtered.filter(bookmark => 
        customCategory.bookmarks.includes(bookmark.id.toString())
      )
      
      if (categoryBookmarks.length > 0) {
        groups.set(customCategory.id, {
          id: customCategory.id,
          period: customCategory.title,
          date: customCategory.created_at,
          bookmarks: categoryBookmarks,
          count: categoryBookmarks.length,
          isCustom: true,
          isEditable: true
        })
      }
    })
    
    // Add time-based groups for bookmarks not in custom categories
    const bookmarksInCustomCategories = new Set(
      customCategories.flatMap(cat => cat.bookmarks)
    )
    
    filtered.forEach(bookmark => {
      if (!bookmarksInCustomCategories.has(bookmark.id.toString())) {
        const date = new Date(bookmark.created_at || Date.now())
        const period = customTitles.get(getTimePeriod(date, groupBy)) || getTimePeriod(date, groupBy)
        const groupId = `time_${getTimePeriod(date, groupBy)}`
        
        if (!groups.has(groupId)) {
          groups.set(groupId, {
            id: groupId,
            period,
            date,
            bookmarks: [],
            count: 0,
            isCustom: false,
            isEditable: true
          })
        }
        
        groups.get(groupId)!.bookmarks.push(bookmark)
        groups.get(groupId)!.count++
      }
    })

    return Array.from(groups.values()).sort((a, b) => {
      // Custom categories first, then by date
      if (a.isCustom && !b.isCustom) return -1
      if (!a.isCustom && b.isCustom) return 1
      return sortOrder === 'desc' ? b.date.getTime() - a.date.getTime() : a.date.getTime() - b.date.getTime()
    })
  }, [bookmarks, searchTerm, sortOrder, groupBy, filterCategory, customCategories, customTitles])

  const categories = useMemo(() => {
    const cats = new Set(bookmarks.map(b => b.category).filter(Boolean))
    return Array.from(cats)
  }, [bookmarks])

  const toggleGroup = (period: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(period)) {
      newExpanded.delete(period)
    } else {
      newExpanded.add(period)
    }
    setExpandedGroups(newExpanded)
  }

  const handleCreateCategory = (title: string, selectedBookmarks: string[]) => {
    const newCategory: CustomCategory = {
      id: `custom_${Date.now()}`,
      title,
      bookmarks: selectedBookmarks,
      created_at: new Date()
    }
    setCustomCategories(prev => [...prev, newCategory])
  }

  const handleEditGroupTitle = (groupId: string, newTitle: string) => {
    if (groupId.startsWith('custom_')) {
      // Edit custom category
      setCustomCategories(prev => 
        prev.map(cat => cat.id === groupId ? { ...cat, title: newTitle } : cat)
      )
    } else {
      // Edit time-based group title
      const originalPeriod = groupId.replace('time_', '')
      setCustomTitles(prev => new Map(prev.set(originalPeriod, newTitle)))
    }
  }

  const handleDeleteGroup = (groupId: string) => {
    if (groupId.startsWith('custom_')) {
      setCustomCategories(prev => prev.filter(cat => cat.id !== groupId))
    }
  }

  // Expand all groups by default for better UX (only on initial load)
  useEffect(() => {
    if (timelineGroups.length > 0 && !hasInitializedExpanded.current) {
      const allPeriods = new Set(timelineGroups.map(g => g.id))
      setExpandedGroups(allPeriods)
      hasInitializedExpanded.current = true
    }
  }, [timelineGroups]) // Include timelineGroups but use ref to prevent re-expansion

  const totalBookmarks = bookmarks.length
  const filteredCount = timelineGroups.reduce((acc, group) => acc + group.count, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl">
            <Clock className="h-8 w-8 text-white" />
          </div>
          Timeline View
        </h1>
        <p className="text-gray-600">Chronological view of your bookmarks journey</p>
      </div>

      {/* Controls */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-l-blue-500">
        <div className="space-y-4">
          {/* Top Row - Create Category Button */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">Timeline Controls</h3>
              <Badge variant="secondary" className="text-xs">
                {customCategories.length} custom categories
              </Badge>
            </div>
            <Button
              onClick={() => setIsCreateCategoryOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Category
            </Button>
          </div>

          {/* Main Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search bookmarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Group By */}
          <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Group by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Category */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center space-x-2"
          >
            {sortOrder === 'desc' ? (
              <>
                <SortDesc className="h-4 w-4" />
                <span>Newest First</span>
              </>
            ) : (
              <>
                <SortAsc className="h-4 w-4" />
                <span>Oldest First</span>
              </>
            )}
          </Button>
                  </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-blue-200">
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Total: {totalBookmarks} bookmarks</span>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Showing: {filteredCount} bookmarks</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Groups: {timelineGroups.length}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedGroups(new Set(timelineGroups.map(g => g.id)))}
            >
              Expand All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedGroups(new Set())}
            >
              Collapse All
            </Button>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <div className="relative">
        {timelineGroups.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <BookmarkIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookmarks found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Start adding bookmarks to see your timeline.'}
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Bookmark
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {timelineGroups.map((group, groupIndex) => (
              <div key={group.id}>
                <TimelineGroupHeader
                  group={group}
                  isExpanded={expandedGroups.has(group.id)}
                  onToggle={() => toggleGroup(group.id)}
                  onEdit={handleEditGroupTitle}
                  onDelete={handleDeleteGroup}
                />
                
                {expandedGroups.has(group.id) && (
                  <div className="space-y-4">
                    {group.bookmarks.map((bookmark, bookmarkIndex) => (
                      <TimelineBookmarkCard
                        key={bookmark.id}
                        bookmark={bookmark}
                        userDefaultLogo={userDefaultLogo}
                        onBookmarkClick={onBookmarkClick}
                        index={bookmarkIndex}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Category Dialog */}
      <CreateCategoryDialog
        bookmarks={bookmarks}
        onCreateCategory={handleCreateCategory}
        open={isCreateCategoryOpen}
        onOpenChange={setIsCreateCategoryOpen}
      />
    </div>
  )
}
