// @ts-nocheck
'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Bell, 
  Clock, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Calendar,
  Plus,
  Trash2,
  Edit,
  Play,
  Pause
} from 'lucide-react'
import { NotificationSettings, NotificationType, NotificationFrequency, DeliveryMethod } from '../types'
import { useNotifications } from '../hooks/useNotifications'
import { NotificationCalendar } from './NotificationCalendar'

interface NotificationSchedulerProps {
  bookmarkId: string
  bookmarkTitle: string
}

export const NotificationScheduler: React.FC<NotificationSchedulerProps> = ({ 
  bookmarkId, 
  bookmarkTitle 
}) => {
  const { 
    notifications, 
    loading, 
    createNotification, 
    updateNotification, 
    deleteNotification, 
    toggleNotification 
  } = useNotifications(bookmarkId)

  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'reminder' as NotificationType,
    frequency: 'once' as NotificationFrequency,
    deliveryMethods: ['in-app'] as DeliveryMethod[],
    scheduledTime: '',
    duration: 30, // Default 30 minutes for tasks
    recurringInterval: 1,
    recurringUnit: 'days' as 'minutes' | 'hours' | 'days' | 'weeks' | 'months',
    teamMembers: [] as string[]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const notificationData: Omit<NotificationSettings, 'id' | 'createdAt' | 'updatedAt'> = {
        bookmarkId,
        userId: 'test-user-123',
        title: formData.title,
        message: formData.message,
        type: formData.type,
        frequency: formData.frequency,
        deliveryMethods: formData.deliveryMethods,
        scheduledTime: formData.scheduledTime ? new Date(formData.scheduledTime) : undefined,
        duration: formData.type === 'task' ? formData.duration : undefined,
        recurringPattern: formData.frequency !== 'once' ? {
          interval: formData.recurringInterval,
          unit: formData.recurringUnit
        } : undefined,
        isActive: true,
        teamMembers: formData.teamMembers
      }

      if (editingId) {
        await updateNotification(editingId, notificationData)
        setEditingId(null)
        toast.success(`${formData.type === 'task' ? 'Task' : 'Reminder'} updated successfully!`)
      } else {
        await createNotification(notificationData)
        const typeLabel = formData.type === 'task' ? 'Task' : 'Reminder'
        const durationInfo = formData.type === 'task' && formData.duration ? ` (${formData.duration}min)` : ''
        toast.success(`${typeLabel} created successfully!${durationInfo} Delivery: ${formData.deliveryMethods.join(', ')}`)
      }
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        type: 'reminder',
        frequency: 'once',
        deliveryMethods: ['in-app'],
        scheduledTime: '',
        duration: 30,
        recurringInterval: 1,
        recurringUnit: 'days',
        teamMembers: []
      })
      setIsCreating(false)
    } catch (error) {
      console.error('Failed to save notification:', error)
      toast.error('Failed to create reminder. Please try again.')
    }
  }

  const handleEdit = (notification: NotificationSettings) => {
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      frequency: notification.frequency,
      deliveryMethods: notification.deliveryMethods,
      scheduledTime: notification.scheduledTime?.toISOString().slice(0, 16) || '',
      recurringInterval: notification.recurringPattern?.interval || 1,
      recurringUnit: notification.recurringPattern?.unit || 'days',
      teamMembers: notification.teamMembers || []
    })
    setEditingId(notification.id)
    setIsCreating(true)
  }

  const toggleDeliveryMethod = (method: DeliveryMethod) => {
    setFormData(prev => ({
      ...prev,
      deliveryMethods: prev.deliveryMethods.includes(method)
        ? prev.deliveryMethods.filter(m => m !== method)
        : [...prev.deliveryMethods, method]
    }))
  }

  const getDeliveryMethodIcon = (method: DeliveryMethod) => {
    switch (method) {
      case 'in-app': return <Bell className="h-4 w-4" />
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <MessageSquare className="h-4 w-4" />
      case 'push': return <Smartphone className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case 'reminder': return 'bg-blue-100 text-blue-800'
      case 'task': return 'bg-emerald-100 text-emerald-800'
      case 'content_change': return 'bg-green-100 text-green-800'
      case 'deadline': return 'bg-red-100 text-red-800'
      case 'milestone': return 'bg-purple-100 text-purple-800'
      case 'team_update': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleCreateReminderFromCalendar = (date: Date) => {
    // Set the scheduled time to the selected date at current time
    const scheduledDateTime = new Date(date)
    scheduledDateTime.setHours(new Date().getHours())
    scheduledDateTime.setMinutes(new Date().getMinutes())
    
    setFormData(prev => ({
      ...prev,
      scheduledTime: scheduledDateTime.toISOString().slice(0, 16)
    }))
    setSelectedDate(date)
    setIsCreating(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">NOTIFICATIONS & REMINDERS</h3>
          <p className="text-sm text-gray-600">Schedule reminders for "{bookmarkTitle}"</p>
        </div>
        <Button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          NEW REMINDER
        </Button>
      </div>

      {/* Calendar View */}
      <NotificationCalendar
        notifications={notifications}
        onDateSelect={handleDateSelect}
        onCreateReminder={handleCreateReminderFromCalendar}
        selectedDate={selectedDate}
      />

      {/* Create/Edit Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {editingId ? 'EDIT REMINDER' : 'CREATE NEW REMINDER'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">REMINDER TITLE</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Review weekly goals"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">TYPE</Label>
                  <Select value={formData.type} onValueChange={(value: NotificationType) => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="content_change">Content Change</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="team_update">Team Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="message">MESSAGE</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter your reminder message..."
                  rows={3}
                  required
                />
              </div>

              {/* Task Duration - only show for task type */}
              {formData.type === 'task' && (
                <div>
                  <Label htmlFor="duration">TASK DURATION</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="duration"
                      type="number"
                      min="5"
                      max="480"
                      step="5"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                      placeholder="30"
                      className="w-24"
                    />
                    <span className="text-sm text-gray-600">minutes</span>
                    <div className="flex gap-1 ml-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, duration: 15 }))}
                      >
                        15m
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, duration: 30 }))}
                      >
                        30m
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, duration: 60 }))}
                      >
                        1h
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, duration: 120 }))}
                      >
                        2h
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">How long will this task take to complete?</p>
                </div>
              )}

              {/* Frequency Settings */}
              <div>
                <Label>FREQUENCY</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                  {(['once', 'daily', 'weekly', 'monthly', 'custom'] as NotificationFrequency[]).map(freq => (
                    <Button
                      key={freq}
                      type="button"
                      variant={formData.frequency === freq ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, frequency: freq }))}
                      className="capitalize"
                    >
                      {freq}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Frequency */}
              {formData.frequency === 'custom' && (
                <div className="flex items-center gap-2">
                  <Label>Every</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.recurringInterval}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      recurringInterval: parseInt(e.target.value) || 1 
                    }))}
                    className="w-20"
                  />
                  <Select value={formData.recurringUnit} onValueChange={(value: any) => 
                    setFormData(prev => ({ ...prev, recurringUnit: value }))
                  }>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Scheduled Time */}
              <div>
                <Label htmlFor="scheduledTime">SCHEDULED TIME</Label>
                <Input
                  id="scheduledTime"
                  type="datetime-local"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  required
                />
              </div>

              {/* Delivery Methods */}
              <div>
                <Label>DELIVERY METHODS</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(['in-app', 'email', 'sms', 'push'] as DeliveryMethod[]).map(method => (
                    <Button
                      key={method}
                      type="button"
                      variant={formData.deliveryMethods.includes(method) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleDeliveryMethod(method)}
                      className="flex items-center gap-2 capitalize"
                      disabled={method === 'sms'} // TODO: Enable for premium users
                    >
                      {getDeliveryMethodIcon(method)}
                      {method === 'in-app' ? 'In-App' : method.toUpperCase()}
                      {method === 'sms' && <Badge variant="secondary" className="ml-1">Premium</Badge>}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {editingId ? 'UPDATE REMINDER' : 'CREATE REMINDER'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreating(false)
                    setEditingId(null)
                  }}
                >
                  CANCEL
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}      {/* Existing Notifications */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">ACTIVE REMINDERS</h4>
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No reminders set for this bookmark</p>
              <p className="text-sm text-gray-500 mt-1">Create your first reminder to get started</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map(notification => (
            <Card key={notification.id} className="relative">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="font-medium">{notification.title}</h5>
                      <Badge className={getTypeColor(notification.type)}>
                        {notification.type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge variant={notification.isActive ? 'default' : 'secondary'}>
                        {notification.isActive ? 'ACTIVE' : 'PAUSED'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{notification.message}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {notification.frequency.toUpperCase()}
                      </div>
                      {notification.scheduledTime && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(notification.scheduledTime).toLocaleDateString()} {new Date(notification.scheduledTime).toLocaleTimeString()}
                        </div>
                      )}
                      {notification.type === 'task' && notification.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className="font-medium text-emerald-600">
                            {notification.duration < 60 
                              ? `${notification.duration}m` 
                              : `${Math.floor(notification.duration / 60)}h ${notification.duration % 60 > 0 ? `${notification.duration % 60}m` : ''}`
                            }
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        {notification.deliveryMethods.map(method => (
                          <div key={method} className="flex items-center gap-1">
                            {getDeliveryMethodIcon(method)}
                            <span className="capitalize">{method}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleNotification(notification.id)}
                    >
                      {notification.isActive ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(notification)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNotification(notification.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}