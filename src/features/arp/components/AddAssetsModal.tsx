'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search,
  Upload,
  Image,
  Video,
  Music,
  FileText,
  Check,
  X,
  Plus,
  File
} from 'lucide-react'

interface MediaFile {
  id: string
  name: string
  type: 'image' | 'video' | 'audio' | 'document'
  url: string
  size?: number
  uploadedAt: Date
}

interface AddAssetsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableAssets: MediaFile[]
  selectedAssetIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
  onSave: (selectedAssets: MediaFile[]) => void
  onUpload: (files: FileList) => Promise<MediaFile[]>
}

export const AddAssetsModal: React.FC<AddAssetsModalProps> = ({
  open,
  onOpenChange,
  availableAssets,
  selectedAssetIds,
  onSelectionChange,
  onSave,
  onUpload
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedAssetIds)
  const [activeTab, setActiveTab] = useState('library')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Reset local selection when modal opens
  React.useEffect(() => {
    if (open) {
      setLocalSelectedIds(selectedAssetIds)
      setSearchQuery('')
      setActiveTab('library')
    }
  }, [open, selectedAssetIds])

  // Filter assets based on search query
  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableAssets
    }

    const query = searchQuery.toLowerCase()
    return availableAssets.filter(asset => 
      asset.name.toLowerCase().includes(query) ||
      asset.type.toLowerCase().includes(query)
    )
  }, [availableAssets, searchQuery])

  const handleToggleAsset = (assetId: string) => {
    setLocalSelectedIds(prev => {
      if (prev.includes(assetId)) {
        return prev.filter(id => id !== assetId)
      } else {
        return [...prev, assetId]
      }
    })
  }

  const handleSelectAll = () => {
    const allFilteredIds = filteredAssets.map(a => a.id)
    const allSelected = allFilteredIds.every(id => localSelectedIds.includes(id))
    
    if (allSelected) {
      // Deselect all filtered assets
      setLocalSelectedIds(prev => prev.filter(id => !allFilteredIds.includes(id)))
    } else {
      // Select all filtered assets
      const newSelected = [...new Set([...localSelectedIds, ...allFilteredIds])]
      setLocalSelectedIds(newSelected)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const uploadedAssets = await onUpload(files)
      
      clearInterval(progressInterval)
      setUploadProgress(100)

      // Add uploaded assets to selection
      const newAssetIds = uploadedAssets.map(asset => asset.id)
      setLocalSelectedIds(prev => [...new Set([...prev, ...newAssetIds])])

      // Switch to library tab to show uploaded files
      setActiveTab('library')
      
      setTimeout(() => {
        setUploadProgress(0)
        setIsUploading(false)
      }, 1000)

    } catch (error) {
      console.error('Upload failed:', error)
      setIsUploading(false)
      setUploadProgress(0)
    }

    // Reset file input
    event.target.value = ''
  }

  const handleSave = () => {
    const selectedAssets = availableAssets.filter(asset => localSelectedIds.includes(asset.id))
    onSave(selectedAssets)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setLocalSelectedIds(selectedAssetIds) // Reset to original selection
    onOpenChange(false)
  }

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-5 w-5 text-blue-500" />
      case 'video': return <Video className="h-5 w-5 text-purple-500" />
      case 'audio': return <Music className="h-5 w-5 text-green-500" />
      case 'document': return <FileText className="h-5 w-5 text-orange-500" />
      default: return <File className="h-5 w-5 text-gray-500" />
    }
  }

  const getAssetTypeColor = (type: string) => {
    switch (type) {
      case 'image': return 'bg-blue-50 border-blue-200'
      case 'video': return 'bg-purple-50 border-purple-200'
      case 'audio': return 'bg-green-50 border-green-200'
      case 'document': return 'bg-orange-50 border-orange-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const selectedCount = localSelectedIds.length
  const filteredSelectedCount = filteredAssets.filter(a => localSelectedIds.includes(a.id)).length
  const allFilteredSelected = filteredAssets.length > 0 && filteredAssets.every(a => localSelectedIds.includes(a.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-500" />
            Add Assets
          </DialogTitle>
          <DialogDescription>
            Select assets from your media library or upload new files to add to this section.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">Media Library</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="flex-1 flex flex-col space-y-4">
            {/* Search and Stats */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search assets by name or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''}
                  </Badge>
                  {selectedCount > 0 && (
                    <Badge variant="default">
                      {selectedCount} selected
                    </Badge>
                  )}
                </div>
                
                {filteredAssets.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="text-xs"
                  >
                    {allFilteredSelected ? 'Deselect All' : 'Select All'}
                  </Button>
                )}
              </div>
            </div>

            {/* Assets Grid */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pr-4">
                {filteredAssets.length > 0 ? (
                  filteredAssets.map((asset) => {
                    const isSelected = localSelectedIds.includes(asset.id)
                    
                    return (
                      <div
                        key={asset.id}
                        className={`
                          relative p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer
                          ${isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : `border-gray-200 hover:border-gray-300 ${getAssetTypeColor(asset.type)}`
                          }
                        `}
                        onClick={() => handleToggleAsset(asset.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleToggleAsset(asset.id)}
                            className="flex-shrink-0"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {getAssetIcon(asset.type)}
                              <p className={`text-sm font-medium truncate ${
                                isSelected ? 'text-blue-900' : 'text-gray-900'
                              }`}>
                                {asset.name}
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {asset.type.toUpperCase()}
                              </Badge>
                              {asset.size && (
                                <span className="text-xs text-gray-500">
                                  {formatFileSize(asset.size)}
                                </span>
                              )}
                            </div>
                          </div>

                          {isSelected && (
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="col-span-full text-center py-8">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-1">
                      {searchQuery ? 'No assets match your search' : 'No assets available'}
                    </p>
                    {searchQuery && (
                      <p className="text-xs text-gray-400">
                        Try adjusting your search terms
                      </p>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="upload" className="flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4 max-w-md">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="h-8 w-8 text-blue-500" />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Upload New Assets</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Select files from your computer to upload to your media library
                  </p>
                </div>

                <div className="space-y-3">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={isUploading}
                  />
                  <label htmlFor="file-upload">
                    <Button
                      variant="default"
                      size="lg"
                      disabled={isUploading}
                      className="cursor-pointer"
                      asChild
                    >
                      <span>
                        <Plus className="h-4 w-4 mr-2" />
                        {isUploading ? 'Uploading...' : 'Choose Files'}
                      </span>
                    </Button>
                  </label>

                  {isUploading && (
                    <div className="w-full space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Uploading... {uploadProgress}%
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-400">
                  Supported formats: Images, Videos, Audio, Documents (PDF, DOC, TXT)
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isUploading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={localSelectedIds.length === 0 || isUploading}
          >
            <Check className="h-4 w-4 mr-2" />
            Add {selectedCount} Asset{selectedCount !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
