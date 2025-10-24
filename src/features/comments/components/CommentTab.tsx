'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Plus,
  MessageSquare,
  Heart,
  Reply,
  MoreHorizontal,
  Edit2,
  Trash2,
  Flag,
  Pin,
  PinOff,
  ThumbsUp,
  ThumbsDown,
  Send,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Clock,
  User,
  Tag as TagIcon,
  AlertCircle,
  CheckCircle,
  Star,
  Bookmark as BookmarkIcon,
  Share2,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Paperclip,
  Smile,
  AtSign
} from 'lucide-react'
// Simple date formatting function to replace date-fns
const formatDistanceToNow = (date: Date, options?: { addSuffix?: boolean }) => {
  const now = (() => new Date())()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMinutes < 1) return 'just now'
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ${options?.addSuffix ? 'ago' : ''}`
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ${options?.addSuffix ? 'ago' : ''}`
  if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ${options?.addSuffix ? 'ago' : ''}`

  return date.toLocaleDateString()
}

interface Comment {
  id: string
  content: string
  author: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  createdAt: Date
  updatedAt?: Date
  likes: number
  dislikes: number
  userReaction?: 'like' | 'dislike' | null
  replies: Comment[]
  isPinned: boolean
  isResolved: boolean
  tags: string[]
  priority: 'low' | 'medium' | 'high'
  attachments?: {
    id: string
    name: string
    url: string
    type: string
    size: number
  }[]
  mentions: string[]
  parentId?: string
}

interface CommentTabProps {
  bookmarkId: string
  bookmarkTitle: string
  initialComments?: Comment[]
  onSave?: (comments: Comment[]) => void
}

export const CommentTab: React.FC<CommentTabProps> = ({
  bookmarkId,
  bookmarkTitle,
  initialComments,
  onSave
}) => {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTag, setFilterTag] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'likes' | 'replies'>('newest')
  const [showResolved, setShowResolved] = useState(false)
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [tags, setTags] = useState<string>('')
  const [isAddingComment, setIsAddingComment] = useState(false)

  // Mock current user
  const currentUser = {
    id: 'current-user',
    name: 'You',
    email: 'user@example.com',
    avatar: ''
  }

  // Seed initial comments from props (persisted in bookmark notes)
  useEffect(() => {
    if (initialComments && initialComments.length > 0) {
      setComments(initialComments)
    }
  }, [initialComments])

  // Load comments from API (starts empty for live data)
  useEffect(() => {
    const loadComments = async () => {
      try {
        // TODO: Replace with actual API call to fetch comments for this bookmark
        // const response = await fetch(`/api/comments?bookmarkId=${bookmarkId}`)
        // const data = await response.json()
        // setComments(data.comments || [])

        // For now, start with empty comments array for live data
        setComments([])
      } catch (error) {
        console.error('Failed to load comments:', error)
        setComments([])
      }
    }

    loadComments()
  }, [bookmarkId])

  // Filter and sort comments
  const filteredAndSortedComments = React.useMemo(() => {
    let filtered = comments.filter(comment => {
      const matchesSearch = comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           comment.author.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesTag = filterTag === 'all' || comment.tags.includes(filterTag)
      const matchesResolved = showResolved || !comment.isResolved

      return matchesSearch && matchesTag && matchesResolved
    })

    // Sort comments
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt.getTime() - a.createdAt.getTime()
        case 'oldest':
          return a.createdAt.getTime() - b.createdAt.getTime()
        case 'likes':
          return b.likes - a.likes
        case 'replies':
          return b.replies.length - a.replies.length
        default:
          return 0
      }
    })

    // Pin comments to top
    const pinned = filtered.filter(c => c.isPinned)
    const unpinned = filtered.filter(c => !c.isPinned)

    return [...pinned, ...unpinned]
  }, [comments, searchTerm, filterTag, sortBy, showResolved])

  // Get all unique tags
  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>()
    comments.forEach(comment => {
      comment.tags.forEach(tag => tagSet.add(tag))
      comment.replies.forEach(reply => {
        reply.tags.forEach(tag => tagSet.add(tag))
      })
    })
    return Array.from(tagSet)
  }, [comments])

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      content: newComment,
      author: currentUser,
      createdAt: new Date(),
      likes: 0,
      dislikes: 0,
      replies: [],
      isPinned: false,
      isResolved: false,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      priority: selectedPriority,
      mentions: [],
      attachments: []
    }

    setComments(prev => [comment, ...prev])
    setNewComment('')
    setTags('')
    setIsAddingComment(false)

    if (onSave) {
      onSave([comment, ...comments])
    }
  }, [newComment, tags, selectedPriority, comments, onSave, currentUser])

  const handleReply = useCallback(async (parentId: string, content: string) => {
    if (!content.trim()) return

    const reply: Comment = {
      id: `reply-${Date.now()}`,
      content,
      author: currentUser,
      createdAt: new Date(),
      likes: 0,
      dislikes: 0,
      replies: [],
      isPinned: false,
      isResolved: false,
      tags: [],
      priority: 'low',
      mentions: [],
      parentId,
      attachments: []
    }

    setComments(prev => prev.map(comment =>
      comment.id === parentId
        ? { ...comment, replies: [...comment.replies, reply] }
        : comment
    ))

    setReplyingTo(null)
  }, [currentUser])

  const handleReaction = useCallback((commentId: string, reaction: 'like' | 'dislike') => {
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        const currentReaction = comment.userReaction
        let newLikes = comment.likes
        let newDislikes = comment.dislikes
        let newReaction: 'like' | 'dislike' | null = reaction

        // Remove previous reaction
        if (currentReaction === 'like') newLikes--
        if (currentReaction === 'dislike') newDislikes--

        // Add new reaction if different from current
        if (currentReaction === reaction) {
          newReaction = null // Toggle off
        } else {
          if (reaction === 'like') newLikes++
          if (reaction === 'dislike') newDislikes++
        }

        return {
          ...comment,
          likes: newLikes,
          dislikes: newDislikes,
          userReaction: newReaction
        }
      }
      return comment
    }))
  }, [])

  const handlePin = useCallback((commentId: string) => {
    setComments(prev => prev.map(comment =>
      comment.id === commentId
        ? { ...comment, isPinned: !comment.isPinned }
        : comment
    ))
  }, [])

  const handleResolve = useCallback((commentId: string) => {
    setComments(prev => prev.map(comment =>
      comment.id === commentId
        ? { ...comment, isResolved: !comment.isResolved }
        : comment
    ))
  }, [])

  const handleDelete = useCallback((commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId))
  }, [])

  const getPriorityColor = (priority: Comment['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
    }
  }

  const getPriorityIcon = (priority: Comment['priority']) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-3 w-3" />
      case 'medium': return <Clock className="h-3 w-3" />
      case 'low': return <CheckCircle className="h-3 w-3" />
    }
  }

  return (
    <div className="space-y-4 h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Comments</h3>
          <Badge variant="secondary">{comments.length}</Badge>
        </div>

        <Dialog open={isAddingComment} onOpenChange={setIsAddingComment}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Comment</DialogTitle>
              <DialogDescription>
                Share your thoughts about "{bookmarkTitle}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Write your comment here..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Priority</label>
                  <Select value={selectedPriority} onValueChange={(value: any) => setSelectedPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Low</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <span>Medium</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span>High</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tags (comma-separated)</label>
                  <Input
                    placeholder="helpful, question, bug..."
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingComment(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Post Comment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search comments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={filterTag} onValueChange={setFilterTag}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {allTags.map(tag => (
                <SelectItem key={tag} value={tag}>
                  <div className="flex items-center space-x-2">
                    <TagIcon className="h-3 w-3" />
                    <span>{tag}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <div className="flex items-center space-x-2">
                  <SortDesc className="h-3 w-3" />
                  <span>Newest</span>
                </div>
              </SelectItem>
              <SelectItem value="oldest">
                <div className="flex items-center space-x-2">
                  <SortAsc className="h-3 w-3" />
                  <span>Oldest</span>
                </div>
              </SelectItem>
              <SelectItem value="likes">
                <div className="flex items-center space-x-2">
                  <ThumbsUp className="h-3 w-3" />
                  <span>Most Liked</span>
                </div>
              </SelectItem>
              <SelectItem value="replies">
                <div className="flex items-center space-x-2">
                  <Reply className="h-3 w-3" />
                  <span>Most Replies</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={showResolved ? "default" : "outline"}
            size="sm"
            onClick={() => setShowResolved(!showResolved)}
          >
            {showResolved ? "Hide" : "Show"} Resolved
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 pr-4">
          {filteredAndSortedComments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h3>
                <p className="text-gray-600 mb-4">
                  Be the first to share your thoughts about this bookmark.
                </p>
                <Button onClick={() => setIsAddingComment(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Comment
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedComments.map((comment) => (
              <Card key={comment.id} className={`${comment.isPinned ? 'border-blue-200 bg-blue-50' : ''} ${comment.isResolved ? 'opacity-75' : ''}`}>
                <CardContent className="p-4">
                  {/* Comment Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.author.avatar} />
                        <AvatarFallback>
                          {comment.author.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{comment.author.name}</span>
                          {comment.isPinned && (
                            <Pin className="h-3 w-3 text-blue-600" />
                          )}
                          {comment.isResolved && (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePin(comment.id)}>
                          {comment.isPinned ? (
                            <>
                              <PinOff className="h-4 w-4 mr-2" />
                              Unpin
                            </>
                          ) : (
                            <>
                              <Pin className="h-4 w-4 mr-2" />
                              Pin
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResolve(comment.id)}>
                          {comment.isResolved ? (
                            <>
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Mark Unresolved
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Resolved
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Flag className="h-4 w-4 mr-2" />
                          Report
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(comment.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Priority and Tags */}
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge variant="outline" className={getPriorityColor(comment.priority)}>
                      {getPriorityIcon(comment.priority)}
                      <span className="ml-1 capitalize">{comment.priority}</span>
                    </Badge>
                    {comment.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <TagIcon className="h-2 w-2 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Comment Content */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>

                  {/* Comment Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReaction(comment.id, 'like')}
                          className={comment.userReaction === 'like' ? 'text-blue-600' : ''}
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {comment.likes}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReaction(comment.id, 'dislike')}
                          className={comment.userReaction === 'dislike' ? 'text-red-600' : ''}
                        >
                          <ThumbsDown className="h-3 w-3 mr-1" />
                          {comment.dislikes}
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(comment.id)}
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        Reply ({comment.replies.length})
                      </Button>
                    </div>
                  </div>

                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <div className="mt-3 pl-6 border-l-2 border-gray-200">
                      <div className="flex space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {currentUser.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <Textarea
                            placeholder="Write a reply..."
                            rows={2}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.ctrlKey) {
                                const content = e.currentTarget.value
                                if (content.trim()) {
                                  handleReply(comment.id, content)
                                  e.currentTarget.value = ''
                                }
                              }
                            }}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setReplyingTo(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                const textarea = document.querySelector(`textarea`) as HTMLTextAreaElement
                                if (textarea?.value.trim()) {
                                  handleReply(comment.id, textarea.value)
                                  textarea.value = ''
                                }
                              }}
                            >
                              Reply
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies.length > 0 && (
                    <div className="mt-4 pl-6 border-l-2 border-gray-100 space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex space-x-3">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={reply.author.avatar} />
                            <AvatarFallback className="text-xs">
                              {reply.author.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-sm">{reply.author.name}</span>
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(reply.createdAt, { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{reply.content}</p>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReaction(reply.id, 'like')}
                                className={reply.userReaction === 'like' ? 'text-blue-600' : ''}
                              >
                                <ThumbsUp className="h-3 w-3 mr-1" />
                                {reply.likes}
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Reply className="h-3 w-3 mr-1" />
                                Reply
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
