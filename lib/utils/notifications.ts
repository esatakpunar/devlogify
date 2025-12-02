/**
 * Notification utilities for browser and in-app notifications
 */

export interface NotificationPermission {
  granted: boolean
  denied: boolean
  default: boolean
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { granted: false, denied: false, default: true }
  }

  if (Notification.permission === 'granted') {
    return { granted: true, denied: false, default: false }
  }

  if (Notification.permission === 'denied') {
    return { granted: false, denied: true, default: false }
  }

  const permission = await Notification.requestPermission()
  return {
    granted: permission === 'granted',
    denied: permission === 'denied',
    default: permission === 'default',
  }
}

/**
 * Show browser notification
 */
export function showNotification(title: string, options?: NotificationOptions): void {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return
  }

  if (Notification.permission !== 'granted') {
    return
  }

  new Notification(title, {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    ...options,
  })
}

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

/**
 * Get notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { granted: false, denied: false, default: true }
  }

  return {
    granted: Notification.permission === 'granted',
    denied: Notification.permission === 'denied',
    default: Notification.permission === 'default',
  }
}

