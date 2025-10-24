'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Target,
  Edit2,
  Trash2,
  MoreVertical,
  Calendar,
  Flag
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Goal {
  id: string
  name: string
  description?: string
  color: string
  deadline_date?: string
  goal_type: 'organize' | 'complete_all' | 'review_all' | 'learn_category' | 'research_topic' | 'custom'
  goal_description?: string
  goal_status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'
  goal_priority: 'low' | 'medium' | 'high' | 'urgent'
  goal_progress: number
  connected_bookmarks?: string[]
  tags?: string[]
  notes?: string
  folder_id?: string
  created_at?: string
  updated_at?: string
}

interface GoalCardProps {
  goal: Goal
  onEdit: (goal: Goal) => void
  onDelete: (goalId: string) => void
  onDragStart?: (e: React.DragEvent, goal: Goal) => void
  onClick?: (goal: Goal) => void
  draggable?: boolean
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onEdit,
  onDelete,
  onDragStart,
  onClick,
  draggable = true
}) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    const dragData = {
      type: 'goal',
      id: goal.id,
      name: goal.name,
      folder_id: goal.folder_id
    }
    e.dataTransfer.setData('application/json', JSON.stringify(dragData))
    onDragStart?.(e, goal)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleCardClick = () => {
    onClick?.(goal)
  }

  // Get text color that contrasts with goal color
  const getContrastTextColor = (backgroundColor: string) => {
    const hex = backgroundColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000
    return brightness > 128 ? '#374151' : 'white'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
      case 'on_hold': return 'text-yellow-600 bg-yellow-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString()
  }

  return (
    <Card
      className={`
        relative group cursor-pointer transition-all duration-200 hover:shadow-md
        ${isDragging
          ? 'opacity-50 scale-95'
          : 'border-gray-200 hover:border-gray-300'
        }
      `}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        {/* Header with Icon, Title and Action Buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: goal.color }}
            >
              <Target
                className="h-6 w-6 text-white"
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{goal.name}</h3>
          </div>

          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => { e.stopPropagation(); onEdit(goal); }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete the goal "${goal.name}"?`)) {
                  onDelete(goal.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm font-medium text-gray-900">{goal.goal_progress}%</span>
          </div>
          <Progress value={goal.goal_progress} className="h-2" />
        </div>

        {/* Info Rows */}
        <div className="space-y-3">
          {/* Deadline */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Deadline</span>
            <span className="text-sm text-gray-900">
              {goal.deadline_date ? formatDate(goal.deadline_date) : 'No deadline'}
            </span>
          </div>

          {/* Priority */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Priority</span>
            <span className="text-sm text-gray-900 capitalize">{goal.goal_priority}</span>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status</span>
            <span className="text-sm text-gray-900 capitalize">
              {goal.goal_status.replace('_', ' ')}
            </span>
          </div>

          {/* Bookmarks */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Bookmarks</span>
            <span className="text-sm text-gray-900">
              {goal.connected_bookmarks?.length || 0}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
