import { promises as fs } from 'fs'
import path from 'path'

// File path for bookmarks data
const BOOKMARKS_FILE = path.join(process.cwd(), 'data/bookmarks.json')

export interface BookmarkData {
  id: number
  title: string
  url: string
  description?: string
  category?: string
  tags?: string[]
  user_id: string
  created_at: string
  updated_at?: string
  site_health?: 'excellent' | 'working' | 'fair' | 'poor' | 'broken'
  last_health_check?: string
  healthCheckCount?: number
  customBackground?: string
  visits?: number
  time_spent?: number
  notes?: string
  ai_category?: string
  ai_summary?: string
  ai_tags?: string[]
}

// Ensure directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(BOOKMARKS_FILE)
  try {
    await fs.mkdir(dataDir, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
}

// Load bookmarks from file
export async function loadBookmarks(): Promise<BookmarkData[]> {
  try {
    await ensureDataDirectory()
    const data = await fs.readFile(BOOKMARKS_FILE, 'utf8')
    return JSON.parse(data) as BookmarkData[]
  } catch (error) {
    // If file doesn't exist, return empty array
    if ((error as any).code === 'ENOENT') {
      return []
    }
    throw error
  }
}

// Save bookmarks to file
export async function saveBookmarks(bookmarks: BookmarkData[]): Promise<void> {
  try {
    await ensureDataDirectory()
    await fs.writeFile(BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2))
  } catch (error) {
    console.error('Failed to save bookmarks:', error)
    throw error
  }
}

// Add a single bookmark
export async function addBookmark(bookmark: Omit<BookmarkData, 'id'>): Promise<BookmarkData> {
  const bookmarks = await loadBookmarks()
  const newId = Math.max(0, ...bookmarks.map(b => b.id)) + 1
  
  const newBookmark: BookmarkData = {
    ...bookmark,
    id: newId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  bookmarks.push(newBookmark)
  await saveBookmarks(bookmarks)
  
  return newBookmark
}

// Update a bookmark
export async function updateBookmark(id: number, updates: Partial<BookmarkData>): Promise<BookmarkData | null> {
  const bookmarks = await loadBookmarks()
  const index = bookmarks.findIndex(b => b.id === id)
  
  if (index === -1) {
    return null
  }
  
  bookmarks[index] = {
    ...bookmarks[index],
    ...updates,
    updated_at: new Date().toISOString()
  }
  
  await saveBookmarks(bookmarks)
  return bookmarks[index]
}

// Delete a bookmark
export async function deleteBookmark(id: number): Promise<boolean> {
  const bookmarks = await loadBookmarks()
  const index = bookmarks.findIndex(b => b.id === id)
  
  if (index === -1) {
    return false
  }
  
  bookmarks.splice(index, 1)
  await saveBookmarks(bookmarks)
  
  return true
} 