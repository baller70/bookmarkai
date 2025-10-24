'use client'

import { useState, useEffect, useCallback } from 'react'
import { NotificationSettings, NotificationHistory, UserNotificationPreferences } from '../types'

export const useNotifications = (bookmarkId?: string) => {
  const [notifications, setNotifications] = useState<NotificationSettings[]>([])
  const [history, setHistory] = useState<NotificationHistory[]>([])
  const [preferences, setPreferences] = useState<UserNotificationPreferences | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load notifications for a specific bookmark or all user notifications
  const loadNotifications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (bookmarkId) params.set('bookmark_id', bookmarkId)
      params.set('type', 'notifications')
      const res = await fetch(`/api/notifications?${params.toString()}`, { cache: 'no-store' })
      const json = await res.json()
      if (json?.success) {
        setNotifications(json.data || [])
      } else {
        throw new Error(json?.error || 'Failed to load notifications')
      }
    } catch (err) {
      setError('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [bookmarkId])

  // Create a new notification
  const createNotification = useCallback(async (notification: Omit<NotificationSettings, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'notification', action: 'create', data: notification })
      })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || 'Create failed')
      await loadNotifications()
    } catch (err) {
      setError('Failed to create notification')
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadNotifications])

  // Update an existing notification
  const updateNotification = useCallback(async (id: string, updates: Partial<NotificationSettings>) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'notification', action: 'update', data: { id, ...updates } })
      })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || 'Update failed')
      await loadNotifications()
    } catch (err) {
      setError('Failed to update notification')
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadNotifications])

  // Delete a notification
  const deleteNotification = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || 'Delete failed')
      await loadNotifications()
    } catch (err) {
      setError('Failed to delete notification')
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadNotifications])

  // Toggle notification active status
  const toggleNotification = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'notification', action: 'toggle', data: { id } })
      })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || 'Toggle failed')
      await loadNotifications()
    } finally {
      setLoading(false)
    }
  }, [loadNotifications])

  // Load notification history
  const loadHistory = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: 'history' })
      if (bookmarkId) params.set('bookmark_id', bookmarkId)
      const res = await fetch(`/api/notifications?${params.toString()}`, { cache: 'no-store' })
      const json = await res.json()
      if (json?.success) setHistory(json.data || [])
    } catch (err) {
      setError('Failed to load notification history')
    } finally {
      setLoading(false)
    }
  }, [bookmarkId])

  // Load user preferences
  const loadPreferences = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?type=preferences', { cache: 'no-store' })
      const json = await res.json()
      if (json?.success) setPreferences(json.data as UserNotificationPreferences)
    } catch (err) {
      setError('Failed to load preferences')
    }
  }, [])

  useEffect(() => {
    loadNotifications()
    loadPreferences()
    loadHistory()
  }, [loadNotifications, loadPreferences, loadHistory])

  return {
    notifications,
    history,
    preferences,
    loading,
    error,
    createNotification,
    updateNotification,
    deleteNotification,
    toggleNotification,
    loadNotifications,
    loadHistory,
    loadPreferences
  }
}