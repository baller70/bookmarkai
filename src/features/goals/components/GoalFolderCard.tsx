'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Folder,
  Target,
  Edit2,
  Trash2,
  Plus,
  MoreVertical
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface GoalFolder {
  id: string
  name: string
  description?: string
  color: string
  goal_count?: number
  created_at?: string
  updated_at?: string
}

interface Goal {
  id: string
  name: string
  description?: string
  color: string
  goal_status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'
  goal_priority: 'low' | 'medium' | 'high' | 'urgent'
  goal_progress: number
  folder_id?: string
}

interface GoalFolderCardProps {
  folder: GoalFolder
  goals?: Goal[]
  onEdit: (folder: GoalFolder) => void
  onDelete: (folderId: string) => void
  onCreateGoal: (folderId: string) => void
  onEditGoal?: (goal: Goal) => void
  onDeleteGoal?: (goalId: string) => void
  onDrop?: (folderId: string, item: any) => void
  onDragOver?: (event: React.DragEvent) => void
  onClick?: (folder: GoalFolder) => void
  disableLink?: boolean
}

// Utility function to determine if a color is light or dark
const isLightColor = (hexColor: string): boolean => {
  // Remove # if present
  const hex = hexColor.replace('#', '')

  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  // Calculate luminance using the relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Return true if the color is light (luminance > 0.5)
  return luminance > 0.5
}

// Get appropriate text color for contrast
const getContrastTextColor = (backgroundColor: string): string => {
  return isLightColor(backgroundColor) ? 'text-gray-900' : 'text-white'
}

const GoalFolderCard: React.FC<GoalFolderCardProps> = ({
  folder,
  goals = [],
  onEdit,
  onDelete,
  onCreateGoal,
  onEditGoal,
  onDeleteGoal,
  onDrop,
  onDragOver,
  onClick,
  disableLink = false
}) => {
  const goalCount = goals.length || folder.goal_count || 0
  const [isDragOver, setIsDragOver] = useState(false)

  // Get folder color or default to blue
  const folderColor = folder.color || '#3B82F6'

  // Helper function to determine if color is light or dark for text contrast
  const isLightColor = (color: string) => {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000
    return brightness > 155
  }

  // Determine text color based on background
  const textColor = isLightColor(folderColor) ? '#000000' : '#FFFFFF'

  // Create hover color (slightly darker)
  const hoverColor = isDragOver ?
    `color-mix(in srgb, ${folderColor} 80%, black 20%)` :
    folderColor

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
    onDragOver?.(e)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    try {
      const data = e.dataTransfer.getData('application/json')
      const item = JSON.parse(data)

      if (item.type === 'goal' && onDrop) {
        onDrop(folder.id, item)
      }
    } catch (error) {
      console.error('Error parsing drag data:', error)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!disableLink && onClick) {
      onClick(folder)
    }
  }

  return (
    <div
      className={`
        bg-white rounded-xl border p-6 transition-all duration-200 cursor-pointer group
        ${isDragOver
          ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
          : 'border-gray-200 hover:shadow-md hover:border-gray-300'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      {/* Header with left-aligned folder icon and right-aligned menu */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm transition-all duration-200"
          style={{
            backgroundColor: hoverColor,
            transform: isDragOver ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          <Folder
            className="w-6 h-6 transition-colors duration-200"
            style={{ color: textColor }}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Edit folder clicked:', folder.name);
              onEdit(folder);
            }}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Folder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Add goal clicked for folder:', folder.name);
              onCreateGoal(folder.id);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Delete folder clicked:', folder.name);
                if (confirm(`Are you sure you want to delete the folder "${folder.name}"? Goals in this folder will be unassigned.`)) {
                  onDelete(folder.id);
                }
              }}
              className="text-red-600 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Left-aligned folder name */}
      <div className="flex-1 flex flex-col">
        <h3 className={`
          text-lg font-semibold mb-2 line-clamp-2 uppercase tracking-wide transition-colors
          ${isDragOver ? 'text-blue-900' : 'text-gray-900'}
        `}>
          {folder.name}
        </h3>

        {/* Left-aligned goal count with document icon */}
        <div className={`
          flex items-center mt-auto pt-4 transition-colors
          ${isDragOver ? 'text-blue-700' : 'text-gray-500'}
        `}>
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm">
            {goalCount} {goalCount === 1 ? 'goal' : 'goals'}
          </span>
        </div>

        {/* Drop zone indicator */}
        {isDragOver && (
          <div className="mt-2 text-xs text-blue-600 font-medium">
            Drop goal here
          </div>
        )}
      </div>
    </div>
  );
}

export default GoalFolderCard
