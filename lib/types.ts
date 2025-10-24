// Define your database types here
export interface User {
  id: string
  email: string
  password: string
  name?: string
  createdAt: Date
  updatedAt: Date
}

export interface Bookmark {
  id: string
  userId: string
  title: string
  url: string
  description: string
  category: string
  tags: string[]
  aiSummary?: string
  aiTags: string[]
  aiCategory?: string
  notes?: string
  priority?: number
  createdAt: Date
  updatedAt: Date
  siteHealth: 'excellent' | 'working' | 'fair' | 'poor' | 'broken'
  lastHealthCheck?: Date
  healthCheckCount: number
  customBackground?: string
  favicon?: string
  customFavicon?: string
  customLogo?: string
  visits: number
  timeSpent: number
  relatedBookmarks: string[]
  folderId?: string
  folder?: Folder
}

export interface Folder {
  id: string
  userId: string
  name: string
  description?: string
  color: string
  icon: string
  parentId?: string
  position: number
  createdAt: Date
  updatedAt: Date
  parent?: Folder
  children?: Folder[]
  bookmarks?: Bookmark[]
}

export interface UserSettings {
  id: string
  userId: string
  theme: 'light' | 'dark' | 'system'
  accentColor: string
  customColor?: string
  fontSize: number
  dyslexiaFont: boolean
  layoutDensity: string
  autoSave: boolean
  defaultView: string
  itemsPerPage: number
  autoRefresh: boolean
  refreshInterval: number
  emailNotifications: boolean
  pushNotifications: boolean
  weekStartDay: number
  dataSharing: boolean
  analyticsEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AiSettings {
  id: string
  userId: string
  settings: Record<string, any>
  autoProcessing: boolean
  smartTags: boolean
  autoCategory: boolean
  summaryLength: string
  createdAt: Date
  updatedAt: Date
}

export interface Task {
  id: string
  userId: string
  title: string
  description?: string
  categoryId?: string
  priorityLevel: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  deadline?: Date
  estimatedDuration?: number
  actualDuration?: number
  isRecurring: boolean
  recurringPattern?: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface UserNotification {
  id: string
  userId: string
  type: 'reminder' | 'achievement' | 'system' | 'bookmark_suggestion' | 'folder_suggestion'
  title: string
  message?: string
  isRead: boolean
  data: Record<string, any>
  createdAt: Date
  updatedAt: Date
}