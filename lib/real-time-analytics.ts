import { useState, useEffect, useCallback, useMemo } from 'react'

interface BookmarkAnalytics {
  id: number
  visits: number
  totalVisits: number
  usagePercentage: number
  lastVisited: string
  timeSpent: number
  weeklyVisits: number
  monthlyVisits: number
  isActive: boolean
  trendDirection: 'up' | 'down' | 'stable'
  sessionCount: number
  avgSessionTime: number
}

interface RealTimeAnalyticsData {
  bookmarks: Map<number, BookmarkAnalytics>
  globalStats: {
    totalVisits: number
    totalBookmarks: number
    avgUsage: number
    activeBookmarks: number
    topPerformer: number | null
  }
  lastUpdated: Date
}

class RealTimeAnalyticsService {
  private static instance: RealTimeAnalyticsService
  private data: RealTimeAnalyticsData
  private listeners: Set<(data: RealTimeAnalyticsData) => void>
  private updateInterval: NodeJS.Timeout | null = null
  private isRunning = false
  public isInitialized = false

  private constructor() {
    this.data = {
      bookmarks: new Map(),
      globalStats: {
        totalVisits: 0,
        totalBookmarks: 0,
        avgUsage: 0,
        activeBookmarks: 0,
        topPerformer: null
      },
      lastUpdated: new Date()
    }
    this.listeners = new Set()
  }

  static getInstance(): RealTimeAnalyticsService {
    if (!RealTimeAnalyticsService.instance) {
      RealTimeAnalyticsService.instance = new RealTimeAnalyticsService()
    }
    return RealTimeAnalyticsService.instance
  }

  // Initialize bookmarks data
  initializeBookmarks(bookmarks: any[]) {
    this.data.bookmarks.clear()
    
    bookmarks.forEach(bookmark => {
      const analytics: BookmarkAnalytics = {
        id: bookmark.id,
        visits: bookmark.visits || bookmark.visit_count || 0,
        totalVisits: bookmark.visits || bookmark.visit_count || 0,
        usagePercentage: this.calculateUsagePercentage(bookmark.visits || bookmark.visit_count || 0),
        lastVisited: bookmark.last_visited_at || bookmark.updated_at || new Date().toISOString(),
        timeSpent: bookmark.time_spent || bookmark.reading_time_minutes || 0,
        weeklyVisits: this.calculateWeeklyVisits(bookmark),
        monthlyVisits: this.calculateMonthlyVisits(bookmark),
        isActive: this.isBookmarkActive(bookmark),
        trendDirection: this.calculateTrend(bookmark),
        sessionCount: bookmark.session_count || 0,
        avgSessionTime: bookmark.avg_session_time || 0
      }
      this.data.bookmarks.set(bookmark.id, analytics)
    })

    this.updateGlobalStats()
    this.notifyListeners()
  }

  // Track a bookmark visit in real-time
  trackVisit(bookmarkId: number, sessionTime?: number) {
    const bookmark = this.data.bookmarks.get(bookmarkId)
    if (!bookmark) return

    // Update visit count
    bookmark.visits += 1
    bookmark.totalVisits += 1
    bookmark.lastVisited = new Date().toISOString()
    bookmark.weeklyVisits += 1
    bookmark.monthlyVisits += 1
    bookmark.isActive = true
    bookmark.sessionCount += 1

    if (sessionTime) {
      bookmark.timeSpent += sessionTime
      bookmark.avgSessionTime = bookmark.timeSpent / bookmark.sessionCount
    }

    // Recalculate usage percentage
    bookmark.usagePercentage = this.calculateUsagePercentage(bookmark.visits)
    
    // Update trend
    bookmark.trendDirection = this.calculateTrendDirection(bookmark)

    // Update global stats
    this.updateGlobalStats()

    // Persist to backend
    this.persistBookmarkAnalytics(bookmarkId, bookmark)

    // Notify listeners
    this.notifyListeners()
  }

  // Calculate usage percentage based on visits
  private calculateUsagePercentage(visits: number): number {
    const maxVisits = Math.max(...Array.from(this.data.bookmarks.values()).map(b => b.visits), 1)
    return Math.min(Math.round((visits / maxVisits) * 100), 100)
  }

  // Calculate weekly visits (mock implementation)
  private calculateWeeklyVisits(bookmark: any): number {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastVisited = new Date(bookmark.last_visited_at || bookmark.updated_at || now)
    
    return lastVisited > weekAgo ? Math.floor((bookmark.visits || 0) * 0.3) : 0
  }

  // Calculate monthly visits (mock implementation)
  private calculateMonthlyVisits(bookmark: any): number {
    const now = new Date()
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const lastVisited = new Date(bookmark.last_visited_at || bookmark.updated_at || now)
    
    return lastVisited > monthAgo ? Math.floor((bookmark.visits || 0) * 0.7) : 0
  }

  // Check if bookmark is active (visited in last 7 days)
  private isBookmarkActive(bookmark: any): boolean {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastVisited = new Date(bookmark.last_visited_at || bookmark.updated_at || now)
    
    return lastVisited > weekAgo
  }

  // Calculate trend direction
  private calculateTrend(bookmark: any): 'up' | 'down' | 'stable' {
    const weeklyVisits = this.calculateWeeklyVisits(bookmark)
    const totalVisits = bookmark.visits || 0
    
    if (weeklyVisits > totalVisits * 0.4) return 'up'
    if (weeklyVisits < totalVisits * 0.1) return 'down'
    return 'stable'
  }

