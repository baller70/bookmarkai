// @ts-nocheck
'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Plus,
  Upload,
  Image,
  Video,
  Music,
  FileText,
  Trash2,
  ExternalLink,
  Download
} from 'lucide-react'
import { AddBookmarksModal } from './AddBookmarksModal'
import { AddAssetsModal } from './AddAssetsModal'

import { ARPSummaryDashboard } from './ARPSummaryDashboard'
import { TipTapEditor } from '../../media/components/TipTapEditor'
import { useMediaLibrary } from '../../media/hooks/useMediaLibrary'

import { toast } from '@/hooks/use-toast'

interface ARPAsset {
  id: string
  type: 'image' | 'video' | 'audio' | 'document'
  name: string
  url: string
  size?: number
  uploadedAt: Date
}

interface ARPComment {
  id: string
  author: string
  content: string
  createdAt: Date
}

interface ARPSection {
  id: string
  title: string
  content: any[] // Novel editor content
  assets: ARPAsset[]
  relatedBookmarks: string[] // bookmark IDs

  // Task Management Fields
  dueDate?: Date
  assignedTo?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'not_started' | 'in_progress' | 'review' | 'complete'
  progress: number // 0-100
  tags: string[]
  estimatedHours?: number
  actualHours?: number
  comments: ARPComment[]
  reminderEnabled: boolean
  reminderDate?: Date

  // Timestamps
  createdAt: Date
  updatedAt: Date
}

