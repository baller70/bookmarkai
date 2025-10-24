
/**
 * Database Service using Prisma
 * Replaces all Supabase database operations
 */

import { prisma } from '@/lib/prisma'
import { appLogger } from '@/lib/logger'

export class DatabaseService {
  // User operations
  static async getUser(id: string) {
    try {
      return await prisma.user.findUnique({
        where: { id },
        include: {
          userSettings: true,
          aiSettings: true,
        }
      })
    } catch (error) {
      appLogger.error('[db-service] Error getting user' + ' - ' + String(error))
      throw error
    }
  }

  static async getUserByEmail(email: string) {
    try {
      return await prisma.user.findUnique({
        where: { email },
        include: {
          userSettings: true,
          aiSettings: true,
        }
      })
    } catch (error) {
      appLogger.error('[db-service] Error getting user by email' + ' - ' + String(error))
      throw error
    }
  }

  static async createUser(data: {
    email: string
    name?: string
    password?: string
    image?: string
  }) {
    try {
      return await prisma.user.create({
        data: {
          ...data,
          userSettings: {
            create: {}
          },
          aiSettings: {
            create: {}
          }
        },
        include: {
          userSettings: true,
          aiSettings: true,
        }
      })
    } catch (error) {
      appLogger.error('[db-service] Error creating user' + ' - ' + String(error))
      throw error
    }
  }

  static async updateUser(id: string, data: Partial<{
    name: string
    email: string
    image: string
    avatar: string
    password: string
  }>) {
    try {
      return await prisma.user.update({
        where: { id },
        data,
      })
    } catch (error) {
      appLogger.error('[db-service] Error updating user' + ' - ' + String(error))
      throw error
    }
  }

  static async deleteUser(id: string) {
    try {
      return await prisma.user.delete({
        where: { id }
      })
    } catch (error) {
      appLogger.error('[db-service] Error deleting user' + ' - ' + String(error))
      throw error
    }
  }

