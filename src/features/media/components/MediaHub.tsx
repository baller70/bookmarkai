'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  FolderOpen, 
  Image, 
  Video, 
  Music,
  Upload,
  Search,
  Filter,
  Grid,
  List
} from 'lucide-react';
import { MediaLibrary } from './MediaLibrary';
import { DocumentEditor } from './DocumentEditor';
import { useMediaLibrary } from '../hooks/useMediaLibrary';
import { formatDate } from '../utils';

type ActiveView = 'library' | 'document';

export function MediaHub() {
  const [activeView, setActiveView] = useState<ActiveView>('library');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const { filteredFiles, filteredDocuments, filteredFolders, createDocument } = useMediaLibrary();

  const handleDocumentOpen = (documentId: string) => {
    console.log('Opening document:', documentId);
    console.log('Available documents:', filteredDocuments.map(d => ({ id: d.id, title: d.title })));
    setSelectedDocumentId(documentId);
    setActiveView('document');
    console.log('Active view set to document');
  };

  const handleCreateNewDocument = () => {
    const newDocument = createDocument('Untitled Document');
    handleDocumentOpen(newDocument.id);
  };

  const handleBackToLibrary = () => {
    setActiveView('library');
    setSelectedDocumentId(null);
  };

  const getMediaStats = () => {
    const imageCount = filteredFiles.filter(f => f.type === 'image').length;
    const videoCount = filteredFiles.filter(f => f.type === 'video').length;
    const audioCount = filteredFiles.filter(f => f.type === 'audio').length;
    const documentCount = filteredFiles.filter(f => f.type === 'document' || f.type === 'pdf').length;
    
    return { imageCount, videoCount, audioCount, documentCount };
  };

  const stats = getMediaStats();

  if (activeView === 'document' && selectedDocumentId) {
    return (
      <DocumentEditor
        documentId={selectedDocumentId}
        onBack={handleBackToLibrary}
        documents={filteredDocuments}
      />
    );
  }

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Media Hub</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Manage your files, documents, and rich content
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Image className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.imageCount}</p>
                <p className="text-sm text-gray-500">Images</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Video className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.videoCount}</p>
                <p className="text-sm text-gray-500">Videos</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Music className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.audioCount}</p>
                <p className="text-sm text-gray-500">Audio</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.documentCount}</p>
                <p className="text-sm text-gray-500">Documents</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <FolderOpen className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{filteredFolders.length}</p>
                <p className="text-sm text-gray-500">Folders</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="flex-1">
        <Tabs defaultValue="all" className="flex flex-col">
          <div className="border-b border-gray-200 px-4 flex-shrink-0">
            <TabsList className="grid w-full max-w-2xl grid-cols-5">
              <TabsTrigger value="all">All Media</TabsTrigger>
              <TabsTrigger value="images">Images ({stats.imageCount})</TabsTrigger>
              <TabsTrigger value="videos">Videos ({stats.videoCount})</TabsTrigger>
              <TabsTrigger value="audio">Audio ({stats.audioCount})</TabsTrigger>
              <TabsTrigger value="documents">Documents ({stats.documentCount})</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="flex-1 m-0">
            <MediaLibrary onDocumentOpen={handleDocumentOpen} initialFilterType={undefined} />
          </TabsContent>

          <TabsContent value="images" className="flex-1 m-0">
            <MediaLibrary onDocumentOpen={handleDocumentOpen} initialFilterType="image" />
          </TabsContent>

          <TabsContent value="videos" className="flex-1 m-0">
            <MediaLibrary onDocumentOpen={handleDocumentOpen} initialFilterType="video" />
          </TabsContent>

          <TabsContent value="audio" className="flex-1 m-0">
            <MediaLibrary onDocumentOpen={handleDocumentOpen} initialFilterType="audio" />
          </TabsContent>

          <TabsContent value="documents" className="flex-1 m-0">
            <MediaLibrary
              onDocumentOpen={handleDocumentOpen}
              initialFilterType="document"
              showCreateDocumentButton={true}
              onCreateDocument={handleCreateNewDocument}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 