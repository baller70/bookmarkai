// @ts-nocheck
'use client';

import React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { 
  MediaFile, 
  MediaFolder, 
  RichDocument, 
  MediaLibraryState, 
  UploadProgress,
  MediaType 
} from '../types';
import { userDataService } from '@/lib/user-data-service';
import { UserMediaFile } from '@/types/database';

// Mock data for demonstration
const mockMediaFiles: MediaFile[] = [
  {
    id: '1',
    name: 'project-screenshot.png',
    originalName: 'Screenshot 2024-01-15 at 10.30.45.png',
    type: 'image',
    mimeType: 'image/png',
    size: 2048000,
    url: '/placeholder.svg?height=400&width=600',
    thumbnailUrl: '/placeholder.svg?height=150&width=150',
    uploadedAt: new Date('2024-01-15'),
    uploadedBy: 'user-1',
    tags: ['screenshot', 'project'],
    description: 'Main project dashboard screenshot'
  },
  {
    id: '2',
    name: 'demo-video.mp4',
    originalName: 'Product Demo Recording.mp4',
    type: 'video',
    mimeType: 'video/mp4',
    size: 15728640,
    url: '/placeholder-video.mp4',
    thumbnailUrl: '/placeholder.svg?height=150&width=150',
    uploadedAt: new Date('2024-01-14'),
    uploadedBy: 'user-1',
    tags: ['demo', 'video'],
    description: 'Product demonstration video',
    metadata: { duration: 120, width: 1920, height: 1080 }
  },
  {
    id: '3',
    name: 'requirements.pdf',
    originalName: 'Project Requirements Document.pdf',
    type: 'pdf',
    mimeType: 'application/pdf',
    size: 1024000,
    url: '/placeholder-document.pdf',
    uploadedAt: new Date('2024-01-13'),
    uploadedBy: 'user-1',
    tags: ['document', 'requirements'],
    description: 'Project requirements and specifications',
    metadata: { pageCount: 15 }
  }
];

const mockFolders: MediaFolder[] = [];

const mockDocuments: RichDocument[] = [];

