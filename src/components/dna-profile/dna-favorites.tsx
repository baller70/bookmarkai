'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Grid3X3,
  List,
  Search,
  Star,
  Heart,
  ExternalLink,
  Trash2,
  Move,
  X,
  GripVertical,
  Clock,
  Eye,
  SortDesc,
  Bookmark
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

import { enhanceOnLoad } from '../../../lib/image/enhanceOnLoad'

interface Favorite {
  id: string
  url: string
  title: string
  favicon: string
  tags: string[]
  addedAt: string
  visitCount?: number
}

// Mock data for demonstration
const mockFavorites: Favorite[] = [
  {
    id: '1',
    url: 'https://react.dev',
    title: 'React - The library for web and native user interfaces',
    favicon: 'https://www.google.com/s2/favicons?domain=react.dev&sz=64',
    tags: ['Development', 'Frontend', 'JavaScript'],
    addedAt: '2024-01-15T10:30:00Z',
    visitCount: 24
  },
  {
    id: '2',
    url: 'https://www.typescriptlang.org',
    title: 'TypeScript: JavaScript With Syntax For Types',
    favicon: 'https://www.google.com/s2/favicons?domain=typescriptlang.org&sz=64',
    tags: ['Development', 'TypeScript', 'Programming'],
    addedAt: '2024-01-14T15:45:00Z',
    visitCount: 18
  },
  {
    id: '3',
    url: 'https://dribbble.com',
    title: 'Dribbble - Discover the World&apos;s Top Designers & Creative Professionals',
    favicon: 'https://www.google.com/s2/favicons?domain=dribbble.com&sz=64',
    tags: ['Design', 'Inspiration', 'UI/UX'],
    addedAt: '2024-01-13T09:15:00Z',
    visitCount: 32
  },
  {
    id: '4',
    url: 'https://github.com',
    title: 'GitHub - Where the world builds software',
    favicon: 'https://www.google.com/s2/favicons?domain=github.com&sz=64',
    tags: ['Development', 'Version Control', 'Open Source'],
    addedAt: '2024-01-12T14:20:00Z',
    visitCount: 45
  },
  {
    id: '5',
    url: 'https://stackoverflow.com',
    title: 'Stack Overflow - Where Developers Learn, Share, & Build Careers',
    favicon: 'https://www.google.com/s2/favicons?domain=stackoverflow.com&sz=64',
    tags: ['Development', 'Q&A', 'Programming'],
    addedAt: '2024-01-11T11:30:00Z',
    visitCount: 28
  },
  {
    id: '6',
    url: 'https://tailwindcss.com',
    title: 'Tailwind CSS - Rapidly build modern websites without ever leaving your HTML',
    favicon: 'https://www.google.com/s2/favicons?domain=tailwindcss.com&sz=64',
    tags: ['CSS', 'Framework', 'Design'],
    addedAt: '2024-01-10T16:45:00Z',
    visitCount: 19
  },
  {
    id: '7',
    url: 'https://nextjs.org',
    title: 'Next.js - The React Framework for Production',
    favicon: 'https://www.google.com/s2/favicons?domain=nextjs.org&sz=64',
    tags: ['React', 'Framework', 'Full-stack'],
    addedAt: '2024-01-09T13:10:00Z',
    visitCount: 37
  },
  {
    id: '8',
    url: 'https://vercel.com',
    title: 'Vercel - Build, deploy, and scale apps with zero configuration',
    favicon: 'https://www.google.com/s2/favicons?domain=vercel.com&sz=64',
    tags: ['Deployment', 'Hosting', 'DevOps'],
    addedAt: '2024-01-08T10:25:00Z',
    visitCount: 15
  },
  {
    id: '9',
    url: 'https://figma.com',
    title: 'Figma - The collaborative interface design tool',
    favicon: 'https://www.google.com/s2/favicons?domain=figma.com&sz=64',
    tags: ['Design', 'UI/UX', 'Collaboration'],
    addedAt: '2024-01-07T15:50:00Z',
    visitCount: 22
  },
  {
    id: '10',
    url: 'https://supabase.com',
    title: 'Supabase - The open source Firebase alternative',
    favicon: 'https://www.google.com/s2/favicons?domain=supabase.com&sz=64',
    tags: ['Database', 'Backend', 'Open Source'],
    addedAt: '2024-01-06T12:35:00Z',
    visitCount: 31
  }
]

