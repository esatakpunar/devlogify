'use client'

import { useEffect, useState } from 'react'
import {
  requestNotificationPermission, 
  showNotification,
  getNotificationPermission,
  isNotificationSupported,
} from '@/lib/utils/notifications'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

interface NotificationPreferences {
  enabled: boolean
  taskReminders: boolean
  dailySummary: boolean
  weeklySummary: boolean
  quietHours: {
    enabled: boolean
    start: string // HH:mm format
    end: string // HH:mm format
  }
}

const PREFERENCES_KEY = 'devlogify-notification-preferences'

const defaultPreferences: NotificationPreferences = {
  enabled: false,
  taskReminders: true,
  dailySummary: true,
  weeklySummary: false,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
}

export function useNotifications(userId: string) {
  const [permission, setPermission] = useState(getNotificationPermission())
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    setSupported(isNotificationSupported())
    loadPreferences()
  }, [])

  const loadPreferences = () => {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY)
      if (saved) {
        setPreferences({ ...defaultPreferences, ...JSON.parse(saved) })
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error)
    }
  }

  const savePreferences = (newPreferences: NotificationPreferences) => {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(newPreferences))
      setPreferences(newPreferences)
    } catch (error) {
      console.error('Failed to save notification preferences:', error)
    }
  }

  const requestPermission = async () => {
    const result = await requestNotificationPermission()
    setPermission(result)
    return result
  }

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (!preferences.enabled || !permission.granted) {
      return
    }

    // Check quiet hours
    if (preferences.quietHours.enabled) {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      const { start, end } = preferences.quietHours

      // Handle overnight quiet hours (e.g., 22:00 - 08:00)
      if (start > end) {
        if (currentTime >= start || currentTime < end) {
          return // In quiet hours
        }
      } else {
        if (currentTime >= start && currentTime < end) {
          return // In quiet hours
        }
      }
    }

    showNotification(title, options)
  }

  const checkReminders = async () => {
    if (!preferences.enabled || !permission.granted || !preferences.taskReminders) {
      return
    }

    try {
      const supabase = createClient()
      
      // Check for tasks in progress for more than 2 hours
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id, title, status, updated_at')
        .eq('user_id', userId)
        .eq('status', 'in_progress')
        .lte('updated_at', twoHoursAgo.toISOString())
        .limit(5)
      const tasks = (tasksData || []) as Pick<
        Database['public']['Tables']['tasks']['Row'],
        'id' | 'title' | 'status' | 'updated_at'
      >[]

      if (tasks && tasks.length > 0) {
        sendNotification(
          `${tasks.length} task${tasks.length > 1 ? 's' : ''} in progress for 2+ hours`,
          {
            body: tasks.map(t => t.title).join(', '),
            tag: 'task-reminder',
          }
        )
      }
    } catch (error) {
      console.error('Failed to check reminders:', error)
    }
  }

  useEffect(() => {
    if (!preferences.enabled || !permission.granted) return

    // Check reminders every 30 minutes
    const interval = setInterval(checkReminders, 30 * 60 * 1000)
    
    // Initial check after 1 minute
    const timeout = setTimeout(checkReminders, 60 * 1000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [preferences.enabled, permission.granted, userId])

  return {
    permission,
    preferences,
    supported,
    requestPermission,
    updatePreferences: savePreferences,
    sendNotification,
  }
}
