'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/lib/supabase/queries/notifications'
import type { Notification } from '@/lib/supabase/queries/notifications'
import { useUserProfileStore } from '@/lib/store/userProfileStore'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { formatDistanceToNow } from 'date-fns'

const notificationIcons: Record<string, string> = {
  task_assigned: '📋',
  task_status_changed: '🔄',
  task_review_requested: '👀',
  task_mentioned: '💬',
  task_approved: '✅',
  task_rejected: '❌',
  task_changes_requested: '📝',
  invitation: '📧',
  team_added: '👥',
  member_joined: '🎉',
}

// Notification types that link to a task context
const taskRelatedTypes = [
  'task_assigned',
  'task_status_changed',
  'task_review_requested',
  'task_mentioned',
  'task_approved',
  'task_rejected',
  'task_changes_requested',
]

function getNotificationLink(notification: Notification): string | null {
  const metadata = notification.metadata as Record<string, any> | null
  if (!metadata) return null

  if (taskRelatedTypes.includes(notification.type)) {
    const base = '/kanban'
    return metadata.task_id ? `${base}?task=${metadata.task_id}` : base
  }

  return null
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const { profile } = useUserProfileStore()
  const t = useTranslation()
  const router = useRouter()

  const companyId = profile?.company_id

  const fetchData = useCallback(async () => {
    if (!profile?.id || !companyId) return
    try {
      const [notifs, count] = await Promise.all([
        getNotifications(profile.id, companyId, 10),
        getUnreadCount(profile.id, companyId),
      ])
      setNotifications(notifs)
      setUnreadCount(count)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }, [profile?.id, companyId])

  useEffect(() => {
    if (!profile?.id || !companyId) return

    fetchData()
    const intervalMs = open ? 15000 : 120000
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchData()
      }
    }, intervalMs)

    return () => clearInterval(interval)
  }, [fetchData, open, profile?.id, companyId])

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      try {
        await markAsRead(notification.id)
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    }

    // Navigate if there's a link
    const link = getNotificationLink(notification)
    if (link) {
      setOpen(false)
      router.push(link)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!profile?.id || !companyId) return
    try {
      await markAllAsRead(profile.id, companyId)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">{t('notifications.title')}</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs h-7"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              {t('notifications.markAllRead')}
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {t('notifications.noNotifications')}
            </div>
          ) : (
            notifications.map((notification) => {
              const link = getNotificationLink(notification)
              return (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer border-b last:border-0 transition-colors ${
                    !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <span className="text-base mt-0.5">
                    {notificationIcons[notification.type] || '📌'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.is_read ? 'font-medium' : ''}`}>
                      {notification.title}
                    </p>
                    {notification.message && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 mt-1">
                    {link && (
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
