
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  ArrowLeftIcon, 
  BellIcon,
  CheckIcon,
  TrashIcon,
  BookmarkIcon,
  StarIcon,
  InfoIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: string
  type: 'reminder' | 'achievement' | 'system' | 'bookmark_suggestion'
  title: string
  message?: string
  isRead: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'system',
      title: 'Welcome to BookmarkAI!',
      message: 'Your account has been set up successfully. Start by creating your first bookmark.',
      isRead: false,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      type: 'bookmark_suggestion',
      title: 'AI Bookmark Suggestion',
      message: 'We found some similar bookmarks that might interest you based on your reading patterns.',
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
    },
    {
      id: '3',
      type: 'achievement',
      title: 'Achievement Unlocked!',
      message: 'You\'ve saved your first 10 bookmarks. Keep building your collection!',
      isRead: false,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    }
  ])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return <StarIcon className="h-5 w-5 text-yellow-600" />
      case 'bookmark_suggestion':
        return <BookmarkIcon className="h-5 w-5 text-blue-600" />
      case 'system':
        return <InfoIcon className="h-5 w-5 text-green-600" />
      default:
        return <BellIcon className="h-5 w-5 text-slate-600" />
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    )
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center">
                <BellIcon className="h-8 w-8 mr-3" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Stay updated with your bookmark activity
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              <CheckIcon className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BellIcon className="h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">
                  No notifications yet
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-center">
                  You're all caught up! New notifications will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className={`transition-all duration-200 hover:shadow-md ${
                  !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex space-x-3 flex-1">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className={`text-sm font-semibold ${
                              !notification.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                            }`}>
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                          {notification.message && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                              {notification.message}
                            </p>
                          )}
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-8 w-8 p-0"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
