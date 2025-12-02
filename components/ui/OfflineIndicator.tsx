'use client'

import { useEffect } from 'react'
import { useOfflineStore } from '@/lib/store/offlineStore'
import { WifiOff, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'

export function OfflineIndicator() {
  const { isOnline, queue } = useOfflineStore()

  if (isOnline && queue.length === 0) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 p-3 text-center text-sm font-medium',
          'bg-yellow-500 text-yellow-900 dark:bg-yellow-600 dark:text-yellow-100',
          !isOnline && 'bg-red-500 text-red-900 dark:bg-red-600 dark:text-red-100'
        )}
      >
        <div className="flex items-center justify-center gap-2">
          {!isOnline ? (
            <>
              <WifiOff className="w-4 h-4" />
              <span>You're offline. Changes will be synced when you're back online.</span>
            </>
          ) : queue.length > 0 ? (
            <>
              <Wifi className="w-4 h-4" />
              <span>Syncing {queue.length} pending change{queue.length > 1 ? 's' : ''}...</span>
            </>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

