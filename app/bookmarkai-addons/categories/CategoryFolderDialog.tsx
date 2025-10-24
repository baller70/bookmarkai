"use client"

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Folder, Palette, Save, X } from 'lucide-react'

export interface CategoryFolder {
  id: string
  user_id?: string
  name: string
  description?: string
  color: string
  category_count?: number
  created_at?: string
  updated_at?: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  folder: CategoryFolder | null
  onSubmit: (folder: CategoryFolder) => void
}

const colorOptions = [
  { value: '#3B82F6', label: 'Blue', class: 'bg-blue-500' },
  { value: '#10B981', label: 'Green', class: 'bg-green-500' },
  { value: '#F59E0B', label: 'Yellow', class: 'bg-yellow-500' },
  { value: '#EF4444', label: 'Red', class: 'bg-red-500' },
  { value: '#8B5CF6', label: 'Purple', class: 'bg-purple-500' },
  { value: '#06B6D4', label: 'Cyan', class: 'bg-cyan-500' },
  { value: '#F97316', label: 'Orange', class: 'bg-orange-500' },
  { value: '#84CC16', label: 'Lime', class: 'bg-lime-500' },
  { value: '#EC4899', label: 'Pink', class: 'bg-pink-500' },
  { value: '#6B7280', label: 'Gray', class: 'bg-gray-500' },
  { value: '#1E40AF', label: 'Dark Blue', class: 'bg-blue-800' },
  { value: '#059669', label: 'Dark Green', class: 'bg-green-600' },
  { value: '#DC2626', label: 'Dark Red', class: 'bg-red-600' },
  { value: '#7C3AED', label: 'Dark Purple', class: 'bg-purple-600' },
  { value: '#0891B2', label: 'Dark Cyan', class: 'bg-cyan-600' },
  { value: '#EA580C', label: 'Dark Orange', class: 'bg-orange-600' },
  { value: '#65A30D', label: 'Dark Lime', class: 'bg-lime-600' },
  { value: '#DB2777', label: 'Dark Pink', class: 'bg-pink-600' },
  { value: '#374151', label: 'Dark Gray', class: 'bg-gray-700' },
  { value: '#1F2937', label: 'Charcoal', class: 'bg-gray-800' },
]


// Utility functions for preview contrast (match Goal 2.0)
const isLightColor = (hexColor: string): boolean => {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}
const getContrastTextColor = (backgroundColor: string): string => (
  isLightColor(backgroundColor) ? 'text-gray-900' : 'text-white'
)

export default function CategoryFolderDialog({ open, onOpenChange, folder, onSubmit }: Props) {
  const [formData, setFormData] = useState<CategoryFolder>({ id: '', name: '', description: '', color: '#3B82F6' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (folder) {
      setFormData({ id: folder.id, name: folder.name, description: folder.description || '', color: folder.color || '#3B82F6' })
    } else {
      setFormData({ id: '', name: '', description: '', color: '#3B82F6' })
    }
  }, [folder])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    setIsSubmitting(true)
    try {
      const updated: CategoryFolder = {
        ...formData,
        id: folder?.id || `cat-folder-${Date.now()}`,
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        updated_at: new Date().toISOString(),
      }
      if (!folder) updated.created_at = new Date().toISOString()
      onSubmit(updated)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            {folder ? 'Edit Category Folder' : 'Create New Category Folder'}
          </DialogTitle>
          <DialogDescription>
            {folder ? 'Update your category folder settings' : 'Create a new folder to organize your categories'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name *</Label>
            <Input id="folder-name" placeholder="Enter folder name..." value={formData.name}
              onChange={(e)=>setFormData(prev=>({...prev, name: e.target.value}))} required maxLength={100} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder-description">Description</Label>
            <Textarea id="folder-description" placeholder="Optional description..." rows={3} maxLength={500}
              value={formData.description || ''}
              onChange={(e)=>setFormData(prev=>({...prev, description: e.target.value}))} />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Palette className="h-4 w-4"/>Folder Color</Label>
            <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto">
              {colorOptions.map(c => (
                <button key={c.value} type="button" title={c.label}
                  onClick={()=>setFormData(prev=>({...prev, color: c.value }))}
                  className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${c.class} ${formData.color===c.value? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2':'border-gray-300 hover:border-gray-400'}`} />
              ))}
            </div>
          </div>

          {/* Preview (icon card) */}
          {formData.name && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: formData.color }}
                  >
                    <Folder className={`h-6 w-6 ${getContrastTextColor(formData.color)}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 truncate">{formData.name}</h3>
                    {formData.description && (
                      <p className="text-sm text-gray-600 truncate">{formData.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview (dashed border) */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div
              className="p-4 rounded-lg border-2 border-dashed flex items-center gap-3"
              style={{ borderColor: formData.color }}
            >
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: formData.color }}
              />
              <div>
                <div className="font-medium text-sm">
                  {formData.name || 'Folder Name'}
                </div>
                {formData.description && (
                  <div className="text-xs text-gray-500 mt-1">
                    {formData.description}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={()=>onOpenChange(false)} disabled={isSubmitting}>
              <X className="h-4 w-4 mr-2"/>Cancel
            </Button>
            <Button type="submit" disabled={!formData.name.trim() || isSubmitting}>
              <Save className="h-4 w-4 mr-2"/>{isSubmitting? 'Saving...' : folder? 'Update Folder' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

