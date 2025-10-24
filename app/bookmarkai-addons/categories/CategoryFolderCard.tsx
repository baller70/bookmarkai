"use client"

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Folder, Edit2, Trash2, MoreVertical } from 'lucide-react'

export interface CategoryFolder {
  id: string
  name: string
  description?: string
  color: string
  category_count?: number
  created_at?: string
  updated_at?: string
}

export interface CategoryFolderCardProps {
  folder: CategoryFolder
  count?: number
  onEdit: (folder: CategoryFolder) => void
  onDelete: (folderId: string) => void
  onDrop?: (folderId: string, item: any) => void
  onDragOver?: (event: React.DragEvent) => void
  onClick?: (folder: CategoryFolder) => void
  disableLink?: boolean
}

// Determine if a color is light for contrast
const isLightColor = (hexColor: string): boolean => {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000
  return brightness > 155
}

const getContrastTextColor = (backgroundColor: string): string => (
  isLightColor(backgroundColor) ? '#000000' : '#FFFFFF'
)


const CategoryFolderCard: React.FC<CategoryFolderCardProps> = ({
  folder,
  count,
  onEdit,
  onDelete,
  onDrop,
  onDragOver,
  onClick,
  disableLink = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const justDroppedRef = useRef(false)
  const dropResetTimer = useRef<NodeJS.Timeout | null>(null)
  const folderColor = folder.color || '#3B82F6'
  const textColor = getContrastTextColor(folderColor)
  const hoverColor = isDragOver ? `color-mix(in srgb, ${folderColor} 80%, black 20%)` : folderColor

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragOver(true); onDragOver?.(e)
  }
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragOver(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragOver(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragOver(false)
    // Prevent the immediate click that often fires after drop and navigates away
    justDroppedRef.current = true
    if (dropResetTimer.current) clearTimeout(dropResetTimer.current)
    dropResetTimer.current = setTimeout(() => { justDroppedRef.current = false }, 500)
    try {
      let raw = e.dataTransfer.getData('application/json')
      if (!raw) raw = e.dataTransfer.getData('text/plain') // Safari/cross-browser fallback
      const item = raw ? JSON.parse(raw) : null
      if (item?.type === 'category' && onDrop) onDrop(folder.id, item)
    } catch {}
  }

  const categoryCount = typeof count === 'number' ? count : (folder.category_count || 0)

  return (
    <div
      data-testid={`folder-card-${folder.id}`}
      className={`bg-white rounded-xl border p-6 transition-all duration-200 cursor-pointer group ${isDragOver ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' : 'border-gray-200 hover:shadow-md hover:border-gray-300'}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => { if (justDroppedRef.current) { e.preventDefault(); e.stopPropagation(); return; } if (!disableLink && onClick) onClick(folder) }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm transition-all duration-200"
          style={{ backgroundColor: hoverColor, transform: isDragOver ? 'scale(1.05)' : 'scale(1)' }}
        >
          <Folder className="w-6 h-6 transition-colors duration-200" style={{ color: textColor }} />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
              onClick={(e)=>{e.preventDefault(); e.stopPropagation();}}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48" onClick={(e)=>e.stopPropagation()}>
            <DropdownMenuItem onClick={(e)=>{e.preventDefault(); e.stopPropagation(); onEdit(folder)}}>
              <Edit2 className="h-4 w-4 mr-2" /> Edit Folder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e)=>{e.preventDefault(); e.stopPropagation(); if(confirm(`Delete folder "${folder.name}"? Categories will be unassigned.`)) onDelete(folder.id)}} className="text-red-600 dark:text-red-400">
              <Trash2 className="h-4 w-4 mr-2" /> Delete Folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 flex flex-col">
        <h3 className={`text-lg font-semibold mb-2 line-clamp-2 uppercase tracking-wide transition-colors ${isDragOver ? 'text-blue-900' : 'text-gray-900'}`}>
          {folder.name}
        </h3>
        <div className={`flex items-center mt-auto pt-4 transition-colors ${isDragOver ? 'text-blue-700' : 'text-gray-500'}`}>
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <span className="text-sm">{categoryCount} {categoryCount === 1 ? 'category' : 'categories'}</span>
        </div>
        {isDragOver && (<div className="mt-2 text-xs text-blue-600 font-medium">Drop category here</div>)}
      </div>
    </div>
  )
}

export default CategoryFolderCard

