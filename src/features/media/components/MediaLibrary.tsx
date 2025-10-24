'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Search,
  Grid,
  List,
  Filter,
  FolderPlus,
  FileText,
  Image,
  Video,
  Music,
  FileIcon,
  Folder as FolderIcon,
  MoreVertical,
  Download,
  Trash2,
  Edit3,
  Eye,
  Share2,
  ArrowLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  X,
  Maximize2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMediaLibrary } from '../hooks/useMediaLibrary';
import { MediaFile, MediaType } from '../types';
import { formatFileSize, formatDate } from '../utils';
import { userDataService } from '@/lib/user-data-service';
// import { UserMediaFile } from '../../../types/supabase';
import { toast } from 'sonner';

interface MediaLibraryProps {
  onDocumentOpen?: (documentId: string) => void;
  initialFilterType?: 'image' | 'video' | 'audio' | 'document';
  showCreateDocumentButton?: boolean;
  onCreateDocument?: () => void;
}

export function MediaLibrary({
  onDocumentOpen,
  initialFilterType,
  showCreateDocumentButton = false,
  onCreateDocument
}: MediaLibraryProps = {}) {
  const {
    filteredFiles,
    filteredFolders,
    filteredDocuments,
    selectedFiles,
    viewMode,
    searchQuery,
    filterType,
    selectedFolder,
    uploadProgress,
    isUploading,
    uploadFiles,
    deleteFiles,
    createFolder,
    deleteFolder,
    moveFileToFolder,

    toggleFileSelection,
    setViewMode,
    setSearchQuery,
    setFilterType,
    setSelectedFolder,
    getCurrentFolderPath,
  } = useMediaLibrary();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadingRef = useRef(false);
  
  // Preview modal state
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewRotation, setPreviewRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Preview functions
  const openPreview = (file: MediaFile) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
    setPreviewZoom(1);
    setPreviewRotation(0);
    setIsFullscreen(false);
  };

  const closePreview = () => {
    setPreviewFile(null);
    setIsPreviewOpen(false);
    setPreviewZoom(1);
    setPreviewRotation(0);
    setIsFullscreen(false);
  };

  const navigatePreview = (direction: 'prev' | 'next') => {
    if (!previewFile) return;

    const currentIndex = filteredFiles.findIndex(f => f.id === previewFile.id);
    let newIndex;

    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : filteredFiles.length - 1;
    } else {
      newIndex = currentIndex < filteredFiles.length - 1 ? currentIndex + 1 : 0;
    }

    const newFile = filteredFiles[newIndex];
    if (newFile) {
      setPreviewFile(newFile);
      setPreviewZoom(1);
      setPreviewRotation(0);
    }
  };

  const handleZoom = (delta: number) => {
    setPreviewZoom(prev => Math.max(0.25, Math.min(4, prev + delta)));
  };

  const handleRotate = () => {
    setPreviewRotation(prev => (prev + 90) % 360);
  };

  // Drag and drop handlers for file organization
  const handleFileDragStart = (e: React.DragEvent, file: MediaFile) => {
    setDraggedFile(file);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', file.id);
  };

  const handleFileDragEnd = () => {
    setDraggedFile(null);
    setDragOverFolder(null);
    setIsDragging(false);
  };

  const handleFolderDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolder(folderId);
  };

  const handleFolderDragLeave = (e: React.DragEvent) => {
    // Only clear if we're actually leaving the folder (not entering a child element)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverFolder(null);
    }
  };

  const handleFolderDrop = async (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    setDragOverFolder(null);
    setIsDragging(false);

    if (!draggedFile) return;

    try {
      // Get the folder name for the success message
      const targetFolder = filteredFolders.find(f => f.id === folderId);
      const folderName = targetFolder?.name || 'folder';

      // Move the file to the folder
      await moveFileToFolder(draggedFile.id, folderId);

      toast.success(`Moved "${draggedFile.name}" to "${folderName}"`);

    } catch (error) {
      console.error('Error moving file:', error);
      toast.error('Failed to move file');
    } finally {
      setDraggedFile(null);
    }
  };
  
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [persistentFiles, setPersistentFiles] = useState<any[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isUploadingToPersistent, setIsUploadingToPersistent] = useState(false);

  // Drag and drop state
  const [draggedFile, setDraggedFile] = useState<MediaFile | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // Load persistent files on component mount
  useEffect(() => {
    loadPersistentFiles();
  }, []);

  // Apply filter when initialFilterType prop changes
  useEffect(() => {
    setFilterType(initialFilterType);
  }, [initialFilterType, setFilterType]);

  const loadPersistentFiles = async () => {
    // Prevent multiple simultaneous calls using ref (works better than state for race conditions)
    if (loadingRef.current) {
      return;
    }
    
    try {
      loadingRef.current = true;
      setIsLoadingFiles(true);
      const response = await userDataService.getMediaFiles();
      setPersistentFiles(response.data);
    } catch (error) {
      // Check if it's an authentication error (401)
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        // Silently handle auth errors when user is not logged in
        console.warn('User not authenticated - skipping persistent files load');
        setPersistentFiles([]);
        return;
      }
      
      console.error('Failed to load persistent files:', error);
      // Don't show toast error for initial load failures to avoid disrupting the user experience
      // toast.error('Failed to load saved files');
      setPersistentFiles([]); // Set empty array as fallback
    } finally {
      setIsLoadingFiles(false);
      loadingRef.current = false;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Upload to temporary storage first (existing functionality)
      uploadFiles(files);
      
      // Also upload to persistent storage
      await handlePersistentUpload(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePersistentUpload = async (files: FileList) => {
    setIsUploadingToPersistent(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Determine file type based on MIME type
        let fileType: 'image' | 'video' | 'document' | 'logo' = 'document';
        if (file.type.startsWith('image/')) {
          fileType = 'image';
        } else if (file.type.startsWith('video/')) {
          fileType = 'video';
        } else if (file.name.toLowerCase().includes('logo')) {
          fileType = 'logo';
        }

        const uploadedFile = await userDataService.uploadFile(file, fileType);
        
        // Add to persistent files list
        setPersistentFiles(prev => [uploadedFile, ...prev]);
        
        toast.success(`${file.name} saved successfully`);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        toast.error(`Failed to save ${file.name}`);
      }
    }
    
    setIsUploadingToPersistent(false);
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      // Upload to temporary storage first (existing functionality)
      uploadFiles(files);
      
      // Also upload to persistent storage
      await handlePersistentUpload(files);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };



  const getFileIcon = (type: MediaType) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      case 'pdf': return <FileText className="h-4 w-4" />;
      default: return <FileIcon className="h-4 w-4" />;
    }
  };

  const handleCreateFolder = () => {
    if (folderName.trim()) {
      createFolder(folderName.trim());
      setFolderName('');
      setShowCreateFolder(false);
    }
  };



  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search files, folders, and documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {filterType ? filterType.charAt(0).toUpperCase() + filterType.slice(1) : 'All'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterType(undefined)}>
                All Files
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('image')}>
                Images
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('video')}>
                Videos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('audio')}>
                Audio
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('pdf')}>
                PDFs
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('document')}>
                Documents
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
          <Button variant="outline" onClick={() => setShowCreateFolder(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          {showCreateDocumentButton && onCreateDocument && (
            <Button variant="outline" onClick={onCreateDocument}>
              <FileText className="h-4 w-4 mr-2" />
              Create Document
            </Button>
          )}

          {selectedFiles.length > 0 && (
            <Button variant="destructive" onClick={() => deleteFiles(selectedFiles)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedFiles.length})
            </Button>
          )}
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {selectedFolder && (
        <div className="border-b border-gray-200 px-4 py-2">
          <div className="flex items-center space-x-2 text-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFolder(undefined)}
              className="p-1 h-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to All Files
            </Button>
            <ChevronRight className="h-3 w-3 text-gray-400" />
            <div className="flex items-center space-x-2">
              {getCurrentFolderPath().map((folder, index) => (
                <React.Fragment key={folder.id}>
                  {index > 0 && <ChevronRight className="h-3 w-3 text-gray-400" />}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFolder(folder.id)}
                    className="p-1 h-auto text-blue-600 hover:text-blue-800"
                  >
                    {folder.name}
                  </Button>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Uploading Files</h3>
          <div className="space-y-2">
            {uploadProgress.map((upload) => (
              <div key={upload.fileId} className="flex items-center space-x-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{upload.fileName}</span>
                    <span className="text-gray-500">{upload.progress}%</span>
                  </div>
                  <Progress value={upload.progress} className="h-2 mt-1" />
                </div>
                <Badge variant={upload.status === 'completed' ? 'default' : 'secondary'}>
                  {upload.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="border-b border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
            <Button onClick={handleCreateFolder}>Create</Button>
            <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Upload Status */}
      {(isUploadingToPersistent || isLoadingFiles) && (
        <div className="border-b border-gray-200 p-4 bg-blue-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-sm text-blue-700">
              {isUploadingToPersistent ? 'Saving files to your account...' : 'Loading your saved files...'}
            </span>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div
        className={`flex-1 p-4 relative ${isDragging ? 'bg-blue-50/50' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-blue-100/20 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center z-10 pointer-events-none">
            <div className="text-center">
              <FolderIcon className="h-12 w-12 mx-auto text-blue-500 mb-2" />
              <p className="text-blue-700 font-medium">Drop file into a folder to organize</p>
            </div>
          </div>
        )}


        {filteredFolders.length === 0 && filteredFiles.length === 0 && filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No files yet</h3>
            <p className="text-gray-500 mb-6">
              Upload your first files or create a folder to get started
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4' : 'space-y-2'}>
            {/* Folders */}
            {filteredFolders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                viewMode={viewMode}
                onSelect={() => setSelectedFolder(folder.id)}
                onDelete={(folderId) => {
                  try {
                    deleteFolder(folderId);
                    toast.success('Folder deleted successfully');
                  } catch (error) {
                    console.error('Error deleting folder:', error);
                    toast.error('Failed to delete folder');
                  }
                }}
                onDragOver={handleFolderDragOver}
                onDragLeave={handleFolderDragLeave}
                onDrop={handleFolderDrop}
                isDragOver={dragOverFolder === folder.id}
              />
            ))}

            {/* Documents - Show rich documents only when filter allows documents */}
            {(!filterType || filterType === 'document') && filteredDocuments.map((document) => (
              <DocumentCard 
                key={document.id} 
                document={document} 
                viewMode={viewMode}
                onSelect={() => onDocumentOpen?.(document.id)}
              />
            ))}

            {/* Files */}
            {filteredFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                viewMode={viewMode}
                isSelected={selectedFiles.includes(file.id)}
                onSelect={() => toggleFileSelection(file.id)}
                getFileIcon={getFileIcon}
                onPreview={openPreview}
                onDelete={async (fileId) => {
                  try {
                    await deleteFiles([fileId]);
                    toast.success('File deleted successfully');
                  } catch (error) {
                    toast.error('Failed to delete file');
                  }
                }}
                onDragStart={handleFileDragStart}
                onDragEnd={handleFileDragEnd}
                isDragging={draggedFile?.id === file.id}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Enhanced Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className={`${isFullscreen ? 'max-w-full max-h-full w-screen h-screen' : 'max-w-6xl max-h-[95vh]'} overflow-hidden p-0`}>
          {previewFile && (
            <div className="flex flex-col h-full">
              {/* Header with controls */}
              <div className="flex items-center justify-between p-4 border-b bg-white">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-lg truncate max-w-md">{previewFile.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {previewFile.type.toUpperCase()}
                  </Badge>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Navigation buttons */}
                  {filteredFiles.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigatePreview('prev')}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-gray-500">
                        {filteredFiles.findIndex(f => f.id === previewFile.id) + 1} / {filteredFiles.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigatePreview('next')}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  {/* Image controls */}
                  {previewFile.type === 'image' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleZoom(-0.25)}
                        className="h-8 w-8 p-0"
                        disabled={previewZoom <= 0.25}
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-gray-500 min-w-[3rem] text-center">
                        {Math.round(previewZoom * 100)}%
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleZoom(0.25)}
                        className="h-8 w-8 p-0"
                        disabled={previewZoom >= 4}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRotate}
                        className="h-8 w-8 p-0"
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="h-8 w-8 p-0"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closePreview}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content area */}
              <div className="flex-1 flex items-center justify-center p-4 bg-gray-50 overflow-hidden">
                {previewFile.type === 'image' ? (
                  <div className="relative overflow-auto max-w-full max-h-full">
                    <img
                      src={previewFile.url}
                      alt={previewFile.name}
                      className="max-w-none transition-transform duration-200"
                      style={{
                        transform: `scale(${previewZoom}) rotate(${previewRotation}deg)`,
                        maxHeight: isFullscreen ? '90vh' : '60vh',
                        maxWidth: isFullscreen ? '90vw' : '100%',
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                ) : previewFile.type === 'video' ? (
                  <video
                    src={previewFile.url}
                    controls
                    className="max-w-full max-h-full rounded-lg"
                    style={{
                      maxHeight: isFullscreen ? '90vh' : '60vh',
                      maxWidth: isFullscreen ? '90vw' : '100%'
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : previewFile.type === 'audio' ? (
                  <div className="w-full max-w-md bg-white rounded-lg p-6">
                    <div className="text-center mb-4">
                      <Music className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">{previewFile.name}</p>
                    </div>
                    <audio
                      src={previewFile.url}
                      controls
                      className="w-full"
                    >
                      Your browser does not support the audio tag.
                    </audio>
                  </div>
                ) : (
                  <div className="text-center bg-white rounded-lg p-8">
                    <FileIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600 mb-4">
                      Preview not available for this file type
                    </p>
                    <Button onClick={() => window.open(previewFile.url, '_blank')}>
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                )}
              </div>

              {/* File Details Footer */}
              <div className="border-t bg-white p-4">
                <div className="flex flex-wrap items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <span>Size: {formatFileSize(previewFile.size)}</span>
                    <span>Type: {previewFile.mimeType}</span>
                    <span>Uploaded: {formatDate(previewFile.uploadedAt)}</span>
                  </div>
                  {previewFile.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {previewFile.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Folder Card Component
interface FolderCardProps {
  folder: any;
  viewMode: 'grid' | 'list';
  onSelect: () => void;
  onDelete: (folderId: string) => void;
  onDragOver?: (e: React.DragEvent, folderId: string) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, folderId: string) => void;
  isDragOver?: boolean;
}

function FolderCard({
  folder,
  viewMode,
  onSelect,
  onDelete,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOver = false
}: FolderCardProps) {
  if (viewMode === 'list') {
    return (
      <Card
        className={`p-3 hover:shadow-md transition-all duration-200 cursor-pointer ${
          isDragOver ? 'ring-2 ring-blue-500 bg-blue-50 shadow-lg scale-105' : ''
        }`}
        onDragOver={(e) => onDragOver?.(e, folder.id)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop?.(e, folder.id)}
      >
        <div className="flex items-center space-x-3">
          <div 
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: folder.color + '20' }}
          >
            <FolderIcon className="h-4 w-4" style={{ color: folder.color }} />
          </div>
          <div className="flex-1 min-w-0" onClick={onSelect}>
            <h3 className="font-medium text-sm truncate">{folder.name}</h3>
            <p className="text-xs text-gray-500">{formatDate(folder.createdAt)}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onSelect}>
                <Eye className="h-4 w-4 mr-2" />
                Open
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => onDelete(folder.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`p-4 hover:shadow-md transition-all duration-200 cursor-pointer group relative ${
        isDragOver ? 'ring-2 ring-blue-500 bg-blue-50 shadow-lg scale-105' : ''
      }`}
      onDragOver={(e) => onDragOver?.(e, folder.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop?.(e, folder.id)}
    >
      <div className="text-center" onClick={onSelect}>
        <div 
          className="h-12 w-12 mx-auto rounded-lg flex items-center justify-center mb-2"
          style={{ backgroundColor: folder.color + '20' }}
        >
          <FolderIcon className="h-6 w-6" style={{ color: folder.color }} />
        </div>
        <h3 className="font-medium text-sm truncate">{folder.name}</h3>
        <p className="text-xs text-gray-500">{formatDate(folder.createdAt)}</p>
      </div>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={onSelect}>
              <Eye className="h-4 w-4 mr-2" />
              Open
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={() => onDelete(folder.id)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}

// Document Card Component
interface DocumentCardProps {
  document: any;
  viewMode: 'grid' | 'list';
  onSelect?: () => void;
}

function DocumentCard({ document, viewMode, onSelect }: DocumentCardProps) {
  if (viewMode === 'list') {
    return (
      <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{document.title}</h3>
            <p className="text-xs text-gray-500">
              Updated {formatDate(document.updatedAt)}
            </p>
          </div>
          <div className="flex items-center space-x-1">
            {document.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <div className="text-center">
        <div className="h-12 w-12 mx-auto bg-blue-100 rounded-lg flex items-center justify-center mb-2">
          <FileText className="h-6 w-6 text-blue-600" />
        </div>
        <h3 className="font-medium text-sm truncate">{document.title}</h3>
        <p className="text-xs text-gray-500">Updated {formatDate(document.updatedAt)}</p>
        {document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 justify-center">
            {document.tags.slice(0, 2).map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// File Card Component
interface FileCardProps {
  file: MediaFile;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: () => void;
  getFileIcon: (type: MediaType) => React.ReactNode;
  onPreview: (file: MediaFile) => void;
  onDelete: (fileId: string) => void;
  onDragStart?: (e: React.DragEvent, file: MediaFile) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

function FileCard({
  file,
  viewMode,
  isSelected,
  onSelect,
  getFileIcon,
  onPreview,
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging = false
}: FileCardProps) {
  if (viewMode === 'list') {
    return (
      <Card
        className={`p-3 hover:shadow-md transition-shadow cursor-pointer ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        } ${isDragging ? 'opacity-50' : ''}`}
        onClick={onSelect}
        draggable
        onDragStart={(e) => onDragStart?.(e, file)}
        onDragEnd={onDragEnd}
      >
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
            {file.type === 'image' && file.thumbnailUrl ? (
              <img 
                src={file.thumbnailUrl} 
                alt={file.name}
                className="h-8 w-8 object-cover rounded-lg"
              />
            ) : (
              getFileIcon(file.type)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{file.name}</h3>
            <p className="text-xs text-gray-500">
              {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
            </p>
          </div>
          <div className="flex items-center space-x-1">
            {file.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onPreview(file)}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit3 className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => onDelete(file.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${isDragging ? 'opacity-50' : ''}`}
      onClick={onSelect}
      onDoubleClick={() => onPreview(file)}
      draggable
      onDragStart={(e) => onDragStart?.(e, file)}
      onDragEnd={onDragEnd}
    >
      <div className="text-center">
        <div className="h-16 w-16 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
          {file.type === 'image' && file.thumbnailUrl ? (
            <img 
              src={file.thumbnailUrl} 
              alt={file.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-gray-600">
              {getFileIcon(file.type)}
            </div>
          )}
        </div>
        <h3 className="font-medium text-sm truncate">{file.name}</h3>
        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
        {file.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 justify-center">
            {file.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// Persistent File Card Component
interface PersistentFileCardProps {
  file: any;
  viewMode: 'grid' | 'list';
  onDelete: (id: string) => void;
  onPreview: (file: any) => void;
  getFileIcon: (type: string) => React.ReactNode;
}

function PersistentFileCard({ file, viewMode, onDelete, onPreview, getFileIcon }: PersistentFileCardProps) {
  const handleDownload = () => {
    window.open(file.url, '_blank');
  };

  if (viewMode === 'list') {
    return (
      <Card className="p-3 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
            {file.type === 'image' ? (
              <img 
                src={file.url} 
                alt={file.name}
                className="h-8 w-8 object-cover rounded-lg"
              />
            ) : (
              getFileIcon(file.type)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{file.name}</h3>
            <p className="text-xs text-gray-500">
              {formatFileSize(file.size)} • {formatDate(new Date(file.created_at))}
            </p>
          </div>
          <div className="flex items-center space-x-1">
            {file.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            <Badge variant="outline" className="text-xs">
              {file.type}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onPreview(file)}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(file.url)}>
                <Share2 className="h-4 w-4 mr-2" />
                Copy URL
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => onDelete(file.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onDoubleClick={() => onPreview(file)}>
      <div className="text-center">
        <div className="h-16 w-16 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
          {file.type === 'image' ? (
            <img 
              src={file.url} 
              alt={file.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-gray-600">
              {getFileIcon(file.type)}
            </div>
          )}
        </div>
        <h3 className="font-medium text-sm truncate">{file.name}</h3>
        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
        <div className="flex flex-wrap gap-1 mt-2 justify-center">
          <Badge variant="outline" className="text-xs">
            {file.type}
          </Badge>
          {file.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex justify-center space-x-1 mt-2">
          <Button variant="ghost" size="sm" onClick={handleDownload}>
            <Download className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(file.url)}>
            <Share2 className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(file.id)} className="text-red-600">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}           