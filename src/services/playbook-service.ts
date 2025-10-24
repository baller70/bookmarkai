import { toast } from 'sonner'

// Types
export interface PlaybookData {
  id: string
  name: string
  description: string
  thumbnail?: string
  isPublic: boolean
  isCollaborative: boolean
  isMarketplaceListed: boolean
  price: number
  category: string
  tags: string[]
  plays: number
  likes: number
  downloads: number
  createdAt: string
  updatedAt: string
  bookmarks?: BookmarkData[]
  collaborators: CollaboratorData[]
  isLiked: boolean
  owner: {
    id: string
    name: string
    avatar: string
  }
}

export interface BookmarkData {
  id: string
  title: string
  url: string
  description: string
  favicon: string
  tags: string[]
  duration: number
  orderIndex: number
  notes?: string
  dateAdded: string
  playbookBookmarkId?: string
}

export interface CollaboratorData {
  id: string
  role: string
  canEdit: boolean
}

export interface CreatePlaybookRequest {
  user_id: string
  name: string
  description?: string
  thumbnail?: string
  is_public?: boolean
  is_collaborative?: boolean
  is_marketplace_listed?: boolean
  price?: number
  category?: string
  tags?: string[]
}

export interface UpdatePlaybookRequest {
  id: string
  user_id: string
  name?: string
  description?: string
  thumbnail?: string
  is_public?: boolean
  is_collaborative?: boolean
  is_marketplace_listed?: boolean
  price?: number
  category?: string
  tags?: string[]
}

export interface AddBookmarkRequest {
  user_id: string
  bookmark_id: string
  duration_minutes?: number
  notes?: string
  order_index?: number
}

export interface PlaybookFilters {
  user_id: string
  include_public?: boolean
  include_collaborative?: boolean
  category?: string
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface BookmarkUpdateRequest {
  playbook_bookmark_id: string
  order_index?: number
  duration_minutes?: number
  notes?: string
}

export interface PlaybookAnalytics {
  totalPlays: number
  uniquePlayers: number
  totalDuration: number
  averageDuration: number
  completionRate: number
  recentPlays: number
  plays: Array<{
    id: string
    user_id: string
    session_id: string
    duration_seconds: number
    completed: boolean
    bookmark_count: number
    played_at: string
  }>
}

class PlaybookService {
  private baseUrl = '/api/playbooks'

  // Transform API response to component format
  private transformPlaybookData(apiData: any): PlaybookData {
    return {
      id: apiData.id,
      name: apiData.title || apiData.name,
      description: apiData.description || '',
      thumbnail: apiData.cover_image || apiData.thumbnail,
      isPublic: apiData.is_public || false,
      isCollaborative: apiData.is_collaborative || false,
      isMarketplaceListed: apiData.is_marketplace || false,
      price: apiData.price || 0,
      category: apiData.category || '',
      tags: apiData.tags || [],
      plays: apiData.plays_count || apiData.plays || 0,
      likes: apiData.likes_count || apiData.likes || 0,
      downloads: apiData.downloads || 0,
      createdAt: apiData.created_at || apiData.createdAt || new Date().toISOString(),
      updatedAt: apiData.updated_at || apiData.updatedAt || new Date().toISOString(),
      bookmarks: apiData.bookmarks || [],
      collaborators: apiData.collaborators || [],
      isLiked: apiData.is_liked || false,
      owner: {
        id: apiData.user_id || apiData.owner?.id || 'unknown',
        name: apiData.user_name || apiData.owner?.name || 'Unknown User',
        avatar: apiData.user_avatar || apiData.owner?.avatar || '/avatars/default.png'
      }
    }
  }

  // Transform bookmark API response to component format
  private transformBookmarkData(apiData: any): BookmarkData {
    return {
      id: apiData.id,
      title: apiData.bookmark_title || apiData.title,
      url: apiData.bookmark_url || apiData.url,
      description: apiData.bookmark_description || apiData.description || '',
      favicon: apiData.bookmark_favicon || apiData.favicon || '',
      tags: apiData.bookmark_tags || apiData.tags || [],
      duration: apiData.duration_minutes || apiData.duration || 0,
      orderIndex: apiData.position || apiData.orderIndex || 0,
      notes: apiData.notes || '',
      dateAdded: apiData.added_at || apiData.dateAdded || new Date().toISOString(),
      playbookBookmarkId: apiData.id
    }
  }

  // Get playbooks with filters
  async getPlaybooks(filters: PlaybookFilters): Promise<PlaybookData[]> {
    try {
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })

