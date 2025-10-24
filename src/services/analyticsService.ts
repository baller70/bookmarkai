import { createClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time environment variable issues
let supabaseClient: any = null

const getSupabaseClient = () => {
  if (!supabaseClient && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  return supabaseClient
}

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

    try {
      const { data: { user } } = await getSupabaseClient().auth.getUser()
      if (!user) return

      // Update bookmark visit count and last visited time
      const { error: updateError } = await getSupabaseClient()
        .from('user_bookmarks')
        .update({
          visit_count: getSupabaseClient().rpc('increment_visit_count', { bookmark_id: data.bookmarkId }),
          last_visited_at: new Date().toISOString(),
          ...(data.readingTime && { reading_time_minutes: data.readingTime }),
          ...(data.productivityScore && { productivity_score: data.productivityScore })
        })
        .eq('id', data.bookmarkId)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Failed to update bookmark visit:', updateError)
        return
      }

      // Log the activity
      await this.logActivity({
        activityType: 'bookmark_visit',
        entityType: 'bookmark',
        entityId: data.bookmarkId,
        durationMinutes: data.readingTime,
        productivityScore: data.productivityScore,
        metadata: {
          sessionData: data.sessionData,
          timestamp: new Date().toISOString()
        }
      })

      this.currentBookmarkId = data.bookmarkId

    } catch (error) {
      console.error('Failed to track bookmark visit:', error)
    }
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

    try {
      const { data: { user } } = await getSupabaseClient().auth.getUser()
      if (!user) return null

      const { data: session, error } = await getSupabaseClient()
        .from('user_pomodoro_sessions')
        .insert({
          user_id: user.id,
          task_id: data.taskId || null,
          task_title: data.taskTitle || null,
          start_time: new Date().toISOString(),
          end_time: data.isCompleted ? new Date().toISOString() : null,
          duration: data.duration,
          type: data.type,
          is_completed: data.isCompleted,
          was_interrupted: data.wasInterrupted || false,
          productivity_score: data.productivityScore,
          notes: data.notes
        })
        .select('id')
        .single()

      if (error) {
        console.error('Failed to track pomodoro session:', error)
        return null
      }

      // Log the activity
      await this.logActivity({
        activityType: 'pomodoro_session',
        entityType: 'session',
        entityId: session.id,
        durationMinutes: data.duration,
        productivityScore: data.productivityScore,
        metadata: {
          type: data.type,
          isCompleted: data.isCompleted,
          wasInterrupted: data.wasInterrupted,
          taskTitle: data.taskTitle
        }
      })

      return session.id

    } catch (error) {
      console.error('Failed to track pomodoro session:', error)
      return null
    }
  }

  // Task Management
  public async createTask(data: TaskData): Promise<string | null> {
    if (!this.isTracking) return null

    try {
      const { data: { user } } = await getSupabaseClient().auth.getUser()
      if (!user) return null

      const { data: task, error } = await getSupabaseClient()
        .from('user_tasks')
        .insert({
          user_id: user.id,
          title: data.title,
          description: data.description,
          category_id: data.categoryId || null,
          priority_level: data.priorityLevel,
          deadline: data.deadline?.toISOString() || null,
          estimated_duration: data.estimatedDuration,
          tags: data.tags || []
        })
        .select('id')
        .single()

      if (error) {
        console.error('Failed to create task:', error)
        return null
      }

      // Log the activity
      await this.logActivity({
        activityType: 'task_create',
        entityType: 'task',
        entityId: task.id,
        metadata: {
          title: data.title,
          priorityLevel: data.priorityLevel,
          hasDeadline: !!data.deadline
        }
      })

      return task.id

    } catch (error) {
      console.error('Failed to create task:', error)
      return null
    }
  }

  public async completeTask(taskId: string, actualDuration?: number): Promise<void> {
    if (!this.isTracking) return

    try {
      const { data: { user } } = await getSupabaseClient().auth.getUser()
      if (!user) return

      const { error } = await getSupabaseClient()
        .from('user_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          actual_duration: actualDuration,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Failed to complete task:', error)
        return
      }

      // Log the activity
      await this.logActivity({
        activityType: 'task_complete',
        entityType: 'task',
        entityId: taskId,
        durationMinutes: actualDuration,
        metadata: {
          completedAt: new Date().toISOString()
        }
      })

    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  // Activity Logging
  public async logActivity(data: ActivityLogData): Promise<void> {
    if (!this.isTracking) return

    try {
      const { data: { user } } = await getSupabaseClient().auth.getUser()
      if (!user) return

      const { error } = await getSupabaseClient()
        .from('user_activity_log')
        .insert({
          user_id: user.id,
          activity_type: data.activityType,
          entity_type: data.entityType,
          entity_id: data.entityId || null,
          metadata: data.metadata || {},
          duration_minutes: data.durationMinutes,
          productivity_score: data.productivityScore
        })

      if (error) {
        console.error('Failed to log activity:', error)
      }

    } catch (error) {
      console.error('Failed to log activity:', error)
    }
  }

  // Category Usage Tracking
  public async trackCategoryUsage(categoryId: string): Promise<void> {
    if (!this.isTracking) return

    try {
      const { data: { user } } = await getSupabaseClient().auth.getUser()
      if (!user) return

      const { error } = await getSupabaseClient()
        .from('user_bookmark_categories')
        .update({
          usage_count: getSupabaseClient().rpc('increment', { x: 1 }),
          last_used_at: new Date().toISOString()
        })
        .eq('id', categoryId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Failed to track category usage:', error)
        return
      }

      // Log the activity
      await this.logActivity({
        activityType: 'category_use',
        entityType: 'category',
        entityId: categoryId,
        metadata: {
          timestamp: new Date().toISOString()
        }
      })

    } catch (error) {
      console.error('Failed to track category usage:', error)
    }
  }

  // Performance and Productivity Tracking
  public async updateProductivityScore(entityType: string, entityId: string, score: number): Promise<void> {
    if (!this.isTracking || score < 0 || score > 100) return

    try {
      const { data: { user } } = await getSupabaseClient().auth.getUser()
      if (!user) return

      let table: string
      switch (entityType) {
        case 'bookmark':
          table = 'user_bookmarks'
          break
        case 'category':
          table = 'user_bookmark_categories'
          break
        default:
          return
      }

      const { error } = await getSupabaseClient()
        .from(table)
        .update({ productivity_score: score })
        .eq('id', entityId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Failed to update productivity score:', error)
        return
      }

      // Log the activity
      await this.logActivity({
        activityType: 'productivity_update',
        entityType,
        entityId,
        productivityScore: score,
        metadata: {
          previousScore: null, // Could track this if needed
          newScore: score
        }
      })

    } catch (error) {
      console.error('Failed to update productivity score:', error)
    }
  }

  // Analytics Cache Management
  public async invalidateAnalyticsCache(userId?: string): Promise<void> {
    try {
      const { data: { user } } = await getSupabaseClient().auth.getUser()
      const targetUserId = userId || user?.id
      
      if (!targetUserId) return

      const { error } = await getSupabaseClient()
        .from('user_analytics_cache')
        .delete()
        .eq('user_id', targetUserId)

      if (error) {
        console.error('Failed to invalidate analytics cache:', error)
      }

    } catch (error) {
      console.error('Failed to invalidate analytics cache:', error)
    }
  }

  // Configuration
  public setTracking(enabled: boolean): void {
    this.isTracking = enabled
  }

  public isTrackingEnabled(): boolean {
    return this.isTracking
  }

  // Cleanup
  public cleanup(): void {
    this.endSession()
    this.currentBookmarkId = null
    this.sessionStartTime = null
  }
}

// Export singleton instance
export const analyticsService = AnalyticsService.getInstance()

// Auto-cleanup on page unload (client-side only)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    analyticsService.cleanup()
  })

  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      analyticsService.endBookmarkSession()
    }
  })
}

export default analyticsService 