
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import BookmarkCard from './bookmark-card'
import { Bookmark } from '@/lib/types'

interface BookmarkGridProps {
  bookmarks: Bookmark[]
  onBookmarkUpdate: (bookmark: Bookmark) => void
  onBookmarkDelete: (bookmarkId: string) => void
}

export default function BookmarkGrid({
  bookmarks,
  onBookmarkUpdate,
  onBookmarkDelete
}: BookmarkGridProps) {
  if (!bookmarks || bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">
          No bookmarks yet
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
          Start building your bookmark collection by adding your first bookmark. 
          Use the "Add Bookmark" button to get started.
        </p>
      </div>
    )
  }

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {bookmarks.map((bookmark, index) => (
        <motion.div
          key={bookmark?.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <BookmarkCard
            bookmark={bookmark}
            onUpdate={onBookmarkUpdate}
            onDelete={onBookmarkDelete}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
