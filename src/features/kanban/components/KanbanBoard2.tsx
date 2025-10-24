// @ts-nocheck
'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Target,
  Clock,
  Star,
  BookmarkIcon,
  ExternalLink,
  Calendar,
  Flag,
  Users,
  Tag as TagIcon,
  Search,
  Filter,
  Settings,
  Grip,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Zap,
  Globe,
  Archive,
  Copy,
  Move,
  Eye,
  Heart,
  MessageSquare,
  Paperclip,
  BarChart3,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react'
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
  useDroppable,
  useDraggable
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface KanbanCard {
  id: string
  title: string
  description?: string
  url?: string
  favicon?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'active' | 'completed' | 'archived'
  tags: string[]
  assignees?: string[]
  dueDate?: string
  createdAt: string
  updatedAt: string
  comments?: number
  attachments?: number
  progress?: number
  category?: string
  isFavorite?: boolean
}

interface KanbanColumn {
  id: string
  title: string
  description: string
  color: string
  icon: React.ComponentType<{ className?: string }>
  cards: KanbanCard[]
  limit?: number
  isCollapsed?: boolean
}

interface KanbanBoard2Props {
  bookmarks: any[]
  onBookmarkClick?: (bookmark: any) => void
  onSave?: (boards: KanbanColumn[]) => void
}

// Default columns configuration
const defaultColumns: Omit<KanbanColumn, 'cards'>[] = [
  {
    id: 'backlog',
    title: 'BACKLOG',
    description: 'Items to be reviewed and prioritized',
    color: '#6b7280',
    icon: Archive,
    limit: undefined,
    isCollapsed: false
  },
  {
    id: 'todo',
    title: 'TO DO',
    description: 'Ready to work on',
    color: '#f59e0b',
    icon: Clock,
    limit: undefined,
    isCollapsed: false
  },
  {
    id: 'in-progress',
    title: 'IN PROGRESS',
    description: 'Currently being worked on',
    color: '#3b82f6',
    icon: TrendingUp,
    limit: 5,
    isCollapsed: false
  },
  {
    id: 'review',
    title: 'REVIEW',
    description: 'Pending review or approval',
    color: '#8b5cf6',
    icon: Eye,
    limit: 3,
    isCollapsed: false
  },
  {
    id: 'done',
    title: 'DONE',
    description: 'Completed items',
    color: '#10b981',
    icon: CheckCircle,
    limit: undefined,
    isCollapsed: false
  }
]

// Priority colors and icons
const priorityConfig = {
  low: { color: 'bg-green-100 text-green-800', icon: '●' },
  medium: { color: 'bg-yellow-100 text-yellow-800', icon: '●' },
  high: { color: 'bg-orange-100 text-orange-800', icon: '●' },
  urgent: { color: 'bg-red-100 text-red-800', icon: '🔥' }
}

// Calculate real progress based on bookmark completion status
function calculateBookmarkProgress(bookmark: any): number {
  let completionScore = 0;
  let totalPossibleScore = 0;

  // AI Processing (40% of total progress)
  totalPossibleScore += 40;
  if (bookmark.ai_summary) completionScore += 15;
  if (bookmark.ai_tags && bookmark.ai_tags.length > 0) completionScore += 15;
  if (bookmark.ai_category) completionScore += 10;

  // Content Completeness (30% of total progress)
  totalPossibleScore += 30;
  if (bookmark.description && bookmark.description.trim()) completionScore += 10;
  if (bookmark.tags && bookmark.tags.length > 0) completionScore += 10;
  if (bookmark.notes && bookmark.notes.trim()) completionScore += 10;

  // Site Health (20% of total progress)
  totalPossibleScore += 20;
  if (bookmark.site_health) {
    switch (bookmark.site_health) {
      case 'excellent': completionScore += 20; break;
      case 'working': completionScore += 15; break;
      case 'fair': completionScore += 10; break;
      case 'poor': completionScore += 5; break;
      case 'broken': completionScore += 0; break;
      default: completionScore += 0;
    }
  }

  // Usage Activity (10% of total progress)
  totalPossibleScore += 10;
  if (bookmark.visits && bookmark.visits > 0) completionScore += 5;
  if (bookmark.time_spent && bookmark.time_spent > 0) completionScore += 5;

  return Math.round((completionScore / totalPossibleScore) * 100);
}

