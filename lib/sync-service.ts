// @ts-nocheck
import { toast } from 'sonner'

interface SyncData {
  profileData?: any
  bookmarks?: any[]
  settings?: any
  timestamp: string
  source: 'localStorage' | 'supabase' | 'github'
}

interface SyncResult {
  success: boolean
  message: string
  data?: any
  errors?: string[]
}

class SyncService {
  private static instance: SyncService
  private syncInProgress = false
  private lastSyncTime: string | null = null

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService()
    }
    return SyncService.instance
  }

  // Main sync orchestrator
  async syncAll(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return {
        success: false,
        message: 'Sync already in progress'
      }
    }

    this.syncInProgress = true
    const errors: string[] = []
    let syncedData: any = {}

    try {
      toast.loading('Starting full sync...')

      // 1. Collect data from all sources
      const localData = await this.getLocalStorageData()
      const supabaseData = await this.getSupabaseData()
      
      // 2. Merge and resolve conflicts
      const mergedData = this.mergeData(localData, supabaseData)
      
      // 3. Sync to all destinations
      const localSyncResult = await this.syncToLocalStorage(mergedData)
      if (!localSyncResult.success) errors.push(`localStorage: ${localSyncResult.message}`)

      const supabaseSyncResult = await this.syncToSupabase(mergedData)
      if (!supabaseSyncResult.success) errors.push(`Supabase: ${supabaseSyncResult.message}`)

      const githubSyncResult = await this.syncToGitHub(mergedData)
      if (!githubSyncResult.success) errors.push(`GitHub: ${githubSyncResult.message}`)

      this.lastSyncTime = new Date().toISOString()
      syncedData = mergedData

      toast.dismiss()
      if (errors.length === 0) {
        toast.success('All data synced successfully!')
        return {
          success: true,
          message: 'Full sync completed successfully',
          data: syncedData
        }
      } else {
        toast.warning(`Sync completed with ${errors.length} errors`)
        return {
          success: false,
          message: 'Sync completed with errors',
          data: syncedData,
          errors
        }
      }

    } catch (error) {
      console.error('Sync error:', error)
      toast.dismiss()
      toast.error('Sync failed')
      return {
        success: false,
        message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    } finally {
      this.syncInProgress = false
    }
  }

  // Get data from localStorage
  private async getLocalStorageData(): Promise<SyncData> {
    try {
      const userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}')
      const profilePicture = localStorage.getItem('profilePicture')
      const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]')
      
      return {
        profileData: {
          ...userSettings.profile,
          avatar: userSettings.profile?.avatar || profilePicture
        },
        bookmarks,
        settings: userSettings,
        timestamp: new Date().toISOString(),
        source: 'localStorage'
      }
    } catch (error) {
      console.error('Error reading localStorage:', error)
      return {
        timestamp: new Date().toISOString(),
        source: 'localStorage'
      }
    }
  }

  // Get data from Supabase via MCP
  private async getSupabaseData(): Promise<SyncData> {
    try {
      // Get profile data
      const profileResponse = await fetch('/api/save?table=user_profiles&title=User Profile')
      const profileResult = await profileResponse.json()
      
      // Get settings data
      const settingsResponse = await fetch('/api/save?table=user_settings&title=User Settings')
      const settingsResult = await settingsResponse.json()
      
      // Get bookmarks data
      const bookmarksResponse = await fetch('/api/bookmarks?user_id=48e1b5b9-3b0f-4ccb-8b34-831b1337fc3f')
      const bookmarksResult = await bookmarksResponse.json()

      return {
        profileData: profileResult.data?.found ? JSON.parse(profileResult.data.description || '{}') : {},
        settings: settingsResult.data?.found ? JSON.parse(settingsResult.data.description || '{}') : {},
        bookmarks: bookmarksResult.bookmarks || [],
        timestamp: new Date().toISOString(),
        source: 'supabase'
      }
    } catch (error) {
      console.error('Error reading Supabase:', error)
      return {
        timestamp: new Date().toISOString(),
        source: 'supabase'
      }
    }
  }

  // Merge data from different sources (localStorage takes precedence for recent changes)
  private mergeData(localData: SyncData, supabaseData: SyncData): SyncData {
    // Simple merge strategy: localStorage wins for profile data, merge bookmarks
    const mergedBookmarks = this.mergeBookmarks(localData.bookmarks || [], supabaseData.bookmarks || [])
    
    return {
      profileData: {
        ...supabaseData.profileData,
        ...localData.profileData // localStorage takes precedence
      },
      settings: {
        ...supabaseData.settings,
        ...localData.settings // localStorage takes precedence
      },
      bookmarks: mergedBookmarks,
      timestamp: new Date().toISOString(),
      source: 'merged'
    }
  }

  // Merge bookmarks arrays, removing duplicates
  private mergeBookmarks(localBookmarks: any[], supabaseBookmarks: any[]): any[] {
    const bookmarkMap = new Map()
    
    // Add Supabase bookmarks first
    supabaseBookmarks.forEach(bookmark => {
      if (bookmark.url) {
        bookmarkMap.set(bookmark.url, bookmark)
      }
    })
    
    // Add/override with local bookmarks
    localBookmarks.forEach(bookmark => {
      if (bookmark.url) {
        bookmarkMap.set(bookmark.url, bookmark)
      }
    })
    
    return Array.from(bookmarkMap.values())
  }

  // Sync to localStorage
  private async syncToLocalStorage(data: SyncData): Promise<SyncResult> {
    try {
      if (data.settings) {
        localStorage.setItem('userSettings', JSON.stringify(data.settings))
      }
      
      if (data.profileData?.avatar) {
        localStorage.setItem('profilePicture', data.profileData.avatar)
      }
      
      if (data.bookmarks) {
        localStorage.setItem('bookmarks', JSON.stringify(data.bookmarks))
      }
      
      return {
        success: true,
        message: 'localStorage sync completed'
      }
    } catch (error) {
      return {
        success: false,
        message: `localStorage sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Sync to Supabase via MCP
  private async syncToSupabase(data: SyncData): Promise<SyncResult> {
    try {
      const results: any[] = []

      // Save profile data
      if (data.profileData) {
        const profileResponse = await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'user_profiles',
            payload: {
              url: 'https://profile.example.com/user-profile',
              title: 'User Profile',
              description: JSON.stringify(data.profileData),
              created_at: new Date().toISOString()
            }
          })
        })
        results.push(await profileResponse.json())
      }

      // Save settings data
      if (data.settings) {
        const settingsResponse = await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'user_settings',
            payload: {
              url: 'https://settings.example.com/user-settings',
              title: 'User Settings',
              description: JSON.stringify(data.settings),
              created_at: new Date().toISOString()
            }
          })
        })
        results.push(await settingsResponse.json())
      }

      // Save each bookmark individually
      if (data.bookmarks && data.bookmarks.length > 0) {
        for (const bookmark of data.bookmarks) {
          const bookmarkResponse = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              table: 'bookmarks',
              payload: {
                ...bookmark,
                created_at: bookmark.created_at || new Date().toISOString()
              }
            })
          })
          results.push(await bookmarkResponse.json())
        }
      }

      const failedResults = results.filter(r => !r.success)
      if (failedResults.length > 0) {
        return {
          success: false,
          message: `Supabase sync partially failed: ${failedResults.length} operations failed`
        }
      }

      return {
        success: true,
        message: 'Supabase sync completed'
      }
    } catch (error) {
      return {
        success: false,
        message: `Supabase sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Sync to GitHub (commit and push changes)
  private async syncToGitHub(data: SyncData): Promise<SyncResult> {
    try {
      // Save sync data to a file for version control
      const syncDataPath = `data/sync/sync-${new Date().toISOString().split('T')[0]}.json`
      
      const response = await fetch('/api/save-sync-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: syncDataPath,
          data: {
            ...data,
            syncTime: new Date().toISOString(),
            version: '1.0.0'
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save sync data file')
      }

      return {
        success: true,
        message: 'GitHub sync data prepared'
      }
    } catch (error) {
      return {
        success: false,
        message: `GitHub sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Quick sync for specific data types
  async syncProfileData(profileData: any): Promise<SyncResult> {
    try {
      // Update localStorage
      const userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}')
      userSettings.profile = { ...userSettings.profile, ...profileData }
      localStorage.setItem('userSettings', JSON.stringify(userSettings))
      
      if (profileData.avatar) {
        localStorage.setItem('profilePicture', profileData.avatar)
      }

      // Update Supabase
      const supabaseResult = await this.syncToSupabase({
        profileData,
        timestamp: new Date().toISOString(),
        source: 'quick-sync'
      })

      return {
        success: supabaseResult.success,
        message: `Profile sync ${supabaseResult.success ? 'completed' : 'failed'}`
      }
    } catch (error) {
      return {
        success: false,
        message: `Profile sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Get sync status
  getSyncStatus() {
    return {
      lastSyncTime: this.lastSyncTime,
      syncInProgress: this.syncInProgress
    }
  }
}

// API endpoint for saving sync data files
export async function saveSyncDataFile(path: string, data: any): Promise<boolean> {
  try {
    // This would typically save to the filesystem for git tracking
    // For now, we'll use the existing save API
    const response = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'sync_data',
        payload: {
          url: `https://sync.example.com/${path}`,
          title: `Sync Data ${new Date().toISOString()}`,
          description: JSON.stringify(data),
          created_at: new Date().toISOString()
        }
      })
    })

    return response.ok
  } catch (error) {
    console.error('Error saving sync data file:', error)
    return false
  }
}

export default SyncService.getInstance() 