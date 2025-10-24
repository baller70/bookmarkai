'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Bell
} from 'lucide-react'
import { NotificationSettings, NotificationType } from '../types'

interface NotificationCalendarProps {
  notifications: NotificationSettings[]
  onDateSelect: (date: Date) => void
  onCreateReminder: (date: Date) => void
  selectedDate?: Date
}

export const NotificationCalendar: React.FC<NotificationCalendarProps> = ({
  notifications,
  onDateSelect,
  onCreateReminder,
  selectedDate
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 41) // 6 weeks
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      days.push(new Date(date))
    }
    
    return days
  }, [currentMonth])

  // Get notifications for a specific date
  const getNotificationsForDate = (date: Date) => {
    return notifications.filter(notification => {
      if (!notification.scheduledTime) return false
      
      const notificationDate = new Date(notification.scheduledTime)
      return (
        notificationDate.getDate() === date.getDate() &&
        notificationDate.getMonth() === date.getMonth() &&
        notificationDate.getFullYear() === date.getFullYear()
      )
    })
  }

  // Get type color for calendar dots
  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case 'reminder': return 'bg-blue-500'
      case 'task': return 'bg-emerald-500'
      case 'content_change': return 'bg-green-500'
      case 'deadline': return 'bg-red-500'
      case 'milestone': return 'bg-purple-500'
      case 'team_update': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth()
  }

  const isSelected = (date: Date) => {
    if (!selectedDate) return false
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            REMINDER CALENDAR
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[120px] text-center">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="space-y-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              const dayNotifications = getNotificationsForDate(date)
              const hasNotifications = dayNotifications.length > 0
              
              return (
                <div
                  key={index}
                  className={`
                    relative min-h-[80px] p-2 border rounded-lg cursor-pointer transition-colors
                    ${isCurrentMonth(date) ? 'bg-white' : 'bg-gray-50'}
                    ${isToday(date) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                    ${isSelected(date) ? 'ring-2 ring-blue-500' : ''}
                    hover:bg-gray-50
                  `}
                  onClick={() => onDateSelect(date)}
                >
                  {/* Date Number */}
                  <div className="flex items-center justify-between mb-1">
                    <span className={`
                      text-sm font-medium
                      ${isCurrentMonth(date) ? 'text-gray-900' : 'text-gray-400'}
                      ${isToday(date) ? 'text-blue-600' : ''}
                    `}>
                      {date.getDate()}
                    </span>
                    
                    {/* Add Reminder Button */}
                    {isCurrentMonth(date) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0 opacity-0 hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          onCreateReminder(date)
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {/* Notification Indicators */}
                  {hasNotifications && (
                    <div className="space-y-1">
                      {dayNotifications.slice(0, 3).map((notification, idx) => (
                        <div
                          key={notification.id}
                          className="flex items-center gap-1 text-xs"
                        >
                          <div className={`w-2 h-2 rounded-full ${getTypeColor(notification.type)}`} />
                          <span className="truncate text-gray-700">
                            {notification.title}
                          </span>
                        </div>
                      ))}
                      
                      {/* Show count if more than 3 notifications */}
                      {dayNotifications.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{dayNotifications.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Reminder</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Task</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Deadline</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span>Milestone</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>Team Update</span>
            </div>
          </div>
        </div>

        {/* Selected Date Info */}
        {selectedDate && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h4>
              <Button
                size="sm"
                onClick={() => onCreateReminder(selectedDate)}
                className="flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Reminder
              </Button>
            </div>
            
            {/* Notifications for selected date */}
            {(() => {
              const dayNotifications = getNotificationsForDate(selectedDate)
              if (dayNotifications.length === 0) {
                return (
                  <p className="text-sm text-gray-500">No reminders scheduled for this date</p>
                )
              }
              
              return (
                <div className="space-y-2">
                  {dayNotifications.map(notification => (
                    <div key={notification.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <div className={`w-3 h-3 rounded-full ${getTypeColor(notification.type)}`} />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{notification.title}</div>
                        {notification.scheduledTime && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(notification.scheduledTime).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {notification.type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