export function useMediaLibrary() {
  const [state, setState] = useState<MediaLibraryState>({
    files: [],
    folders: [], // Start with empty folders
    documents: [], // Start with empty documents 
    selectedFiles: [],
    viewMode: 'grid',
    sortBy: 'date',
    sortOrder: 'desc',
    searchQuery: '',
  });

  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [realMediaFiles, setRealMediaFiles] = useState<UserMediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load real media files on component mount
  useEffect(() => {
    loadMediaFiles();
  }, []);

  const loadMediaFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load media files
      const response = await userDataService.getMediaFiles();
      console.log('🔍 Media files API response:', response);
      console.log('🔍 Media files API response.data length:', response.data?.length || 0);
      setRealMediaFiles(response.data);
      
      // Load documents
      const documentsResponse = await userDataService.getDocuments();
      console.log('🔍 Documents API response:', documentsResponse);
      
      // Convert UserDocument to RichDocument format for compatibility
      const convertedDocuments: RichDocument[] = documentsResponse.data.map(doc => {
        // Safely handle date conversions to prevent "y is not a function" errors
        let createdAt: Date;
        let updatedAt: Date;

        try {
          // Handle createdAt
          if (doc.created_at) {
            const createdValue = typeof doc.created_at === 'string' ? doc.created_at : String(doc.created_at);
            createdAt = (() => new Date(createdValue))();
            if (isNaN(createdAt.getTime())) {
              console.warn('🚨 useMediaLibrary: Invalid created_at for document', doc.id, 'created_at:', doc.created_at);
              createdAt = (() => new Date())();
            }
          } else {
            createdAt = (() => new Date())();
          }

          // Handle updatedAt
          if (doc.updated_at) {
            const updatedValue = typeof doc.updated_at === 'string' ? doc.updated_at : String(doc.updated_at);
            updatedAt = (() => new Date(updatedValue))();
            if (isNaN(updatedAt.getTime())) {
              console.warn('🚨 useMediaLibrary: Invalid updated_at for document', doc.id, 'updated_at:', doc.updated_at);
              updatedAt = (() => new Date())();
            }
          } else {
            updatedAt = (() => new Date())();
          }
        } catch (error) {
          console.error('🚨 useMediaLibrary: Error converting dates for document', doc.id, error);
          createdAt = new Date();
          updatedAt = new Date();
        }

        return {
          id: doc.id,
          title: doc.title,
          content: Array.isArray(doc.content) ? doc.content : [],
          tags: doc.tags || [],
          isPublic: doc.is_public || false,
          createdAt: createdAt,
          updatedAt: updatedAt,
          versions: []
        };
      });
      
      setState(prev => ({
        ...prev,
        documents: convertedDocuments
      }));
      
      // Convert UserMediaFile to MediaFile format for compatibility
      const convertedFiles: MediaFile[] = response.data.map(file => {
        // Safely handle date conversion to prevent "y is not a function" errors
        let uploadedAt: Date;
        try {
          if (file.created_at) {
            const dateValue = typeof file.created_at === 'string' ? file.created_at : String(file.created_at);
            uploadedAt = (() => new Date(dateValue))();
            // Validate the date
            if (isNaN(uploadedAt.getTime())) {
              console.warn('🚨 useMediaLibrary: Invalid date for file', file.id, 'created_at:', file.created_at);
              uploadedAt = (() => new Date())();
            }
          } else {
            uploadedAt = (() => new Date())();
          }
        } catch (error) {
          console.error('🚨 useMediaLibrary: Error converting date for file', file.id, error);
          uploadedAt = (() => new Date())();
        }

        return {
          id: file.id,
          name: file.name,
          originalName: file.metadata?.original_name || file.name,
          type: file.type as MediaType,
          size: file.size,
          mimeType: file.mime_type,
          url: file.url,
          uploadedAt: uploadedAt,
          uploadedBy: 'current-user',
          tags: file.tags || [],
          folderId: undefined,
          description: '',
          metadata: file.metadata
        };
      });
      
      setState(prev => ({
        ...prev,
        files: convertedFiles
      }));
    } catch (error) {
      console.error('Error loading media files:', error);
      // Keep using empty array on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // File operations
  const uploadFiles = useCallback(async (files: FileList) => {
    setIsUploading(true);
    const newUploads: UploadProgress[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `upload-${Date.now()}-${i}`;
      
      newUploads.push({
        fileId,
        fileName: file.name,
        progress: 0,
        status: 'uploading'
      });
    }

    setUploadProgress(newUploads);

    // Upload files using real API
    try {
      for (const upload of newUploads) {
        const file = Array.from(files).find(f => f.name === upload.fileName);
        if (!file) continue;

        try {
          // Determine file type for API
          const fileType = getFileType(file.type);
          const apiType = fileType === 'image' ? 'image' : 
                         fileType === 'video' ? 'video' : 
                         fileType === 'audio' ? 'audio' : 'document';
          
          // Upload file via API
          const uploadedFile = await userDataService.uploadFile(file, apiType as any);
          
          // Convert to MediaFile format
          const mediaFile: MediaFile = {
            id: uploadedFile.id,
            name: uploadedFile.name,
            originalName: uploadedFile.metadata?.original_name || uploadedFile.name,
            type: uploadedFile.type as MediaType,
            mimeType: uploadedFile.mime_type,
            size: uploadedFile.size,
            url: uploadedFile.url,
            thumbnailUrl: uploadedFile.type === 'image' ? uploadedFile.url : undefined,
            uploadedAt: uploadedFile.created_at ? new Date(uploadedFile.created_at) : new Date(),
            uploadedBy: 'current-user',
            folderId: state.selectedFolder,
            tags: uploadedFile.tags || [],
            description: '',
            metadata: uploadedFile.metadata
          };

          // Add to state
          setState(prev => ({
            ...prev,
            files: [mediaFile, ...prev.files]
          }));

          // Update progress to completed
          setUploadProgress(prev => 
            prev.map(u => u.fileId === upload.fileId ? { ...u, progress: 100, status: 'completed' } : u)
          );

        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          setUploadProgress(prev => 
            prev.map(u => u.fileId === upload.fileId ? { ...u, status: 'error' } : u)
          );
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
    }

    setIsUploading(false);
    setTimeout(() => setUploadProgress([]), 3000);
  }, [state.selectedFolder]);

  const deleteFiles = useCallback(async (fileIds: string[]) => {
    try {
      // Delete files from API
      for (const fileId of fileIds) {
        await userDataService.deleteMediaFile(fileId);
      }
      
      // Update local state
      setState(prev => ({
        ...prev,
        files: prev.files.filter(file => !fileIds.includes(file.id)),
        selectedFiles: prev.selectedFiles.filter(id => !fileIds.includes(id))
      }));
      
      // Reload media files to ensure sync
      await loadMediaFiles();
    } catch (error) {
      console.error('Error deleting files:', error);
      throw error;
    }
  }, [loadMediaFiles]);

  const updateFile = useCallback((fileId: string, updates: Partial<MediaFile>) => {
    setState(prev => ({
      ...prev,
      files: prev.files.map(file => 
        file.id === fileId ? { ...file, ...updates } : file
      )
    }));
  }, []);

  const moveFileToFolder = useCallback(async (fileId: string, folderId: string | undefined) => {
    try {
      // Update the file's folderId in the local state
      setState(prev => ({
        ...prev,
        files: prev.files.map(file =>
          file.id === fileId ? { ...file, folderId } : file
        )
      }));

      // TODO: In a real application, you would also update the database
      // For now, we'll just update the local state
      // await userDataService.updateMediaFile(fileId, { folderId });

      return true;
    } catch (error) {
      console.error('Error moving file to folder:', error);
      throw error;
    }
  }, []);

  // Folder operations
  const createFolder = useCallback((name: string, color?: string) => {
    const newFolder: MediaFolder = {
      id: `folder-${Date.now()}`,
      name,
      parentId: state.selectedFolder,
      createdAt: new Date(),
      createdBy: 'user-1',
      color: color || '#6B7280',
      type: state.filterType // Associate folder with current filter type
    };

    setState(prev => ({
      ...prev,
      folders: [...prev.folders, newFolder]
    }));

    return newFolder;
  }, [state.selectedFolder, state.filterType]);

  const deleteFolder = useCallback((folderId: string) => {
    setState(prev => ({
      ...prev,
      folders: prev.folders.filter(folder => folder.id !== folderId),
      files: prev.files.filter(file => file.folderId !== folderId)
    }));
  }, []);

  // Document operations
  const createDocument = useCallback((title: string) => {
    const newDocument: RichDocument = {
      id: `doc-${Date.now()}`,
      title,
      content: [
        {
          id: `block-${Date.now()}`,
          type: 'paragraph',
          data: { text: '' },
          order: 0
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user-1',
      lastEditedBy: 'user-1',
      folderId: state.selectedFolder,
      tags: [],
      isPublic: false,
      collaborators: [
        {
          userId: 'user-1',
          userName: 'Current User',
          role: 'owner',
          joinedAt: new Date()
        }
      ],
      versions: []
    };

    setState(prev => ({
      ...prev,
      documents: [...prev.documents, newDocument]
    }));

    return newDocument;
  }, [state.selectedFolder]);

  const updateDocument = useCallback(async (docId: string, updates: Partial<RichDocument>) => {
    try {
      // Update local state immediately for responsive UI
      setState(prev => ({
        ...prev,
        documents: prev.documents.map(doc => 
          doc.id === docId ? { ...doc, ...updates, updatedAt: new Date() } : doc
        )
      }));

      // Persist to API
      const apiData = {
        title: updates.title,
        content: updates.content,
        tags: updates.tags,
        isPublic: updates.isPublic
      };

      // Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(apiData).filter(([_, v]) => v !== undefined)
      );

      if (Object.keys(cleanData).length > 0) {
        await userDataService.updateDocument(docId, cleanData);
        console.log('✅ Document updated successfully:', docId);
      }
    } catch (error) {
      console.error('❌ Failed to update document:', error);
      
      // Revert local state on error
      setState(prev => ({
        ...prev,
        documents: prev.documents.map(doc => 
          doc.id === docId ? { ...doc } : doc // Reset without updates
        )
      }));
      
      throw error;
    }
  }, []);

  const deleteDocument = useCallback(async (docId: string) => {
    try {
      // Delete from API first
      await userDataService.deleteDocument(docId);
      
      // Update local state
      setState(prev => ({
        ...prev,
        documents: prev.documents.filter(doc => doc.id !== docId)
      }));
      
      console.log('✅ Document deleted successfully:', docId);
    } catch (error) {
      console.error('❌ Failed to delete document:', error);
      throw error;
    }
  }, []);

  // Selection and view operations
  const toggleFileSelection = useCallback((fileId: string) => {
    setState(prev => ({
      ...prev,
      selectedFiles: prev.selectedFiles.includes(fileId)
        ? prev.selectedFiles.filter(id => id !== fileId)
        : [...prev.selectedFiles, fileId]
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedFiles: [] }));
  }, []);

  const setViewMode = useCallback((mode: 'grid' | 'list') => {
    setState(prev => ({ ...prev, viewMode: mode }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const setFilterType = useCallback((type?: MediaType) => {
    setState(prev => ({ ...prev, filterType: type }));
  }, []);

  const setSortBy = useCallback((sortBy: 'name' | 'date' | 'size' | 'type') => {
    setState(prev => ({ ...prev, sortBy }));
  }, []);

  const setSelectedFolder = useCallback((folderId?: string) => {
    setState(prev => ({ ...prev, selectedFolder: folderId }));
  }, []);

  const getCurrentFolderPath = useCallback(() => {
    const path: { id: string; name: string }[] = [];
    let currentFolderId = state.selectedFolder;
    
    while (currentFolderId) {
      const folder = state.folders.find(f => f.id === currentFolderId);
      if (folder) {
        path.unshift({ id: folder.id, name: folder.name });
        currentFolderId = folder.parentId;
      } else {
        break;
      }
    }
    
    return path;
  }, [state.selectedFolder, state.folders]);

  // Filtered and sorted data
  const filteredFiles = state.files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                         file.tags.some(tag => tag.toLowerCase().includes(state.searchQuery.toLowerCase()));
    const matchesType = !state.filterType || file.type === state.filterType;
    const matchesFolder = !state.selectedFolder || file.folderId === state.selectedFolder;
    
    return matchesSearch && matchesType && matchesFolder;
  }).sort((a, b) => {
    let comparison = 0;
    
    switch (state.sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'date':
        const aDate = a.uploadedAt ? (typeof a.uploadedAt === 'string' ? new Date(a.uploadedAt) : a.uploadedAt) : null;
        const bDate = b.uploadedAt ? (typeof b.uploadedAt === 'string' ? new Date(b.uploadedAt) : b.uploadedAt) : null;
        const aTime = (aDate && aDate instanceof Date && !isNaN(aDate.getTime())) ? aDate.getTime() : 0;
        const bTime = (bDate && bDate instanceof Date && !isNaN(bDate.getTime())) ? bDate.getTime() : 0;
        comparison = aTime - bTime;
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
    }
    
    return state.sortOrder === 'asc' ? comparison : -comparison;
  });

  const filteredFolders = state.folders.filter(folder => {
    const matchesSearch = folder.name.toLowerCase().includes(state.searchQuery.toLowerCase());
    const matchesParent = !state.selectedFolder || folder.parentId === state.selectedFolder;
    const matchesType = !state.filterType || !folder.type || folder.type === state.filterType;
    
    return matchesSearch && matchesParent && matchesType;
  });

  const filteredDocuments = state.documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(state.searchQuery.toLowerCase()));
    const matchesFolder = !state.selectedFolder || doc.folderId === state.selectedFolder;
    
    return matchesSearch && matchesFolder;
  });

  return {
    // State
    ...state,
    uploadProgress,
    isUploading,
    
    // Computed data
    filteredFiles,
    filteredFolders,
    filteredDocuments,
    
    // File operations
    uploadFiles,
    deleteFiles,
    updateFile,
    moveFileToFolder,
    
    // Folder operations
    createFolder,
    deleteFolder,
    
    // Document operations
    createDocument,
    updateDocument,
    deleteDocument,
    
    // Selection and view
    toggleFileSelection,
    clearSelection,
    setViewMode,
    setSearchQuery,
    setFilterType,
    setSortBy,
    setSelectedFolder,
    getCurrentFolderPath,
  };
}

// Helper function to determine file type
function getFileType(mimeType: string): MediaType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'document';
} 