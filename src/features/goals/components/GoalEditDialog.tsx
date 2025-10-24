'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Target, 
  Calendar, 
  Flag, 
  Bookmark, 
  Plus, 
  X, 
  Edit2, 
  Trash2,
  Link2,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Tag as TagIcon
} from 'lucide-react'

interface Goal {
  id: string
  name: string
  description: string
  color: string
  deadline_date: string
  goal_type: 'organize' | 'complete_all' | 'review_all' | 'learn_category' | 'research_topic' | 'custom'
  goal_description: string
  goal_status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'
  goal_priority: 'low' | 'medium' | 'high' | 'urgent'
  goal_progress: number
  connected_bookmarks?: string[] // Array of bookmark IDs
  tags?: string[]
  notes?: string
  folder_id?: string // Optional folder assignment
  created_at?: string
  updated_at?: string
}

interface Bookmark {
  id: string | number
  title: string
  url: string
  category?: string
  tags?: string[]
  description?: string
  isFavorite?: boolean
}

interface GoalFolder {
  id: string
  name: string
  description?: string
  color: string
}

interface GoalEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: Goal | null
  onSubmit: (goal: Goal) => void
  bookmarks: Bookmark[]
  folders?: GoalFolder[]
  selectedFolderId?: string
}

export const GoalEditDialog: React.FC<GoalEditDialogProps> = ({
  open,
  onOpenChange,
  goal,
  onSubmit,
  bookmarks,
  folders = [],
  selectedFolderId
}) => {
  const [formData, setFormData] = useState<Goal>({
    id: '',
    name: '',
    description: '',
    color: '#3b82f6',
    deadline_date: '',
    goal_type: 'custom',
    goal_description: '',
    goal_status: 'not_started',
    goal_priority: 'medium',
    goal_progress: 0,
    connected_bookmarks: [],
    tags: [],
    notes: '',
    folder_id: selectedFolderId || undefined
  })

  const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([])
  const [bookmarkSearch, setBookmarkSearch] = useState('')
  const [newTag, setNewTag] = useState('')

  // Initialize form data when goal changes
  useEffect(() => {
    if (goal) {
      setFormData({
        ...goal,
        connected_bookmarks: goal.connected_bookmarks || [],
        tags: goal.tags || [],
        folder_id: goal.folder_id || undefined
      })
      setSelectedBookmarks(goal.connected_bookmarks || [])
    } else {
      // Reset for new goal
      setFormData({
        id: Date.now().toString(),
        name: '',
        description: '',
        color: '#3b82f6',
        deadline_date: '',
        goal_type: 'custom',
        goal_description: '',
        goal_status: 'not_started',
        goal_priority: 'medium',
        goal_progress: 0,
        connected_bookmarks: [],
        tags: [],
        notes: '',
        folder_id: selectedFolderId || undefined
      })
      setSelectedBookmarks([])
    }
  }, [goal, selectedFolderId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const updatedGoal: Goal = {
      ...formData,
      connected_bookmarks: selectedBookmarks,
      updated_at: new Date().toISOString()
    }

    if (!goal) {
      updatedGoal.created_at = new Date().toISOString()
    }

    onSubmit(updatedGoal)
    onOpenChange(false)
  }

  const handleBookmarkToggle = (bookmarkId: string) => {
    setSelectedBookmarks(prev => 
      prev.includes(bookmarkId)
        ? prev.filter(id => id !== bookmarkId)
        : [...prev, bookmarkId]
    )
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }))
  }

  const filteredBookmarks = bookmarks.filter(bookmark =>
    bookmark.title.toLowerCase().includes(bookmarkSearch.toLowerCase()) ||
    bookmark.url.toLowerCase().includes(bookmarkSearch.toLowerCase()) ||
    bookmark.category?.toLowerCase().includes(bookmarkSearch.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in_progress': return 'bg-blue-500'
      case 'on_hold': return 'bg-yellow-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const goalTypeOptions = [
    { value: 'organize', label: 'Organize', description: 'Organize and categorize resources' },
    { value: 'complete_all', label: 'Complete All', description: 'Complete all items in this goal' },
    { value: 'review_all', label: 'Review All', description: 'Review all connected resources' },
    { value: 'learn_category', label: 'Learn Category', description: 'Learn about a specific topic or category' },
    { value: 'research_topic', label: 'Research Topic', description: 'Research and gather information on a topic' },
    { value: 'custom', label: 'Custom', description: 'Define your own custom goal type' }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {goal ? 'Edit Goal' : 'Create New Goal'}
          </DialogTitle>
          <DialogDescription>
            {goal ? 'Update your goal settings and connected bookmarks' : 'Create a new goal with deadlines, progress tracking, and bookmark connections'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="bookmarks">Connected Bookmarks</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
            </TabsList>

            <ScrollArea className="max-h-[60vh] mt-4">
              <TabsContent value="basic" className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Goal Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter goal name..."
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">Goal Color</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        id="color"
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="w-12 h-10 rounded border"
                      />
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your goal..."
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                {/* Folder Selection */}
                {folders.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="folder">Folder (Optional)</Label>
                    <Select
                      value={formData.folder_id || 'none'}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        folder_id: value === 'none' ? undefined : value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a folder or leave unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded bg-gray-300" />
                            <span>No folder (unassigned)</span>
                          </div>
                        </SelectItem>
                        {folders.map(folder => (
                          <SelectItem key={folder.id} value={folder.id}>
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: folder.color }}
                              />
                              <span>{folder.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Goal Type & Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="goal_type">Goal Type</Label>
                    <Select value={formData.goal_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, goal_type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select goal type" />
                      </SelectTrigger>
                      <SelectContent>
                        {goalTypeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-gray-500">{option.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goal_priority">Priority</Label>
                    <Select value={formData.goal_priority} onValueChange={(value: any) => setFormData(prev => ({ ...prev, goal_priority: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Status & Progress */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="goal_status">Status</Label>
                    <Select value={formData.goal_status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, goal_status: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadline_date">Deadline</Label>
                    <Input
                      id="deadline_date"
                      type="date"
                      value={formData.deadline_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, deadline_date: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <Label htmlFor="goal_progress">Progress ({formData.goal_progress}%)</Label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      id="goal_progress"
                      min="0"
                      max="100"
                      value={formData.goal_progress}
                      onChange={(e) => setFormData(prev => ({ ...prev, goal_progress: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <Progress value={formData.goal_progress} className="w-full" />
                  </div>
                </div>

                {/* Goal Description */}
                <div className="space-y-2">
                  <Label htmlFor="goal_description">Goal Description</Label>
                  <Textarea
                    id="goal_description"
                    placeholder="Detailed description of what you want to achieve..."
                    value={formData.goal_description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, goal_description: e.target.value }))}
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="bookmarks" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Connect Bookmarks</h3>
                  <Badge variant="secondary">
                    {selectedBookmarks.length} selected
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bookmark-search">Search Bookmarks</Label>
                  <Input
                    id="bookmark-search"
                    placeholder="Search by title, URL, or category..."
                    value={bookmarkSearch}
                    onChange={(e) => setBookmarkSearch(e.target.value)}
                  />
                </div>

                <ScrollArea className="h-64 border rounded-lg p-4">
                  <div className="space-y-2">
                    {filteredBookmarks.map(bookmark => (
                      <div key={bookmark.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                        <Checkbox
                          checked={selectedBookmarks.includes(bookmark.id.toString())}
                          onCheckedChange={() => handleBookmarkToggle(bookmark.id.toString())}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <Bookmark className="h-4 w-4 text-gray-400" />
                            <span className="font-medium truncate">{bookmark.title}</span>
                            {bookmark.isFavorite && <span className="text-yellow-500">★</span>}
                          </div>
                          <div className="text-xs text-gray-500 truncate">{bookmark.url}</div>
                          {bookmark.category && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {bookmark.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {filteredBookmarks.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        No bookmarks found matching your search.
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {selectedBookmarks.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Selected Bookmarks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedBookmarks.map(bookmarkId => {
                          const bookmark = bookmarks.find(b => b.id.toString() === bookmarkId)
                          return bookmark ? (
                            <Badge key={bookmarkId} variant="secondary" className="flex items-center gap-1">
                              {bookmark.title}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => handleBookmarkToggle(bookmarkId)}
                              />
                            </Badge>
                          ) : null
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Add a tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    />
                    <Button type="button" onClick={handleAddTag} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.tags && formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="flex items-center gap-1">
                          <TagIcon className="h-3 w-3" />
                          {tag}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => handleRemoveTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes, reminders, or details about this goal..."
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                  />
                </div>

                {/* Goal Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Goal Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <Badge className={`ml-2 ${getStatusColor(formData.goal_status)}`}>
                          {formData.goal_status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-gray-500">Priority:</span>
                        <Badge className={`ml-2 ${getPriorityColor(formData.goal_priority)}`}>
                          {formData.goal_priority}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-gray-500">Progress:</span>
                        <span className="ml-2 font-medium">{formData.goal_progress}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Bookmarks:</span>
                        <span className="ml-2 font-medium">{selectedBookmarks.length}</span>
                      </div>
                    </div>
                    {formData.deadline_date && (
                      <div className="text-sm">
                        <span className="text-gray-500">Deadline:</span>
                        <span className="ml-2 font-medium">
                          {new Date(formData.deadline_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.name.trim()}>
              {goal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

