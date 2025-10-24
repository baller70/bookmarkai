'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MessageSquare,
  Send,
  User,
  Clock
} from 'lucide-react'

interface ARPComment {
  id: string
  author: string
  content: string
  createdAt: Date
}

interface CommentsSectionProps {
  comments: ARPComment[]
  onAddComment: (content: string) => void
  sectionTitle: string
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  comments,
  onAddComment,
  sectionTitle
}) => {
  const [newComment, setNewComment] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment.trim())
      setNewComment('')
    }
  }

  const formatTimeAgo = (date: Date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'Unknown time'
    }

    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-blue-500" />
            Comments
            {comments.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {comments.length}
              </Badge>
            )}
          </CardTitle>
          {comments.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Add Comment Form */}
        <div className="space-y-2">
          <Textarea
            placeholder={`Add a comment about "${sectionTitle}"...`}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
          </div>
        </div>

        {/* Comments List */}
        {comments.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700 border-t pt-3">
              Activity ({comments.length})
            </div>
            
            <ScrollArea className={isExpanded ? "h-64" : "h-32"}>
              <div className="space-y-3 pr-4">
                {comments
                  .sort((a, b) => {
                    const aTime = (a.createdAt instanceof Date && !isNaN(a.createdAt.getTime())) ? a.createdAt.getTime() : 0
                    const bTime = (b.createdAt instanceof Date && !isNaN(b.createdAt.getTime())) ? b.createdAt.getTime() : 0
                    return bTime - aTime
                  })
                  .map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {getInitials(comment.author)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {comment.author}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {comments.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No comments yet</p>
            <p className="text-xs text-gray-400">Start a discussion about this section</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
