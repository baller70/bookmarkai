import { toast } from 'sonner'

export interface Bookmark {
  id: number;
  user_id: string;
  title: string;
  url: string;
  description: string;
  category: string;
  tags?: string[];
  ai_summary?: string;
  ai_tags?: string[];
  ai_category?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  site_health?: 'excellent' | 'working' | 'fair' | 'poor' | 'broken';
  last_health_check?: string;
  healthCheckCount?: number;
  customBackground?: string;
  visits?: number;
  time_spent?: number;
  relatedBookmarks?: number[];

  // Custom uploads for individual bookmark customization
  custom_favicon?: string;
  custom_logo?: string;
  custom_background?: string;
}

export interface BookmarkStorageOptions {
  enableCloudSync?: boolean
  userId: string
}

/**
 * localStorage-first bookmark management with optional cloud sync
 * Integrates with existing sync-service.ts infrastructure
 */
export class BookmarkStorage {
  private readonly STORAGE_KEY = 'bookmarks'
  private readonly SYNC_KEY = 'bookmarks_last_sync'
  private userId: string
  private enableCloudSync: boolean

  constructor(options: BookmarkStorageOptions) {
    this.userId = options.userId
    this.enableCloudSync = options.enableCloudSync ?? false
  }

  /**
   * Get all bookmarks for the current user from localStorage
   */
  async getBookmarks(): Promise<Bookmark[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []
      
      const allBookmarks: Bookmark[] = JSON.parse(stored)
      
      const userBookmarks = allBookmarks.filter(bookmark => bookmark.user_id === this.userId)
      
      console.log(`📚 Loaded ${userBookmarks.length} bookmarks from localStorage for user ${this.userId}`)
      return userBookmarks
    } catch (error) {
      console.error('❌ Error loading bookmarks from localStorage:', error)
      return []
    }
  }

  /**
   * Save bookmark to localStorage (create or update)
   */
  async saveBookmark(bookmark: Partial<Bookmark>): Promise<Bookmark> {
    try {
      const allBookmarks = await this.getAllBookmarks()
      
      if (bookmark.id) {
        // Update existing bookmark
        const index = allBookmarks.findIndex(b => b.id === bookmark.id && b.user_id === this.userId)
        if (index === -1) {
          throw new Error('Bookmark not found')
        }
        
        const updatedBookmark: Bookmark = {
          ...allBookmarks[index],
          ...bookmark,
          updated_at: new Date().toISOString()
        }
        
        allBookmarks[index] = updatedBookmark
        await this.saveAllBookmarks(allBookmarks)
        
        console.log('✅ Updated bookmark in localStorage:', updatedBookmark.title)
        
        if (this.enableCloudSync) {
          this.syncToCloud(updatedBookmark, 'update').catch(console.error)
        }
        
        return updatedBookmark
      } else {
        const newId = Math.max(0, ...allBookmarks.map(b => b.id)) + 1
        
        const newBookmark: Bookmark = {
          id: newId,
          user_id: this.userId,
          title: bookmark.title || '',
          url: bookmark.url || '',
          description: bookmark.description || '',
          category: bookmark.category || 'General',
          tags: bookmark.tags || [],
          ai_summary: bookmark.ai_summary,
          ai_tags: bookmark.ai_tags || [],
          ai_category: bookmark.ai_category,
          notes: bookmark.notes || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          visits: 0,
          time_spent: 0,
          site_health: 'working',
          healthCheckCount: 0,
          customBackground: bookmark.customBackground,
          relatedBookmarks: bookmark.relatedBookmarks || []
        }
        
        allBookmarks.push(newBookmark)
        await this.saveAllBookmarks(allBookmarks)
        
        console.log('✅ Created bookmark in localStorage:', newBookmark.title)
        
        if (this.enableCloudSync) {
          this.syncToCloud(newBookmark, 'create').catch(console.error)
        }
        
        return newBookmark
      }
    } catch (error) {
      console.error('❌ Error saving bookmark:', error)
      throw error
    }
  }

  /**
   * Delete bookmark from localStorage
   */
  async deleteBookmark(bookmarkId: number): Promise<void> {
    try {
      const allBookmarks = await this.getAllBookmarks()
      const bookmarkToDelete = allBookmarks.find(b => b.id === bookmarkId && b.user_id === this.userId)
      
      if (!bookmarkToDelete) {
        throw new Error('Bookmark not found')
      }
      
      const updatedBookmarks = allBookmarks.filter(b => !(b.id === bookmarkId && b.user_id === this.userId))
      await this.saveAllBookmarks(updatedBookmarks)
      
      console.log('✅ Deleted bookmark from localStorage:', bookmarkToDelete.title)
      
      if (this.enableCloudSync) {
        this.syncToCloud(bookmarkToDelete, 'delete').catch(console.error)
      }
    } catch (error) {
      console.error('❌ Error deleting bookmark:', error)
      throw error
    }
  }

  /**
   * Get unique categories from user's bookmarks
   */
  async getCategories(): Promise<string[]> {
    const bookmarks = await this.getBookmarks()
    const categories = [...new Set(bookmarks.map(b => b.category).filter(Boolean))].sort()
    return categories
  }

  /**
   * Search bookmarks by title, description, or tags
   */
  async searchBookmarks(query: string): Promise<Bookmark[]> {
    const bookmarks = await this.getBookmarks()
    const lowercaseQuery = query.toLowerCase()
    
    return bookmarks.filter(bookmark => 
      bookmark.title.toLowerCase().includes(lowercaseQuery) ||
      bookmark.description.toLowerCase().includes(lowercaseQuery) ||
      bookmark.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      bookmark.notes?.toLowerCase().includes(lowercaseQuery)
    )
  }

  /**
   * Export bookmarks as JSON for backup
   */
  async exportBookmarks(): Promise<string> {
    const bookmarks = await this.getBookmarks()
    return JSON.stringify({
      version: '1.0',
      exported_at: new Date().toISOString(),
      user_id: this.userId,
      bookmarks
    }, null, 2)
  }

  /**
   * Import bookmarks from JSON backup
   */
  async importBookmarks(jsonData: string, mergeStrategy: 'replace' | 'merge' = 'merge'): Promise<void> {
    try {
      const importData = JSON.parse(jsonData)
      const importedBookmarks: Bookmark[] = importData.bookmarks || []
      
      if (mergeStrategy === 'replace') {
        const allBookmarks = await this.getAllBookmarks()
        const otherUserBookmarks = allBookmarks.filter(b => b.user_id !== this.userId)
        const newBookmarks = [...otherUserBookmarks, ...importedBookmarks.map(b => ({ ...b, user_id: this.userId }))]
        await this.saveAllBookmarks(newBookmarks)
      } else {
        for (const bookmark of importedBookmarks) {
          await this.saveBookmark({ ...bookmark, user_id: this.userId })
        }
      }
      
      toast.success(`Imported ${importedBookmarks.length} bookmarks`)
      console.log(`✅ Imported ${importedBookmarks.length} bookmarks`)
    } catch (error) {
      console.error('❌ Error importing bookmarks:', error)
      toast.error('Failed to import bookmarks')
      throw error
    }
  }

  /**
   * Enable or disable cloud sync
   */
  setCloudSync(enabled: boolean): void {
    this.enableCloudSync = enabled
    localStorage.setItem(`bookmark_cloud_sync_${this.userId}`, enabled.toString())
    
    if (enabled) {
      toast.success('Cloud sync enabled')
      this.syncAllToCloud().catch(console.error)
    } else {
      toast.info('Cloud sync disabled - bookmarks stored locally only')
    }
  }

  /**
   * Manual sync all bookmarks to cloud
   */
  async syncAllToCloud(): Promise<void> {
    if (!this.enableCloudSync) return
    
    try {
      const bookmarks = await this.getBookmarks()
      
      for (const bookmark of bookmarks) {
        await this.syncToCloud(bookmark, 'sync')
      }
      
      localStorage.setItem(this.SYNC_KEY, new Date().toISOString())
      toast.success(`Synced ${bookmarks.length} bookmarks to cloud`)
    } catch (error) {
      console.error('❌ Cloud sync failed:', error)
      toast.error('Cloud sync failed')
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalBookmarks: number
    storageSize: string
    lastSync?: string
    cloudSyncEnabled: boolean
  }> {
    const bookmarks = await this.getBookmarks()
    const storageData = localStorage.getItem(this.STORAGE_KEY) || ''
    const sizeInBytes = new Blob([storageData]).size
    const sizeInKB = (sizeInBytes / 1024).toFixed(2)
    
    const lastSync = localStorage.getItem(this.SYNC_KEY)
    
    return {
      totalBookmarks: bookmarks.length,
      storageSize: `${sizeInKB} KB`,
      lastSync: lastSync || undefined,
      cloudSyncEnabled: this.enableCloudSync
    }
  }


  private async getAllBookmarks(): Promise<Bookmark[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('❌ Error loading all bookmarks:', error)
      return []
    }
  }

  private async saveAllBookmarks(bookmarks: Bookmark[]): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bookmarks))
    } catch (error) {
      console.error('❌ Error saving bookmarks to localStorage:', error)
      throw error
    }
  }

  private async migrateFromServer(): Promise<void> {
    const migrationKey = `bookmarks_migrated_${this.userId}`
    
    if (localStorage.getItem(migrationKey)) {
      return
    }
    
    try {
      const response = await fetch('/api/bookmarks', {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.bookmarks?.length > 0) {
          const serverBookmarks = result.bookmarks.map(this.transformServerBookmark)
          
          const existingBookmarks = await this.getAllBookmarksRaw()
          const mergedBookmarks = this.mergeBookmarkArrays(existingBookmarks, serverBookmarks)
          
          await this.saveAllBookmarksRaw(mergedBookmarks)
          console.log(`✅ Migrated ${serverBookmarks.length} bookmarks from server to localStorage`)
        }
      }
      
      localStorage.setItem(migrationKey, 'true')
    } catch (error) {
      console.warn('⚠️ Migration from server failed:', error)
      localStorage.setItem(migrationKey, 'true')
    }
  }

  private async getAllBookmarksRaw(): Promise<Bookmark[]> {
    try {
      const bookmarksJson = localStorage.getItem(this.STORAGE_KEY)
      if (!bookmarksJson) {
        return []
      }
      return JSON.parse(bookmarksJson) as Bookmark[]
    } catch (error) {
      console.error('❌ Error loading raw bookmarks:', error)
      return []
    }
  }

  private async saveAllBookmarksRaw(bookmarks: Bookmark[]): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bookmarks))
    } catch (error) {
      console.error('❌ Error saving raw bookmarks:', error)
      throw error
    }
  }

  private transformServerBookmark = (serverBookmark: any): Bookmark => {
    return {
      id: serverBookmark.id || Date.now(),
      user_id: this.userId,
      title: serverBookmark.title || 'Untitled',
      url: serverBookmark.url || '',
      description: serverBookmark.description || '',
      category: serverBookmark.category || 'General',
      tags: serverBookmark.tags || [],
      ai_summary: serverBookmark.ai_summary,
      ai_tags: serverBookmark.ai_tags || [],
      ai_category: serverBookmark.ai_category,
      notes: serverBookmark.notes || '',
      created_at: serverBookmark.created_at || new Date().toISOString(),
      updated_at: serverBookmark.updated_at || new Date().toISOString(),
      site_health: serverBookmark.site_health || 'working',
      last_health_check: serverBookmark.last_health_check,
      healthCheckCount: serverBookmark.healthCheckCount || 0,
      customBackground: serverBookmark.customBackground,
      visits: serverBookmark.visits || 0,
      time_spent: serverBookmark.time_spent || 0,
      relatedBookmarks: serverBookmark.relatedBookmarks || []
    }
  }

  private mergeBookmarkArrays(existing: Bookmark[], incoming: Bookmark[]): Bookmark[] {
    const bookmarkMap = new Map<string, Bookmark>()
    
    existing.forEach(bookmark => {
      if (bookmark.url && bookmark.user_id) {
        const key = `${bookmark.user_id}:${bookmark.url}`
        bookmarkMap.set(key, bookmark)
      }
    })
    
    incoming.forEach(bookmark => {
      if (bookmark.url && bookmark.user_id) {
        const key = `${bookmark.user_id}:${bookmark.url}`
        const existingBookmark = bookmarkMap.get(key)
        
        if (!existingBookmark || new Date(bookmark.updated_at) > new Date(existingBookmark.updated_at)) {
          bookmarkMap.set(key, bookmark)
        }
      }
    })
    
    return Array.from(bookmarkMap.values())
  }

  getCloudSyncStatus(): boolean {
    return this.enableCloudSync
  }

  private async syncToCloud(bookmark: Bookmark, action: 'create' | 'update' | 'delete' | 'sync'): Promise<void> {
    try {
      const endpoint = '/api/bookmarks'
      
      if (action === 'delete') {
        await fetch(`${endpoint}?id=${bookmark.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`,
          }
        })
      } else {
        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`,
          },
          body: JSON.stringify(bookmark)
        })
      }
      
      console.log(`✅ Synced bookmark to cloud: ${action} - ${bookmark.title}`)
    } catch (error) {
      console.warn(`⚠️ Cloud sync failed for ${action}:`, error)
    }
  }

  private getAuthToken(): string {
    return localStorage.getItem('supabase.auth.token') || ''
  }
}

/**
 * Factory function to create BookmarkStorage instance
 */
export function createBookmarkStorage(userId: string, enableCloudSync = false): BookmarkStorage {
  return new BookmarkStorage({ userId, enableCloudSync })
}

/**
 * Hook-like function for React components
 */
export function useBookmarkStorage(userId: string, enableCloudSync = false) {
  const storage = createBookmarkStorage(userId, enableCloudSync)
  
  return {
    getBookmarks: () => storage.getBookmarks(),
    saveBookmark: (bookmark: Partial<Bookmark>) => storage.saveBookmark(bookmark),
    deleteBookmark: (id: number) => storage.deleteBookmark(id),
    getCategories: () => storage.getCategories(),
    searchBookmarks: (query: string) => storage.searchBookmarks(query),
    exportBookmarks: () => storage.exportBookmarks(),
    importBookmarks: (data: string, strategy?: 'replace' | 'merge') => storage.importBookmarks(data, strategy),
    setCloudSync: (enabled: boolean) => storage.setCloudSync(enabled),
    syncAllToCloud: () => storage.syncAllToCloud(),
    getStorageStats: () => storage.getStorageStats()
  }
}
