// Notification Types and Interfaces

export interface NotificationSettings {
  id: string
  bookmarkId: string
  userId: string
  title: string
  message: string
  type: NotificationType
  frequency: NotificationFrequency
  deliveryMethods: DeliveryMethod[]
  scheduledTime?: Date
  duration?: number // Duration in minutes for tasks
  recurringPattern?: RecurringPattern
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastSent?: Date
  nextSend?: Date
  teamMembers?: string[]
}

export type NotificationType = 
  | 'reminder'
  | 'task'
  | 'content_change'
  | 'deadline'
  | 'milestone'
  | 'team_update'

export type NotificationFrequency = 
  | 'once'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'custom'

export type DeliveryMethod = 
  | 'in-app'
  | 'email'
  | 'sms'
  | 'push'

export interface RecurringPattern {
  interval: number
  unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months'
  daysOfWeek?: number[] // 0-6, Sunday-Saturday
  endDate?: Date
  maxOccurrences?: number
}

export interface NotificationTemplate {
  id: string
  name: string
  type: NotificationType
  defaultMessage: string
  variables: string[]
}

export interface DeliveryStatus {
  method: DeliveryMethod
  status: 'pending' | 'sent' | 'failed' | 'delivered'
  sentAt?: Date
  error?: string
}

export interface NotificationHistory {
  id: string
  notificationId: string
  sentAt: Date
  deliveryStatuses: DeliveryStatus[]
  metadata?: Record<string, any>
}

export interface UserNotificationPreferences {
  userId: string
  enableInApp: boolean
  enableEmail: boolean
  enableSMS: boolean
  enablePush: boolean
  quietHours: {
    start: string // HH:mm format
    end: string   // HH:mm format
    timezone: string
  }
  emailDigest: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never'
}