      const response = await fetch(`${this.baseUrl}?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch playbooks')
      }

      // Transform API data to component format
      return data.data.map((playbook: any) => this.transformPlaybookData(playbook))
    } catch (error) {
      console.error('Error fetching playbooks:', error)
      toast.error('Failed to fetch playbooks')
      throw error
    }
  }

  // Create a new playbook
  async createPlaybook(request: CreatePlaybookRequest): Promise<PlaybookData> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create playbook')
      }

      toast.success('Playbook created successfully!')
      return this.transformPlaybookData(data.data)
    } catch (error) {
      console.error('Error creating playbook:', error)
      toast.error('Failed to create playbook')
      throw error
    }
  }

  // Update a playbook
  async updatePlaybook(request: UpdatePlaybookRequest): Promise<PlaybookData> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update playbook')
      }

      toast.success('Playbook updated successfully!')
      return this.transformPlaybookData(data.data)
    } catch (error) {
      console.error('Error updating playbook:', error)
      toast.error('Failed to update playbook')
      throw error
    }
  }

  // Delete a playbook
  async deletePlaybook(id: string, userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}?id=${id}&user_id=${userId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete playbook')
      }

      toast.success('Playbook deleted successfully!')
    } catch (error) {
      console.error('Error deleting playbook:', error)
      toast.error('Failed to delete playbook')
      throw error
    }
  }

  // Get bookmarks for a playbook
  async getPlaybookBookmarks(playbookId: string, userId: string): Promise<BookmarkData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${playbookId}/bookmarks?user_id=${userId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bookmarks')
      }

      return data.data.map((bookmark: any) => this.transformBookmarkData(bookmark))
    } catch (error) {
      console.error('Error fetching playbook bookmarks:', error)
      toast.error('Failed to fetch bookmarks')
      throw error
    }
  }

  // Add bookmark to playbook
  async addBookmarkToPlaybook(playbookId: string, request: AddBookmarkRequest): Promise<BookmarkData> {
    try {
      const response = await fetch(`${this.baseUrl}/${playbookId}/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add bookmark')
      }

      toast.success('Bookmark added to playbook!')
      return this.transformBookmarkData(data.data)
    } catch (error) {
      console.error('Error adding bookmark to playbook:', error)
      toast.error('Failed to add bookmark to playbook')
      throw error
    }
  }

  // Remove bookmark from playbook
  async removeBookmarkFromPlaybook(playbookId: string, playbookBookmarkId: string, userId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${playbookId}/bookmarks?playbook_bookmark_id=${playbookBookmarkId}&user_id=${userId}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove bookmark')
      }

      toast.success('Bookmark removed from playbook!')
    } catch (error) {
      console.error('Error removing bookmark from playbook:', error)
      toast.error('Failed to remove bookmark from playbook')
      throw error
    }
  }

  // Update bookmark order/metadata in playbook
  async updatePlaybookBookmarks(playbookId: string, userId: string, bookmarkUpdates: BookmarkUpdateRequest[]): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${playbookId}/bookmarks`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          bookmark_updates: bookmarkUpdates,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update bookmarks')
      }

      toast.success('Bookmarks updated successfully!')
    } catch (error) {
      console.error('Error updating playbook bookmarks:', error)
      toast.error('Failed to update bookmarks')
      throw error
    }
  }

  // Like a playbook
  async likePlaybook(playbookId: string, userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${playbookId}/likes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to like playbook')
      }

      toast.success('Playbook liked!')
    } catch (error) {
      console.error('Error liking playbook:', error)
      toast.error('Failed to like playbook')
      throw error
    }
  }

  // Unlike a playbook
  async unlikePlaybook(playbookId: string, userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${playbookId}/likes?user_id=${userId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unlike playbook')
      }

      toast.success('Playbook unliked!')
    } catch (error) {
      console.error('Error unliking playbook:', error)
      toast.error('Failed to unlike playbook')
      throw error
    }
  }

  // Record a playbook play
  async recordPlay(playbookId: string, userId: string, sessionData: {
    session_id?: string
    duration_seconds?: number
    completed?: boolean
    bookmark_count?: number
  }): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${playbookId}/plays`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          ...sessionData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record play')
      }
    } catch (error) {
      console.error('Error recording play:', error)
      // Don't show toast for this as it's background analytics
    }
  }

  // Get playbook analytics
  async getPlaybookAnalytics(playbookId: string, userId: string): Promise<PlaybookAnalytics> {
    try {
      const response = await fetch(`${this.baseUrl}/${playbookId}/plays?user_id=${userId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch analytics')
      }

      return data.data
    } catch (error) {
      console.error('Error fetching playbook analytics:', error)
      toast.error('Failed to fetch analytics')
      throw error
    }
  }

  // Generate AI playbook
  async generateAIPlaybook(userId: string, prompt: string): Promise<PlaybookData> {
    try {
      // This would integrate with an AI service to generate playbooks
      // For now, we'll create a mock implementation
      const aiPlaybook: CreatePlaybookRequest = {
        user_id: userId,
        name: 'AI-Generated: ' + prompt,
        description: 'Curated by AI based on your request',
        category: 'AI/ML',
        tags: ['AI-Generated', 'Auto-Curated'],
        is_public: false,
        is_collaborative: false,
      }

      return await this.createPlaybook(aiPlaybook)
    } catch (error) {
      console.error('Error generating AI playbook:', error)
      toast.error('Failed to generate AI playbook')
      throw error
    }
  }
}

export const playbookService = new PlaybookService() 