// Pool Card Component (matches column card format)
function PoolKanbanCard({ bookmark, index }: { bookmark: any; index: number }) {
  const card: KanbanCard = {
    id: bookmark.id?.toString() || `bookmark-${index}`,
    title: bookmark.title || 'Untitled',
    description: bookmark.description || bookmark.ai_summary || '',
    url: bookmark.url,
    favicon: (bookmark.custom_favicon || bookmark.favicon || `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url || 'https://example.com').hostname}&sz=64`),
    priority: 'medium' as const,
    status: 'active' as const,
    tags: bookmark.tags || bookmark.ai_tags || [],
    category: bookmark.category,
    isFavorite: bookmark.isFavorite,
    createdAt: bookmark.created_at || new Date().toISOString(),
    updatedAt: bookmark.updated_at || new Date().toISOString(),
    progress: calculateBookmarkProgress(bookmark),
    comments: 0,
    attachments: 0
  }

  const priorityInfo = priorityConfig[card.priority]

  return (
    <Card 
      className="flex-shrink-0 w-64 cursor-grab hover:shadow-md transition-all duration-200 border-l-4 group"
      style={{ borderLeftColor: card.isFavorite ? '#f59e0b' : 'transparent' }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify(card));
      }}
    >
      <CardContent className="p-4">
        {/* Card Header - matches column card format */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-gray-900 truncate cursor-pointer hover:text-blue-600">
              {card.title}
            </h4>
            {card.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {card.description}
              </p>
            )}
          </div>
          {card.favicon && (
            <img 
              src={card.favicon} 
              alt="favicon" 
              className="w-4 h-4 rounded flex-shrink-0 ml-2"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          )}
        </div>

        {/* Tags */}
        {card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {card.tags.slice(0, 2).map((tag, tagIndex) => (
              <Badge key={tagIndex} variant="secondary" className="text-xs px-2 py-0.5">
                {tag}
              </Badge>
            ))}
            {card.tags.length > 2 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{card.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Priority and Category */}
        <div className="flex items-center justify-between">
          <Badge 
            variant="outline" 
            className={`text-xs px-2 py-0.5 ${priorityInfo.color}`}
          >
            {priorityInfo.icon} {card.priority.toUpperCase()}
          </Badge>
          {card.category && (
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              {card.category}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Sortable Card Component
function SortableKanbanCard({ card, onEdit, onDelete, onBookmarkClick }: {
  card: KanbanCard
  onEdit: (card: KanbanCard) => void
  onDelete: (cardId: string) => void
  onBookmarkClick?: (card: KanbanCard) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const priorityInfo = priorityConfig[card.priority]
  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date()

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="mb-3 hover:shadow-md transition-all duration-200 cursor-pointer group border-l-4 relative"
            style={{ borderLeftColor: card.isFavorite ? '#f59e0b' : 'transparent' }}>
        {/* Drag Handle - Top Right Corner */}
        <div {...listeners} className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab hover:cursor-grabbing">
          <Grip className="h-4 w-4 text-gray-400" />
        </div>

        {/* Dropdown Menu - Top Center Position */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48">
              <DropdownMenuItem onClick={() => onEdit(card)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                if (card.url) {
                  window.open(card.url, '_blank');
                }
              }}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open URL
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(card.id)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardContent className="p-4">
          {/* Card Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h4 
                className="font-medium text-sm text-gray-900 truncate cursor-pointer hover:text-blue-600"
                onClick={() => {
                  // Find the original bookmark by ID and call onBookmarkClick with it
                  const originalBookmark = { 
                    id: parseInt(card.id),
                    title: card.title,
                    url: card.url,
                    description: card.description,
                    category: card.category,
                    tags: card.tags,
                    isFavorite: card.isFavorite,
                    created_at: card.createdAt,
                    updated_at: card.updatedAt
                  };
                  onBookmarkClick?.(originalBookmark);
                }}
              >
                {card.title}
              </h4>
              {card.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {card.description}
                </p>
              )}
            </div>
            

          </div>

          {/* Tags */}
          {card.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {card.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">
                  {tag}
                </Badge>
              ))}
              {card.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0">
                  +{card.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {card.progress !== undefined && (
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-500">Progress</span>
                <span className="text-xs font-medium">{card.progress}%</span>
              </div>
              <Progress value={card.progress} className="h-1" />
            </div>
          )}

          {/* Card Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-3">
              {/* Priority */}
              <div className="flex items-center space-x-1">
                <Badge className={`text-xs px-1.5 py-0 ${priorityInfo.color}`}>
                  <span className="mr-1">{priorityInfo.icon}</span>
                  {card.priority}
                </Badge>
              </div>

              {/* Due Date */}
              {card.dueDate && (
                <div className={`flex items-center space-x-1 ${isOverdue ? 'text-red-600' : ''}`}>
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(card.dueDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Comments */}
              {card.comments && card.comments > 0 && (
                <div className="flex items-center space-x-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{card.comments}</span>
                </div>
              )}

              {/* Attachments */}
              {card.attachments && card.attachments > 0 && (
                <div className="flex items-center space-x-1">
                  <Paperclip className="h-3 w-3" />
                  <span>{card.attachments}</span>
                </div>
              )}

              {/* Favorite */}
              {card.isFavorite && (
                <Heart className="h-3 w-3 text-yellow-500 fill-current" />
              )}
            </div>
          </div>

          {/* Assignees */}
          {card.assignees && card.assignees.length > 0 && (
            <div className="flex items-center justify-end mt-2 -space-x-1">
              {card.assignees.slice(0, 3).map((assignee, index) => (
                <Avatar key={index} className="h-6 w-6 border-2 border-white">
                  <AvatarFallback className="text-xs">
                    {assignee.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {card.assignees.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                  <span className="text-xs text-gray-600">+{card.assignees.length - 3}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Sortable Column Component
function SortableKanbanColumn({ column, onAddCard, onEditColumn, onDeleteColumn, onCardEdit, onCardDelete, onBookmarkClick, onDropCard }: {
  column: KanbanColumn
  onAddCard: (columnId: string) => void
  onEditColumn: (column: KanbanColumn) => void
  onDeleteColumn: (columnId: string) => void
  onCardEdit: (card: KanbanCard) => void
  onCardDelete: (cardId: string) => void
  onBookmarkClick?: (card: KanbanCard) => void
  onDropCard?: (columnId: string, card: KanbanCard) => void
}) {
  // CRITICAL DEBUG: Log column component loading
  console.log(`🏛️ SORTABLE KANBAN COLUMN LOADED - ${column.title}`)

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editingTitle, setEditingTitle] = useState(column.title)
  const [currentPage, setCurrentPage] = useState(1)
  const { setNodeRef } = useDroppable({
    id: column.id,
  })

  // Reset pagination when cards change significantly
  useEffect(() => {
    const totalPages = Math.ceil(column.cards.length / 5)
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [column.cards.length, currentPage])

  const CARDS_PER_PAGE = 5
  const totalCards = column.cards.length
  const totalPages = Math.ceil(totalCards / CARDS_PER_PAGE)
  const startIndex = (currentPage - 1) * CARDS_PER_PAGE
  const endIndex = startIndex + CARDS_PER_PAGE
  const paginatedCards = column.cards.slice(startIndex, endIndex)







  const isNearLimit = column.limit && column.cards.length >= column.limit * 0.8
  const isAtLimit = column.limit && column.cards.length >= column.limit

  // Reset to first page when cards change significantly
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [totalCards, currentPage, totalPages])

  return (
    <div className="flex-1 min-w-0">
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: column.color }}
              >
                <column.icon className="h-2.5 w-2.5 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  {isEditingTitle ? (
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value.toUpperCase())}
                      onBlur={() => {
                        onEditColumn({ ...column, title: editingTitle });
                        setIsEditingTitle(false);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          onEditColumn({ ...column, title: editingTitle });
                          setIsEditingTitle(false);
                        }
                      }}
                      className="h-6 text-sm font-semibold"
                      autoFocus
                    />
                  ) : (
                    <span 
                      onClick={() => setIsEditingTitle(true)}
                      className="cursor-pointer hover:text-blue-600"
                    >
                      {column.title}
                    </span>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {column.cards.length}
                    {column.limit && `/${column.limit}`}
                  </Badge>
                  {isNearLimit && (
                    <AlertCircle className="h-3 w-3 text-yellow-500" />
                  )}
                  {isAtLimit && (
                    <AlertCircle className="h-3 w-3 text-red-500" />
                  )}
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">{column.description}</p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAddCard(column.id)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Card
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEditColumn(column)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Column
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDeleteColumn(column.id)} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Column
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="flex-1 pt-0 flex flex-col">
          <div
            ref={setNodeRef}
            className="space-y-2 flex-1"
            style={{ minHeight: '320px' }} // Fixed height for consistency
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
              e.preventDefault();
              try {
                const cardData = JSON.parse(e.dataTransfer.getData('text/plain'));
                const newCard: KanbanCard = {
                  ...cardData,
                  id: `${cardData.id}-${Date.now()}`, // Ensure unique ID
                };
                onDropCard?.(column.id, newCard);
              } catch (error) {
                console.error('Failed to parse dropped card data:', error);
              }
            }}
          >
            <SortableContext items={paginatedCards.map(c => c.id)} strategy={verticalListSortingStrategy}>
              {paginatedCards.map((card) => (
                <SortableKanbanCard
                  key={card.id}
                  card={card}
                  onEdit={onCardEdit}
                  onDelete={onCardDelete}
                  onBookmarkClick={onBookmarkClick}
                />
              ))}
            </SortableContext>

            {!isAtLimit && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-500 hover:text-gray-700 hover:bg-gray-50 mt-2"
                onClick={() => onAddCard(column.id)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add a card
              </Button>
            )}
          </div>



          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-3 pt-3 border-t-2 border-blue-200 bg-blue-50 rounded-b-lg">
              <div className="flex items-center justify-between text-sm text-blue-800 mb-3 font-semibold">
                <span className="px-3 py-2 bg-white rounded-lg border-2 border-blue-300 shadow-sm">
                  📊 Showing {startIndex + 1}-{Math.min(endIndex, totalCards)} of {totalCards}
                </span>
                <span className="px-3 py-2 bg-white rounded-lg border-2 border-blue-300 shadow-sm">
                  📄 Page {currentPage} of {totalPages}
                </span>
              </div>
              <div className="flex items-center justify-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  const showPage = page === 1 || page === totalPages ||
                                  Math.abs(page - currentPage) <= 1;

                  if (!showPage && page !== 2 && page !== totalPages - 1) {
                    // Show ellipsis for gaps
                    if (page === 2 && currentPage > 4) {
                      return <span key={page} className="text-xs text-gray-400 px-1">...</span>;
                    }
                    if (page === totalPages - 1 && currentPage < totalPages - 3) {
                      return <span key={page} className="text-xs text-gray-400 px-1">...</span>;
                    }
                    return null;
                  }

                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "ghost"}
                      size="sm"
                      className="h-6 w-6 p-0 text-xs"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Card Edit Dialog
function CardEditDialog({ card, open, onOpenChange, onSave }: {
  card: KanbanCard | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (card: KanbanCard) => void
}) {
  const [formData, setFormData] = useState<KanbanCard>({
    id: '',
    title: '',
    description: '',
    url: '',
    priority: 'medium',
    status: 'active',
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    if (card) {
      // Ensure priority is never empty string to prevent Select component error
      setFormData({
        ...card,
        priority: card.priority && card.priority.trim() !== '' ? card.priority : 'medium'
      })
    } else {
      setFormData({
        id: Date.now().toString(),
        title: '',
        description: '',
        url: '',
        priority: 'medium',
        status: 'active',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
  }, [card])

  const handleSave = () => {
    console.log('💾 CardEditDialog: Saving card with data:', formData)

    const cardToSave = {
      ...formData,
      updatedAt: new Date().toISOString()
    }

    console.log('📤 CardEditDialog: Calling onSave with card:', cardToSave)
    onSave(cardToSave)

    console.log('🔄 CardEditDialog: Closing dialog')
    onOpenChange(false)

    // Reset form data for next use
    setFormData({
      id: '',
      title: '',
      description: '',
      url: '',
      tags: [],
      priority: 'medium',
      dueDate: '',
      assignee: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    console.log('✨ CardEditDialog: Form reset and dialog closed successfully')
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{card ? 'Edit Card' : 'Create New Card'}</DialogTitle>
          <DialogDescription>
            {card ? 'Update the card details' : 'Create a new card for your kanban board'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Card title..."
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                placeholder="https://..."
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Card description..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="progress">Progress (%)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={formData.progress || 0}
                onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => removeTag(tag)}
                    >
                      ×
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!formData.title.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {card ? '✏️ Update Card' : '➕ Create Card'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Main Kanban Board Component
export const KanbanBoard2: React.FC<KanbanBoard2Props> = ({ bookmarks, onBookmarkClick, onSave }) => {
  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null)
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false)
  const [isAddCardDialogOpen, setIsAddCardDialogOpen] = useState(false)
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null)
  const [rowTitles, setRowTitles] = useState<Record<number, string>>({})
  const [editingRowId, setEditingRowId] = useState<number | null>(null)
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [collapsedRows, setCollapsedRows] = useState<Set<number>>(new Set())

  // Helper function to toggle row collapse state
  const toggleRowCollapse = (rowIndex: number) => {
    const newCollapsed = new Set(collapsedRows)
    if (newCollapsed.has(rowIndex)) {
      newCollapsed.delete(rowIndex)
    } else {
      newCollapsed.add(rowIndex)
    }
    setCollapsedRows(newCollapsed)
  }

  // Row title editing functions
  const handleRowTitleEdit = (rowIndex: number) => {
    setEditingRowId(rowIndex)
  }

  const handleRowTitleSave = (rowIndex: number, newTitle: string) => {
    setRowTitles(prev => ({ ...prev, [rowIndex]: newTitle }))
    setEditingRowId(null)
  }

  const handleRowTitleCancel = () => {
    setEditingRowId(null)
  }

  const getRowTitle = (rowIndex: number, columnCount: number) => {
    return rowTitles[rowIndex] || `Row ${rowIndex + 1}`
  }

  // Helper function to group columns into rows of 3
  const groupColumnsIntoRows = (columns: KanbanColumn[]) => {
    const rows = []
    for (let i = 0; i < columns.length; i += 3) {
      rows.push(columns.slice(i, i + 3))
    }
    return rows
  }

  // Initialize columns with sample data
  useEffect(() => {
    const initialColumns: KanbanColumn[] = defaultColumns.map(col => ({
      ...col,
      cards: []
    }))

    // Convert bookmarks to cards
    const bookmarkCards: KanbanCard[] = bookmarks.map((bookmark, index) => ({
      id: bookmark.id?.toString() || `bookmark-${index}`,
      title: bookmark.title || 'Untitled',
      description: bookmark.description || bookmark.ai_summary || '',
      url: bookmark.url,
      favicon: (bookmark.custom_favicon || bookmark.favicon || `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=64`),
      priority: ['low', 'medium', 'high', 'urgent'][index % 4] as any,
      status: 'active',
      tags: bookmark.tags || bookmark.ai_tags || [],
      category: bookmark.category,
      isFavorite: bookmark.isFavorite,
      createdAt: bookmark.created_at || new Date().toISOString(),
      updatedAt: bookmark.updated_at || new Date().toISOString(),
      progress: calculateBookmarkProgress(bookmark),
      comments: Math.floor(Math.random() * 5),
      attachments: Math.floor(Math.random() * 3)
    }))

    // Distribute real bookmarks evenly across all columns
    bookmarkCards.forEach((card, index) => {
      const columnIndex = index % initialColumns.length
      initialColumns[columnIndex].cards.push(card)
    })

    setColumns(initialColumns)
  }, [bookmarks])

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCardId(null)

    if (!over) return

    const activeCardId = active.id as string
    const overContainerId = over.id as string

    // Find the active card and its current column
    let activeCard: KanbanCard | null = null
    let sourceColumnId: string | null = null

    for (const column of columns) {
      const card = column.cards.find(c => c.id === activeCardId)
      if (card) {
        activeCard = card
        sourceColumnId = column.id
        break
      }
    }

    if (!activeCard || !sourceColumnId) return

    // Determine if we're dropping on a column or another card
    let targetColumnId = overContainerId
    
    // If dropping on a card, find its parent column
    for (const column of columns) {
      if (column.cards.some(c => c.id === overContainerId)) {
        targetColumnId = column.id
        break
      }
    }

    // If dropping on same column and same position, do nothing
    if (sourceColumnId === targetColumnId) {
      const sourceColumn = columns.find(c => c.id === sourceColumnId)!
      const activeIndex = sourceColumn.cards.findIndex(c => c.id === activeCardId)
      const overIndex = sourceColumn.cards.findIndex(c => c.id === overContainerId)
      
      if (activeIndex !== overIndex && overIndex !== -1) {
        // Reorder within same column
        setColumns(prev => prev.map(column => {
          if (column.id === sourceColumnId) {
            const newCards = arrayMove(column.cards, activeIndex, overIndex)
            return { ...column, cards: newCards }
          }
          return column
        }))
      }
      return
    }

    // Move card between different columns
    setColumns(prev => prev.map(column => {
      if (column.id === sourceColumnId) {
        // Remove card from source column
        return {
          ...column,
          cards: column.cards.filter(c => c.id !== activeCardId)
        }
      }
      if (column.id === targetColumnId) {
        // Add card to target column
        return {
          ...column,
          cards: [...column.cards, activeCard!]
        }
      }
      return column
    }))

    // Save changes
    onSave?.(columns)
  }

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over events for better visual feedback
  }

  const handleAddCard = (columnId: string) => {
    setSelectedCard(null)
    setSelectedColumnId(columnId)
    setIsAddCardDialogOpen(true)
  }

  const handleEditCard = (card: KanbanCard) => {
    setSelectedCard(card)
    setIsCardDialogOpen(true)
  }

  const handleDeleteCard = async (cardId: string) => {
    // Optimistically remove from UI
    setColumns(prev => prev.map(column => ({
      ...column,
      cards: column.cards.filter(c => c.id !== cardId)
    })));

    // Only attempt DB delete for real bookmarks (skip sample/generated IDs)
    const isLikelyRealId = /^[0-9]+$/.test(cardId);
    if (!isLikelyRealId) return;

    try {
      const res = await fetch(`/api/bookmarks?id=${encodeURIComponent(cardId)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || !data?.success) {
        console.warn('Kanban 2.0: backend delete failed or not confirmed', { status: res.status, data });
      }
      // Notify other views to refresh (re-use existing app event wiring)
      try { window.dispatchEvent(new Event('bookmarkAdded')); } catch {}
      try { const bc = new BroadcastChannel('bookmarks'); bc.postMessage('bookmarkAdded'); setTimeout(() => bc.close(), 500); } catch {}
    } catch (err) {
      console.error('Kanban 2.0: delete error', err);
    }
  }

  const handleSaveCard = (card: KanbanCard) => {
    if (selectedCard) {
      // Update existing card
      setColumns(prev => prev.map(column => ({
        ...column,
        cards: column.cards.map(c => c.id === card.id ? card : c)
      })))

      // Show success message for card update
      console.log('✅ Card updated successfully:', card.title)
    } else {
      // Add new card to selected column (or first column as fallback)
      const targetColumnId = selectedColumnId || columns[0]?.id
      const newCard = { ...card, id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }

      setColumns(prev => prev.map(column =>
        column.id === targetColumnId
          ? { ...column, cards: [...column.cards, newCard] }
          : column
      ))

      // Show success message for new card
      console.log('✅ New card added successfully:', newCard.title, 'to column:', targetColumnId)

      // Find column name for better user feedback
      const targetColumn = columns.find(col => col.id === targetColumnId)
      if (targetColumn) {
        console.log(`📋 Card "${newCard.title}" added to "${targetColumn.title}" column`)
      }
    }

    // Reset selected column after adding card
    setSelectedColumnId(null)
  }

  const handleEditColumn = (updatedColumn: KanbanColumn) => {
    setColumns(prev => prev.map(column => 
      column.id === updatedColumn.id ? updatedColumn : column
    ))
    onSave?.(columns)
  }

  const handleDeleteColumn = (columnId: string) => {
    setColumns(prev => prev.filter(c => c.id !== columnId))
  }

  const handleDropCard = (columnId: string, card: KanbanCard) => {
    setColumns(prev => prev.map(column => 
      column.id === columnId 
        ? { ...column, cards: [...column.cards, card] }
        : column
    ))
    onSave?.(columns)
  }

  const handleAddColumn = (rowIndex: number) => {
    const newColumn: KanbanColumn = {
      id: `column-${Date.now()}`,
      title: 'NEW COLUMN',
      description: 'Add your description here',
      color: '#6b7280',
      icon: Target,
      cards: [],
      limit: undefined,
      isCollapsed: false
    }
    
    // Insert the new column at the end of the specified row
    const columnsPerRow = 3
    const insertIndex = (rowIndex + 1) * columnsPerRow
    const newColumns = [...columns]
    newColumns.splice(insertIndex, 0, newColumn)
    setColumns(newColumns)
    onSave?.(newColumns)
  }

  const handleAddRow = () => {
    const newColumns: KanbanColumn[] = [
      {
        id: `col-${Date.now()}-1`,
        title: 'TO DO',
        description: 'Tasks to be started',
        color: '#f59e0b',
        icon: Clock,
        cards: [],
        limit: undefined,
        isCollapsed: false
      },
      {
        id: `col-${Date.now()}-2`,
        title: 'IN PROGRESS',
        description: 'Currently working on',
        color: '#3b82f6',
        icon: TrendingUp,
        cards: [],
        limit: undefined,
        isCollapsed: false
      },
      {
        id: `col-${Date.now()}-3`,
        title: 'REVIEW',
        description: 'Pending review',
        color: '#8b5cf6',
        icon: Eye,
        cards: [],
        limit: undefined,
        isCollapsed: false
      },
      {
        id: `col-${Date.now()}-4`,
        title: 'DONE',
        description: 'Completed tasks',
        color: '#10b981',
        icon: CheckCircle,
        cards: [],
        limit: undefined,
        isCollapsed: false
      }
    ]
    
    setColumns(prev => [...prev, ...newColumns])
    onSave?.(columns)
  }

  const handleAddFromBookmark = (bookmark: any) => {
    if (!selectedColumnId) {
      return;
    }

    const newCard: KanbanCard = {
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: bookmark.title || 'Untitled',
      description: bookmark.description || bookmark.ai_summary || '',
      url: bookmark.url,
      favicon: (bookmark.custom_favicon || bookmark.favicon || `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url || 'https://example.com').hostname}&sz=64`),
      priority: 'medium',
      status: 'active',
      tags: bookmark.tags || bookmark.ai_tags || [],
      category: bookmark.category,
      isFavorite: bookmark.isFavorite,
      createdAt: bookmark.created_at || new Date().toISOString(),
      updatedAt: bookmark.updated_at || new Date().toISOString(),
      progress: 0,
      comments: 0,
      attachments: 0
    }

    setColumns(prev => {
      const updated = prev.map(column =>
        column.id === selectedColumnId
          ? { ...column, cards: [...column.cards, newCard] }
          : column
      );
      onSave?.(updated);
      return updated;
    });

    // Close the dialog and reset selection
    setIsAddCardDialogOpen(false);
    setSelectedColumnId(null);
  }

  const handleCreateNewCard = () => {
    setIsAddCardDialogOpen(false)
    setIsCardDialogOpen(true)
  }

  const filteredColumns = columns.map(column => ({
    ...column,
    cards: column.cards.filter(card =>
      card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }))

  // AddCardDialog Component
  const AddCardDialog = () => {
    const selectedColumn = columns.find(col => col.id === selectedColumnId)
    
    return (
      <Dialog open={isAddCardDialogOpen} onOpenChange={setIsAddCardDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl">Add Card to Column</DialogTitle>
            <DialogDescription>
              {selectedColumn && (
                <span className="inline-flex items-center gap-2 mt-2">
                  Adding to: <Badge variant="outline" className="font-medium">{selectedColumn.title}</Badge>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
        
        <div className="space-y-6 p-1">
          {/* Option Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={handleCreateNewCard}
              className="h-24 flex flex-col items-center justify-center space-y-2 border-2 hover:border-blue-300"
            >
              <Plus className="h-8 w-8 text-blue-600" />
              <span className="font-medium">Create New Card</span>
            </Button>
            <div className="flex flex-col">
              <div className="text-sm font-medium text-gray-700 mb-2">Or select from bookmarks below:</div>
              <div className="flex items-center justify-center h-16 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="flex items-center space-x-2 text-gray-500">
                  <BookmarkIcon className="h-5 w-5" />
                  <span className="text-sm">Choose from list below</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bookmark Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-medium text-gray-900">
                Select from Existing Bookmarks
              </Label>
              <Badge variant="secondary" className="text-xs">
                {bookmarks.length} available
              </Badge>
            </div>
            <ScrollArea className="h-72 w-full rounded-lg border-2 p-3">
              <div className="space-y-2">
                {bookmarks.map((bookmark, index) => (
                  <div
                    key={bookmark.id || `bookmark-${index}`}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-blue-50 cursor-pointer border border-gray-200 hover:border-blue-300 transition-all duration-200"
                    onClick={() => handleAddFromBookmark(bookmark)}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <img 
                        src={bookmark.custom_favicon || bookmark.favicon || `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url || 'https://example.com').hostname}&sz=64`}
                        alt=""
                        className="w-5 h-5 flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/favicon.ico';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {bookmark.title}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">
                          {bookmark.category || 'No category'} • {bookmark.url ? new URL(bookmark.url).hostname : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {bookmark.isFavorite && (
                        <Heart className="h-4 w-4 text-red-500 fill-current" />
                      )}
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
                {bookmarks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <BookmarkIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No bookmarks available</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => setIsAddCardDialogOpen(false)} className="w-full">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Kanban 2.0</h2>
        <p className="text-gray-600">Advanced task management with visual workflow tracking</p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => handleAddCard(columns[0]?.id)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Card
          </Button>
        </div>
      </div>


      {/* Kanban Board - Organized in rows of 3 columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          {groupColumnsIntoRows(filteredColumns).map((columnRow, rowIndex) => (
            <Card key={`row-${rowIndex}`} className="p-4">
              {/* Row Header with Collapse Toggle */}
              <div className="flex items-center justify-between mb-4 group">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRowCollapse(rowIndex)}
                    className="p-1 h-8 w-8"
                  >
                    {collapsedRows.has(rowIndex) ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                  {editingRowId === rowIndex ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        defaultValue={getRowTitle(rowIndex, columnRow.length)}
                        className="h-6 text-sm font-semibold"
                        style={{ width: '200px' }}
                        onBlur={(e) => handleRowTitleSave(rowIndex, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRowTitleSave(rowIndex, e.currentTarget.value)
                          } else if (e.key === 'Escape') {
                            handleRowTitleCancel()
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRowTitleCancel()}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-semibold text-gray-700">
                        {getRowTitle(rowIndex, columnRow.length)} ({columnRow.length} columns)
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRowTitleEdit(rowIndex)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {columnRow.reduce((total, col) => total + col.cards.length, 0)} cards
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddColumn(rowIndex)}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Column
                  </Button>
                </div>
              </div>

              {/* Collapsible Row Content */}
              {!collapsedRows.has(rowIndex) && (
                <div className="w-full">
                  <div className="grid grid-cols-3 gap-0 pb-4">
                    {columnRow.map((column) => (
                      <div key={column.id} className="min-w-0">
                        <SortableKanbanColumn
                          column={column}
                          onAddCard={handleAddCard}
                          onEditColumn={handleEditColumn}
                          onDeleteColumn={handleDeleteColumn}
                          onCardEdit={handleEditCard}
                          onCardDelete={handleDeleteCard}
                          onBookmarkClick={onBookmarkClick}
                          onDropCard={handleDropCard}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
          
          {/* Add New Row Button */}
          <Card className="p-4 border-dashed border-2 hover:bg-gray-50 transition-colors">
            <Button
              variant="ghost"
              onClick={handleAddRow}
              className="w-full h-20 flex flex-col items-center justify-center text-gray-500 hover:text-gray-700"
            >
              <Plus className="h-6 w-6 mb-2" />
              <span className="text-sm">Add New Row</span>
            </Button>
          </Card>
        </div>
      </DndContext>

      {/* Card Edit Dialog */}
      <CardEditDialog
        card={selectedCard}
        open={isCardDialogOpen}
        onOpenChange={setIsCardDialogOpen}
        onSave={handleSaveCard}
      />
      
      {/* Add Card Dialog */}
      <AddCardDialog />
    </div>
  )
}