  // Bookmark operations
  static async getBookmarks(userId: string, options?: {
    category?: string
    search?: string
    limit?: number
    offset?: number
  }) {
    try {
      const where: any = { userId }
      
      if (options?.category && options.category !== 'all') {
        where.category = options.category
      }
      
      if (options?.search) {
        where.OR = [
          { title: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
          { url: { contains: options.search, mode: 'insensitive' } },
        ]
      }

      return await prisma.bookmark.findMany({
        where,
        include: {
          folder: true,
        },
        take: options?.limit || 50,
        skip: options?.offset || 0,
        orderBy: {
          createdAt: 'desc'
        }
      })
    } catch (error) {
      appLogger.error('[db-service] Error getting bookmarks' + ' - ' + String(error))
      throw error
    }
  }

  static async getBookmark(id: string, userId: string) {
    try {
      return await prisma.bookmark.findFirst({
        where: { id, userId },
        include: {
          folder: true,
        }
      })
    } catch (error) {
      appLogger.error('[db-service] Error getting bookmark' + ' - ' + String(error))
      throw error
    }
  }

  static async createBookmark(userId: string, data: {
    title: string
    url: string
    description?: string
    category?: string
    tags?: string[]
    folderId?: string
    favicon?: string
    aiSummary?: string
    aiTags?: string[]
    aiCategory?: string
  }) {
    try {
      return await prisma.bookmark.create({
        data: {
          userId,
          ...data,
        }
      })
    } catch (error) {
      appLogger.error('[db-service] Error creating bookmark' + ' - ' + String(error))
      throw error
    }
  }

  static async updateBookmark(id: string, userId: string, data: Partial<{
    title: string
    url: string
    description: string
    category: string
    tags: string[]
    notes: string
    priority: number
    customBackground: string
    favicon: string
    customFavicon: string
    customLogo: string
    folderId: string
    aiSummary: string
    aiTags: string[]
    aiCategory: string
  }>) {
    try {
      return await prisma.bookmark.updateMany({
        where: { id, userId },
        data,
      })
    } catch (error) {
      appLogger.error('[db-service] Error updating bookmark' + ' - ' + String(error))
      throw error
    }
  }

  static async deleteBookmark(id: string, userId: string) {
    try {
      return await prisma.bookmark.deleteMany({
        where: { id, userId }
      })
    } catch (error) {
      appLogger.error('[db-service] Error deleting bookmark' + ' - ' + String(error))
      throw error
    }
  }

  static async bulkCreateBookmarks(userId: string, bookmarks: Array<{
    title: string
    url: string
    description?: string
    category?: string
    tags?: string[]
    folderId?: string
  }>) {
    try {
      return await prisma.bookmark.createMany({
        data: bookmarks.map(b => ({
          userId,
          ...b,
        })),
        skipDuplicates: true,
      })
    } catch (error) {
      appLogger.error('[db-service] Error bulk creating bookmarks' + ' - ' + String(error))
      throw error
    }
  }

  // Folder operations
  static async getFolders(userId: string) {
    try {
      return await prisma.folder.findMany({
        where: { userId },
        include: {
          children: true,
          bookmarks: {
            select: {
              id: true,
            }
          }
        },
        orderBy: {
          position: 'asc'
        }
      })
    } catch (error) {
      appLogger.error('[db-service] Error getting folders' + ' - ' + String(error))
      throw error
    }
  }

  static async getFolder(id: string, userId: string) {
    try {
      return await prisma.folder.findFirst({
        where: { id, userId },
        include: {
          children: true,
          bookmarks: true,
        }
      })
    } catch (error) {
      appLogger.error('[db-service] Error getting folder' + ' - ' + String(error))
      throw error
    }
  }

  static async createFolder(userId: string, data: {
    name: string
    description?: string
    color?: string
    icon?: string
    parentId?: string
    position?: number
  }) {
    try {
      return await prisma.folder.create({
        data: {
          userId,
          ...data,
        }
      })
    } catch (error) {
      appLogger.error('[db-service] Error creating folder' + ' - ' + String(error))
      throw error
    }
  }

  static async updateFolder(id: string, userId: string, data: Partial<{
    name: string
    description: string
    color: string
    icon: string
    parentId: string
    position: number
  }>) {
    try {
      return await prisma.folder.updateMany({
        where: { id, userId },
        data,
      })
    } catch (error) {
      appLogger.error('[db-service] Error updating folder' + ' - ' + String(error))
      throw error
    }
  }

  static async deleteFolder(id: string, userId: string) {
    try {
      return await prisma.folder.deleteMany({
        where: { id, userId }
      })
    } catch (error) {
      appLogger.error('[db-service] Error deleting folder' + ' - ' + String(error))
      throw error
    }
  }

  // Settings operations
  static async getUserSettings(userId: string) {
    try {
      let settings = await prisma.userSettings.findUnique({
        where: { userId }
      })
      
      if (!settings) {
        settings = await prisma.userSettings.create({
          data: { userId }
        })
      }
      
      return settings
    } catch (error) {
      appLogger.error('[db-service] Error getting user settings' + ' - ' + String(error))
      throw error
    }
  }

  static async updateUserSettings(userId: string, data: Partial<{
    theme: 'light' | 'dark' | 'system'
    accentColor: string
    customColor: string
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
  }>) {
    try {
      return await prisma.userSettings.upsert({
        where: { userId },
        update: data,
        create: {
          userId,
          ...data,
        }
      })
    } catch (error) {
      appLogger.error('[db-service] Error updating user settings' + ' - ' + String(error))
      throw error
    }
  }

  static async getAiSettings(userId: string) {
    try {
      let settings = await prisma.aiSettings.findUnique({
        where: { userId }
      })
      
      if (!settings) {
        settings = await prisma.aiSettings.create({
          data: { userId }
        })
      }
      
      return settings
    } catch (error) {
      appLogger.error('[db-service] Error getting AI settings' + ' - ' + String(error))
      throw error
    }
  }

  static async updateAiSettings(userId: string, data: Partial<{
    settings: any
    autoProcessing: boolean
    smartTags: boolean
    autoCategory: boolean
    summaryLength: string
  }>) {
    try {
      return await prisma.aiSettings.upsert({
        where: { userId },
        update: data,
        create: {
          userId,
          ...data,
        }
      })
    } catch (error) {
      appLogger.error('[db-service] Error updating AI settings' + ' - ' + String(error))
      throw error
    }
  }

  // Notifications
  static async getNotifications(userId: string, options?: {
    unreadOnly?: boolean
    limit?: number
  }) {
    try {
      return await prisma.userNotification.findMany({
        where: {
          userId,
          ...(options?.unreadOnly ? { isRead: false } : {})
        },
        take: options?.limit || 50,
        orderBy: {
          createdAt: 'desc'
        }
      })
    } catch (error) {
      appLogger.error('[db-service] Error getting notifications' + ' - ' + String(error))
      throw error
    }
  }

  static async createNotification(userId: string, data: {
    type: 'reminder' | 'achievement' | 'system' | 'bookmark_suggestion' | 'folder_suggestion'
    title: string
    message?: string
    data?: any
  }) {
    try {
      return await prisma.userNotification.create({
        data: {
          userId,
          ...data,
        }
      })
    } catch (error) {
      appLogger.error('[db-service] Error creating notification' + ' - ' + String(error))
      throw error
    }
  }

  static async markNotificationRead(id: string, userId: string) {
    try {
      return await prisma.userNotification.updateMany({
        where: { id, userId },
        data: { isRead: true }
      })
    } catch (error) {
      appLogger.error('[db-service] Error marking notification read' + ' - ' + String(error))
      throw error
    }
  }

  static async markAllNotificationsRead(userId: string) {
    try {
      return await prisma.userNotification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      })
    } catch (error) {
      appLogger.error('[db-service] Error marking all notifications read' + ' - ' + String(error))
      throw error
    }
  }

  // Tasks
  static async getTasks(userId: string, options?: {
    status?: string
    limit?: number
  }) {
    try {
      return await prisma.task.findMany({
        where: {
          userId,
          ...(options?.status ? { status: options.status as any } : {})
        },
        take: options?.limit || 100,
        orderBy: {
          createdAt: 'desc'
        }
      })
    } catch (error) {
      appLogger.error('[db-service] Error getting tasks' + ' - ' + String(error))
      throw error
    }
  }

  static async createTask(userId: string, data: {
    title: string
    description?: string
    categoryId?: string
    priorityLevel?: number
    status?: string
    deadline?: Date
    estimatedDuration?: number
    isRecurring?: boolean
    recurringPattern?: string
    tags?: string[]
  }) {
    try {
      // Ensure userId is not in data to avoid conflicts
      const { userId: _unusedUserId, ...cleanData } = data as any
      return await prisma.task.create({
        data: {
          userId,
          ...cleanData,
        }
      })
    } catch (error) {
      appLogger.error('[db-service] Error creating task' + ' - ' + String(error))
      throw error
    }
  }

  static async updateTask(id: string, userId: string, data: any) {
    try {
      return await prisma.task.updateMany({
        where: { id, userId },
        data,
      })
    } catch (error) {
      appLogger.error('[db-service] Error updating task' + ' - ' + String(error))
      throw error
    }
  }

  static async deleteTask(id: string, userId: string) {
    try {
      return await prisma.task.deleteMany({
        where: { id, userId }
      })
    } catch (error) {
      appLogger.error('[db-service] Error deleting task' + ' - ' + String(error))
      throw error
    }
  }

  // Pomodoro Sessions
  static async createPomodoroSession(userId: string, data: {
    taskId?: string
    taskTitle?: string
    duration: number
    type: string
  }) {
    try {
      return await prisma.pomodoroSession.create({
        data: {
          userId,
          ...data,
        }
      })
    } catch (error) {
      appLogger.error('[db-service] Error creating pomodoro session' + ' - ' + String(error))
      throw error
    }
  }

  static async getPomodoroSessions(userId: string, options?: {
    limit?: number
    startDate?: Date
    endDate?: Date
  }) {
    try {
      return await prisma.pomodoroSession.findMany({
        where: {
          userId,
          ...(options?.startDate || options?.endDate ? {
            startTime: {
              ...(options.startDate ? { gte: options.startDate } : {}),
              ...(options.endDate ? { lte: options.endDate } : {}),
            }
          } : {})
        },
        take: options?.limit || 100,
        orderBy: {
          startTime: 'desc'
        }
      })
    } catch (error) {
      appLogger.error('[db-service] Error getting pomodoro sessions' + ' - ' + String(error))
      throw error
    }
  }

  // Marketplace
  static async getListings(options?: {
    category?: string
    search?: string
    sellerId?: string
    limit?: number
    offset?: number
  }) {
    try {
      const where: any = { isActive: true }
      
      if (options?.category) {
        where.category = options.category
      }
      
      if (options?.sellerId) {
        where.sellerId = options.sellerId
      }
      
      if (options?.search) {
        where.OR = [
          { title: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
        ]
      }

      return await prisma.listing.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          },
          reviews: {
            select: {
              rating: true,
            }
          }
        },
        take: options?.limit || 20,
        skip: options?.offset || 0,
        orderBy: {
          createdAt: 'desc'
        }
      })
    } catch (error) {
      appLogger.error('[db-service] Error getting listings')
      throw error
    }
  }

  static async getListing(id: string) {
    try {
      return await prisma.listing.findUnique({
        where: { id },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          },
          reviews: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      })
    } catch (error) {
      appLogger.error('[db-service] Error getting listing' + ' - ' + String(error))
      throw error
    }
  }

  static async createListing(sellerId: string, data: {
    title: string
    description: string
    thumbnail: string
    priceCents: number
    currency?: string
    category: string
    tags: string[]
    bookmarkData: any
  }) {
    try {
      return await prisma.listing.create({
        data: {
          sellerId,
          ...data,
        }
      })
    } catch (error) {
      appLogger.error('[db-service] Error creating listing' + ' - ' + String(error))
      throw error
    }
  }

  static async updateListing(id: string, sellerId: string, data: any) {
    try {
      return await prisma.listing.updateMany({
        where: { id, sellerId },
        data,
      })
    } catch (error) {
      appLogger.error('[db-service] Error updating listing' + ' - ' + String(error))
      throw error
    }
  }

  static async deleteListing(id: string, sellerId: string) {
    try {
      return await prisma.listing.deleteMany({
        where: { id, sellerId }
      })
    } catch (error) {
      appLogger.error('[db-service] Error deleting listing' + ' - ' + String(error))
      throw error
    }
  }

  // Orders
  static async createOrder(data: {
    buyerId: string
    listingId: string
    totalCents: number
    currency?: string
    status: string
    paymentIntentId?: string
  }) {
    try {
      return await prisma.order.create({
        data,
      })
    } catch (error) {
      appLogger.error('[db-service] Error creating order')
      throw error
    }
  }

  static async getOrders(userId: string, options?: {
    status?: string
    limit?: number
  }) {
    try {
      return await prisma.order.findMany({
        where: {
          buyerId: userId,
          ...(options?.status ? { status: options.status } : {})
        },
        include: {
          listing: {
            include: {
              seller: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                }
              }
            }
          }
        },
        take: options?.limit || 50,
        orderBy: {
          createdAt: 'desc'
        }
      })
    } catch (error) {
      appLogger.error('[db-service] Error getting orders' + ' - ' + String(error))
      throw error
    }
  }

  static async updateOrder(id: string, data: Partial<{
    status: string
    paymentIntentId: string
  }>) {
    try {
      return await prisma.order.update({
        where: { id },
        data,
      })
    } catch (error) {
      appLogger.error('[db-service] Error updating order' + ' - ' + String(error))
      throw error
    }
  }

  // Reviews
  static async createReview(data: {
    userId: string
    listingId: string
    rating: number
    comment?: string
  }) {
    try {
      const review = await prisma.review.create({
        data,
      })

      // Update listing rating
      const reviews = await prisma.review.findMany({
        where: { listingId: data.listingId },
        select: { rating: true }
      })

      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

      await prisma.listing.update({
        where: { id: data.listingId },
        data: {
          ratingAvg: avgRating,
          ratingCount: reviews.length
        }
      })

      return review
    } catch (error) {
      appLogger.error('[db-service] Error creating review')
      throw error
    }
  }
}

export default DatabaseService
