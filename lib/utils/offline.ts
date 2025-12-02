/**
 * Offline utilities for PWA support
 */

export interface OfflineQueueItem {
  id: string
  type: 'create' | 'update' | 'delete'
  entity: 'project' | 'task' | 'note' | 'time_entry'
  data: any
  timestamp: number
}

const QUEUE_KEY = 'devlogify-offline-queue'

/**
 * Add item to offline queue
 */
export function addToOfflineQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp'>): string {
  const queue = getOfflineQueue()
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const queueItem: OfflineQueueItem = {
    ...item,
    id,
    timestamp: Date.now(),
  }
  
  queue.push(queueItem)
  saveOfflineQueue(queue)
  return id
}

/**
 * Get offline queue
 */
export function getOfflineQueue(): OfflineQueueItem[] {
  try {
    const queue = localStorage.getItem(QUEUE_KEY)
    return queue ? JSON.parse(queue) : []
  } catch (error) {
    console.error('Failed to get offline queue:', error)
    return []
  }
}

/**
 * Save offline queue
 */
function saveOfflineQueue(queue: OfflineQueueItem[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch (error) {
    console.error('Failed to save offline queue:', error)
  }
}

/**
 * Remove item from offline queue
 */
export function removeFromOfflineQueue(id: string): void {
  const queue = getOfflineQueue()
  const filtered = queue.filter(item => item.id !== id)
  saveOfflineQueue(filtered)
}

/**
 * Clear offline queue
 */
export function clearOfflineQueue(): void {
  saveOfflineQueue([])
}

/**
 * Check if online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine
}

/**
 * Get online status
 */
export function getOnlineStatus(): 'online' | 'offline' | 'unknown' {
  if (typeof navigator === 'undefined') return 'unknown'
  return navigator.onLine ? 'online' : 'offline'
}

