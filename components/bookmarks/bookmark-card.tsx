
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ExternalLinkIcon, 
  MoreVerticalIcon, 
  EditIcon,
  TrashIcon,
  StarIcon,
  FolderIcon,
  TagIcon,
  CalendarIcon
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bookmark } from '@/lib/types'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface BookmarkCardProps {
  bookmark: Bookmark
  onUpdate: (bookmark: Bookmark) => void
  onDelete: (bookmarkId: string) => void
}

export default function BookmarkCard({
  bookmark,
  onUpdate,
  onDelete
}: BookmarkCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleVisit = () => {
    if (bookmark?.url) {
      window.open(bookmark.url, '_blank', 'noopener,noreferrer')
      // TODO: Track visit analytics
    }
  }

  const handleDelete = async () => {
    if (!bookmark?.id) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/bookmarks/${bookmark.id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        onDelete(bookmark.id)
      }
    } catch (error) {
      console.error('Failed to delete bookmark:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent':
        return 'bg-green-500'
      case 'working':
        return 'bg-blue-500'
      case 'fair':
        return 'bg-yellow-500'
      case 'poor':
        return 'bg-orange-500'
      case 'broken':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (!bookmark) return null

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full hover:shadow-lg transition-all duration-200 group cursor-pointer">
        <CardContent className="p-4 h-full flex flex-col">
          {/* Header with favicon and actions */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage 
                  src={bookmark.favicon || bookmark.customFavicon} 
                  alt={`${bookmark.title} favicon`}
                />
                <AvatarFallback className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
                  {bookmark.title?.slice(0, 2)?.toUpperCase() || '🔗'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1">
                  <div 
                    className={cn(
                      "w-2 h-2 rounded-full",
                      getHealthColor(bookmark.siteHealth || 'working')
                    )}
                  />
                  {bookmark.folder && (
                    <Badge variant="secondary" className="text-xs">
                      <FolderIcon className="h-3 w-3 mr-1" />
                      {bookmark.folder.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleVisit}>
                  <ExternalLinkIcon className="h-4 w-4 mr-2" />
                  Open Link
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <StarIcon className="h-4 w-4 mr-2" />
                  Add to Favorites
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <EditIcon className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-600"
                  disabled={isLoading}
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Title and Description */}
          <div className="flex-1 mb-3" onClick={handleVisit}>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1 line-clamp-2 hover:text-blue-600 transition-colors">
              {bookmark.title}
            </h3>
            {bookmark.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                {bookmark.description}
              </p>
            )}
            {bookmark.aiSummary && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 line-clamp-2 italic">
                AI: {bookmark.aiSummary}
              </p>
            )}
          </div>

          {/* Tags */}
          {bookmark.tags && bookmark.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {bookmark.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  <TagIcon className="h-2 w-2 mr-1" />
                  {tag}
                </Badge>
              ))}
              {bookmark.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{bookmark.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-1">
              <CalendarIcon className="h-3 w-3" />
              <span>
                {bookmark.createdAt ? formatDistanceToNow(new Date(bookmark.createdAt), { addSuffix: true }) : ''}
              </span>
            </div>
            {bookmark.visits > 0 && (
              <span>{bookmark.visits} visits</span>
            )}
          </div>

          {/* Visit Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleVisit}
            className="w-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ExternalLinkIcon className="h-4 w-4 mr-2" />
            Visit
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
