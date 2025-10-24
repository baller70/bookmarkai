'use client'

import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { toast } from 'sonner'
import {
  BookmarkIcon,
  CloudIcon,
  DownloadIcon,
  UploadIcon,
  SearchIcon,
  PlusIcon,
  TrashIcon,
  EditIcon,
  Image,
  Camera,
  Palette,
  BarChart3Icon
} from 'lucide-react'
import { useBookmarkStorage, type Bookmark } from '../../lib/bookmark-storage'
import { CustomUploadControl } from './CustomUploadControl'

interface BookmarkManagerProps {
  userId: string
  initialCloudSync?: boolean
}

export function BookmarkManager({ userId, initialCloudSync = false }: BookmarkManagerProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(initialCloudSync)
  const [storageStats, setStorageStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)

  const storage = useBookmarkStorage(userId, cloudSyncEnabled)

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [bookmarksData, categoriesData, stats] = await Promise.all([
        storage.getBookmarks(),
        storage.getCategories(),
        storage.getStorageStats()
      ])
      
      setBookmarks(bookmarksData)
      const sortedCats = [...categoriesData].sort((a,b)=>String(a||'').localeCompare(String(b||''), undefined, { sensitivity: 'base' }))
      setCategories(['all', ...sortedCats])
      setStorageStats(stats)
    } catch (error) {
      console.error('Error loading bookmark data:', error)
      toast.error('Failed to load bookmarks')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [userId, cloudSyncEnabled])

  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesSearch = searchQuery === '' || 
      bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || bookmark.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const handleSaveBookmark = async (bookmarkData: Partial<Bookmark>) => {
    try {
      await storage.saveBookmark(bookmarkData)
      await loadData()
      setEditingBookmark(null)
      toast.success(bookmarkData.id ? 'Bookmark updated' : 'Bookmark created')
    } catch (error) {
      toast.error('Failed to save bookmark')
    }
  }

  const handleDeleteBookmark = async (bookmarkId: number) => {
    try {
      await storage.deleteBookmark(bookmarkId)
      await loadData()
      toast.success('Bookmark deleted')
    } catch (error) {
      toast.error('Failed to delete bookmark')
    }
  }

  const handleExportBookmarks = async () => {
    try {
      const exportData = await storage.exportBookmarks()
      const blob = new Blob([exportData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bookmarks-${userId}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Bookmarks exported')
    } catch (error) {
      toast.error('Failed to export bookmarks')
    }
  }

  const handleImportBookmarks = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      await storage.importBookmarks(text, 'merge')
      await loadData()
    } catch (error) {
      toast.error('Failed to import bookmarks')
    }
  }

  const handleCloudSyncToggle = (enabled: boolean) => {
    setCloudSyncEnabled(enabled)
    storage.setCloudSync(enabled)
  }

  const handleManualSync = async () => {
    try {
      await storage.syncAllToCloud()
      await loadData()
    } catch (error) {
      toast.error('Sync failed')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <BookmarkIcon className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Loading bookmarks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with stats and controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Bookmarks</h2>
          <p className="text-muted-foreground">
            {storageStats?.totalBookmarks || 0} bookmarks • {storageStats?.storageSize || '0 KB'} used
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Cloud Sync Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="cloud-sync"
              checked={cloudSyncEnabled}
              onCheckedChange={handleCloudSyncToggle}
            />
            <Label htmlFor="cloud-sync" className="flex items-center gap-1">
              <CloudIcon className="h-4 w-4" />
              Cloud Sync
            </Label>
          </div>

          {/* Manual Sync Button */}
          {cloudSyncEnabled && (
            <Button variant="outline" size="sm" onClick={handleManualSync}>
              <CloudIcon className="h-4 w-4 mr-1" />
              Sync Now
            </Button>
          )}

          {/* Export/Import */}
          <Button variant="outline" size="sm" onClick={handleExportBookmarks}>
            <DownloadIcon className="h-4 w-4 mr-1" />
            Export
          </Button>
          
          <div>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBookmarks}
              className="hidden"
              id="import-bookmarks"
            />
            <Button variant="outline" size="sm" asChild>
              <label htmlFor="import-bookmarks" className="cursor-pointer flex items-center">
                <UploadIcon className="h-4 w-4 mr-1" />
                Import
              </label>
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category}
            </option>
          ))}
        </select>

        <Button onClick={() => setEditingBookmark({} as Bookmark)}>
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Bookmark
        </Button>
      </div>

      {/* Bookmarks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBookmarks.map(bookmark => (
          <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm font-medium line-clamp-2">
                  {bookmark.title}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingBookmark(bookmark)}
                  >
                    <EditIcon className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteBookmark(bookmark.id)}
                  >
                    <TrashIcon className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {bookmark.description}
              </p>
              
              <div className="flex flex-wrap gap-1 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {bookmark.category}
                </Badge>
                {bookmark.tags?.slice(0, 2).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{bookmark.visits || 0} visits</span>
                <span>{new Date(bookmark.created_at).toLocaleDateString()}</span>
              </div>
              
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline mt-1 block truncate"
              >
                {bookmark.url}
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBookmarks.length === 0 && (
        <div className="text-center py-8">
          <BookmarkIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No bookmarks found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first bookmark to get started'
            }
          </p>
          <Button onClick={() => setEditingBookmark({} as Bookmark)}>
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Bookmark
          </Button>
        </div>
      )}

      {/* Storage Stats */}
      {storageStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3Icon className="h-5 w-5" />
              Storage Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium">Total Bookmarks</p>
                <p className="text-muted-foreground">{storageStats.totalBookmarks}</p>
              </div>
              <div>
                <p className="font-medium">Storage Used</p>
                <p className="text-muted-foreground">{storageStats.storageSize}</p>
              </div>
              <div>
                <p className="font-medium">Cloud Sync</p>
                <p className="text-muted-foreground">
                  {storageStats.cloudSyncEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <div>
                <p className="font-medium">Last Sync</p>
                <p className="text-muted-foreground">
                  {storageStats.lastSync 
                    ? new Date(storageStats.lastSync).toLocaleDateString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Bookmark Modal would go here */}
      {editingBookmark && (
        <BookmarkEditModal
          bookmark={editingBookmark}
          onSave={handleSaveBookmark}
          onCancel={() => setEditingBookmark(null)}
        />
      )}
    </div>
  )
}

