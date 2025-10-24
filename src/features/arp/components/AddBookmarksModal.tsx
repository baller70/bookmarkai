'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Search,
  ExternalLink,
  Check,
  X
} from 'lucide-react'

interface BookmarkWithRelations {
  id: string
  title: string
  url: string
  description?: string
  favicon?: string
  created_at?: string
}

interface AddBookmarksModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableBookmarks: BookmarkWithRelations[]
  selectedBookmarkIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
  onSave: (selectedIds: string[]) => void
}

export const AddBookmarksModal: React.FC<AddBookmarksModalProps> = ({
  open,
  onOpenChange,
  availableBookmarks,
  selectedBookmarkIds,
  onSelectionChange,
  onSave
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedBookmarkIds)

  // Reset local selection when modal opens
  React.useEffect(() => {
    if (open) {
      setLocalSelectedIds(selectedBookmarkIds)
      setSearchQuery('')
    }
  }, [open, selectedBookmarkIds])

  // Filter bookmarks based on search query
  const filteredBookmarks = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableBookmarks
    }

    const query = searchQuery.toLowerCase()
    return availableBookmarks.filter(bookmark => 
      bookmark.title.toLowerCase().includes(query) ||
      bookmark.url.toLowerCase().includes(query) ||
      bookmark.description?.toLowerCase().includes(query)
    )
  }, [availableBookmarks, searchQuery])

  const handleToggleBookmark = (bookmarkId: string) => {
    setLocalSelectedIds(prev => {
      if (prev.includes(bookmarkId)) {
        return prev.filter(id => id !== bookmarkId)
      } else {
        return [...prev, bookmarkId]
      }
    })
  }

  const handleSelectAll = () => {
    const allFilteredIds = filteredBookmarks.map(b => b.id)
    const allSelected = allFilteredIds.every(id => localSelectedIds.includes(id))
    
    if (allSelected) {
      // Deselect all filtered bookmarks
      setLocalSelectedIds(prev => prev.filter(id => !allFilteredIds.includes(id)))
    } else {
      // Select all filtered bookmarks
      const newSelected = [...new Set([...localSelectedIds, ...allFilteredIds])]
      setLocalSelectedIds(newSelected)
    }
  }

  const handleSave = () => {
    onSave(localSelectedIds)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setLocalSelectedIds(selectedBookmarkIds) // Reset to original selection
    onOpenChange(false)
  }

  const selectedCount = localSelectedIds.length
  const filteredSelectedCount = filteredBookmarks.filter(b => localSelectedIds.includes(b.id)).length
  const allFilteredSelected = filteredBookmarks.length > 0 && filteredBookmarks.every(b => localSelectedIds.includes(b.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-blue-500" />
            Add Related Bookmarks
          </DialogTitle>
          <DialogDescription>
            Select bookmarks to connect with this section. You can search and filter to find specific bookmarks.
          </DialogDescription>
        </DialogHeader>

        {/* Search and Stats */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search bookmarks by title, URL, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {filteredBookmarks.length} bookmark{filteredBookmarks.length !== 1 ? 's' : ''}
              </Badge>
              {selectedCount > 0 && (
                <Badge variant="default">
                  {selectedCount} selected
                </Badge>
              )}
            </div>
            
            {filteredBookmarks.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                {allFilteredSelected ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>
        </div>

        {/* Bookmarks List */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-2 pr-4">
            {filteredBookmarks.length > 0 ? (
              filteredBookmarks.map((bookmark) => {
                const isSelected = localSelectedIds.includes(bookmark.id)
                
                return (
                  <div
                    key={bookmark.id}
                    className={`
                      flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer
                      ${isSelected 
                        ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      }
                    `}
                    onClick={() => handleToggleBookmark(bookmark.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleToggleBookmark(bookmark.id)}
                      className="flex-shrink-0"
                    />
                    
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium flex-shrink-0
                        ${isSelected 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-600'
                        }
                      `}>
                        {bookmark.title?.[0]?.toUpperCase() || 'B'}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isSelected ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {bookmark.title}
                        </p>
                        <p className={`text-xs truncate ${
                          isSelected ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {bookmark.url}
                        </p>
                        {bookmark.description && (
                          <p className={`text-xs truncate mt-1 ${
                            isSelected ? 'text-blue-600' : 'text-gray-400'
                          }`}>
                            {bookmark.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <ExternalLink className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-1">
                  {searchQuery ? 'No bookmarks match your search' : 'No bookmarks available'}
                </p>
                {searchQuery && (
                  <p className="text-xs text-gray-400">
                    Try adjusting your search terms
                  </p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={localSelectedIds.length === 0}
          >
            <Check className="h-4 w-4 mr-2" />
            Add {selectedCount} Bookmark{selectedCount !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