  // Calculate trend direction for existing analytics
  private calculateTrendDirection(analytics: BookmarkAnalytics): 'up' | 'down' | 'stable' {
    if (analytics.weeklyVisits > analytics.totalVisits * 0.4) return 'up'
    if (analytics.weeklyVisits < analytics.totalVisits * 0.1) return 'down'
    return 'stable'
  }

  // Update global statistics
  private updateGlobalStats() {
    const bookmarkValues = Array.from(this.data.bookmarks.values())
    
    this.data.globalStats = {
      totalVisits: bookmarkValues.reduce((sum, b) => sum + b.visits, 0),
      totalBookmarks: bookmarkValues.length,
      avgUsage: bookmarkValues.length > 0 
        ? bookmarkValues.reduce((sum, b) => sum + b.usagePercentage, 0) / bookmarkValues.length 
        : 0,
      activeBookmarks: bookmarkValues.filter(b => b.isActive).length,
      topPerformer: bookmarkValues.length > 0 
        ? bookmarkValues.reduce((max, b) => b.visits > (this.data.bookmarks.get(max)?.visits || 0) ? b.id : max, bookmarkValues[0].id)
        : null
    }

    this.data.lastUpdated = new Date()
  }

  // Persist analytics to backend
  private async persistBookmarkAnalytics(bookmarkId: number, analytics: BookmarkAnalytics) {
    try {
      await fetch('/api/bookmarks/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookmarkId,
          visits: analytics.visits,
          timeSpent: analytics.timeSpent,
          sessionCount: analytics.sessionCount,
          lastVisited: analytics.lastVisited,
          weeklyVisits: analytics.weeklyVisits,
          monthlyVisits: analytics.monthlyVisits
        })
      })
    } catch (error) {
      console.error('Failed to persist analytics:', error)
    }
  }

  // Start real-time updates
  startRealTimeUpdates() {
    if (this.isRunning) return

    this.isRunning = true
    this.updateInterval = setInterval(() => {
      // Simulate real-time activity for demo purposes
      this.simulateActivity()
    }, 5000) // Update every 5 seconds
  }

  // Stop real-time updates
  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    this.isRunning = false
  }

  // Simulate activity for demo purposes
  private simulateActivity() {
    const bookmarkIds = Array.from(this.data.bookmarks.keys())
    if (bookmarkIds.length === 0) return

    // Randomly select a bookmark to simulate activity
    const randomId = bookmarkIds[Math.floor(Math.random() * bookmarkIds.length)]
    const shouldSimulate = Math.random() < 0.3 // 30% chance of activity

    if (shouldSimulate) {
      const sessionTime = Math.floor(Math.random() * 10) + 1 // 1-10 minutes
      this.trackVisit(randomId, sessionTime)
    }
  }

  // Subscribe to analytics updates
  subscribe(callback: (data: RealTimeAnalyticsData) => void) {
    this.listeners.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback)
    }
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.data))
  }

  // Get analytics for a specific bookmark
  getBookmarkAnalytics(bookmarkId: number): BookmarkAnalytics | undefined {
    return this.data.bookmarks.get(bookmarkId)
  }

  // Get all analytics data
  getAllAnalytics(): RealTimeAnalyticsData {
    return { ...this.data }
  }

  // Get global statistics
  getGlobalStats() {
    return { ...this.data.globalStats }
  }
}

// React hook for using real-time analytics
export function useRealTimeAnalytics(bookmarks: any[]) {
  const [analyticsData, setAnalyticsData] = useState<RealTimeAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const service = RealTimeAnalyticsService.getInstance()

  // Memoize bookmarks to prevent unnecessary re-initialization
  const bookmarksLength = useMemo(() => bookmarks.length, [bookmarks.length])
  const bookmarksIds = useMemo(() => bookmarks.map(b => b.id).join(','), [bookmarks])

  useEffect(() => {
    // Only initialize once when bookmarks are first loaded
    if (bookmarksLength > 0 && !service.isInitialized) {
      service.initializeBookmarks(bookmarks)
      service.isInitialized = true
      setIsLoading(false)
    }

    // Subscribe to updates only once
    const unsubscribe = service.subscribe((data) => {
      setAnalyticsData(data)
    })

    // Disable real-time updates completely to prevent DOM instability during drag operations
    // service.startRealTimeUpdates()

    return () => {
      unsubscribe()
      service.stopRealTimeUpdates()
    }
  }, [bookmarksLength]) // Only depend on length, not the entire array

  const trackVisit = useCallback((bookmarkId: number, sessionTime?: number) => {
    service.trackVisit(bookmarkId, sessionTime)
  }, [])

  const getBookmarkAnalytics = useCallback((bookmarkId: number) => {
    return service.getBookmarkAnalytics(bookmarkId)
  }, [])

  return {
    analyticsData,
    isLoading,
    trackVisit,
    getBookmarkAnalytics,
    globalStats: analyticsData?.globalStats || {
      totalVisits: 0,
      totalBookmarks: 0,
      avgUsage: 0,
      activeBookmarks: 0,
      topPerformer: null
    }
  }
}

export default RealTimeAnalyticsService 