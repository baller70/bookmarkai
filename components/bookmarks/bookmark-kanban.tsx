
'use client'

import { motion } from 'framer-motion'
import BookmarkCard from './bookmark-card'
import { Bookmark, Folder } from '@/lib/types'

interface BookmarkKanbanProps {
  bookmarks: Bookmark[]
  folders: Folder[]
  onBookmarkUpdate: (bookmark: Bookmark) => void
  onBookmarkDelete: (bookmarkId: string) => void
}

export default function BookmarkKanban({
  bookmarks,
  folders,
  onBookmarkUpdate,
  onBookmarkDelete
}: BookmarkKanbanProps) {
  // Group bookmarks by category or folder
  const groupedBookmarks = bookmarks?.reduce((acc, bookmark) => {
    const key = bookmark?.folderId || 'unorganized'
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(bookmark)
    return acc
  }, {} as Record<string, Bookmark[]>) || {}

  const columns = [
    { id: 'unorganized', title: 'Unorganized', bookmarks: groupedBookmarks['unorganized'] || [] },
    ...folders?.map(folder => ({
      id: folder?.id || '',
      title: folder?.name || '',
      bookmarks: groupedBookmarks[folder?.id || ''] || [],
      color: folder?.color
    })) || []
  ]

  return (
    <div className="flex space-x-6 overflow-x-auto pb-6">
      {columns.map((column) => (
        <motion.div
          key={column.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0 w-80"
        >
          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {column.title}
              </h3>
              <span className="text-sm text-slate-500 bg-white dark:bg-slate-700 px-2 py-1 rounded">
                {column.bookmarks?.length || 0}
              </span>
            </div>
            
            <div className="space-y-4">
              {column.bookmarks?.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  No bookmarks in this category
                </div>
              ) : (
                column.bookmarks?.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark?.id}
                    bookmark={bookmark}
                    onUpdate={onBookmarkUpdate}
                    onDelete={onBookmarkDelete}
                  />
                ))
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