type ViewMode = 'grid' | 'list'
type SortOption = 'recent' | 'most-opened' | 'alphabetical'

const FavoritesSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
      <div className="h-4 bg-gray-100 rounded w-96 animate-pulse" />
    </div>
    <div className="flex gap-4">
      <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse" />
      <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
      ))}
    </div>
  </div>
)

const EmptyFavoritesState = () => (
  <Card className="text-center py-16">
    <CardContent>
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Bookmark className="h-8 w-8 text-gray-400" />
      </div>
      <CardTitle className="mb-2">No favorites yet</CardTitle>
      <CardDescription>
        Start building your collection by adding bookmarks and important links
      </CardDescription>
    </CardContent>
  </Card>
)

const FavoriteCard = ({
  favorite,
  isSelected,
  onSelect,
  onOpen,
  isDragging = false,
  dragHandleProps = {}
}: {
  favorite: Favorite
  isSelected: boolean
  onSelect: (checked: boolean) => void
  onOpen: () => void
  isDragging?: boolean
  dragHandleProps?: Record<string, unknown>
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Card
      className={`group cursor-pointer transition-all duration-200 hover:shadow-md border-gray-200 bg-white hover:border-gray-300 ${
        isDragging ? 'shadow-lg border-gray-300 rotate-1 scale-105 z-50' : ''
      } ${isSelected ? 'ring-2 ring-blue-500/20 border-blue-300 bg-blue-50/30' : ''} overflow-hidden`}
      onClick={onOpen}
      {...dragHandleProps}
    >
      {/* Header with favicon and actions */}
      <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          />
          <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
            <img
              src={favorite.favicon}
              alt=""
              className="w-5 h-5"
              onLoad={enhanceOnLoad(64)}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                try {
                  const domain = new URL(favorite.url).hostname;
                  if (domain && domain.length > 1) {
                    target.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
                  } else {
                    target.src = '/placeholder.svg'
                  }
                } catch {
                  target.src = '/placeholder.svg'
                }
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation()
              toast.success('Added to favorites')
            }}
          >
            <Heart className="h-4 w-4" />
            </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation()
              toast.success('Added to starred')
            }}
          >
            <Star className="h-4 w-4" />
            </Button>
          <div className="cursor-grab active:cursor-grabbing ml-1">
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
          </div>
        </div>

      {/* Content */}
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-bold text-gray-900 font-audiowide uppercase text-sm group-hover:text-blue-600 transition-colors line-clamp-2">
              {favorite.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1 truncate">
              {favorite.url}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {favorite.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                {tag}
              </Badge>
            ))}
            {favorite.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                +{favorite.tags.length - 3}
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(favorite.addedAt)}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {favorite.visitCount || 0}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const FavoriteRow = ({
  favorite,
  isSelected,
  onSelect,
  onOpen
}: {
  favorite: Favorite
  isSelected: boolean
  onSelect: (checked: boolean) => void
  onOpen: () => void
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <Card
      className={`group cursor-pointer transition-all duration-200 hover:shadow-sm border-gray-200 bg-white hover:border-gray-300 ${
        isSelected ? 'ring-2 ring-blue-500/20 border-blue-300 bg-blue-50/30' : ''
      }`}
      onClick={onOpen}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          />

          <div className="w-8 h-8 bg-gray-50 rounded border border-gray-200 flex items-center justify-center flex-shrink-0">
            <img
              src={favorite.favicon}
              alt=""
              className="w-5 h-5"
              onLoad={enhanceOnLoad(64)}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                try {
                  const domain = new URL(favorite.url).hostname;
                  if (domain && domain.length > 1) {
                    target.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
                  } else {
                    target.src = '/placeholder.svg'
                  }
                } catch {
                  target.src = '/placeholder.svg'
                }
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 font-audiowide uppercase text-sm group-hover:text-blue-600 transition-colors truncate">
              {favorite.title}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {favorite.url}
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-500">
            <div className="flex flex-wrap gap-1">
              {favorite.tags.slice(0, 2).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs bg-gray-100 text-gray-700"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(favorite.addedAt)}
            </div>

            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {favorite.visitCount || 0}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation()
                toast.success('Added to favorites')
              }}
            >
              <Heart className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation()
                toast.success('Added to starred')
              }}
            >
              <Star className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const FavoriteDetailPanel = ({
  favorite,
  isOpen,
  onClose
}: {
  favorite: Favorite | null
  isOpen: boolean
  onClose: () => void
}) => {
  if (!favorite) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-50 rounded border border-gray-200 flex items-center justify-center">
              <img
                src={favorite.favicon}
                alt=""
                className="w-5 h-5"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  const parent = target.parentElement
                  if (parent) {
                    target.style.display = 'none'
                    const fallback = document.createElement('div')
                    fallback.className = 'w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-sm flex items-center justify-center text-white text-xs font-bold'
                    fallback.textContent = favorite.title.charAt(0).toUpperCase()
                    parent.appendChild(fallback)
                  }
                }}
              />
            </div>
            <span className="truncate">{favorite.title}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* URL */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">URL</h4>
            <p className="text-sm text-gray-600 break-all bg-gray-50 p-2 rounded border">
              {favorite.url}
            </p>
          </div>

          {/* Tags */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {favorite.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-gray-100 text-gray-700"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Statistics */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Statistics</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Date Added</span>
                <span className="text-sm font-medium">{formatDate(favorite.addedAt)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Visit Count</span>
                <span className="text-sm font-medium">{favorite.visitCount || 0} times</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Last Visited</span>
                <span className="text-sm font-medium">2 days ago</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={() => window.open(favorite.url, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Link
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => toast.success('Added to favorites')}
              >
                <Heart className="h-4 w-4 mr-2" />
                Favorite
              </Button>
              <Button
                variant="outline"
                onClick={() => toast.success('Added to starred')}
              >
                <Star className="h-4 w-4 mr-2" />
                Star
              </Button>
            </div>

            <Button
              variant="outline"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                toast.success('Favorite deleted')
                onClose()
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

const BulkToolbar = ({
  selectedCount,
  onMove,
  onDelete,
  onCancel
}: {
  selectedCount: number
  onMove: () => void
  onDelete: () => void
  onCancel: () => void
}) => (
  <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
    <Card className="shadow-lg border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-900">
            {selectedCount} selected
          </span>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onMove}>
              <Move className="h-4 w-4 mr-2" />
              Move
            </Button>
            <Button size="sm" variant="outline" onClick={onDelete} className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)

export default function DnaFavorites() {
  const [favorites] = useState<Favorite[]>(mockFavorites)
  const [isLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [selectedFavorite, setSelectedFavorite] = useState<Favorite | null>(null)
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false)

  // For SWR-like functionality (currently unused but kept for future implementation)
  // const mutate = () => {
  //   // Trigger refresh
  // }

  // Filter and sort favorites
  const filteredAndSortedFavorites = useMemo(() => {
    const filtered = favorites.filter(favorite =>
      favorite.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      favorite.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      favorite.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    switch (sortBy) {
      case 'recent':
        return filtered.sort((a, b) => {
          const aDate = a.addedAt ? new Date(a.addedAt) : new Date(0);
          const bDate = b.addedAt ? new Date(b.addedAt) : new Date(0);
          const aTime = isNaN(aDate.getTime()) ? 0 : aDate.getTime();
          const bTime = isNaN(bDate.getTime()) ? 0 : bDate.getTime();
          return bTime - aTime;
        })
      case 'most-opened':
        return filtered.sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0))
      case 'alphabetical':
        return filtered.sort((a, b) => a.title.localeCompare(b.title))
      default:
        return filtered
    }
  }, [favorites, searchQuery, sortBy])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Focus search on "/"
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
        searchInput?.focus()
      }

      // Toggle view mode with "g l"
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
        const handleSecondKey = (secondE: KeyboardEvent) => {
          if (secondE.key === 'l') {
            setViewMode(prev => prev === 'grid' ? 'list' : 'grid')
          }
          document.removeEventListener('keydown', handleSecondKey)
        }
        document.addEventListener('keydown', handleSecondKey)
        setTimeout(() => document.removeEventListener('keydown', handleSecondKey), 1000)
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredAndSortedFavorites.map(f => f.id)))
    } else {
      setSelectedItems(new Set())
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedItems)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedItems(newSelected)
  }

  const handleOpenFavorite = (favorite: Favorite) => {
    setSelectedFavorite(favorite)
    setIsDetailPanelOpen(true)
  }

  const handleBulkMove = () => {
    toast.success(`Moved ${selectedItems.size} favorites`)
    setSelectedItems(new Set())
  }

  const handleBulkDelete = () => {
    toast.success(`Deleted ${selectedItems.size} favorites`)
    setSelectedItems(new Set())
  }

  const handleBulkCancel = () => {
    setSelectedItems(new Set())
  }

  if (isLoading) {
    return <FavoritesSkeleton />
  }

  return (
    <div className="space-y-8">
      {/* Header - Following DNA settings pattern */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 font-audiowide uppercase">Favorites</h2>
          <p className="text-gray-600 mt-2">Your curated collection of bookmarks and important links</p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-audiowide uppercase">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
          <CardDescription>
            Find and organize your favorite content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search favorites... (Press / to focus)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-200"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-[140px] border-gray-200">
                  <SortDesc className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="most-opened">Most Opened</SelectItem>
                  <SelectItem value="alphabetical">A-Z</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center bg-white rounded-lg border border-gray-200">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Bulk selection controls */}
          {filteredAndSortedFavorites.length > 0 && (
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <Checkbox
                checked={selectedItems.size === filteredAndSortedFavorites.length}
                onCheckedChange={handleSelectAll}
                aria-label="Select all favorites"
              />
                <span className="text-sm text-gray-600">
                {selectedItems.size > 0 ? `${selectedItems.size} selected` : 'Select all'}
                </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content */}
      {filteredAndSortedFavorites.length === 0 ? (
        searchQuery ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <CardTitle className="mb-2 font-audiowide uppercase">No results found</CardTitle>
              <CardDescription>
                Try adjusting your search terms or filters to find what you&apos;re looking for.
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <EmptyFavoritesState />
        )
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-audiowide uppercase">
              <Bookmark className="h-5 w-5" />
              Your Favorites ({filteredAndSortedFavorites.length})
            </CardTitle>
            <CardDescription>
              {viewMode === 'grid' ? 'Grid view' : 'List view'} • Sorted by {sortBy.replace('-', ' ')}
            </CardDescription>
          </CardHeader>
          <CardContent>
        {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAndSortedFavorites.map((favorite) => (
                  <FavoriteCard
                    key={favorite.id}
                    favorite={favorite}
                    isSelected={selectedItems.has(favorite.id)}
                    onSelect={(checked) => handleSelectItem(favorite.id, checked)}
                    onOpen={() => handleOpenFavorite(favorite)}
                  />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
                {filteredAndSortedFavorites.map((favorite) => (
                  <FavoriteRow
                    key={favorite.id}
                    favorite={favorite}
                    isSelected={selectedItems.has(favorite.id)}
                    onSelect={(checked) => handleSelectItem(favorite.id, checked)}
                    onOpen={() => handleOpenFavorite(favorite)}
                  />
            ))}
          </div>
        )}
            </CardContent>
          </Card>
        )}

      {/* Bulk Toolbar */}
      {selectedItems.size > 0 && (
        <BulkToolbar
          selectedCount={selectedItems.size}
          onMove={handleBulkMove}
          onDelete={handleBulkDelete}
          onCancel={handleBulkCancel}
        />
      )}

      {/* Detail Panel */}
      <FavoriteDetailPanel
        favorite={selectedFavorite}
        isOpen={isDetailPanelOpen}
        onClose={() => {
          setIsDetailPanelOpen(false)
          setSelectedFavorite(null)
        }}
      />
    </div>
  )
}