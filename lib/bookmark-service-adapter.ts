import { BookmarkStorage, type Bookmark } from './bookmark-storage'

export class BookmarkServiceAdapter {
  private storage: BookmarkStorage
  private userId: string
  
  constructor(userId: string, enableCloudSync = false) {
    this.userId = userId
    this.storage = new BookmarkStorage({ userId, enableCloudSync })
  }
  
  async interceptBookmarkAPI(url: string, options?: RequestInit): Promise<Response> {
    const urlObj = new URL(url, window.location.origin)
    
    if (urlObj.pathname === '/api/bookmarks') {
      if (!options || options.method === 'GET') {
        return this.handleGetBookmarks(urlObj.searchParams)
      } else if (options.method === 'POST') {
        return this.handleCreateOrUpdateBookmark(options)
      } else if (options.method === 'DELETE') {
        return this.handleDeleteBookmark(urlObj.searchParams)
      }
    }
    
    return fetch(url, options)
  }
  
  private async handleGetBookmarks(searchParams: URLSearchParams): Promise<Response> {
    const bookmarks = await this.storage.getBookmarks()
    
    const transformedBookmarks = bookmarks.map(bookmark => ({
      ...bookmark,
      title: bookmark.title?.toUpperCase() || 'UNTITLED',
      priority: 'medium',
      isFavorite: false,
      lastVisited: (bookmark.visits || 0) > 0 ? new Date(bookmark.created_at).toLocaleDateString() : 'Never',
      dateAdded: new Date(bookmark.created_at).toLocaleDateString(),
      favicon: bookmark.title?.charAt(0)?.toUpperCase() || 'B',
      screenshot: "/placeholder.svg",
      circularImage: "/placeholder.svg",
      logo: "",
      timeSpent: bookmark.time_spent ? `${bookmark.time_spent}m` : '0m',
      weeklyVisits: 0,
      project: {
        name: bookmark.ai_category || "GENERAL",
        progress: 0,
        status: "Active"
      }
    }))
    
    return new Response(JSON.stringify({
      success: true,
      bookmarks: transformedBookmarks,
      total: transformedBookmarks.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  private async handleCreateOrUpdateBookmark(options: RequestInit): Promise<Response> {
    try {
      const body = await (options.body as any)
      const bookmarkData = typeof body === 'string' ? JSON.parse(body) : body
      
      let bookmark: Bookmark
      
      if (bookmarkData.id) {
        bookmark = await this.storage.saveBookmark(bookmarkData)
      } else {
        bookmark = await this.storage.saveBookmark(bookmarkData)
      }
      
      return new Response(JSON.stringify({
        success: true,
        bookmark,
        message: bookmarkData.id ? 'Bookmark updated successfully' : 'Bookmark created successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: (error as Error).message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  private async handleDeleteBookmark(searchParams: URLSearchParams): Promise<Response> {
    try {
      const bookmarkId = searchParams.get('id')
      if (!bookmarkId) {
        throw new Error('Bookmark ID is required')
      }
      
      await this.storage.deleteBookmark(parseInt(bookmarkId))
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Bookmark deleted successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: (error as Error).message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  setCloudSync(enabled: boolean): void {
    this.storage.setCloudSync(enabled)
  }
  
  getCloudSyncStatus(): boolean {
    return this.storage.getCloudSyncStatus()
  }
  
  async getStorageStats(): Promise<any> {
    return this.storage.getStorageStats()
  }
  
  async exportBookmarks(): Promise<string> {
    return this.storage.exportBookmarks()
  }
  
  async importBookmarks(data: string, mode: 'merge' | 'replace'): Promise<void> {
    return this.storage.importBookmarks(data, mode)
  }
}
