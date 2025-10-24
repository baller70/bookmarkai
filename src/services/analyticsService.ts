/*
  TODO: Migrate to PostgreSQL/Prisma for analytics tracking.
  This service currently has Supabase dependencies removed.
  Need to implement with Prisma client and NextAuth session.

  Suggested steps:
  - Add a Prisma client instance (import from ../lib/prisma or similar).
  - Replace Supabase inserts/updates with Prisma create/update calls.
  - Use NextAuth session/user id for associating analytics records.
  - Add appropriate error handling and batching where needed.
*/

export interface BookmarkVisitData {
  bookmarkId: string
  readingTime?: number
  productivityScore?: number
  sessionData?: {
    startTime: Date
    endTime: Date
    wasInterrupted: boolean
  }
}

export interface PomodoroSessionData {
  taskId?: string
  taskTitle?: string
  duration: number
  type: 'work' | 'shortBreak' | 'longBreak'
  isCompleted: boolean
  wasInterrupted?: boolean
  productivityScore?: number
  notes?: string
}

export interface TaskData {
  title: string
  description?: string
  categoryId?: string
  priorityLevel: number
  deadline?: Date
  estimatedDuration?: number
  tags?: string[]
}

export interface ActivityLogData {
  activityType: string
  entityType: string
  entityId?: string
  metadata?: Record<string, any>
  durationMinutes?: number
  productivityScore?: number
}

class AnalyticsService {
  private static instance: AnalyticsService
  private isTracking: boolean = true
  private sessionStartTime: Date | null = null
  private currentBookmarkId: string | null = null

  private constructor() {
    // Initialize session tracking
    this.startSession()
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  // Session Management
  public startSession(): void {
    this.sessionStartTime = new Date()
    this.logActivity({
      activityType: 'session_start',
      entityType: 'session',
      metadata: {
        timestamp: this.sessionStartTime.toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
      }
    })
  }

  public endSession(): void {
    if (this.sessionStartTime) {
      const sessionDuration = Math.round((Date.now() - this.sessionStartTime.getTime()) / (1000 * 60))
      this.logActivity({
        activityType: 'session_end',
        entityType: 'session',
        durationMinutes: sessionDuration,
        metadata: {
          startTime: this.sessionStartTime.toISOString(),
          endTime: new Date().toISOString()
        }
      })
    }
  }

  // Bookmark Tracking
  public async trackBookmarkVisit(data: BookmarkVisitData): Promise<void> {
    if (!this.isTracking) return

    // TODO: Implement with Prisma and NextAuth
    console.warn('[analyticsService] trackBookmarkVisit not yet implemented with PostgreSQL')
    return
  }

  public startBookmarkSession(bookmarkId: string): void {
    this.currentBookmarkId = bookmarkId
    this.sessionStartTime = new Date()
  }

  public async endBookmarkSession(productivityScore?: number): Promise<void> {
    if (!this.currentBookmarkId || !this.sessionStartTime) return

    const readingTime = Math.round((Date.now() - this.sessionStartTime.getTime()) / (1000 * 60))

    await this.trackBookmarkVisit({
      bookmarkId: this.currentBookmarkId,
      readingTime,
      productivityScore,
      sessionData: {
        startTime: this.sessionStartTime,
        endTime: new Date(),
        wasInterrupted: false
      }
    })

    this.currentBookmarkId = null
    this.sessionStartTime = null
  }

  // Pomodoro Session Tracking
  public async trackPomodoroSession(data: PomodoroSessionData): Promise<string | null> {
    if (!this.isTracking) return null

    // TODO: Implement with Prisma and NextAuth
    console.warn('[analyticsService] trackPomodoroSession not yet implemented with PostgreSQL')
    return null
  }

  // Task Management
  public async createTask(data: TaskData): Promise<string | null> {
    if (!this.isTracking) return null

    // TODO: Implement with Prisma and NextAuth
    console.warn('[analyticsService] createTask not yet implemented with PostgreSQL')
    return null
  }

  public async completeTask(taskId: string, actualDuration?: number): Promise<void> {
    if (!this.isTracking) return

    // TODO: Implement with Prisma and NextAuth
    console.warn('[analyticsService] completeTask not yet implemented with PostgreSQL')
    return
  }

  // Activity Logging
  public async logActivity(data: ActivityLogData): Promise<void> {
    if (!this.isTracking) return

    // TODO: Implement with Prisma and NextAuth
    console.warn('[analyticsService] logActivity not yet implemented with PostgreSQL')
    return
  }

  // Feature Usage Tracking
  public async trackFeatureUsage(featureName: string, metadata?: Record<string, any>): Promise<void> {
    if (!this.isTracking) return

    // TODO: Implement with Prisma and NextAuth
    console.warn('[analyticsService] trackFeatureUsage not yet implemented with PostgreSQL')
    return
  }

  // Search Tracking
  public async trackSearch(query: string, resultsCount: number, filters?: Record<string, any>): Promise<void> {
    if (!this.isTracking) return

    // TODO: Implement with Prisma and NextAuth
    console.warn('[analyticsService] trackSearch not yet implemented with PostgreSQL')
    return
  }

  // Export Tracking
  public async trackExport(exportType: string, itemCount: number): Promise<void> {
    if (!this.isTracking) return

    // TODO: Implement with Prisma and NextAuth
    console.warn('[analyticsService] trackExport not yet implemented with PostgreSQL')
    return
  }

  // Productivity Metrics
  public async getProductivityMetrics(startDate: Date, endDate: Date): Promise<any> {
    // TODO: Implement with Prisma and NextAuth
    console.warn('[analyticsService] getProductivityMetrics not yet implemented with PostgreSQL')
    return null
  }

  public async getBookmarkStats(): Promise<any> {
    // TODO: Implement with Prisma and NextAuth
    console.warn('[analyticsService] getBookmarkStats not yet implemented with PostgreSQL')
    return null
  }

  public async getPomodoroStats(): Promise<any> {
    // TODO: Implement with Prisma and NextAuth
    console.warn('[analyticsService] getPomodoroStats not yet implemented with PostgreSQL')
    return null
  }

  public async getTaskStats(): Promise<any> {
    // TODO: Implement with Prisma and NextAuth
    console.warn('[analyticsService] getTaskStats not yet implemented with PostgreSQL')
    return null
  }
}

export const analyticsService = AnalyticsService.getInstance() 