function BookmarkEditModal({ 
  bookmark, 
  onSave, 
  onCancel 
}: {
  bookmark: Partial<Bookmark>
  onSave: (bookmark: Partial<Bookmark>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    title: bookmark.title || '',
    url: bookmark.url || '',
    description: bookmark.description || '',
    category: bookmark.category || 'General',
    tags: bookmark.tags?.join(', ') || '',
    notes: bookmark.notes || '',
    custom_favicon: bookmark.custom_favicon || '',
    custom_logo: bookmark.custom_logo || '',
    custom_background: bookmark.custom_background || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...bookmark,
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{bookmark.id ? 'Edit Bookmark' : 'Add Bookmark'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="customization">Customization</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit}>
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="web, development, tools"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="customization" className="space-y-4 mt-4">
                {bookmark.id ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Customize the visual appearance of this bookmark with your own images.
                    </p>

                    <CustomUploadControl
                      bookmarkId={String(bookmark.id)}
                      uploadType="favicon"
                      currentValue={formData.custom_favicon}
                      onUploadComplete={(url) => setFormData(prev => ({ ...prev, custom_favicon: url }))}
                      onRemove={() => setFormData(prev => ({ ...prev, custom_favicon: '' }))}
                      label="Custom Favicon"
                      description="Upload a custom favicon that will override the automatically grabbed website favicon"
                      icon={<Image className="h-4 w-4" />}
                    />

                    <CustomUploadControl
                      bookmarkId={String(bookmark.id)}
                      uploadType="logo"
                      currentValue={formData.custom_logo}
                      onUploadComplete={(url) => setFormData(prev => ({ ...prev, custom_logo: url }))}
                      onRemove={() => setFormData(prev => ({ ...prev, custom_logo: '' }))}
                      label="Custom Logo"
                      description="Upload a custom logo that replaces the default fallback logo for this bookmark"
                      icon={<Camera className="h-4 w-4" />}
                    />

                    <CustomUploadControl
                      bookmarkId={String(bookmark.id)}
                      uploadType="background"
                      currentValue={formData.custom_background}
                      onUploadComplete={(url) => setFormData(prev => ({ ...prev, custom_background: url }))}
                      onRemove={() => setFormData(prev => ({ ...prev, custom_background: '' }))}
                      label="Custom Background"
                      description="Upload a custom background image for this bookmark's display card"
                      icon={<Palette className="h-4 w-4" />}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Save the bookmark first to enable customization options.</p>
                  </div>
                )}
              </TabsContent>

              <div className="flex gap-2 mt-6">
                <Button type="submit" className="flex-1">
                  {bookmark.id ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
