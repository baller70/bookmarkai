// Components
export { MediaHub } from './components/MediaHub';
export { MediaLibrary } from './components/MediaLibrary';
export { RichTextEditor } from './components/RichTextEditor';
export { SimpleDocumentEditor } from './components/SimpleDocumentEditor';
// export { NovelEditor } from './components/NovelEditor'; // Deprecated: replaced by TipTapEditor
export { DocumentEditor } from './components/DocumentEditor';

// Hooks
export { useMediaLibrary } from './hooks/useMediaLibrary';

// Types
export type {
  MediaFile,
  MediaFolder,
  RichDocument,
  DocumentContent,
  DocumentCollaborator,
  MediaType,
  ContentBlockType,
  MediaLibraryState,
  UploadProgress,
  SlashCommand
} from './types';

// Utils
export {
  formatFileSize,
  formatDate,
  getFileExtension,
  isImageFile,
  isVideoFile,
  isAudioFile,
  isPdfFile,
  truncateText
} from './utils'; 