interface ARPTabProps {
  bookmarkId: string
  initialData?: ARPSection[]
  onSave?: (sections: ARPSection[]) => void
}

  // Normalize date-like fields coming from JSON into Date instances to avoid runtime errors
  function normalizeSection(raw: any): ARPSection {
    // Helper function to safely create Date objects
    const safeDate = (value: any): Date | undefined => {
      if (!value) return undefined
      const date = value instanceof Date ? value : (() => new Date(value))()
      return isNaN(date.getTime()) ? undefined : date
    }

    const section: ARPSection = {
      ...raw,
      // Coerce Date fields safely
      dueDate: safeDate(raw.dueDate),
      reminderDate: safeDate(raw.reminderDate),
      createdAt: safeDate(raw.createdAt) || (() => new Date())(),
      updatedAt: safeDate(raw.updatedAt) || (() => new Date())(),
      // Ensure arrays exist
      assets: Array.isArray(raw.assets) ? raw.assets.map((a: any) => ({
        ...a,
        uploadedAt: safeDate(a?.uploadedAt) || safeDate(a?.created_at) || (() => new Date())(),
      })) : [],
      comments: Array.isArray(raw.comments) ? raw.comments.map((c: any) => ({
        ...c,
        createdAt: safeDate(c?.createdAt) || (() => new Date())(),
      })) : [],
      relatedBookmarks: Array.isArray(raw.relatedBookmarks) ? raw.relatedBookmarks : [],
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      progress: typeof raw.progress === 'number' ? raw.progress : 0,
      status: raw.status ?? 'not_started',
      priority: raw.priority ?? 'medium',
      reminderEnabled: Boolean(raw.reminderEnabled),
      // Keep content as-is (TipTap JSON blocks array)
      content: Array.isArray(raw.content) ? raw.content : [],
      title: typeof raw.title === 'string' ? raw.title : '',
      id: typeof raw.id === 'string' ? raw.id : `section-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    }
    return section
  }

  function normalizeSections(arr: any[] | undefined): ARPSection[] {
    if (!Array.isArray(arr) || arr.length === 0) return []
    try {
      return arr.map(normalizeSection)
    } catch (e) {
      console.error('Failed to normalize ARP sections:', e)
      return []
    }
  }

export const ARPTab: React.FC<ARPTabProps> = ({
  bookmarkId,
  initialData = [],
  onSave
}) => {
  const [sections, setSections] = useState<ARPSection[]>(
    normalizeSections(initialData).length > 0 ? normalizeSections(initialData) : [createNewSection()]
  )
  const [availableBookmarks, setAvailableBookmarks] = useState<any[]>([])
  const [isAddingBookmark, setIsAddingBookmark] = useState(false)
  const [addBookmarkMode, setAddBookmarkMode] = useState<'existing' | 'new' | null>(null)
  const [newBookmarkTitle, setNewBookmarkTitle] = useState('')
  const [newBookmarkUrl, setNewBookmarkUrl] = useState('')
  const [addBookmarksModalOpen, setAddBookmarksModalOpen] = useState(false)
  const [addAssetsModalOpen, setAddAssetsModalOpen] = useState(false)
  const { filteredFiles } = useMediaLibrary()

  // Debug media files loading with detailed tracing
  React.useEffect(() => {
    try {
      console.log('🔍 ARPTab: Media files loaded:', filteredFiles?.length || 0)
      if (filteredFiles && filteredFiles.length > 0) {
        console.log('🔍 ARPTab: Sample media file:', filteredFiles[0])
        // Check each media file for problematic date fields
        filteredFiles.forEach((file, index) => {
          console.log(`🔍 ARPTab: File ${index} uploadedAt type:`, typeof file.uploadedAt, file.uploadedAt)
          console.log(`🔍 ARPTab: File ${index} created_at type:`, typeof file.created_at, file.created_at)

          // Test the exact operations that might be causing the error
          try {
            const dateValue = file.uploadedAt || file.created_at
            console.log(`🔍 ARPTab: File ${index} dateValue:`, dateValue, typeof dateValue)

            if (dateValue) {
              const uploadedAt = dateValue instanceof Date ? dateValue : (() => new Date(dateValue || Date.now()))()
              console.log(`🔍 ARPTab: File ${index} uploadedAt after conversion:`, uploadedAt)
              console.log(`🔍 ARPTab: File ${index} uploadedAt.getTime():`, uploadedAt.getTime())
            }
          } catch (dateError) {
            console.error(`🚨 ARPTab: Error processing date for file ${index}:`, dateError)
          }
        })
      }
    } catch (error) {
      console.error('🚨 ARPTab: Error processing media files:', error)
      console.error('🚨 ARPTab: Error stack:', error.stack)
    }
  }, [filteredFiles])

  // Create a new empty section
  function createNewSection(): ARPSection {
    return {
      id: `section-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      title: '',
      content: [],
      assets: [],
      relatedBookmarks: [],

      // Task Management Defaults
      priority: 'medium',
      status: 'not_started',
      progress: 0,
      tags: [],
      comments: [],
      reminderEnabled: false,

      // Timestamps - avoid minification issues with new Date()
      createdAt: (() => new Date())(),
      updatedAt: (() => new Date())()
    }
  }

  // Load available bookmarks for related bookmarks feature
  React.useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const response = await fetch('/api/bookmarks')
        const data = await response.json()
        if (data.success && data.bookmarks) {
          // Filter out current bookmark
          const otherBookmarks = data.bookmarks.filter((b: any) => b.id !== bookmarkId)
          setAvailableBookmarks(otherBookmarks)
        }
      } catch (error) {
        console.error('Error loading bookmarks:', error)
      }
    }
    loadBookmarks()
  }, [bookmarkId])

  const updateSection = useCallback((sectionId: string, updates: Partial<ARPSection>) => {
    // Generate timestamp once to avoid minification issues with new Date() in production
    const timestamp = (() => new Date())();
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, ...updates, updatedAt: timestamp }
        : section
    ))
  }, [])

  const addNewSection = useCallback(() => {
    setSections(prev => [...prev, createNewSection()])
  }, [])

  const removeSection = useCallback((sectionId: string) => {
    if (sections.length > 1) {
      setSections(prev => prev.filter(section => section.id !== sectionId))
    }
  }, [sections.length])



  const addMediaAsset = useCallback((sectionId: string, mediaFile: any) => {
    try {
      console.log('🔍 ARPTab: addMediaAsset called with:', { sectionId, mediaFile })

      const section = sections.find(s => s.id === sectionId)
      if (!section) {
        console.log('🔍 ARPTab: Section not found:', sectionId)
        return
      }

      // Safely handle date conversion with detailed logging
      const dateValue = mediaFile.uploadedAt || mediaFile.created_at
      console.log('🔍 ARPTab: addMediaAsset dateValue:', dateValue, typeof dateValue)

      const uploadedAt = dateValue instanceof Date ? dateValue : (() => new Date(dateValue || Date.now()))()
      console.log('🔍 ARPTab: addMediaAsset uploadedAt after conversion:', uploadedAt)

      const newAsset: ARPAsset = {
        id: `media-asset-${Date.now()}`,
        type: getAssetType(mediaFile.type || mediaFile.mime_type),
        name: mediaFile.name,
        url: mediaFile.url,
        size: mediaFile.size,
        uploadedAt: uploadedAt
      }

      console.log('🔍 ARPTab: addMediaAsset created newAsset:', newAsset)
    } catch (error) {
      console.error('🚨 ARPTab: Error in addMediaAsset:', error)
      console.error('🚨 ARPTab: addMediaAsset error stack:', error.stack)
      return
    }

    updateSection(sectionId, {
      assets: [...section.assets, newAsset]
    })
  }, [sections, updateSection])

  const removeAsset = useCallback((sectionId: string, assetId: string) => {
    const section = sections.find(s => s.id === sectionId)
    if (!section) {
      console.error('Section not found:', sectionId);
      return;
    }

    const assetToRemove = section.assets.find(asset => asset.id === assetId);
    if (!assetToRemove) {
      console.error('Asset not found:', assetId);
      return;
    }

    const updatedAssets = section.assets.filter(asset => asset.id !== assetId);
    updateSection(sectionId, {
      assets: updatedAssets
    })

    console.log(`Asset "${assetToRemove.name}" removed successfully`);
  }, [sections, updateSection])

  const toggleRelatedBookmark = useCallback((sectionId: string, bookmarkId: string) => {
    const section = sections.find(s => s.id === sectionId)
    if (!section) {
      console.error('Section not found:', sectionId);
      return;
    }

    const isAlreadyRelated = section.relatedBookmarks.includes(bookmarkId)
    const updatedBookmarks = isAlreadyRelated
      ? section.relatedBookmarks.filter(id => id !== bookmarkId)
      : [...section.relatedBookmarks, bookmarkId]

    updateSection(sectionId, {
      relatedBookmarks: updatedBookmarks
    })

    const action = isAlreadyRelated ? 'removed from' : 'added to';
    console.log(`Bookmark ${action} related bookmarks successfully`);
  }, [sections, updateSection])

  // Modal bookmark selection handlers
  const handleOpenAddBookmarksModal = (sectionId: string) => {
    setCurrentSectionId(sectionId)
    setAddBookmarksModalOpen(true)
  }

  const handleSaveBookmarkSelection = (sectionId: string, selectedBookmarkIds: string[]) => {
    updateSection(sectionId, {
      relatedBookmarks: selectedBookmarkIds
    })
    setAddBookmarksModalOpen(false)
    console.log(`Updated related bookmarks: ${selectedBookmarkIds.length} bookmarks selected`);
  }

  // Track current section for modal
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null)

  // Asset Modal Handlers
  const handleOpenAddAssetsModal = (sectionId: string) => {
    setCurrentSectionId(sectionId)
    setAddAssetsModalOpen(true)
  }

  const handleSaveAssetSelection = (sectionId: string, selectedAssets: any[]) => {
    console.log('💾 Saving asset selection:', { sectionId, selectedAssets });

    // Convert selected assets to ARPAsset format
    const newAssets = selectedAssets.map(asset => ({
      id: asset.id,
      type: asset.type,
      name: asset.name,
      url: asset.url,
      size: asset.size,
      uploadedAt: asset.uploadedAt || (() => new Date())()
    }))

    const section = sections.find(s => s.id === sectionId)
    if (section) {
      // Merge with existing assets, avoiding duplicates
      const existingAssetIds = section.assets.map(a => a.id)
      const assetsToAdd = newAssets.filter(asset => !existingAssetIds.includes(asset.id))

      updateSection(sectionId, {
        assets: [...section.assets, ...assetsToAdd]
      })
    }

    setAddAssetsModalOpen(false)
    console.log(`Added ${newAssets.length} assets to section`);
  }

  const handleModalAssetUpload = async (files: FileList): Promise<any[]> => {
    console.log('📤 Uploading files:', files.length);

    const uploadedAssets = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      try {
        // Try to upload to the actual server first
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', getAssetType(file.type))
        formData.append('tags', `arp-asset,modal-upload`)

        const uploadResponse = await fetch('/api/user-data/upload', {
          method: 'POST',
          body: formData
        })

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()

          if (uploadResult.success) {
            uploadedAssets.push({
              id: uploadResult.data.id || `asset-${Date.now()}-${i}`,
              name: file.name,
              type: getAssetType(file.type),
              url: uploadResult.data.url,
              size: file.size,
              uploadedAt: (() => new Date())()
            })
            continue
          }
        }

        // Fallback to mock upload if server upload fails
        console.warn('Server upload failed, using mock upload for:', file.name)
        uploadedAssets.push({
          id: `mock-asset-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          name: file.name,
          type: getAssetType(file.type),
          url: URL.createObjectURL(file),
          size: file.size,
          uploadedAt: (() => new Date())()
        })

      } catch (error) {
        console.error('Upload error for file:', file.name, error)

        // Fallback to mock upload on error
        uploadedAssets.push({
          id: `error-asset-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          name: file.name,
          type: getAssetType(file.type),
          url: URL.createObjectURL(file),
          size: file.size,
          uploadedAt: (() => new Date())()
        })
      }
    }

    console.log('✅ Upload completed:', uploadedAssets);
    return uploadedAssets
  }

  // Quick Actions
  const markAllComplete = useCallback(() => {
    sections.forEach(section => {
      if (section.status !== 'complete') {
        updateSection(section.id, { status: 'complete', progress: 100 })
      }
    })
  }, [sections, updateSection])

  const resetAllProgress = useCallback(() => {
    sections.forEach(section => {
      updateSection(section.id, { status: 'not_started', progress: 0 })
    })
  }, [sections, updateSection])

  // Task Management Handlers
  const updateTaskManagement = useCallback((sectionId: string, updates: Partial<ARPSection>) => {
    updateSection(sectionId, updates)
  }, [updateSection])

  const handleAddComment = useCallback((sectionId: string, content: string) => {
    const section = sections.find(s => s.id === sectionId)
    if (!section) return

    const newComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      author: 'Current User', // This should come from auth context
      content,
      createdAt: (() => new Date())()
    }

    updateSection(sectionId, {
      comments: [...section.comments, newComment]
    })
  }, [sections, updateSection])

  const handleAddNewBookmark = useCallback(async () => {
    if (!newBookmarkTitle.trim() || !newBookmarkUrl.trim()) return

    try {
      // Create new bookmark via API
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newBookmarkTitle.trim(),
          url: newBookmarkUrl.trim(),
          category: 'Research', // Default category for ARP bookmarks
        }),
      })

      if (response.ok) {
        const newBookmark = await response.json()

        // Add to available bookmarks
        setAvailableBookmarks(prev => [newBookmark, ...prev])

        // Reset form
        setNewBookmarkTitle('')
        setNewBookmarkUrl('')
        setIsAddingBookmark(false)
        setAddBookmarkMode(null)
      }
    } catch (error) {
      console.error('Failed to create bookmark:', error)
    }
  }, [newBookmarkTitle, newBookmarkUrl])

  const handleAddExistingBookmark = useCallback((sectionId: string, bookmarkId: string) => {
    console.log('Adding existing bookmark to section:', { sectionId, bookmarkId });
    toggleRelatedBookmark(sectionId, bookmarkId);
    // Reset form
    setIsAddingBookmark(false)
    setAddBookmarkMode(null)
  }, [toggleRelatedBookmark])

  const handleCancelAddBookmark = useCallback(() => {
    setNewBookmarkTitle('')
    setNewBookmarkUrl('')
    setIsAddingBookmark(false)
    setAddBookmarkMode(null)
  }, [])

  const getAssetType = (mimeType: string): ARPAsset['type'] => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    return 'document'
  }

  const getAssetIcon = (type: ARPAsset['type']) => {
    switch (type) {
      case 'image': return <Image className="h-5 w-5 text-blue-500" />
      case 'video': return <Video className="h-5 w-5 text-purple-500" />
      case 'audio': return <Music className="h-5 w-5 text-green-500" />
      case 'document': return <FileText className="h-5 w-5 text-orange-500" />
    }
  }

  const getAssetTypeColor = (type: ARPAsset['type']) => {
    switch (type) {
      case 'image': return 'bg-blue-50 border-blue-200'
      case 'video': return 'bg-purple-50 border-purple-200'
      case 'audio': return 'bg-green-50 border-green-200'
      case 'document': return 'bg-orange-50 border-orange-200'
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Task Management Helper Functions
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

  const isOverdue = (dueDate?: Date) => {
    if (!dueDate || !(dueDate instanceof Date) || isNaN(dueDate.getTime())) return false
    return (() => new Date())() > dueDate
  }

  // Debounced auto-save with toast indicator
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  React.useEffect(() => {
    if (!onSave) return
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      try {
        setIsSaving(true)
        Promise.resolve(onSave(sections))
          .then(() => {
            toast({ title: 'Saved' })
          })
          .catch(() => {
            toast({ title: 'Save failed', description: 'We could not save your ARP content. Please retry.', variant: 'destructive' as any })
          })
          .finally(() => setIsSaving(false))
      } catch {
        setIsSaving(false)
      }
    }, 1000)

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [sections, onSave])

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">ACTION RESEARCH PLAN</h2>
        <Badge variant="secondary">{sections.length} Section{sections.length !== 1 ? 's' : ''}</Badge>
      </div>

      {/* Summary Dashboard */}
      <ARPSummaryDashboard sections={sections} />

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="space-y-8">
          {(() => {
            try {
              console.log('🔍 ARPTab: About to render sections.map, sections:', sections)
              console.log('🔍 ARPTab: sections is array:', Array.isArray(sections))
              console.log('🔍 ARPTab: sections type:', typeof sections)
              console.log('🔍 ARPTab: sections length:', sections?.length)

              if (!Array.isArray(sections)) {
                console.error('🚨 ARPTab: sections is not an array in main render!')
                return <div>Error: sections is not an array</div>
              }

              return sections.map((section, index) => {
                try {
                  console.log(`🔍 ARPTab: Rendering section ${index}:`, section)
                  return (
            <Card key={section.id} className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <Input
                      placeholder="ENTER SECTION TITLE..."
                      value={section.title}
                      onChange={(e) => updateSection(section.id, { title: e.target.value })}
                      className="text-lg font-bold uppercase border-0 px-0 focus:ring-0 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Status Indicators */}
                  <div className="flex items-center gap-2 mr-4">
                    <Badge className={getStatusColor(section.status)} variant="secondary">
                      {section.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge className={getPriorityColor(section.priority)} variant="secondary">
                      {section.priority.toUpperCase()}
                    </Badge>
                    {section.progress > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {section.progress}%
                      </Badge>
                    )}
                    {section.dueDate && section.dueDate instanceof Date && !isNaN(section.dueDate.getTime()) && (
                      <Badge
                        variant={isOverdue(section.dueDate) ? "destructive" : "outline"}
                        className="text-xs"
                      >
                        Due: {section.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Badge>
                    )}
                  </div>

                  {sections.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSection(section.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* 1. Title (handled in header) */}

                {/* 2. Large Text Box with Novel Editor */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">CONTENT</h4>
                  <div className="border rounded-lg min-h-[200px]">
                    <TipTapEditor
                      content={section.content}
                      onChange={(content) => updateSection(section.id, { content })}
                      className="min-h-[200px]"
                      placeholder="Start writing your action research plan... Press '/' for commands"
                      bookmarkId={bookmarkId}
                    />
                  </div>
                </div>

                {/* 3. Assets Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                      <Upload className="h-5 w-5 text-blue-500" />
                      <span>Assets</span>
                    </h4>
                    {section.assets.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {section.assets.length} file{section.assets.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>

                  {/* Add Assets Button */}
                  <div className="mb-4">
                    <Button
                      variant="outline"
                      onClick={() => handleOpenAddAssetsModal(section.id)}
                      className="w-full justify-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Assets ({filteredFiles.length} available)
                    </Button>
                  </div>

                  {/* Asset List */}
                  {section.assets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {section.assets.map((asset) => (
                        <Card
                          key={asset.id}
                          className={`p-4 hover:shadow-md transition-all duration-200 border-2 ${getAssetTypeColor(asset.type)}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="flex-shrink-0">
                                {getAssetIcon(asset.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate mb-1">
                                  {asset.name}
                                </p>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-medium text-gray-600 capitalize px-2 py-1 bg-white rounded-full">
                                    {asset.type}
                                  </span>
                                  {asset.size && (
                                    <span className="text-xs text-gray-500">
                                      {formatFileSize(asset.size)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-500 truncate flex-1 mr-2">
                              {(() => {
                                try {
                                  if (!asset.url) return ''
                                  const u = new URL(asset.url, typeof window !== 'undefined' ? window.location.origin : 'https://example.com')
                                  return u.hostname
                                } catch {
                                  return ''
                                }
                              })()}
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(asset.url, '_blank');
                                }}
                                className="h-8 w-8 p-0 hover:bg-white/80"
                                title="Open asset"
                              >
                                <ExternalLink className="h-4 w-4 text-gray-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('Delete asset clicked:', { sectionId: section.id, assetId: asset.id });
                                  removeAsset(section.id, asset.id);
                                }}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="Delete asset"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-2">No assets uploaded yet</p>
                      <p className="text-xs text-gray-400">Upload files or add media from your collection</p>
                    </div>
                  )}
                </div>

                {/* 4. Related Bookmarks */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                      <ExternalLink className="h-5 w-5 text-green-500" />
                      <span>Related Bookmarks</span>
                    </h4>
                    <div className="flex items-center space-x-2">
                      {section.relatedBookmarks.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {section.relatedBookmarks.length} connected
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingBookmark(!isAddingBookmark)}
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Bookmark
                      </Button>
                    </div>
                  </div>

                  {/* Add Bookmark Options */}
                  {isAddingBookmark && (
                    <Card className="p-3 mb-4 border-dashed">
                      {!addBookmarkMode ? (
                        // Choose mode
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600 mb-3">Choose an option:</p>
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAddBookmarkMode('existing')}
                              className="flex flex-col items-center p-4 h-auto"
                            >
                              <Plus className="h-4 w-4 mb-1" />
                              <span className="text-xs">Add Existing</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAddBookmarkMode('new')}
                              className="flex flex-col items-center p-4 h-auto"
                            >
                              <Plus className="h-4 w-4 mb-1" />
                              <span className="text-xs">Create New</span>
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelAddBookmark}
                            className="text-xs w-full"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : addBookmarkMode === 'existing' ? (
                        // Add existing bookmark
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Select existing bookmark:</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setAddBookmarkMode(null)}
                              className="text-xs"
                            >
                              Back
                            </Button>
                          </div>
                          <ScrollArea className="h-48 w-full rounded-lg border p-2">
                            <div className="space-y-2">
                              {availableBookmarks.filter(bookmark => !section.relatedBookmarks.includes(bookmark.id)).map((bookmark) => (
                                <div
                                  key={bookmark.id}
                                  className="flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 cursor-pointer border border-gray-200 hover:border-blue-300 transition-all duration-200"
                                  onClick={() => handleAddExistingBookmark(section.id, bookmark.id)}
                                >
                                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                                    <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center text-xs text-white">
                                      {bookmark.title?.[0]?.toUpperCase() || 'B'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{bookmark.title}</p>
                                      <p className="text-xs text-gray-500 truncate">{bookmark.url}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {availableBookmarks.filter(bookmark => !section.relatedBookmarks.includes(bookmark.id)).length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-4">No available bookmarks to add</p>
                              )}
                            </div>
                          </ScrollArea>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelAddBookmark}
                            className="text-xs w-full"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        // Create new bookmark
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Create new bookmark:</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setAddBookmarkMode(null)}
                              className="text-xs"
                            >
                              Back
                            </Button>
                          </div>
                          <div>
                            <Input
                              placeholder="Bookmark title..."
                              value={newBookmarkTitle}
                              onChange={(e) => setNewBookmarkTitle(e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Input
                              placeholder="https://example.com"
                              value={newBookmarkUrl}
                              onChange={(e) => setNewBookmarkUrl(e.target.value)}
                              className="text-sm"
                              type="url"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              onClick={handleAddNewBookmark}
                              disabled={!newBookmarkTitle.trim() || !newBookmarkUrl.trim()}
                              className="text-xs"
                            >
                              Create Bookmark
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelAddBookmark}
                              className="text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  )}

                  {/* Enhanced Add Bookmarks Button */}
                  <div className="mb-6">
                    <Button
                      variant="outline"
                      onClick={() => handleOpenAddBookmarksModal(section.id)}
                      className="w-full justify-center bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 text-blue-700 hover:text-indigo-800 font-medium transition-all duration-300 hover:shadow-md hover:shadow-blue-200/25 group"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="p-1 bg-blue-100 rounded-full group-hover:bg-indigo-100 transition-colors duration-200">
                          <Plus className="h-3 w-3" />
                        </div>
                        <span>Add Bookmarks</span>
                        <div className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold group-hover:bg-indigo-100 group-hover:text-indigo-800 transition-all duration-200">
                          {availableBookmarks.length} available
                        </div>
                      </div>
                    </Button>
                  </div>

                  {/* Selected Related Bookmarks */}
                  {section.relatedBookmarks.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-base font-bold text-gray-800 flex items-center space-x-2">
                            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
                            <span>Related Bookmarks</span>
                          </h4>
                          <div className="text-sm text-gray-500 font-medium">
                            ({section.relatedBookmarks.length})
                          </div>
                        </div>
                        <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-800 border-indigo-200/50 font-semibold">
                          {section.relatedBookmarks.length} connected
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {section.relatedBookmarks.map((bookmarkId) => {
                          const bookmark = availableBookmarks.find(b => b.id === bookmarkId)
                          if (!bookmark) return null

                          return (
                            <Card
                              key={bookmarkId}
                              className="group relative overflow-hidden border-0 bg-gradient-to-r from-white via-blue-50/20 to-indigo-50/30 hover:from-blue-50/40 hover:via-indigo-50/30 hover:to-purple-50/20 transition-all duration-300 hover:shadow-lg hover:shadow-blue-200/25 cursor-pointer"
                              onClick={() => {
                                // This will trigger the bookmark detail view
                                console.log('Opening bookmark detail for:', bookmark.id);
                                // The parent component should handle this
                              }}
                            >
                              {/* Subtle border gradient */}
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-200/50 via-indigo-200/30 to-purple-200/50 rounded-lg p-[1px]">
                                <div className="h-full w-full bg-white rounded-lg" />
                              </div>

                              <div className="relative p-5">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                                    {/* Enhanced avatar with better gradient */}
                                    <div className="relative">
                                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-200/50 group-hover:shadow-indigo-300/60 transition-all duration-300">
                                        {bookmark.title?.[0]?.toUpperCase() || 'B'}
                                      </div>
                                      {/* Subtle glow effect */}
                                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl blur-sm opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10" />
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-2">
                                      {/* Enhanced title with better typography */}
                                      <h4 className="text-base font-bold text-gray-900 truncate group-hover:text-indigo-900 transition-colors duration-200">
                                        {bookmark.title}
                                      </h4>

                                      {/* URL with better styling */}
                                      <div className="flex items-center space-x-2">
                                        <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full" />
                                        <p className="text-sm text-gray-600 truncate font-medium group-hover:text-indigo-700 transition-colors duration-200">
                                          {bookmark.url}
                                        </p>
                                      </div>

                                      {/* Description with enhanced styling */}
                                      {bookmark.description && (
                                        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed group-hover:text-gray-600 transition-colors duration-200">
                                          {bookmark.description}
                                        </p>
                                      )}

                                      {/* Category/Tags if available */}
                                      {bookmark.category && (
                                        <div className="flex items-center space-x-2 mt-2">
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-800 border border-indigo-200/50">
                                            {bookmark.category}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Enhanced action buttons */}
                                  <div className="flex items-center space-x-1 ml-3 opacity-70 group-hover:opacity-100 transition-opacity duration-200">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(bookmark.url, '_blank');
                                      }}
                                      className="h-9 w-9 p-0 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 hover:text-indigo-700 transition-all duration-200 rounded-lg"
                                      title="Open bookmark"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('Remove related bookmark clicked:', { sectionId: section.id, bookmarkId });
                                        toggleRelatedBookmark(section.id, bookmarkId);
                                      }}
                                      className="h-9 w-9 p-0 text-red-400 hover:text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-200 rounded-lg"
                                      title="Remove bookmark"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Enhanced Empty State for Related Bookmarks */}
                  {section.relatedBookmarks.length === 0 && !isAddingBookmark && (
                    <div className="relative text-center py-12 bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300/50 transition-all duration-300 mt-4 group">
                      {/* Background decoration */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="relative">
                        {/* Enhanced icon with gradient */}
                        <div className="relative mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-300">
                          <ExternalLink className="h-8 w-8 text-blue-500 group-hover:text-indigo-600 transition-colors duration-300" />
                          {/* Subtle glow effect */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full blur-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10" />
                        </div>

                        {/* Enhanced text */}
                        <h4 className="text-lg font-semibold text-gray-700 mb-2 group-hover:text-gray-800 transition-colors duration-200">
                          No related bookmarks yet
                        </h4>
                        <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto leading-relaxed group-hover:text-gray-600 transition-colors duration-200">
                          Connect relevant bookmarks to this section to build comprehensive research connections
                        </p>

                        {/* Call to action hint */}
                        <div className="inline-flex items-center space-x-2 text-xs text-blue-600 font-medium bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200/50 group-hover:bg-blue-100 group-hover:border-blue-300/50 transition-all duration-200">
                          <Plus className="h-3 w-3" />
                          <span>Click "Add Bookmarks" above to get started</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>



                {/* Section Separator */}
                {index < sections.length - 1 && (
                  <Separator className="mt-6" />
                )}
              </CardContent>
            </Card>
                  )
                } catch (sectionError) {
                  console.error(`🚨 ARPTab: Error rendering section ${index}:`, sectionError)
                  console.error(`🚨 ARPTab: Section ${index} error stack:`, sectionError.stack)
                  return (
                    <Card key={`error-${index}`} className="border-red-200 bg-red-50">
                      <CardContent className="p-4">
                        <div className="text-red-600">Error rendering section {index}</div>
                      </CardContent>
                    </Card>
                  )
                }
              })
            } catch (error) {
              console.error('🚨 ARPTab: Error in sections.map:', error)
              console.error('🚨 ARPTab: sections.map error stack:', error.stack)
              return <div className="text-red-600">Error rendering sections</div>
            }
          })()}

          {/* 5. Add New Section Button */}
          <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
            <CardContent className="p-8">
              <Button
                variant="ghost"
                onClick={addNewSection}
                className="w-full h-20 text-gray-500 hover:text-gray-700 flex items-center justify-center space-x-2"
              >
                <Plus className="h-8 w-8" />
                <span className="text-lg">Add New Section</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Add Bookmarks Modal */}
      {currentSectionId && (
        <AddBookmarksModal
          open={addBookmarksModalOpen}
          onOpenChange={setAddBookmarksModalOpen}
          availableBookmarks={availableBookmarks}
          selectedBookmarkIds={sections.find(s => s.id === currentSectionId)?.relatedBookmarks || []}
          onSelectionChange={(selectedIds) => {
            // Optional: Update selection in real-time if needed
          }}
          onSave={(selectedIds) => handleSaveBookmarkSelection(currentSectionId, selectedIds)}
        />
      )}

      {/* Add Assets Modal */}
      {currentSectionId && (
        <AddAssetsModal
          open={addAssetsModalOpen}
          onOpenChange={setAddAssetsModalOpen}
          availableAssets={(() => {
            try {
              console.log('🔍 ARPTab: Processing availableAssets, filteredFiles:', filteredFiles)
              console.log('🔍 ARPTab: filteredFiles is array:', Array.isArray(filteredFiles))
              console.log('🔍 ARPTab: filteredFiles type:', typeof filteredFiles)

              if (!Array.isArray(filteredFiles)) {
                console.error('🚨 ARPTab: filteredFiles is not an array, returning empty array')
                return []
              }

              return filteredFiles.map((file, index) => {
                try {
                  console.log(`🔍 ARPTab: Processing file ${index}:`, file)

                  // Safely handle date conversion
                  const dateValue = file.uploadedAt || file.created_at
                  console.log(`🔍 ARPTab: File ${index} dateValue:`, dateValue, typeof dateValue)

                  const uploadedAt = dateValue instanceof Date ? dateValue : (() => new Date(dateValue || Date.now()))()
                  console.log(`🔍 ARPTab: File ${index} uploadedAt after conversion:`, uploadedAt)

                  const result = {
                    id: file.id,
                    name: file.name,
                    type: getAssetType(file.type || file.mime_type),
                    url: file.url,
                    size: file.size,
                    uploadedAt: uploadedAt
                  }

                  console.log(`🔍 ARPTab: File ${index} processed result:`, result)
                  return result
                } catch (fileError) {
                  console.error(`🚨 ARPTab: Error processing file ${index}:`, fileError)
                  console.error(`🚨 ARPTab: File ${index} error stack:`, fileError.stack)
                  // Return a safe fallback
                  return {
                    id: file.id || `fallback-${index}`,
                    name: file.name || 'Unknown',
                    type: 'document',
                    url: file.url || '',
                    size: file.size || 0,
                    uploadedAt: (() => new Date())()
                  }
                }
              })
            } catch (error) {
              console.error('🚨 ARPTab: Error in availableAssets processing:', error)
              console.error('🚨 ARPTab: availableAssets error stack:', error.stack)
              return []
            }
          })()}
          selectedAssetIds={sections.find(s => s.id === currentSectionId)?.assets.map(a => a.id) || []}
          onSelectionChange={(selectedIds) => {
            // Optional: Update selection in real-time if needed
          }}
          onSave={(selectedAssets) => handleSaveAssetSelection(currentSectionId, selectedAssets)}
          onUpload={handleModalAssetUpload}
        />
      )}
    </div>
  )
}
