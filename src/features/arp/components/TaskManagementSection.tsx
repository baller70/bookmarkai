'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar,
  User,
  Clock,
  Target,
  MessageSquare,
  Bell,
  Tag,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  PauseCircle
} from 'lucide-react'

interface ARPComment {
  id: string
  author: string
  content: string
  createdAt: Date
}

interface TaskManagementData {
  dueDate?: Date
  assignedTo?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'not_started' | 'in_progress' | 'review' | 'complete'
  progress: number
  tags: string[]
  estimatedHours?: number
  actualHours?: number
  comments: ARPComment[]
  reminderEnabled: boolean
  reminderDate?: Date
}

interface TaskManagementSectionProps {
  data: TaskManagementData
  onChange: (updates: Partial<TaskManagementData>) => void
  sectionTitle: string
}

export const TaskManagementSection: React.FC<TaskManagementSectionProps> = ({
  data,
  onChange,
  sectionTitle
}) => {
  const [newTag, setNewTag] = useState('')
  const [newComment, setNewComment] = useState('')
  const [showComments, setShowComments] = useState(false)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'low': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'text-green-600 bg-green-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
      case 'review': return 'text-purple-600 bg-purple-100'
      case 'not_started': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle className="h-4 w-4" />
      case 'in_progress': return <PlayCircle className="h-4 w-4" />
      case 'review': return <PauseCircle className="h-4 w-4" />
      case 'not_started': return <AlertCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const handleAddTag = () => {
    const trimmedTag = newTag.trim()
    if (trimmedTag && !data.tags.includes(trimmedTag)) {
      if (trimmedTag.length > 20) {
        // Could add toast notification here
        console.warn('Tag is too long (max 20 characters)')
        return
      }
      onChange({
        tags: [...data.tags, trimmedTag]
      })
      setNewTag('')
    }
  }

  const validateDueDate = (date: Date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return false
    const today = (() => new Date())()
    today.setHours(0, 0, 0, 0)
    return date >= today
  }

  const validateHours = (hours: number) => {
    return hours >= 0 && hours <= 1000 // Reasonable upper limit
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onChange({
      tags: data.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment: ARPComment = {
        id: `comment-${Date.now()}`,
        author: 'Current User', // This should come from auth context
        content: newComment.trim(),
        createdAt: (() => new Date())()
      }
      onChange({
        comments: [...data.comments, comment]
      })
      setNewComment('')
    }
  }

  const formatDate = (date: Date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'Invalid date'
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Card className="mt-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-blue-500" />
          Task Management
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status and Priority Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              {getStatusIcon(data.status)}
              Status
            </Label>
            <Select 
              value={data.status} 
              onValueChange={(value: any) => onChange({ status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Priority
            </Label>
            <Select 
              value={data.priority} 
              onValueChange={(value: any) => onChange({ priority: value })}
            >
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
        </div>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Progress
            </Label>
            <span className="text-sm font-medium">{data.progress}%</span>
          </div>
          <Progress value={data.progress} className="h-2" />
          <Input
            type="number"
            min="0"
            max="100"
            value={data.progress}
            onChange={(e) => onChange({ progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
            className="w-20 text-sm"
            placeholder="0-100"
          />
        </div>

        {/* Due Date and Assignment Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Due Date
            </Label>
            <Input
              type="date"
              value={data.dueDate && data.dueDate instanceof Date && !isNaN(data.dueDate.getTime()) ? data.dueDate.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                if (e.target.value) {
                  const newDate = new Date(e.target.value)
                  if (validateDueDate(newDate)) {
                    onChange({ dueDate: newDate })
                  } else {
                    console.warn('Due date cannot be in the past')
                  }
                } else {
                  onChange({ dueDate: undefined })
                }
              }}
              className={data.dueDate && data.dueDate instanceof Date && !isNaN(data.dueDate.getTime()) && !validateDueDate(data.dueDate) ? 'border-red-500' : ''}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Assigned To
            </Label>
            <Input
              placeholder="Enter assignee name or email..."
              value={data.assignedTo || ''}
              onChange={(e) => onChange({ assignedTo: e.target.value || undefined })}
            />
          </div>
        </div>

        {/* Time Tracking Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Estimated Hours
            </Label>
            <Input
              type="number"
              min="0"
              max="1000"
              step="0.5"
              placeholder="0"
              value={data.estimatedHours || ''}
              onChange={(e) => {
                const hours = e.target.value ? parseFloat(e.target.value) : undefined
                if (hours === undefined || validateHours(hours)) {
                  onChange({ estimatedHours: hours })
                } else {
                  console.warn('Invalid hours value')
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Actual Hours
            </Label>
            <Input
              type="number"
              min="0"
              max="1000"
              step="0.5"
              placeholder="0"
              value={data.actualHours || ''}
              onChange={(e) => {
                const hours = e.target.value ? parseFloat(e.target.value) : undefined
                if (hours === undefined || validateHours(hours)) {
                  onChange({ actualHours: hours })
                } else {
                  console.warn('Invalid hours value')
                }
              }}
            />
          </div>
        </div>

        {/* Tags Section */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {data.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveTag(tag)}
                  className="h-4 w-4 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              className="flex-1"
            />
            <Button onClick={handleAddTag} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Reminder Settings */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Reminder Settings
          </Label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={data.reminderEnabled}
                onChange={(e) => onChange({ reminderEnabled: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Enable reminders</span>
            </label>
            {data.reminderEnabled && (
              <Input
                type="datetime-local"
                value={data.reminderDate && data.reminderDate instanceof Date && !isNaN(data.reminderDate.getTime()) ? data.reminderDate.toISOString().slice(0, 16) : ''}
                onChange={(e) => onChange({
                  reminderDate: e.target.value ? new Date(e.target.value) : undefined
                })}
                className="w-auto"
              />
            )}
          </div>
        </div>

        <Separator />

        {/* Status Summary */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <Badge className={getPriorityColor(data.priority)}>
              {data.priority.toUpperCase()}
            </Badge>
            <Badge className={getStatusColor(data.status)}>
              {getStatusIcon(data.status)}
              <span className="ml-1">{data.status.replace('_', ' ').toUpperCase()}</span>
            </Badge>
            {data.assignedTo && (
              <Badge variant="outline" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {data.assignedTo}
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            {data.dueDate && data.dueDate instanceof Date && !isNaN(data.dueDate.getTime()) && (
              <div className={`${(() => new Date())() > data.dueDate ? 'text-red-600 font-medium' : ''}`}>
                Due: {formatDate(data.dueDate)}
              </div>
            )}
            {data.estimatedHours && data.actualHours && (
              <div className="text-xs">
                Time: {data.actualHours}h / {data.estimatedHours}h
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
