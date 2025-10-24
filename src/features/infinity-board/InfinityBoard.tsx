// @ts-nocheck
"use client"

import React, { useState, useCallback, useRef } from 'react'
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { FolderHierarchyAssignment } from '../../components/hierarchy/Hierarchy'
import { FolderOrgChartView } from '../../components/ui/folder-org-chart-view'

export const InfinityBoardBackground = ({ isActive }: { isActive: boolean }) => {
  const [nodes] = useNodesState([])
  const [edges] = useEdgesState([])

  return isActive ? (
    <ReactFlowProvider>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        attributionPosition="bottom-left"
        className="bg-gray-50"
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick
      >
        <Background gap={12} color="#e5e7eb" />
        <MiniMap position="bottom-left" />
        <Controls position="bottom-right" />
      </ReactFlow>
    </ReactFlowProvider>
  ) : null
}

export const KHV1InfinityBoard = ({
  folders,
  bookmarks,
  onCreateFolder,
  onAddBookmark,
  onOpenDetail,
  isActive,
  folderAssignments,
  onHierarchyAssignmentsChange,
}: {
  folders: any[]
  bookmarks: any[]
  onCreateFolder: () => void
  onAddBookmark: () => void
  onOpenDetail: (bookmark: any) => void
  isActive: boolean
  folderAssignments: FolderHierarchyAssignment[]
  onHierarchyAssignmentsChange: (assignments: FolderHierarchyAssignment[]) => void
}) => {
  const [transform, setTransform] = useState({ x: 0, y: 0, zoom: 1 })
  const transformRef = useRef({ x: 0, y: 0, zoom: 1 })

  // Use useCallback to prevent infinite re-renders
  const handleMove = useCallback((_, viewport) => {
    // Update ref immediately for transform calculations
    transformRef.current = { x: viewport.x, y: viewport.y, zoom: viewport.zoom }

    // Debounce state updates to prevent infinite loops
    const timeoutId = setTimeout(() => {
      setTransform(prev => {
        // Only update if values actually changed to prevent unnecessary re-renders
        if (prev.x !== viewport.x || prev.y !== viewport.y || prev.zoom !== viewport.zoom) {
          return { x: viewport.x, y: viewport.y, zoom: viewport.zoom }
        }
        return prev
      })
    }, 16) // ~60fps

    return () => clearTimeout(timeoutId)
  }, [])

  // Handler functions for folder operations
  const handleEditFolder = (folder: any) => {
    console.log('Edit folder:', folder)
    // TODO: Implement folder editing modal
    alert(`Edit folder: ${folder.name}`)
  }

  const handleDeleteFolder = (folderId: string) => {
    console.log('Delete folder:', folderId)
    // TODO: Implement folder deletion with confirmation
    if (confirm('Are you sure you want to delete this folder?')) {
      alert(`Delete folder: ${folderId}`)
    }
  }

  const handleAddBookmarkToFolder = (folderId: string) => {
    console.log('Add bookmark to folder:', folderId)
    // Use the existing onAddBookmark handler
    onAddBookmark()
  }

  const handleDropBookmarkToFolder = (bookmarkId: string, folderId: string) => {
    console.log('Drop bookmark to folder:', { bookmarkId, folderId })
    // TODO: Implement bookmark moving logic
    alert(`Move bookmark ${bookmarkId} to folder ${folderId}`)
  }

  const handleBookmarkUpdated = (bookmark: any) => {
    console.log('Bookmark updated:', bookmark)
    // TODO: Implement bookmark update logic
  }

  const handleBookmarkDeleted = (bookmarkId: string) => {
    console.log('Bookmark deleted:', bookmarkId)
    // TODO: Implement bookmark deletion logic
    if (confirm('Are you sure you want to delete this bookmark?')) {
      alert(`Delete bookmark: ${bookmarkId}`)
    }
  }

  const handleFolderNavigate = (folderId: string) => {
    console.log('Navigate to folder:', folderId)
    // TODO: Implement folder navigation
    alert(`Navigate to folder: ${folderId}`)
  }

  if (!isActive) return null

  return (
    <div className="relative w-full min-h-screen overflow-auto">
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <ReactFlowProvider>
          <ReactFlow
            nodes={[]}
            edges={[]}
            fitView
            attributionPosition="bottom-left"
            className="bg-gray-50"
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag
            zoomOnScroll
            zoomOnPinch
            zoomOnDoubleClick
            minZoom={0.1}
            maxZoom={4}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            onMove={handleMove}
          >
            <Background gap={12} color="#e5e7eb" />
            <Controls position="bottom-right" />
            <MiniMap position="bottom-left" />
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      <div
        className="relative w-full pointer-events-auto z-10"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
          transformOrigin: '0 0',
          transition: 'none',
          paddingTop: '40px',
          paddingLeft: '40px',
          paddingBottom: '40px',
          minHeight: 'calc(100vh + 80px)',
        }}
      >
        <div className="w-full max-w-[92vw]">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-gray-200/60 w-full min-h-[80vh]">
            <FolderOrgChartView
              folders={folders}
              bookmarks={bookmarks}
              onCreateFolder={() => {
                console.log('🔘 KHV1InfinityBoard: onCreateFolder called');
                console.log('📁 Folders:', folders.length);
                console.log('📚 Bookmarks:', bookmarks.length);
                onCreateFolder();
              }}
              onEditFolder={handleEditFolder}
              onDeleteFolder={handleDeleteFolder}
              onAddBookmarkToFolder={handleAddBookmarkToFolder}
              onDropBookmarkToFolder={handleDropBookmarkToFolder}
              onBookmarkUpdated={handleBookmarkUpdated}
              onBookmarkDeleted={handleBookmarkDeleted}
              onOpenDetail={onOpenDetail}
              currentFolderId={null}
              onFolderNavigate={handleFolderNavigate}
              selectedFolder={null}
              onAddBookmark={onAddBookmark}
              hierarchyAssignments={folderAssignments}
              onHierarchyAssignmentsChange={onHierarchyAssignmentsChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
