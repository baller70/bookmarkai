export interface MediaFile {
  id: string;
  name: string;
  originalName: string;
  type: MediaType;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
  uploadedBy: string;
  folderId?: string;
  tags: string[];
  description?: string;
  metadata?: MediaMetadata;
}

export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'pdf';

export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number; // for video/audio in seconds
  pageCount?: number; // for PDFs
  [key: string]: any;
}

export interface MediaFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: Date;
  createdBy: string;
  color?: string;
  type?: MediaType; // Optional: if set, folder only shows in specific media type tab
}

export interface RichDocument {
  id: string;
  title: string;
  content: DocumentContent[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastEditedBy: string;
  folderId?: string;
  tags: string[];
  isPublic: boolean;
  collaborators: DocumentCollaborator[];
  versions: DocumentVersion[];
}

export interface DocumentContent {
  id: string;
  type: ContentBlockType;
  data: any;
  order: number;
}

export type ContentBlockType = 
  | 'paragraph' 
  | 'heading' 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'file' 
  | 'code' 
  | 'quote' 
  | 'divider' 
  | 'list' 
  | 'table' 
  | 'embed';

export interface DocumentCollaborator {
  userId: string;
  userName: string;
  role: 'viewer' | 'editor' | 'owner';
  joinedAt: Date;
  isActive?: boolean;
}

export interface DocumentVersion {
  id: string;
  version: number;
  content: DocumentContent[];
  createdAt: Date;
  createdBy: string;
  comment?: string;
}

export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: string;
  action: () => void;
  keywords: string[];
}

export interface MediaLibraryState {
  files: MediaFile[];
  folders: MediaFolder[];
  documents: RichDocument[];
  selectedFiles: string[];
  selectedFolder?: string;
  viewMode: 'grid' | 'list';
  sortBy: 'name' | 'date' | 'size' | 'type';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
  filterType?: MediaType;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
} 