
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import DashboardHeader from '@/components/dashboard/dashboard-header'
import DashboardSidebar from '@/components/dashboard/dashboard-sidebar'
import BookmarkGrid from '@/components/bookmarks/bookmark-grid'
import BookmarkKanban from '@/components/bookmarks/bookmark-kanban'
import AddBookmarkDialog from '@/components/bookmarks/add-bookmark-dialog'
import { Bookmark, Folder } from '@/lib/types'

export default function DashboardMain() {
  const { data: session } = useSession()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [currentView, setCurrentView] = useState<'grid' | 'kanban'>('grid')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Fetch bookmarks and folders
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookmarksRes, foldersRes] = await Promise.all([
          fetch('/api/bookmarks'),
          fetch('/api/folders')
        ])
        
        if (bookmarksRes.ok) {
          const bookmarksData = await bookmarksRes.json()
          setBookmarks(bookmarksData)
        }
        
        if (foldersRes.ok) {
          const foldersData = await foldersRes.json()
          setFolders(foldersData)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (session) {
      fetchData()
    }
  }, [session])

  // Filter bookmarks based on search and folder selection
  const filteredBookmarks = bookmarks?.filter((bookmark) => {
    const matchesSearch = !searchQuery || 
      bookmark?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark?.url?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFolder = !selectedFolder || bookmark?.folderId === selectedFolder
    
    return matchesSearch && matchesFolder
  }) ?? []

  const handleBookmarkAdded = (bookmark: Bookmark) => {
    setBookmarks(prev => [bookmark, ...(prev ?? [])])
  }

  const handleBookmarkUpdated = (updatedBookmark: Bookmark) => {
    setBookmarks(prev => prev?.map(b => 
      b?.id === updatedBookmark?.id ? updatedBookmark : b
    ) ?? [])
  }

  const handleBookmarkDeleted = (bookmarkId: string) => {
    setBookmarks(prev => prev?.filter(b => b?.id !== bookmarkId) ?? [])
  }

  const handleFolderSelected = (folderId: string | null) => {
    setSelectedFolder(folderId)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <DashboardHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentView={currentView}
        onViewChange={setCurrentView}
        onAddBookmark={() => setShowAddDialog(true)}
      />
      
      <div className="flex">
        <DashboardSidebar
          folders={folders}
          selectedFolder={selectedFolder}
          onFolderSelect={handleFolderSelected}
          bookmarkCount={bookmarks?.length ?? 0}
        />
        
        <main className="flex-1 p-6">
          <motion.div
            key={currentView}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {currentView === 'grid' ? (
              <BookmarkGrid
                bookmarks={filteredBookmarks}
                onBookmarkUpdate={handleBookmarkUpdated}
                onBookmarkDelete={handleBookmarkDeleted}
              />
            ) : (
              <BookmarkKanban
                bookmarks={filteredBookmarks}
                folders={folders}
                onBookmarkUpdate={handleBookmarkUpdated}
                onBookmarkDelete={handleBookmarkDeleted}
              />
            )}
          </motion.div>
        </main>
      </div>

      <AddBookmarkDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        folders={folders}
        onBookmarkAdded={handleBookmarkAdded}
      />
    </div>
  )
}
