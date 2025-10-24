
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { LoaderIcon, BookmarkIcon, BrainIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Bookmark, Folder } from '@/lib/types'

interface AddBookmarkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folders: Folder[]
  onBookmarkAdded: (bookmark: Bookmark) => void
}

export default function AddBookmarkDialog({
  open,
  onOpenChange,
  folders,
  onBookmarkAdded
}: AddBookmarkDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [useAI, setUseAI] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    category: 'General',
    folderId: '',
    notes: '',
    tags: ''
  })

  const resetForm = () => {
    setFormData({
      title: '',
      url: '',
      description: '',
      category: 'General',
      folderId: '',
      notes: '',
      tags: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.url || !formData.title) {
      toast.error('Please provide both URL and title')
      return
    }

    setIsLoading(true)

    try {
      const bookmarkData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        folderId: formData.folderId || undefined
      }

      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookmarkData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create bookmark')
      }

      const bookmark = await response.json()
      
      // If AI processing is enabled, process the bookmark
      if (useAI) {
        try {
          await fetch('/api/bookmarks/process-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookmarkId: bookmark.id })
          })
        } catch (error) {
          console.error('AI processing failed:', error)
          // Don't fail the whole operation if AI processing fails
        }
      }

      onBookmarkAdded(bookmark)
      resetForm()
      onOpenChange(false)
      toast.success('Bookmark added successfully!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add bookmark')
    } finally {
      setIsLoading(false)
    }
  }

  const extractMetadata = async () => {
    if (!formData.url) {
      toast.error('Please enter a URL first')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/extract-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formData.url })
      })

      if (response.ok) {
        const metadata = await response.json()
        setFormData(prev => ({
          ...prev,
          title: metadata.title || prev.title,
          description: metadata.description || prev.description,
        }))
        toast.success('Metadata extracted successfully!')
      }
    } catch (error) {
      console.error('Failed to extract metadata:', error)
      toast.error('Failed to extract page metadata')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <BookmarkIcon className="h-5 w-5 text-blue-600" />
            <span>Add New Bookmark</span>
          </DialogTitle>
          <DialogDescription>
            Add a new bookmark to your collection. Enable AI processing for automatic categorization and tagging.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* URL and Auto-extract */}
          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <div className="flex space-x-2">
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={extractMetadata}
                disabled={isLoading || !formData.url}
              >
                {isLoading ? <LoaderIcon className="h-4 w-4 animate-spin" /> : 'Extract'}
              </Button>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Bookmark title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this bookmark"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Category and Folder */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., Development, Learning"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="folder">Folder</Label>
              <Select value={formData.folderId} onValueChange={(value) => setFormData(prev => ({ ...prev, folderId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select folder (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Folder</SelectItem>
                  {folders?.map((folder) => (
                    <SelectItem key={folder?.id} value={folder?.id || ''}>
                      {folder?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="tag1, tag2, tag3"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            />
            <p className="text-xs text-slate-500">Separate tags with commas</p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Personal notes about this bookmark"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>

          {/* AI Processing Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="use-ai"
              checked={useAI}
              onCheckedChange={setUseAI}
            />
            <Label htmlFor="use-ai" className="flex items-center space-x-2 cursor-pointer">
              <BrainIcon className="h-4 w-4 text-purple-600" />
              <span>Enable AI processing for smart categorization and tagging</span>
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Bookmark'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
