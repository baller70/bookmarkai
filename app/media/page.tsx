
'use client';
export const dynamic = 'force-dynamic'

import { MediaHub } from '@/src/features/media';

export default function MediaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Media Hub</h1>
          <p className="text-gray-600">
            Manage your media files and create rich documents with the Novel editor
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-200px)]">
          <MediaHub />
        </div>
      </div>
    </div>
  );
}
