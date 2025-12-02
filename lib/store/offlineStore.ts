'use client'

import { create } from 'zustand'
import { getOnlineStatus, type OfflineQueueItem, getOfflineQueue } from '@/lib/utils/offline'

interface OfflineState {
  isOnline: boolean
  queue: OfflineQueueItem[]
  setIsOnline: (isOnline: boolean) => void
  updateQueue: () => void
  syncQueue: () => Promise<void>
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  queue: [],
  setIsOnline: (isOnline) => {
    set({ isOnline })
    if (isOnline) {
      // Try to sync when coming back online
      get().syncQueue()
    }
  },
  updateQueue: () => {
    const queue = getOfflineQueue()
    set({ queue })
  },
  syncQueue: async () => {
    const queue = get().queue
    if (queue.length === 0) return

    // This would sync with Supabase
    // For now, just log - actual sync would need API calls
    console.log('Syncing queue:', queue)
    
    // After successful sync, clear queue
    // For now, we'll keep it simple
  },
}))

// Initialize online status
if (typeof window !== 'undefined') {
  const updateOnlineStatus = () => {
    useOfflineStore.getState().setIsOnline(navigator.onLine)
    useOfflineStore.getState().updateQueue()
  }

  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
  
  // Initial check
  updateOnlineStatus()
}

